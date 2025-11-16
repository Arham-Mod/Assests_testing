import React, { useRef, useEffect } from 'react';

const SimpleCanvas = () => {
  const canvasRef = useRef(null);
  const wsRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Create image object
    const img = new Image();
    
    // Set image source from public folder
    // If your image is at public/track.png, use '/track.png'
    img.src = 'image.png';
    
    // Draw image when loaded
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw image (x, y, width, height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };

    // Handle error
    img.onerror = () => {
      console.error('Failed to load image');
    };

  }, []);
 
  return (
    <canvas 
      ref={canvasRef} 
      width={1400} 
      height={750}
      style={{ border: '1px solid black' }}
    />
  );
};

export default SimpleCanvas;
