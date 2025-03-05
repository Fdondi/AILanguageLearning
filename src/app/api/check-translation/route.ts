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
        explanation: "Perfect match! Your translation exactly matches one of the accepted translations."
      });
    }

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
      3. Brief explanation of the scores
      
      Format your response as a JSON object with these exact keys:
      {
        "overallScore": number,
        "conceptScore": number,
        "explanation": "string"
      }
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const evaluation = JSON.parse(response);
    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Error checking translation:', error);
    return NextResponse.json(
      { error: 'Failed to check translation' },
      { status: 500 }
    );
  }
} 