import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import {
  generateOrganizationReportExcel,
  generateOrganizationReportPDF,
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

// GET - Generate organization report
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

    const { id: organizationId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // json, pdf, xlsx

    // Group admins can only view their own organization
    if (adminUser.userData.role === 'group_admin') {
      if (organizationId !== adminUser.userData.organizationId) {
        return NextResponse.json({
          error: 'Group admins can only view their own organization'
        }, { status: 403 });
      }
    }

    // Get all users in the organization
    const usersSnapshot = await adminDb
      .collection('users')
      .where('organizationId', '==', organizationId)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json({
        error: 'No users found in this organization'
      }, { status: 404 });
    }

    const users = usersSnapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));

    // Get organization name from first user
    const organizationName = users[0]?.organizationName || organizationId;

    // Fetch game sessions for all users to get parameter scores
    const usersWithSessions = await Promise.all(
      users.map(async (user: any) => {
        const sessionsSnapshot = await adminDb
          .collection('gameSessions')
          .where('userId', '==', user.uid)
          .orderBy('startedAt', 'desc')
          .get();

        const sessions = sessionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        return {
          ...user,
          gameSessions: sessions,
        };
      })
    );

    // Calculate aggregate statistics
    let totalGames = 0;
    let totalCasesCompleted = 0;
    let totalPlaytime = 0;
    let totalScore = 0;
    let usersWithScores = 0;
    let activeUsers = 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    users.forEach((user: any) => {
      totalGames += user.gamesPlayed || 0;
      totalCasesCompleted += user.casesCompleted || 0;
      totalPlaytime += user.totalPlaytime || 0;

      if (user.averageScore !== undefined && user.averageScore !== null) {
        totalScore += user.averageScore;
        usersWithScores += 1;
      }

      // Count active users (logged in within last 30 days)
      if (user.lastLoginAt) {
        const lastLogin = new Date(user.lastLoginAt);
        if (lastLogin >= thirtyDaysAgo) {
          activeUsers += 1;
        }
      }
    });

    const avgScore = usersWithScores > 0 ? totalScore / usersWithScores : 0;

    const aggregateStats = {
      totalUsers: users.length,
      activeUsers,
      totalGames,
      totalCasesCompleted,
      avgScore,
      totalPlaytime,
    };

    // Return JSON data if format is json or unspecified
    if (format === 'json') {
      return NextResponse.json({
        organizationId,
        organizationName,
        stats: aggregateStats,
        users: users.map((user: any) => ({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          role: user.role,
          gamesPlayed: user.gamesPlayed || 0,
          casesCompleted: user.casesCompleted || 0,
          averageScore: user.averageScore || 0,
          totalPlaytime: user.totalPlaytime || 0,
          lastLoginAt: user.lastLoginAt,
        })),
      });
    }

    // Generate Excel report
    if (format === 'xlsx') {
      const result = generateOrganizationReportExcel(
        organizationName,
        usersWithSessions,
        aggregateStats
      );

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
      const result = generateOrganizationReportPDF(
        organizationName,
        usersWithSessions,
        aggregateStats
      );

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
    console.error('Error generating organization report:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
