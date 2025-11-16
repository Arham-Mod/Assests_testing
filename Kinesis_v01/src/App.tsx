
import { useState } from 'react';
import RaceTrack from './components/RaceTrack';
import ObstacleToolbar from './components/ObstacleToolbar';
import AnimatedList from './components/AnimatedList';
import './App.css';
import SpotlightCard from './components/SpotlightCard';
import Stopwatch from './components/Stopwatch';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import ElectricBorder from './components/ElectricBorder';
import StarBorder from './components/StarBorder';

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
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [stopwatchReset, setStopwatchReset] = useState(false);

  const handleObstaclesChange = (newObstacles: Obstacle[]) => {
    setObstacles(newObstacles);
  };

  const handleClearAll = () => {
    setObstacles([]);
  };

  const handlePlay = () => {
    setIsStopwatchRunning(true);
    setStopwatchReset(false);
  };

  const handlePause = () => {
    setIsStopwatchRunning(false);
  };

  const handleStop = () => {
    setIsStopwatchRunning(false);
    setStopwatchReset(true);
  };

  const handleResetComplete = () => {
    setStopwatchReset(false);
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
          <Stopwatch 
            isRunning={isStopwatchRunning}
            reset={stopwatchReset}
            onResetComplete={handleResetComplete}
          />
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
          
            <div className="carousel-wrapper">
            <Carousel className="w-[400px] ml-2">
              <CarouselContent>
                <CarouselItem>
                  <div className="p-8 bg-[#111] rounded-lg border border-neutral-800 h-64 flex items-center justify-center m-2">
                    <p className="text-white">Carousel Item 1</p>
                  </div>
                </CarouselItem>
                <CarouselItem>
                  <div className="p-8 bg-[#111] rounded-lg border border-neutral-800 h-64 flex items-center justify-center m-2">
                    <p className="text-white">Carousel Item 2</p>
                  </div>
                </CarouselItem>
                <CarouselItem>
                  <div className="p-8 bg-[#111] rounded-lg border border-neutral-800 h-64 flex items-center justify-center m-2">
                    <p className="text-white">Carousel Item 3</p>
                  </div>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
            </div>
          
          
          
          <div className="spotlight-cards-container">
            
              <SpotlightCard className="ml-10 custom-spotlight-card w-[250px] h-64" spotlightColor="rgba(0, 229, 255, 0.2)">
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <h2 className="text-2xl font-bold text-white mb-2">OBSTACLES</h2>
                  
                  <ObstacleToolbar 
                    onDragStart={() => setIsDraggingFromToolbar(true)}
                  />
                  
                  <div className="control-buttons">
                    <button className="control-btn stop-btn" onClick={handleStop}></button>
                    <button className="control-btn play-btn" onClick={handlePlay}></button>
                    <button className="control-btn pause-btn" onClick={handlePause}></button>
                  </div>
                </div>
              </SpotlightCard>

            

            
            <SpotlightCard className="ml-10 custom-spotlight-card w-[250px] h-64" spotlightColor="rgba(0, 229, 255, 0.2)">
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
          </div>

          <div className="adjacent-cards-container">
          </div>
        </div>

        

      </div>
      

      <div className="right-section">
        <h1 className="leaderboard-heading">Leaderboard</h1>
        <AnimatedList
          items={items}
          onItemSelect={(item: string, index: number) => console.log(item, index)}
          showGradients={true}
          enableArrowNavigation={true}
          displayScrollbar={false}
        />
      </div>
    </div>
  );
}

export default App;
