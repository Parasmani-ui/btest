import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// Check if Firebase Admin is properly initialized
function isFirebaseAdminInitialized() {
  return adminAuth && adminDb;
}

// Verify admin token and support both admin and group_admin roles
async function verifyAdminToken(authToken: string, requireSuperAdmin = false) {
  try {
    if (!isFirebaseAdminInitialized()) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    const decodedToken = await adminAuth.verifyIdToken(authToken);
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();

    if (!userData) {
      return null;
    }

    // Super admin check (only 'admin' role)
    if (requireSuperAdmin) {
      return userData.role === 'admin' ? { ...decodedToken, userData } : null;
    }

    // Allow both 'admin' and 'group_admin' roles
    const isAuthorized = userData.role === 'admin' || userData.role === 'group_admin';
    return isAuthorized ? { ...decodedToken, userData } : null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// GET - Fetch detailed user information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isFirebaseAdminInitialized()) {
      return NextResponse.json({
        error: 'Firebase Admin SDK not initialized. Please check server configuration.'
      }, { status: 500 });
    }

    const authToken = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!authToken) {
      return NextResponse.json({ error: 'No auth token provided' }, { status: 401 });
    }

    const adminUser = await verifyAdminToken(authToken);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id: userId } = await params;

    // Get user profile
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();

    // Group admins can only view users in their organization
    if (adminUser.userData.role === 'group_admin') {
      if (userData?.organizationId !== adminUser.userData.organizationId) {
        return NextResponse.json({
          error: 'Group admins can only view users in their organization'
        }, { status: 403 });
      }
    }

    // Get all game sessions for this user
    console.log(`📊 Fetching game sessions for user: ${userId}`);

    const sessionsSnapshot = await adminDb
      .collection('gameSessions')
      .where('userId', '==', userId)
      .orderBy('startedAt', 'desc')
      .get();

    console.log(`📊 Found ${sessionsSnapshot.size} game sessions`);

    const gameSessions = sessionsSnapshot.docs.map((doc) => {
      const data = doc.data();
      console.log(`  Session ${doc.id}: elapsedTime=${data.elapsedTime}, duration=${data.duration}, overallScore=${data.overallScore}`);
      return {
        id: doc.id,
        ...data,
      };
    });

    // Calculate comprehensive statistics
    const completedSessions = gameSessions.filter((s: any) => s.caseSolved);
    const totalGames = gameSessions.length;
    const casesCompleted = completedSessions.length;

    // Calculate total playtime (in seconds)
    // Handle different field names: elapsedTime (seconds), duration (MINUTES - need to convert)
    const totalPlaytime = gameSessions.reduce((total: number, session: any) => {
      // Try elapsedTime first (in seconds), then duration (in MINUTES, so multiply by 60)
      const timeInSeconds = session.elapsedTime || (session.duration ? session.duration * 60 : 0);
      return total + timeInSeconds;
    }, 0);

    console.log(`📊 Total playtime calculated: ${totalPlaytime} seconds (${Math.floor(totalPlaytime/60)} minutes)`);

    // Calculate average score - check both overallScore and score fields
    const sessionsWithScores = gameSessions.filter((s: any) => {
      const scoreValue = s.overallScore ?? s.score;
      return scoreValue !== undefined && scoreValue !== null && scoreValue > 0;
    });
    const averageScore = sessionsWithScores.length > 0
      ? sessionsWithScores.reduce((sum: number, s: any) => sum + (s.overallScore ?? s.score ?? 0), 0) / sessionsWithScores.length
      : 0;

    console.log(`📊 Average score calculated: ${averageScore.toFixed(2)}% from ${sessionsWithScores.length} sessions with scores`);

    // Get recent activity (last 20 sessions)
    const recentActivity = gameSessions.slice(0, 20).map((session: any) => ({
      id: session.id,
      action: session.caseSolved ? 'game_completed' : 'game_attempted',
      timestamp: session.startedAt,
      gameType: session.gameType,
      score: session.overallScore,
      metadata: {
        gameTitle: session.caseTitle,
        status: session.caseSolved ? 'Solved' : 'Incomplete',
        hintsUsed: session.hintsUsed || 0,
      },
    }));

    // Calculate statistics by game type
    const gameTypeStats: any = {};
    gameSessions.forEach((session: any) => {
      const type = session.gameType || 'unknown';
      if (!gameTypeStats[type]) {
        gameTypeStats[type] = {
          total: 0,
          completed: 0,
          totalScore: 0,
          avgScore: 0,
        };
      }
      gameTypeStats[type].total += 1;
      if (session.caseSolved) {
        gameTypeStats[type].completed += 1;
      }
      // Check both overallScore and score fields
      const scoreValue = session.overallScore ?? session.score;
      if (scoreValue !== undefined && scoreValue !== null && scoreValue > 0) {
        gameTypeStats[type].totalScore += scoreValue;
        gameTypeStats[type].sessionsWithScores = (gameTypeStats[type].sessionsWithScores || 0) + 1;
      }
    });

    // Calculate average scores for each game type
    Object.keys(gameTypeStats).forEach((type) => {
      const stats = gameTypeStats[type];
      // Only calculate average from sessions that have scores
      stats.avgScore = (stats.sessionsWithScores && stats.sessionsWithScores > 0)
        ? stats.totalScore / stats.sessionsWithScores
        : 0;
      delete stats.sessionsWithScores; // Remove helper field from final output
    });

    // Response object
    const response = {
      profile: {
        uid: userId,
        email: userData?.email,
        displayName: userData?.displayName,
        role: userData?.role,
        organizationId: userData?.organizationId,
        organizationName: userData?.organizationName,
        createdAt: userData?.createdAt,
        lastLoginAt: userData?.lastLoginAt,
      },
      stats: {
        gamesPlayed: totalGames,
        casesCompleted: casesCompleted,
        totalPlaytime: totalPlaytime, // in seconds
        averageScore: Math.round(averageScore * 100) / 100,
        completionRate: totalGames > 0 ? Math.round((casesCompleted / totalGames) * 100) : 0,
        gameTypeStats,
      },
      gameHistory: gameSessions,
      recentActivity,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching user details:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
