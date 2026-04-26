const admin = require('firebase-admin');

if (!admin.apps.length) {
  // Parse the private key carefully - handle all edge cases
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || ''
  
  // Remove surrounding quotes if present
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1)
  }
  
  // Replace literal \n with actual newlines
  privateKey = privateKey.replace(/\\n/g, '\n')

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: privateKey,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
  console.log('Firebase initialized OK')
}

const db = admin.firestore();
module.exports = { db };
