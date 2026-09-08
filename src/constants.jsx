// src/constants.jsx
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import {
  Building2,
  Layers,
  Wrench,
  Zap,
  DoorOpen,
  Car,
  Waves,
  Building,
  ArrowUpDown
} from "lucide-react";

// Cloudinary Configuration
export const CLOUDINARY_CLOUD_NAME = "swsv810w";
export const CLOUDINARY_UPLOAD_PRESET = "damai_defects"; // Change this if you named your preset differently in Cloudinary Settings

export const ADMIN_EMAILS = ["terekked@gmail.com", "azibrusli@gmail.com"];

const firebaseConfig = {
  apiKey: "AIzaSyDlwZex4cZ9u8Wcrc8-uuugaARsHfRwEnE",
  authDomain: "defect---residensi-damai.web.app",
  projectId: "defect---residensi-damai",
  storageBucket: "defect---residensi-damai.appspot.com",
  messagingSenderId: "737848406419",
  appId: "1:737848406419:web:1584c2fef24f8d95e0c8to"
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);

export const PROJECT_CONFIG = {
  buildingName: "Residensi Damai",
  buildingScope: "Tower A (Levels G to 27)",
  contractorName: "Pembinaan Utama Megah Sdn Bhd",
  developerName: "Damai Properties Development Sdn Bhd",
  docRefPrefix: "RD-DLP-2026/A4"
};

export const TRADE_CATALOG = {
  "Civil & Structural": {
    icon: Building2,
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    elements: {
      "Structural Integrity (Struktur)": {
        defaultSeverity: "High",
        items: [
          "Beam, Column or Slab Cracking (Keretakan rasuk, tiang & slab)",
          "Concrete Spalling with Exposed Rebar (Concrete spalling / Tetulang terdedah)",
          "Corroded Reinforcement Bars (Tetulang berkarat)",
          "Structural Settlement Cracks (Settlement crack)",
          "Slab Deflection / Sagging (Slab melendut)",
          "Damaged Expansion Joints (Expansion joint rosak)"
        ]
      },
      "External Facade (Fasad Luar)": {
        defaultSeverity: "Medium",
        items: [
          "Exterior Wall Cracks & Delamination (Retak dinding)",
          "Loose / Debonded Tiles & Plaster Rendering (Jubin / Rendering longgar)",
          "Paint Peeling, Chalking & Efflorescence (Cat mengelupas / Chalking)",
          "Water Seepage through External Walls (Kebocoran air fasad)",
          "Sealant & Mastic Joint Failure (Sealant rosak)",
          "Window Perimeter Water Ingress (Kebocoran sekitar tingkap)"
        ]
      },
      "Roof & Rooftop (Bumbung & RC Flat Roof)": {
        defaultSeverity: "High",
        items: [
          "Waterproofing Membrane Failure (Waterproofing gagal)",
          "Water Ponding / Stagnant Pools (Air bertakung)",
          "Scupper Drain / Outlet Chokage (Outlet tersumbat)",
          "Cracked Membrane Sheet / Blistering (Membrane retak / rosak)",
          "Damaged Flashing & Capping (Flashing rosak)",
          "Active Ceiling Leaks & Rebar Corrosion (Kebocoran dan kakisan)"
        ]
      },
      "Waterproofing Systems (Sistem Kalis Air)": {
        defaultSeverity: "High",
        items: [
          "Toilet / Shower Core Dampness (Kebocoran tandas)",
          "Balcony Slab Water Ingress (Kebocoran balkoni)",
          "Planter Box Waterproofing Failure (Kebocoran planter box)",
          "Water Tank Room Seepage (Kebocoran tangki air)",
          "Swimming Pool Structure Seepage (Kebocoran kolam renang)"
        ]
      },
      "Drainage & Stormwater (Saliran & Longkang)": {
        defaultSeverity: "Medium",
        items: [
          "Blocked Perimeter / Apron Drains (Longkang tersumbat)",
          "Incorrect Fall Gradient / Backflow (Gradient tidak betul)",
          "Damaged Gratings / Sump Covers (Penutup longkang rosak)",
          "Stagnant Sump Overflow (Air bertakung / limpahan)",
          "Rainwater Downpipe Disconnected / Leaking (RWDP rosak)"
        ]
      }
    }
  },

  "Architectural & Finishes": {
    icon: Layers,
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    elements: {
      "Common Corridors (Koridor Bersama)": {
        defaultSeverity: "Low",
        items: [
          "Hollow / Debonded / Cracked Tiles (Jubin retak / kosong)",
          "Uneven Floor Screed / Tripping Hazard (Lantai tidak rata)",
          "Damaged Skirting & Tile Trim (Skirting rosak)",
          "Ceiling Board Water Stains / Dampness (Kesan air pada siling)",
          "Broken Light Diffuser / Fitting (Lampu rosak)",
          "Loose Handrail / Balustrade (Railing longgar)"
        ]
      },
      "Emergency Staircases (Tangga Kecemasan)": {
        defaultSeverity: "Medium",
        items: [
          "Landing & Step Cracks (Retak anak tangga)",
          "Damaged Tread Nosing (Anak tangga rosak)",
          "Loose Safety Handrails (Handrail longgar)",
          "Inadequate Staircase Illumination (Pencahayaan tidak cukup)",
          "Fire Door Latch / Closer Fault (Pintu api rosak)",
          "Missing Floor Level Signage (Papan tanda hilang)"
        ]
      },
      "Podium Carpark (Tempat Letak Kereta)": {
        defaultSeverity: "Medium",
        items: [
          "Floor Slab Cracking & Spalling (Retakan / Spalling konkrit)",
          "Overhead Pipe & Ceiling Leaks (Kebocoran siling)",
          "Driveway Water Ponding (Air bertakung)",
          "Damaged Wheel Stoppers (Wheel stopper rosak)",
          "Faded Parking Bay Lines & Markings (Garisan parkir pudar)",
          "Defective Carpark Lighting (Lampu rosak)"
        ]
      },
      "Fire Doors & Exits (Pintu Kebakaran)": {
        defaultSeverity: "High",
        items: [
          "Door Fails to Self-Close / Latch (Tidak boleh tutup sendiri)",
          "Damaged Hydraulic Door Closer (Door closer rosak)",
          "Door Wedged / Chocked Open (Pintu disendal)",
          "Damaged Intumescent Smoke Seal (Seal / Hardware rosak)",
          "Loose Lever Handle / Panic Exit Device (Pemegang rosak)"
        ]
      },
      "Accessibility & OKU (Akses OKU)": {
        defaultSeverity: "Medium",
        items: [
          "Ramp Gradient Non-Compliant (Gradient ramp curam)",
          "Missing OKU Handrail (Handrail tiada / longgar)",
          "Blocked or Unmarked OKU Bays (Parkir OKU tidak sesuai)",
          "Damaged Tactile Paving Pathway (Laluan OKU rosak)"
        ]
      },
      "Signage & Wayfinding (Papan Tanda)": {
        defaultSeverity: "Low",
        items: [
          "Missing Floor Level Numbers (Nombor tingkat tiada)",
          "Damaged / Missing Exit Signs (Exit sign rosak)",
          "Missing Fire Equipment Identifiers (Tanda kebakaran tiada)",
          "Missing High Voltage Hazard Warning (Tanda amaran elektrik tiada)"
        ]
      }
    }
  },

  "Mechanical & Plumbing": {
    icon: Wrench,
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    elements: {
      "Plumbing & Piping Reticulation (Paip Air)": {
        defaultSeverity: "Medium",
        items: [
          "Active Pipe Joint Leakage (Kebocoran paip)",
          "Corroded Galvanized / Copper Pipes (Paip berkarat)",
          "Defective Gate / Ball / Check Valve (Valve rosak)",
          "Missing Pipe Hanger / Support Bracket (Pipe support longgar)",
          "Water Hammer Knocking Sound (Water hammer)",
          "Abnormal Low / High Water Pressure (Tekanan air tidak normal)"
        ]
      },
      "Water Storage Tanks (Tangki Air)": {
        defaultSeverity: "High",
        items: [
          "FRP / Stainless Tank Shell Leakage (Tangki bocor / retak)",
          "Internal Water Contamination (Pencemaran tangki)",
          "Damaged Inspection Manhole Cover (Penutup rosak)",
          "Corroded Internal Ladder / Bracing (Karat struktur tangki)",
          "Ball Float Valve / Level Controller Failure (Level control rosak)"
        ]
      },
      "Domestic & Booster Pumps (Pam Domestik)": {
        defaultSeverity: "High",
        items: [
          "Abnormal Vibration & Bearing Noise (Bunyi / Getaran luar biasa)",
          "Leaking Mechanical Shaft Seal (Mechanical seal bocor)",
          "Faulty Pressure Switch / Transducer (Pressure switch rosak)",
          "Severe Pump Casing Corrosion (Kakisan pam)",
          "Standby Pump Fails Auto-Cut-In (Standby pump tidak berfungsi)"
        ]
      },
      "Sewerage Reticulation (Sistem Pembetungan)": {
        defaultSeverity: "High",
        items: [
          "Soil / Waste Pipe Joint Leakage (Kebocoran paip kumbahan)",
          "Sewer Main Line Chokage (Pembetungan tersumbat)",
          "Strong Sewer Gas / Odor Emission (Bau kumbahan)",
          "Sump Pit Submersible Pump Failure (Pam kumbahan rosak)",
          "Damaged / Unsealed Manhole Cover (Penutup manhole rosak)"
        ]
      },
      "Elevators & Lifts (Lif Penumpang)": {
        defaultSeverity: "High",
        items: [
          "Abnormal Traveling Vibration / Jerking (Bunyi / Getaran luar biasa)",
          "Landing Floor Inaccurate Leveling (Levelling tidak tepat)",
          "Door Safety Sensor Jamming (Pintu bermasalah)",
          "Automatic Rescue Device (ARD) Inoperable (ARD gagal)",
          "Emergency Intercom / Cabin Light Failure (Interkom rosak)"
        ]
      },
      "Lift Pit (Lift Pit & Sump)": {
        defaultSeverity: "High",
        items: [
          "Water Ingress / Sump Ponding (Air bertakung lift pit)",
          "Failed Pit Waterproofing Membrane (Waterproofing gagal)",
          "Faulty Dewatering Sump Pump (Sump pump rosak)",
          "Guide Rail / Buffer Spring Rust (Kakisan lift pit)"
        ]
      },
      "Swimming Pool & Outdoor Shower (Kolam Renang & Mandian Luar)": {
        defaultSeverity: "Medium",
        items: [
          "Pool Shell Leak / Water Level Drop (Kebocoran kolam)",
          "Chipped / Loose Pool Tiles (Jubin kolam rosak)",
          "Pool Filtration Pump Malfunction (Pam / Filter rosak)",
          "Outdoor Shower Tap / Drainage Leakage (Paip mandian luar rosak)",
          "Underwater Light Electrical Fault (Isu elektrik kolam)",
          "Missing Life Buoy / Depth Signage (Papan tanda keselamatan tiada)"
        ]
      },
      "Refuse & Bin Chamber (Bilik Sampah)": {
        defaultSeverity: "Low",
        items: [
          "Poor Floor Wash Drainage / Ponding (Saliran tidak baik)",
          "Hose Reel / Tap Leakage (Kebocoran paip bilik sampah)",
          "Damaged Refuse Door / Insect Screen (Pintu rosak)",
          "Inadequate Mechanical Exhaust (Pengudaraan lemah)",
          "Pest / Rodent Ingress Gaps (Kemasukan makhluk perosak)"
        ]
      }
    }
  },

  "Electrical & ELV": {
    icon: Zap,
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    elements: {
      "Electrical Panels (Papan Agihan DB / MSB)": {
        defaultSeverity: "High",
        items: [
          "Tripped Breaker / Overheating Hotspot (DB rosak / Overheating)",
          "Loose Terminal Connection (Sambungan longgar)",
          "Missing Circuit Directory Label (Label tidak lengkap)",
          "Exposed Energized Busbar / Wiring (Kabel terdedah)",
          "Substandard Earthing Continuity (Earthing tidak sempurna)"
        ]
      },
      "Emergency Generator (Genset & ATS)": {
        defaultSeverity: "High",
        items: [
          "Genset Failure to Auto-Start (Generator gagal)",
          "Faulty Automatic Transfer Switch (ATS gagal)",
          "Dead Starter Battery (Bateri rosak)",
          "Diesel Fuel Line Leakage (Kebocoran bahan api)",
          "Failure to Assume Emergency Load (Gagal ambil emergency load)"
        ]
      },
      "Common Area Lighting (Lampu Kawasan Bersama)": {
        defaultSeverity: "Low",
        items: [
          "Non-Functioning Light Fixture (Lampu rosak)",
          "Emergency Twin-Spot Battery Expired (Emergency light gagal)",
          "Malfunctioning Timer / Motion Sensor (Timer / Sensor rosak)",
          "Inadequate Lux Level Illumination (Pencahayaan tidak mencukupi)"
        ]
      },
      "Lightning Protection System (Sistem Perlindungan Kilat)": {
        defaultSeverity: "High",
        items: [
          "Severed Copper Down-Conductor (Conductor rosak)",
          "Missing Equipotential Bonding Clamp (Bonding hilang)",
          "Air Terminal Rod Severe Corrosion (Kakisan penangkap kilat)",
          "Earth Resistance Test Exceeds 10 Ohms (Earth resistance tidak lulus)"
        ]
      },
      "Fire Protection System (Sistem Kebakaran)": {
        defaultSeverity: "High",
        items: [
          "Fire Sprinkler / Hydrant Pump Fault (Fire pump rosak)",
          "Depressurized Hose Reel System (Hose reel tiada tekanan)",
          "Missing / Expired Fire Extinguisher (Extinguisher luput / tiada)",
          "Fire Alarm Main Panel Fault (Panel penggera rosak)",
          "Defective Smoke / Heat Detector (Detector rosak)",
          "Broken Break-Glass Unit (Break glass pecah / rosak)"
        ]
      },
      "Security & Access Control (Keselamatan & Akses)": {
        defaultSeverity: "Medium",
        items: [
          "CCTV Camera Offline / Blurred / Blind Spot (CCTV rosak)",
          "Boom Gate Barrier Arm Malfunction (Barrier gate rosak)",
          "RFID / Facial Access Reader Failure (Access card gagal)",
          "Guardhouse Intercom Communication Fault (Interkom rosak)",
          "Electromagnetic Lock Jam / Fails to Release (EM Lock rosak)"
        ]
      },
      "Landscape & Amenities (Landskap & Kemudahan)": {
        defaultSeverity: "Low",
        items: [
          "Damaged Playground Equipment / Swings (Peralatan taman permainan rosak)",
          "Loose Walkway Pavers / Trip Hazard (Trip hazard pejalan kaki)",
          "Landscape Garden Drainage Chokage (Saliran landskap bermasalah)",
          "Broken Outdoor Bollard / Spotlight (Lampu taman rosak)"
        ]
      }
    }
  }
};

export const ZONE_OPTIONS = {
  Ground: {
    id: "Ground",
    label: "Ground Floor",
    subDesc: "Kindergarten, Hall, Management Office, Guardhouse, Bin Chamber",
    icon: DoorOpen,
    areas: [
      "Ground Floor Main Lift Lobby (Center)",
      "Main Guardhouse & Boom Gate Entry",
      "Taska (Kindergarten Elevated Wing)",
      "Multipurpose Hall",
      "Management Office Area",
      "Security Post & Intercom Hub",
      "Commercial Lots & Foyer",
      "Refuse & Central Bin Chamber",
      "Outdoor Children Playground",
      "Perimeter Driveway & Apron Drains"
    ]
  },
  Carpark: {
    id: "Carpark",
    label: "Podium Carpark",
    subDesc: "Levels 1A to 7B Ramps, Parking Bays, DB/PBA/ELV Rooms",
    icon: Car,
    floors: [
      "Level 1A", "Level 1B", "Level 2A", "Level 2B", "Level 3A", "Level 3B",
      "Level 3A-1", "Level 3B-1", "Level 4A", "Level 4B", "Level 5A", "Level 5B",
      "Level 6A", "Level 6B", "Level 7A", "Level 7B"
    ],
    baysByFloor: {
      "Level 1A": [
        "General Driveway & Parking Bays", "Visitor Parking Lots V1 to V10",
        "Visitor Parking Lots V11 to V20", "Visitor Parking Lots V21 to V30",
        "Visitor Parking Lots V31 to V34", "DB Room / ELV Room (1A)",
        "PBA Room (1A)", "Water Meter Room (1A)", "Apron Drain & Sump (1A)"
      ],
      "Level 1B": [
        "General Driveway & Parking Bays", "Parking Lots 1B-01 to 1B-10",
        "Parking Lots 1B-11 to 1B-20", "Parking Lots 1B-21 to 1B-30",
        "Parking Lots 1B-31 to 1B-34", "DB Room / ELV Room (1B)",
        "Lift Lobby 1B", "Apron Drain & Sump (1B)"
      ],
      "Level 2A": ["General Driveway & Parking Bays", "Parking Lots 2A-01 to 2A-25", "Parking Lots 2A-26 to 2A-49", "DB Room (2A)", "Lift Lobby 2A"],
      "Level 2B": ["General Driveway & Parking Bays", "Parking Lots 2B-01 to 2B-25", "Parking Lots 2B-26 to 2B-48", "DB Room (2B)", "Lift Lobby 2B"],
      "Level 3A": ["General Driveway & Parking Bays", "Parking Lots 3A-01 to 3A-25", "Parking Lots 3A-26 to 3A-49", "DB Room (3A)", "Lift Lobby 3A"],
      "Level 3B": ["General Driveway & Parking Bays", "Parking Lots 3B-01 to 3B-25", "Parking Lots 3B-26 to 3B-48", "DB Room (3B)", "Lift Lobby 3B"],
      "Level 3A-1": ["General Driveway & Parking Bays", "Parking Lots 3A1-01 to 3A1-25", "Parking Lots 3A1-26 to 3A1-49", "DB Room (3A1)", "Lift Lobby 3A1"],
      "Level 3B-1": ["General Driveway & Parking Bays", "Parking Lots 3B1-01 to 3B1-25", "Parking Lots 3B1-26 to 3B1-48", "DB Room (3B1)", "Lift Lobby 3B1"],
      "Level 4A": ["General Driveway & Parking Bays", "Parking Lots 4A-01 to 4A-25", "Parking Lots 4A-26 to 4A-49", "DB Room (4A)", "Lift Lobby 4A"],
      "Level 4B": ["General Driveway & Parking Bays", "Parking Lots 4B-01 to 4B-25", "Parking Lots 4B-26 to 4B-48", "DB Room (4B)", "Lift Lobby 4B"],
      "Level 5A": ["General Driveway & Parking Bays", "Parking Lots 5A-01 to 5A-25", "Parking Lots 5A-26 to 5A-49", "DB Room (5A)", "Lift Lobby 5A"],
      "Level 5B": ["General Driveway & Parking Bays", "Parking Lots 5B-01 to 5B-25", "Parking Lots 5B-26 to 5B-48", "DB Room (5B)", "Lift Lobby 5B"],
      "Level 6A": ["General Driveway & Parking Bays", "Parking Lots 6A-01 to 6A-25", "Parking Lots 6A-26 to 6A-49", "DB Room (6A)", "Lift Lobby 6A"],
      "Level 6B": ["General Driveway & Parking Bays", "Parking Lots 6B-01 to 6B-25", "Parking Lots 6B-26 to 6B-48", "DB Room (6B)", "Lift Lobby 6B"],
      "Level 7A": ["General Driveway & Parking Bays", "Parking Lots 7A-01 to 7A-25", "Parking Lots 7A-26 to 7A-46", "Pump Room", "Lift Lobby 7A"],
      "Level 7B": ["General Driveway & Top Deck", "Parking Lots 7B-01 to 7B-25", "Parking Lots 7B-26 to 7B-50", "DB Room (7B)", "Lift Lobby 7B"]
    }
  },
  Facility: {
    id: "Facility",
    label: "L8 Facilities",
    subDesc: "Pool, Gym, Sauna, BBQ Area, Kids Playground, Walkways",
    icon: Waves,
    areas: [
      "Swimming Pool", "Outdoor Shower (Pool Area)", "Gymnasium Room",
      "Male Sauna", "Female Sauna", "Male Toilet", "Female Toilet",
      "BBQ Area & Pavilion", "Kids Playground", "Corridor & Perimeter Walkway"
    ]
  },
  Residential: {
    id: "Residential",
    label: "L9–26 Residential Unit",
    subDesc: "Corridors, Meter Rooms, DB Rooms, Unit Entry Doors",
    icon: Building,
    floors: [
      "Level 9 (19 Units)", "Level 10 (23 Units)", "Level 11 (23 Units)", "Level 12 (23 Units)",
      "Level 13 (23 Units)", "Level 13A (23 Units)", "Level 15 (23 Units)", "Level 16 (23 Units)",
      "Level 17 (23 Units)", "Level 18 (23 Units)", "Level 19 (23 Units)", "Level 20 (23 Units)",
      "Level 21 (23 Units)", "Level 22 (23 Units)", "Level 23 (23 Units)", "Level 23A (23 Units)",
      "Level 25 (23 Units)", "Level 26 (23 Units)"
    ]
  },
  Staircase: {
    id: "Staircase",
    label: "Fire Escape Staircase",
    subDesc: "Left, Mid, Right Wing Fire Staircase Flights",
    icon: ArrowUpDown,
    wings: [
      "Left-Wing Emergency Fire Staircase",
      "Middle Core Emergency Fire Staircase",
      "Right-Wing Emergency Fire Staircase"
    ],
    flights: [
      "Ground to Level 1", "Level 1 to Level 2 Flight", "Level 2 to Level 3 Flight",
      "Level 3 to Level 4 Flight", "Level 4 to Level 5 Flight", "Level 5 to Level 6 Flight",
      "Level 6 to Level 7 Flight", "Level 7 to Level 8 Flight", "Level 8 to Level 9 Flight",
      "Level 9 to Level 10 Flight", "Level 10 to Level 11 Flight", "Level 11 to Level 12 Flight",
      "Level 12 to Level 13 Flight", "Level 13 to Level 13A Flight", "Level 13A to Level 15 Flight",
      "Level 15 to Level 16 Flight", "Level 16 to Level 17 Flight", "Level 17 to Level 18 Flight",
      "Level 18 to Level 19 Flight", "Level 19 to Level 20 Flight", "Level 20 to Level 21 Flight",
      "Level 21 to Level 22 Flight", "Level 22 to Level 23 Flight", "Level 23 to Level 23A Flight",
      "Level 23A to Level 25 Flight", "Level 25 to Level 26 Flight", "Level 26 to Level 27 Flight"
    ]
  },
  Rooftop: {
    id: "Rooftop",
    label: "L27 Rooftop and Tank",
    subDesc: "Sky Garden, Left/Right Water Tank Enclosures, Lift Motor Room",
    icon: Layers,
    areas: [
      "Resident Sky View Deck / Garden", "Water Tank Enclosure (Left Tank)",
      "Water Tank Enclosure (Right Tank)", "Lift Motor & Control Room",
      "Rooftop Parapet Wall & Lightning Rods", "Scupper Drain & Outlets Area"
    ]
  }
};