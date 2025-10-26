import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import {
  generateUserReportExcel,
  generateUserReportPDF,
} from '@/utils/adminReports';

// Check if Firebase Admin is properly initialized
function isFirebaseAdminInitialized() {
  return adminAuth && adminDb;
}

// Verify admin token
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

    if (requireSuperAdmin) {
      return userData.role === 'admin' ? { ...decodedToken, userData } : null;
    }

    const isAuthorized = userData.role === 'admin' || userData.role === 'group_admin';
    return isAuthorized ? { ...decodedToken, userData } : null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// GET - Generate user report
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
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // json, pdf, xlsx

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
    const sessionsSnapshot = await adminDb
      .collection('gameSessions')
      .where('userId', '==', userId)
      .orderBy('startedAt', 'desc')
      .get();

    const gameSessions = sessionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate statistics
    const completedSessions = gameSessions.filter((s: any) => s.caseSolved);
    const totalGames = gameSessions.length;
    const casesCompleted = completedSessions.length;

    const totalPlaytime = gameSessions.reduce((total: number, session: any) => {
      return total + (session.elapsedTime || 0);
    }, 0);

    const sessionsWithScores = gameSessions.filter((s: any) => s.overallScore !== undefined && s.overallScore !== null);
    const averageScore = sessionsWithScores.length > 0
      ? sessionsWithScores.reduce((sum: number, s: any) => sum + s.overallScore, 0) / sessionsWithScores.length
      : 0;

    // Statistics by game type
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
      if (session.overallScore) {
        gameTypeStats[type].totalScore += session.overallScore;
      }
    });

    Object.keys(gameTypeStats).forEach((type) => {
      const stats = gameTypeStats[type];
      stats.avgScore = stats.total > 0 ? stats.totalScore / stats.total : 0;
    });

    const profile = {
      uid: userId,
      email: userData?.email || '',
      displayName: userData?.displayName || '',
      role: userData?.role || '',
      organizationName: userData?.organizationName,
      createdAt: userData?.createdAt || new Date().toISOString(),
      lastLoginAt: userData?.lastLoginAt,
    };

    const stats = {
      gamesPlayed: totalGames,
      casesCompleted: casesCompleted,
      totalPlaytime: totalPlaytime,
      averageScore: Math.round(averageScore * 100) / 100,
      completionRate: totalGames > 0 ? Math.round((casesCompleted / totalGames) * 100) : 0,
      gameTypeStats,
    };

    // Return JSON data if format is json or unspecified
    if (format === 'json') {
      return NextResponse.json({
        profile,
        stats,
        gameHistory: gameSessions,
      });
    }

    // Generate Excel report
    if (format === 'xlsx') {
      const result = generateUserReportExcel(profile, stats, gameSessions as any);

      if (result.success && result.buffer) {
        return new NextResponse(result.buffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${result.filename}"`,
          },
        });
      } else {
        return NextResponse.json({
          error: 'Failed to generate Excel report',
          details: result.error
        }, { status: 500 });
      }
    }

    // Generate PDF report
    if (format === 'pdf') {
      const result = generateUserReportPDF(profile, stats, gameSessions as any);

      if (result.success && result.buffer) {
        return new NextResponse(result.buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${result.filename}"`,
          },
        });
      } else {
        return NextResponse.json({
          error: 'Failed to generate PDF report',
          details: result.error
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      error: 'Invalid format. Use: json, pdf, or xlsx'
    }, { status: 400 });

  } catch (error: any) {
    console.error('Error generating user report:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
