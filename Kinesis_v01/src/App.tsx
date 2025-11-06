import RaceTrack from './components/RaceTrack';

function App() {
  return (
    <div style={{ padding: '20px', background: '#0a0a0a', minHeight: '100vh' }}>
      <RaceTrack trackType="oval" width={1500} height={600} />
    </div>
  );
}

export default App;