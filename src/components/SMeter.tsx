import React, { useEffect, useRef } from 'react';
import { SignalMeasurement } from '../types/radio';

interface SMeterProps {
  measurement: SignalMeasurement;
  isPowered: boolean;
  colorScheme?: 'phosphor' | 'amber' | 'cyan' | 'monochrome';
}

export const SMeter: React.FC<SMeterProps> = ({
  measurement,
  isPowered,
  colorScheme = 'amber'
}) => {
  const needleAngleRef = useRef(-45); // -45 deg is 0, +45 deg is full scale
  const animationFrameRef = useRef<number | null>(null);
  const needleElementRef = useRef<SVGLineElement | null>(null);

  // Target angle based on S-Units: S0 (-45 deg) to S9+30dB (+45 deg)
  const targetAngle = isPowered
    ? -45 + Math.min(90, Math.max(0, (measurement.sUnits / 12) * 90))
    : -45;

  useEffect(() => {
    const updateBallistics = () => {
      // Damped ballistic spring physics: rises fast, decays slowly
      const diff = targetAngle - needleAngleRef.current;
      const speed = diff > 0 ? 0.28 : 0.08; // Fast attack, slow decay
      needleAngleRef.current += diff * speed;

      // Small jitter when signal is strong (simulating atmospheric QSB flutter)
      if (isPowered && measurement.carrierStrength > 10) {
        needleAngleRef.current += (Math.random() - 0.5) * 0.4;
      }

      if (needleElementRef.current) {
        needleElementRef.current.setAttribute(
          'transform',
          `rotate(${needleAngleRef.current.toFixed(2)} 150 160)`
        );
      }

      animationFrameRef.current = requestAnimationFrame(updateBallistics);
    };

    animationFrameRef.current = requestAnimationFrame(updateBallistics);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [targetAngle, isPowered, measurement.carrierStrength]);

  // Backlit meter color themes
  const themeGlow = {
    amber: 'bg-amber-950/40 border-amber-900/60 shadow-[inset_0_0_25px_rgba(245,158,11,0.2)] text-amber-200',
    phosphor: 'bg-emerald-950/40 border-emerald-900/60 shadow-[inset_0_0_25px_rgba(16,185,129,0.2)] text-emerald-200',
    cyan: 'bg-cyan-950/40 border-cyan-900/60 shadow-[inset_0_0_25px_rgba(6,182,212,0.2)] text-cyan-200',
    monochrome: 'bg-neutral-900/40 border-neutral-800 shadow-[inset_0_0_25px_rgba(255,255,255,0.1)] text-neutral-200'
  }[colorScheme];

  const lampTint = isPowered
    ? colorScheme === 'amber'
      ? 'fill-amber-500/10'
      : colorScheme === 'phosphor'
      ? 'fill-emerald-500/10'
      : 'fill-cyan-500/10'
    : 'fill-neutral-950';

  return (
    <div className={`relative flex flex-col items-center justify-between p-3.5 rounded-lg border ${themeGlow} transition-colors select-none`}>
      {/* Header Label */}
      <div className="w-full flex items-center justify-between text-[11px] font-mono tracking-wider text-neutral-400 border-b border-neutral-800/80 pb-1 mb-1">
        <span>SIGNAL STRENGTH</span>
        <span className="font-semibold text-neutral-200 tabular-nums">
          {isPowered ? (measurement.sUnits > 9 ? `S9 +${((measurement.sUnits - 9) * 10).toFixed(0)}dB` : `S${measurement.sUnits.toFixed(1)}`) : 'STANDBY'}
        </span>
      </div>

      {/* Analog Galvanometer Meter Arc */}
      <div className="relative w-full max-w-[280px] aspect-[300/180] overflow-hidden">
        <svg viewBox="0 0 300 180" className="w-full h-full drop-shadow-md">
          {/* Bezel Background */}
          <path
            d="M 20 160 A 130 130 0 0 1 280 160 Z"
            className={`${lampTint} transition-all duration-300`}
            stroke="#262626"
            strokeWidth="2"
          />

          {/* Scale Arc Line */}
          <path
            d="M 40 160 A 110 110 0 0 1 260 160"
            fill="none"
            stroke="#525252"
            strokeWidth="1.5"
          />

          {/* Over-9dB red arc segment */}
          <path
            d="M 205 82 A 110 110 0 0 1 260 160"
            fill="none"
            stroke="#ef4444"
            strokeWidth="3.5"
            strokeOpacity="0.8"
          />

          {/* S-Units Tick Marks */}
          {/* -45 deg to +15 deg = S1 to S9 */}
          {[
            { s: '1', angle: -45 },
            { s: '3', angle: -30 },
            { s: '5', angle: -15 },
            { s: '7', angle: 0 },
            { s: '9', angle: 15 },
            { s: '+10', angle: 25, isDb: true },
            { s: '+20', angle: 35, isDb: true },
            { s: '+30', angle: 45, isDb: true }
          ].map((tick) => {
            const rad = ((tick.angle - 90) * Math.PI) / 180;
            const x1 = 150 + 110 * Math.cos(rad);
            const y1 = 160 + 110 * Math.sin(rad);
            const x2 = 150 + (tick.isDb ? 98 : 100) * Math.cos(rad);
            const y2 = 160 + (tick.isDb ? 98 : 100) * Math.sin(rad);
            const tx = 150 + 86 * Math.cos(rad);
            const ty = 160 + 86 * Math.sin(rad) + 4;

            return (
              <g key={tick.s}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={tick.isDb ? '#ef4444' : '#a3a3a3'}
                  strokeWidth={tick.isDb ? 2 : 1.5}
                />
                <text
                  x={tx}
                  y={ty}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="600"
                  fill={tick.isDb ? '#f87171' : '#d4d4d4'}
                >
                  {tick.s}
                </text>
              </g>
            );
          })}

          {/* Sub-ticks */}
          {[-37.5, -22.5, -7.5, 7.5].map((angle) => {
            const rad = ((angle - 90) * Math.PI) / 180;
            const x1 = 150 + 110 * Math.cos(rad);
            const y1 = 160 + 110 * Math.sin(rad);
            const x2 = 150 + 104 * Math.cos(rad);
            const y2 = 160 + 104 * Math.sin(rad);
            return (
              <line
                key={angle}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#737373"
                strokeWidth="1"
              />
            );
          })}

          {/* Center Brand Text */}
          <text
            x="150"
            y="138"
            textAnchor="middle"
            fontSize="9"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontWeight="600"
            letterSpacing="0.1em"
            fill="#a3a3a3"
          >
            S-UNITS / dB OVER S9
          </text>

          {/* Galvanometer Needle */}
          <g>
            <line
              ref={needleElementRef}
              x1="150"
              y1="160"
              x2="150"
              y2="52"
              stroke="#ef4444"
              strokeWidth="2.2"
              strokeLinecap="round"
              transform="rotate(-45 150 160)"
              className="transition-none drop-shadow"
            />
            {/* Pivot Cap */}
            <circle cx="150" cy="160" r="11" fill="#171717" stroke="#404040" strokeWidth="2" />
            <circle cx="150" cy="160" r="4" fill="#a3a3a3" />
          </g>
        </svg>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="w-full grid grid-cols-3 gap-1 pt-2 border-t border-neutral-800/80 text-[10px] font-mono text-neutral-400">
        <div>
          <span className="block text-neutral-400 text-[9px]">CARRIER</span>
          <span className="font-semibold text-neutral-200 tabular-nums">
            {isPowered ? `${measurement.carrierStrength}%` : '0%'}
          </span>
        </div>
        <div className="text-center">
          <span className="block text-neutral-400 text-[9px]">SNR</span>
          <span className="font-semibold text-neutral-200 tabular-nums">
            {isPowered ? `+${measurement.snrDb} dB` : '--'}
          </span>
        </div>
        <div className="text-right">
          <span className="block text-neutral-400 text-[9px]">LOCK</span>
          <span className={`font-semibold tabular-nums ${measurement.isLocked ? 'text-emerald-400' : 'text-neutral-500'}`}>
            {isPowered ? (measurement.isLocked ? 'ZERO-BEAT' : `${measurement.tuningOffsetHz > 0 ? '+' : ''}${measurement.tuningOffsetHz}Hz`) : 'IDLE'}
          </span>
        </div>
      </div>
    </div>
  );
};
