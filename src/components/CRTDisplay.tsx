import React, { useRef, useEffect, useState } from 'react';
import { radioEngine } from '../audio/radioEngine';

interface CRTDisplayProps {
  isPowered: boolean;
  colorScheme: 'phosphor' | 'amber' | 'cyan' | 'monochrome';
}

export const CRTDisplay: React.FC<CRTDisplayProps> = ({
  isPowered,
  colorScheme
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [displayMode, setDisplayMode] = useState<'wave' | 'lissajous'>('wave');
  const [sweepSpeed, setSweepSpeed] = useState<number>(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const bufferLength = 1024;
    const dataArray = new Uint8Array(bufferLength);

    const phosphorColor = colorScheme === 'phosphor'
      ? '#22c55e'
      : colorScheme === 'amber'
      ? '#f59e0b'
      : colorScheme === 'cyan'
      ? '#06b6d4'
      : '#e2e8f0';

    const glowColor = colorScheme === 'phosphor'
      ? 'rgba(34, 197, 94, 0.4)'
      : colorScheme === 'amber'
      ? 'rgba(245, 158, 11, 0.4)'
      : colorScheme === 'cyan'
      ? 'rgba(6, 182, 212, 0.4)'
      : 'rgba(226, 232, 240, 0.3)';

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Semi-transparent black fill creates phosphor persistence trail
      ctx.fillStyle = 'rgba(7, 10, 15, 0.22)';
      ctx.fillRect(0, 0, width, height);

      // Draw oscilloscope reticle grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const stepX = width / 8;
      const stepY = height / 6;

      for (let x = stepX; x < width; x += stepX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = stepY; y < height; y += stepY) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Center crosshair with micro tick marks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (!isPowered) {
        // Collapsed dot/center horizontal trace when powered off
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        animId = requestAnimationFrame(render);
        return;
      }

      // Fetch live audio waveform from engine
      radioEngine.getWaveformData(dataArray);

      ctx.lineWidth = 2;
      ctx.strokeStyle = phosphorColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8;

      if (displayMode === 'wave') {
        ctx.beginPath();
        const sliceWidth = (width * 1.0) / (bufferLength / sweepSpeed);
        let x = 0;

        for (let i = 0; i < bufferLength; i += sweepSpeed) {
          const v = dataArray[i] / 128.0; // 0 to 2
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.stroke();
      } else {
        // Lissajous modulation pattern (X vs Y phase relationship)
        ctx.beginPath();
        const centerX = width / 2;
        const centerY = height / 2;
        const scale = height * 0.42;

        for (let i = 0; i < bufferLength - 1; i += 2) {
          const vx = (dataArray[i] - 128) / 128.0;
          const vy = (dataArray[i + 1] - 128) / 128.0;
          const px = centerX + vx * scale;
          const py = centerY + vy * scale;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPowered, colorScheme, displayMode, sweepSpeed]);

  return (
    <div className="relative flex flex-col p-3 rounded-lg border border-neutral-800 bg-neutral-950 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-[11px] font-mono text-neutral-400">
        <span className="font-semibold text-neutral-300">CRT AUDIO OSCILLOSCOPE</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDisplayMode(displayMode === 'wave' ? 'lissajous' : 'wave')}
            className={`px-2 py-0.5 rounded text-[10px] transition-colors border ${
              displayMode === 'lissajous'
                ? 'bg-neutral-800 border-neutral-600 text-neutral-200'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {displayMode === 'wave' ? 'WAVEFORM' : 'LISSAJOUS'}
          </button>
          <button
            type="button"
            onClick={() => setSweepSpeed(sweepSpeed === 1 ? 2 : sweepSpeed === 2 ? 4 : 1)}
            className="px-2 py-0.5 rounded text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200"
          >
            TIMEBASE: {sweepSpeed}X
          </button>
        </div>
      </div>

      {/* CRT Tube Viewport */}
      <div className="relative w-full aspect-[280/160] rounded-md bg-[#05070a] border border-neutral-800 overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          width={400}
          height={230}
          className="w-full h-full block"
        />

        {/* Scanline CRT overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.8) 2px, rgba(0, 0, 0, 0.8) 4px)'
          }}
        />

        {/* CRT Glass Reflection / Vignette */}
        <div
          className="absolute inset-0 pointer-events-none rounded-md"
          style={{
            boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.05)'
          }}
        />
      </div>

      <div className="flex items-center justify-between pt-2 text-[10px] font-mono text-neutral-500">
        <span>SWEEP: AUTO-TRIGGER</span>
        <span>VERTICAL: 50mV/DIV</span>
        <span>PHOSPHOR: P31 FAST</span>
      </div>
    </div>
  );
};
