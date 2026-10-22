import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { LONG_WAVE_STATIONS } from '../data/stations';

interface TuningDialProps {
  frequency: number; // in kHz
  onChange: (freq: number) => void;
  isPowered: boolean;
  colorScheme: 'phosphor' | 'amber' | 'cyan' | 'monochrome';
}

export const TuningDial: React.FC<TuningDialProps> = ({
  frequency,
  onChange,
  isPowered,
  colorScheme
}) => {
  const [knobAngle, setKnobAngle] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState(frequency.toFixed(2));
  const isDraggingRef = useRef(false);
  const lastAngleRef = useRef(0);
  const knobRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setInputVal(frequency.toFixed(2));
  }, [frequency]);

  // Handle direct frequency commit
  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputVal);
    if (!isNaN(val) && val >= 10 && val <= 530) {
      onChange(Math.round(val * 100) / 100);
    } else {
      setInputVal(frequency.toFixed(2));
    }
    setIsEditing(false);
  };

  // Step frequency by delta (in kHz)
  const stepFrequency = (deltaKhz: number) => {
    const next = Math.max(10, Math.min(530, Math.round((frequency + deltaKhz) * 100) / 100));
    onChange(next);
    setKnobAngle((prev) => prev + deltaKhz * 18);
  };

  // Flywheel pointer drag handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!knobRef.current) return;
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    lastAngleRef.current = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !knobRef.current) return;
    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);

    let deltaAngle = currentAngle - lastAngleRef.current;
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;

    lastAngleRef.current = currentAngle;
    setKnobAngle((prev) => prev + deltaAngle);

    // Sensitivity: 36 degrees = 1 kHz change (approx 0.028 kHz per degree)
    const freqDelta = deltaAngle * 0.025;
    const newFreq = Math.max(10, Math.min(530, Math.round((frequency + freqDelta) * 100) / 100));
    onChange(newFreq);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Mouse wheel fine tuning
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const step = e.shiftKey ? 1.0 : e.altKey ? 0.01 : 0.1;
    const direction = e.deltaY < 0 ? 1 : -1;
    stepFrequency(direction * step);
  };

  // Calculate slide-rule mechanical drum scale offset
  // Viewport window covers ~40 kHz width centered on current frequency
  const drumWindowWidthKhz = 50;
  const drumMin = frequency - drumWindowWidthKhz / 2;
  const drumMax = frequency + drumWindowWidthKhz / 2;

  const readoutGlow = {
    amber: 'text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]',
    phosphor: 'text-emerald-400 drop-shadow-[0_0_12px_rgba(34,197,94,0.6)]',
    cyan: 'text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]',
    monochrome: 'text-neutral-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'
  }[colorScheme];

  return (
    <div className="flex flex-col gap-3 p-4 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl select-none">
      {/* Top Tuning Ribbon: Digital Readout & ITU Steppers */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <span className="block text-[10px] font-mono tracking-wider text-neutral-400">
            TUNED FREQUENCY (LF / VLF)
          </span>
          {isEditing ? (
            <form onSubmit={handleInputSubmit} className="flex items-center gap-1 mt-0.5">
              <input
                type="number"
                step="0.01"
                min="10"
                max="530"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                autoFocus
                onBlur={handleInputSubmit}
                className="w-32 px-2 py-0.5 text-2xl font-mono font-bold bg-neutral-950 border border-amber-500 text-amber-300 rounded focus:outline-none"
              />
              <span className="text-sm font-mono text-neutral-400">kHz</span>
            </form>
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className="group flex items-baseline gap-1.5 cursor-pointer mt-0.5"
              title="Click to type frequency directly"
            >
              <span className={`text-3xl font-mono font-bold tabular-nums tracking-tight ${isPowered ? readoutGlow : 'text-neutral-600'}`}>
                {frequency.toFixed(2)}
              </span>
              <span className="text-xs font-mono font-semibold text-neutral-400 uppercase">kHz</span>
              <span className="text-[10px] text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                (edit)
              </span>
            </div>
          )}
        </div>

        {/* ITU Broadcast & Fine Step Buttons */}
        <div className="flex items-center gap-1.5">
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-mono text-neutral-400 mb-0.5">±9 kHz (ITU LW)</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => stepFrequency(-9.0)}
                className="px-2 py-1 text-xs font-mono bg-neutral-950 border border-neutral-800 rounded hover:bg-neutral-800 hover:text-white text-neutral-300 transition-colors"
              >
                -9k
              </button>
              <button
                type="button"
                onClick={() => stepFrequency(9.0)}
                className="px-2 py-1 text-xs font-mono bg-neutral-950 border border-neutral-800 rounded hover:bg-neutral-800 hover:text-white text-neutral-300 transition-colors"
              >
                +9k
              </button>
            </div>
          </div>

          <div className="w-[1px] h-7 bg-neutral-800 mx-1" />

          <div className="flex flex-col items-center">
            <span className="text-[9px] font-mono text-neutral-400 mb-0.5">±1 kHz</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => stepFrequency(-1.0)}
                className="px-2 py-1 text-xs font-mono bg-neutral-950 border border-neutral-800 rounded hover:bg-neutral-800 hover:text-white text-neutral-300 transition-colors"
              >
                -1k
              </button>
              <button
                type="button"
                onClick={() => stepFrequency(1.0)}
                className="px-2 py-1 text-xs font-mono bg-neutral-950 border border-neutral-800 rounded hover:bg-neutral-800 hover:text-white text-neutral-300 transition-colors"
              >
                +1k
              </button>
            </div>
          </div>

          <div className="w-[1px] h-7 bg-neutral-800 mx-1" />

          <div className="flex flex-col items-center">
            <span className="text-[9px] font-mono text-neutral-400 mb-0.5">±100 Hz FINE</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => stepFrequency(-0.1)}
                className="p-1 bg-neutral-950 border border-neutral-800 rounded hover:bg-neutral-800 hover:text-white text-neutral-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => stepFrequency(0.1)}
                className="p-1 bg-neutral-950 border border-neutral-800 rounded hover:bg-neutral-800 hover:text-white text-neutral-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mechanical Slide-Rule Backlit Drum Scale */}
      <div className="relative w-full h-14 bg-neutral-950 rounded-md border border-neutral-800 overflow-hidden shadow-inner flex items-center">
        {/* Amber/Phosphor Backlight Lamp */}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
            isPowered
              ? colorScheme === 'amber'
                ? 'bg-amber-500/5'
                : colorScheme === 'phosphor'
                ? 'bg-emerald-500/5'
                : 'bg-cyan-500/5'
              : 'opacity-0'
          }`}
        />

        {/* Graduations and station names on drum */}
        <div className="relative w-full h-full flex items-center">
          {LONG_WAVE_STATIONS.map((station) => {
            if (station.frequency >= drumMin && station.frequency <= drumMax) {
              const posPct = ((station.frequency - drumMin) / drumWindowWidthKhz) * 100;
              return (
                <div
                  key={station.id}
                  className="absolute transform -translate-x-1/2 flex flex-col items-center z-10 pointer-events-none"
                  style={{ left: `${posPct}%` }}
                >
                  <span className="text-[10px] font-bold font-mono text-amber-200/90 whitespace-nowrap bg-neutral-900/80 px-1 rounded shadow">
                    {station.callsign}
                  </span>
                  <div className="w-[1.5px] h-3 bg-amber-400 mt-0.5" />
                </div>
              );
            }
            return null;
          })}

          {/* Drum Graduations (every 1 kHz and 5 kHz) */}
          {Array.from({ length: 51 }).map((_, i) => {
            const freqTick = Math.floor(drumMin) + i;
            if (freqTick >= drumMin && freqTick <= drumMax) {
              const posPct = ((freqTick - drumMin) / drumWindowWidthKhz) * 100;
              const isMajor = freqTick % 5 === 0;
              return (
                <div
                  key={freqTick}
                  className="absolute bottom-0 transform -translate-x-1/2 flex flex-col items-center pointer-events-none"
                  style={{ left: `${posPct}%` }}
                >
                  {isMajor && (
                    <span className="text-[8px] font-mono text-neutral-400 tabular-nums">
                      {freqTick}
                    </span>
                  )}
                  <div
                    className={`w-[1px] ${
                      isMajor ? 'h-3 bg-neutral-500' : 'h-1.5 bg-neutral-800'
                    }`}
                  />
                </div>
              );
            }
            return null;
          })}
        </div>

        {/* Red Center Hairline Cursor with Shadow */}
        <div className="absolute left-1/2 top-0 bottom-0 transform -translate-x-1/2 w-[2px] bg-red-500 z-20 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
        <div className="absolute left-1/2 top-0 transform -translate-x-1/2 border-t-4 border-t-red-500 border-x-4 border-x-transparent z-20" />
        <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 border-b-4 border-b-red-500 border-x-4 border-x-transparent z-20" />
      </div>

      {/* Flywheel Rotary Knob & Quick Knobs Container */}
      <div className="flex items-center justify-around pt-2">
        {/* Fast Spin Reset */}
        <button
          type="button"
          onClick={() => onChange(198.0)}
          className="flex flex-col items-center gap-1 text-[10px] font-mono text-neutral-400 hover:text-neutral-200 transition-colors p-2"
          title="Reset to 198 kHz BBC Radio 4"
        >
          <RotateCcw className="w-4 h-4 text-neutral-400" />
          <span>RST 198k</span>
        </button>

        {/* Weighted Flywheel Rotary Tuning Wheel */}
        <div className="flex flex-col items-center">
          <div
            ref={knobRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
            className="relative w-24 h-24 rounded-full bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-950 border-4 border-neutral-700 shadow-[0_8px_20px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.2)] cursor-grab active:cursor-grabbing touch-none flex items-center justify-center"
          >
            {/* Textured Knurling Outer Rim */}
            <div
              className="absolute inset-1 rounded-full border border-neutral-600/40"
              style={{
                transform: `rotate(${knobAngle}deg)`,
                backgroundImage: 'repeating-conic-gradient(from 0deg, #333 0deg 2deg, #1f1f1f 2deg 4deg)'
              }}
            />

            {/* Inner Aluminum Disc */}
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-neutral-800 via-neutral-600 to-neutral-800 border border-neutral-500/50 shadow flex items-center justify-center">
              {/* Spinner Finger Dimple */}
              <div
                className="absolute w-3.5 h-3.5 rounded-full bg-neutral-900 border border-neutral-600 shadow-inner"
                style={{
                  top: '6px',
                  transform: `rotate(${knobAngle}deg)`,
                  transformOrigin: '50% 22px'
                }}
              />
              <span className="text-[9px] font-bold font-mono text-neutral-300">TUNE</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-neutral-400 mt-2">
            ROTARY FLYWHEEL (DRAG / SCROLL)
          </span>
        </div>

        {/* Mode info pill */}
        <div className="text-right text-[10px] font-mono text-neutral-400 flex flex-col items-end gap-1">
          <span className="text-neutral-400 text-[9px]">DIAL RESOLUTION</span>
          <span className="font-semibold text-neutral-300">10 Hz FINE</span>
          <span className="text-neutral-400 text-[9px] mt-1">ITU CHANNELS</span>
          <span className="font-semibold text-neutral-300">9 kHz GRID</span>
        </div>
      </div>
    </div>
  );
};
