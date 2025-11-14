import { useState } from 'react';
import RaceTrack from './components/RaceTrack';
import ObstacleToolbar from './components/ObstacleToolbar';

interface Obstacle {
  id: number;
  x: number;
  y: number;
  angle: number;
  length: number;
}

function App() {
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [isDraggingFromToolbar, setIsDraggingFromToolbar] = useState(false);

  const handleObstaclesChange = (newObstacles: Obstacle[]) => {
    setObstacles(newObstacles);
  };

  const handleClearAll = () => {
    setObstacles([]);
  };

  const handleExportData = () => {
    const data = {
      obstacles: obstacles.map(obs => ({
        x: Math.round(obs.x),
        y: Math.round(obs.y),
        angle_degrees: Math.round((obs.angle * 180) / Math.PI),
        angle_radians: obs.angle.toFixed(3),
        length: obs.length
      }))
    };
    
    console.log('=== OBSTACLE DATA FOR BACKEND ===');
    console.log(JSON.stringify(data, null, 2));
    alert(`Exported ${obstacles.length} obstacles to console! Check F12 → Console`);
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: '#0a0a0a', 
      minHeight: '100vh'
    }}>
      <ObstacleToolbar 
        onDragStart={() => setIsDraggingFromToolbar(true)}
      />

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={handleClearAll}
          style={{
            padding: '10px 20px',
            background: '#cc0000',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Clear All
        </button>

        <button
          onClick={handleExportData}
          style={{
            padding: '10px 20px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Export Data
        </button>
      </div>

      <RaceTrack
        width={800}
        height={600}
        trackType="stadium"
        obstacles={obstacles}
        onObstaclesChange={handleObstaclesChange}
        isDraggingFromToolbar={isDraggingFromToolbar}
      />
    </div>
  );
}

export default App;