import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { OpenAI } from 'openai';
import { type NextRequest } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AcceptableTranslation {
  fromToText: string | null;
  toFromText: string | null;
}

interface DiffResult {
  text: string;
  diffs: Array<{
    start: number;
    end: number;
    type: 'missing' | 'extra' | 'wrong';
  }>;
}

function findStringDifferences(str1: string, str2: string): DiffResult {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  const diffs: Array<{ start: number; end: number; type: 'missing' | 'extra' | 'wrong' }> = [];
  
  let i = 0;
  let j = 0;
  
  while (i < s1.length || j < s2.length) {
    if (i >= s1.length) {
      // Extra characters in str2
      diffs.push({ start: j, end: s2.length, type: 'extra' });
      break;
    }
    if (j >= s2.length) {
      // Missing characters from str2
      diffs.push({ start: i, end: s1.length, type: 'missing' });
      break;
    }
    
    if (s1[i] !== s2[j]) {
      // Find next matching character
      let nextMatch = -1;
      for (let k = 1; k < 3; k++) { // Look ahead up to 3 characters
        if (s1[i + k] === s2[j] || s1[i] === s2[j + k]) {
          nextMatch = k;
          break;
        }
      }
      
      if (nextMatch === -1) {
        // Characters are different
        diffs.push({ start: j, end: j + 1, type: 'wrong' });
        i++;
        j++;
      } else {
        // Missing or extra character
        if (s1[i + nextMatch] === s2[j]) {
          diffs.push({ start: j, end: j + nextMatch, type: 'missing' });
          i += nextMatch;
        } else {
          diffs.push({ start: j, end: j + nextMatch, type: 'extra' });
          j += nextMatch;
        }
      }
    } else {
      i++;
      j++;
    }
  }
  
  return { text: str2, diffs };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sentenceId, translation } = body;

    if (!sentenceId || !translation) {
      return NextResponse.json(
        { error: 'Sentence ID and translation are required' },
        { status: 400 }
      );
    }

    // Get the sentence with its concept and acceptable translations
    const sentence = await prisma.sentence.findUnique({
      where: { id: sentenceId },
      include: {
        acceptableTranslations: true,
        concept: true,
      },
    });

    if (!sentence) {
      return NextResponse.json(
        { error: 'Sentence not found' },
        { status: 404 }
      );
    }

    // Collect all acceptable translations
    const allAcceptableTranslations = [
      sentence.canonicalTo,
      ...sentence.acceptableTranslations
        .map((t: AcceptableTranslation) => t.fromToText)
        .filter((t: string | null): t is string => t !== null)
    ];

    // Check for exact matches first
    const isExactMatch = 
      translation.toLowerCase() === sentence.canonicalTo.toLowerCase() ||
      sentence.acceptableTranslations.some((t: AcceptableTranslation) => 
        (t.fromToText?.toLowerCase() === translation.toLowerCase()) ||
        (t.toFromText?.toLowerCase() === translation.toLowerCase())
      );

    if (isExactMatch) {
      return NextResponse.json({
        overallScore: 10,
        conceptScore: 10,
        explanation: "Perfect match! Your translation exactly matches one of the accepted translations.",
        acceptableTranslations: allAcceptableTranslations,
        diffs: null
      });
    }

    // If not an exact match, compute diffs for each acceptable translation
    const translationsWithDiffs = allAcceptableTranslations.map(acceptableTranslation => ({
      translation: acceptableTranslation,
      diffs: findStringDifferences(acceptableTranslation, translation)
    }));

    // Sort by number of differences to find the closest match
    translationsWithDiffs.sort((a, b) => a.diffs.diffs.length - b.diffs.diffs.length);
    const closestMatch = translationsWithDiffs[0]?.translation || null;

    // If not an exact match, use OpenAI to evaluate
    const prompt = `
      You are a language learning assistant evaluating a translation.
      
      Original sentence: "${sentence.canonicalFrom}"
      Canonical translation: "${sentence.canonicalTo}"
      User's translation: "${translation}"
      Grammatical concept being tested: "${sentence.concept.name}"
      Concept description: "${sentence.concept.description}"
      
      Please evaluate the translation and provide:
      1. Overall translation score (1-10)
      2. Score specifically for the grammatical concept being tested (1-10)
      3. List of specific topics or concepts that the user seems to be missing or misunderstanding
      
      Format your response as a JSON object with these exact keys:
      {
        "overallScore": number,
        "conceptScore": number,
        "missingTopics": ["string"],
        "explanation": "string"
      }
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini", // Using the smaller model
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const evaluation = JSON.parse(response);
    return NextResponse.json({
      ...evaluation,
      acceptableTranslations: allAcceptableTranslations,
      closestMatch,
      translationsWithDiffs: translationsWithDiffs
    });
  } catch (error) {
    console.error('Error checking translation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check translation',
        acceptableTranslations: [],
        overallScore: 0,
        conceptScore: 0,
        explanation: "There was an error checking your translation.",
        diffs: null
      },
      { status: 500 }
    );
  }
} 