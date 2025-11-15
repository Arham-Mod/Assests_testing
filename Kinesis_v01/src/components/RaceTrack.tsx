import React, { useEffect, useRef, useState } from 'react';

interface Obstacle {
  id: number;
  x: number;
  y: number;
  angle: number;
  length: number;
}

interface RaceTrackProps {
  width?: number;
  height?: number;
  trackType?: 'oval' | 'circuit' | 'stadium';
  obstacles: Obstacle[];
  onObstaclesChange: (obstacles: Obstacle[]) => void;
  isDraggingFromToolbar: boolean;
}

const RaceTrack: React.FC<RaceTrackProps> = ({ 
  width = 800, 
  height = 600, 
  trackType = 'stadium',
  obstacles,
  onObstaclesChange,
  isDraggingFromToolbar
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedObstacle, setSelectedObstacle] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const wsRef = useRef<WebSocket | null>(null);
  
  // Agent data storage - stores agent positions and properties
  interface AgentData {
    x: number;
    y: number;
    direction: number;
    speed: number;
    lap: number;
    fuel: number;
    state: string;
  }
  const agentsRef = useRef<Record<number, AgentData>>({});
  // State to trigger re-renders when agents update
  const [agentUpdateTrigger, setAgentUpdateTrigger] = useState(0);

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

  // Track drawing functions
  const drawStadiumTrack = (ctx: CanvasRenderingContext2D, config: any) => {
    const { straightLength, radius, trackWidth } = config;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-width / 2, -height / 2, width, height);

    const drawStadiumPath = (halfLength: number, rad: number) => {
      ctx.beginPath();
      ctx.arc(halfLength, 0, rad, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(-halfLength, rad);
      ctx.arc(-halfLength, 0, rad, Math.PI / 2, -Math.PI / 2);
      ctx.lineTo(halfLength, -rad);
      ctx.closePath();
    };

    const halfLength = straightLength / 2;

    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth = trackWidth;
    drawStadiumPath(halfLength, radius);
    ctx.stroke();

    ctx.strokeStyle = '#2d2d2d';
    ctx.lineWidth = trackWidth - 8;
    drawStadiumPath(halfLength, radius);
    ctx.stroke();

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 15]);
    drawStadiumPath(halfLength, radius);
    ctx.stroke();
    ctx.setLineDash([]);

    const startX = halfLength - 50;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(startX, -45);
    ctx.lineTo(startX, 45);
    ctx.stroke();

    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#000000';
      ctx.fillRect(startX - 8, -45 + i * 15, 16, 15);
    }
  };

  const drawOvalTrack = (ctx: CanvasRenderingContext2D, config: any) => {
    const { radiusX, radiusY, trackWidth } = config;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-width / 2, -height / 2, width, height);

    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth = trackWidth;
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#2d2d2d';
    ctx.lineWidth = trackWidth - 8;
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 15]);
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const startX = radiusX - 50;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(startX, -45);
    ctx.lineTo(startX, 45);
    ctx.stroke();

    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#000000';
      ctx.fillRect(startX - 8, -45 + i * 15, 16, 15);
    }
  };

  const drawCircuitTrack = (ctx: CanvasRenderingContext2D, config: any) => {
    const { waypoints, trackWidth } = config;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-width / 2, -height / 2, width, height);

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
        ctx.quadraticCurveTo(next.x, next.y, (next.x + nextNext.x) / 2, (next.y + nextNext.y) / 2);
      }
      ctx.closePath();
      ctx.stroke();
    };

    drawSmoothPath(trackWidth, '#4a4a4a');
    drawSmoothPath(trackWidth - 8, '#2d2d2d');
  };

  // Draw single barrier
  const drawBarrier = (ctx: CanvasRenderingContext2D, obstacle: Obstacle, isSelected: boolean) => {
    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);
    ctx.rotate(obstacle.angle);

    // Selection highlight
    if (isSelected) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(-obstacle.length / 2 - 5, -10, obstacle.length + 10, 20);
      ctx.setLineDash([]);
    }

    // Barrier body (red and white stripes)
    const stripeWidth = obstacle.length / 8;
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#cc0000' : '#ffffff';
      ctx.fillRect(
        -obstacle.length / 2 + i * stripeWidth,
        -5,
        stripeWidth,
        10
      );
    }

    // Border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(-obstacle.length / 2, -5, obstacle.length, 10);

    ctx.restore();
  };

  // Draw all obstacles
  const drawObstacles = (ctx: CanvasRenderingContext2D) => {
    obstacles.forEach(obs => {
      drawBarrier(ctx, obs, selectedObstacle === obs.id);
    });
  };

  // Convert canvas pixel coordinates to centered coordinates
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - width / 2;
    const y = e.clientY - rect.top - height / 2;
    return { x, y };
  };

  // Check if clicking on obstacle
  const getObstacleAtPosition = (x: number, y: number): Obstacle | null => {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      
      // Rotate point to obstacle's local space
      const dx = x - obs.x;
      const dy = y - obs.y;
      const localX = dx * Math.cos(-obs.angle) - dy * Math.sin(-obs.angle);
      const localY = dx * Math.sin(-obs.angle) + dy * Math.cos(-obs.angle);
      
      // Check if within barrier bounds
      if (
        Math.abs(localX) <= obs.length / 2 &&
        Math.abs(localY) <= 10
      ) {
        return obs;
      }
    }
    return null;
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const clickedObstacle = getObstacleAtPosition(x, y);

    if (clickedObstacle) {
      setSelectedObstacle(clickedObstacle.id);
      setIsDragging(true);
      setDragOffset({
        x: x - clickedObstacle.x,
        y: y - clickedObstacle.y
      });
    } else {
      setSelectedObstacle(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    setMousePos({ x, y });

    if (isDragging && selectedObstacle !== null) {
      onObstaclesChange(
        obstacles.map(obs =>
          obs.id === selectedObstacle
            ? { ...obs, x: x - dragOffset.x, y: y - dragOffset.y }
            : obs
        )
      );
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Drag and drop from toolbar
  const handleDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const obstacleType = e.dataTransfer.getData('obstacleType');
    
    if (obstacleType === 'barrier') {
      const { x, y } = getCanvasCoords(e as any);
      
      const newObstacle: Obstacle = {
        id: Date.now(),
        x,
        y,
        angle: 0,
        length: 60
      };
      
      onObstaclesChange([...obstacles, newObstacle]);
      setSelectedObstacle(newObstacle.id);
    }
  };

  // Keyboard controls
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selectedObstacle === null) return;

    if (e.key === 'Delete' || e.key === 'Backspace') {
      onObstaclesChange(obstacles.filter(obs => obs.id !== selectedObstacle));
      setSelectedObstacle(null);
    } else if (e.key === 'r' || e.key === 'R') {
      // Rotate selected obstacle
      onObstaclesChange(
        obstacles.map(obs =>
          obs.id === selectedObstacle
            ? { ...obs, angle: obs.angle + Math.PI / 12 }
            : obs
        )
      );
    } else if (e.key === '+' || e.key === '=') {
      // Increase length
      onObstaclesChange(
        obstacles.map(obs =>
          obs.id === selectedObstacle
            ? { ...obs, length: Math.min(obs.length + 10, 150) }
            : obs
        )
      );
    } else if (e.key === '-' || e.key === '_') {
      // Decrease length
      onObstaclesChange(
        obstacles.map(obs =>
          obs.id === selectedObstacle
            ? { ...obs, length: Math.max(obs.length - 10, 20) }
            : obs
        )
      );
    }
  };

  // Agent drawing function - draws a single agent on the canvas
  const drawAgent = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    _id: number, // Agent ID (kept for potential future use like labels)
    direction: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((direction * Math.PI) / 180);

    ctx.fillStyle = "#00ffff";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#00ffff";

    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 4);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  // Draw all agents from the agentsRef
  const drawAgents = (ctx: CanvasRenderingContext2D) => {
    Object.entries(agentsRef.current).forEach(([id, agent]) => {
      drawAgent(ctx, agent.x, agent.y, parseInt(id), agent.direction);
    });
  };

  // WebSocket connection and agent data handling
  useEffect(() => {
    // Initialize WebSocket connection
    wsRef.current = new WebSocket('ws://localhost:8000/ws');

    // Handle WebSocket messages - parse JSON and update agent data
    wsRef.current.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        // Handle both single agent and array of agents
        const updates = data.agents || (data.id ? [data] : []);
        
        // Update agent store with new positions and data
        updates.forEach((a: any) => {
          if (a.id !== undefined && a.position) {
            agentsRef.current[a.id] = {
              x: a.position.x,
              y: a.position.y,
              direction: a.direction || 0,
              speed: a.speed || 0,
              lap: a.lap || 0,
              fuel: a.fuel || 100,
              state: a.state || 'running'
            };
          }
        });
        
        // Trigger a re-render by updating state
        setAgentUpdateTrigger(prev => prev + 1);
        console.log('Agent data updated:', agentsRef.current);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Handle WebSocket errors
    wsRef.current.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Handle WebSocket close
    wsRef.current.addEventListener('close', () => {
      console.log('WebSocket connection closed');
    });

    // Cleanup: close WebSocket on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Main render loop - draws track, obstacles, and agents
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Translate to center for drawing
    ctx.save();
    ctx.translate(width / 2, height / 2);

    // Draw track based on type
    const config = trackConfigs[trackType];
    if (config.type === 'ellipse') {
      drawOvalTrack(ctx, config);
    } else if (config.type === 'stadium') {
      drawStadiumTrack(ctx, config);
    } else if (config.type === 'path') {
      drawCircuitTrack(ctx, config);
    }

    // Draw obstacles
    drawObstacles(ctx);

    // Draw agents
    drawAgents(ctx);

    // Restore context
    ctx.restore();

    // Draw coordinate display (in screen coordinates, not translated)
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px monospace';
    ctx.fillText(`Mouse: (${Math.round(mousePos.x)}, ${Math.round(mousePos.y)})`, 10, 20);

    if (selectedObstacle) {
      const obs = obstacles.find(o => o.id === selectedObstacle);
      if (obs) {
        ctx.fillText(
          `Selected: x=${Math.round(obs.x)}, y=${Math.round(obs.y)}, angle=${(obs.angle * 180 / Math.PI).toFixed(1)}°, length=${obs.length}`,
          10,
          40
        );
      }
    }

    // Display agent count
    const agentCount = Object.keys(agentsRef.current).length;
    if (agentCount > 0) {
      ctx.fillText(`Agents: ${agentCount}`, 10, 60);
    }

  }, [trackType, width, height, obstacles, selectedObstacle, mousePos, agentUpdateTrigger]);

  
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{
        border: '2px solid #333',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        cursor: isDraggingFromToolbar ? 'copy' : isDragging ? 'grabbing' : 'default',
        outline: 'none'
      }}
    />
  );
};

export default RaceTrack;
