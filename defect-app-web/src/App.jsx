// src/App.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, doc, onSnapshot, query } from "firebase/firestore";
import { 
  auth, 
  db, 
  PROJECT_CONFIG, 
  TRADE_CATALOG, 
  ZONE_OPTIONS 
} from "./constants.jsx";
import { uploadToCloudinary } from "./services/imageUpload.js";

// Sub-components
import Annotator from "./components/Annotator.jsx";
import EditModal from "./components/EditModal.jsx";
import ReportGenerator from "./components/ReportGenerator.jsx";
import SettingsModal from "./components/SettingsModal.jsx";

// Icons
import {
  Camera,
  Layers,
  MapPin,
  Building2,
  SlidersHorizontal,
  UploadCloud,
  Check,
  Plus,
  Eye,
  LogOut,
  Building,
  Search,
  FileText,
  Users,
  X,
  Edit3,
  ListOrdered,
  Grid,
  ChevronRight,
  FolderSearch,
  Settings as SettingsIcon,
  ShieldAlert
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("records");
  const [defects, setDefects] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState("");

  const [showBottomNav, setShowBottomNav] = useState(true);
  const lastScrollY = useRef(0);

  // Inspector Profile & App Settings
  const [inspectorTag, setInspectorTag] = useState("Residensi Damai");
  const [inspectorRole, setInspectorRole] = useState("Building Supervisor");
  const [photoQuality, setPhotoQuality] = useState("standard");
  const [siteLanguage, setSiteLanguage] = useState("bi");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Form selections
  const [selectedZone, setSelectedZone] = useState("Ground");
  const [groundArea, setGroundArea] = useState(ZONE_OPTIONS.Ground.areas[0]);
  const [carparkFloor, setCarparkFloor] = useState(ZONE_OPTIONS.Carpark.floors[0]);
  const [carparkBay, setCarparkBay] = useState(ZONE_OPTIONS.Carpark.baysByFloor["Level 1A"][0]);
  const [facilityArea, setFacilityArea] = useState(ZONE_OPTIONS.Facility.areas[0]);
  const [residentialFloor, setResidentialFloor] = useState(ZONE_OPTIONS.Residential.floors[0]);
  const [residentialArea, setResidentialArea] = useState("Corridor & Lift Lobby Area");
  const [staircaseWing, setStaircaseWing] = useState(ZONE_OPTIONS.Staircase.wings[0]);
  const [staircaseFlight, setStaircaseFlight] = useState(ZONE_OPTIONS.Staircase.flights[1]);
  const [rooftopArea, setRooftopArea] = useState(ZONE_OPTIONS.Rooftop.areas[0]);
  const [specificLandmarkNote, setSpecificLandmarkNote] = useState("");

  const [selectedTrade, setSelectedTrade] = useState("Civil & Structural");
  const [selectedElement, setSelectedElement] = useState("Structural Integrity (Struktur)");
  const [selectedItem, setSelectedItem] = useState(
    TRADE_CATALOG["Civil & Structural"].elements["Structural Integrity (Struktur)"].items[0]
  );
  const [severity, setSeverity] = useState("High");
  const [customDescription, setCustomDescription] = useState("");

  // Captured photos & modals
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [annotatingPhotoIndex, setAnnotatingPhotoIndex] = useState(null);
  const [editingDefect, setEditingDefect] = useState(null);
  const [modalImageGallery, setModalImageGallery] = useState({ images: [], index: 0 });

  // Register Filters & 2-Tier Drilling
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [groupByMode, setGroupByMode] = useState("chronological");
  const [activeMainZone, setActiveMainZone] = useState(null);
  const [activeSubZone, setActiveSubZone] = useState(null);

  // 1. Initialize Profile from LocalStorage & Firebase Auth
  useEffect(() => {
    const savedName = localStorage.getItem("damai_inspector_name");
    const savedRole = localStorage.getItem("damai_inspector_role");
    const savedQuality = localStorage.getItem("damai_photo_quality");
    const savedLang = localStorage.getItem("damai_site_lang");

    if (savedName) setInspectorTag(savedName);
    if (savedRole) setInspectorRole(savedRole);
    if (savedQuality) setPhotoQuality(savedQuality);
    if (savedLang) setSiteLanguage(savedLang);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!savedName && currentUser?.displayName) {
        setInspectorTag(currentUser.displayName);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore Sync
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "defects"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => items.push({ id: docSnap.id, ...docSnap.data() }));
      items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setDefects(items);
    });
    return () => unsubscribe();
  }, [user]);

  // 3. Auto-hide bottom dock on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY.current;
      if (diff > 8 && currentScrollY > 15) setShowBottomNav(false);
      else if (diff < -8 || currentScrollY <= 10) setShowBottomNav(true);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Dynamic Location String
  const targetLocationTag = useMemo(() => {
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
      default: loc = "[Residensi Damai] Common Property";
    }
    if (specificLandmarkNote.trim()) {
      return `${loc} • ${specificLandmarkNote.trim()}`;
    }
    return loc;
  }, [selectedZone, groundArea, carparkFloor, carparkBay, facilityArea, residentialFloor, residentialArea, staircaseWing, staircaseFlight, rooftopArea, specificLandmarkNote]);

  // Max photo slot based on quality
  const maxAllowedPhotos = photoQuality === "hd" ? 2 : 4;

  const handleAddPhotos = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const availableSlots = maxAllowedPhotos - capturedPhotos.length;
    if (availableSlots <= 0) {
      alert(`Had foto tercapai (Maksimum ${maxAllowedPhotos} foto untuk Mod ${photoQuality.toUpperCase()}).`);
      e.target.value = "";
      return;
    }

    const filesToProcess = files.slice(0, availableSlots);
    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedPhotos((prev) => [
          ...prev,
          {
            id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            file,
            dataUrl: event.target.result,
            annotated: false,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleTradeSelect = (tradeName) => {
    setSelectedTrade(tradeName);
    const elementKeys = Object.keys(TRADE_CATALOG[tradeName].elements);
    setSelectedElement(elementKeys[0]);
    setSeverity(TRADE_CATALOG[tradeName].elements[elementKeys[0]].defaultSeverity);
    setSelectedItem(TRADE_CATALOG[tradeName].elements[elementKeys[0]].items[0]);
  };

  const handleElementSelect = (elementName) => {
    setSelectedElement(elementName);
    setSeverity(TRADE_CATALOG[selectedTrade].elements[elementName].defaultSeverity);
    setSelectedItem(TRADE_CATALOG[selectedTrade].elements[elementName].items[0]);
  };

  // Submit Defect
  const handleSaveDefect = async () => {
    if (capturedPhotos.length === 0) {
      alert("Sila sertakan sekurang-kurangnya 1 foto bukti.");
      return;
    }

    setIsSyncing(true);
    setSyncStatusText("Memampatkan & memuat naik foto...");

    try {
      const isHD = photoQuality === "hd";
      const uploadedUrls = [];

      for (let i = 0; i < capturedPhotos.length; i++) {
        setSyncStatusText(`Memuat naik foto ${i + 1}/${capturedPhotos.length}...`);
        const item = capturedPhotos[i];
        const cloudUrl = await uploadToCloudinary(item.dataUrl, isHD);
        uploadedUrls.push(cloudUrl);
      }

      setSyncStatusText("Menyimpan ke pangkalan data...");
      const now = new Date();
      const timeString = now.toLocaleDateString("en-MY", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      let subLayer = selectedZone;
      if (selectedZone === "Carpark") subLayer = carparkFloor;
      if (selectedZone === "Residential") subLayer = residentialFloor;
      if (selectedZone === "Ground") subLayer = groundArea;
      if (selectedZone === "Facility") subLayer = facilityArea;
      if (selectedZone === "Staircase") subLayer = staircaseWing;
      if (selectedZone === "Rooftop") subLayer = rooftopArea;

      await addDoc(collection(db, "defects"), {
        location: targetLocationTag,
        zoneId: selectedZone,
        subLayer,
        trade: selectedTrade,
        element: selectedElement,
        item: selectedItem,
        severity,
        status: "Pending Rectification",
        desc: customDescription.trim() || "Defect rectification required.",
        photoUrls: uploadedUrls,
        photoUrl: uploadedUrls[0] || "",
        date: timeString,
        createdAt: Date.now(),
        createdBy: user?.email || "Inspector",
        inspectorName: inspectorTag,
        inspectorRole,
        editHistory: [],
      });

      // Reset
      setCapturedPhotos([]);
      setCustomDescription("");
      setSpecificLandmarkNote("");
      setIsSyncing(false);
      setSyncStatusText("");
      setActiveTab("records");
    } catch (err) {
      console.error(err);
      alert("Ralat semasa menyimpan: " + err.message);
      setIsSyncing(false);
      setSyncStatusText("");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
        Memuatkan DefectLog Pro...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl mx-auto flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-500/30">
            RD
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-tight">
              {PROJECT_CONFIG.buildingName}
            </h1>
            <p className="text-xs text-slate-400 mt-1">DLP Defect & Joint Inspection Management</p>
          </div>
          <button
            onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition"
          >
            <span>Log Masuk Akaun Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white px-4 py-3 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">
            RD
          </div>
          <div>
            <h1 className="text-xs font-black uppercase tracking-tight leading-tight">
              {PROJECT_CONFIG.buildingName}
            </h1>
            <p className="text-[10px] text-slate-400">
              {inspectorTag} • <span className="text-blue-400">{inspectorRole}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
            title="Tetapan Profil & HD"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => signOut(auth)}
            className="p-2 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 rounded-lg transition"
            title="Log Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto p-4">
        
        {/* TAB 1: LOG DEFECT FORM */}
        {activeTab === "form" && (
          <div className="bg-white rounded-2xl p-5 border border-slate-300 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  Daftar Kecacatan Baru
                </h2>
                <p className="text-[11px] text-slate-500">Pilih kawasan dan lampirkan bukti foto tapak</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200 uppercase">
                Mod {photoQuality.toUpperCase()}
              </span>
            </div>

            {/* Location Selectors */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <span className="text-[10px] font-black uppercase text-slate-600 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                Lokasi Tapak (Location Scope)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">ZON UTAMA:</label>
                  <select
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                  >
                    {Object.keys(ZONE_OPTIONS).map((key) => (
                      <option key={key} value={key}>{ZONE_OPTIONS[key].label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">ARAS / KAWASAN:</label>
                  {selectedZone === "Carpark" && (
                    <select
                      value={carparkFloor}
                      onChange={(e) => {
                        setCarparkFloor(e.target.value);
                        setCarparkBay(ZONE_OPTIONS.Carpark.baysByFloor[e.target.value]?.[0] || "");
                      }}
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
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
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
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
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
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
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
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
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
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
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                    >
                      {ZONE_OPTIONS.Rooftop.areas.map((ar) => (
                        <option key={ar} value={ar}>{ar}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {selectedZone === "Carpark" && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">BAY / KAWASAN PARKIR:</label>
                  <select
                    value={carparkBay}
                    onChange={(e) => setCarparkBay(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                  >
                    {(ZONE_OPTIONS.Carpark.baysByFloor[carparkFloor] || []).map((bay) => (
                      <option key={bay} value={bay}>{bay}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                  Catatan Landmark (Pilihan):
                </label>
                <input
                  type="text"
                  value={specificLandmarkNote}
                  onChange={(e) => setSpecificLandmarkNote(e.target.value)}
                  placeholder="cth: Tiang C-12 / Depan DB Box"
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800"
                />
              </div>

              <div className="text-[11px] bg-blue-50 text-blue-900 p-2 rounded-lg border border-blue-200">
                <strong>Tag Lokasi:</strong> {targetLocationTag}
              </div>
            </div>

            {/* Trade & Element Catalog */}
            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase text-slate-600">
                Klasifikasi Trade:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.keys(TRADE_CATALOG).map((tKey) => (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => handleTradeSelect(tKey)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      selectedTrade === tKey
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span className="block text-xs font-black">{tKey}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">ELEMEN:</label>
                  <select
                    value={selectedElement}
                    onChange={(e) => handleElementSelect(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800"
                  >
                    {Object.keys(TRADE_CATALOG[selectedTrade].elements).map((elKey) => (
                      <option key={elKey} value={elKey}>{elKey}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">JENIS KECACATAN:</label>
                  <select
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800"
                  >
                    {(TRADE_CATALOG[selectedTrade].elements[selectedElement]?.items || []).map((it) => (
                      <option key={it} value={it}>{it}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Severity & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">
                  Keutamaan (Severity):
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High / Critical</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black uppercase text-slate-600 mb-1">
                  Arahan Pembaikan Kontraktor:
                </label>
                <input
                  type="text"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="cth: Hack & patch semula menggunakan kalis air Sika"
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
                />
              </div>
            </div>

            {/* Photo Capture Section */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase text-slate-900 block">
                    Lampiran Bukti Foto ({capturedPhotos.length}/{maxAllowedPhotos})
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {photoQuality === "hd" ? "Mod HD Aktif (Maks 2 Foto Retak Halus)" : "Mod Standard (Maks 4 Foto)"}
                  </span>
                </div>

                {capturedPhotos.length < maxAllowedPhotos && (
                  <label className="cursor-pointer py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition">
                    <Camera className="w-4 h-4" />
                    <span>Ambil Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      onChange={handleAddPhotos}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {photoQuality === "hd" && (
                <div className="flex items-center gap-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px]">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Mod HD diaktifkan di Settings. Had dihadkan kepada 2 foto berkualiti tinggi.</span>
                </div>
              )}

              {/* Photos Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {capturedPhotos.map((p, idx) => (
                  <div key={p.id} className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-300 shadow-xs group">
                    <img src={p.dataUrl} alt={`Snap ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAnnotatingPhotoIndex(idx)}
                        className="p-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold"
                        title="Tanda Bulatan Merah"
                      >
                        Tanda
                      </button>
                      <button
                        type="button"
                        onClick={() => setCapturedPhotos((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 bg-rose-600 text-white rounded-lg text-[10px] font-bold"
                        title="Padam"
                      >
                        Padam
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-slate-200">
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleSaveDefect}
                className="w-full py-3.5 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSyncing ? (
                  <span>{syncStatusText}</span>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Simpan & Sahkan Defect</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: MASTER REGISTER RECORDS */}
        {activeTab === "records" && (
          <div className="space-y-4">
            {/* 2-Tier Zone Selector Chips */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-300 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-500">Tapis Mengikut Zon Tapak:</span>
                {activeMainZone && (
                  <button
                    onClick={() => { setActiveMainZone(null); setActiveSubZone(null); }}
                    className="text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    Reset Tapisan
                  </button>
                )}
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => { setActiveMainZone("ALL"); setActiveSubZone(null); }}
                  className={`py-1.5 px-3 rounded-xl text-xs font-black whitespace-nowrap transition ${
                    activeMainZone === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Semua ({defects.length})
                </button>
                {Object.keys(ZONE_OPTIONS).map((zKey) => {
                  const count = defects.filter((d) => d.zoneId === zKey).length;
                  return (
                    <button
                      key={zKey}
                      onClick={() => { setActiveMainZone(zKey); setActiveSubZone(null); }}
                      className={`py-1.5 px-3 rounded-xl text-xs font-black whitespace-nowrap transition ${
                        activeMainZone === zKey ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {ZONE_OPTIONS[zKey].label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Sub-layer chips if a zone is active */}
              {activeMainZone && activeMainZone !== "ALL" && (
                <div className="pt-2 border-t border-slate-100 flex gap-1.5 overflow-x-auto">
                  {(ZONE_OPTIONS[activeMainZone]?.floors || ZONE_OPTIONS[activeMainZone]?.areas || []).map((sub) => {
                    const count = defects.filter((d) => d.subLayer === sub || (d.location || "").includes(sub)).length;
                    return (
                      <button
                        key={sub}
                        onClick={() => setActiveSubZone(activeSubZone === sub ? null : sub)}
                        className={`py-1 px-2.5 rounded-lg text-[11px] font-bold whitespace-nowrap border transition ${
                          activeSubZone === sub
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {sub} ({count})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* List of Defects */}
            <div className="space-y-3">
              {defects
                .filter((d) => {
                  if (!activeMainZone) return true;
                  if (activeMainZone !== "ALL" && d.zoneId !== activeMainZone) return false;
                  if (activeSubZone && d.subLayer !== activeSubZone && !(d.location || "").includes(activeSubZone)) return false;
                  return true;
                })
                .map((defect) => (
                  <div
                    key={defect.id}
                    className="bg-white rounded-2xl p-4 border border-slate-300 shadow-sm flex flex-col sm:flex-row gap-4 justify-between"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          #{defect.id.substring(0, 7)}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          defect.severity === "High"
                            ? "bg-rose-100 text-rose-800 border-rose-200"
                            : "bg-amber-100 text-amber-800 border-amber-200"
                        }`}>
                          {defect.severity}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          {defect.status}
                        </span>
                      </div>

                      <h3 className="text-xs font-black text-slate-900">{defect.item}</h3>
                      <p className="text-[11px] text-slate-600 font-medium">{defect.location}</p>
                      {defect.desc && (
                        <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                          {defect.desc}
                        </p>
                      )}
                    </div>

                    <div className="flex sm:flex-col justify-between items-end gap-2 shrink-0">
                      {/* Photo Thumbnail */}
                      <div
                        onClick={() => setModalImageGallery({
                          images: defect.photoUrls || [defect.photoUrl].filter(Boolean),
                          index: 0
                        })}
                        className="w-20 h-14 bg-slate-900 rounded-lg overflow-hidden border border-slate-300 cursor-pointer shadow-xs"
                      >
                        <img
                          src={(defect.photoUrls && defect.photoUrls[0]) || defect.photoUrl}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <button
                        onClick={() => setEditingDefect(defect)}
                        className="py-1.5 px-3 bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 text-xs font-bold rounded-xl border border-slate-300 transition flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Kemas Kini</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 3: REPORT GENERATOR */}
        {activeTab === "report" && (
          <ReportGenerator
            defects={defects}
            inspectorTag={inspectorTag}
            onOpenGallery={(images, index) => setModalImageGallery({ images, index })}
          />
        )}

      </main>

      {/* Bottom Navigation Dock */}
      {showBottomNav && (
        <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 bg-slate-950/90 backdrop-blur-md text-white px-3 py-1.5 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-1">
          <button
            onClick={() => setActiveTab("form")}
            className={`py-2 px-4 rounded-xl text-xs font-black flex items-center gap-2 transition ${
              activeTab === "form" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Daftar Defect</span>
          </button>

          <button
            onClick={() => setActiveTab("records")}
            className={`py-2 px-4 rounded-xl text-xs font-black flex items-center gap-2 transition ${
              activeTab === "records" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Daftar Induk</span>
          </button>

          <button
            onClick={() => setActiveTab("report")}
            className={`py-2 px-4 rounded-xl text-xs font-black flex items-center gap-2 transition ${
              activeTab === "report" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Laporan DLP</span>
          </button>
        </nav>
      )}

      {/* MODALS */}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          currentInspector={inspectorTag}
          onClose={() => setIsSettingsOpen(false)}
          onSaveSettings={({ name, role, quality, lang }) => {
            setInspectorTag(name);
            setInspectorRole(role);
            setPhotoQuality(quality);
            setSiteLanguage(lang);
          }}
        />
      )}

      {editingDefect && (
        <EditModal
          defect={editingDefect}
          currentUser={user}
          onClose={() => setEditingDefect(null)}
          onSaveComplete={() => setEditingDefect(null)}
        />
      )}

      {annotatingPhotoIndex !== null && (
        <Annotator
          photo={capturedPhotos[annotatingPhotoIndex]}
          photoIndex={annotatingPhotoIndex}
          onClose={() => setAnnotatingPhotoIndex(null)}
          onConfirm={(annotatedUrl) => {
            setCapturedPhotos((prev) =>
              prev.map((p, idx) =>
                idx === annotatingPhotoIndex ? { ...p, dataUrl: annotatedUrl, annotated: true } : p
              )
            );
            setAnnotatingPhotoIndex(null);
          }}
        />
      )}

      {modalImageGallery.images.length > 0 && (
        <div
          onClick={() => setModalImageGallery({ images: [], index: 0 })}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-pointer"
        >
          <div onClick={(e) => e.stopPropagation()} className="relative max-w-3xl w-full flex flex-col items-center">
            <img
              src={modalImageGallery.images[modalImageGallery.index]}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl mx-auto shadow-2xl"
            />
            <button
              onClick={() => setModalImageGallery({ images: [], index: 0 })}
              className="absolute top-3 right-3 p-2 bg-black/70 text-white rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}