import React, { useEffect, useRef, useState } from "react";

export default function TrackTracer({
  imgSrc,
  canvasWidth = 1200,
  canvasHeight = 700,
}) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const [paths, setPaths] = useState([[]]);
  const [activePath, setActivePath] = useState(0);
  const [isDrawing, setIsDrawing] = useState(true);
  const [mousePos, setMousePos] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const [trackParams, setTrackParams] = useState({
    asphaltColor: "#2c2c2e",
    asphaltWidth: 24,
    curbWidth: 36,
    dashLength: 16,
    gapLength: 16,
    curbColorPrimary: "#ff3333",
    curbColorSecondary: "#ffffff",
    smoothness: 0.5,
    smoothSegments: 16,
  });

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgSrc;
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      console.warn("Failed to load:", imgSrc);
      imgRef.current = null;
      setImageLoaded(false);
    };
  }, [imgSrc]);

  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paths, mousePos, imageLoaded, activePath, trackParams]);

  function getCtx() {
    const canvas = canvasRef.current;
    return canvas?.getContext("2d");
  }

  function getMousePos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvasRef.current.width,
      y: ((e.clientY - rect.top) / rect.height) * canvasRef.current.height,
    };
  }

  function smoothPath(points, tension = 0.5, segments = 16) {
    if (!points || points.length < 2) return points.slice();
    
    const result = [];
    const pts = points.slice();
    
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i + 2 < pts.length ? pts[i + 2] : p2;

      for (let t = 0; t < segments; t++) {
        const tt = t / segments;
        const t2 = tt * tt;
        const t3 = t2 * tt;

        const q1 = -tension * t3 + 2 * tension * t2 - tension * tt;
        const q2 = (2 - tension) * t3 + (tension - 3) * t2 + 1;
        const q3 = (tension - 2) * t3 + (3 - 2 * tension) * t2 + tension * tt;
        const q4 = tension * t3 - tension * t2;

        result.push({
          x: q1 * p0.x + q2 * p1.x + q3 * p2.x + q4 * p3.x,
          y: q1 * p0.y + q2 * p1.y + q3 * p2.y + q4 * p3.y,
        });
      }
    }
    result.push(pts[pts.length - 1]);
    return result;
  }

  function drawBackgroundImage(ctx) {
    const canvas = canvasRef.current;
    
    if (imgRef.current) {
      const img = imgRef.current;
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (canvas.width - w) / 2;
      const y = (canvas.height - h) / 2;
      
      ctx.globalAlpha = 0.4;
      ctx.drawImage(img, x, y, w, h);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function drawPathPoints(ctx, path, isActive) {
    if (!path || path.length === 0) return;

    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.strokeStyle = isActive ? "rgba(255, 255, 100, 0.8)" : "rgba(200, 200, 200, 0.6)";
    ctx.lineWidth = isActive ? 2.5 : 1.5;
    ctx.stroke();

    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, isActive ? 4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? "#ffff00" : "#ffffff";
      ctx.fill();
      
      if (isActive) {
        ctx.strokeStyle = "#ff8800";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }

  function drawTrackWithCurbs(ctx, points) {
    if (!points || points.length < 2) return;
    
    const smooth = smoothPath(
      points,
      trackParams.smoothness,
      trackParams.smoothSegments
    );

    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const curbPattern = [trackParams.dashLength, trackParams.gapLength];

    ctx.beginPath();
    ctx.moveTo(smooth[0].x, smooth[0].y);
    smooth.forEach((p, i) => i > 0 && ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = trackParams.curbColorPrimary;
    ctx.lineWidth = trackParams.curbWidth;
    ctx.setLineDash(curbPattern);
    ctx.lineDashOffset = 0;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(smooth[0].x, smooth[0].y);
    smooth.forEach((p, i) => i > 0 && ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = trackParams.curbColorSecondary;
    ctx.lineWidth = trackParams.curbWidth;
    ctx.setLineDash(curbPattern);
    ctx.lineDashOffset = trackParams.dashLength;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(smooth[0].x, smooth[0].y);
    smooth.forEach((p, i) => i > 0 && ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = trackParams.asphaltColor;
    ctx.lineWidth = trackParams.asphaltWidth;
    ctx.setLineDash([]);
    ctx.stroke();

    ctx.restore();
  }

  function redraw() {
    const ctx = getCtx();
    if (!ctx) return;
    
    const canvas = canvasRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackgroundImage(ctx);

    if (isDrawing) {
      paths.forEach((path, idx) => {
        drawPathPoints(ctx, path, idx === activePath);
      });

      const currentPath = paths[activePath];
      if (mousePos && currentPath?.length > 0) {
        const last = currentPath[currentPath.length - 1];
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.strokeStyle = "rgba(255, 255, 100, 0.4)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else {
      paths.forEach((path) => {
        if (path.length > 1) drawTrackWithCurbs(ctx, path);
      });
    }
  }

  function handleClick(e) {
    if (!isDrawing) return;
    const pos = getMousePos(e);
    
    setPaths((prev) => {
      const updated = [...prev];
      updated[activePath] = [...(updated[activePath] || []), pos];
      return updated;
    });
  }

  function handleMouseMove(e) {
    setMousePos(getMousePos(e));
  }

  function startNewPath() {
    setPaths((prev) => [...prev, []]);
    setActivePath(paths.length);
  }

  function switchPath(index) {
    if (index >= 0 && index < paths.length) {
      setActivePath(index);
    }
  }

  function undoLast() {
    if (!isDrawing) return;
    setPaths((prev) => {
      const updated = [...prev];
      if (updated[activePath]?.length > 0) {
        updated[activePath] = updated[activePath].slice(0, -1);
      }
      return updated;
    });
  }

  function deletePath(index) {
    if (!isDrawing) return;
    setPaths((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) updated.push([]);
      return updated;
    });
    if (activePath >= paths.length - 1) {
      setActivePath(Math.max(0, paths.length - 2));
    }
  }

  function clearAll() {
    setPaths([[]]);
    setActivePath(0);
    setIsDrawing(true);
  }

  function finishTracing() {
    const validPaths = paths.filter((p) => p.length > 1);
    if (validPaths.length === 0) {
      alert("Please trace at least one path with 2+ points.");
      return;
    }
    setIsDrawing(false);
  }

  function editAgain() {
    setIsDrawing(true);
  }

  function exportPNG() {
    const link = document.createElement("a");
    link.download = `track_${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }

  function generateCanvasCode() {
    const validPaths = paths.filter((p) => p.length > 1);
    
    function formatPoints(points) {
      return points.map((p) => `{x:${p.x.toFixed(1)},y:${p.y.toFixed(1)}}`).join(",");
    }

    const rawPathsCode = validPaths.map((p) => `[${formatPoints(p)}]`).join(",\n  ");
    const smoothPathsCode = validPaths
      .map((p) => `[${formatPoints(smoothPath(p, trackParams.smoothness, trackParams.smoothSegments))}]`)
      .join(",\n  ");

    return `/**
 * Track Drawing Code
 * Generated: ${new Date().toISOString()}
 */

const CONFIG = {
  asphaltColor: "${trackParams.asphaltColor}",
  asphaltWidth: ${trackParams.asphaltWidth},
  curbWidth: ${trackParams.curbWidth},
  dashLength: ${trackParams.dashLength},
  gapLength: ${trackParams.gapLength},
  curbColorPrimary: "${trackParams.curbColorPrimary}",
  curbColorSecondary: "${trackParams.curbColorSecondary}",
};

const RAW_PATHS = [
  ${rawPathsCode}
];

const SMOOTH_PATHS = [
  ${smoothPathsCode}
];

function _drawPath(ctx, points, config = CONFIG) {
  if (!points || points.length < 2) return;
  
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const pattern = [config.dashLength, config.gapLength];

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.forEach((p, i) => i > 0 && ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = config.curbColorPrimary;
  ctx.lineWidth = config.curbWidth;
  ctx.setLineDash(pattern);
  ctx.lineDashOffset = 0;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.forEach((p, i) => i > 0 && ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = config.curbColorSecondary;
  ctx.lineWidth = config.curbWidth;
  ctx.setLineDash(pattern);
  ctx.lineDashOffset = config.dashLength;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.forEach((p, i) => i > 0 && ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = config.asphaltColor;
  ctx.lineWidth = config.asphaltWidth;
  ctx.setLineDash([]);
  ctx.stroke();

  ctx.restore();
}

export function drawTrack(ctx, config) {
  if (!ctx) throw new Error("Canvas context required");
  const cfg = { ...CONFIG, ...config };
  SMOOTH_PATHS.forEach(path => _drawPath(ctx, path, cfg));
}

export function drawTrackRaw(ctx, config) {
  if (!ctx) throw new Error("Canvas context required");
  const cfg = { ...CONFIG, ...config };
  RAW_PATHS.forEach(path => _drawPath(ctx, path, cfg));
}

export default drawTrack;
`;
  }

  function exportCanvasCode() {
    const code = generateCanvasCode();
    const blob = new Blob([code], { type: "application/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `track-draw_${Date.now()}.js`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function updateTrackParam(key, value) {
    setTrackParams({ ...trackParams, [key]: value });
  }

  return (
    <div style={styles.container}>
      <div style={styles.controlsPanel}>
        <div style={styles.buttonGroup}>
          <button onClick={undoLast} disabled={!isDrawing} style={styles.button}>
            ↶ Undo
          </button>
          <button onClick={startNewPath} disabled={!isDrawing} style={styles.button}>
            ➕ New Path
          </button>
          <button onClick={clearAll} style={styles.button}>
            🗑️ Clear All
          </button>
          <button
            onClick={isDrawing ? finishTracing : editAgain}
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            {isDrawing ? "✓ Finish" : "✎ Edit"}
          </button>
        </div>

        {isDrawing && paths.length > 1 && (
          <div style={styles.pathSelector}>
            <span style={styles.label}>Active Path:</span>
            {paths.map((_, idx) => (
              <button
                key={idx}
                onClick={() => switchPath(idx)}
                style={{
                  ...styles.pathButton,
                  ...(idx === activePath ? styles.pathButtonActive : {}),
                }}
              >
                {idx + 1} ({paths[idx].length})
                {paths.length > 1 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePath(idx);
                    }}
                    style={styles.deleteBtn}
                  >
                    ✕
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div style={styles.parametersSection}>
          <h3 style={styles.sectionTitle}>⚙️ Track Settings</h3>
          
          <div style={styles.sliderGroup}>
            <label style={styles.sliderLabel}>
              Asphalt Width: {trackParams.asphaltWidth}px
            </label>
            <input
              type="range"
              min="8"
              max="60"
              value={trackParams.asphaltWidth}
              onChange={(e) => updateTrackParam("asphaltWidth", Number(e.target.value))}
              style={styles.slider}
            />
          </div>

          <div style={styles.sliderGroup}>
            <label style={styles.sliderLabel}>
              Curb Width: {trackParams.curbWidth}px
            </label>
            <input
              type="range"
              min="16"
              max="100"
              value={trackParams.curbWidth}
              onChange={(e) => updateTrackParam("curbWidth", Number(e.target.value))}
              style={styles.slider}
            />
          </div>

          <div style={styles.sliderGroup}>
            <label style={styles.sliderLabel}>
              Dash Length: {trackParams.dashLength}px
            </label>
            <input
              type="range"
              min="4"
              max="40"
              value={trackParams.dashLength}
              onChange={(e) => updateTrackParam("dashLength", Number(e.target.value))}
              style={styles.slider}
            />
          </div>

          <div style={styles.sliderGroup}>
            <label style={styles.sliderLabel}>
              Smoothness: {trackParams.smoothSegments}
            </label>
            <input
              type="range"
              min="8"
              max="32"
              value={trackParams.smoothSegments}
              onChange={(e) => updateTrackParam("smoothSegments", Number(e.target.value))}
              style={styles.slider}
            />
          </div>
        </div>

        {!isDrawing && (
          <div style={styles.buttonGroup}>
            <button onClick={exportPNG} style={{ ...styles.button, ...styles.exportButton }}>
              📥 Export PNG
            </button>
            <button onClick={exportCanvasCode} style={{ ...styles.button, ...styles.exportButton }}>
              💾 Export Canvas Code
            </button>
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{
          border: "2px solid #ddd",
          borderRadius: "10px",
          width: "100%",
          height: "auto",
          cursor: isDrawing ? "crosshair" : "default",
          display: "block",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
      />

      <p style={styles.helpText}>
        {isDrawing ? (
          <>
            Click to add points. Use <strong>New Path</strong> for inner boundaries. 
            Click <strong>Finish</strong> when done.
          </>
        ) : (
          <>
            Track rendered! Click <strong>Edit</strong> to modify or <strong>Export</strong> to save.
          </>
        )}
      </p>
    </div>
  );
}
const styles = {
  container: {
    userSelect: "none",
  },
  controlsPanel: {
    background: "#f8f9fa",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
    marginBottom: "15px",
    flexWrap: "wrap",
  },
  button: {
    padding: "10px 20px",
    background: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.2s",
  },
  primaryButton: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  exportButton: {
    background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  },
  pathSelector: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "15px",
    padding: "15px",
    background: "white",
    borderRadius: "8px",
    flexWrap: "wrap",
  },
  label: {
    fontWeight: "600",
    color: "#333",
  },
  pathButton: {
    padding: "8px 16px",
    background: "#e9ecef",
    color: "#495057",
    border: "2px solid transparent",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    transition: "all 0.2s",
  },
  pathButtonActive: {
    background: "#667eea",
    color: "white",
    borderColor: "#764ba2",
  },
  deleteBtn: {
    marginLeft: "8px",
    color: "#dc3545",
    fontWeight: "bold",
  },
  parametersSection: {
    padding: "15px",
    background: "white",
    borderRadius: "8px",
    marginBottom: "15px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#333",
    marginBottom: "15px",
  },
  sliderGroup: {
    marginBottom: "15px",
  },
  sliderLabel: {
    display: "block",
    fontSize: "14px",
    color: "#495057",
    fontWeight: "600",
    marginBottom: "8px",
  },
  slider: {
    width: "100%",
    height: "6px",
    borderRadius: "3px",
    outline: "none",
  },
  helpText: {
    marginTop: "15px",
    padding: "12px",
    background: "#e7f3ff",
    borderLeft: "4px solid #667eea",
    borderRadius: "6px",
    color: "#333",
    fontSize: "14px",
  },
};