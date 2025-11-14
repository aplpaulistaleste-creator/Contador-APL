
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";

const curatedGallery = [
  {
    id: 'space-nebula',
    thumb: 'https://storage.googleapis.com/aai-web-samples/backgrounds/thumbs/space-nebula.jpg',
    full: 'https://storage.googleapis.com/aai-web-samples/backgrounds/full/space-nebula.jpg',
    alt: 'A colorful nebula in deep space'
  },
  {
    id: 'serene-lake',
    thumb: 'https://storage.googleapis.com/aai-web-samples/backgrounds/thumbs/serene-lake.jpg',
    full: 'https://storage.googleapis.com/aai-web-samples/backgrounds/full/serene-lake.jpg',
    alt: 'A serene lake with mountains in the background during sunset'
  },
  {
    id: 'abstract-waves',
    thumb: 'https://storage.googleapis.com/aai-web-samples/backgrounds/thumbs/abstract-waves.jpg',
    full: 'https://storage.googleapis.com/aai-web-samples/backgrounds/full/abstract-waves.jpg',
    alt: 'Abstract colorful digital waves'
  },
  {
    id: 'forest-path',
    thumb: 'https://storage.googleapis.com/aai-web-samples/backgrounds/thumbs/forest-path.jpg',
    full: 'https://storage.googleapis.com/aai-web-samples/backgrounds/full/forest-path.jpg',
    alt: 'A sunlit path through a lush green forest'
  }
];

const App: React.FC = () => {
  const [duration, setDuration] = useState<number>(5);
  const [timeLeft, setTimeLeft] = useState<number>(duration * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>(curatedGallery[0].full);
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [textFont, setTextFont] = useState<string>('monospace');

  const [showBackgroundModal, setShowBackgroundModal] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>('A calm beach at sunset');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);


  // Load customizations from localStorage on initial render
  useEffect(() => {
    const savedColor = localStorage.getItem('timerTextColor');
    if (savedColor) {
      setTextColor(savedColor);
    }
    const savedFont = localStorage.getItem('timerTextFont');
    if (savedFont) {
      setTextFont(savedFont);
    }
  }, []);

  // Save customizations to localStorage when they change
  useEffect(() => {
    localStorage.setItem('timerTextColor', textColor);
  }, [textColor]);

  useEffect(() => {
    localStorage.setItem('timerTextFont', textFont);
  }, [textFont]);

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

  useEffect(() => {
    const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
  };

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
      setShowBackgroundModal(false);
    }
  };
  
  const handleSelectFromGallery = (imageUrl: string) => {
    if (backgroundImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(backgroundImageUrl);
    }
    setBackgroundImageUrl(imageUrl);
    setShowBackgroundModal(false);
  };

  const handleGenerateImage = async () => {
    if (!aiPrompt.trim()) {
      alert('Please enter a prompt.');
      return;
    }
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: `A visually stunning, high-resolution background image for a countdown timer app. Style: cinematic, serene. Prompt: ${aiPrompt}`,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
          },
      });
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      const newImageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
      
      if (backgroundImageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(backgroundImageUrl);
      }
      setBackgroundImageUrl(newImageUrl);
      setShowBackgroundModal(false);
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image. Please check your API key and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatTime = (timeInSeconds: number): string => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = timeInSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isAtInitialState = !isRunning && timeLeft === duration * 60;
  
  const fontOptions = [
    { value: 'monospace', label: 'Monospace' },
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: "'Times New Roman', serif", label: 'Times New Roman' },
    { value: "'Courier New', monospace", label: 'Courier New' },
    { value: 'Verdana, sans-serif', label: 'Verdana' },
    { value: "'Brush Script MT', cursive", label: 'Cursive' }
  ];

  return (
    <>
      <main
        className="relative min-h-screen w-full bg-cover bg-center flex items-center justify-center p-4 transition-all duration-500"
        style={{ backgroundImage: `url(${backgroundImageUrl})` }}
      >
        <button
          onClick={toggleFullScreen}
          className="absolute top-4 right-4 z-20 p-2 text-white bg-black/30 rounded-full hover:bg-black/50 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
        >
          {isFullscreen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9M20.25 20.25h-4.5m4.5 0v-4.5m0-4.5L15 15" />
            </svg>
          )}
        </button>
        <div className="relative z-10 w-full max-w-4xl text-white text-center p-6 md:p-10">
          
          <header className="h-8">
            {/* Header space reserved, content removed */}
          </header>

          <section className="my-8 md:my-12">
            <div className="text-8xl md:text-[16rem] font-bold" style={{ color: textColor, fontFamily: textFont, textShadow: `3px 3px 8px rgba(0, 0, 0, 0.7), 0 0 25px ${textColor}80` }}>
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

            <div className="mt-8 border-t border-white/20 pt-6 w-full space-y-6">
                  <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4" aria-label="Timer display customization options">
                      <div className="flex flex-col items-center gap-2">
                          <label htmlFor="text-color-input" className="text-md text-white/90 font-semibold">Timer Color</label>
                          <input
                              id="text-color-input"
                              type="color"
                              value={textColor}
                              onChange={(e) => setTextColor(e.target.value)}
                              className="w-16 h-10 p-1 bg-transparent border border-white/50 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400"
                              aria-label="Select timer text color"
                          />
                      </div>
                      <div className="flex flex-col items-center gap-2">
                          <label htmlFor="text-font-select" className="text-md text-white/90 font-semibold">Timer Font</label>
                          <select
                              id="text-font-select"
                              value={textFont}
                              onChange={(e) => setTextFont(e.target.value)}
                              className="bg-black/50 border border-white/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                              aria-label="Select timer text font"
                          >
                              {fontOptions.map(font => (
                                  <option key={font.value} value={font.value} className="bg-gray-800">{font.label}</option>
                              ))}
                          </select>
                      </div>
                  </div>
                  <div className="flex justify-center">
                      <button 
                        onClick={() => setShowBackgroundModal(true)}
                        className="cursor-pointer text-white/90 bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-lg transition-colors text-sm font-semibold shadow-md">
                          Change Background
                      </button>
                  </div>
            </div>
          </section>
        </div>
      </main>
      
      {showBackgroundModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowBackgroundModal(false)}>
            <div className="bg-gray-800/80 border border-white/20 p-6 md:p-8 rounded-2xl max-w-3xl w-full text-white relative shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <button onClick={() => setShowBackgroundModal(false)} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors" aria-label="Close background options">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h2 className="text-2xl font-bold mb-6 text-center">Change Background</h2>
                
                <div className="space-y-8">
                    {/* Generate with AI */}
                    <section>
                        <h3 className="text-lg font-semibold mb-3 border-b border-white/20 pb-2">Generate with AI</h3>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input 
                                type="text"
                                value={aiPrompt}
                                onChange={e => setAiPrompt(e.target.value)}
                                placeholder="e.g., A calm beach at sunset"
                                className="flex-grow bg-black/30 border border-white/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                disabled={isGenerating}
                            />
                            <button onClick={handleGenerateImage} disabled={isGenerating} className="px-6 py-2 font-semibold bg-cyan-500 rounded-lg transition-all duration-300 hover:bg-cyan-600 shadow-lg disabled:bg-gray-500 disabled:cursor-not-allowed">
                                {isGenerating ? 'Generating...' : 'Generate'}
                            </button>
                        </div>
                    </section>
                    
                    {/* Curated Gallery */}
                    <section>
                        <h3 className="text-lg font-semibold mb-3 border-b border-white/20 pb-2">Curated Gallery</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {curatedGallery.map(image => (
                                <button key={image.id} onClick={() => handleSelectFromGallery(image.full)} className="aspect-video rounded-lg overflow-hidden group focus:outline-none focus:ring-4 focus:ring-cyan-400/80">
                                    <img src={image.thumb} alt={image.alt} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"/>
                                </button>
                            ))}
                        </div>
                    </section>
                    
                    {/* Upload your own */}
                    <section>
                        <h3 className="text-lg font-semibold mb-3 border-b border-white/20 pb-2">Upload Your Own</h3>
                        <div className="flex justify-center">
                          <label htmlFor="bg-upload-modal" className="cursor-pointer text-white/90 bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-lg transition-colors text-sm font-semibold shadow-md">
                              Choose an Image
                          </label>
                          <input
                              id="bg-upload-modal"
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              aria-label="Upload background image"
                          />
                        </div>
                    </section>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default App;
