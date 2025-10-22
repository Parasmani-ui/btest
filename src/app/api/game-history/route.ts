import { NextRequest, NextResponse } from 'next/server';
import { getUserGameHistory } from '@/lib/firestore';

export async function GET(request: NextRequest) {
  try {
    // Get userId from query params
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limitStr = searchParams.get('limit');
    const limit = limitStr ? parseInt(limitStr) : 10;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Fetch game history from Firestore
    const gameHistory = await getUserGameHistory(userId, limit);

    return NextResponse.json({
      success: true,
      gameHistory
    });
  } catch (error) {
    console.error('Error fetching game history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game history' },
      { status: 500 }
    );
  }
}
