// src/components/EditModal.jsx
import React, { useState, useMemo } from "react";
import { doc, updateDoc, deleteDoc, arrayUnion } from "firebase/firestore";
import { db, ZONE_OPTIONS, TRADE_CATALOG, ADMIN_EMAILS } from "../constants.jsx";
import { compressImage, uploadToCloudinary } from "../utils.js";
import { 
  X, 
  Trash2, 
  Save, 
  MapPin, 
  History,
  Camera,
  Image as ImageIcon,
  UploadCloud
} from "lucide-react";

export default function EditModal({ defect, currentUser, onClose, onSaveComplete }) {
  if (!defect) return null;

  const userEmail = currentUser?.email || "";
  const isAdmin = ADMIN_EMAILS.includes(userEmail);

  // State Pilihan Lokasi Penuh
  const [selectedZone, setSelectedZone] = useState(defect.zoneId || "Ground");
  const [groundArea, setGroundArea] = useState(defect.subLayer || ZONE_OPTIONS.Ground.areas[0]);
  const [carparkFloor, setCarparkFloor] = useState(defect.subLayer || ZONE_OPTIONS.Carpark.floors[0]);
  const [carparkBay, setCarparkBay] = useState(ZONE_OPTIONS.Carpark.baysByFloor["Level 1A"]?.[0] || "");
  const [facilityArea, setFacilityArea] = useState(defect.subLayer || ZONE_OPTIONS.Facility.areas[0]);
  const [residentialFloor, setResidentialFloor] = useState(defect.subLayer || ZONE_OPTIONS.Residential.floors[0]);
  const [residentialArea, setResidentialArea] = useState("Corridor & Lift Lobby Area");
  const [staircaseWing, setStaircaseWing] = useState(defect.subLayer || ZONE_OPTIONS.Staircase.wings[0]);
  const [staircaseFlight, setStaircaseFlight] = useState(ZONE_OPTIONS.Staircase.flights[1]);
  const [rooftopArea, setRooftopArea] = useState(defect.subLayer || ZONE_OPTIONS.Rooftop.areas[0]);
  const [landmarkNote, setLandmarkNote] = useState("");

  const [trade, setTrade] = useState(defect.trade || "Civil & Structural");
  const [element, setElement] = useState(defect.element || Object.keys(TRADE_CATALOG[defect.trade || "Civil & Structural"]?.elements || {})[0] || "");
  const [item, setItem] = useState(defect.item || "");
  const [status, setStatus] = useState(defect.status || "Pending Rectification");
  const [severity, setSeverity] = useState(defect.severity || "Medium");
  const [desc, setDesc] = useState(defect.desc || "");

  // Photo state
  const initialPhotos = defect.photoUrls && defect.photoUrls.length > 0
    ? defect.photoUrls
    : [defect.photoUrl].filter(Boolean);
  const [existingPhotos, setExistingPhotos] = useState(initialPhotos);
  const [newPhotos, setNewPhotos] = useState([]); // Base64 strings to be uploaded

  const [editReason, setEditReason] = useState("Pembetulan Lokasi (Wrong Location Correction)");
  const [photoSubReason, setPhotoSubReason] = useState("Foto tambahan untuk perincian sedia ada");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  // Bina semula nama lokasi baru sepenuhnya
  const newLocationTag = useMemo(() => {
    let loc = "";
    switch (selectedZone) {
      case "Ground": loc = `[Ground Floor] ${groundArea}`; break;
      case "Carpark": loc = `[Podium Carpark ${carparkFloor}] ${carparkBay}`; break;
      case "Facility": loc = `[Level 8 Facilities] ${facilityArea}`; break;
      case "Residential": {
        const floorMatch = residentialFloor.match(/Level\s+(\w+)/);
        const floorName = floorMatch ? `Level ${floorMatch[1]} Residential` : residentialFloor;
        loc = `[${floorName}] ${residentialArea}`;
        break;
      }
      case "Staircase": loc = `[Emergency Staircase] ${staircaseWing} (${staircaseFlight})`; break;
      case "Rooftop": loc = `[Level 27 Rooftop] ${rooftopArea}`; break;
      default: loc = defect.location || "[Residensi Damai] Common Property";
    }
    if (landmarkNote.trim()) return `${loc} • ${landmarkNote.trim()}`;
    return loc;
  }, [selectedZone, groundArea, carparkFloor, carparkBay, facilityArea, residentialFloor, residentialArea, staircaseWing, staircaseFlight, rooftopArea, landmarkNote, defect.location]);

  const currentSubLayer = useMemo(() => {
    switch (selectedZone) {
      case "Ground": return groundArea;
      case "Carpark": return carparkFloor;
      case "Facility": return facilityArea;
      case "Residential": return residentialFloor;
      case "Staircase": return staircaseWing;
      case "Rooftop": return rooftopArea;
      default: return selectedZone;
    }
  }, [selectedZone, groundArea, carparkFloor, facilityArea, residentialFloor, staircaseWing, rooftopArea]);

  // Handle Photo selection (Camera or Gallery)
  const handleAddNewPhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentTotal = existingPhotos.length + newPhotos.length;
    const availableSlots = 4 - currentTotal;

    if (availableSlots <= 0) {
      alert("Maksimum 4 keping foto dibenarkan bagi setiap defect.");
      e.target.value = "";
      return;
    }

    const filesToProcess = files.slice(0, availableSlots);

    for (const file of filesToProcess) {
      try {
        const compressed = await compressImage(file, 1600, 0.82);
        setNewPhotos((prev) => [...prev, compressed]);
      } catch (err) {
        console.error("Gagal memproses gambar:", err);
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

  const handleSave = async (e) => {
    e.preventDefault();
    const totalPhotos = existingPhotos.length + newPhotos.length;
    if (totalPhotos === 0) {
      alert("Mesti ada sekurang-kurangnya 1 keping foto.");
      return;
    }

    setIsSaving(true);
    setSaveStatus("Memuat naik foto baru...");

    try {
      // 1. Upload newly added local images
      const newlyUploadedUrls = [];
      for (let i = 0; i < newPhotos.length; i++) {
        setSaveStatus(`Memuat naik foto ${i + 1} daripada ${newPhotos.length}...`);
        const url = await uploadToCloudinary(newPhotos[i]);
        newlyUploadedUrls.push(url);
      }

      const finalPhotoUrls = [...existingPhotos, ...newlyUploadedUrls];

      const now = new Date();
      const timeString = now.toLocaleString("en-MY", {
        timeZone: "Asia/Kuala_Lumpur",
        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
      });

      const effectiveReason = editReason.includes("Kemaskini Bukti Foto")
        ? `${editReason} (${photoSubReason})`
        : editReason;

      const auditLog = `[${timeString} by ${userEmail}] • Sebab: ${effectiveReason} • Lokasi baru: '${newLocationTag}'`;

      const defectRef = doc(db, "defects", defect.id);
      await updateDoc(defectRef, {
        location: newLocationTag,
        zoneId: selectedZone,
        subLayer: currentSubLayer,
        trade,
        element,
        item,
        status,
        severity,
        desc: desc.trim(),
        photoUrls: finalPhotoUrls,
        photoUrl: finalPhotoUrls[0] || "",
        updatedAt: Date.now(),
        updatedBy: userEmail,
        editHistory: arrayUnion(auditLog)
      });

      setIsSaving(false);
      if (onSaveComplete) onSaveComplete();
      onClose();
    } catch (err) {
      alert("Gagal mengemaskini rekod: " + err.message);
      setIsSaving(false);
      setSaveStatus("");
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      alert("Hanya admin dibenarkan memadam rekod ini.");
      return;
    }
    const confirmed = window.confirm("Adakah anda pasti mahu memadam rekod defect ini?");
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "defects", defect.id));
      if (onSaveComplete) onSaveComplete();
      onClose();
    } catch (err) {
      alert("Gagal memadam rekod: " + err.message);
    }
  };

  const totalPhotoCount = existingPhotos.length + newPhotos.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
        <div className="flex justify-between items-start border-b border-slate-200 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
              Edit Defect Record
            </span>
            <h2 className="text-sm font-extrabold text-slate-900 mt-1">
              ID: <span className="font-mono text-slate-600">{defect.id}</span>
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 py-4 overflow-y-auto flex-1 pr-1">
          {/* UBAH LOKASI PENUH */}
          <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200 space-y-3">
            <span className="text-[11px] font-black uppercase text-blue-900 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Tukar Lokasi / Zon (Boleh Pilih Semula Dari Mula)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">ZON UTAMA:</label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                >
                  {Object.keys(ZONE_OPTIONS).map((key) => (
                    <option key={key} value={key}>{ZONE_OPTIONS[key].label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">ARAS / KAWASAN:</label>
                {selectedZone === "Carpark" && (
                  <select
                    value={carparkFloor}
                    onChange={(e) => {
                      setCarparkFloor(e.target.value);
                      setCarparkBay(ZONE_OPTIONS.Carpark.baysByFloor[e.target.value]?.[0] || "");
                    }}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold"
                  >
                    {ZONE_OPTIONS.Carpark.floors.map((fl) => <option key={fl} value={fl}>{fl}</option>)}
                  </select>
                )}
                {selectedZone === "Residential" && (
                  <select
                    value={residentialFloor}
                    onChange={(e) => setResidentialFloor(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold"
                  >
                    {ZONE_OPTIONS.Residential.floors.map((fl) => <option key={fl} value={fl}>{fl}</option>)}
                  </select>
                )}
                {selectedZone === "Ground" && (
                  <select
                    value={groundArea}
                    onChange={(e) => setGroundArea(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold"
                  >
                    {ZONE_OPTIONS.Ground.areas.map((ar) => <option key={ar} value={ar}>{ar}</option>)}
                  </select>
                )}
                {selectedZone === "Facility" && (
                  <select
                    value={facilityArea}
                    onChange={(e) => setFacilityArea(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold"
                  >
                    {ZONE_OPTIONS.Facility.areas.map((ar) => <option key={ar} value={ar}>{ar}</option>)}
                  </select>
                )}
                {selectedZone === "Staircase" && (
                  <select
                    value={staircaseWing}
                    onChange={(e) => setStaircaseWing(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold"
                  >
                    {ZONE_OPTIONS.Staircase.wings.map((w) => <option key={w} value={w}>{w}</option>)}
                  </select>
                )}
                {selectedZone === "Rooftop" && (
                  <select
                    value={rooftopArea}
                    onChange={(e) => setRooftopArea(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold"
                  >
                    {ZONE_OPTIONS.Rooftop.areas.map((ar) => <option key={ar} value={ar}>{ar}</option>)}
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">CATATAN LANDMARK KHUSUS:</label>
              <input
                type="text"
                value={landmarkNote}
                onChange={(e) => setLandmarkNote(e.target.value)}
                placeholder="cth: Tiang C-12 / Sebelah DB Box"
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-semibold"
              />
            </div>

            <div className="text-[11px] bg-white p-2 rounded-lg border border-blue-300 text-blue-950 font-bold">
              Lokasi Baru: {newLocationTag}
            </div>
          </div>

          {/* STATUS & SEVERITY */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">Status:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
              >
                <option value="Pending Rectification">Pending Rectification</option>
                <option value="In Progress">In Progress</option>
                <option value="Rectified / Closed">Rectified / Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">Severity:</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High / Critical</option>
              </select>
            </div>
          </div>

          {/* ARAHAN */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">Arahan Pembaikan:</label>
            <textarea
              rows="2"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            />
          </div>

          {/* PHOTO EVIDENCE: GALLERY + CAMERA CHOOSER */}
          <div className="border border-slate-200 p-3 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-slate-700">
                Bukti Foto ({totalPhotoCount}/4)
              </span>
              <span className="text-[10px] text-slate-400">Maksimum 4 foto</span>
            </div>

            {/* Photo Thumbnails */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {existingPhotos.map((url, idx) => (
                <div key={`existing-${idx}`} className="relative aspect-video rounded-lg overflow-hidden border border-slate-300 bg-black">
                  <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingPhoto(idx)}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md hover:bg-rose-700"
                    title="Padam Foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {newPhotos.map((dataUrl, idx) => (
                <div key={`new-${idx}`} className="relative aspect-video rounded-lg overflow-hidden border-2 border-dashed border-blue-500 bg-black">
                  <img src={dataUrl} alt={`New upload ${idx + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 bg-blue-600 text-white px-1 text-[9px] font-bold rounded">Baru</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveNewPhoto(idx)}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md hover:bg-rose-700"
                    title="Padam Foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Upload Action Buttons: Distinct Camera & Gallery Triggers */}
            {totalPhotoCount < 4 ? (
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {/* 1. Camera Trigger */}
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Ambil Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleAddNewPhotos}
                    className="hidden"
                  />
                </label>

                {/* 2. Gallery Trigger (No capture attribute allows system file/gallery chooser) */}
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Pilih Dari Galeri</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAddNewPhotos}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="text-[11px] text-amber-700 font-bold bg-amber-50 border border-amber-200 py-1.5 px-2.5 rounded-lg inline-block">
                Had maksimum 4 foto telah dicapai
              </div>
            )}
          </div>

          {/* SEBAB EDIT */}
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-2">
            <label className="block text-[10px] font-black uppercase text-amber-900 mb-1">Sebab Pengemaskinian:</label>
            <select
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              className="w-full text-xs p-2 bg-white border border-amber-300 rounded-lg font-bold"
            >
              <option value="Pembetulan Lokasi (Wrong Location Correction)">1. Pembetulan Lokasi (Salah tingkat / zon)</option>
              <option value="Kemaskini Bukti Foto (Update Photos)">2. Kemaskini Bukti Foto</option>
              <option value="Perubahan Status (Status Update)">3. Perubahan Status Pembaikan</option>
            </select>

            {editReason.includes("Kemaskini Bukti Foto") && (
              <div className="p-2 bg-white rounded-lg border border-amber-200 space-y-1">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="modalPhotoSub"
                    value="Foto tambahan untuk perincian sedia ada"
                    checked={photoSubReason === "Foto tambahan untuk perincian sedia ada"}
                    onChange={(e) => setPhotoSubReason(e.target.value)}
                    className="text-blue-600"
                  />
                  <span>Foto tambahan untuk perincian sedia ada</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="modalPhotoSub"
                    value="Kerosakan semakin melarat (Defect deteriorated)"
                    checked={photoSubReason === "Kerosakan semakin melarat (Defect deteriorated)"}
                    onChange={(e) => setPhotoSubReason(e.target.value)}
                    className="text-blue-600"
                  />
                  <span>Kerosakan semakin melarat (Defect deteriorated)</span>
                </label>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-2 flex items-center justify-between gap-2">
            {isAdmin ? (
              <button
                type="button"
                onClick={handleDelete}
                className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Padam Rekod</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="py-2.5 px-4 bg-slate-100 rounded-xl text-xs font-bold">
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow flex items-center gap-1.5"
              >
                {isSaving ? (
                  <>
                    <UploadCloud className="w-4 h-4 animate-spin" />
                    <span>{saveStatus || "Menyimpan..."}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}