 const admin = require("firebase-admin");
const express = require("express");
const app = express();

// --- IS SECTION KO UPDATE KAREIN ---
try {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!rawServiceAccount) {
    throw new Error("Railway Variables mein FIREBASE_SERVICE_ACCOUNT nahi mila!");
  }

  const serviceAccount = JSON.parse(rawServiceAccount);
  
  // Private key mein '\n' ka issue fix karne ke liye:
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log("Firebase Admin successfully initialized!");
} catch (error) {
  console.error("Initialization Error:", error.message);
}
// ------------------------------------

const db = admin.firestore();

// Baki ka code (db.collection... onSnapshot) waisa hi rahega
db.collection("notifications").onSnapshot(async (snapshot) => {
  for (const change of snapshot.docChanges()) {
    if (change.type === "added") {
      const data = change.doc.data();
      const token = data.token;
      if (!token) continue;
      try {
        await admin.messaging().send({
          token,
          notification: { title: data.title, body: data.body },
          data: { fromUid: data.fromUid || "" }
        });
        await change.doc.ref.delete();
        console.log("Notification Sent!");
      } catch(e) {
        console.error("FCM Error:", e.message);
        await change.doc.ref.delete();
      }
    }
  }
});

app.get("/", (req, res) => res.send("OK - Server is Live"));
app.listen(process.env.PORT || 3000, () => console.log("Server Running on Port 3000"));
