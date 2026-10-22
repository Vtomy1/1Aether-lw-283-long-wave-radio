import React, { useState, useEffect, useRef } from 'react';
import { radioEngine } from '../audio/radioEngine';

interface MorseDecoderProps {
  currentFrequency: number;
  isPowered: boolean;
  carrierStrength: number;
  mode: string;
}

export const MorseDecoder: React.FC<MorseDecoderProps> = ({
  currentFrequency,
  isPowered,
  carrierStrength,
  mode
}) => {
  const isSaq = Math.abs(currentFrequency - 17.2) < 0.5;
  const isCwMode = mode === 'CW';

  const [decodedText, setDecodedText] = useState<string>(
    'CQ CQ CQ DE SAQ SAQ SAQ = THIS IS GRIMETON RADIO SWEDEN = 17.2 KHZ = '
  );
  const [morseStream, setMorseStream] = useState<string>('.-.-.  -.-. --.-  -.-. --.-  -.. .  ... .- --.-');
  const [wpmSpeed, setWpmSpeed] = useState<number>(16);
  const [isKeying, setIsKeying] = useState<boolean>(false);

  // Practice Straight Key Audio Sidetone
  const keyOscRef = useRef<OscillatorNode | null>(null);
  const keyGainRef = useRef<GainNode | null>(null);

  const handleKeyDown = () => {
    setIsKeying(true);
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 750; // 750 Hz standard CW sidetone
      gain.gain.value = 0.2;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      keyOscRef.current = osc;
      keyGainRef.current = gain;
    } catch {
      // Audio context fallback
    }
  };

  const handleKeyUp = () => {
    setIsKeying(false);
    if (keyOscRef.current) {
      try {
        keyOscRef.current.stop();
        keyOscRef.current.disconnect();
      } catch {
        // ignore
      }
      keyOscRef.current = null;
    }
  };

  // Simulate streaming text arrival for SAQ Grimeton or CW station
  useEffect(() => {
    if (!isPowered || carrierStrength < 20 || (!isSaq && !isCwMode)) return;

    const phrases = [
      'CQ CQ CQ DE SAQ SAQ SAQ ',
      'TRANSMITTING WITH ALEXANDERSON ALTERNATOR FROM 1924 ',
      'FREQUENCY 17.2 KHZ VLF ',
      'GREETINGS TO ALL RADIO AMATEURS AND SWL 73 DE SAQ + '
    ];

    let pIdx = 0;
    const interval = setInterval(() => {
      setDecodedText((prev) => {
        const nextChar = phrases[pIdx % phrases.length];
        pIdx++;
        return (prev + ' ' + nextChar).slice(-180);
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isPowered, carrierStrength, isSaq, isCwMode]);

  return (
    <div className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-lg p-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div>
          <h2 className="text-sm font-semibold font-mono text-neutral-200">
            CW MORSE TELEGRAPHY DECODER & KEYER
          </h2>
          <span className="text-xs text-neutral-400">
            Audio tone envelope demodulation & International Morse transcription
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
            isSaq && isPowered && carrierStrength > 20
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              : 'bg-neutral-950 text-neutral-500 border border-neutral-800'
          }`}>
            {isSaq ? 'SAQ GRIMETON 17.2k LOCKED' : 'CW CARRIER SEARCH'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
        {/* Live Transcribed Morse Decoded Text */}
        <div className="md:col-span-2 flex flex-col bg-neutral-950 rounded border border-neutral-800 p-3 shadow-inner">
          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pb-1.5 border-b border-neutral-800 mb-2">
            <span>RAW PULSE STREAM</span>
            <span>SPEED: {wpmSpeed} WPM (PARIS CALIBRATED)</span>
          </div>

          <div className="font-mono text-xs text-emerald-400/80 bg-neutral-900/50 p-2 rounded mb-2 overflow-x-auto whitespace-nowrap">
            {morseStream}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pb-1 mb-1">
            <span>DECODED TEXT BUFFER</span>
            <button
              type="button"
              onClick={() => setDecodedText('')}
              className="text-[10px] text-neutral-400 hover:text-neutral-200"
            >
              Clear Buffer
            </button>
          </div>

          <pre className="font-mono text-sm text-emerald-300 bg-black/60 p-3 rounded border border-neutral-900 h-28 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text font-bold">
            {decodedText}
          </pre>
        </div>

        {/* Straight Keyer Practice Pad */}
        <div className="flex flex-col justify-between bg-neutral-950 rounded border border-neutral-800 p-3">
          <div>
            <span className="block text-[11px] font-mono text-neutral-400 font-semibold mb-1">
              STRAIGHT KEY PRACTICE PAD
            </span>
            <p className="text-[11px] text-neutral-500 leading-normal mb-3">
              Press and hold to generate a 750 Hz CW sidetone pulse.
            </p>
          </div>

          <button
            type="button"
            onMouseDown={handleKeyDown}
            onMouseUp={handleKeyUp}
            onMouseLeave={handleKeyUp}
            onTouchStart={handleKeyDown}
            onTouchEnd={handleKeyUp}
            className={`w-full py-6 rounded-lg font-mono font-bold text-sm tracking-widest border transition-all select-none shadow-lg ${
              isKeying
                ? 'bg-amber-600 border-amber-400 text-neutral-950 translate-y-0.5 shadow-none'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-600 text-neutral-200'
            }`}
          >
            {isKeying ? 'KEY DOWN (TX)' : 'TELEGRAPH KEY'}
          </button>

          <div className="text-[10px] font-mono text-neutral-500 text-center mt-2">
            CW BFO FILTER: 500 Hz NARROW
          </div>
        </div>
      </div>
    </div>
  );
};
