import React from 'react';

interface ObstacleToolbarProps {
  onDragStart: (obstacleType: 'barrier') => void;
}

const ObstacleToolbar: React.FC<ObstacleToolbarProps> = ({ onDragStart }) => {
  const handleDragStart = (e: React.DragEvent, type: 'barrier') => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('obstacleType', type);
    onDragStart(type);
  };

  return (
    <div style={{
      padding: '10px',
      background: '#2a2a2a',
      borderRadius: '8px',
      marginBottom: '20px',
      display: 'inline-block'
    }}>
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, 'barrier')}
        style={{
          padding: '12px 20px',
          background: 'linear-gradient(135deg, #cc0000, #ff3333)',
          color: 'white',
          borderRadius: '5px',
          cursor: 'grab',
          fontWeight: 'bold',
          border: '2px solid #fff',
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          userSelect: 'none'
        }}
      >
        🚧 Barrier
      </div>
    </div>
  );
};

export default ObstacleToolbar;