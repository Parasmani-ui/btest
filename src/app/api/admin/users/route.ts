import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';

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

// GET - Fetch all users (admin and group_admin)
export async function GET(request: NextRequest) {
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');
    const organizationIdFilter = searchParams.get('organizationId');

    // Build Firestore query
    let query = adminDb.collection('users');

    // Group admins can only see their organization's users
    if (adminUser.userData.role === 'group_admin') {
      if (!adminUser.userData.organizationId) {
        return NextResponse.json({
          error: 'Group admin must be assigned to an organization'
        }, { status: 403 });
      }
      query = query.where('organizationId', '==', adminUser.userData.organizationId);
    } else if (organizationIdFilter) {
      // Super admin can filter by organization
      query = query.where('organizationId', '==', organizationIdFilter);
    }

    // Apply role filter if provided
    if (roleFilter) {
      query = query.where('role', '==', roleFilter);
    }

    // Fetch users from Firestore
    const usersSnapshot = await query.get();
    let users = usersSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      uid: doc.id,
      ...doc.data(),
      // Don't expose sensitive fields
      password: undefined,
    }));

    // Check if we should recalculate stats from game sessions
    const recalculateStats = searchParams.get('recalculateStats') === 'true';

    if (recalculateStats) {
      console.log('📊 Recalculating user stats from game sessions...');

      // Fetch and recalculate stats for each user
      users = await Promise.all(users.map(async (user: any) => {
        try {
          // Fetch user's game sessions
          const sessionsSnapshot = await adminDb
            .collection('gameSessions')
            .where('userId', '==', user.uid)
            .get();

          const sessions = sessionsSnapshot.docs.map((doc: any) => doc.data());

          // Recalculate totalPlaytime from sessions
          const calculatedPlaytime = sessions.reduce((total: number, session: any) => {
            const sessionTime = session.elapsedTime || (session.duration ? session.duration * 60 : 0);
            return total + sessionTime;
          }, 0);

          // Return user with updated playtime
          return {
            ...user,
            totalPlaytime: calculatedPlaytime,
          };
        } catch (error) {
          console.error(`Error recalculating stats for user ${user.uid}:`, error);
          return user; // Return original user data if recalculation fails
        }
      }));
    }

    return NextResponse.json({
      users,
      total: users.length,
      role: adminUser.userData.role,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new user (admin only)
export async function POST(request: NextRequest) {
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

    const adminUser = await verifyAdminToken(authToken, true); // Only super admins can create users
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized. Only admins can create users.' }, { status: 403 });
    }

    const { email, password, displayName, role, organizationId, organizationName } = await request.json();

    // Validation
    if (!email || !password || !displayName || !role) {
      return NextResponse.json({
        error: 'Missing required fields: email, password, displayName, role'
      }, { status: 400 });
    }

    if (!['user', 'group_admin', 'admin'].includes(role)) {
      return NextResponse.json({
        error: 'Invalid role. Must be: user, group_admin, or admin'
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({
        error: 'Password must be at least 6 characters long'
      }, { status: 400 });
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
      emailVerified: false,
    });

    // Create user document in Firestore
    const userData = {
      email,
      displayName,
      role,
      organizationId: organizationId || null,
      organizationName: organizationName || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
      gamesPlayed: 0,
      casesCompleted: 0,
      averageScore: 0,
      totalPlaytime: 0,
    };

    await adminDb.collection('users').doc(userRecord.uid).set(userData);

    console.log(`✅ User created: ${email} (${role})`);

    return NextResponse.json({
      success: true,
      user: {
        uid: userRecord.uid,
        ...userData,
      },
      message: 'User created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating user:', error);

    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({
        error: 'Email address is already in use'
      }, { status: 400 });
    }

    if (error.code === 'auth/invalid-email') {
      return NextResponse.json({
        error: 'Invalid email address'
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

// PUT - Update user (admin and group_admin)
export async function PUT(request: NextRequest) {
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

    const { uid, email, displayName, role, organizationId, organizationName, disabled } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    // Check if target user exists
    const targetUserDoc = await adminDb.collection('users').doc(uid).get();
    if (!targetUserDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUserData = targetUserDoc.data();

    // Group admins can only update users in their organization
    if (adminUser.userData.role === 'group_admin') {
      if (targetUserData?.organizationId !== adminUser.userData.organizationId) {
        return NextResponse.json({
          error: 'Group admins can only update users in their organization'
        }, { status: 403 });
      }

      // Group admins cannot change roles or assign users to different organizations
      if (role && role !== targetUserData?.role) {
        return NextResponse.json({
          error: 'Group admins cannot change user roles'
        }, { status: 403 });
      }

      if (organizationId && organizationId !== adminUser.userData.organizationId) {
        return NextResponse.json({
          error: 'Group admins cannot assign users to different organizations'
        }, { status: 403 });
      }
    }

    // Build update object
    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (email) updates.email = email;
    if (displayName) updates.displayName = displayName;
    if (role) updates.role = role;
    if (organizationId !== undefined) updates.organizationId = organizationId;
    if (organizationName !== undefined) updates.organizationName = organizationName;

    // Update Firebase Auth if email or disabled status changed
    const authUpdates: any = {};
    if (email && email !== targetUserData?.email) {
      authUpdates.email = email;
    }
    if (disabled !== undefined) {
      authUpdates.disabled = disabled;
    }

    if (Object.keys(authUpdates).length > 0) {
      await adminAuth.updateUser(uid, authUpdates);
    }

    // Update user in Firestore
    await adminDb.collection('users').doc(uid).update(updates);

    console.log(`✅ User updated: ${uid}`);

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating user:', error);

    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({
        error: 'Email address is already in use'
      }, { status: 400 });
    }

    if (error.code === 'auth/invalid-email') {
      return NextResponse.json({
        error: 'Invalid email address'
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

// DELETE - Delete user (admin only)
export async function DELETE(request: NextRequest) {
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

    // Only super admins can delete users
    const adminUser = await verifyAdminToken(authToken, true);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized. Only admins can delete users.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid parameter' }, { status: 400 });
    }

    // Check if user exists
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deleting self
    if (uid === adminUser.uid) {
      return NextResponse.json({
        error: 'Cannot delete your own account'
      }, { status: 400 });
    }

    // Delete all user's game sessions
    const sessionsSnapshot = await adminDb
      .collection('gameSessions')
      .where('userId', '==', uid)
      .get();

    const deleteBatch = adminDb.batch();
    sessionsSnapshot.docs.forEach((doc: any) => {
      deleteBatch.delete(doc.ref);
    });

    // Execute batch delete of game sessions
    if (!sessionsSnapshot.empty) {
      await deleteBatch.commit();
      console.log(`🗑️  Deleted ${sessionsSnapshot.size} game sessions for user ${uid}`);
    }

    // Delete user from Firebase Auth
    await adminAuth.deleteUser(uid);

    // Delete user document from Firestore
    await adminDb.collection('users').doc(uid).delete();

    console.log(`✅ User deleted: ${uid}`);

    return NextResponse.json({
      success: true,
      message: 'User and all associated data deleted successfully',
      deletedSessions: sessionsSnapshot.size,
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);

    // Handle specific Firebase errors
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({
        error: 'User not found in Firebase Auth'
      }, { status: 404 });
    }

    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
} 