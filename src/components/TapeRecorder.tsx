import React, { useState, useEffect, useRef } from 'react';
import { radioEngine } from '../audio/radioEngine';
import { Disc, Square, Play, Download, Trash2 } from 'lucide-react';

interface TapeRecorderProps {
  currentFrequency: number;
  isPowered: boolean;
}

interface AudioCapture {
  id: string;
  timestamp: string;
  frequency: number;
  durationSec: number;
  url: string;
}

export const TapeRecorder: React.FC<TapeRecorderProps> = ({
  currentFrequency,
  isPowered
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [captures, setCaptures] = useState<AudioCapture[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordDuration(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const handleToggleRecord = async () => {
    if (!isRecording) {
      if (!isPowered) return;
      const started = radioEngine.startRecording();
      if (started) {
        setIsRecording(true);
      }
    } else {
      const recordedUrl = await radioEngine.stopRecording();
      setIsRecording(false);
      if (recordedUrl) {
        const newCapture: AudioCapture = {
          id: `rec_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          frequency: currentFrequency,
          durationSec: recordDuration,
          url: recordedUrl
        };
        setCaptures((prev) => [newCapture, ...prev]);
      }
    }
  };

  const handleDeleteCapture = (id: string) => {
    setCaptures((prev) => prev.filter((c) => c.id !== id));
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-lg p-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div>
          <h2 className="text-sm font-semibold font-mono text-neutral-200">
            SIGNAL WIRE & TAPE RECORDER
          </h2>
          <span className="text-xs text-neutral-400">
            Real-time audio intercept capture and archive
          </span>
        </div>

        {/* Recording Status Flag */}
        <div className="flex items-center gap-2">
          {isRecording && (
            <span className="text-xs font-mono font-bold text-red-400 flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              RECORDING {formatTime(recordDuration)}
            </span>
          )}
          <button
            type="button"
            onClick={handleToggleRecord}
            disabled={!isPowered && !isRecording}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:pointer-events-none ${
              isRecording
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" /> STOP TAPE
              </>
            ) : (
              <>
                <Disc className="w-3.5 h-3.5" /> RECORD INTERCEPT
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
        {/* Animated Tape Deck Reels */}
        <div className="flex items-center justify-center gap-6 p-4 bg-neutral-950 rounded border border-neutral-800">
          {/* Left Feed Reel */}
          <div
            className={`relative w-16 h-16 rounded-full border-2 border-neutral-600 bg-neutral-800 flex items-center justify-center ${
              isRecording ? 'animate-spin' : ''
            }`}
            style={{ animationDuration: '3s' }}
          >
            <div className="w-5 h-5 rounded-full bg-neutral-950 border border-neutral-600" />
            <div className="absolute w-12 h-1 bg-neutral-600" />
            <div className="absolute w-1 h-12 bg-neutral-600" />
          </div>

          <div className="text-center font-mono text-xs text-neutral-400">
            <span className="block text-[10px] text-neutral-400">TAPE COUNTER</span>
            <span className="text-base font-bold text-neutral-200 tabular-nums">
              {isRecording ? formatTime(recordDuration) : '00:00'}
            </span>
          </div>

          {/* Right Take-Up Reel */}
          <div
            className={`relative w-16 h-16 rounded-full border-2 border-neutral-600 bg-neutral-800 flex items-center justify-center ${
              isRecording ? 'animate-spin' : ''
            }`}
            style={{ animationDuration: '3s' }}
          >
            <div className="w-5 h-5 rounded-full bg-neutral-950 border border-neutral-600" />
            <div className="absolute w-12 h-1 bg-neutral-600" />
            <div className="absolute w-1 h-12 bg-neutral-600" />
          </div>
        </div>

        {/* Captured Recordings List */}
        <div className="md:col-span-2 flex flex-col bg-neutral-950 rounded border border-neutral-800 p-3">
          <span className="text-[11px] font-mono text-neutral-400 mb-2">
            CAPTURED RECORDINGS ({captures.length})
          </span>

          {captures.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-xs font-mono text-neutral-600">
              No audio intercepts recorded yet. Tune to a station and click Record Intercept.
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
              {captures.map((cap) => (
                <div
                  key={cap.id}
                  className="flex items-center justify-between p-2 rounded bg-neutral-900 border border-neutral-800 text-xs font-mono"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-amber-400 tabular-nums">
                      {cap.frequency.toFixed(1)} kHz
                    </span>
                    <span className="text-neutral-400">{cap.timestamp}</span>
                    <span className="text-neutral-500">{formatTime(cap.durationSec)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <audio src={cap.url} controls className="h-6 w-32" />
                    <a
                      href={cap.url}
                      download={`radio_intercept_${cap.frequency}kHz_${cap.id}.webm`}
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                      title="Download audio file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteCapture(cap.id)}
                      className="p-1 rounded bg-neutral-800 hover:bg-red-900/60 text-neutral-400 hover:text-red-200 transition-colors"
                      title="Delete recording"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
