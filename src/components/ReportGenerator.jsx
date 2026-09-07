// src/components/ReportGenerator.jsx
import React, { useState, useMemo } from "react";
import { ZONE_OPTIONS, PROJECT_CONFIG } from "../constants.jsx";
import {
  Printer,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Building,
  Layers
} from "lucide-react";

export default function ReportGenerator({ defects = [], inspectorTag, onOpenGallery }) {
  const [reportMainZone, setReportMainZone] = useState("All");
  const [reportSubZone, setReportSubZone] = useState("All");
  const [reportStatus, setReportStatus] = useState("All");
  const [reportSeverity, setReportSeverity] = useState("All");

  const availableSubZones = useMemo(() => {
    if (reportMainZone === "Carpark") return ZONE_OPTIONS.Carpark.floors;
    if (reportMainZone === "Residential") return ZONE_OPTIONS.Residential.floors;
    if (reportMainZone === "Ground") return ZONE_OPTIONS.Ground.areas;
    if (reportMainZone === "Facility") return ZONE_OPTIONS.Facility.areas;
    if (reportMainZone === "Staircase") return ZONE_OPTIONS.Staircase.wings;
    if (reportMainZone === "Rooftop") return ZONE_OPTIONS.Rooftop.areas;
    return [];
  }, [reportMainZone]);

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. INTERACTIVE FILTER CONSOLE (HIDDEN ON PRINT) */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm space-y-3 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
              <FileText className="w-4 h-4 text-blue-600" />
              DLP Audit Report Configuration
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Filter audit parameters before exporting or printing the formal handover document.
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
      </div>

      {/* ========================================================================= */}
      {/* 2. FORMAL AUDIT DOCUMENT (ENGINEERING LEDGER STYLE) */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 sm:p-8 border border-slate-300 shadow-sm print:p-0 print:border-none print:shadow-none space-y-6">
        
        {/* DOCUMENT HEADER / LETTERHEAD */}
        <div className="border-b-2 border-slate-900 pb-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                Joint Management Body / Defect Liability Handover
              </span>
              <h1 className="text-xl font-black text-slate-950 uppercase tracking-tight">
                {PROJECT_CONFIG?.buildingName || "Residensi Damai"}
              </h1>
              <p className="text-xs font-bold text-slate-700 mt-0.5">
                DEFECT AUDIT & RECTIFICATION SCHEDULE (COMMON PROPERTY)
              </p>
            </div>

            <div className="text-right text-[11px] space-y-0.5">
              <p className="text-slate-600">
                Doc Ref: <span className="font-mono font-bold text-slate-900">RD/DLP/{new Date().getFullYear()}/{summary.total}</span>
              </p>
              <p className="text-slate-600">
                Date: <strong className="text-slate-900">{new Date().toLocaleDateString("en-MY", { year: "numeric", month: "short", day: "numeric" })}</strong>
              </p>
              <p className="text-slate-600">
                Lead Inspector: <strong className="text-slate-900">{inspectorTag || "Building Supervisor"}</strong>
              </p>
            </div>
          </div>

          <div className="mt-3 py-1.5 px-3 bg-slate-100 border border-slate-300 text-xs font-medium flex justify-between">
            <span>
              <strong>Scope:</strong> {reportMainZone === "All" ? "All Common Property Areas" : reportMainZone}
              {reportSubZone !== "All" && ` • ${reportSubZone}`}
            </span>
            <span>
              <strong>Filter:</strong> Status ({reportStatus}) | Severity ({reportSeverity})
            </span>
          </div>
        </div>

        {/* EXECUTIVE KPI SUMMARY TABLE */}
        <div className="border border-slate-900">
          <div className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1">
            Executive Summary & Defect Statistics
          </div>
          <div className="grid grid-cols-5 text-center divide-x divide-slate-300 text-xs">
            <div className="py-2 bg-slate-50">
              <span className="block text-[10px] text-slate-500 uppercase font-bold">Total In Scope</span>
              <span className="text-base font-black text-slate-900">{summary.total}</span>
            </div>
            <div className="py-2 bg-amber-50/50">
              <span className="block text-[10px] text-amber-800 uppercase font-bold">Pending</span>
              <span className="text-base font-black text-amber-900">{summary.pending}</span>
            </div>
            <div className="py-2 bg-blue-50/50">
              <span className="block text-[10px] text-blue-800 uppercase font-bold">In Progress</span>
              <span className="text-base font-black text-blue-900">{summary.inProgress}</span>
            </div>
            <div className="py-2 bg-emerald-50/50">
              <span className="block text-[10px] text-emerald-800 uppercase font-bold">Rectified</span>
              <span className="text-base font-black text-emerald-900">
                {summary.rectified} ({summary.completionRate}%)
              </span>
            </div>
            <div className="py-2 bg-rose-50/50">
              <span className="block text-[10px] text-rose-800 uppercase font-bold">High Severity</span>
              <span className="text-base font-black text-rose-900">{summary.high}</span>
            </div>
          </div>
        </div>

        {/* AUDIT MASTER TABLE */}
        <div>
          <table className="w-full border-collapse border border-slate-800 text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-wider font-bold">
                <th className="border border-slate-800 p-2 w-10 text-center">No.</th>
                <th className="border border-slate-800 p-2 w-44">Location & Landmark</th>
                <th className="border border-slate-800 p-2">Trade & Defect Description</th>
                <th className="border border-slate-800 p-2 w-52 text-center">Photographic Evidence</th>
                <th className="border border-slate-800 p-2 w-28 text-center">Status / Priority</th>
                <th className="border border-slate-800 p-2 w-36 text-center">Rectification Sign-Off</th>
              </tr>
            </thead>
            <tbody>
              {filteredReportDefects.length === 0 ? (
                <tr>
                  <td colSpan="6" className="border border-slate-300 p-8 text-center text-slate-400 font-semibold italic">
                    No defect records match the selected scope.
                  </td>
                </tr>
              ) : (
                filteredReportDefects.map((defect, index) => {
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
                      {/* 1. Item Index */}
                      <td className="border border-slate-800 p-2 text-center font-mono font-bold bg-slate-50">
                        {index + 1}
                      </td>

                      {/* 2. Location */}
                      <td className="border border-slate-800 p-2 text-[11px] leading-tight space-y-1">
                        <strong className="text-slate-950 block">{defect.location || "Common Property"}</strong>
                        {defect.subLayer && defect.subLayer !== defect.zoneId && (
                          <span className="text-[10px] text-slate-500 block font-semibold">
                            Deck: {defect.subLayer}
                          </span>
                        )}
                        <span className="text-[9px] text-slate-400 font-mono block">
                          Log: {defect.date || "N/A"}
                        </span>
                      </td>

                      {/* 3. Classification & Instructions */}
                      <td className="border border-slate-800 p-2 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-[10px]">
                            {defect.trade}
                          </span>
                          <span className="text-slate-600 text-[10px] font-semibold">
                            • {defect.element}
                          </span>
                        </div>
                        <p className="font-black text-slate-950 text-xs">{defect.item}</p>
                        {defect.desc && (
                          <p className="text-[11px] text-slate-700 italic bg-slate-50 p-1.5 rounded border border-slate-200 mt-1">
                            <strong>Work Required:</strong> {defect.desc}
                          </p>
                        )}
                      </td>

                      {/* 4. Unified Evidence Photo Grid (No Stretch, Tight Inside Cell) */}
                      <td className="border border-slate-800 p-1.5">
                        {photoList.length === 0 ? (
                          <div className="h-16 flex items-center justify-center text-[10px] text-slate-400 italic">
                            No Photo
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-1">
                            {photoList.slice(0, 4).map((url, pIdx) => (
                              <div
                                key={pIdx}
                                onClick={() => onOpenGallery && onOpenGallery(photoList, pIdx)}
                                className="relative aspect-video w-full bg-slate-100 rounded overflow-hidden border border-slate-300 cursor-pointer"
                              >
                                <img
                                  src={url}
                                  alt={`Evidence ${pIdx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <span className="absolute bottom-0.5 right-0.5 text-[7px] font-bold bg-black/75 text-white px-1 rounded">
                                  P{pIdx + 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* 5. Severity & Status */}
                      <td className="border border-slate-800 p-2 text-center space-y-1.5">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block border ${
                            defect.severity === "High"
                              ? "bg-rose-100 text-rose-800 border-rose-300"
                              : defect.severity === "Medium"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-emerald-100 text-emerald-800 border-emerald-300"
                          }`}
                        >
                          {defect.severity} Priority
                        </span>
                        <div className="text-[10px] font-bold text-slate-800 mt-1">
                          {defect.status}
                        </div>
                      </td>

                      {/* 6. Two-Tier In-Row Sign-Off Cell */}
                      <td className="border border-slate-800 p-0 text-[10px]">
                        <div className="p-1.5 border-b border-slate-300 space-y-0.5">
                          <span className="text-[8px] font-bold uppercase text-slate-500 block">
                            Contractor Action:
                          </span>
                          <div className="h-5"></div>
                          <span className="text-[8px] text-slate-400 block border-t border-dotted border-slate-400 pt-0.5">
                            Sign / Date
                          </span>
                        </div>
                        <div className="p-1.5 bg-slate-50 space-y-0.5">
                          <span className="text-[8px] font-bold uppercase text-slate-500 block">
                            JMB Verification:
                          </span>
                          <div className="h-5"></div>
                          <span className="text-[8px] text-slate-400 block border-t border-dotted border-slate-400 pt-0.5">
                            Pass [ ] Rework [ ]
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

        {/* FORMAL MASTER SIGN-OFF BLOCK AT FOOTER */}
        <div
          className="pt-6 border-t-2 border-slate-900 break-inside-avoid space-y-3"
          style={{ breakInside: "avoid" }}
        >
          <div className="text-[11px] font-bold text-slate-900 uppercase">
            Official Acknowledgment & Site Handover Signatures
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-slate-800 p-3 h-28 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-500 block">Joint Inspection Inspector</span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{inspectorTag || "Staff Inspector"}</p>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[9px] text-slate-400 flex justify-between">
                <span>Signature</span>
                <span>Date: ____________</span>
              </div>
            </div>

            <div className="border border-slate-800 p-3 h-28 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-500 block">Main Contractor Site Representative</span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">Name: _______________________</p>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[9px] text-slate-400 flex justify-between">
                <span>Signature</span>
                <span>Date: ____________</span>
              </div>
            </div>

            <div className="border border-slate-800 p-3 h-28 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-500 block">Developer / Management Authority</span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">Stamp & Acceptance</p>
              </div>
              <div className="border-t border-slate-400 pt-1 text-[9px] text-slate-400 flex justify-between">
                <span>Signature</span>
                <span>Date: ____________</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}