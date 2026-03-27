const admin = require("firebase-admin");
const express = require("express");
const app = express();

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

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
      } catch(e) {
        console.error("FCM Error:", e.message);
        await change.doc.ref.delete();
      }
    }
  }
});

app.get("/", (req, res) => res.send("OK"));
app.listen(3000, () => console.log("Running"));
