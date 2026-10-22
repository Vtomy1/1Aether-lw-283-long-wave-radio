import React, { useState, useEffect } from 'react';
import { FrequencyHistoryEntry, DemodulationMode, FilterBandwidth } from '../types/radio';
import {
  getFrequencyHistory,
  clearFrequencyHistory,
  HISTORY_UPDATE_EVENT
} from '../utils/historyStorage';
import {
  History,
  Trash2,
  Download,
  Radio,
  Search,
  Filter,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react';

interface ScanHistoryProps {
  currentFrequency: number;
  onTuneFrequency: (freq: number, mode?: DemodulationMode, bw?: FilterBandwidth) => void;
  onLogStation?: (freq: number, stationName?: string) => void;
}

export const ScanHistory: React.FC<ScanHistoryProps> = ({
  currentFrequency,
  onTuneFrequency,
  onLogStation
}) => {
  const [history, setHistory] = useState<FrequencyHistoryEntry[]>(() => getFrequencyHistory());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Real-time synchronization with localStorage updates
  useEffect(() => {
    const handleUpdate = () => {
      setHistory(getFrequencyHistory());
    };

    window.addEventListener(HISTORY_UPDATE_EVENT, handleUpdate);
    return () => window.removeEventListener(HISTORY_UPDATE_EVENT, handleUpdate);
  }, []);

  const handleClear = () => {
    clearFrequencyHistory();
    setHistory([]);
    setShowClearConfirm(false);
  };

  const handleExportCsv = () => {
    if (history.length === 0) return;
    const header = 'Timestamp,Frequency (kHz),Station Callsign,Station Name,Mode,Bandwidth (kHz),Source\n';
    const rows = history
      .map(
        (h) =>
          `"${h.timestamp}",${h.frequency},"${h.callsign || ''}","${h.stationName || 'Utility / Unknown'}","${h.mode}",${h.bandwidth},"${h.source}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waterfall_frequency_scan_history_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered entries
  const filtered = history.filter((item) => {
    const matchesSearch =
      item.frequency.toString().includes(searchQuery) ||
      (item.stationName && item.stationName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.callsign && item.callsign.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSource = filterSource === 'all' || item.source === filterSource;
    return matchesSearch && matchesSource;
  });

  // Calculate statistics
  const totalScans = history.length;
  const uniqueFreqs = new Set(history.map((h) => h.frequency)).size;
  const identifiedStations = history.filter((h) => h.stationName).length;
  const minFreq = history.length > 0 ? Math.min(...history.map((h) => h.frequency)) : 0;
  const maxFreq = history.length > 0 ? Math.max(...history.map((h) => h.frequency)) : 0;

  return (
    <div className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-lg p-4 shadow-xl">
      {/* Header and Action Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold font-mono text-neutral-200">
              FREQUENCY SCANNING HISTORY (LOCAL STORAGE)
            </h2>
          </div>
          <span className="text-xs text-neutral-400">
            Persistent log of frequencies visited via waterfall clicks, rotary dials, and receiver steps
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={history.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>

          {showClearConfirm ? (
            <div className="flex items-center gap-1 bg-red-950/80 border border-red-800 p-1 rounded">
              <span className="text-[11px] font-mono text-red-200 px-1">Clear all?</span>
              <button
                type="button"
                onClick={handleClear}
                className="px-2 py-0.5 text-xs font-mono font-bold bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-2 py-0.5 text-xs font-mono bg-neutral-800 text-neutral-300 hover:bg-neutral-700 rounded transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              disabled={history.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded bg-neutral-800 hover:bg-red-950/60 text-neutral-400 hover:text-red-300 border border-neutral-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear History
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-b border-neutral-800/80 text-xs font-mono">
        <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800 flex flex-col">
          <span className="text-[10px] text-neutral-400">TOTAL SCANS</span>
          <span className="text-xl font-bold text-neutral-200 tabular-nums mt-0.5">
            {totalScans}
          </span>
        </div>

        <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800 flex flex-col">
          <span className="text-[10px] text-neutral-400">UNIQUE CARRIERS</span>
          <span className="text-xl font-bold text-amber-400 tabular-nums mt-0.5">
            {uniqueFreqs}
          </span>
        </div>

        <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800 flex flex-col">
          <span className="text-[10px] text-neutral-400">IDENTIFIED STATIONS</span>
          <span className="text-xl font-bold text-emerald-400 tabular-nums mt-0.5">
            {identifiedStations}
          </span>
        </div>

        <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800 flex flex-col">
          <span className="text-[10px] text-neutral-400">SPECTRUM COVERED</span>
          <span className="text-sm font-bold text-cyan-400 tabular-nums mt-1 truncate">
            {history.length > 0 ? `${minFreq.toFixed(1)}k – ${maxFreq.toFixed(1)}k` : '--'}
          </span>
        </div>
      </div>

      {/* Search & Source Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 border-b border-neutral-800/80 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search frequency or station name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-neutral-950 border border-neutral-800 rounded text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-[10px] font-mono text-neutral-400 mr-1">SOURCE:</span>
          {[
            { id: 'all', label: 'All' },
            { id: 'waterfall_click', label: 'Waterfall' },
            { id: 'dial_tuning', label: 'Dial' },
            { id: 'preset', label: 'Preset' }
          ].map((src) => (
            <button
              key={src.id}
              type="button"
              onClick={() => setFilterSource(src.id)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
                filterSource === src.id
                  ? 'bg-neutral-800 text-white font-medium border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {src.label}
            </button>
          ))}
        </div>
      </div>

      {/* Frequency History Table */}
      <div className="flex flex-col mt-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-neutral-950 rounded border border-neutral-800 text-neutral-500">
            <Radio className="w-8 h-8 text-neutral-600 mb-2" />
            <p className="text-xs font-mono text-neutral-400">
              {history.length === 0
                ? 'No signal scanning history recorded yet.'
                : 'No entries match the current filter criteria.'}
            </p>
            <p className="text-[11px] text-neutral-600 mt-1 max-w-sm">
              Click and drag anywhere on the Waterfall Display or turn the frequency flywheel to begin logging scanning activity.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
            {filtered.map((item) => {
              const isCurrentlyTuned = Math.abs(currentFrequency - item.frequency) < 0.1;

              return (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border transition-all gap-2 ${
                    isCurrentlyTuned
                      ? 'bg-neutral-800/90 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-mono font-bold text-neutral-100 tabular-nums">
                          {item.frequency.toFixed(2)} kHz
                        </span>
                        {item.callsign && (
                          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-amber-300">
                            {item.callsign}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-neutral-400 px-1 rounded bg-neutral-900 border border-neutral-800">
                          {item.mode}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                        <span>{item.stationName || 'Unregistered Carrier / Utility'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-[10px] text-neutral-400">
                          BW: {item.bandwidth} kHz
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-[10px] text-neutral-400">
                          via {item.source.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions and Timestamp */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    <span className="text-[10px] font-mono text-neutral-400 hidden md:inline">
                      {item.timestamp}
                    </span>

                    {onLogStation && (
                      <button
                        type="button"
                        onClick={() => onLogStation(item.frequency, item.stationName)}
                        className="px-2 py-1 text-[11px] font-mono rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 hover:border-neutral-700 transition-colors"
                        title="Copy to DX Logbook"
                      >
                        Log DX
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onTuneFrequency(item.frequency, item.mode, item.bandwidth)}
                      className={`px-3 py-1.5 text-xs font-mono font-semibold rounded flex items-center gap-1 transition-colors ${
                        isCurrentlyTuned
                          ? 'bg-amber-600 text-neutral-950 font-bold'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                      }`}
                    >
                      {isCurrentlyTuned ? '● TUNED' : 'TUNE IN'}
                      {!isCurrentlyTuned && <ArrowUpRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
