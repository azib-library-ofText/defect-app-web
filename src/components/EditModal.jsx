// src/components/EditModal.jsx
import React, { useState, useMemo } from "react";
import { doc, updateDoc, deleteDoc, arrayUnion } from "firebase/firestore";
import { db, ZONE_OPTIONS, TRADE_CATALOG, ADMIN_EMAILS } from "../constants.jsx";
import { 
  X, 
  Trash2, 
  Save, 
  MapPin, 
  History
} from "lucide-react";

export default function EditModal({ defect, currentUser, onClose, onSaveComplete }) {
  if (!defect) return null;

  const userEmail = currentUser?.email || "";
  const isAdmin = ADMIN_EMAILS.includes(userEmail);

  // State Pilihan Lokasi Penuh (Boleh Ubah Semula Dari Awal)
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
  const [photoUrls, setPhotoUrls] = useState(
    defect.photoUrls && defect.photoUrls.length > 0
      ? defect.photoUrls
      : [defect.photoUrl].filter(Boolean)
  );

  const [editReason, setEditReason] = useState("Pembetulan Lokasi (Wrong Location Correction)");
  const [photoSubReason, setPhotoSubReason] = useState("Foto tambahan untuk perincian sedia ada");
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async (e) => {
    e.preventDefault();
    if (photoUrls.length === 0) {
      alert("Mesti ada sekurang-kurangnya 1 keping foto.");
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date();
      const timeString = now.toLocaleString("en-MY", {
        timeZone: "Asia/Kuala_Lumpur",
        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
      });

      const auditLog = `[${timeString} by ${userEmail}] • Sebab: ${editReason} • Lokasi baru: '${newLocationTag}'`;

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
        photoUrls,
        photoUrl: photoUrls[0] || "",
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
    }
  };

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
                    onChange={(e) => setCarparkFloor(e.target.value)}
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

          {/* SEBAB EDIT */}
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
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
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="py-2.5 px-4 bg-slate-100 rounded-xl text-xs font-bold">
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow"
            >
              {isSaving ? "Menyimpan..." : "Simpan Perubahan Lokasi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
