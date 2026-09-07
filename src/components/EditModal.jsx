// src/components/EditModal.jsx
import React, { useState } from "react";
import { X, Trash2, Plus, UploadCloud, Check, History } from "lucide-react";
import { TRADE_CATALOG, ADMIN_EMAILS, db } from "../constants.jsx";
import { compressImage, uploadToImgBB, generateAuditDiff } from "../utils.js";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

export default function EditModal({ defect, currentUser, onClose, onSaveComplete }) {
  const [trade, setTrade] = useState(defect.trade || "Civil & Structural");
  const [element, setElement] = useState(defect.element || Object.keys(TRADE_CATALOG[defect.trade || "Civil & Structural"].elements)[0]);
  const [item, setItem] = useState(defect.item || "");
  const [severity, setSeverity] = useState(defect.severity || "Medium");
  const [status, setStatus] = useState(defect.status || "Pending Rectification");
  const [location, setLocation] = useState(defect.location || "");
  const [desc, setDesc] = useState(defect.desc || "");
  
  const [existingPhotos, setExistingPhotos] = useState(
    Array.isArray(defect.photoUrls) && defect.photoUrls.length > 0
      ? defect.photoUrls
      : defect.photoUrl ? [defect.photoUrl] : []
  );
  const [newPhotos, setNewPhotos] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const isAdmin = ADMIN_EMAILS.includes(currentUser?.email?.toLowerCase());

  const handleTradeChange = (newTrade) => {
    setTrade(newTrade);
    const firstElement = Object.keys(TRADE_CATALOG[newTrade].elements)[0];
    setElement(firstElement);
    setItem(TRADE_CATALOG[newTrade].elements[firstElement].items[0]);
  };

  const handleElementChange = (newElem) => {
    setElement(newElem);
    setItem(TRADE_CATALOG[trade].elements[newElem].items[0]);
  };

  const handleAddNewPhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      try {
        const compressed = await compressImage(file, 800, 0.6);
        setNewPhotos((prev) => [...prev, compressed]);
      } catch (err) {
        console.error("Image load failed:", err);
      }
    }
    e.target.value = "";
  };

  const handleRemoveExistingPhoto = (idx) => {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveNewPhoto = (idx) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (existingPhotos.length === 0 && newPhotos.length === 0) {
      alert("A defect must retain at least one photo.");
      return;
    }

    setIsSaving(true);
    setSaveStatus("Uploading new photos to ImgBB CDN...");

    try {
      const newlyUploadedUrls = [];
      for (let i = 0; i < newPhotos.length; i++) {
        setSaveStatus(`Uploading image ${i + 1} of ${newPhotos.length}...`);
        const url = await uploadToImgBB(newPhotos[i]);
        newlyUploadedUrls.push(url);
      }

      const finalPhotoUrls = [...existingPhotos, ...newlyUploadedUrls];

      const updatedFields = {
        trade,
        element,
        item,
        severity,
        status,
        location: location.trim(),
        desc: desc.trim(),
        photoUrls: finalPhotoUrls,
        photoUrl: finalPhotoUrls[0] || "",
        lastEditedAt: Date.now(),
        lastEditedBy: currentUser?.email || "Unknown"
      };

      const auditEntry = generateAuditDiff(defect, updatedFields, currentUser?.email);
      const docRef = doc(db, "defects", defect.id);

      if (auditEntry) {
        await updateDoc(docRef, {
          ...updatedFields,
          editHistory: arrayUnion(auditEntry)
        });
      } else {
        await updateDoc(docRef, updatedFields);
      }

      onSaveComplete();
    } catch (err) {
      console.error("Save error:", err);
      alert(`Update failed: ${err.message}`);
    } finally {
      setIsSaving(false);
      setSaveStatus("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 space-y-4 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Edit Defect Record</h3>
            <p className="text-xs text-slate-400 font-mono">ID: {defect.id}</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Trade Discipline:</label>
              <select
                value={trade}
                onChange={(e) => handleTradeChange(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
              >
                {Object.keys(TRADE_CATALOG).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Inspection Element:</label>
              <select
                value={element}
                onChange={(e) => handleElementChange(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
              >
                {Object.keys(TRADE_CATALOG[trade].elements).map((el) => <option key={el} value={el}>{el}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Defect Item / Symptom:</label>
            <select
              value={item}
              onChange={(e) => setItem(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            >
              {(TRADE_CATALOG[trade].elements[element]?.items || []).map((it) => (
                <option key={it} value={it}>{it}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Location Tag:</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Severity:</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
              >
                <option value="Pending Rectification">Pending Rectification</option>
                <option value="In Progress">In Progress</option>
                <option value="Rectified">Rectified</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Rectification Note:</label>
            <textarea
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Defect Photos ({existingPhotos.length + newPhotos.length} Total):
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
              {existingPhotos.map((url, i) => (
                <div key={`exist_${i}`} className="relative group aspect-video rounded-xl overflow-hidden border border-slate-300 bg-slate-100">
                  <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingPhoto(i)}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md shadow hover:bg-rose-700"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white px-1 rounded text-[9px] font-bold">
                    CDN
                  </span>
                </div>
              ))}

              {newPhotos.map((dataUrl, i) => (
                <div key={`new_${i}`} className="relative group aspect-video rounded-xl overflow-hidden border border-blue-400 bg-slate-100">
                  <img src={dataUrl} alt="New" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveNewPhoto(i)}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md shadow hover:bg-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-blue-600 text-white px-1 rounded text-[9px] font-bold">
                    New
                  </span>
                </div>
              ))}
            </div>

            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition">
              <Plus className="w-4 h-4" />
              <span>Add Additional Photos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={handleAddNewPhotos}
                className="hidden"
              />
            </label>
          </div>

          {isAdmin && (
            <div className="pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600"
              >
                <History className="w-4 h-4" />
                <span>{showHistory ? "Hide Admin Audit Log" : "View Admin Audit Log"} ({(defect.editHistory || []).length} edits)</span>
              </button>

              {showHistory && (
                <div className="mt-2 p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono space-y-1 max-h-40 overflow-y-auto">
                  {(!defect.editHistory || defect.editHistory.length === 0) ? (
                    <p className="text-slate-400">No modification records on file for this document.</p>
                  ) : (
                    defect.editHistory.map((entry, idx) => (
                      <div key={idx} className="border-b border-slate-800 pb-1 last:border-none">
                        {entry}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <UploadCloud className="w-4 h-4 animate-spin" />
                <span>{saveStatus || "Saving..."}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Changes & Log History</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
