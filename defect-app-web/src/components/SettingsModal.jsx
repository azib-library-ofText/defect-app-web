// src/components/SettingsModal.jsx
import React, { useState, useEffect } from "react";
import { X, User, ShieldAlert, Globe, Save, Check } from "lucide-react";

export default function SettingsModal({ isOpen, onClose, currentInspector, onSaveSettings }) {
  const [inspectorName, setInspectorName] = useState("");
  const [inspectorRole, setInspectorRole] = useState("Building Supervisor");
  const [photoQuality, setPhotoQuality] = useState("standard");
  const [siteLanguage, setSiteLanguage] = useState("bi");
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedName = localStorage.getItem("damai_inspector_name") || currentInspector || "";
      const savedRole = localStorage.getItem("damai_inspector_role") || "Building Supervisor";
      const savedQuality = localStorage.getItem("damai_photo_quality") || "standard";
      const savedLang = localStorage.getItem("damai_site_lang") || "bi";

      setInspectorName(savedName);
      setInspectorRole(savedRole);
      setPhotoQuality(savedQuality);
      setSiteLanguage(savedLang);
      setSavedNotice(false);
    }
  }, [isOpen, currentInspector]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem("damai_inspector_name", inspectorName.trim());
    localStorage.setItem("damai_inspector_role", inspectorRole.trim());
    localStorage.setItem("damai_photo_quality", photoQuality);
    localStorage.setItem("damai_site_lang", siteLanguage);

    if (onSaveSettings) {
      onSaveSettings({
        name: inspectorName.trim(),
        role: inspectorRole.trim(),
        quality: photoQuality,
        lang: siteLanguage,
      });
    }

    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              ⚙️
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Site & Profile Settings
              </h2>
              <p className="text-[11px] text-slate-500">Konfigurasi profil inspektor & sistem</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* 1. Official Inspector Profile */}
          <div className="space-y-2">
            <label className="block text-[11px] font-black uppercase text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Nama Rasmi Inspektor (Laporan DLP)
            </label>
            <input
              type="text"
              required
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              placeholder="cth: Muhamad Azib Rabani"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
            <p className="text-[10px] text-slate-400 italic">
              Nama ini akan menggantikan nama e-mel pelik pada laporan audit rasmi.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-black uppercase text-slate-700">
              Jawatan / Designation
            </label>
            <input
              type="text"
              value={inspectorRole}
              onChange={(e) => setInspectorRole(e.target.value)}
              placeholder="cth: Building Supervisor / Executive"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          {/* 2. Language Selection */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-[11px] font-black uppercase text-slate-700 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              Bahasa Antaramuka & Laporan
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "bi", label: "🌐 Dwibahasa" },
                { id: "ms", label: "🇲🇾 Melayu" },
                { id: "en", label: "🇬🇧 English" }
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setSiteLanguage(lang.id)}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    siteLanguage === lang.id
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Photo Clarity Mode & Warning */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-[11px] font-black uppercase text-slate-700">
              Mod Kualiti Bukti Foto (Camera Capture)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPhotoQuality("standard")}
                className={`p-2.5 rounded-xl border text-left transition ${
                  photoQuality === "standard"
                    ? "bg-blue-50 border-blue-500 text-blue-900"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                <span className="block text-xs font-black">Standard (Lalai)</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  Maks 4 foto • Pantas muat naik
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPhotoQuality("hd")}
                className={`p-2.5 rounded-xl border text-left transition ${
                  photoQuality === "hd"
                    ? "bg-amber-50 border-amber-500 text-amber-900"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                <span className="block text-xs font-black">Ultra Clarity (HD)</span>
                <span className="block text-[10px] text-amber-700 font-semibold mt-0.5">
                  Maks 2 foto • Retak halus
                </span>
              </button>
            </div>

            {/* Dynamic Warning Callout for HD */}
            {photoQuality === "hd" && (
              <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-amber-900 text-xs font-bold">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Peringatan Penggunaan Mod HD:</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-tight">
                  Gunakan mod ini <strong>hanya jika defect memerlukan ketelitian mikro</strong> (seperti retak rambut pada struktur atau rembesan halus). Had simpanan dihadkan kepada <strong>2 keping gambar sahaja</strong> untuk mengelakkan bebanan rangkaian tapak.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow transition flex items-center justify-center gap-1.5"
            >
              {savedNotice ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Tetapan</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}