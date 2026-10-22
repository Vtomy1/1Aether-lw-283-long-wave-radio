import React, { useState, useEffect, useCallback, useRef } from 'react';
import { radioEngine } from './audio/radioEngine';
import { ReceiverState, SignalMeasurement, DemodulationMode, FilterBandwidth } from './types/radio';
import { SMeter } from './components/SMeter';
import { CRTDisplay } from './components/CRTDisplay';
import { TuningDial } from './components/TuningDial';
import { WaterfallDisplay } from './components/WaterfallDisplay';
import { StationRegistry } from './components/StationRegistry';
import { NavtexTerminal } from './components/NavtexTerminal';
import { MorseDecoder } from './components/MorseDecoder';
import { IonosphereSimulator } from './components/IonosphereSimulator';
import { TapeRecorder } from './components/TapeRecorder';
import { DxLogbook } from './components/DxLogbook';
import { ScanHistory } from './components/ScanHistory';
import {
  Power,
  Volume2,
  VolumeX,
  Radio,
  Sliders,
  Sparkles,
  Info,
  Waves,
  ShieldAlert,
  Compass,
  FileText
} from 'lucide-react';

export default function App() {
  // Receiver Master State
  const [receiverState, setReceiverState] = useState<ReceiverState>({
    power: false,
    frequency: 198.0, // Default to BBC Radio 4 Long Wave
    mode: 'AM',
    bandwidth: 9.0,
    volume: 0.75,
    rfGain: 0.85,
    squelch: 0.05,
    bfoPitch: 700,
    noiseBlanker: false,
    qrnLevel: 0.4,
    timeOfDay: 'dusk',
    displayColor: 'amber',
    bfoEnabled: false,
    notchFilter: false,
    notchFreq: 1000
  });

  // Live signal measurement updated from audio engine
  const [measurement, setMeasurement] = useState<SignalMeasurement>({
    carrierStrength: 0,
    sUnits: 0,
    snrDb: 0,
    isLocked: false,
    activeStation: null,
    tuningOffsetHz: 0
  });

  // Active Workspace Sub-Tab
  const [activeTab, setActiveTab] = useState<
    'stations' | 'navtex' | 'morse' | 'ionosphere' | 'recorder' | 'logbook' | 'history'
  >('stations');

  // Polling loop to fetch RF measurements and update audio engine
  useEffect(() => {
    const interval = setInterval(() => {
      const m = radioEngine.getMeasurement();
      setMeasurement(m);
    }, 60);

    return () => clearInterval(interval);
  }, []);

  // Update engine whenever receiverState changes
  useEffect(() => {
    radioEngine.updateState(receiverState);
  }, [receiverState]);

  // Handle Master Power Toggle
  const handleTogglePower = async () => {
    const nextPower = !receiverState.power;
    if (nextPower) {
      await radioEngine.init();
    }
    setReceiverState((prev) => ({ ...prev, power: nextPower }));
  };

  // Quick frequency set from anywhere
  const handleFrequencyChange = useCallback((newFreq: number) => {
    setReceiverState((prev) => ({ ...prev, frequency: newFreq }));
  }, []);

  // Station preset tune
  const handleTuneStation = (freq: number, mode: DemodulationMode, bw: FilterBandwidth) => {
    setReceiverState((prev) => ({
      ...prev,
      frequency: freq,
      mode,
      bandwidth: bw,
      bfoEnabled: mode === 'CW' || mode === 'USB' || mode === 'LSB'
    }));
  };

  // Keyboard shortcut tuning (Left / Right arrow keys for fine step, Shift+Arrow for 1 kHz)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === 'ArrowLeft') {
        const step = e.shiftKey ? 1.0 : 0.1;
        setReceiverState((prev) => ({
          ...prev,
          frequency: Math.max(10, Math.min(530, Math.round((prev.frequency - step) * 100) / 100))
        }));
      } else if (e.key === 'ArrowRight') {
        const step = e.shiftKey ? 1.0 : 0.1;
        setReceiverState((prev) => ({
          ...prev,
          frequency: Math.max(10, Math.min(530, Math.round((prev.frequency + step) * 100) / 100))
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#07090e] text-neutral-100 flex flex-col font-sans">
      {/* 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-neutral-950/90 border-b border-neutral-800/80 sticky top-0 z-50 backdrop-blur">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <Radio className="w-5 h-5 text-amber-500" />
          <span className="text-base font-bold font-mono tracking-tight text-neutral-100 whitespace-nowrap">
            AETHER LW-283
          </span>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-neutral-400">
          <a href="#receiver" className="hover:text-neutral-200 transition-colors whitespace-nowrap shrink-0">
            Receiver Console
          </a>
          <a href="#waterfall" className="hover:text-neutral-200 transition-colors whitespace-nowrap shrink-0">
            RF Spectrogram
          </a>
          <a href="#modules" onClick={() => setActiveTab('stations')} className="hover:text-neutral-200 transition-colors whitespace-nowrap shrink-0">
            Station Catalog
          </a>
          <a href="#modules" onClick={() => setActiveTab('navtex')} className="hover:text-neutral-200 transition-colors whitespace-nowrap shrink-0">
            Maritime NAVTEX
          </a>
          <a href="#modules" onClick={() => setActiveTab('history')} className="hover:text-neutral-200 transition-colors whitespace-nowrap shrink-0">
            Scan History
          </a>
        </nav>

        {/* Zone 3: 1 Primary Action (Master Power Button) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleTogglePower}
            className={`px-4 py-2 text-xs font-mono font-semibold rounded-md transition-all flex items-center gap-2 whitespace-nowrap shrink-0 shadow-lg ${
              receiverState.power
                ? 'bg-amber-500 text-neutral-950 hover:bg-amber-400 shadow-amber-500/20'
                : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 border border-neutral-700'
            }`}
          >
            <Power className="w-4 h-4" />
            {receiverState.power ? 'RECEIVER ONLINE' : 'POWER ON (START AUDIO)'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-5">
        {/* Hero Alert when receiver is powered off */}
        {!receiverState.power && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs font-mono text-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Receiver filament is cold. Click &apos;POWER ON&apos; in the top bar to initialize Web Audio synthesis, atmospheric noise, and heterodyne tuning whistle.
              </span>
            </div>
            <button
              type="button"
              onClick={handleTogglePower}
              className="px-3 py-1 bg-amber-500 text-neutral-950 font-bold rounded hover:bg-amber-400 text-xs shrink-0"
            >
              POWER ON
            </button>
          </div>
        )}

        {/* Primary Tuner Console Section */}
        <section id="receiver" className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Column: S-Meter & CRT Oscilloscope (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <SMeter
              measurement={measurement}
              isPowered={receiverState.power}
              colorScheme={receiverState.displayColor}
            />

            <CRTDisplay
              isPowered={receiverState.power}
              colorScheme={receiverState.displayColor}
            />
          </div>

          {/* Right Column: Master Tuning Knob, Drum Scale, and Demodulation Controls (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <TuningDial
              frequency={receiverState.frequency}
              onChange={handleFrequencyChange}
              isPowered={receiverState.power}
              colorScheme={receiverState.displayColor}
            />

            {/* Receiver Control Panel (Bakelite / Brushed Aluminum style) */}
            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="text-xs font-mono font-semibold text-neutral-300">
                  IF DEMODULATION & GAIN STAGES
                </span>
                <span className="text-[10px] font-mono text-neutral-500">
                  HETERODYNE MIXER · ACTIVE
                </span>
              </div>

              {/* Mode Selector */}
              <div>
                <span className="block text-[10px] font-mono text-neutral-400 mb-1.5">
                  DEMODULATION MODE
                </span>
                <div className="grid grid-cols-5 gap-1.5 p-1 bg-neutral-950 rounded border border-neutral-800">
                  {(['AM', 'USB', 'LSB', 'CW', 'DATA'] as DemodulationMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() =>
                        setReceiverState((prev) => ({
                          ...prev,
                          mode: m,
                          bfoEnabled: m === 'CW' || m === 'USB' || m === 'LSB'
                        }))
                      }
                      className={`py-1.5 text-xs font-mono font-semibold rounded transition-colors ${
                        receiverState.mode === m
                          ? 'bg-amber-600 text-neutral-950 shadow-sm'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Bandwidth Selector */}
              <div>
                <span className="block text-[10px] font-mono text-neutral-400 mb-1.5">
                  IF BANDWIDTH FILTER
                </span>
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-neutral-950 rounded border border-neutral-800">
                  {([
                    { bw: 0.5, label: '0.5k (CW)' },
                    { bw: 2.4, label: '2.4k (SSB)' },
                    { bw: 6.0, label: '6.0k (Med)' },
                    { bw: 9.0, label: '9.0k (Wide)' }
                  ] as { bw: FilterBandwidth; label: string }[]).map((f) => (
                    <button
                      key={f.bw}
                      type="button"
                      onClick={() => setReceiverState((prev) => ({ ...prev, bandwidth: f.bw }))}
                      className={`py-1.5 text-xs font-mono font-semibold rounded transition-colors ${
                        receiverState.bandwidth === f.bw
                          ? 'bg-neutral-200 text-neutral-900 shadow-sm'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders Grid: Volume, RF Gain, Squelch, BFO Pitch */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                {/* Master Volume */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                    <span>AF GAIN</span>
                    <span className="text-neutral-200 font-semibold">{Math.round(receiverState.volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={receiverState.volume}
                    onChange={(e) => setReceiverState((prev) => ({ ...prev, volume: parseFloat(e.target.value) }))}
                    className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded cursor-pointer"
                  />
                </div>

                {/* RF Gain */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                    <span>RF GAIN</span>
                    <span className="text-neutral-200 font-semibold">{Math.round(receiverState.rfGain * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={receiverState.rfGain}
                    onChange={(e) => setReceiverState((prev) => ({ ...prev, rfGain: parseFloat(e.target.value) }))}
                    className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded cursor-pointer"
                  />
                </div>

                {/* Squelch */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                    <span>SQL THRESH</span>
                    <span className="text-neutral-200 font-semibold">{Math.round(receiverState.squelch * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.02"
                    value={receiverState.squelch}
                    onChange={(e) => setReceiverState((prev) => ({ ...prev, squelch: parseFloat(e.target.value) }))}
                    className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded cursor-pointer"
                  />
                </div>

                {/* BFO Pitch */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                    <span>BFO PITCH</span>
                    <span className="text-neutral-200 font-semibold">{receiverState.bfoPitch} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="400"
                    max="1200"
                    step="20"
                    value={receiverState.bfoPitch}
                    onChange={(e) => setReceiverState((prev) => ({ ...prev, bfoPitch: parseInt(e.target.value, 10) }))}
                    className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Toggles Strip: BFO, Notch Filter, Display Theme */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReceiverState((prev) => ({ ...prev, bfoEnabled: !prev.bfoEnabled }))}
                    className={`px-2.5 py-1 rounded text-xs transition-colors border ${
                      receiverState.bfoEnabled
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    BFO: {receiverState.bfoEnabled ? 'ON' : 'OFF'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setReceiverState((prev) => ({ ...prev, notchFilter: !prev.notchFilter }))}
                    className={`px-2.5 py-1 rounded text-xs transition-colors border ${
                      receiverState.notchFilter
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    NOTCH: {receiverState.notchFilter ? 'ACTIVE' : 'BYPASS'}
                  </button>
                </div>

                {/* Color Scheme Picker */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-neutral-400 mr-1">THEME:</span>
                  {(['amber', 'phosphor', 'cyan', 'monochrome'] as const).map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setReceiverState((prev) => ({ ...prev, displayColor: col }))}
                      className={`px-2 py-0.5 text-[10px] uppercase rounded border transition-colors ${
                        receiverState.displayColor === col
                          ? 'bg-neutral-800 border-neutral-600 text-neutral-100 font-semibold'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Full-Width Interactive Waterfall Section */}
        <section id="waterfall" className="w-full">
          <WaterfallDisplay
            receiverState={receiverState}
            onFrequencyChange={handleFrequencyChange}
            colorScheme={receiverState.displayColor}
            onOpenHistory={() => setActiveTab('history')}
          />
        </section>

        {/* Workspace Feature Modules Navigation */}
        <section id="modules" className="flex flex-col gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-lg border border-neutral-800 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('stations')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'stations'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Station Catalog & Lore
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'history'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Frequency History
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('navtex')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'navtex'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              NAVTEX Maritime Teleprinter
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('morse')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'morse'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              CW Morse Keyer & Decoder
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ionosphere')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'ionosphere'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Ionospheric D-Layer Physics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('recorder')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'recorder'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Tape Audio Recorder
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logbook')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === 'logbook'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Operator DX Logbook
            </button>
          </div>

          {/* Active Workspace View */}
          <div className="w-full">
            {activeTab === 'stations' && (
              <StationRegistry
                currentFrequency={receiverState.frequency}
                onTuneStation={handleTuneStation}
                isPowered={receiverState.power}
              />
            )}
            {activeTab === 'history' && (
              <ScanHistory
                currentFrequency={receiverState.frequency}
                onTuneFrequency={(freq, mode, bw) => {
                  setReceiverState((prev) => ({
                    ...prev,
                    frequency: freq,
                    mode: mode || prev.mode,
                    bandwidth: bw || prev.bandwidth
                  }));
                }}
                onLogStation={() => {
                  setActiveTab('logbook');
                }}
              />
            )}
            {activeTab === 'navtex' && (
              <NavtexTerminal
                currentFrequency={receiverState.frequency}
                isPowered={receiverState.power}
                carrierStrength={measurement.carrierStrength}
              />
            )}
            {activeTab === 'morse' && (
              <MorseDecoder
                currentFrequency={receiverState.frequency}
                isPowered={receiverState.power}
                carrierStrength={measurement.carrierStrength}
                mode={receiverState.mode}
              />
            )}
            {activeTab === 'ionosphere' && (
              <IonosphereSimulator
                timeOfDay={receiverState.timeOfDay}
                onChangeTime={(t) => setReceiverState((prev) => ({ ...prev, timeOfDay: t }))}
                qrnLevel={receiverState.qrnLevel}
                onChangeQrn={(q) => setReceiverState((prev) => ({ ...prev, qrnLevel: q }))}
                frequency={receiverState.frequency}
              />
            )}
            {activeTab === 'recorder' && (
              <TapeRecorder
                currentFrequency={receiverState.frequency}
                isPowered={receiverState.power}
              />
            )}
            {activeTab === 'logbook' && (
              <DxLogbook
                currentFrequency={receiverState.frequency}
                currentMode={receiverState.mode}
                measurement={measurement}
              />
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-neutral-800/80 bg-neutral-950 py-5 text-center text-xs font-mono text-neutral-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>AETHER LW-283 · LONG WAVE SDR LABORATORY WORKSTATION</span>
          <div className="flex items-center gap-4 text-[11px] text-neutral-400">
            <span>BAND: 10 kHz – 530 kHz (VLF / LF)</span>
            <span aria-hidden="true">·</span>
            <span>ITU REGION 1 & 2 ALLOCATIONS</span>
            <span aria-hidden="true">·</span>
            <span>60 FPS WEB AUDIO DSP</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
