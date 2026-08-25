import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  FastForward, 
  Sparkles,
  Sliders,
  RotateCcw
} from 'lucide-react';

interface AudioPlayerProps {
  textToRead: string;
  title?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ textToRead, title = 'Document Summary' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const updateVoices = () => {
      if ('speechSynthesis' in window) {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        // Default to high quality English voice if present
        const defaultVoice = availableVoices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('English')));
        if (defaultVoice) {
          setSelectedVoice(defaultVoice.name);
        } else if (availableVoices.length > 0) {
          setSelectedVoice(availableVoices[0].name);
        }
      }
    };

    updateVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlay = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any active speech

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = rate;
    utterance.pitch = pitch;

    if (selectedVoice) {
      const voiceObj = voices.find(v => v.name === selectedVoice);
      if (voiceObj) utterance.voice = voiceObj;
    }

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    if ('speechSynthesis' in window && isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const changeRate = (newRate: number) => {
    setRate(newRate);
    if (isPlaying) {
      handleStop();
    }
  };

  return (
    <div className="bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Info & Status */}
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            isPlaying 
              ? 'bg-violet-600 text-white animate-pulse' 
              : 'bg-violet-100 dark:bg-violet-950/80 text-violet-600 dark:text-violet-300'
          }`}>
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Text-to-Speech Audio Reader</span>
              {isPlaying && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-600 text-white animate-pulse">
                  Playing ({rate}x)
                </span>
              )}
              {isPaused && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">
                  Paused
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Listen to AI summary with natural voice synthesis
            </p>
          </div>
        </div>

        {/* Center & Right: Controls */}
        <div className="flex items-center gap-2">
          
          {/* Rate shortcuts */}
          <div className="hidden sm:flex items-center bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            {[0.8, 1.0, 1.25, 1.5].map((r) => (
              <button
                key={r}
                onClick={() => changeRate(r)}
                className={`px-2 py-1 rounded-md transition ${
                  rate === r
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400'
                }`}
              >
                {r}x
              </button>
            ))}
          </div>

          {/* Voice Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Audio settings"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Play / Pause / Stop Buttons */}
          {!isPlaying ? (
            <button
              onClick={handlePlay}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs sm:text-sm font-semibold shadow-md transition"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isPaused ? 'Resume' : 'Listen'}</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-semibold shadow-md transition"
            >
              <Pause className="w-4 h-4 fill-white" />
              <span>Pause</span>
            </button>
          )}

          {(isPlaying || isPaused) && (
            <button
              onClick={handleStop}
              className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/60 dark:hover:text-red-400 transition"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          )}

        </div>

      </div>

      {/* Voice and Pitch Expandable Settings */}
      {showSettings && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Select Voice
            </label>
            <select
              value={selectedVoice}
              onChange={(e) => {
                setSelectedVoice(e.target.value);
                if (isPlaying) handleStop();
              }}
              className="w-full p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              <span>Voice Pitch:</span>
              <span>{pitch.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-600 mt-2"
            />
          </div>
        </div>
      )}
    </div>
  );
};
