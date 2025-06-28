import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: any = null;
let adminAuth: any = null;
let adminDb: any = null;

// Check if we have the required environment variables
const hasRequiredEnvVars = () => {
  return process.env.FIREBASE_PRIVATE_KEY && 
         process.env.FIREBASE_CLIENT_EMAIL && 
         process.env.FIREBASE_PROJECT_ID;
};

// Initialize Firebase Admin SDK only if we have the required environment variables
try {
  if (hasRequiredEnvVars()) {
    const firebaseAdminConfig = {
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
      projectId: process.env.FIREBASE_PROJECT_ID!,
    };

    // Initialize admin app if it doesn't exist
    adminApp = getApps().length === 0 ? initializeApp(firebaseAdminConfig, 'admin') : getApps()[0];
    
    // Export admin services
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
  } else {
    console.warn('Firebase Admin SDK not initialized: Missing required environment variables');
    console.warn('Required: FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_PROJECT_ID');
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
}

// Export with fallback handling
export { adminAuth, adminDb };
export default adminApp; 