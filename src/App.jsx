// src/App.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, updateDoc, doc, onSnapshot, query } from "firebase/firestore";
import {
  auth,
  db,
  PROJECT_CONFIG,
  TRADE_CATALOG,
  ZONE_OPTIONS,
  ADMIN_EMAILS
} from "./constants.jsx";
import { compressImage, uploadToImgBB } from "./utils.js";
import Annotator from "./components/Annotator.jsx";
import EditModal from "./components/EditModal.jsx";
import {
  Camera,
  Layers,
  MapPin,
  Building2,
  SlidersHorizontal,
  UploadCloud,
  Check,
  Plus,
  Trash2,
  Eye,
  LogOut,
  Building,
  Search,
  FileSpreadsheet,
  BarChart3,
  PlusCircle,
  Users,
  X,
  Edit3,
  ListOrdered,
  Grid
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("records");
  const [defects, setDefects] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState("");

  const [isAtTop, setIsAtTop] = useState(true);
  const [showBottomNav, setShowBottomNav] = useState(true);
  const lastScrollY = useRef(0);

  // Inspector & Building
  const [inspectorTag, setInspectorTag] = useState("Residensi Damai");
  const [buildingName, setBuildingName] = useState(PROJECT_CONFIG.buildingName);
  const [buildingScope, setBuildingScope] = useState(PROJECT_CONFIG.buildingScope);
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split("T")[0]);

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

  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [annotatingPhotoIndex, setAnnotatingPhotoIndex] = useState(null);

  // Register Display & Grouping
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [groupByMode, setGroupByMode] = useState("chronological");

  // Edit Defect state
  const [editingDefect, setEditingDefect] = useState(null);

  // Lightbox
  const [modalImageGallery, setModalImageGallery] = useState({ images: [], index: 0 });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.displayName && inspectorTag === "Residensi Damai") {
        setInspectorTag(currentUser.displayName);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

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

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsAtTop(currentScrollY <= 2);
      const diff = currentScrollY - lastScrollY.current;
      if (diff > 8 && currentScrollY > 15) setShowBottomNav(false);
      else if (diff < -8 || currentScrollY <= 10) setShowBottomNav(true);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    window.scrollTo({ top: 0, behavior: "instant" });
    setIsAtTop(true);
    setShowBottomNav(true);
  };

  const targetLocationTag = useMemo(() => {
    switch (selectedZone) {
      case "Ground": return `[Ground Floor] ${groundArea}`;
      case "Carpark": return `[Podium Carpark ${carparkFloor}] ${carparkBay}`;
      case "Facility": return `[Level 8 Facilities] ${facilityArea}`;
      case "Residential": {
        const floorMatch = residentialFloor.match(/Level\s+(\w+)/);
        const floorName = floorMatch ? `Level ${floorMatch[1]} Residential` : residentialFloor;
        return `[${floorName}] ${residentialArea}`;
      }
      case "Staircase": return `[Emergency Staircase] ${staircaseWing} (${staircaseFlight})`;
      case "Rooftop": return `[Level 27 Rooftop] ${rooftopArea}`;
      default: return "[Residensi Damai] Common Property";
    }
  }, [selectedZone, groundArea, carparkFloor, carparkBay, facilityArea, residentialFloor, residentialArea, staircaseWing, staircaseFlight, rooftopArea]);

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

  const handleAddPhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      try {
        const compressedDataUrl = await compressImage(file, 800, 0.6);
        setCapturedPhotos((prev) => [
          ...prev,
          {
            id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            dataUrl: compressedDataUrl,
            annotated: false,
          },
        ]);
      } catch (err) {
        console.error("Compression error:", err);
      }
    }
    e.target.value = "";
  };

  const handleSaveDefect = async () => {
    if (capturedPhotos.length === 0) {
      alert("Please attach at least one photo before saving.");
      return;
    }

    setIsSyncing(true);
    setSyncStatusText("Uploading images to ImgBB CDN...");

    try {
      const hostedUrls = [];
      for (let i = 0; i < capturedPhotos.length; i++) {
        setSyncStatusText(`Uploading photo ${i + 1} of ${capturedPhotos.length} to ImgBB...`);
        const url = await uploadToImgBB(capturedPhotos[i].dataUrl);
        hostedUrls.push(url);
      }

      setSyncStatusText("Saving defect to Firestore...");

      const fullLocationString = specificLandmarkNote.trim()
        ? `${targetLocationTag} • ${specificLandmarkNote.trim()}`
        : targetLocationTag;
      const subLayerTag = selectedZone === "Carpark" ? carparkFloor : selectedZone;

      const newDefectData = {
        zoneId: selectedZone,
        subLayer: subLayerTag,
        trade: selectedTrade,
        element: selectedElement,
        item: selectedItem,
        location: fullLocationString,
        severity,
        status: "Pending Rectification",
        date: inspectionDate || new Date().toISOString().split("T")[0],
        createdAt: Date.now(),
        loggedBy: inspectorTag || user?.displayName || "Staff Inspector",
        buildingName: buildingName || "Residensi Damai",
        buildingScope: buildingScope || "Tower A (Levels G to 27)",
        photoUrls: hostedUrls,
        photoUrl: hostedUrls[0] || "",
        desc: customDescription.trim() || "Defect rectification required.",
        editHistory: []
      };

      await addDoc(collection(db, "defects"), newDefectData);

      setCustomDescription("");
      setCapturedPhotos([]);
      setSpecificLandmarkNote("");
      handleTabChange("records");
    } catch (err) {
      console.error("Error saving defect:", err);
      alert(`Save failed: ${err.message || "Network Error"}`);
    } finally {
      setIsSyncing(false);
      setSyncStatusText("");
    }
  };

  const handleUpdateStatus = async (defectId, newStatus) => {
    try {
      await updateDoc(doc(db, "defects", defectId), { status: newStatus });
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const openGalleryModal = (photoArray, startIndex = 0) => {
    const list = Array.isArray(photoArray) && photoArray.length > 0 ? photoArray : [];
    if (list.length > 0) setModalImageGallery({ images: list, index: startIndex });
  };

  const filteredRecords = useMemo(() => {
    return defects.filter((d) => {
      const matchSearch =
        (d.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.item || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.trade || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === "All" || d.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [defects, searchQuery, filterStatus]);

  const groupedRecords = useMemo(() => {
    if (groupByMode === "chronological") {
      return { "All Defects": filteredRecords };
    }

    const groups = {};
    filteredRecords.forEach((item) => {
      let key = "Other";
      if (groupByMode === "zone") {
        key = ZONE_OPTIONS[item.zoneId]?.label || item.zoneId || "Unassigned Zone";
      } else if (groupByMode === "trade") {
        key = item.trade || "Unclassified Trade";
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return groups;
  }, [filteredRecords, groupByMode]);

  const stats = useMemo(() => {
    const total = defects.length;
    const rectified = defects.filter((d) => d.status === "Rectified").length;
    const inProgress = defects.filter((d) => d.status === "In Progress").length;
    const pending = defects.filter((d) => d.status === "Pending Rectification").length;
    const high = defects.filter((d) => d.severity === "High").length;
    const rate = total > 0 ? Math.round((rectified / total) * 100) : 0;
    return { total, rectified, inProgress, pending, high, rate };
  }, [defects]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 mt-4 font-semibold">Loading Damai DefectLog...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl text-slate-900">Residensi Damai</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">DLP Defect Management</p>
          </div>
          <button
            onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}
            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-3 shadow-md transition"
          >
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased pb-28">
      {/* HEADER */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 bg-slate-950 text-white shadow-md transition-transform duration-300 ${
          isAtTop ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base leading-tight">
                  DefectLog <span className="text-blue-400">Pro</span>
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Residensi Damai
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Common Area Handover & DLP Audit</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => signOut(auth)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="h-16"></div>

      <main className="max-w-4xl mx-auto p-3 sm:p-5 space-y-4">
        {/* TAB 1: DEFECT FORM */}
        {activeTab === "form" && (
          <div className="space-y-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="uppercase tracking-wider">1. Inspector Profile & Building Details</span>
                </div>
                <span className="text-xs font-extrabold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                  {defects.length} Logged in Cloud
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Inspector Tag:</label>
                  <input
                    type="text"
                    value={inspectorTag}
                    onChange={(e) => setInspectorTag(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Building Name:</label>
                  <input
                    type="text"
                    value={buildingName}
                    onChange={(e) => setBuildingName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Scope:</label>
                  <input
                    type="text"
                    value={buildingScope}
                    onChange={(e) => setBuildingScope(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date:</label>
                  <input
                    type="date"
                    value={inspectionDate}
                    onChange={(e) => setInspectionDate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>2. SELECT COMMON PROPERTY ZONE</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Object.keys(ZONE_OPTIONS).map((zKey) => {
                  const zone = ZONE_OPTIONS[zKey];
                  const Icon = zone.icon;
                  const isSelected = selectedZone === zKey;
                  return (
                    <button
                      key={zKey}
                      onClick={() => setSelectedZone(zKey)}
                      className={`p-3 rounded-2xl border text-left flex items-start justify-between transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-md scale-[1.01]"
                          : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div className="space-y-1">
                        <Icon className={`w-5 h-5 ${isSelected ? "text-white" : "text-blue-600"}`} />
                        <h4 className="font-bold text-xs leading-tight">{zone.label}</h4>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3 pt-2">
                {selectedZone === "Ground" && (
                  <select
                    value={groundArea}
                    onChange={(e) => setGroundArea(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    {ZONE_OPTIONS.Ground.areas.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                )}

                {selectedZone === "Carpark" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={carparkFloor}
                      onChange={(e) => {
                        const fl = e.target.value;
                        setCarparkFloor(fl);
                        setCarparkBay(ZONE_OPTIONS.Carpark.baysByFloor[fl][0]);
                      }}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    >
                      {ZONE_OPTIONS.Carpark.floors.map((fl) => <option key={fl} value={fl}>{fl}</option>)}
                    </select>
                    <select
                      value={carparkBay}
                      onChange={(e) => setCarparkBay(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                    >
                      {ZONE_OPTIONS.Carpark.baysByFloor[carparkFloor].map((bay) => <option key={bay} value={bay}>{bay}</option>)}
                    </select>
                  </div>
                )}

                {selectedZone === "Facility" && (
                  <select
                    value={facilityArea}
                    onChange={(e) => setFacilityArea(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    {ZONE_OPTIONS.Facility.areas.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                )}

                {selectedZone === "Residential" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={residentialFloor}
                      onChange={(e) => {
                        setResidentialFloor(e.target.value);
                        setResidentialArea("Corridor & Lift Lobby Area");
                      }}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                    >
                      {ZONE_OPTIONS.Residential.floors.map((fl) => <option key={fl} value={fl}>{fl}</option>)}
                    </select>
                    <input
                      type="text"
                      value={residentialArea}
                      onChange={(e) => setResidentialArea(e.target.value)}
                      placeholder="e.g. Corridor outside Unit 12-05"
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                    />
                  </div>
                )}

                {selectedZone === "Staircase" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={staircaseWing}
                      onChange={(e) => setStaircaseWing(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                    >
                      {ZONE_OPTIONS.Staircase.wings.map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                    <select
                      value={staircaseFlight}
                      onChange={(e) => setStaircaseFlight(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                    >
                      {ZONE_OPTIONS.Staircase.flights.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                )}

                {selectedZone === "Rooftop" && (
                  <select
                    value={rooftopArea}
                    onChange={(e) => setRooftopArea(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    {ZONE_OPTIONS.Rooftop.areas.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                )}

                <input
                  type="text"
                  value={specificLandmarkNote}
                  onChange={(e) => setSpecificLandmarkNote(e.target.value)}
                  placeholder="Specific Landmark (e.g. Beside Fire Hose Reel #2)"
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl font-medium"
                />

                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center gap-2 text-xs text-blue-950 font-medium">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <strong className="text-blue-900 font-bold">Target Location: </strong>
                    {targetLocationTag} {specificLandmarkNote.trim() && `• ${specificLandmarkNote.trim()}`}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                3. Trade & Defect Classification
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.keys(TRADE_CATALOG).map((tKey) => {
                  const item = TRADE_CATALOG[tKey];
                  const Icon = item.icon;
                  const isSelected = selectedTrade === tKey;
                  return (
                    <button
                      key={tKey}
                      onClick={() => handleTradeSelect(tKey)}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-md"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${isSelected ? "text-white" : "text-blue-600"}`} />
                      <span className="text-xs font-bold leading-snug">{tKey}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={selectedElement}
                  onChange={(e) => handleElementSelect(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                >
                  {Object.keys(TRADE_CATALOG[selectedTrade].elements).map((el) => (
                    <option key={el} value={el}>{el}</option>
                  ))}
                </select>

                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                >
                  {(TRADE_CATALOG[selectedTrade].elements[selectedElement]?.items || []).map((sym) => (
                    <option key={sym} value={sym}>{sym}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {["Low", "Medium", "High"].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSeverity(lvl)}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      severity === lvl
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    {lvl} Severity
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Rectification note for contractor..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  4. Photo Evidence ({capturedPhotos.length} Attached)
                </h2>
              </div>

              {capturedPhotos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {capturedPhotos.map((photo, idx) => (
                    <div key={photo.id} className="relative rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 shadow-sm flex flex-col">
                      <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
                        <img src={photo.dataUrl} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 text-white rounded-md text-[10px] font-bold">
                          #{idx + 1} {photo.annotated && "• Circled"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCapturedPhotos((prev) => prev.filter((p) => p.id !== photo.id))}
                          className="absolute top-2 right-2 w-7 h-7 bg-rose-600 text-white rounded-full flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAnnotatingPhotoIndex(idx)}
                          className="flex-1 py-1.5 px-2 bg-blue-600 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          <span>Circle</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openGalleryModal(capturedPhotos.map((p) => p.dataUrl), idx)}
                          className="py-1.5 px-2.5 bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center bg-slate-50 space-y-3">
                <Camera className="w-8 h-8 text-blue-600 mx-auto" />
                <p className="text-xs font-bold text-slate-800">Attach Defect Photos (Auto uploads to ImgBB)</p>

                <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition">
                  <Plus className="w-4 h-4" />
                  <span>Snap / Upload Photos</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    onChange={handleAddPhotos}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                onClick={handleSaveDefect}
                disabled={isSyncing}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 mt-3"
              >
                {isSyncing ? (
                  <>
                    <UploadCloud className="w-5 h-5 animate-spin" />
                    <span>{syncStatusText || "Saving Defect..."}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Save Defect & Push to Master Register</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: MASTER REGISTER WITH GROUPING & EDIT BUTTON */}
        {activeTab === "records" && (
          <div className="space-y-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Master Defect Register</h2>
                  <p className="text-xs text-slate-500">Group defects by Building Zone, Trade, or Timeline</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
                  <button
                    onClick={() => setGroupByMode("chronological")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                      groupByMode === "chronological" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"
                    }`}
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    <span>Chronological</span>
                  </button>
                  <button
                    onClick={() => setGroupByMode("zone")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                      groupByMode === "zone" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>By Floor/Zone</span>
                  </button>
                  <button
                    onClick={() => setGroupByMode("trade")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                      groupByMode === "trade" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>By Trade</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by defect item, location, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-700"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending Rectification">Pending Rectification</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Rectified">Rectified</option>
                </select>
              </div>
            </div>

            {Object.keys(groupedRecords).length === 0 || filteredRecords.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border text-center text-slate-400">
                No defects match your filters.
              </div>
            ) : (
              Object.keys(groupedRecords).map((groupTitle) => {
                const groupItems = groupedRecords[groupTitle];
                if (!groupItems || groupItems.length === 0) return null;

                return (
                  <div key={groupTitle} className="space-y-2.5">
                    {groupByMode !== "chronological" && (
                      <div className="flex items-center justify-between px-2 pt-2">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                          {groupTitle}
                        </h3>
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                          {groupItems.length} {groupItems.length === 1 ? "defect" : "defects"}
                        </span>
                      </div>
                    )}

                    <div className="space-y-3">
                      {groupItems.map((d) => {
                        const photoList = d.photoUrls && d.photoUrls.length > 0 ? d.photoUrls : [d.photoUrl].filter(Boolean);
                        return (
                          <div key={d.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-blue-50 text-blue-800 border-blue-200">
                                    {d.trade}
                                  </span>
                                  <span
                                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                                      d.severity === "High"
                                        ? "bg-rose-50 text-rose-700 border-rose-200"
                                        : d.severity === "Medium"
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    }`}
                                  >
                                    {d.severity}
                                  </span>
                                </div>
                                <h3 className="font-bold text-xs sm:text-sm text-slate-900 mt-1">{d.item}</h3>
                                <p className="text-[11px] text-slate-600 flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                  <span>{d.location}</span>
                                </p>
                              </div>

                              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-2 sm:pt-0">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => setEditingDefect(d)}
                                    className="p-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 border border-slate-200 transition"
                                    title="Edit Defect"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Edit</span>
                                  </button>

                                  <select
                                    value={d.status}
                                    onChange={(e) => handleUpdateStatus(d.id, e.target.value)}
                                    className="text-xs font-extrabold px-2.5 py-1.5 rounded-xl border bg-slate-50 border-slate-300"
                                  >
                                    <option value="Pending Rectification">Pending Rectification</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Rectified">Rectified / Closed</option>
                                  </select>
                                </div>

                                <span className="text-[10px] text-slate-400 font-medium">
                                  {d.date} • {d.loggedBy}
                                </span>
                              </div>
                            </div>

                            {photoList.length > 0 && (
                              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                                {photoList.map((url, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => openGalleryModal(photoList, idx)}
                                    className="relative flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden border border-slate-200 cursor-pointer shadow-sm hover:scale-105 transition"
                                  >
                                    <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            )}

                            {d.desc && (
                              <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                <strong>Note:</strong> {d.desc}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: KPI OVERVIEW */}
        {activeTab === "analytics" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Total Logged</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.total}</h3>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Rectified</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">{stats.rectified}</h3>
                <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{stats.rate}% Closed</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[11px] font-bold text-slate-500 uppercase">In Progress</p>
                <h3 className="text-2xl font-black text-amber-600 mt-1">{stats.inProgress}</h3>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Critical (High)</p>
                <h3 className="text-2xl font-black text-rose-600 mt-1">{stats.high}</h3>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM NAV */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 transition-transform duration-300 shadow-2xl ${
          showBottomNav ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="max-w-xs mx-auto px-6 py-2.5 flex items-center justify-around">
          <button
            onClick={() => handleTabChange("form")}
            className={`p-3 rounded-2xl transition-all ${
              activeTab === "form" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            }`}
            title="Log Defect"
          >
            <PlusCircle className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleTabChange("records")}
            className={`p-3 rounded-2xl transition-all ${
              activeTab === "records" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            }`}
            title="Master Register"
          >
            <FileSpreadsheet className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleTabChange("analytics")}
            className={`p-3 rounded-2xl transition-all ${
              activeTab === "analytics" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
            }`}
            title="Analytics"
          >
            <BarChart3 className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* EDIT DEFECT MODAL */}
      {editingDefect && (
        <EditModal
          defect={editingDefect}
          currentUser={user}
          onClose={() => setEditingDefect(null)}
          onSaveComplete={() => setEditingDefect(null)}
        />
      )}

      {/* ANNOTATION MODAL */}
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

      {/* LIGHTBOX MODAL */}
      {modalImageGallery.images.length > 0 && (
        <div
          onClick={() => setModalImageGallery({ images: [], index: 0 })}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <div onClick={(e) => e.stopPropagation()} className="relative max-w-3xl w-full flex flex-col items-center">
            <img
              src={modalImageGallery.images[modalImageGallery.index]}
              alt="Defect Full View"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl mx-auto shadow-2xl"
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

