import { useState, useEffect, useRef } from 'react';
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
import SimpleCanvas from './components/RaceTrack';

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
  const socketRef = useRef(<WebSocket | null>(null);

  // ============================================
  // WebSocket State for Live Data
  // ============================================
  const [agents, setAgents] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // ============================================
  // WebSocket Connection
  // ============================================
  useEffect(() => {
    // 🔧 CHANGE THIS URL TO MATCH YOUR BACKEND!
    const WEBSOCKET_URL = 'ws://localhost:8000/ws';
    
    console.log('🔌 Connecting to WebSocket:', WEBSOCKET_URL);
    socketRef.current = new WebSocket(WEBSOCKET_URL);
    
    socketRef.onopen = () => {
      console.log('✅ WebSocket Connected!');
      setIsConnected(true);
    };
    
    socketRef.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.agents && Array.isArray(data.agents)) {
          console.log('📦 Received agents:', data.agents.length, 'agents');
          setAgents(data.agents);
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket data:', error);
      }
    };
    
    socketRef.onerror = (error) => {
      console.error('❌ WebSocket Error. Check:');
      console.log('   1. Is backend running?');
      console.log('   2. Is URL correct?', WEBSOCKET_URL);
      setIsConnected(false);
    };
    
    socketRef.onclose = () => {
      console.log('🔴 WebSocket Disconnected');
      setIsConnected(false);
    };
    
    return () => {
      socketRef.close();
    };
  }, []);

  // ============================================
  // Sort and Format Agents for Leaderboard
  // ============================================
  const sortedAgents = [...agents]
    .filter(agent => agent.state === 'running' || agent.state === 'crashed')
    .sort((a, b) => {
      if (b.laps !== a.laps) {
        return (b.laps || 0) - (a.laps || 0);
      }
      return (b.speed || 0) - (a.speed || 0);
    });

  // Format items for AnimatedList (leaderboard)
  const items = sortedAgents.map((agent, index) => {
    const position = index + 1;
    const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
    const crashIcon = agent.state === 'crashed' ? '💥' : '';
    
    return `${medal} ${agent.id} | Lap: ${agent.laps || 0} | Speed: ${(agent.speed || 0).toFixed(1)} | Fuel: ${(agent.fuel || 0).toFixed(0)}% ${crashIcon}`.trim();
  });

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
          <div>
            <SimpleCanvas />
          </div>
        </div>
        
        <div className="cards-section">
          
          <div className="carousel-wrapper">
            <Carousel className="w-[400px] ml-2">
              <CarouselContent>
                {/* CHANGED: Now showing live agent data */}
                {sortedAgents.length === 0 ? (
                  // Show placeholder when no agents
                  <CarouselItem>
                    <div className="p-8 bg-[#111] rounded-lg border border-neutral-800 h-64 flex items-center justify-center m-2">
                      <p className="text-white">
                        {isConnected ? 'Waiting for agents...' : '🔴 Not connected to backend'}
                      </p>
                    </div>
                  </CarouselItem>
                ) : (
                  // Show each agent in a carousel card
                  sortedAgents.slice(0, 10).map((agent, index) => (
                    <CarouselItem key={agent.id}>
                      <div className="p-8 bg-[#111] rounded-lg border border-neutral-800 h-64 flex flex-col items-center justify-center m-2">
                        {/* Position Badge */}
                        <div className="text-4xl mb-3">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                        </div>
                        
                        {/* Agent Info */}
                        <p className="text-white text-center">
                          <span className="text-2xl font-bold block mb-2">{agent.id}</span>
                          <span className="block">Lap: <strong>{agent.laps || 0}</strong></span>
                          <span className="block">Speed: <strong>{(agent.speed || 0).toFixed(1)} km/h</strong></span>
                          <span className="block">Fuel: <strong>{(agent.fuel || 0).toFixed(0)}%</strong></span>
                          
                          {/* Status */}
                          {agent.state === 'crashed' && (
                            <span className="block mt-2 text-red-500 font-bold">💥 CRASHED</span>
                          )}
                          {agent.state === 'running' && (
                            <span className="block mt-2 text-green-500 font-bold">✅ RACING</span>
                          )}
                        </p>
                      </div>
                    </CarouselItem>
                  ))
                )}
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
        {/* Connection Status */}
        <div style={{
          padding: '8px',
          marginBottom: '10px',
          background: isConnected ? '#28a745' : '#dc3545',
          color: 'white',
          borderRadius: '8px',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '12px'
        }}>
          {isConnected ? `🟢 LIVE - ${agents.length} agents` : '🔴 DISCONNECTED'}
        </div>

        <h1 className="leaderboard-heading">Leaderboard</h1>
        
        {/* AnimatedList Leaderboard */}
        <AnimatedList
          items={items}
          onItemSelect={(item: string, index: number) => console.log('Selected:', item, 'Position:', index + 1)}
          showGradients={true}
          enableArrowNavigation={true}
          displayScrollbar={false}
        />
      </div>
    </div>
  );
}

export default App;