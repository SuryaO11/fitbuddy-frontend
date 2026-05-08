import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { 
  Timer, 
  Camera, 
  Heart, 
  Settings,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useRef } from 'react';

export const QuickActions = () => {
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(180); // 3 minutes rest
  const [customMinutes, setCustomMinutes] = useState('3');
  const [customSeconds, setCustomSeconds] = useState('00');
  const [lastSetSeconds, setLastSetSeconds] = useState(180); // default 3 min
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setLastSetSeconds(timerSeconds);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (!isTimerActive && interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timerSeconds]);

  // Vibration and sound when timer completes
  useEffect(() => {
    if (timerSeconds === 0 && isTimerActive) {
      // Vibration (if supported)
      if (navigator.vibrate) {
        navigator.vibrate([300, 100, 300]);
      }
      // Play beep sound using Web Audio API
      playBeepSound();
      setIsTimerActive(false);
    }
  }, [timerSeconds, isTimerActive]);

  // Function to play beep sound using Web Audio API
  const playBeepSound = () => {
    try {
      // Create audio context if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configure sound
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz beep
      oscillator.type = 'sine';

      // Configure volume envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      // Play sound
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Error playing beep sound:', error);
    }
  };

  const handleFormCheck = () => {
    navigate('/form-check');
  };

  const handleSetCustom = () => {
    const mins = parseInt(customMinutes, 10) || 0;
    const secs = parseInt(customSeconds, 10) || 0;
    const total = mins * 60 + secs;
    setTimerSeconds(total);
    setLastSetSeconds(total);
    setIsTimerActive(false);
  };
  const handleReset = () => {
    setTimerSeconds(lastSetSeconds);
    setIsTimerActive(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6 shadow-card">
      <div className="space-y-6">
        <h3 className="text-xl font-bold">Quick Actions</h3>
        
        {/* Primary Actions */}
        <div className="grid grid-cols-1 gap-4">
          <Button onClick={handleFormCheck} className="h-20 flex flex-col items-center justify-center bg-pink-600 hover:bg-pink-700 text-white text-lg font-semibold rounded-lg shadow-md transition-colors duration-200 border-2 border-pink-800">
            <Camera className="h-6 w-6 mb-2" />
            Form Check
          </Button>
        </div>

        {/* Rest Timer */}
        <Card className={`p-4 bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 ${isTimerActive ? 'ring-2 ring-orange-400' : ''} shadow-md rounded-2xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-200 rounded-lg">
                <Timer className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold">Rest Timer</p>
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-white shadow-inner border border-orange-100 text-2xl font-bold font-mono text-orange-700">
                  {formatTime(timerSeconds)}
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Button
                className={`rounded-full p-3 border shadow-md ${isTimerActive ? 'border-orange-400 bg-white text-orange-600' : 'bg-orange-600 hover:bg-orange-700 text-white'}`}
                onClick={() => setIsTimerActive(!isTimerActive)}
                title={isTimerActive ? 'Pause Timer' : 'Start Timer'}
              >
                {isTimerActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                className="rounded-full p-3 border border-orange-300 bg-white hover:bg-orange-100 text-orange-600 shadow-md"
                onClick={handleReset}
                title="Reset Timer"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Custom Timer Input */}
          <div className="flex gap-2 mt-4 items-center justify-center">
            <label className="text-sm font-medium text-orange-700">Custom:</label>
            <div className="flex items-center bg-white rounded-full shadow-inner border border-orange-100 px-3 py-1">
              <input
                ref={inputRef}
                type="number"
                min="0"
                max="59"
                value={customMinutes}
                onChange={e => setCustomMinutes(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-10 px-1 py-0.5 rounded bg-transparent text-center font-mono text-base text-orange-700 focus:outline-none"
                placeholder="mm"
                aria-label="Minutes"
              />
              <span className="font-bold text-lg mx-1">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={customSeconds}
                onChange={e => setCustomSeconds(e.target.value.replace(/[^0-9]/g, '').slice(0,2))}
                className="w-10 px-1 py-0.5 rounded bg-transparent text-center font-mono text-base text-orange-700 focus:outline-none"
                placeholder="ss"
                aria-label="Seconds"
              />
            </div>
            <Button
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-md"
              onClick={handleSetCustom}
            >
              Set
            </Button>
          </div>
        </Card>






      </div>
      
    </Card>
  );
};