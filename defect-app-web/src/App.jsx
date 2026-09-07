// src/App.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import { 
  Camera, 
  Trash2, 
  PlusCircle, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  FileText, 
  Edit3, 
  Eye, 
  X, 
  Layers, 
  MapPin, 
  Calendar, 
  User, 
  Building, 
  Check, 
  CircleDot, 
  Building2, 
  Car, 
  Waves, 
  DoorOpen, 
  ArrowUpDown, 
  Filter,
  Wifi,
  RefreshCw,
  Users,
  LogOut,
  Lock,
  ShieldCheck,
  Upload
} from "lucide-react";

// Firebase imports
import { auth, db } from "./firebase";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDoc 
} from "firebase/firestore";

// --- PASTE YOUR IMGBB API KEY HERE ---
const IMGBB_API_KEY = "d33722684b4c4a41af62e5bcdc849b0a";

// Helper function to upload canvas blob to ImgBB
async function uploadBlobToImgBB(blob) {
  const formData = new FormData();
  formData.append("image", blob, `defect-${Date.now()}.jpg`);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (data.success) {
    return data.data.url;
  } else {
    throw new Error(data.error?.message || "Failed to upload image to ImgBB");
  }
}

const DEFECT_TYPES = [
  "Water Ingress / Seepage / Ceiling Dampness",
  "Concrete Spalling / Exposed Rebar",
  "Floor / Wall Hairline & Structural Cracking",
  "Hollow / Debonded / Chipped Tiles",
  "Paint Peeling / Chalking / Watermarks",
  "Emergency Staircase Handrail / Tread Defect",
  "Fire Door Self-Closing / Latch Malfunction",
  "Lighting / Electrical / Conduit / Socket Fault",
  "Plumbing / Downpipe / Drain Chokage or Leak",
  "Signage / Line Marking / Safety Hazard",
  "Lift Door / Button / Interior Defect",
  "Pool Tile / Sauna Equipment / Pump Room Fault",
  "Other Common Property Defect"
];

const SEVERITIES = [
  { label: "Low", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { label: "Medium", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { label: "High", color: "bg-rose-100 text-rose-800 border-rose-200" }
];

const CARPARK_LAYERS = [
  "Level 1A", "Level 1B", "Level 2A", "Level 2B", "Level 3A", "Level 3B",
  "Level 3A-1", "Level 3B-1", "Level 4A", "Level 4B", "Level 5A", "Level 5B",
  "Level 6A", "Level 6B", "Level 7A", "Level 7B"
];

const FACILITY_ZONES = [
  "Swimming Pool & Wading Pool Deck", "Gymnasium Room", "Children Playground & Recreational Area",
  "BBQ Pavilion & Dining Area", "Male Toilet & Changing Room", "Male Sauna Room",
  "Female Toilet & Changing Room", "Female Sauna Room", "Surau (Male & Female)",
  "Management Office / Common Corridor"
];

const STAIRCASE_WINGS = [
  "Left-Wing Emergency Fire Staircase", "Middle Core Emergency Fire Staircase", "Right-Wing Emergency Fire Staircase"
];

const ROOFTOP_ZONES = [
  "Resident Sky View Deck / Garden", "Left-Wing Water Tank Enclosure", "Right-Wing Water Tank Enclosure",
  "Elevator / Lift Motor Control Room (Middle Staircase Top)", "Rooftop Parapet Wall & Lightning Arrestor Ring"
];

const GROUND_ZONES = [
  "Ground Floor Main Lift Lobby (Center)", "Taska (Kindergarten) - Elevated Right Wing",
  "Multipurpose Hall / Developer DLP Site Office (Left Wing)", "Main Guardhouse & Boom Gate Entry",
  "Refuse / Central Bin Chamber", "Ground Floor Driveway & Drop-Off Porch"
];

export default function App() {
  // Auth & Roles
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [isSyncing, setIsSyncing] = useState(false);
  const [inspectorName, setInspectorName] = useState("Staff Inspector");
  const [project, setProject] = useState({
    name: "Residensi Damai",
    block: "Tower A (Levels G to 27)",
    date: new Date().toISOString().split("T")[0]
  });

  const [mainCategory, setMainCategory] = useState("Carpark");
  const [carparkLayer, setCarparkLayer] = useState(CARPARK_LAYERS[0]);
  const [carparkSubLocation, setCarparkSubLocation] = useState("General Driveway & Parking Bays");
  const [groundZone, setGroundZone] = useState(GROUND_ZONES[0]);
  const [facilityZone, setFacilityZone] = useState(FACILITY_ZONES[0]);
  const [resFloor, setResFloor] = useState(9);
  const [resTarget, setResTarget] = useState("Corridor & Lift Lobby Area");
  const [staircaseWing, setStaircaseWing] = useState(STAIRCASE_WINGS[0]);
  const [staircaseFloor, setStaircaseFloor] = useState("Level 1 to Level 2");
  const [rooftopZone, setRooftopZone] = useState(ROOFTOP_ZONES[0]);
  const [customAreaNote, setCustomAreaNote] = useState("");

  // Slots store local blob data for canvas annotation, then upload to ImgBB upon submission
  const [slots, setSlots] = useState([
    { id: 1, blob: null, previewUrl: null, type: DEFECT_TYPES[0], severity: "Medium", desc: "" },
    { id: 2, blob: null, previewUrl: null, type: DEFECT_TYPES[1], severity: "Low", desc: "" },
    { id: 3, blob: null, previewUrl: null, type: DEFECT_TYPES[2], severity: "High", desc: "" }
  ]);
  const [visibleSlotsCount, setVisibleSlotsCount] = useState(1);

  const [defects, setDefects] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [filterCategory, setFilterCategory] = useState("All");

  const [isAnnotating, setIsAnnotating] = useState(false);
  const [activeSlotId, setActiveSlotId] = useState(null);
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [drawTool, setDrawTool] = useState("circle");
  const [drawColor, setDrawColor] = useState("#ef4444");
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [canvasHistory, setCanvasHistory] = useState([]);

  const canvasRef = useRef(null);
  const imageObjRef = useRef(null);

  // 1. Auth Listener & Admin Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setInspectorName(currentUser.email.split("@")[0].toUpperCase());
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists() && userSnap.data().role === "admin") {
            setIsAdmin(true);
          } else if (currentUser.email.includes("admin")) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (e) {
          console.error("Error reading role:", e);
        }
      } else {
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore Sync
  useEffect(() => {
    if (!user) return;
    setIsSyncing(true);
    const defectsCollection = collection(db, "defects");

    const unsubscribe = onSnapshot(
      defectsCollection,
      (snapshot) => {
        const loaded = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ id: docSnap.id, ...docSnap.data() });
        });
        loaded.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setDefects(loaded);
        setIsSyncing(false);
      },
      (error) => {
        console.error("Firestore sync error:", error);
        setIsSyncing(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err) {
      setLoginError("Invalid credentials. Please verify your pre-assigned email and password.");
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const residentialUnitOptions = useMemo(() => {
    const maxUnits = resFloor === 9 ? 19 : 23;
    const list = ["Corridor & Lift Lobby Area", "Refuse Chute / Fire Riser Cupboard"];
    for (let i = 1; i <= maxUnits; i++) {
      list.push(`Outside Unit ${resFloor}-${i < 10 ? "0" + i : i}`);
    }
    return list;
  }, [resFloor]);

  const currentCalculatedArea = useMemo(() => {
    let base = "";
    if (mainCategory === "Ground") base = `[Ground Floor] ${groundZone}`;
    else if (mainCategory === "Carpark") base = `[Podium Carpark ${carparkLayer}] ${carparkSubLocation}`;
    else if (mainCategory === "Facility") base = `[Level 8 Facilities] ${facilityZone}`;
    else if (mainCategory === "Residential") base = `[Level ${resFloor} Residential] ${resTarget}`;
    else if (mainCategory === "Staircase") base = `[Emergency Staircase] ${staircaseWing} (${staircaseFloor})`;
    else if (mainCategory === "Rooftop") base = `[Level 27 Rooftop] ${rooftopZone}`;

    return customAreaNote.trim() ? `${base} - ${customAreaNote.trim()}` : base;
  }, [mainCategory, carparkLayer, carparkSubLocation, groundZone, facilityZone, resFloor, resTarget, staircaseWing, staircaseFloor, rooftopZone, customAreaNote]);

  const handlePhotoUpload = (e, slotId) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setRawImageSrc(event.target.result);
        setActiveSlotId(slotId);
        setIsAnnotating(true);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (isAnnotating && rawImageSrc && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        imageObjRef.current = img;
        const maxDimension = 750;
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        setCanvasHistory([ctx.getImageData(0, 0, width, height)]);
      };
      img.src = rawImageSrc;
    }
  }, [isAnnotating, rawImageSrc]);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleStartDraw = (e) => {
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos(coords);

    if (drawTool === "freehand") {
      const ctx = canvasRef.current.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  };

  const handleDrawMove = (e) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (drawTool === "circle") {
      if (canvasHistory.length > 0) {
        ctx.putImageData(canvasHistory[canvasHistory.length - 1], 0, 0);
      }
      const radiusX = Math.abs(coords.x - startPos.x) / 2;
      const radiusY = Math.abs(coords.y - startPos.y) / 2;
      const centerX = Math.min(startPos.x, coords.x) + radiusX;
      const centerY = Math.min(startPos.y, coords.y) + radiusY;

      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = 5;
      ctx.stroke();
    } else if (drawTool === "freehand") {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const handleEndDraw = () => {
    if (isDrawing && canvasRef.current) {
      setIsDrawing(false);
      const ctx = canvasRef.current.getContext("2d");
      setCanvasHistory((prev) => [...prev, ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)]);
    }
  };

  const handleUndo = () => {
    if (canvasHistory.length > 1) {
      const newHistory = canvasHistory.slice(0, -1);
      setCanvasHistory(newHistory);
      const ctx = canvasRef.current.getContext("2d");
      ctx.putImageData(newHistory[newHistory.length - 1], 0, 0);
    }
  };

  const handleClear = () => {
    if (imageObjRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(imageObjRef.current, 0, 0, canvas.width, canvas.height);
      setCanvasHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    }
  };

  const handleSaveAnnotation = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      const previewUrl = URL.createObjectURL(blob);
      setSlots((prev) =>
        prev.map((slot) => (slot.id === activeSlotId ? { ...slot, blob, previewUrl } : slot))
      );
      setIsAnnotating(false);
      setRawImageSrc(null);
    }, "image/jpeg", 0.82);
  };

  const handleSaveAreaBatch = async () => {
    const activeValidSlots = slots.slice(0, visibleSlotsCount).filter((s) => s.blob !== null);

    if (activeValidSlots.length === 0) {
      alert("Please capture or upload at least one photo with a highlighted defect.");
      return;
    }

    setIsSyncing(true);
    try {
      for (let idx = 0; idx < activeValidSlots.length; idx++) {
        const item = activeValidSlots[idx];
        
        // Upload image to ImgBB and obtain direct URL
        const uploadedPhotoUrl = await uploadBlobToImgBB(item.blob);

        const docId = `DEF-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const record = {
          category: mainCategory,
          area: currentCalculatedArea,
          type: item.type,
          severity: item.severity,
          desc: item.desc || "Rectification required as highlighted in photo.",
          photo: uploadedPhotoUrl,
          date: project.date,
          loggedBy: inspectorName,
          createdAt: Date.now() + idx
        };

        await setDoc(doc(db, "defects", docId), record);
      }

      setSlots([
        { id: 1, blob: null, previewUrl: null, type: DEFECT_TYPES[0], severity: "Medium", desc: "" },
        { id: 2, blob: null, previewUrl: null, type: DEFECT_TYPES[1], severity: "Low", desc: "" },
        { id: 3, blob: null, previewUrl: null, type: DEFECT_TYPES[2], severity: "High", desc: "" }
      ]);
      setVisibleSlotsCount(1);
      setCustomAreaNote("");
      alert("Defect batch successfully uploaded to ImgBB and recorded in cloud database!");
    } catch (err) {
      console.error("Failed to push defect to cloud:", err);
      alert("Upload failed: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteDefect = async (id) => {
    if (!isAdmin) {
      alert("Permission denied. Only designated Admin accounts can delete defect records.");
      return;
    }
    if (!confirm("Are you sure you want to permanently delete this defect record?")) return;
    try {
      await deleteDoc(doc(db, "defects", id));
    } catch (err) {
      console.error("Failed to delete record:", err);
    }
  };

  const filteredDefects = useMemo(() => {
    if (filterCategory === "All") return defects;
    return defects.filter((d) => d.category === filterCategory);
  }, [defects, filterCategory]);

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Login Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-slate-800 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg">
              <Building2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">DefectLog Pro</h1>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Authorized Staff Access Only</p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pre-assigned Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="staff@residensi-damai.com"
                className="w-full text-sm p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition"
            >
              Sign In to Defect Tracker
            </button>
          </form>
          <p className="text-[11px] text-center text-slate-400">
            Accounts are managed by building management. Contact your property administrator for credentials.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased pb-20">
      <header className="sticky top-0 z-40 bg-slate-950 text-white shadow-md print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base md:text-lg leading-tight tracking-tight">
                  DefectLog Pro <span className="text-blue-400 font-medium">Common Area</span>
                </h1>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500 text-slate-950">
                    <ShieldCheck className="w-3 h-3" /> ADMIN
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSyncing && (
              <span className="text-xs text-blue-300 flex items-center gap-1 mr-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing...
              </span>
            )}
            <button
              onClick={() => window.print()}
              disabled={defects.length === 0}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF ({defects.length})</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-4 print:hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              1. Inspector Profile & Building Details
            </h2>
            <span className="text-xs font-black bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
              {defects.length} Logged in Cloud
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Inspector Tag:</label>
              <input
                type="text"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                className="w-full text-xs md:text-sm p-2.5 bg-blue-50/50 border border-blue-200 font-bold text-blue-950 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Building Name</label>
              <input
                type="text"
                value={project.name}
                onChange={(e) => setProject({ ...project, name: e.target.value })}
                className="w-full text-xs md:text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Scope</label>
              <input
                type="text"
                value={project.block}
                onChange={(e) => setProject({ ...project, block: e.target.value })}
                className="w-full text-xs md:text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
              <input
                type="date"
                value={project.date}
                onChange={(e) => setProject({ ...project, date: e.target.value })}
                className="w-full text-xs md:text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-5 print:hidden">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              2. Select Common Property Location
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { id: "Ground", label: "Ground Floor", icon: DoorOpen, desc: "Lobby, Taska, Hall/Office" },
              { id: "Carpark", label: "Podium Carpark", icon: Car, desc: "Levels 1A to 7B" },
              { id: "Facility", label: "L8 Facilities", icon: Waves, desc: "Pool, Gym, Saunas, BBQ" },
              { id: "Residential", label: "L9–26 Residential", icon: Building2, desc: "Corridors & Units" },
              { id: "Staircase", label: "Fire Staircases", icon: ArrowUpDown, desc: "Left, Mid & Right Core" },
              { id: "Rooftop", label: "L27 Rooftop", icon: Layers, desc: "Sky Deck, Water Tanks" }
            ].map((cat) => {
              const Icon = cat.icon;
              const isSelected = mainCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setMainCategory(cat.id)}
                  className={`p-3 rounded-xl text-left border flex flex-col justify-between transition ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/70 text-blue-900 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${isSelected ? "text-blue-600" : "text-slate-500"}`} />
                  <div>
                    <p className="font-bold text-xs">{cat.label}</p>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{cat.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sublocation inputs */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            {mainCategory === "Ground" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ground Floor Zone:</label>
                <select
                  value={groundZone}
                  onChange={(e) => setGroundZone(e.target.value)}
                  className="w-full text-xs md:text-sm p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none"
                >
                  {GROUND_ZONES.map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>
            )}

            {mainCategory === "Carpark" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Carpark Level:</label>
                  <select
                    value={carparkLayer}
                    onChange={(e) => setCarparkLayer(e.target.value)}
                    className="w-full text-xs md:text-sm p-2.5 bg-white border border-slate-300 rounded-lg"
                  >
                    {CARPARK_LAYERS.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sub-location / Bay:</label>
                  <input
                    type="text"
                    value={carparkSubLocation}
                    onChange={(e) => setCarparkSubLocation(e.target.value)}
                    placeholder="e.g. Near Pillar P-14 / Bay 120"
                    className="w-full text-xs md:text-sm p-2.5 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            {mainCategory === "Facility" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Zone:</label>
                <select
                  value={facilityZone}
                  onChange={(e) => setFacilityZone(e.target.value)}
                  className="w-full text-xs md:text-sm p-2.5 bg-white border border-slate-300 rounded-lg"
                >
                  {FACILITY_ZONES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            )}

            {mainCategory === "Residential" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Floor Level (9 to 26):</label>
                  <input
                    type="number"
                    min={9}
                    max={26}
                    value={resFloor}
                    onChange={(e) => setResFloor(Number(e.target.value))}
                    className="w-full text-xs md:text-sm p-2.5 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Area:</label>
                  <select
                    value={resTarget}
                    onChange={(e) => setResTarget(e.target.value)}
                    className="w-full text-xs md:text-sm p-2.5 bg-white border border-slate-300 rounded-lg"
                  >
                    {residentialUnitOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {mainCategory === "Staircase" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Staircase Core:</label>
                  <select
                    value={staircaseWing}
                    onChange={(e) => setStaircaseWing(e.target.value)}
                    className="w-full text-xs md:text-sm p-2.5 bg-white border border-slate-300 rounded-lg"
                  >
                    {STAIRCASE_WINGS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Flight Flight Range:</label>
                  <input
                    type="text"
                    value={staircaseFloor}
                    onChange={(e) => setStaircaseFloor(e.target.value)}
                    placeholder="e.g. Level 12 Landing"
                    className="w-full text-xs md:text-sm p-2.5 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            {mainCategory === "Rooftop" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rooftop Area:</label>
                <select
                  value={rooftopZone}
                  onChange={(e) => setRooftopZone(e.target.value)}
                  className="w-full text-xs md:text-sm p-2.5 bg-white border border-slate-300 rounded-lg"
                >
                  {ROOFTOP_ZONES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Pillar / Exact Location Note:</label>
              <input
                type="text"
                value={customAreaNote}
                onChange={(e) => setCustomAreaNote(e.target.value)}
                placeholder="e.g. Grid Line C-4 / Near DB Box 2"
                className="w-full text-xs md:text-sm p-2.5 bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </section>

        {/* 3. Photo Capture & Defect Logging */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-4 print:hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-600" />
              3. Capture & Highlight Defect Photos
            </h2>
            {visibleSlotsCount < 3 && (
              <button
                onClick={() => setVisibleSlotsCount((prev) => Math.min(3, prev + 1))}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                <PlusCircle className="w-4 h-4" /> Add Another Photo Slot
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {slots.slice(0, visibleSlotsCount).map((slot) => (
              <div key={slot.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="aspect-video w-full rounded-lg bg-slate-200 border border-slate-300 overflow-hidden relative flex items-center justify-center">
                  {slot.previewUrl ? (
                    <img src={slot.previewUrl} alt="Defect" className="w-full h-full object-contain bg-black" />
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center p-4 text-center">
                      <Camera className="w-8 h-8 text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-blue-600">Take Photo / Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handlePhotoUpload(e, slot.id)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Defect Type:</label>
                  <select
                    value={slot.type}
                    onChange={(e) =>
                      setSlots((prev) =>
                        prev.map((s) => (s.id === slot.id ? { ...s, type: e.target.value } : s))
                      )
                    }
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-md"
                  >
                    {DEFECT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Severity:</label>
                  <div className="grid grid-cols-3 gap-1">
                    {SEVERITIES.map((sev) => (
                      <button
                        key={sev.label}
                        onClick={() =>
                          setSlots((prev) =>
                            prev.map((s) => (s.id === slot.id ? { ...s, severity: sev.label } : s))
                          )
                        }
                        className={`text-[11px] py-1 font-semibold rounded border ${
                          slot.severity === sev.label
                            ? sev.color + " ring-1 ring-slate-400"
                            : "bg-white text-slate-600 border-slate-200"
                        }`}
                      >
                        {sev.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Description / Notes:</label>
                  <textarea
                    rows={2}
                    value={slot.desc}
                    onChange={(e) =>
                      setSlots((prev) =>
                        prev.map((s) => (s.id === slot.id ? { ...s, desc: e.target.value } : s))
                      )
                    }
                    placeholder="Provide details..."
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-md"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveAreaBatch}
            disabled={isSyncing}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" /> Uploading to ImgBB & Cloud...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" /> Save & Push Batch to Cloud Database
              </>
            )}
          </button>
        </section>

        {/* 4. Logged Defect Summary Table & PDF Export View */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Recorded Defects Summary
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Filter:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-xs p-1.5 bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="All">All Categories</option>
                <option value="Ground">Ground Floor</option>
                <option value="Carpark">Podium Carpark</option>
                <option value="Facility">Facilities</option>
                <option value="Residential">Residential</option>
                <option value="Staircase">Staircases</option>
                <option value="Rooftop">Rooftop</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="p-2.5">Photo</th>
                  <th className="p-2.5">Location</th>
                  <th className="p-2.5">Type & Description</th>
                  <th className="p-2.5">Severity</th>
                  <th className="p-2.5">Inspector</th>
                  {isAdmin && <th className="p-2.5 text-right">Admin Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDefects.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="p-6 text-center text-slate-400">
                      No defects recorded yet for this selection.
                    </td>
                  </tr>
                ) : (
                  filteredDefects.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/80">
                      <td className="p-2.5">
                        <img
                          src={d.photo}
                          alt="Defect"
                          onClick={() => setPreviewImage(d.photo)}
                          className="w-16 h-12 object-cover rounded cursor-pointer border border-slate-200"
                        />
                      </td>
                      <td className="p-2.5 font-medium text-slate-900">{d.area}</td>
                      <td className="p-2.5">
                        <p className="font-semibold text-slate-800">{d.type}</p>
                        <p className="text-slate-500 mt-0.5">{d.desc}</p>
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                            d.severity === "High"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : d.severity === "Medium"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {d.severity}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-500 whitespace-nowrap">
                        {d.loggedBy}
                        <br />
                        <span className="text-[10px] text-slate-400">{d.date}</span>
                      </td>
                      {isAdmin && (
                        <td className="p-2.5 text-right">
                          <button
                            onClick={() => handleDeleteDefect(d.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Annotation Canvas Modal */}
      {isAnnotating && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-xl w-full p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold">Highlight Defect on Photo</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDrawTool("circle")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border ${
                    drawTool === "circle" ? "bg-blue-600 text-white border-blue-600" : "bg-slate-100 border-slate-200"
                  }`}
                >
                  Circle Box
                </button>
                <button
                  onClick={() => setDrawTool("freehand")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border ${
                    drawTool === "freehand" ? "bg-blue-600 text-white border-blue-600" : "bg-slate-100 border-slate-200"
                  }`}
                >
                  Pen
                </button>
                <button onClick={handleUndo} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg" title="Undo">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative w-full flex items-center justify-center bg-black/5 rounded-xl overflow-hidden touch-none">
              <canvas
                ref={canvasRef}
                onMouseDown={handleStartDraw}
                onMouseMove={handleDrawMove}
                onMouseUp={handleEndDraw}
                onTouchStart={handleStartDraw}
                onTouchMove={handleDrawMove}
                onTouchEnd={handleEndDraw}
                className="max-h-[60vh] max-w-full cursor-crosshair"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  setIsAnnotating(false);
                  setRawImageSrc(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAnnotation}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow"
              >
                Confirm Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Photo Modal Preview */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <img src={previewImage} alt="Defect Full View" className="max-w-full max-h-[90vh] object-contain rounded-xl" />
        </div>
      )}
    </div>
  );
}
