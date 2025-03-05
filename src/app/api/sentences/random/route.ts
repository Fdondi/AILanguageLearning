import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const conceptId = searchParams.get('conceptId');

    if (!conceptId) {
      return NextResponse.json(
        { error: 'Concept ID is required' },
        { status: 400 }
      );
    }

    // Get all sentences for this concept
    const sentences = await prisma.sentence.findMany({
      where: {
        conceptId: parseInt(conceptId),
      },
      include: {
        acceptableTranslations: true,
      },
    });

    if (sentences.length === 0) {
      return NextResponse.json(
        { error: 'No sentences found for this concept' },
        { status: 404 }
      );
    }

    // Select a random sentence
    const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];

    return NextResponse.json(randomSentence);
  } catch (error) {
    console.error('Error fetching random sentence:', error);
    return NextResponse.json(
      { error: 'Failed to fetch random sentence' },
      { status: 500 }
    );
  }
} 