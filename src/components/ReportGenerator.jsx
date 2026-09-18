// src/components/ReportGenerator.jsx
import React, { useState, useMemo } from "react";
import { ZONE_OPTIONS, PROJECT_CONFIG } from "../constants.jsx";
import {
  Printer,
  FileText,
  Image as ImageIcon,
  BarChart2,
  ArrowDownUp,
  Languages
} from "lucide-react";

// Master translation dictionary for report generation
const TRANSLATIONS = {
  bi: {
    docSubtitle: "Jadual Audit & Pembaikan Kecacatan (Harta Bersama) / Defect Audit & Rectification Schedule (Common Property)",
    summaryTitle: "Ringkasan Eksekutif & Statistik Kecacatan / Executive Summary & Defect Statistics",
    totalInScope: "Jumlah Dalam Skop / Total in Scope",
    pending: "Menunggu / Pending",
    inProgress: "Dalam Tindakan / In Progress",
    rectified: "Selesai / Rectified",
    highSeverity: "Kritikal / High Severity",
    colNo: "No.",
    colLocation: "Lokasi & Tempat Rujukan / Location & Landmark",
    colTradeDesc: "Bidang & Keterangan / Trade & Description",
    colPhotos: "Foto Bukti / Evidence Photos",
    colStatusPriority: "Status & Keutamaan / Status & Priority",
    colSignOff: "Pengesahan Pembaikan / Rectification Sign-Off",
    noRecords: "Tiada rekod kecacatan sepadan dengan skop yang dipilih / No defect records match the selected scope.",
    deck: "Aras / Deck",
    logDate: "Tarikh Log / Logged",
    workRequired: "Tindakan Diperlukan / Work Required",
    seeAppendix: "Lihat Plat Lampiran / See Appendix Plate",
    photosCount: "Foto Definisi Tinggi / High-Res Photos",
    noPhoto: "Tiada Foto / No Photo",
    contractorAction: "Tindakan Kontraktor / Contractor Action",
    signDate: "Tandatangan & Tarikh / Sign & Date",
    jmbVerification: "Pengesahan JMB / JMB Verification",
    pass: "Lulus / Pass",
    rework: "Ubah Semula / Rework",
    ackTitle: "Pengesahan Rasmi & Tandatangan Penyerahan Tapak / Official Acknowledgment & Site Handover Signatures",
    inspectorSign: "Pemeriksa Bersama Tapak / Joint Inspection Inspector",
    contractorSign: "Wakil Tapak Kontraktor Utama / Main Contractor Site Representative",
    developerSign: "Pihak Pemaju / Pengurusan / Developer / Management Authority",
    stampAcceptance: "Cop & Penerimaan / Stamp & Acceptance",
    signature: "Tandatangan / Signature",
    date: "Tarikh / Date",
    appendixTitle: "Lampiran Bukti Bergambar / Photographic Evidence Appendix",
    appendixSubtitle: "Plat Rujukan Indeks / Index Reference Plates",
    plate: "Plat / Plate",
    evidenceRef: "Ruj Bukti / Evidence Ref",
    clickZoom: "Klik untuk besarkan / Click to Zoom",
    prioritySuffix: "Keutamaan / Priority"
  },
  ms: {
    docSubtitle: "Jadual Audit & Pembaikan Kecacatan (Harta Bersama)",
    summaryTitle: "Ringkasan Eksekutif & Statistik Kecacatan",
    totalInScope: "Jumlah Dalam Skop",
    pending: "Menunggu",
    inProgress: "Dalam Tindakan",
    rectified: "Selesai",
    highSeverity: "Kritikal / Tinggi",
    colNo: "No.",
    colLocation: "Lokasi & Tempat Rujukan",
    colTradeDesc: "Bidang & Keterangan Kecacatan",
    colPhotos: "Foto Bukti",
    colStatusPriority: "Status & Keutamaan",
    colSignOff: "Pengesahan Pembaikan",
    noRecords: "Tiada rekod kecacatan sepadan dengan skop yang dipilih.",
    deck: "Aras",
    logDate: "Tarikh Log",
    workRequired: "Tindakan Diperlukan",
    seeAppendix: "Lihat Plat Lampiran",
    photosCount: "Foto Definisi Tinggi",
    noPhoto: "Tiada Foto",
    contractorAction: "Tindakan Kontraktor",
    signDate: "Tandatangan / Tarikh",
    jmbVerification: "Pengesahan JMB",
    pass: "Lulus",
    rework: "Ubah Semula",
    ackTitle: "Pengesahan Rasmi & Tandatangan Penyerahan Tapak",
    inspectorSign: "Pemeriksa Bersama Tapak",
    contractorSign: "Wakil Tapak Kontraktor Utama",
    developerSign: "Pihak Pemaju / Pengurusan",
    stampAcceptance: "Cop & Penerimaan",
    signature: "Tandatangan",
    date: "Tarikh",
    appendixTitle: "Lampiran Bukti Bergambar",
    appendixSubtitle: "Plat Rujukan Indeks",
    plate: "Plat",
    evidenceRef: "Ruj Bukti",
    clickZoom: "Klik untuk besarkan",
    prioritySuffix: "Keutamaan"
  },
  en: {
    docSubtitle: "Defect Audit & Rectification Schedule (Common Property)",
    summaryTitle: "Executive Summary & Defect Statistics",
    totalInScope: "Total In Scope",
    pending: "Pending",
    inProgress: "In Progress",
    rectified: "Rectified",
    highSeverity: "High Severity",
    colNo: "No.",
    colLocation: "Location & Landmark",
    colTradeDesc: "Trade & Defect Description",
    colPhotos: "Evidence Photos",
    colStatusPriority: "Status / Priority",
    colSignOff: "Rectification Sign-Off",
    noRecords: "No defect records match the selected scope.",
    deck: "Deck",
    logDate: "Log Date",
    workRequired: "Work Required",
    seeAppendix: "See Appendix Plate",
    photosCount: "High-Res Photos",
    noPhoto: "No Photo",
    contractorAction: "Contractor Action",
    signDate: "Sign / Date",
    jmbVerification: "JMB Verification",
    pass: "Pass",
    rework: "Rework",
    ackTitle: "Official Acknowledgment & Site Handover Signatures",
    inspectorSign: "Joint Inspection Inspector",
    contractorSign: "Main Contractor Site Representative",
    developerSign: "Developer / Management Authority",
    stampAcceptance: "Stamp & Acceptance",
    signature: "Signature",
    date: "Date",
    appendixTitle: "Photographic Evidence Appendix",
    appendixSubtitle: "Index Reference Plates",
    plate: "Plate",
    evidenceRef: "Evidence Ref",
    clickZoom: "Click to Zoom",
    prioritySuffix: "Priority"
  }
};

// Spatial Zone hierarchy order
const ZONE_HIERARCHY_RANK = {
  Ground: 1,
  Carpark: 2,
  Facility: 3,
  Residential: 4,
  Rooftop: 5,
  Staircase: 6
};

// Utility to parse text strings with catalog format: "English (Melayu)"
function formatBilingualText(text = "", lang = "bi") {
  if (!text) return "";
  const match = text.match(/^([^(]+)\s*\(([^)]+)\)$/);
  if (!match) return text;

  const english = match[1].trim();
  const malay = match[2].trim();

  if (lang === "en") return english;
  if (lang === "ms") return malay;
  return (
    <span>
      {malay} <span className="text-slate-500 font-normal italic">({english})</span>
    </span>
  );
}

export default function ReportGenerator({ defects = [], inspectorTag, onOpenGallery }) {
  const [reportMainZone, setReportMainZone] = useState("All");
  const [reportSubZone, setReportSubZone] = useState("All");
  const [reportStatus, setReportStatus] = useState("All");
  const [reportSeverity, setReportSeverity] = useState("All");
  const [sortBy, setSortBy] = useState("oldestFirst"); // "oldestFirst", "hierarchy", "newestFirst"
  const [reportLang, setReportLang] = useState("bi"); // "bi", "ms", "en"
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeAppendix, setIncludeAppendix] = useState(true);

  const t = TRANSLATIONS[reportLang] || TRANSLATIONS.bi;

  // Dynamic Sub-Zone options
  const availableSubZones = useMemo(() => {
    if (reportMainZone === "Carpark") return ZONE_OPTIONS.Carpark.floors;
    if (reportMainZone === "Residential") return ZONE_OPTIONS.Residential.floors;
    if (reportMainZone === "Ground") return ZONE_OPTIONS.Ground.areas;
    if (reportMainZone === "Facility") return ZONE_OPTIONS.Facility.areas;
    if (reportMainZone === "Staircase") return ZONE_OPTIONS.Staircase.wings;
    if (reportMainZone === "Rooftop") return ZONE_OPTIONS.Rooftop.areas;
    return [];
  }, [reportMainZone]);

  // Filter defects by parameters
  const filteredDefects = useMemo(() => {
    return defects.filter((d) => {
      const matchZone = reportMainZone === "All" || d.zoneId === reportMainZone;
      const matchSubZone =
        reportSubZone === "All" ||
        d.subLayer === reportSubZone ||
        (d.location || "").includes(reportSubZone);
      const matchStatus = reportStatus === "All" || d.status === reportStatus;
      const matchSeverity = reportSeverity === "All" || d.severity === reportSeverity;

      return matchZone && matchSubZone && matchStatus && matchSeverity;
    });
  }, [defects, reportMainZone, reportSubZone, reportStatus, reportSeverity]);

  // Dual Sort Ordering Pipeline
  const sortedReportDefects = useMemo(() => {
    const list = [...filteredDefects];

    if (sortBy === "oldestFirst") {
      // Ascending chronological: early entries on top, new entries append to the bottom
      return list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    }

    if (sortBy === "newestFirst") {
      // Descending chronological
      return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    if (sortBy === "hierarchy") {
      // Spatial level flow: Ground -> Carpark -> Facility -> Residential -> Rooftop -> Staircase
      return list.sort((a, b) => {
        const rankA = ZONE_HIERARCHY_RANK[a.zoneId] || 99;
        const rankB = ZONE_HIERARCHY_RANK[b.zoneId] || 99;
        if (rankA !== rankB) return rankA - rankB;

        // Sublayer alphanumeric sorting (e.g., Level 1A before Level 2B)
        const subA = a.subLayer || "";
        const subB = b.subLayer || "";
        const subCompare = subA.localeCompare(subB, undefined, { numeric: true });
        if (subCompare !== 0) return subCompare;

        // Earliest first within same floor
        return (a.createdAt || 0) - (b.createdAt || 0);
      });
    }

    return list;
  }, [filteredDefects, sortBy]);

  // Executive summary statistics
  const summary = useMemo(() => {
    const total = sortedReportDefects.length;
    const rectified = sortedReportDefects.filter(
      (d) => d.status === "Rectified" || d.status === "Rectified / Closed"
    ).length;
    const inProgress = sortedReportDefects.filter((d) => d.status === "In Progress").length;
    const pending = sortedReportDefects.filter((d) => d.status === "Pending Rectification").length;
    const high = sortedReportDefects.filter((d) => d.severity === "High").length;
    const completionRate = total > 0 ? Math.round((rectified / total) * 100) : 0;

    return { total, rectified, inProgress, pending, high, completionRate };
  }, [sortedReportDefects]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. KONSOL PENAPIS & KONFIGURASI LAPORAN (DISEMBUNYIKAN SEMASA CETAK)      */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm space-y-3 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
              <FileText className="w-4 h-4 text-blue-600" />
              DLP Audit Report Configuration
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Filter audit parameters, choose language, and configure report ordering before exporting to PDF.
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="py-2 px-4 bg-slate-900 hover:bg-black text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Report</span>
          </button>
        </div>

        {/* Row 1: Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
              Zone Filter:
            </label>
            <select
              value={reportMainZone}
              onChange={(e) => {
                setReportMainZone(e.target.value);
                setReportSubZone("All");
              }}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800"
            >
              <option value="All">All Main Zones</option>
              {Object.keys(ZONE_OPTIONS).map((zKey) => (
                <option key={zKey} value={zKey}>
                  {ZONE_OPTIONS[zKey].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
              Sub-Area / Deck:
            </label>
            <select
              value={reportSubZone}
              onChange={(e) => setReportSubZone(e.target.value)}
              disabled={reportMainZone === "All"}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800 disabled:opacity-50"
            >
              <option value="All">All Floors / Decks</option>
              {availableSubZones.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
              Status:
            </label>
            <select
              value={reportStatus}
              onChange={(e) => setReportStatus(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800"
            >
              <option value="All">All Statuses</option>
              <option value="Pending Rectification">Pending Rectification</option>
              <option value="In Progress">In Progress</option>
              <option value="Rectified">Rectified / Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
              Severity:
            </label>
            <select
              value={reportSeverity}
              onChange={(e) => setReportSeverity(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800"
            >
              <option value="All">All Severities</option>
              <option value="High">High / Critical</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Row 2: Sort Ordering & Bilingual Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1 flex items-center gap-1">
              <ArrowDownUp className="w-3.5 h-3.5 text-blue-600" />
              Susunan Laporan / Order Sequence:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full text-xs p-2 bg-blue-50/70 border border-blue-300 rounded-lg font-bold text-blue-950"
            >
              <option value="oldestFirst">
                1. Tarikh Terawal ➔ Terkini (Rekod Baru Ditambah di Bawah Sekali)
              </option>
              <option value="hierarchy">
                2. Hierarki Aras (Ground ➔ Carpark ➔ Tingkat Atas ➔ Rooftop)
              </option>
              <option value="newestFirst">
                3. Tarikh Terkini ➔ Terawal (Rekod Baru di Muka Surat Pertama)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1 flex items-center gap-1">
              <Languages className="w-3.5 h-3.5 text-blue-600" />
              Bahasa Dokumen / Report Language:
            </label>
            <select
              value={reportLang}
              onChange={(e) => setReportLang(e.target.value)}
              className="w-full text-xs p-2 bg-blue-50/70 border border-blue-300 rounded-lg font-bold text-blue-950"
            >
              <option value="bi">Dwibahasa (Bahasa Melayu / English)</option>
              <option value="ms">Bahasa Melayu Sahaja</option>
              <option value="en">English Only</option>
            </select>
          </div>
        </div>

        {/* Row 3: Section Checkboxes */}
        <div className="pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeSummary}
                onChange={(e) => setIncludeSummary(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                Include Executive Summary & Statistics
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeAppendix}
                onChange={(e) => setIncludeAppendix(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                Include Photographic Appendix Plates
              </span>
            </label>
          </div>

          <span className="text-[11px] text-slate-500 italic">
            {!includeSummary && !includeAppendix ? "Defect schedule only" : "Customized audit package"}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DOKUMEN AUDIT RASMI (GAYA PRINT / PDF)                                 */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 sm:p-8 border border-slate-300 shadow-sm print:p-0 print:border-none print:shadow-none space-y-6">
        
        {/* HEADER RASMI BERSIH: NAMA PROJEK & SUBTAJUK DWIBAHASA */}
        <div className="border-b-2 border-slate-900 pb-2">
          <h1 className="text-xl font-black text-slate-950 uppercase tracking-tight">
            {PROJECT_CONFIG?.buildingName || "Residensi Damai"}
          </h1>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mt-0.5">
            {t.docSubtitle}
          </p>
        </div>

        {/* JADUAL RINGKASAN EKSEKUTIF (DIKAWAL OLEH TOGOL) */}
        {includeSummary && (
          <div className="border border-slate-900">
            <div
              className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1"
              style={{
                backgroundColor: "#0f172a",
                color: "#ffffff",
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact"
              }}
            >
              {t.summaryTitle}
            </div>
            <div className="grid grid-cols-5 text-center divide-x divide-slate-300 text-xs">
              <div className="py-2 bg-slate-50" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                <span className="block text-[10px] text-slate-500 uppercase font-bold">{t.totalInScope}</span>
                <span className="text-base font-black text-slate-900">{summary.total}</span>
              </div>
              <div className="py-2 bg-amber-50/50" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                <span className="block text-[10px] text-amber-800 uppercase font-bold">{t.pending}</span>
                <span className="text-base font-black text-amber-900">{summary.pending}</span>
              </div>
              <div className="py-2 bg-blue-50/50" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                <span className="block text-[10px] text-blue-800 uppercase font-bold">{t.inProgress}</span>
                <span className="text-base font-black text-blue-900">{summary.inProgress}</span>
              </div>
              <div className="py-2 bg-emerald-50/50" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                <span className="block text-[10px] text-emerald-800 uppercase font-bold">{t.rectified}</span>
                <span className="text-base font-black text-emerald-900">
                  {summary.rectified} ({summary.completionRate}%)
                </span>
              </div>
              <div className="py-2 bg-rose-50/50" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                <span className="block text-[10px] text-rose-800 uppercase font-bold">{t.highSeverity}</span>
                <span className="text-base font-black text-rose-900">{summary.high}</span>
              </div>
            </div>
          </div>
        )}

        {/* JADUAL AUDIT UTAMA */}
        <div>
          <table className="w-full border-collapse border border-slate-800 text-left text-xs">
            <thead>
              <tr
                style={{
                  backgroundColor: "#0f172a",
                  color: "#ffffff",
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact"
                }}
                className="bg-slate-900 text-white text-[10px] uppercase tracking-wider font-bold"
              >
                <th
                  className="border border-slate-800 p-2 w-10 text-center"
                  style={{ backgroundColor: "#0f172a", color: "#ffffff", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
                >
                  {t.colNo}
                </th>
                <th
                  className="border border-slate-800 p-2 w-44"
                  style={{ backgroundColor: "#0f172a", color: "#ffffff", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
                >
                  {t.colLocation}
                </th>
                <th
                  className="border border-slate-800 p-2"
                  style={{ backgroundColor: "#0f172a", color: "#ffffff", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
                >
                  {t.colTradeDesc}
                </th>
                <th
                  className="border border-slate-800 p-2 w-48 text-center"
                  style={{ backgroundColor: "#0f172a", color: "#ffffff", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
                >
                  {t.colPhotos}
                </th>
                <th
                  className="border border-slate-800 p-2 w-28 text-center"
                  style={{ backgroundColor: "#0f172a", color: "#ffffff", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
                >
                  {t.colStatusPriority}
                </th>
                <th
                  className="border border-slate-800 p-2 w-36 text-center"
                  style={{ backgroundColor: "#0f172a", color: "#ffffff", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
                >
                  {t.colSignOff}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedReportDefects.length === 0 ? (
                <tr>
                  <td colSpan="6" className="border border-slate-300 p-8 text-center text-slate-400 font-semibold italic">
                    {t.noRecords}
                  </td>
                </tr>
              ) : (
                sortedReportDefects.map((defect, index) => {
                  const photoList =
                    defect.photoUrls && defect.photoUrls.length > 0
                      ? defect.photoUrls
                      : [defect.photoUrl].filter(Boolean);

                  return (
                    <tr
                      key={defect.id || index}
                      className="break-inside-avoid border-b border-slate-800 align-top"
                      style={{ breakInside: "avoid" }}
                    >
                      <td className="border border-slate-800 p-2 text-center font-mono font-bold bg-slate-50" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                        {index + 1}
                      </td>

                      <td className="border border-slate-800 p-2 text-[11px] leading-tight space-y-1">
                        <strong className="text-slate-950 block">{defect.location || "Common Property"}</strong>
                        {defect.subLayer && defect.subLayer !== defect.zoneId && (
                          <span className="text-[10px] text-slate-500 block font-semibold">
                            {t.deck}: {defect.subLayer}
                          </span>
                        )}
                        <span className="text-[9px] text-slate-400 font-mono block">
                          {t.logDate}: {defect.date || "N/A"}
                        </span>
                      </td>

                      <td className="border border-slate-800 p-2 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-[10px]" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                            {formatBilingualText(defect.trade, reportLang)}
                          </span>
                          <span className="text-slate-600 text-[10px] font-semibold">
                            • {formatBilingualText(defect.element, reportLang)}
                          </span>
                        </div>
                        <p className="font-black text-slate-950 text-xs">
                          {formatBilingualText(defect.item, reportLang)}
                        </p>
                        {defect.desc && (
                          <p className="text-[11px] text-slate-700 italic bg-slate-50 p-1.5 rounded border border-slate-200 mt-1" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                            <strong>{t.workRequired}:</strong> {defect.desc}
                          </p>
                        )}
                        {includeAppendix && photoList.length > 0 && (
                          <span className="text-[9px] font-bold text-blue-700 block pt-0.5">
                            ↳ {t.seeAppendix} #{index + 1} ({photoList.length} {t.photosCount})
                          </span>
                        )}
                      </td>

                      <td className="border border-slate-800 p-1.5">
                        {photoList.length === 0 ? (
                          <div className="h-16 flex items-center justify-center text-[10px] text-slate-400 italic">
                            {t.noPhoto}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {photoList.slice(0, 4).map((url, pIdx) => (
                              <div
                                key={pIdx}
                                onClick={() => onOpenGallery && onOpenGallery(photoList, pIdx)}
                                className="relative aspect-video w-full bg-slate-100 rounded overflow-hidden border border-slate-300 cursor-pointer shadow-xs"
                                style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
                              >
                                <img
                                  src={url}
                                  alt={`Evidence ${pIdx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <span className="absolute bottom-1 right-1 text-[8px] font-bold bg-black/75 text-white px-1.5 py-0.5 rounded" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                                  {index + 1}.{pIdx + 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="border border-slate-800 p-2 text-center space-y-1.5">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block border ${
                            defect.severity === "High"
                              ? "bg-rose-100 text-rose-800 border-rose-300"
                              : defect.severity === "Medium"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-emerald-100 text-emerald-800 border-emerald-300"
                          }`}
                          style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
                        >
                          {defect.severity} {t.prioritySuffix}
                        </span>
                        <div className="text-[10px] font-bold text-slate-800 mt-1">
                          {defect.status}
                        </div>
                      </td>

                      <td className="border border-slate-800 p-0 text-[10px]">
                        <div className="p-1.5 border-b border-slate-300 space-y-0.5">
                          <span className="text-[8px] font-bold uppercase text-slate-500 block">
                            {t.contractorAction}:
                          </span>
                          <div className="h-5"></div>
                          <span className="text-[8px] text-slate-400 block border-t border-dotted border-slate-400 pt-0.5">
                            {t.signDate}
                          </span>
                        </div>
                        <div className="p-1.5 bg-slate-50 space-y-0.5" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                          <span className="text-[8px] font-bold uppercase text-slate-500 block">
                            {t.jmbVerification}:
                          </span>
                          <div className="h-5"></div>
                          <span className="text-[8px] text-slate-400 block border-t border-dotted border-slate-400 pt-0.5">
                            {t.pass} [ ] {t.rework} [ ]
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* MASTER SIGN-OFF BLOCK */}
        <div
          className="pt-6 border-t-2 border-slate-900 break-inside-avoid space-y-3"
          style={{ breakInside: "avoid" }}
        >
          <div className="text-[11px] font-bold text-slate-900 uppercase">
            {t.ackTitle}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-slate-800 p-3 h-28 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-500 block">{t.inspectorSign}</span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{inspectorTag || "Staff Inspector"}</p>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[9px] text-slate-400 flex justify-between">
                <span>{t.signature}</span>
                <span>{t.date}: ____________</span>
              </div>
            </div>

            <div className="border border-slate-800 p-3 h-28 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-500 block">{t.contractorSign}</span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">Name: _______________________</p>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[9px] text-slate-400 flex justify-between">
                <span>{t.signature}</span>
                <span>{t.date}: ____________</span>
              </div>
            </div>

            <div className="border border-slate-800 p-3 h-28 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-500 block">{t.developerSign}</span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{t.stampAcceptance}</p>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[9px] text-slate-400 flex justify-between">
                <span>{t.signature}</span>
                <span>{t.date}: ____________</span>
              </div>
            </div>
          </div>
        </div>

        {/* APENDIKS BUKTI FOTO DEFINISI TINGGI */}
        {includeAppendix && (
          <div className="pt-8 space-y-8" style={{ breakBefore: "page" }}>
            <div className="border-b-2 border-slate-900 pb-2 flex justify-between items-end">
              <div>
                <h2 className="text-lg font-black text-slate-950 uppercase">
                  {t.appendixTitle}
                </h2>
              </div>
              <span className="text-xs font-bold text-slate-600">
                {t.appendixSubtitle}
              </span>
            </div>

            <div className="space-y-8">
              {sortedReportDefects.map((defect, dIdx) => {
                const photoList =
                  defect.photoUrls && defect.photoUrls.length > 0
                    ? defect.photoUrls
                    : [defect.photoUrl].filter(Boolean);

                if (photoList.length === 0) return null;

                return (
                  <div
                    key={`appendix_${defect.id || dIdx}`}
                    className="border border-slate-400 rounded-lg p-4 bg-slate-50/50 break-inside-avoid space-y-3"
                    style={{ breakInside: "avoid", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
                  >
                    <div className="flex justify-between items-start border-b border-slate-300 pb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="font-mono text-xs font-black px-2 py-0.5 rounded"
                            style={{ backgroundColor: "#0f172a", color: "#ffffff", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
                          >
                            {t.plate} #{dIdx + 1}
                          </span>
                          <span className="text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                            {formatBilingualText(defect.trade, reportLang)}
                          </span>
                          <span className="text-xs font-black text-slate-900">
                            {formatBilingualText(defect.item, reportLang)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 font-medium">
                          <strong>Location:</strong> {defect.location || "Common Property"}
                        </p>
                      </div>

                      <div className="text-right text-[11px]">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            defect.severity === "High"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                          style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
                        >
                          {defect.severity} {t.prioritySuffix}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          {t.logDate}: {defect.date || "N/A"}
                        </p>
                      </div>
                    </div>

                    {defect.desc && (
                      <div className="text-xs text-slate-800 bg-white p-2 rounded border border-slate-200 italic">
                        <strong>{t.workRequired}:</strong> {defect.desc}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {photoList.map((url, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => onOpenGallery && onOpenGallery(photoList, pIdx)}
                          className="space-y-1 cursor-pointer group"
                        >
                          <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden border border-slate-300 shadow-sm" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                            <img
                              src={url}
                              alt={`Plate ${dIdx + 1} Photo ${pIdx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-[1.02] transition"
                            />
                            <span className="absolute bottom-1.5 right-1.5 text-[9px] font-black bg-black/80 text-white px-2 py-0.5 rounded" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                              Photo {dIdx + 1}.{pIdx + 1}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-500 px-1 font-mono">
                            <span>{t.evidenceRef}: RD-IMG-{dIdx + 1}-{pIdx + 1}</span>
                            <span>{t.clickZoom}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}