import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const languagePairs = await prisma.languagePair.findMany({
      include: {
        fromLanguage: true,
        toLanguage: true,
      },
    });

    return NextResponse.json(languagePairs);
  } catch (error) {
    console.error('Error fetching language pairs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch language pairs' },
      { status: 500 }
    );
  }
} 