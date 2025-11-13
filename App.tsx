import React, { useState, useEffect, useCallback } from 'react';

const App: React.FC = () => {
  const [duration, setDuration] = useState<number>(5);
  const [timeLeft, setTimeLeft] = useState<number>(duration * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('https://storage.googleapis.com/aai-web-samples/user-images/7f08d0f1-460d-4560-b99b-433b5c777a16.png');

  useEffect(() => {
    setTimeLeft(duration * 60);
    setIsRunning(false);
  }, [duration]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(intervalId);
          setIsRunning(false);
          // Using a timeout to ensure state update before alert
          setTimeout(() => alert('Time is up!'), 0);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const handleStartPause = useCallback(() => {
    if (timeLeft > 0) {
      setIsRunning(prev => !prev);
    }
  }, [timeLeft]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(duration * 60);
  }, [duration]);

  const handleDurationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newDuration = parseInt(e.target.value, 10);
    if (!isNaN(newDuration) && newDuration >= 1 && newDuration <= 60) {
      setDuration(newDuration);
    } else if (e.target.value === '') {
        // Allow empty field while typing, default to 1
        setDuration(1);
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const newImageUrl = URL.createObjectURL(file);
      // Revoke the old URL if it was a blob URL to prevent memory leaks
      if (backgroundImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(backgroundImageUrl);
      }
      setBackgroundImageUrl(newImageUrl);
    }
  };

  const formatTime = (timeInSeconds: number): string => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = timeInSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isAtInitialState = !isRunning && timeLeft === duration * 60;

  return (
    <main
      className="min-h-screen w-full bg-cover bg-center flex items-center justify-center p-4 transition-all duration-500"
      style={{ backgroundImage: `url(${backgroundImageUrl})` }}
    >
      <div className="relative z-10 w-full max-w-4xl text-white text-center p-6 md:p-10 bg-black bg-opacity-30 rounded-2xl shadow-2xl backdrop-blur-md border border-white/20">
        
        <header>
          <h1 className="text-4xl md:text-5xl font-bold tracking-wider" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            Para Frente e Para Cima
          </h1>
        </header>

        <section className="my-8 md:my-12">
          <div className="text-8xl md:text-[16rem] font-mono font-bold" style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.5)' }}>
            {formatTime(timeLeft)}
          </div>
        </section>
        
        <section className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <label htmlFor="duration-input" className="text-md text-white/90 font-semibold">
              Set minutes (1-60)
            </label>
            <input
              id="duration-input"
              type="number"
              min="1"
              max="60"
              value={duration}
              onChange={handleDurationChange}
              disabled={isRunning}
              className="bg-transparent border-b-2 border-white/50 text-center text-2xl w-24 p-1 focus:outline-none focus:border-cyan-400 transition-colors disabled:opacity-50"
              aria-label="Set timer duration in minutes"
            />
          </div>

          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={handleStartPause}
              disabled={timeLeft === 0}
              className={`px-8 py-3 text-lg font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                isRunning
                  ? 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400'
                  : 'bg-cyan-500 hover:bg-cyan-600 focus:ring-cyan-400'
              }`}
              aria-live="polite"
            >
              {isRunning ? 'Pause' : (timeLeft < duration * 60 ? 'Resume' : 'Start')}
            </button>
            <button
              onClick={handleReset}
              disabled={isAtInitialState}
              className="px-8 py-3 text-lg font-semibold bg-red-600 rounded-lg transition-all duration-300 transform hover:bg-red-700 hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-red-400 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Reset
            </button>
          </div>

           <div className="mt-8 border-t border-white/20 pt-6 w-full flex justify-center">
              <label htmlFor="bg-upload" className="cursor-pointer text-white/90 bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-lg transition-colors text-sm font-semibold shadow-md">
                  Change Background
              </label>
              <input
                  id="bg-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  aria-label="Upload background image"
              />
           </div>

        </section>
      </div>
    </main>
  );
};

export default App;
