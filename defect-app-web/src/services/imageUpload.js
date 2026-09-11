// src/services/imageUpload.js
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from "../constants.jsx";

/**
 * Mampatkan imej menggunakan HTML5 Canvas
 * @param {File} file - Fail asal daripada kamera/galeri
 * @param {boolean} isHD - Jika true, gunakan resolusi & kualiti lebih tinggi
 * @returns {Promise<Blob>} Fail imej yang telah dimampatkan
 */
export const compressImage = (file, isHD = false) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Tetapan had mengikut mod Standard vs HD
        const MAX_DIMENSION = isHD ? 2400 : 1600;
        const QUALITY = isHD ? 0.88 : 0.82;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas toBlob failed"));
            }
          },
          "image/jpeg",
          QUALITY
        );
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
};

/**
 * Muat naik imej ke Cloudinary
 * @param {File|Blob} fileOrBlob - Fail imej
 * @param {boolean} isHD - Pilihan mod kualiti
 * @returns {Promise<string>} Secure URL daripada Cloudinary
 */
export const uploadToCloudinary = async (fileOrBlob, isHD = false) => {
  try {
    // 1. Mampatkan dahulu sebelum hantar ke cloud
    const compressedBlob = await compressImage(fileOrBlob, isHD);

    // 2. Sediakan FormData
    const formData = new FormData();
    formData.append("file", compressedBlob);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    // 3. Hantar ke API Endpoint Cloudinary
    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Cloudinary upload failed");
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Upload Error:", error);
    throw error;
  }
};