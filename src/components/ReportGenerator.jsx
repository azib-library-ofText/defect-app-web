// src/components/ReportGenerator.jsx
import React, { useState, useMemo } from "react";
import { ZONE_OPTIONS, PROJECT_CONFIG } from "../constants.jsx";
import {
  Printer,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Building,
  Layers
} from "lucide-react";

export default function ReportGenerator({ defects = [], inspectorTag, onOpenGallery }) {
  // Report Scoping Filters
  const [reportMainZone, setReportMainZone] = useState("All");
  const [reportSubZone, setReportSubZone] = useState("All");
  const [reportStatus, setReportStatus] = useState("All");
  const [reportSeverity, setReportSeverity] = useState("All");

  // Dynamically available sub-layers based on main zone
  const availableSubZones = useMemo(() => {
    if (reportMainZone === "Carpark") return ZONE_OPTIONS.Carpark.floors;
    if (reportMainZone === "Residential") return ZONE_OPTIONS.Residential.floors;
    if (reportMainZone === "Ground") return ZONE_OPTIONS.Ground.areas;
    if (reportMainZone === "Facility") return ZONE_OPTIONS.Facility.areas;
    if (reportMainZone === "Staircase") return ZONE_OPTIONS.Staircase.wings;
    if (reportMainZone === "Rooftop") return ZONE_OPTIONS.Rooftop.areas;
    return [];
  }, [reportMainZone]);

  // Scoped defect records
  const filteredReportDefects = useMemo(() => {
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

  // Executive Summary Metrics for current filtered scope
  const summary = useMemo(() => {
    const total = filteredReportDefects.length;
    const rectified = filteredReportDefects.filter(
      (d) => d.status === "Rectified" || d.status === "Rectified / Closed"
    ).length;
    const inProgress = filteredReportDefects.filter((d) => d.status === "In Progress").length;
    const pending = filteredReportDefects.filter((d) => d.status === "Pending Rectification").length;
    const high = filteredReportDefects.filter((d) => d.severity === "High").length;
    const completionRate = total > 0 ? Math.round((rectified / total) * 100) : 0;

    return { total, rectified, inProgress, pending, high, completionRate };
  }, [filteredReportDefects]);

  // Trigger Native Browser Print Dialog
  const handlePrint = () => {
    window.print();
  };

  // CSV Generator for Excel / Google Sheets
  const handleExportCSV = () => {
    if (filteredReportDefects.length === 0) {
      alert("No defect records to export within selected scope.");
      return;
    }

    const headers = [
      "Defect ID",
      "Date Logged",
      "Main Zone",
      "Sub Zone / Floor",
      "Exact Location & Landmark",
      "Trade Discipline",
      "Element / Classification",
      "Defect Symptom",
      "Severity",
      "Status",
      "Rectification Instructions",
      "Logged By",
      "Photo URLs"
    ];

    const rows = filteredReportDefects.map((d, index) => {
      const photoList =
        d.photoUrls && d.photoUrls.length > 0 ? d.photoUrls : [d.photoUrl].filter(Boolean);
      return [
        `"RD-DEF-${(index + 1).toString().padStart(4, "0")}"`,
        `"${d.date || ""}"`,
        `"${d.zoneId || ""}"`,
        `"${d.subLayer || ""}"`,
        `"${(d.location || "").replace(/"/g, '""')}"`,
        `"${d.trade || ""}"`,
        `"${(d.element || "").replace(/"/g, '""')}"`,
        `"${(d.item || "").replace(/"/g, '""')}"`,
        `"${d.severity || ""}"`,
        `"${d.status || ""}"`,
        `"${(d.desc || "").replace(/"/g, '""')}"`,
        `"${d.loggedBy || ""}"`,
        `"${photoList.join(" ; ")}"`
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `Residensi_Damai_DLP_Report_${reportMainZone}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. INTERACTIVE REPORT CONTROL CONSOLE (HIDDEN ON PRINT) */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              DLP Audit Report Generator
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure scope parameters, preview audit records, and export to PDF or CSV.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-300 transition"
              title="Export as CSV/Excel"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition"
              title="Print to PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Main Zone */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              Main Zone:
            </label>
            <select
              value={reportMainZone}
              onChange={(e) => {
                setReportMainZone(e.target.value);
                setReportSubZone("All");
              }}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
            >
              <option value="All">All Main Zones</option>
              {Object.keys(ZONE_OPTIONS).map((zKey) => (
                <option key={zKey} value={zKey}>
                  {ZONE_OPTIONS[zKey].label}
                </option>
              ))}
            </select>
          </div>

          {/* Sub-Zone / Floor */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Floor / Sub-Area:
            </label>
            <select
              value={reportSubZone}
              onChange={(e) => setReportSubZone(e.target.value)}
              disabled={reportMainZone === "All"}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 disabled:opacity-50"
            >
              <option value="All">All Sub-Areas / Decks</option>
              {availableSubZones.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              Rectification Status:
            </label>
            <select
              value={reportStatus}
              onChange={(e) => setReportStatus(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
            >
              <option value="All">All Statuses</option>
              <option value="Pending Rectification">Pending Rectification</option>
              <option value="In Progress">In Progress</option>
              <option value="Rectified">Rectified / Closed</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              Severity:
            </label>
            <select
              value={reportSeverity}
              onChange={(e) => setReportSeverity(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
            >
              <option value="All">All Severities</option>
              <option value="High">High / Critical</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PRINTABLE AUDIT REPORT SHEET (VISIBLE ON SCREEN & PRINT) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-8 space-y-6 print:p-0 print:border-none print:shadow-none">
        {/* FORMAL REPORT HEADER */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-900 text-white tracking-wider">
                Official DLP Handover Audit
              </span>
              <span className="text-xs text-slate-500 font-semibold">Defect Liability Period</span>
            </div>
            <h1 className="text-2xl font-black text-slate-950 mt-1 uppercase tracking-tight">
              {PROJECT_CONFIG?.buildingName || "Residensi Damai"}
            </h1>
            <p className="text-xs font-semibold text-slate-600">
              Scope: {reportMainZone === "All" ? "Full Development Audit" : reportMainZone}
              {reportSubZone !== "All" && ` • ${reportSubZone}`}
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <p className="text-[11px] text-slate-500">
              Report Date:{" "}
              <strong className="text-slate-900">
                {new Date().toLocaleDateString("en-MY", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </strong>
            </p>
            <p className="text-[11px] text-slate-500">
              Inspector: <strong className="text-slate-900">{inspectorTag || "Staff Inspector"}</strong>
            </p>
            <p className="text-[11px] text-slate-500">
              Export ID:{" "}
              <span className="font-mono font-bold text-slate-700">
                RD-DLP-{Date.now().toString().slice(-6)}
              </span>
            </p>
          </div>
        </div>

        {/* EXECUTIVE SUMMARY METRIC TILES */}
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2.5">
            Executive Defect Audit Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Total in Scope</span>
              <span className="text-xl font-black text-slate-900">{summary.total}</span>
            </div>
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
              <span className="text-[10px] font-bold text-amber-700 uppercase block flex items-center gap-1">
                <Clock className="w-3 h-3" /> Pending
              </span>
              <span className="text-xl font-black text-amber-900">{summary.pending}</span>
            </div>
            <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50">
              <span className="text-[10px] font-bold text-blue-700 uppercase block">In Progress</span>
              <span className="text-xl font-black text-blue-900">{summary.inProgress}</span>
            </div>
            <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Closed
              </span>
              <span className="text-xl font-black text-emerald-900">
                {summary.rectified}{" "}
                <span className="text-xs font-semibold">({summary.completionRate}%)</span>
              </span>
            </div>
            <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-rose-700 uppercase block flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> High Severity
              </span>
              <span className="text-xl font-black text-rose-900">{summary.high}</span>
            </div>
          </div>
        </div>

        {/* AUDIT DEFECT REGISTER LIST */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Defect Items & Photographic Evidence ({filteredReportDefects.length} Items)
            </h3>
            <span className="text-[11px] text-slate-400 italic print:hidden">
              Click photo thumbnails to preview in high resolution
            </span>
          </div>

          {filteredReportDefects.length === 0 ? (
            <div className="py-12 border border-dashed border-slate-300 rounded-2xl text-center text-slate-400 font-medium">
              No defects found matching the selected report parameters.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReportDefects.map((defect, index) => {
                const photoList =
                  defect.photoUrls && defect.photoUrls.length > 0
                    ? defect.photoUrls
                    : [defect.photoUrl].filter(Boolean);

                return (
                  <div
                    key={defect.id || index}
                    className="border border-slate-300 rounded-xl p-4 bg-white break-inside-avoid space-y-3 print:border-slate-400 print:rounded-none"
                    style={{ breakInside: "avoid" }}
                  >
                    {/* Defect Item Header */}
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black px-2 py-0.5 bg-slate-900 text-white rounded">
                            #{index + 1}
                          </span>
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {defect.trade}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                              defect.severity === "High"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : defect.severity === "Medium"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {defect.severity} Severity
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 pt-1">
                          {defect.item}
                        </h4>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs font-black uppercase px-2.5 py-1 rounded-md inline-block ${
                            defect.status === "Rectified" || defect.status === "Rectified / Closed"
                              ? "bg-emerald-100 text-emerald-800"
                              : defect.status === "In Progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {defect.status}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">
                          Logged: {defect.date || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Defect Metadata & Photo Split (Fixed Proportions) */}
                    <div className="grid grid-cols-12 gap-3 pt-1">
                      {/* Left: Location & Specific Rectification Notes (7 cols) */}
                      <div className="col-span-12 sm:col-span-7 space-y-2 text-xs">
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="font-bold text-slate-700 block mb-0.5">Location Hierarchy:</span>
                          <p className="text-slate-800 font-medium">{defect.location || "Common Property"}</p>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="font-bold text-slate-700 block mb-0.5">Classification & Symptom:</span>
                          <p className="text-slate-800">
                            <strong>Element:</strong> {defect.element || "General"} <br />
                            <strong>Defect Item:</strong> {defect.item}
                          </p>
                        </div>

                        {defect.desc && (
                          <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100">
                            <span className="font-bold text-blue-900 block mb-0.5">Rectification Instructions:</span>
                            <p className="text-slate-800 italic">{defect.desc}</p>
                          </div>
                        )}
                      </div>

                      {/* Right: ImgBB Evidence Thumbnails (5 cols) */}
                      <div className="col-span-12 sm:col-span-5 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">
                          Attached Photos ({photoList.length}/4):
                        </span>
                        {photoList.length === 0 ? (
                          <div className="h-32 bg-slate-100 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs font-semibold">
                            No Photo Uploaded
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {photoList.slice(0, 4).map((url, pIdx) => (
                              <div
                                key={pIdx}
                                onClick={() => onOpenGallery && onOpenGallery(photoList, pIdx)}
                                className="relative aspect-video w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-300 cursor-pointer group"
                              >
                                <img
                                  src={url}
                                  alt={`Evidence ${pIdx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition"
                                />
                                <span className="absolute bottom-1 right-1 text-[8px] font-black bg-black/75 text-white px-1.5 py-0.5 rounded">
                                  P{pIdx + 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 3. FORMAL DLP SIGN-OFF BLOCK */}
        {/* ========================================================================= */}
        <div
          className="pt-8 border-t-2 border-slate-900 break-inside-avoid space-y-4"
          style={{ breakInside: "avoid" }}
        >
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
            DLP Verification & Handover Sign-Off
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Inspector */}
            <div className="border border-slate-300 rounded-xl p-3.5 flex flex-col justify-between h-36 bg-slate-50/50 print:bg-transparent">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-500 block">Inspected By</span>
                <p className="text-xs font-bold text-slate-900 mt-1">{inspectorTag || "Staff Inspector"}</p>
                <p className="text-[10px] text-slate-500">Joint Inspection Team</p>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-400 flex justify-between">
                <span>Signature</span>
                <span>Date: ____________</span>
              </div>
            </div>

            {/* Main Contractor */}
            <div className="border border-slate-300 rounded-xl p-3.5 flex flex-col justify-between h-36 bg-slate-50/50 print:bg-transparent">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-500 block">Acknowledged By</span>
                <p className="text-xs font-bold text-slate-900 mt-1">Main Contractor Representative</p>
                <p className="text-[10px] text-slate-500">Site Rectification Team</p>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-400 flex justify-between">
                <span>Signature</span>
                <span>Date: ____________</span>
              </div>
            </div>

            {/* Developer / JMB Management */}
            <div className="border border-slate-300 rounded-xl p-3.5 flex flex-col justify-between h-36 bg-slate-50/50 print:bg-transparent">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-500 block">Verified & Approved By</span>
                <p className="text-xs font-bold text-slate-900 mt-1">Developer / Management Office</p>
                <p className="text-[10px] text-slate-500">Handover Acceptance Authority</p>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-400 flex justify-between">
                <span>Signature & Stamp</span>
                <span>Date: ____________</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}