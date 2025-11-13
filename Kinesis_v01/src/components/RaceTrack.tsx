import React, { useEffect, useRef } from 'react';

interface RaceTrackProps {
  width?: number;
  height?: number;
  trackType?: 'oval' | 'circuit' | 'stadium';
}

const RaceTrack: React.FC<RaceTrackProps> = ({ 
  width = 800, 
  height = 600, 
  trackType = 'stadium' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const trackConfigs = {
  oval: {
    type: 'ellipse',
    radiusX: 300,
    radiusY: 200,
    trackWidth: 80
  },
  stadium: {
    type: 'stadium',
    straightLength: 400,
    radius: 100,
    trackWidth: 80
  },
  circuit: {
    type: 'path',
    waypoints: [
      { x: -250, y: 0 },
      { x: -250, y: -150 },
      { x: -50, y: -200 },
      { x: 150, y: -150 },
      { x: 250, y: 0 },
      { x: 250, y: 150 },
      { x: 50, y: 200 },
      { x: -150, y: 150 }
    ],
    trackWidth: 100
  }
};

  const drawOvalTrack = (ctx: CanvasRenderingContext2D, config: any) => {
  const { radiusX, radiusY, trackWidth } = config;

  // Background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-width / 2, -height / 2, width, height);

  // Outer track
  ctx.strokeStyle = '#4a4a4a';
  ctx.lineWidth = trackWidth;
  ctx.beginPath();
  ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Inner track
  ctx.strokeStyle = '#2d2d2d';
  ctx.lineWidth = trackWidth - 8;
  ctx.beginPath();
  ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Center dashed line
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 2;
  ctx.setLineDash([20, 15]);
  ctx.beginPath();
  ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Start line
  const startX = radiusX - 50;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(startX, -45);
  ctx.lineTo(startX, 45);
  ctx.stroke();

  // Checker pattern
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#000000';
    ctx.fillRect(startX - 8, -45 + i * 15, 16, 15);
  }
};

const drawStadiumTrack = (ctx: CanvasRenderingContext2D, config: any) => {
  const { straightLength, radius, trackWidth } = config;

  // Background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-width / 2, -height / 2, width, height);

  // Helper function to draw rounded rectangle path
  const drawStadiumPath = (halfLength: number, rad: number) => {
    ctx.beginPath();
    
    // Right semicircle
    ctx.arc(halfLength, 0, rad, -Math.PI / 2, Math.PI / 2);
    
    // Bottom straight line
    ctx.lineTo(-halfLength, rad);
    
    // Left semicircle
    ctx.arc(-halfLength, 0, rad, Math.PI / 2, -Math.PI / 2);
    
    // Top straight line
    ctx.lineTo(halfLength, -rad);
    
    ctx.closePath();
  };

  const halfLength = straightLength / 2;

  // Draw outer edge
  ctx.strokeStyle = '#4a4a4a';
  ctx.lineWidth = trackWidth;
  drawStadiumPath(halfLength, radius);
  ctx.stroke();

  // Draw track surface
  ctx.strokeStyle = '#2d2d2d';
  ctx.lineWidth = trackWidth - 8;
  drawStadiumPath(halfLength, radius);
  ctx.stroke();

  // Draw center dashed line
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 2;
  ctx.setLineDash([20, 15]);
  drawStadiumPath(halfLength, radius);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw start/finish line
  const startX = halfLength - 50;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(startX, -45);
  ctx.lineTo(startX, 45);
  ctx.stroke();

  // Checkered pattern
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#000000';
    ctx.fillRect(startX - 8, -45 + i * 15, 16, 15);
  }
};


  const drawCircuitTrack = (ctx: CanvasRenderingContext2D, config: any) => {
    const { waypoints, trackWidth } = config;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    const drawSmoothPath = (lineWidth: number, strokeStyle: string) => {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(waypoints[0].x, waypoints[0].y);

      for (let i = 0; i < waypoints.length; i++) {
        const next = waypoints[(i + 1) % waypoints.length];
        const nextNext = waypoints[(i + 2) % waypoints.length];
        const cpx = next.x;
        const cpy = next.y;
        ctx.quadraticCurveTo(cpx, cpy, (next.x + nextNext.x) / 2, (next.y + nextNext.y) / 2);
      }
      ctx.closePath();
      ctx.stroke();
    };

    drawSmoothPath(trackWidth, '#4a4a4a');
    drawSmoothPath(trackWidth - 8, '#2d2d2d');

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 15]);
    ctx.beginPath();
    ctx.moveTo(waypoints[0].x, waypoints[0].y);
    for (let i = 1; i < waypoints.length; i++) {
      ctx.lineTo(waypoints[i].x, waypoints[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(waypoints[0].x - 20, waypoints[0].y);
    ctx.lineTo(waypoints[0].x + 20, waypoints[0].y);
    ctx.stroke();
  };

  useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas first
  ctx.clearRect(0, 0, width, height);

  // 💡 Move origin to the center of the canvas
  ctx.save();
  ctx.translate(width / 2, height / 2);

  const config = trackConfigs[trackType];

  if (config.type === 'ellipse') {
  drawOvalTrack(ctx, config);
} else if (config.type === 'stadium') {
  drawStadiumTrack(ctx, config);
} else if (config.type === 'path') {
  drawCircuitTrack(ctx, config);
}

  ctx.restore(); // Restore original coordinate system (optional)
}, [trackType, width, height]);


  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        border: '2px solid #333',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
      }}
    />
  );
};

export default RaceTrack;