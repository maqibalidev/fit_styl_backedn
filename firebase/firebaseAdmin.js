const admin = require('firebase-admin');

const serviceAccount = require('./fitstyl-f1b15-firebase-adminsdk-zpaud-a218dc5076.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log("Firebase Admin initialized successfully.");
