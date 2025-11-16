import { useEffect, useState } from 'react';

interface StopwatchProps {
  isRunning: boolean;
  reset: boolean;
  onResetComplete: () => void;
}

const Stopwatch: React.FC<StopwatchProps> = ({ isRunning, reset, onResetComplete }) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 10);
      }, 10);
    } else if (!isRunning && interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  useEffect(() => {
    if (reset) {
      setTime(0);
      onResetComplete();
    }
  }, [reset, onResetComplete]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((milliseconds % 1000) / 10);

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
  };

  return (
    <div className="stopwatch">
      <div className="stopwatch-time">{formatTime(time)}</div>
    </div>
  );
};

export default Stopwatch;

