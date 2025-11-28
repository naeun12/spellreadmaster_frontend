// GameLayout.jsx
import React, { useRef, useEffect, useState } from 'react';

const GameLayout = ({ children }) => {
  const audioRef = useRef(null);
  const [volume, setVolume] = useState(0.5);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Load saved volume on mount
  useEffect(() => {
    const saved = localStorage.getItem('gameMusicVolume');
    if (saved !== null) {
      setVolume(parseFloat(saved));
    }
  }, []);

  // Sync volume to audio element and localStorage
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      localStorage.setItem('gameMusicVolume', volume.toString());
    }
  }, [volume]);

  // Handle audio play/pause lifecycle
  useEffect(() => {
    const playAudio = () => {
      if (audioRef.current) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.warn('Audio autoplay blocked:', error);
          });
        }
      }
    };

    playAudio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  // Close slider when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => {
      if (showVolumeSlider) {
        setShowVolumeSlider(false);
      }
    };

    if (showVolumeSlider) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [showVolumeSlider]);

  // Prevent closing when clicking inside the volume control
  const handleVolumeClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="min-h-screen overflow-hidden relative">
      {children}

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src="/audio/background-music.mp3"
        loop
        preload="auto"
        className="hidden"
      />

      {/* Volume toggle in bottom-right */}
      <div
        className="absolute bottom-4 right-4 z-10"
        onClick={handleVolumeClick}
      >
        {/* Volume icon */}
        <button
          onClick={() => setShowVolumeSlider(!showVolumeSlider)}
          className="p-2 rounded-full bg-white/70 backdrop-blur-sm shadow-md hover:bg-white/90 transition-all"
          aria-label={showVolumeSlider ? 'Hide volume slider' : 'Adjust music volume'}
        >
          {/* Dynamic icon based on volume level */}
          {volume === 0 ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2-2-2M13 8l2 2-2 2" />
            </svg>
          ) : volume < 0.5 ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728" />
            </svg>
          )}
        </button>

        {/* Slider popup */}
        {showVolumeSlider && (
          <div className="mb-2 flex items-center bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg min-w-[160px]">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 accent-blue-600"
              aria-label="Music volume"
            />
            <span className="text-xs text-gray-700 w-8 text-right">
              {Math.round(volume * 100)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameLayout;