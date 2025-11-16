import React, { useEffect, useRef, useState } from "react";

/**
 * TrackTracer (final)
 *
 * - Multi-path tracing (outer + inner + more)
 * - Finish -> draw final track on canvas
 * - Export PNG
 * - EXPORT CANVAS CODE -> downloads `track-draw.js` which contains:
 *     drawTrackSmoothed(ctx) // recommended (uses smoothing)
 *     drawTrackRaw(ctx)      // uses raw points
 *
 * Usage:
 * <TrackTracer imgSrc="/track.png" canvasWidth={1200} canvasHeight={700} />
 */

export default function TrackTracer({
  imgSrc,
  canvasWidth = 1000,
  canvasHeight = 600,
}) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const [paths, setPaths] = useState([[]]); // array of paths (each path = [{x,y},...])
  const [activePath, setActivePath] = useState(0);
  const [isDrawing, setIsDrawing] = useState(true);
  const [mousePos, setMousePos] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Visual params (tweakable)
  const asphaltColor = "#2c2c2e";
  const asphaltWidth = 36;
  const curbWidth = 60;
  const dash = 24;
  const gap = 24;
  const curbPattern = [dash, gap];

  // Load PNG guide
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgSrc;
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
      redraw();
    };
    img.onerror = () => {
      console.warn("Failed to load:", imgSrc);
      imgRef.current = null;
      setImageLoaded(false);
      redraw();
    };
  }, [imgSrc]);

  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paths, mousePos, imageLoaded, activePath]);

  function getCtx() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }

  function redraw() {
    const ctx = getCtx();
    if (!ctx) return;
    const canvas = canvasRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // guide image (faint)
    if (imgRef.current) {
      const img = imgRef.current;
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (canvas.width - w) / 2;
      const y = (canvas.height - h) / 2;
      ctx.globalAlpha = 0.55;
      ctx.drawImage(img, x, y, w, h);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = "#0b0b0b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // draw every path (polyline) and points
    for (let idx = 0; idx < paths.length; idx++) {
      const path = paths[idx];
      if (!path || path.length === 0) continue;

      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // points
      for (const p of path) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = idx === activePath ? "yellow" : "white";
        ctx.fill();
      }
    }

    // preview for active path
    const cur = paths[activePath] || [];
    if (mousePos && isDrawing && cur.length > 0) {
      const last = cur[cur.length - 1];
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(mousePos.x, mousePos.y);
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function handleClick(e) {
    if (!isDrawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvasRef.current.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvasRef.current.height;

    setPaths((prev) => {
      const updated = prev.map((p) => p.slice());
      updated[activePath] = [...(updated[activePath] || []), { x, y }];
      return updated;
    });
  }

  function handleMouseMove(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvasRef.current.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvasRef.current.height;
    setMousePos({ x, y });
  }

  function startNewPath() {
    setPaths((prev) => {
      const next = prev.map((p) => p.slice());
      next.push([]);
      return next;
    });
    setActivePath(paths.length); // will be previous length (next index)
  }

  function undoLast() {
    if (!isDrawing) return;
    setPaths((prev) => {
      const next = prev.map((p) => p.slice());
      if (!next[activePath] || next[activePath].length === 0) return next;
      next[activePath].pop();
      return next;
    });
  }

  function clearAll() {
    setPaths([[]]);
    setActivePath(0);
    setIsDrawing(true);
    redraw();
  }

  function finishTracing() {
    if (!paths.some((p) => p.length > 1)) {
      alert("Trace at least one path with 2+ points.");
      return;
    }
    setIsDrawing(false);
    drawFinalTrack();
  }

  // smoothing function (Catmull-Rom like -> returns many points)
  function getSmooth(points, tension = 0.5, segments = 12) {
    if (!points || points.length < 2) return points.slice();
    const out = [];
    const pts = points.slice();
    for (let i = -1; i < pts.length - 1; i++) {
      const p0 = i < 0 ? pts[0] : pts[i];
      const p1 = pts[i + 1];
      const p2 = i + 2 < pts.length ? pts[i + 2] : p1;
      const p3 = i + 3 < pts.length ? pts[i + 3] : p2;

      for (let t = 0; t <= segments; t++) {
        const tt = t / segments;
        const t2 = tt * tt;
        const t3 = t2 * tt;

        const q1 = -tension * t3 + 2 * tension * t2 - tension * tt;
        const q2 = (2 - tension) * t3 + (tension - 3) * t2 + 1;
        const q3 = (tension - 2) * t3 + (3 - 2 * tension) * t2 + tension * tt;
        const q4 = tension * t3 - tension * t2;

        const x = q1 * p0.x + q2 * p1.x + q3 * p2.x + q4 * p3.x;
        const y = q1 * p0.y + q2 * p1.y + q3 * p2.y + q4 * p3.y;
        out.push({ x, y });
      }
    }
    return out;
  }

  function drawPathWithCurbs(ctx, pointsArray) {
    if (!pointsArray || pointsArray.length < 2) return;
    const smooth = getSmooth(pointsArray);

    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // red curbs
    ctx.beginPath();
    ctx.moveTo(smooth[0].x, smooth[0].y);
    for (let i = 1; i < smooth.length; i++) ctx.lineTo(smooth[i].x, smooth[i].y);
    ctx.strokeStyle = "red";
    ctx.lineWidth = curbWidth;
    ctx.setLineDash(curbPattern);
    ctx.lineDashOffset = 0;
    ctx.stroke();

    // white curbs (offset)
    ctx.beginPath();
    ctx.moveTo(smooth[0].x, smooth[0].y);
    for (let i = 1; i < smooth.length; i++) ctx.lineTo(smooth[i].x, smooth[i].y);
    ctx.strokeStyle = "white";
    ctx.lineWidth = curbWidth;
    ctx.setLineDash(curbPattern);
    ctx.lineDashOffset = dash;
    ctx.stroke();

    // asphalt center
    ctx.beginPath();
    ctx.moveTo(smooth[0].x, smooth[0].y);
    for (let i = 1; i < smooth.length; i++) ctx.lineTo(smooth[i].x, smooth[i].y);
    ctx.strokeStyle = asphaltColor;
    ctx.lineWidth = asphaltWidth;
    ctx.setLineDash([]);
    ctx.stroke();

    ctx.restore();
  }

  function drawFinalTrack() {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // optionally re-draw faint guide
    if (imgRef.current) {
      const img = imgRef.current;
      const scale = Math.min(canvasRef.current.width / img.width, canvasRef.current.height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (canvasRef.current.width - w) / 2;
      const y = (canvasRef.current.height - h) / 2;
      ctx.globalAlpha = 0.55;
      ctx.drawImage(img, x, y, w, h);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = "#0b0b0b";
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    // draw every path
    for (const p of paths) {
      if (p.length > 1) drawPathWithCurbs(ctx, p);
    }
  }

  // Export canvas PNG
  function exportPNG() {
    const link = document.createElement("a");
    link.download = "track.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }

  // Build and download JS code that draws the track on any canvas context
  function exportCanvasCode() {
    // We'll export both smoothed and raw variants
    // Helper: convert a JS array of points into literal string
    function pointsToLiteral(pointsArray) {
      // Format numbers with fixed 2 decimals to keep code readable
      const literals = pointsArray.map((p) => `{x:${p.x.toFixed(2)},y:${p.y.toFixed(2)}}`);
      return `[${literals.join(",")}]`;
    }

    // Build arrays for raw and smoothed
    const rawPaths = paths.map((p) => p.slice()); // copy
    const smoothPaths = paths.map((p) => getSmooth(p));

    // Build code string
    let code = "";
    code += "// track-draw.js — generated by TrackTracer\n";
    code += "// Contains two functions: drawTrackSmoothed(ctx) and drawTrackRaw(ctx)\n";
    code += "// Usage:\n";
    code += "// 1) include this script or paste functions into your project\n";
    code += "// 2) call drawTrackSmoothed(ctx) where ctx is a 2D canvas context\n\n";

    // constants
    code += "const _ASPHALT_COLOR = \"" + asphaltColor + "\";\n";
    code += "const _ASPHALT_WIDTH = " + asphaltWidth + ";\n";
    code += "const _CURB_WIDTH = " + curbWidth + ";\n";
    code += "const _DASH = " + dash + ";\n";
    code += "const _GAP = " + gap + ";\n\n";

    // raw paths data
    code += "// Raw paths (your clicked points)\n";
    code += "const RAW_PATHS = [\n";
    for (let i = 0; i < rawPaths.length; i++) {
      code += "  " + pointsToLiteral(rawPaths[i]) + (i === rawPaths.length - 1 ? "\n" : ",\n");
    }
    code += "];\n\n";

    // smoothed paths data
    code += "// Smoothed paths (pre-calculated)\n";
    code += "const SMOOTH_PATHS = [\n";
    for (let i = 0; i < smoothPaths.length; i++) {
      code += "  " + pointsToLiteral(smoothPaths[i]) + (i === smoothPaths.length - 1 ? "\n" : ",\n");
    }
    code += "];\n\n";

    // helper drawing routine used in both functions
    code += "function _drawPathWithCurbs(ctx, pts) {\n";
    code += "  if (!pts || pts.length < 2) return;\n";
    code += "  ctx.save();\n";
    code += "  ctx.lineJoin = 'round';\n";
    code += "  ctx.lineCap = 'round';\n\n";

    code += "  // Red curbs\n";
    code += "  ctx.beginPath();\n";
    code += "  ctx.moveTo(pts[0].x, pts[0].y);\n";
    code += "  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);\n";
    code += "  ctx.strokeStyle = 'red';\n";
    code += "  ctx.lineWidth = _CURB_WIDTH;\n";
    code += "  ctx.setLineDash([_DASH, _GAP]);\n";
    code += "  ctx.lineDashOffset = 0;\n";
    code += "  ctx.stroke();\n\n";

    code += "  // White curbs (offset)\n";
    code += "  ctx.beginPath();\n";
    code += "  ctx.moveTo(pts[0].x, pts[0].y);\n";
    code += "  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);\n";
    code += "  ctx.strokeStyle = 'white';\n";
    code += "  ctx.lineWidth = _CURB_WIDTH;\n";
    code += "  ctx.setLineDash([_DASH, _GAP]);\n";
    code += "  ctx.lineDashOffset = _DASH;\n";
    code += "  ctx.stroke();\n\n";

    code += "  // Asphalt\n";
    code += "  ctx.beginPath();\n";
    code += "  ctx.moveTo(pts[0].x, pts[0].y);\n";
    code += "  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);\n";
    code += "  ctx.strokeStyle = _ASPHALT_COLOR;\n";
    code += "  ctx.lineWidth = _ASPHALT_WIDTH;\n";
    code += "  ctx.setLineDash([]);\n";
    code += "  ctx.stroke();\n";
    code += "  ctx.restore();\n";
    code += "}\n\n";

    // drawTrackSmoothed
    code += "export function drawTrackSmoothed(ctx) {\n";
    code += "  if (!ctx) throw new Error('ctx is required');\n";
    code += "  for (let i = 0; i < SMOOTH_PATHS.length; i++) {\n";
    code += "    _drawPathWithCurbs(ctx, SMOOTH_PATHS[i]);\n";
    code += "  }\n";
    code += "}\n\n";

    // drawTrackRaw
    code += "export function drawTrackRaw(ctx) {\n";
    code += "  if (!ctx) throw new Error('ctx is required');\n";
    code += "  for (let i = 0; i < RAW_PATHS.length; i++) {\n";
    code += "    _drawPathWithCurbs(ctx, RAW_PATHS[i]);\n";
    code += "  }\n";
    code += "}\n\n";

    // Also add a convenience default export that draws smoothed
    code += "export default drawTrackSmoothed;\n";

    // download file
    const blob = new Blob([code], { type: "application/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "track-draw.js";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ userSelect: "none" }}>
      <div style={{ marginBottom: 10 }}>
        <button onClick={undoLast} disabled={!isDrawing}>
          Undo
        </button>{" "}
        <button onClick={startNewPath} disabled={!isDrawing}>
          Start New Path
        </button>{" "}
        <button onClick={clearAll}>Clear</button>{" "}
        <button onClick={finishTracing} disabled={!isDrawing}>
          Finish
        </button>{" "}
        <button onClick={exportPNG}>Export PNG</button>{" "}
        <button onClick={exportCanvasCode} disabled={isDrawing}>
          Export Canvas Code
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{
          border: "1px solid gray",
          width: canvasWidth,
          height: canvasHeight,
          cursor: isDrawing ? "crosshair" : "default",
          display: "block",
        }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
      />

      <p style={{ color: "white", marginTop: 10 }}>
        Click to add points. Use <b>Start New Path</b> to switch outlines (outer → inner). Click{" "}
        <b>Finish</b> to render final track, then click <b>Export Canvas Code</b> to download a JS
        file you can paste anywhere.
      </p>
    </div>
  );
}
