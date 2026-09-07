// src/utils.js
import { IMGBB_API_KEY } from "./constants.jsx";

export const compressImage = (file, maxDim = 800, quality = 0.6) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

export const uploadToImgBB = async (base64DataUrl) => {
  const cleanBase64 = base64DataUrl.includes(",")
    ? base64DataUrl.split(",")[1]
    : base64DataUrl;

  const formData = new FormData();
  formData.append("image", cleanBase64);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data?.error?.message || "Failed to upload image to ImgBB");
  }

  return data.data.url;
};

export const generateAuditDiff = (original, updated, userEmail) => {
  const timestamp = new Date().toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" });
  const changes = [];

  if (original.trade !== updated.trade) changes.push(`Trade: '${original.trade}' -> '${updated.trade}'`);
  if (original.item !== updated.item) changes.push(`Item: '${original.item}' -> '${updated.item}'`);
  if (original.location !== updated.location) changes.push(`Location updated`);
  if (original.severity !== updated.severity) changes.push(`Severity: '${original.severity}' -> '${updated.severity}'`);
  if (original.status !== updated.status) changes.push(`Status: '${original.status}' -> '${updated.status}'`);
  if (original.desc !== updated.desc) changes.push(`Description updated`);

  const oldPhotoCount = (original.photoUrls || []).length;
  const newPhotoCount = (updated.photoUrls || []).length;
  if (oldPhotoCount !== newPhotoCount) {
    changes.push(`Photos: ${oldPhotoCount} -> ${newPhotoCount}`);
  }

  if (changes.length === 0) return null;
  return `[${timestamp} by ${userEmail || "Staff"}]: ${changes.join("; ")}`;
};

