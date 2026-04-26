const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    // Fix for OpenSSL 3 / Node 18+ private key encoding issue
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ?.replace(/\\n/g, '\n')
      ?.replace(/\n/g, '\n')
      ?.trim()

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('Firebase initialized successfully')
  } catch (err) {
    console.error('Firebase init error:', err.message)
  }
}

const db = admin.firestore();
module.exports = { db };
