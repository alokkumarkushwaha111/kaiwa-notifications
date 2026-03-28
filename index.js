 const admin = require("firebase-admin");
const express = require("express");
const app = express();

try {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!rawServiceAccount) {
    throw new Error("Railway Variables mein FIREBASE_SERVICE_ACCOUNT nahi mila!");
  }

  const serviceAccount = JSON.parse(rawServiceAccount);
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log("Firebase Admin successfully initialized!");
} catch (error) {
  console.error("Initialization Error:", error.message);
  process.exit(1);
}

const db = admin.firestore();

db.collection("notifications").onSnapshot(async (snapshot) => {
  for (const change of snapshot.docChanges()) {
    if (change.type === "added") {
      const data = change.doc.data();
      const token = data.token;
      if (!token) {
        await change.doc.ref.delete();
        continue;
      }
      try {
        await admin.messaging().send({
          token,
          notification: { title: data.title, body: data.body },
          data: { fromUid: data.fromUid || "" }
        });
        await change.doc.ref.delete();
        console.log("✅ Notification Sent!");
      } catch(e) {
        console.error("FCM Error:", e.message);
        // Invalid token — Firestore se hatao taaki dobara try na ho
        if(
          e.code === 'messaging/registration-token-not-registered' ||
          e.code === 'messaging/invalid-registration-token' ||
          e.message?.includes('unregistered') ||
          e.message?.includes('invalid-argument')
        ) {
          try {
            const usersSnap = await db.collection('users')
              .where('fcmToken', '==', token).get();
            usersSnap.forEach(d => d.ref.update({ fcmToken: null }));
            console.log("🗑 Invalid token removed from Firestore");
          } catch(cleanErr) {
            console.error("Token cleanup error:", cleanErr.message);
          }
        }
        await change.doc.ref.delete();
      }
    }
  }
}, (error) => {
  console.error("Firestore listener error:", error.message);
});

app.get("/", (req, res) => res.send("OK - Server is Live"));
app.listen(process.env.PORT || 3000, () => console.log("✅ Server Running on Port 3000"));
