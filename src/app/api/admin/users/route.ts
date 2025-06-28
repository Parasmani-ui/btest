import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';

// Check if Firebase Admin is properly initialized
function isFirebaseAdminInitialized() {
  return adminAuth && adminDb;
}

// Verify admin token
async function verifyAdminToken(authToken: string) {
  try {
    if (!isFirebaseAdminInitialized()) {
      throw new Error('Firebase Admin SDK not initialized');
    }
    
    const decodedToken = await adminAuth.verifyIdToken(authToken);
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.data();
    
    return userData?.role === 'admin' ? decodedToken : null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// GET - Fetch all users (admin only)
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

    // Fetch all users from Firestore
    const usersSnapshot = await adminDb.collection('users').get();
    const users = usersSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      uid: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update user (admin only)
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

    const { uid, updates } = await request.json();

    if (!uid || !updates) {
      return NextResponse.json({ error: 'Missing uid or updates' }, { status: 400 });
    }

    // Update user in Firestore
    await adminDb.collection('users').doc(uid).update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    const adminUser = await verifyAdminToken(authToken);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    // Delete user from Auth and Firestore
    await adminAuth.deleteUser(uid);
    await adminDb.collection('users').doc(uid).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 