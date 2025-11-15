import { useState } from 'react';
import RaceTrack from './components/RaceTrack';
import ObstacleToolbar from './components/ObstacleToolbar';
import AnimatedList from './components/AnimatedList';
import './App.css';
import SpotlightCard from './components/SpotlightCard';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

const items = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6', 'Item 7', 'Item 8', 'Item 9', 'Item 10', 'Item 11', 'Item 12', 'Item 13', 'Item 14', 'Item 15', 'Item 16', 'Item 17', 'Item 18', 'Item 19', 'Item 20']; 
 

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
        <div className="canvas-container">
          <RaceTrack
            width={1400}
            height={750}
            trackType="stadium"
            obstacles={obstacles}
            onObstaclesChange={handleObstaclesChange}
            isDraggingFromToolbar={isDraggingFromToolbar}
          />
        </div>
        
        <div className="cards-section">
          {/* Spotlight card for obstacles toolbar and clear all button */}
          <SpotlightCard className="custom-spotlight-card w-[250px] h-64" spotlightColor="rgba(0, 229, 255, 0.2)">
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <h2 className="text-2xl font-bold text-white mb-2">OBSTACLES</h2>
              
              <ObstacleToolbar 
                onDragStart={() => setIsDraggingFromToolbar(true)}
              />
              
              <button
                onClick={handleClearAll}
                style={{
                  padding: '10px 20px',
                  background: '#cc0000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  width: '150px'
                }}
              >
                Clear All
              </button>
            </div>
          </SpotlightCard>

          <SpotlightCard className="custom-spotlight-card w-[250px] h-64" spotlightColor="rgba(0, 229, 255, 0.2)">
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <h2 className="text-2xl font-bold text-white mb-2">OBSTACLES</h2>
              
              <ObstacleToolbar 
                onDragStart={() => setIsDraggingFromToolbar(true)}
              />
              
              <button
                onClick={handleClearAll}
                style={{
                  padding: '10px 20px',
                  background: '#cc0000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  width: '150px'
                }}
              >
                Clear All
              </button>
            </div>
          </SpotlightCard>

          
          
          {/* Space for adjacent cards - add your new cards here */}
          <div className="adjacent-cards-container">
            {/* Your new cards will go here */}
          </div>
        </div>

        

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