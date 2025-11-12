import './index.css';
import RaceTrack from './components/RaceTrack';
import LeaderboardPanel, { Agent } from './components/leaderboard';

const drivers: Agent[] = [
  { id: 1, name: 'Lewis Hamilton', country: 'GBR', points: 296, team: 'Mercedes' },
  { id: 2, name: 'Valtteri Bottas', country: 'FIN', points: 231, team: 'Mercedes' },
  { id: 3, name: 'Charles Leclerc', country: 'MON', points: 200, team: 'Ferrari' },
];

const teams = [
  { id: 'mec', name: 'Mercedes', points: 527 },
  { id: 'fer', name: 'Ferrari', points: 394 },
];

function App() {
  console.log('App rendering');

  return (
    <div
      style={{
        background: '#0a0a0a',
        color: '#fff',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '40px',
        padding: '40px',
      }}
    >
      
      {/* Race Track on Left */}
      <div style={{ flex: 2, display: 'flex', justifyContent: 'center' }}>
        
        <RaceTrack trackType="oval" width={1000} height={800} />
      </div>

      {/* Leaderboard on Right */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <LeaderboardPanel drivers={drivers} teams={teams} />
      </div>
    </div>
  );
}

export default App;
