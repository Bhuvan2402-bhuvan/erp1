import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let adminApp = null;
let adminAuth = null;

try {
  if (!getApps().length) {
    const serviceAccount = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT)
      : null;

    if (serviceAccount) {
      adminApp = initializeApp({
        credential: cert(serviceAccount)
      });
    } else {
      adminApp = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-app'
      });
    }
  } else {
    adminApp = getApps()[0];
  }
  adminAuth = getAuth(adminApp);
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

export { adminApp, adminAuth };
