import { useState } from 'react';
import RaceTrack from './components/RaceTrack';
import ObstacleToolbar from './components/ObstacleToolbar';
import AnimatedList from './components/AnimatedList';
import './App.css';

const items = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6', 'Item 7', 'Item 8', 'Item 9', 'Item 10']; 
 

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
    <div className="app-container">
      <div className="left-section">
      <RaceTrack
          width={1400}
          height={800}
          trackType="stadium"
          obstacles={obstacles}
          onObstaclesChange={handleObstaclesChange}
          isDraggingFromToolbar={isDraggingFromToolbar}
        />
      </div>
      
      <div className="right-section">
      <AnimatedList
        items={items}
        onItemSelect={(item: string, index: number) => console.log(item, index)}
        showGradients={true}
        enableArrowNavigation={true}
        displayScrollbar={true}
      />
      </div>
    </div>
  );
}

export default App;