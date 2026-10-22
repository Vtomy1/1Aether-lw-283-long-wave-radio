import React, { useRef, useEffect, useState, useCallback } from 'react';
import { LONG_WAVE_STATIONS } from '../data/stations';
import { RadioStation, ReceiverState } from '../types/radio';
import { saveFrequencyScan, getFrequencyHistory, HISTORY_UPDATE_EVENT } from '../utils/historyStorage';
import { History, Check } from 'lucide-react';

interface WaterfallDisplayProps {
  receiverState: ReceiverState;
  onFrequencyChange: (freqKhz: number) => void;
  colorScheme: 'phosphor' | 'amber' | 'cyan' | 'monochrome';
  onOpenHistory?: () => void;
}

export const WaterfallDisplay: React.FC<WaterfallDisplayProps> = ({
  receiverState,
  onFrequencyChange,
  colorScheme,
  onOpenHistory
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);

  // Frequency range: 10 kHz to 530 kHz (covers all VLF, LF, Longwave & NAVTEX)
  const [minFreq, setMinFreq] = useState(10);
  const [maxFreq, setMaxFreq] = useState(530);
  const [zoomLevel, setZoomLevel] = useState<'full' | 'lw_broadcast' | 'vlf_maritime'>('full');

  // Zoom presets
  const handleZoomChange = (level: 'full' | 'lw_broadcast' | 'vlf_maritime') => {
    setZoomLevel(level);
    if (level === 'full') {
      setMinFreq(10);
      setMaxFreq(530);
    } else if (level === 'lw_broadcast') {
      setMinFreq(140);
      setMaxFreq(290);
    } else if (level === 'vlf_maritime') {
      setMinFreq(10);
      setMaxFreq(100);
    }
  };

  // Convert X pixel to Frequency (kHz)
  const pixelToFreq = useCallback((x: number, width: number): number => {
    const ratio = Math.max(0, Math.min(1, x / width));
    return minFreq + ratio * (maxFreq - minFreq);
  }, [minFreq, maxFreq]);

  // Convert Frequency (kHz) to X pixel
  const freqToPixel = useCallback((freq: number, width: number): number => {
    const ratio = (freq - minFreq) / (maxFreq - minFreq);
    return ratio * width;
  }, [minFreq, maxFreq]);

  const [historyCount, setHistoryCount] = useState<number>(() => getFrequencyHistory().length);
  const [justSavedNotice, setJustSavedNotice] = useState<string | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  // Sync scan history count from local storage
  useEffect(() => {
    const handleHistoryUpdate = () => {
      setHistoryCount(getFrequencyHistory().length);
    };
    window.addEventListener(HISTORY_UPDATE_EVENT, handleHistoryUpdate);
    return () => window.removeEventListener(HISTORY_UPDATE_EVENT, handleHistoryUpdate);
  }, []);

  // Debounced auto-save when frequency stabilizes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      const entry = saveFrequencyScan(
        receiverState.frequency,
        receiverState.mode,
        receiverState.bandwidth,
        isDraggingRef.current ? 'waterfall_click' : 'dial_tuning'
      );
      if (entry) {
        setJustSavedNotice(`${entry.frequency.toFixed(1)} kHz`);
        setTimeout(() => setJustSavedNotice(null), 1800);
      }
    }, 850);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [receiverState.frequency, receiverState.mode, receiverState.bandwidth]);

  // Handle direct click/drag to tune
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newFreq = Math.round(pixelToFreq(x, rect.width) * 10) / 10;
    const clamped = Math.max(10, Math.min(525, newFreq));
    onFrequencyChange(clamped);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      const entry = saveFrequencyScan(
        receiverState.frequency,
        receiverState.mode,
        receiverState.bandwidth,
        'waterfall_click'
      );
      if (entry) {
        setJustSavedNotice(`${entry.frequency.toFixed(1)} kHz`);
        setTimeout(() => setJustSavedNotice(null), 1800);
      }
    }
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Render loop for Spectrum Line & Scrolling Waterfall
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const spectrumHeight = 56;
    const waterfallHeight = canvas.height - spectrumHeight;

    // Palette lookup function: intensity 0..1 to RGB string
    const getPaletteColor = (val: number): string => {
      const v = Math.max(0, Math.min(1, val));
      if (colorScheme === 'phosphor') {
        // Dark green to radioactive bright green
        const r = Math.floor(v * 40);
        const g = Math.floor(v * 255);
        const b = Math.floor(v * 50);
        return `rgb(${r}, ${g}, ${b})`;
      } else if (colorScheme === 'amber') {
        // Deep obsidian to glowing amber/gold
        const r = Math.floor(v * 255);
        const g = Math.floor(v * 165);
        const b = Math.floor(v * 20);
        return `rgb(${r}, ${g}, ${b})`;
      } else if (colorScheme === 'cyan') {
        // Deep blue to bright cyan
        const r = Math.floor(v * 30);
        const g = Math.floor(v * 210);
        const b = Math.floor(v * 255);
        return `rgb(${r}, ${g}, ${b})`;
      } else {
        // Monochrome silver
        const c = Math.floor(v * 240);
        return `rgb(${c}, ${c}, ${c})`;
      }
    };

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // 1. Scroll existing waterfall down by 1 pixel
      if (waterfallHeight > 0) {
        ctx.drawImage(
          canvas,
          0, spectrumHeight, width, waterfallHeight - 1,
          0, spectrumHeight + 1, width, waterfallHeight - 1
        );
      }

      // 2. Clear Spectrum Top Header
      ctx.fillStyle = '#080a0f';
      ctx.fillRect(0, 0, width, spectrumHeight);

      // Draw subtle grid lines
      ctx.strokeStyle = '#1a2233';
      ctx.lineWidth = 1;
      for (let y = 10; y < spectrumHeight; y += 12) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 3. Compute RF energy across frequency bins
      const numBins = Math.floor(width);
      const rowImageData = ctx.createImageData(numBins, 1);
      const rowData = rowImageData.data;

      // Top spectrum line points
      const spectrumPoints: [number, number][] = [];

      const isNight = receiverState.timeOfDay === 'night';
      const propagationFactor = isNight ? 1.4 : receiverState.timeOfDay === 'dusk' ? 1.15 : 0.9;

      for (let x = 0; x < numBins; x++) {
        const freqAtX = pixelToFreq(x, width);
        // Base atmospheric RF noise floor
        let rfPower = 0.08 + (Math.sin(x * 0.12) * 0.02) + (Math.random() * 0.06 * receiverState.qrnLevel);

        // Check station carriers
        for (const st of LONG_WAVE_STATIONS) {
          const delta = Math.abs(freqAtX - st.frequency);
          if (delta < 5.0) {
            // Resonance curve
            const peakHeight = Math.min(0.85, (Math.sqrt(st.powerKw || 10) / 45) * propagationFactor);
            const peak = peakHeight * Math.exp(-Math.pow(delta / 0.8, 2));
            rfPower += peak;
          }
        }

        // Clamp
        rfPower = Math.min(1.0, Math.max(0, rfPower));

        // Spectrum Y coordinate (inverted, 0 is top)
        const specY = spectrumHeight - 4 - rfPower * (spectrumHeight - 8);
        spectrumPoints.push([x, specY]);

        // Waterfall 1px row pixel data
        const colorStr = getPaletteColor(rfPower);
        const match = colorStr.match(/\d+/g);
        if (match) {
          const r = parseInt(match[0], 10);
          const g = parseInt(match[1], 10);
          const b = parseInt(match[2], 10);
          const idx = x * 4;
          rowData[idx] = r;
          rowData[idx + 1] = g;
          rowData[idx + 2] = b;
          rowData[idx + 3] = 255;
        }
      }

      // 4. Render 1px waterfall row right under spectrum header
      ctx.putImageData(rowImageData, 0, spectrumHeight);

      // 5. Draw top RF Spectrum curve
      if (spectrumPoints.length > 0) {
        ctx.beginPath();
        ctx.moveTo(spectrumPoints[0][0], spectrumPoints[0][1]);
        for (let i = 1; i < spectrumPoints.length; i++) {
          ctx.lineTo(spectrumPoints[i][0], spectrumPoints[i][1]);
        }
        ctx.strokeStyle = colorScheme === 'phosphor'
          ? '#22c55e'
          : colorScheme === 'amber'
          ? '#f59e0b'
          : colorScheme === 'cyan'
          ? '#06b6d4'
          : '#e5e5e5';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Fill subtle gradient below spectrum line
        ctx.lineTo(width, spectrumHeight);
        ctx.lineTo(0, spectrumHeight);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, 0, 0, spectrumHeight);
        grad.addColorStop(0, colorScheme === 'phosphor' ? 'rgba(34,197,94,0.25)' : colorScheme === 'amber' ? 'rgba(245,158,11,0.25)' : 'rgba(6,182,212,0.25)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // 6. Draw station markers on spectrum
      for (const st of LONG_WAVE_STATIONS) {
        if (st.frequency >= minFreq && st.frequency <= maxFreq) {
          const x = freqToPixel(st.frequency, width);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.moveTo(x, 18);
          ctx.lineTo(x, height);
          ctx.stroke();
          ctx.setLineDash([]);

          // Station callsign badge
          ctx.fillStyle = '#94a3b8';
          ctx.font = '9px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(st.callsign, x, 14);
        }
      }

      // 7. Draw Receiver Cursor & Filter Bandwidth Window
      const curX = freqToPixel(receiverState.frequency, width);
      const halfBw = receiverState.bandwidth / 2;
      const leftBwX = freqToPixel(receiverState.frequency - halfBw, width);
      const rightBwX = freqToPixel(receiverState.frequency + halfBw, width);
      const bwWidth = Math.max(3, rightBwX - leftBwX);

      // Shaded passband filter zone
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.fillRect(leftBwX, 0, bwWidth, height);

      // Center hairline cursor
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(curX, 0);
      ctx.lineTo(curX, height);
      ctx.stroke();

      // Filter bracket markers
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(leftBwX, 2, bwWidth, spectrumHeight - 4);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [minFreq, maxFreq, receiverState, colorScheme, pixelToFreq, freqToPixel]);

  // Generate Frequency Ruler Tick Marks
  const rulerTicks = [];
  const step = zoomLevel === 'lw_broadcast' ? 10 : zoomLevel === 'vlf_maritime' ? 5 : 50;
  for (let f = Math.ceil(minFreq / step) * step; f <= maxFreq; f += step) {
    const pct = ((f - minFreq) / (maxFreq - minFreq)) * 100;
    rulerTicks.push({ freq: f, pct });
  }

  return (
    <div className="flex flex-col w-full bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden shadow-2xl">
      {/* Top Waterfall Header & Controls */}
      <div className="flex items-center justify-between px-3 py-2 bg-neutral-900/90 border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-mono text-neutral-300 font-semibold tracking-wider">
            RF SPECTRUM & WATERFALL
          </span>
          <span className="text-[11px] font-mono text-neutral-500">
            {minFreq} kHz – {maxFreq} kHz
          </span>
        </div>

        <div className="flex items-center gap-2">
          {justSavedNotice && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 rounded animate-fade-in">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>LOGGED {justSavedNotice}</span>
            </span>
          )}

          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono rounded bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors"
              title="Open Frequency History Tab"
            >
              <History className="w-3 h-3 text-amber-400" />
              <span>Scan History ({historyCount})</span>
            </button>
          )}

          {/* Zoom Band Selectors */}
          <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded border border-neutral-800">
            <button
              type="button"
              onClick={() => handleZoomChange('full')}
              className={`px-2.5 py-1 text-[10px] font-mono rounded transition-colors ${
                zoomLevel === 'full'
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Full Spectrum (10-530k)
            </button>
            <button
              type="button"
              onClick={() => handleZoomChange('lw_broadcast')}
              className={`px-2.5 py-1 text-[10px] font-mono rounded transition-colors ${
                zoomLevel === 'lw_broadcast'
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              LW Broadcast (140-290k)
            </button>
            <button
              type="button"
              onClick={() => handleZoomChange('vlf_maritime')}
              className={`px-2.5 py-1 text-[10px] font-mono rounded transition-colors ${
                zoomLevel === 'vlf_maritime'
                  ? 'bg-neutral-800 text-white font-medium'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              VLF Submarine & Time (10-100k)
            </button>
          </div>
        </div>
      </div>

      {/* Frequency Ruler with Ticks */}
      <div className="relative w-full h-6 bg-neutral-900 border-b border-neutral-800 select-none overflow-hidden text-[10px] font-mono text-neutral-400">
        {rulerTicks.map((t) => (
          <div
            key={t.freq}
            className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${t.pct}%` }}
          >
            <span className="text-[9px] tabular-nums text-neutral-400">{t.freq}</span>
            <div className="w-[1px] h-2 bg-neutral-700 mt-0.5" />
          </div>
        ))}
        {/* Active frequency hairline flag */}
        <div
          className="absolute top-0 bottom-0 transform -translate-x-1/2 w-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
          style={{
            left: `${Math.max(0, Math.min(100, ((receiverState.frequency - minFreq) / (maxFreq - minFreq)) * 100))}%`
          }}
        />
      </div>

      {/* Interactive Waterfall Canvas Stage */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-full h-64 cursor-crosshair touch-none select-none overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          width={900}
          height={256}
          className="w-full h-full block"
        />

        {/* Live Tuning Readout Overlay */}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-neutral-950/80 backdrop-blur rounded border border-neutral-800 text-[11px] font-mono text-neutral-300 pointer-events-none flex items-center gap-2">
          <span className="text-rose-400 font-semibold">{receiverState.frequency.toFixed(2)} kHz</span>
          <span className="text-neutral-500">|</span>
          <span>BW: {receiverState.bandwidth} kHz</span>
          <span className="text-neutral-500">|</span>
          <span>{receiverState.mode}</span>
        </div>
      </div>
    </div>
  );
};
