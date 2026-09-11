// src/components/EditModal.jsx
import React, { useState, useMemo } from "react";
import { doc, updateDoc, deleteDoc, arrayUnion } from "firebase/firestore";
import { db, ZONE_OPTIONS, TRADE_CATALOG, ADMIN_EMAILS } from "../constants.jsx";
import { 
  X, 
  Trash2, 
  Save, 
  MapPin, 
  Layers, 
  AlertTriangle, 
  History,
  FileCheck
} from "lucide-react";

export default function EditModal({ defect, currentUser, onClose, onSaveComplete }) {
  if (!defect) return null;

  // 1. Role & Permission Checks
  const userEmail = currentUser?.email || "";
  const isAdmin = ADMIN_EMAILS.includes(userEmail);

  // 2. State: Location & Scope
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

  // 3. State: Defect Classification & Rectification Details
  const [trade, setTrade] = useState(defect.trade || "Civil & Structural");
  const [element, setElement] = useState(defect.element || Object.keys(TRADE_CATALOG[defect.trade || "Civil & Structural"]?.elements || {})[0] || "");
  const [item, setItem] = useState(defect.item || "");
  const [status, setStatus] = useState(defect.status || "Pending Rectification");
  const [severity, setSeverity] = useState(defect.severity || "Medium");
  const [desc, setDesc] = useState(defect.desc || "");
  const [photoUrls, setPhotoUrls] = useState(
    defect.photoUrls && defect.photoUrls.length > 0
      ? defect.photoUrls
      : [defect.photoUrl].filter(Boolean)
  );

  // 4. State: Revision Audit Reason
  const [editReason, setEditReason] = useState("Pembetulan Lokasi (Wrong Location Correction)");
  const [photoSubReason, setPhotoSubReason] = useState("Foto tambahan untuk perincian sedia ada");
  const [isSaving, setIsSaving] = useState(false);

  // Derive constructed location string
  const newLocationTag = useMemo(() => {
    let loc = "";
    switch (selectedZone) {
      case "Ground":
        loc = `[Ground Floor] ${groundArea}`;
        break;
      case "Carpark":
        loc = `[Podium Carpark ${carparkFloor}] ${carparkBay}`;
        break;
      case "Facility":
        loc = `[Level 8 Facilities] ${facilityArea}`;
        break;
      case "Residential": {
        const floorMatch = residentialFloor.match(/Level\s+(\w+)/);
        const floorName = floorMatch ? `Level ${floorMatch[1]} Residential` : residentialFloor;
        loc = `[${floorName}] ${residentialArea}`;
        break;
      }
      case "Staircase":
        loc = `[Emergency Staircase] ${staircaseWing} (${staircaseFlight})`;
        break;
      case "Rooftop":
        loc = `[Level 27 Rooftop] ${rooftopArea}`;
        break;
      default:
        loc = defect.location || "[Residensi Damai] Common Property";
    }

    if (landmarkNote.trim()) {
      return `${loc} • ${landmarkNote.trim()}`;
    }
    return loc;
  }, [selectedZone, groundArea, carparkFloor, carparkBay, facilityArea, residentialFloor, residentialArea, staircaseWing, staircaseFlight, rooftopArea, landmarkNote, defect.location]);

  // Derive current subLayer to update database filters
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

  // Handle Trade and Element changes
  const handleTradeChange = (newTrade) => {
    setTrade(newTrade);
    const elementKeys = Object.keys(TRADE_CATALOG[newTrade]?.elements || {});
    const firstElement = elementKeys[0] || "";
    setElement(firstElement);
    if (firstElement && TRADE_CATALOG[newTrade]?.elements[firstElement]) {
      setSeverity(TRADE_CATALOG[newTrade].elements[firstElement].defaultSeverity || "Medium");
      setItem(TRADE_CATALOG[newTrade].elements[firstElement].items[0] || "");
    }
  };

  const handleElementChange = (newElement) => {
    setElement(newElement);
    if (TRADE_CATALOG[trade]?.elements[newElement]) {
      setSeverity(TRADE_CATALOG[trade].elements[newElement].defaultSeverity || "Medium");
      setItem(TRADE_CATALOG[trade].elements[newElement].items[0] || "");
    }
  };

  // Remove photo locally
  const handleRemovePhoto = (indexToRemove) => {
    if (photoUrls.length <= 1) {
      alert("Defect mesti mempunyai sekurang-kurangnya 1 keping gambar bukti.");
      return;
    }
    setPhotoUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Save changes and commit compact audit trail
  const handleSave = async (e) => {
    e.preventDefault();
    if (photoUrls.length === 0) {
      alert("Defect mesti mempunyai sekurang-kurangnya 1 keping gambar bukti.");
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date();
      const timeString = now.toLocaleString("en-MY", {
        timeZone: "Asia/Kuala_Lumpur",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });

      const effectiveReason = editReason.includes("Kemaskini Bukti Foto")
        ? `${editReason} (${photoSubReason})`
        : editReason;

      const diffEntries = [];
      if (defect.location !== newLocationTag) {
        diffEntries.push(`Lokasi: '${defect.location}' ➔ '${newLocationTag}'`);
      }
      if (defect.status !== status) {
        diffEntries.push(`Status: ${defect.status} ➔ ${status}`);
      }
      if (defect.severity !== severity) {
        diffEntries.push(`Severity: ${defect.severity} ➔ ${severity}`);
      }
      if (defect.item !== item) {
        diffEntries.push(`Item: ${defect.item} ➔ ${item}`);
      }
      const oldPhotoCount = (defect.photoUrls || [defect.photoUrl].filter(Boolean)).length;
      if (oldPhotoCount !== photoUrls.length) {
        diffEntries.push(`Foto: ${oldPhotoCount} ➔ ${photoUrls.length}`);
      }

      const auditLog = `[${timeString} by ${userEmail}] • Sebab: ${effectiveReason}${
        diffEntries.length > 0 ? " • " + diffEntries.join(", ") : ""
      }`;

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
        photoUrls: photoUrls,
        photoUrl: photoUrls[0] || "",
        updatedAt: Date.now(),
        updatedBy: userEmail,
        editHistory: arrayUnion(auditLog)
      });

      setIsSaving(false);
      if (onSaveComplete) onSaveComplete();
      onClose();
    } catch (err) {
      console.error("Ralat mengemaskini dokumen:", err);
      alert("Gagal mengemaskini rekod: " + err.message);
      setIsSaving(false);
    }
  };

  // Delete defect with admin safeguard
  const handleDelete = async () => {
    if (!isAdmin) {
      alert("Hanya admin yang diberi kuasa sahaja dibenarkan memadam rekod ini.");
      return;
    }
    const confirmed = window.confirm("Adakah anda pasti mahu memadam rekod defect ini secara kekal?");
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "defects", defect.id));
      if (onSaveComplete) onSaveComplete();
      onClose();
    } catch (err) {
      console.error("Ralat memadam dokumen:", err);
      alert("Gagal memadam rekod: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
        
        {/* MODAL HEADER */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
              Edit Defect Record
            </span>
            <h2 className="text-sm font-extrabold text-slate-900 mt-1">
              ID: <span className="font-mono text-slate-600">{defect.id}</span>
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SCROLLABLE FORM BODY */}
        <form onSubmit={handleSave} className="space-y-4 py-4 overflow-y-auto flex-1 pr-1">
          
          {/* 1. COMPREHENSIVE LOCATION SELECTOR */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                Pilihan Kawasan / Lokasi Tapak
              </span>
              <span className="text-[10px] text-slate-400 italic">Boleh dikemaskini</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Zone Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">ZON UTAMA:</label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                >
                  {Object.keys(ZONE_OPTIONS).map((key) => (
                    <option key={key} value={key}>
                      {ZONE_OPTIONS[key].label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sub-Layer Floor / Wing Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">ARAS / SUB-KAWASAN:</label>
                {selectedZone === "Carpark" && (
                  <select
                    value={carparkFloor}
                    onChange={(e) => {
                      setCarparkFloor(e.target.value);
                      setCarparkBay(ZONE_OPTIONS.Carpark.baysByFloor[e.target.value]?.[0] || "");
                    }}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                  >
                    {ZONE_OPTIONS.Carpark.floors.map((fl) => (
                      <option key={fl} value={fl}>{fl}</option>
                    ))}
                  </select>
                )}

                {selectedZone === "Residential" && (
                  <select
                    value={residentialFloor}
                    onChange={(e) => setResidentialFloor(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                  >
                    {ZONE_OPTIONS.Residential.floors.map((fl) => (
                      <option key={fl} value={fl}>{fl}</option>
                    ))}
                  </select>
                )}

                {selectedZone === "Ground" && (
                  <select
                    value={groundArea}
                    onChange={(e) => setGroundArea(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                  >
                    {ZONE_OPTIONS.Ground.areas.map((ar) => (
                      <option key={ar} value={ar}>{ar}</option>
                    ))}
                  </select>
                )}

                {selectedZone === "Facility" && (
                  <select
                    value={facilityArea}
                    onChange={(e) => setFacilityArea(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                  >
                    {ZONE_OPTIONS.Facility.areas.map((ar) => (
                      <option key={ar} value={ar}>{ar}</option>
                    ))}
                  </select>
                )}

                {selectedZone === "Staircase" && (
                  <select
                    value={staircaseWing}
                    onChange={(e) => setStaircaseWing(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                  >
                    {ZONE_OPTIONS.Staircase.wings.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                )}

                {selectedZone === "Rooftop" && (
                  <select
                    value={rooftopArea}
                    onChange={(e) => setRooftopArea(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                  >
                    {ZONE_OPTIONS.Rooftop.areas.map((ar) => (
                      <option key={ar} value={ar}>{ar}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Secondary Bay / Flight Selector */}
            {selectedZone === "Carpark" && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">BAY / KAWASAN PARKIR:</label>
                <select
                  value={carparkBay}
                  onChange={(e) => setCarparkBay(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                >
                  {(ZONE_OPTIONS.Carpark.baysByFloor[carparkFloor] || []).map((bay) => (
                    <option key={bay} value={bay}>{bay}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Landmark Free Text */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Catatan Landmark / Perincian Khusus (Pilihan):
              </label>
              <input
                type="text"
                value={landmarkNote}
                onChange={(e) => setLandmarkNote(e.target.value)}
                placeholder="cth: Bersebelahan Tiang C-12 / Depan Pintu DB"
                className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800"
              />
            </div>

            <div className="text-[11px] bg-blue-50 text-blue-950 p-2 rounded-lg border border-blue-200">
              <strong>Preview Lokasi:</strong> {newLocationTag}
            </div>
          </div>

          {/* 2. STATUS & SEVERITY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">
                Status Pembaikan:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
              >
                <option value="Pending Rectification">Pending Rectification</option>
                <option value="In Progress">In Progress</option>
                <option value="Rectified / Closed">Rectified / Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">
                Tahap Keutamaan (Severity):
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High / Critical</option>
              </select>
            </div>
          </div>

          {/* 3. TRADE, ELEMENT & ITEM */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase text-slate-600">
              Klasifikasi Trade & Item Defect:
            </label>
            <select
              value={trade}
              onChange={(e) => handleTradeChange(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800"
            >
              {Object.keys(TRADE_CATALOG).map((tKey) => (
                <option key={tKey} value={tKey}>{tKey}</option>
              ))}
            </select>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={element}
                onChange={(e) => handleElementChange(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800"
              >
                {Object.keys(TRADE_CATALOG[trade]?.elements || {}).map((elKey) => (
                  <option key={elKey} value={elKey}>{elKey}</option>
                ))}
              </select>

              <select
                value={item}
                onChange={(e) => setItem(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800"
              >
                {(TRADE_CATALOG[trade]?.elements[element]?.items || []).map((it) => (
                  <option key={it} value={it}>{it}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. WORK INSTRUCTIONS */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">
              Arahan Pembaikan Kontraktor (Work Required):
            </label>
            <textarea
              rows="2"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
            />
          </div>

          {/* 5. ATTACHED EVIDENCE PHOTOS (WITH LOCAL REMOVAL) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-slate-600">
                Bukti Foto ({photoUrls.length}/4)
              </span>
              <span className="text-[10px] text-slate-400 italic">Tekan ikon tong sampah untuk padam</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {photoUrls.map((url, idx) => (
                <div key={idx} className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-300 shadow-xs group">
                  <img src={url} alt={`Defect ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow transition"
                    title="Padam Foto Ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 6. REASON FOR EDIT & AUDIT TRAIL LOGIC */}
          <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-300 space-y-2.5">
            <div className="flex items-center gap-1.5 text-amber-950">
              <History className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[11px] font-black uppercase tracking-wide">
                Sebab Pengemaskinian (Audit Trail Log)
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-amber-900 mb-1">
                Pilih Sebab Utama:
              </label>
              <select
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-amber-300 rounded-lg font-bold text-slate-800"
              >
                <option value="Pembetulan Lokasi (Wrong Location Correction)">
                  1. Pembetulan Lokasi (Salah tempat / Aras bertukar)
                </option>
                <option value="Kemaskini Bukti Foto (Update Photo Evidence)">
                  2. Kemaskini Bukti Foto (Tambah/Buang gambar)
                </option>
                <option value="Perubahan Status / Keutamaan (Status or Priority Update)">
                  3. Perubahan Status / Keutamaan (Status Update)
                </option>
                <option value="Pembetulan Deskripsi / Kategori (Description or Trade Correction)">
                  4. Pembetulan Deskripsi / Kategori (Description/Trade)
                </option>
                <option value="Lain-lain (Others)">
                  5. Lain-lain (Others)
                </option>
              </select>
            </div>

            {/* Sub-reason conditional display */}
            {editReason.includes("Kemaskini Bukti Foto") && (
              <div className="p-2.5 bg-white rounded-lg border border-amber-200 space-y-1.5">
                <span className="block text-[10px] font-black text-amber-900">
                  Perincian Kemaskini Foto:
                </span>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="photoSub"
                    value="Foto tambahan untuk perincian sedia ada"
                    checked={photoSubReason === "Foto tambahan untuk perincian sedia ada"}
                    onChange={(e) => setPhotoSubReason(e.target.value)}
                    className="text-blue-600"
                  />
                  <span>Gambar asal ditambah untuk perincian jelas</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="photoSub"
                    value="Kerosakan semakin melarat (Defect deteriorated)"
                    checked={photoSubReason === "Kerosakan semakin melarat (Defect deteriorated)"}
                    onChange={(e) => setPhotoSubReason(e.target.value)}
                    className="text-blue-600"
                  />
                  <span>Gambar baru kerana keadaan defect bertambah teruk</span>
                </label>
              </div>
            )}
          </div>

          {/* MODAL ACTIONS */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
            {isAdmin ? (
              <button
                type="button"
                onClick={handleDelete}
                className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-rose-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>Padam Rekod</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}