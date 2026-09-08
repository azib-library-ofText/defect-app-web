// src/useRateTracker.js
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "defect_upload_timestamps";
const ONE_HOUR_MS = 3600000; // 60 minutes in milliseconds

export function useUploadTracker(hourlyLimit = 100) {
  // Helper to read and clean expired timestamps (> 60 mins)
  const getValidTimestamps = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const oneHourAgo = Date.now() - ONE_HOUR_MS;
      return saved.filter((ts) => typeof ts === "number" && ts > oneHourAgo);
    } catch {
      return [];
    }
  };

  const [recentUploads, setRecentUploads] = useState(getValidTimestamps);

  // Method to record new uploads
  const recordUploads = useCallback((count = 1) => {
    if (count <= 0) return;
    const now = Date.now();
    const newEntries = Array.from({ length: count }, () => now);

    setRecentUploads((prev) => {
      const oneHourAgo = Date.now() - ONE_HOUR_MS;
      const filteredPrev = prev.filter((ts) => ts > oneHourAgo);
      const updated = [...filteredPrev, ...newEntries];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Periodic 60-second cleanup to decay timestamps older than 1 hour
  useEffect(() => {
    const interval = setInterval(() => {
      setRecentUploads(getValidTimestamps());
    }, 60000);

    // Sync across multiple browser tabs
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY) {
        setRecentUploads(getValidTimestamps());
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const count = recentUploads.length;
  const isNearLimit = count >= hourlyLimit * 0.8;
  const isAtLimit = count >= hourlyLimit;

  return { count, hourlyLimit, isNearLimit, isAtLimit, recordUploads };
}