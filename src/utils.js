// src/utils.js
import { IMGBB_API_KEY } from "./constants.jsx";

// maxDim increased to 1600px, quality increased to 0.82 (82%)
export const compressImage = (file, maxDim = 1600, quality = 0.82) => {
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

        // Maintain original aspect ratio while capping longest edge to maxDim
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
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

export const uploadToImgBB = async (base64DataUrl) => {
  const base64Data = base64DataUrl.split(",")[1];
  const formData = new FormData();
  formData.append("key", IMGBB_API_KEY);
  formData.append("image", base64Data);

  const res = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data?.error?.message || "Failed to upload image to ImgBB");
  }

  return data.data.display_url;
};