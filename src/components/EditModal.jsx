// src/components/EditModal.jsx
import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db, TRADE_CATALOG, ZONE_OPTIONS } from "../constants.jsx";
import { compressImage, uploadToCloudinary } from "../utils.js";
import { useUploadTracker } from "../useRateTracker.js";
import {
  X,
  Plus,
  Trash2,
  UploadCloud,
  Check,
  AlertCircle
} from "lucide-react";

export default function EditModal({ defect, currentUser, onClose, onSaveComplete, onDelete }) {
  const [trade, setTrade] = useState(defect.trade || "Civil & Structural");
  const [element, setElement] = useState(
    defect.element || Object.keys(TRADE_CATALOG[defect.trade || "Civil & Structural"]?.elements || {})[0] || ""
  );
  const [item, setItem] = useState(defect.item || "");
  const [severity, setSeverity] = useState(defect.severity || "Medium");
  const [status, setStatus] = useState(defect.status || "Pending Rectification");
  const [desc, setDesc] = useState(defect.desc || "");
  const [specificLandmark, setSpecificLandmark] = useState("");

  // Rate Tracker instance to track uploads from EditModal
  const { recordUploads } = useUploadTracker(100);

  // Existing URLs from Cloudinary / Firestore
  const initialPhotos = Array.isArray(defect.photoUrls) && defect.photoUrls.length > 0
    ? defect.photoUrls
    : [defect.photoUrl].filter(Boolean);

  const [existingPhotos, setExistingPhotos] = useState(initialPhotos);
  // Newly attached base64 photos to be uploaded
  const [newPhotos, setNewPhotos] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");

  // Handle Trade selection update
  const handleTradeChange = (newTrade) => {
    setTrade(newTrade);
    const elements = Object.keys(TRADE_CATALOG[newTrade]?.elements || {});
    const firstElement = elements[0] || "";
    setElement(firstElement);
    const items = TRADE_CATALOG[newTrade]?.elements[firstElement]?.items || [];
    setItem(items[0] || "");
    setSeverity(TRADE_CATALOG[newTrade]?.elements[firstElement]?.defaultSeverity || "Medium");
  };

  // Handle Element selection update
  const handleElementChange = (newElement) => {
    setElement(newElement);
    const items = TRADE_CATALOG[trade]?.elements[newElement]?.items || [];
    setItem(items[0] || "");
    setSeverity(TRADE_CATALOG[trade]?.elements[newElement]?.defaultSeverity || "Medium");
  };

  // Add new photos with 4-photo maximum ceiling & high-res compression
  const handleAddNewPhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentTotal = existingPhotos.length + newPhotos.length;
    const availableSlots = 4 - currentTotal;

    if (availableSlots <= 0) {
      alert("Maximum 4 photos allowed per defect. Delete an existing photo first to attach a new one.");
      e.target.value = "";
      return;
    }

    if (files.length > availableSlots) {
      alert(`You can only add ${availableSlots} more photo(s). Only the first ${availableSlots} will be attached.`);
    }

    const filesToProcess = files.slice(0, availableSlots);

    for (const file of filesToProcess) {
      try {
        const compressed = await compressImage(file, 1600, 0.82);
        setNewPhotos((prev) => [...prev, compressed]);
      } catch (err) {
        console.error("Image compression error:", err);
      }
    }
    e.target.value = "";
  };

  const handleSave = async () => {
    const totalPhotos = existingPhotos.length + newPhotos.length;
    if (totalPhotos === 0) {
      alert("Defect must have at least one photo attached.");
      return;
    }

    setIsSaving(true);
    setSyncStatus("Uploading new photos to Cloudinary...");

    try {
      const uploadedUrls = [];
      for (let i = 0; i < newPhotos.length; i++) {
        setSyncStatus(`Uploading photo ${i + 1} of ${newPhotos.length} to Cloudinary...`);
        const url = await uploadToCloudinary(newPhotos[i]);
        uploadedUrls.push(url);
      }

      // Record any newly uploaded photos against the hourly quota
      if (uploadedUrls.length > 0) {
        recordUploads(uploadedUrls.length);
      }

      setSyncStatus("Updating defect in Firestore...");
      const finalPhotoList = [...existingPhotos, ...uploadedUrls];

      let updatedLocation = defect.location;
      if (specificLandmark.trim()) {
        updatedLocation = `${defect.location} • ${specificLandmark.trim()}`;
      }

      const editEntry = {
        editedAt: Date.now(),
        editedBy: currentUser?.displayName || currentUser?.email || "Inspector",
        previousStatus: defect.status,
        newStatus: status
      };

      const updatedData = {
        trade,
        element,
        item,
        severity,
        status,
        desc: desc.trim(),
        location: updatedLocation,
        photoUrls: finalPhotoList,
        photoUrl: finalPhotoList[0] || "",
        editHistory: [...(defect.editHistory || []), editEntry]
      };

      await updateDoc(doc(db, "defects", defect.id), updatedData);
      if (onSaveComplete) onSaveComplete();
      onClose();
    } catch (err) {
      console.error("Save defect error:", err);
      alert(`Update failed: ${err.message || "Network error"}`);
    } finally {
      setIsSaving(false);
      setSyncStatus("");
    }
  };

  const currentTotalPhotos = existingPhotos.length + newPhotos.length;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto space-y-4 max-h-[92vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              Edit Defect Record
            </span>
            <h3 className="font-black text-slate-900 text-sm sm:text-base mt-1">
              ID: {defect.id}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Location Display & Addition */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-2">
          <div>
            <span className="text-slate-500 font-semibold block text-[10px] uppercase">Original Location:</span>
            <p className="font-bold text-slate-800">{defect.location}</p>
          </div>
          <div>
            <label className="text-slate-500 font-semibold block text-[10px] uppercase mb-1">
              Append Specific Sub-Note / Landmark (Optional):
            </label>
            <input
              type="text"
              value={specificLandmark}
              onChange={(e) => setSpecificLandmark(e.target.value)}
              placeholder="e.g. Near Column C-12"
              className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl font-medium"
            />
          </div>
        </div>

        {/* Status & Severity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Rectification Status:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
            >
              <option value="Pending Rectification">Pending Rectification</option>
              <option value="In Progress">In Progress</option>
              <option value="Rectified">Rectified / Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Severity Rating:</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        {/* Classification */}
        <div className="space-y-2.5">
          <label className="block text-[11px] font-bold text-slate-700">Classification Trade & Element:</label>
          <select
            value={trade}
            onChange={(e) => handleTradeChange(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
          >
            {Object.keys(TRADE_CATALOG).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={element}
              onChange={(e) => handleElementChange(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            >
              {Object.keys(TRADE_CATALOG[trade]?.elements || {}).map((el) => (
                <option key={el} value={el}>{el}</option>
              ))}
            </select>

            <select
              value={item}
              onChange={(e) => setItem(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
            >
              {(TRADE_CATALOG[trade]?.elements[element]?.items || []).map((it) => (
                <option key={it} value={it}>{it}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Note / Description */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">Contractor Rectification Note:</label>
          <textarea
            rows={2}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
          />
        </div>

        {/* Photo Evidence with 4-Photo Ceiling */}
        <div className="space-y-2 border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Attached Evidence ({currentTotalPhotos}/4)
            </span>

            {currentTotalPhotos < 4 ? (
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition">
                <Plus className="w-4 h-4" />
                <span>Add Photo ({currentTotalPhotos}/4)</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={handleAddNewPhotos}
                  className="hidden"
                />
              </label>
            ) : (
              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                Photo limit reached (4/4)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {/* Existing Saved URLs */}
            {existingPhotos.map((url, idx) => (
              <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-300 bg-black">
                <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setExistingPhotos((prev) => prev.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center shadow"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Newly Selected Uploads */}
            {newPhotos.map((dataUrl, idx) => (
              <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border-2 border-dashed border-blue-500 bg-black">
                <img src={dataUrl} alt={`New upload ${idx + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 px-1.5 py-0.2 bg-blue-600 text-white text-[9px] font-bold rounded">
                  New
                </span>
                <button
                  type="button"
                  onClick={() => setNewPhotos((prev) => prev.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center shadow"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t">
          {/* Delete Record Button */}
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={isSaving}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Delete Record</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <UploadCloud className="w-4 h-4 animate-spin" />
                  <span>{syncStatus || "Saving..."}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}