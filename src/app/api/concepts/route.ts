import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const languagePairId = searchParams.get('languagePairId');

    if (!languagePairId) {
      return NextResponse.json(
        { error: 'Language pair ID is required' },
        { status: 400 }
      );
    }

    const concepts = await prisma.grammaticalConcept.findMany({
      where: {
        languagePairId: parseInt(languagePairId),
      },
    });

    return NextResponse.json(concepts);
  } catch (error) {
    console.error('Error fetching concepts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch concepts' },
      { status: 500 }
    );
  }
} 