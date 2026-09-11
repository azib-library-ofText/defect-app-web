// src/components/Annotator.jsx
import React, { useRef, useState, useEffect } from "react";
import { X, Check, RotateCcw, Circle } from "lucide-react";

export default function Annotator({ photo, photoIndex, onClose, onConfirm }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState([]);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load image onto canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !photo?.dataUrl) return;
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
      setImageLoaded(true);
    };
    img.src = photo.dataUrl;
  }, [photo]);

  // Touch & Mouse coordinates helper
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    setStartPos(coords);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const currentPos = getCoordinates(e);

    // Restore last state before previewing circle
    if (history.length > 0) {
      ctx.putImageData(history[history.length - 1], 0, 0);
    }

    const radiusX = Math.abs(currentPos.x - startPos.x) / 2;
    const radiusY = Math.abs(currentPos.y - startPos.y) / 2;
    const centerX = Math.min(startPos.x, currentPos.x) + radiusX;
    const centerY = Math.min(startPos.y, currentPos.y) + radiusY;

    ctx.beginPath();
    ctx.strokeStyle = "#ef4444"; // Red highlighter
    ctx.lineWidth = Math.max(4, Math.round(canvas.width / 200));
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.stroke();
  };

  const endDraw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    setHistory((prev) => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const newHistory = history.slice(0, -1);
    ctx.putImageData(newHistory[newHistory.length - 1], 0, 0);
    setHistory(newHistory);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const finalDataUrl = canvas.toDataURL("image/jpeg", 0.85);
    onConfirm(finalDataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-between p-4">
      {/* Top Bar */}
      <div className="w-full max-w-2xl flex items-center justify-between text-white py-2">
        <div className="flex items-center gap-2">
          <Circle className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Tanda Kecacatan / Defect Marker
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleUndo}
            disabled={history.length <= 1}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-30 transition"
            title="Undur (Undo)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas Drawing Viewport */}
      <div className="flex-1 flex items-center justify-center w-full max-w-2xl overflow-hidden p-2">
        <canvas
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          className="max-w-full max-h-[75vh] object-contain rounded-xl border border-slate-700 shadow-2xl cursor-crosshair touch-none"
        />
      </div>

      {/* Bottom Save Action */}
      <div className="w-full max-w-2xl py-3 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="py-2.5 px-4 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700 transition"
        >
          Batal
        </button>
        <button
          onClick={handleSave}
          disabled={!imageLoaded}
          className="py-2.5 px-6 bg-rose-600 text-white font-black text-xs rounded-xl shadow-lg hover:bg-rose-500 flex items-center gap-1.5 transition"
        >
          <Check className="w-4 h-4" />
          <span>Selesai & Gunakan Foto</span>
        </button>
      </div>
    </div>
  );
}