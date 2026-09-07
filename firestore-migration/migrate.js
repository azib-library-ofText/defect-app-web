import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import FormData from "form-data";
import fetch from "node-fetch";

// ImgBB API Key
const IMGBB_API_KEY = "d33722684b4c4a41af62e5bcdc849b0a";

// Firebase Credentials
const firebaseConfig = {
  apiKey: "AIzaSyDlwZex4cZ9u8Wcrc8-uuugaARsHfRwEnE",
  authDomain: "defect---residensi-damai.web.app",
  projectId: "defect---residensi-damai",
  storageBucket: "defect---residensi-damai.appspot.com",
  messagingSenderId: "737848406419",
  appId: "1:737848406419:web:1584c2fef24f8d95e0c8to"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function uploadBase64ToImgBB(base64String) {
  const cleanBase64 = base64String.includes(",") 
    ? base64String.split(",")[1] 
    : base64String;

  const form = new FormData();
  form.append("image", cleanBase64);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: form,
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data?.error?.message || "ImgBB upload failed");
  }

  return data.data.url;
}

async function runMigration() {
  console.log("Connecting to Firestore and fetching defects...");
  const snapshot = await getDocs(collection(db, "defects"));
  console.log(`Found ${snapshot.docs.length} total defect documents.\n`);

  let migratedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const docId = docSnap.id;
    let needsUpdate = false;
    let updatedPhotoUrls = [];
    let updatedPhotoUrl = data.photoUrl || "";

    // 1. Process photoUrls array
    if (Array.isArray(data.photoUrls) && data.photoUrls.length > 0) {
      for (let i = 0; i < data.photoUrls.length; i++) {
        const url = data.photoUrls[i];
        if (url && url.startsWith("data:image/")) {
          console.log(`[Doc ${docId}] Uploading photoUrls[${i}] to ImgBB...`);
          try {
            const hostedUrl = await uploadBase64ToImgBB(url);
            updatedPhotoUrls.push(hostedUrl);
            needsUpdate = true;
          } catch (err) {
            console.error(`Failed to upload photo for ${docId}:`, err.message);
            updatedPhotoUrls.push(url);
          }
        } else {
          updatedPhotoUrls.push(url);
        }
      }
    }

    // 2. Process single photoUrl
    if (updatedPhotoUrl && updatedPhotoUrl.startsWith("data:image/")) {
      console.log(`[Doc ${docId}] Uploading primary photoUrl to ImgBB...`);
      try {
        updatedPhotoUrl = await uploadBase64ToImgBB(updatedPhotoUrl);
        needsUpdate = true;
      } catch (err) {
        console.error(`Failed to upload main photo for ${docId}:`, err.message);
      }
    } else if (updatedPhotoUrls.length > 0) {
      updatedPhotoUrl = updatedPhotoUrls[0];
    }

    // 3. Save clean links back to Firestore
    if (needsUpdate) {
      const docRef = doc(db, "defects", docId);
      await updateDoc(docRef, {
        photoUrls: updatedPhotoUrls,
        photoUrl: updatedPhotoUrl,
      });
      console.log(`✔ [Doc ${docId}] Updated with ImgBB links!\n`);
      migratedCount++;
    }
  }

  console.log(`Migration complete! Successfully cleaned up ${migratedCount} documents.`);
  process.exit(0);
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
