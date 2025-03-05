import { NextResponse } from 'next/server';
import { evaluateTranslation } from '@/lib/openai';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sentenceId, translation, direction } = body;

    // Get the sentence and related data
    const sentence = await prisma.sentence.findUnique({
      where: { id: sentenceId },
      include: {
        grammaticalConcept: {
          include: {
            languagePair: {
              include: {
                firstLanguage: true,
                secondLanguage: true,
              }
            }
          }
        }
      }
    });

    if (!sentence) {
      return NextResponse.json(
        { error: 'Sentence not found' },
        { status: 404 }
      );
    }

    // Determine source and target based on translation direction
    const isFirstToSecond = direction === 'firstToSecond';
    const canonicalSource = isFirstToSecond ? sentence.canonicalFirst : sentence.canonicalSecond;
    const acceptableTranslations = isFirstToSecond 
      ? sentence.acceptableFirstToSecond 
      : sentence.acceptableSecondToFirst;
    const targetLanguage = isFirstToSecond 
      ? sentence.grammaticalConcept.languagePair.secondLanguage.name
      : sentence.grammaticalConcept.languagePair.firstLanguage.name;

    // Check if the translation matches any of the acceptable translations
    const isAcceptableTranslation = [
      isFirstToSecond ? sentence.canonicalSecond : sentence.canonicalFirst,
      ...acceptableTranslations
    ].includes(translation);

    if (isAcceptableTranslation) {
      return NextResponse.json({
        overallScore: 10,
        conceptScore: 10,
        feedback: "Perfect match with an acceptable translation!",
        isExactMatch: true
      });
    }

    // If not an exact match, evaluate using LLM
    const evaluation = await evaluateTranslation(
      canonicalSource,
      translation,
      targetLanguage,
      sentence.grammaticalConcept.name
    );

    return NextResponse.json({
      ...evaluation,
      isExactMatch: false
    });

  } catch (error) {
    console.error('Error evaluating translation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 