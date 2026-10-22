import React from 'react';
import { Sun, Moon, Sunset, Compass } from 'lucide-react';

interface IonosphereSimulatorProps {
  timeOfDay: 'day' | 'dusk' | 'night';
  onChangeTime: (time: 'day' | 'dusk' | 'night') => void;
  qrnLevel: number;
  onChangeQrn: (val: number) => void;
  frequency: number;
}

export const IonosphereSimulator: React.FC<IonosphereSimulatorProps> = ({
  timeOfDay,
  onChangeTime,
  qrnLevel,
  onChangeQrn,
  frequency
}) => {
  return (
    <div className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-lg p-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div>
          <h2 className="text-sm font-semibold font-mono text-neutral-200">
            IONOSPHERIC D-LAYER PROPAGATION & QRN MODEL
          </h2>
          <span className="text-xs text-neutral-400">
            Earth-ionosphere waveguide, solar ultraviolet ionization, and skywave skip
          </span>
        </div>

        {/* Time of Day Cycle Selector */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded border border-neutral-800">
          <button
            type="button"
            onClick={() => onChangeTime('day')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              timeOfDay === 'day'
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" /> DAY (Groundwave)
          </button>
          <button
            type="button"
            onClick={() => onChangeTime('dusk')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              timeOfDay === 'dusk'
                ? 'bg-orange-500/20 text-orange-300 font-semibold border border-orange-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sunset className="w-3.5 h-3.5 text-orange-400" /> DUSK (Greyline)
          </button>
          <button
            type="button"
            onClick={() => onChangeTime('night')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              timeOfDay === 'night'
                ? 'bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/40'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-blue-400" /> NIGHT (Skywave Skip)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4">
        {/* SVG Ionospheric Cross-Section Graphic */}
        <div className="lg:col-span-2 relative w-full h-44 bg-neutral-950 rounded border border-neutral-800 overflow-hidden flex items-center justify-center">
          <svg viewBox="0 0 600 200" className="w-full h-full">
            {/* Sky / Space Background */}
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={timeOfDay === 'night' ? '#040714' : timeOfDay === 'dusk' ? '#180e22' : '#0a192f'} />
                <stop offset="100%" stopColor="#080a0f" />
              </linearGradient>
            </defs>
            <rect width="600" height="200" fill="url(#skyGrad)" />

            {/* F-Layer (250 km) */}
            <line x1="20" y1="28" x2="580" y2="28" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.4" />
            <text x="30" y="24" fill="#60a5fa" fontSize="9" fontFamily="JetBrains Mono">F-LAYER (250 km)</text>

            {/* E-Layer (100 km) */}
            <line x1="20" y1="65" x2="580" y2="65" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.5" />
            <text x="30" y="60" fill="#22d3ee" fontSize="9" fontFamily="JetBrains Mono">E-LAYER (100 km)</text>

            {/* D-Layer (60-90 km) - Dense & Absorptive in daytime! */}
            <rect
              x="20"
              y="92"
              width="560"
              height="22"
              fill={timeOfDay === 'day' ? '#f59e0b' : timeOfDay === 'dusk' ? '#ea580c' : '#1e293b'}
              fillOpacity={timeOfDay === 'day' ? 0.35 : timeOfDay === 'dusk' ? 0.15 : 0.04}
              stroke={timeOfDay === 'day' ? '#f59e0b' : '#334155'}
              strokeWidth="1"
              rx="4"
            />
            <text x="30" y="106" fill={timeOfDay === 'day' ? '#fbbf24' : '#64748b'} fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
              D-LAYER {timeOfDay === 'day' ? '[HEAVY SOLAR ABSORPTION ACTIVE]' : '[COLLAPSED - TRANSPARENT]'}
            </text>

            {/* Earth Surface (Curved Ground) */}
            <path
              d="M 0 200 Q 300 165 600 200 Z"
              fill="#171717"
              stroke="#404040"
              strokeWidth="2"
            />
            <text x="300" y="190" textAnchor="middle" fill="#737373" fontSize="10" fontFamily="JetBrains Mono">
              EARTH SURFACE & CONDUCTIVE SEA WATER (GROUNDWAVE PATH)
            </text>

            {/* Transmitter Mast (e.g. Droitwich or Solec) */}
            <line x1="120" y1="172" x2="120" y2="135" stroke="#ef4444" strokeWidth="2.5" />
            <polygon points="115,135 125,135 120,128" fill="#ef4444" />
            <text x="120" y="124" textAnchor="middle" fill="#f87171" fontSize="9" fontFamily="JetBrains Mono">TX (MAST)</text>

            {/* Receiver Station */}
            <line x1="480" y1="172" x2="480" y2="142" stroke="#22c55e" strokeWidth="2" />
            <circle cx="480" cy="140" r="3" fill="#22c55e" />
            <text x="480" y="132" textAnchor="middle" fill="#4ade80" fontSize="9" fontFamily="JetBrains Mono">RX</text>

            {/* Groundwave propagation along Earth curvature */}
            <path
              d="M 120 170 Q 300 162 480 170"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2.5"
            />

            {/* Skywave skip (bounces between ionosphere and ground at night) */}
            {timeOfDay === 'night' ? (
              <path
                d="M 120 135 L 300 65 L 480 140"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="2.5"
                strokeDasharray="5 3"
              />
            ) : timeOfDay === 'dusk' ? (
              <path
                d="M 120 135 L 300 85 L 480 140"
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeOpacity="0.7"
              />
            ) : (
              // Attenuated in D-layer
              <line x1="120" y1="135" x2="200" y2="103" stroke="#f87171" strokeWidth="1.5" strokeDasharray="3 3" />
            )}
          </svg>
        </div>

        {/* Space Weather & Propagation Parameters */}
        <div className="flex flex-col justify-between bg-neutral-950 rounded border border-neutral-800 p-3 text-xs font-mono">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800">
              <span className="text-neutral-400">PROPAGATION MODE:</span>
              <span className="font-semibold text-neutral-200">
                {timeOfDay === 'night' ? 'IONOSPHERIC SKYWAVE' : timeOfDay === 'dusk' ? 'GREYLINE ENHANCED' : 'DIRECT GROUNDWAVE'}
              </span>
            </div>
            <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800">
              <span className="text-neutral-400">GROUND CONDUCTIVITY:</span>
              <span className="text-emerald-400 font-semibold">HIGH (SEA/SALT WATER)</span>
            </div>
            <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800">
              <span className="text-neutral-400">D-LAYER ATTENUATION:</span>
              <span className={timeOfDay === 'day' ? 'text-amber-400 font-bold' : 'text-neutral-400'}>
                {timeOfDay === 'day' ? '-24 dB (STRONG)' : timeOfDay === 'dusk' ? '-8 dB (DECAYING)' : '0 dB (ABSENT)'}
              </span>
            </div>
          </div>

          {/* QRN Atmospheric Static Slider */}
          <div className="mt-3 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between mb-1 text-[11px]">
              <span className="text-neutral-400">QRN (LIGHTNING STATIC):</span>
              <span className="text-neutral-200 font-semibold">{Math.round(qrnLevel * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={qrnLevel}
              onChange={(e) => onChangeQrn(parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
