// src/components/Annotator.jsx
import React, { useRef, useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

export default function Annotator({ photo, photoIndex, onClose, onConfirm }) {
  const [activeTool, setActiveTool] = useState("circle");
  const [canvasHistory, setCanvasHistory] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  useEffect(() => {
    if (photo && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const maxDim = 600;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        setCanvasHistory([ctx.getImageData(0, 0, w, h)]);
      };
      img.src = photo.dataUrl;
    }
  }, [photo]);

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
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e) => {
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos(coords);
    if (activeTool === "freehand") {
      const ctx = canvasRef.current.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
    }
  };

  const drawMove = (e) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (activeTool === "circle") {
      if (canvasHistory.length > 0) {
        ctx.putImageData(canvasHistory[canvasHistory.length - 1], 0, 0);
      }
      const rx = Math.abs(coords.x - startPos.x) / 2;
      const ry = Math.abs(coords.y - startPos.y) / 2;
      const cx = Math.min(startPos.x, coords.x) + rx;
      const cy = Math.min(startPos.y, coords.y) + ry;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 4;
      ctx.stroke();
    } else if (activeTool === "freehand") {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const stopDraw = () => {
    if (isDrawing && canvasRef.current) {
      setIsDrawing(false);
      const ctx = canvasRef.current.getContext("2d");
      setCanvasHistory((prev) => [
        ...prev,
        ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height),
      ]);
    }
  };

  const handleUndoDraw = () => {
    if (canvasHistory.length > 1) {
      const newHist = canvasHistory.slice(0, -1);
      setCanvasHistory(newHist);
      const ctx = canvasRef.current.getContext("2d");
      ctx.putImageData(newHist[newHist.length - 1], 0, 0);
    }
  };

  const handleConfirm = () => {
    if (canvasRef.current) {
      const annotatedDataUrl = canvasRef.current.toDataURL("image/jpeg", 0.6);
      onConfirm(annotatedDataUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3">
      <div className="bg-white rounded-3xl max-w-xl w-full p-4 md:p-5 space-y-3 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Highlight Defect (Photo #{photoIndex + 1})
            </h3>
            <p className="text-[11px] text-slate-500">Draw a red circle box around the defect</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTool("circle")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border ${
                activeTool === "circle" ? "bg-blue-600 text-white border-blue-600" : "bg-slate-100 text-slate-700"
              }`}
            >
              Circle Box
            </button>
            <button
              onClick={() => setActiveTool("freehand")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border ${
                activeTool === "freehand" ? "bg-blue-600 text-white border-blue-600" : "bg-slate-100 text-slate-700"
              }`}
            >
              Pen
            </button>
            <button onClick={handleUndoDraw} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative w-full flex items-center justify-center bg-black/5 rounded-2xl overflow-hidden touch-none border border-slate-200">
          <canvas
            ref={canvasRef}
            onMouseDown={startDraw}
            onMouseMove={drawMove}
            onMouseUp={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={drawMove}
            onTouchEnd={stopDraw}
            className="max-h-[55vh] max-w-full cursor-crosshair"
          />
        </div>

        <div className="flex justify-between items-center pt-2">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2.5 text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md"
          >
            Confirm Highlight
          </button>
        </div>
      </div>
    </div>
  );
}
