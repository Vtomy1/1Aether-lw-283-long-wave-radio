import React, { useState, useEffect } from 'react';
import { LogEntry, RadioStation, SignalMeasurement, DemodulationMode } from '../types/radio';
import { BookOpen, Plus, Download, Trash2, CheckCircle2 } from 'lucide-react';

interface DxLogbookProps {
  currentFrequency: number;
  currentMode: DemodulationMode;
  measurement: SignalMeasurement;
}

const INITIAL_LOGS: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: '2026-10-21 17:45 UTC',
    frequency: 198.0,
    stationName: 'BBC Radio 4',
    callsign: 'BBC R4',
    mode: 'AM',
    sinpo: '55445',
    notes: 'Shipping forecast received loud and clear from Droitwich. Gale warning for Viking and North Utsire.'
  },
  {
    id: 'log-2',
    timestamp: '2026-10-21 16:30 UTC',
    frequency: 77.5,
    stationName: 'DCF77 Atomic Clock',
    callsign: 'DCF77',
    mode: 'CW',
    sinpo: '55555',
    notes: 'Mainflingen time pips 1-sec cadence locked. 59th second drop observed.'
  },
  {
    id: 'log-3',
    timestamp: '2026-10-21 15:10 UTC',
    frequency: 17.2,
    stationName: 'Grimeton VLF Alternator',
    callsign: 'SAQ',
    mode: 'CW',
    sinpo: '44334',
    notes: 'Alexanderson mechanical alternator CW CQ call captured. Pitch 800 Hz clear above noise.'
  }
];

export const DxLogbook: React.FC<DxLogbookProps> = ({
  currentFrequency,
  currentMode,
  measurement
}) => {
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('aether_lw_logbook');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_LOGS;
  });

  const [sinpoVal, setSinpoVal] = useState('55445');
  const [logNotes, setLogNotes] = useState('');
  const [showAddSuccess, setShowAddSuccess] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('aether_lw_logbook', JSON.stringify(logs));
    } catch {
      // ignore
    }
  }, [logs]);

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    const station = measurement.activeStation;
    const newEntry: LogEntry = {
      id: `dx_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
      frequency: currentFrequency,
      stationName: station ? station.name : 'Unknown Signal / Utility',
      callsign: station ? station.callsign : 'UNID',
      mode: currentMode,
      sinpo: sinpoVal,
      notes: logNotes || (station ? `${station.name} carrier logged.` : 'Carrier intercepted.')
    };

    setLogs((prev) => [newEntry, ...prev]);
    setLogNotes('');
    setShowAddSuccess(true);
    setTimeout(() => setShowAddSuccess(false), 2000);
  };

  const handleDelete = (id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const handleExportCsv = () => {
    const csvHeader = 'Timestamp,Frequency (kHz),Callsign,Station Name,Mode,SINPO,Notes\n';
    const csvRows = logs
      .map((l) => `"${l.timestamp}",${l.frequency},"${l.callsign}","${l.stationName}","${l.mode}","${l.sinpo}","${l.notes.replace(/"/g, '""')}"`)
      .join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dx_logbook_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-lg p-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div>
          <h2 className="text-sm font-semibold font-mono text-neutral-200">
            OPERATOR DX LOGBOOK & SINPO REPORTS
          </h2>
          <span className="text-xs text-neutral-400">
            Log intercepted transmissions, signal merits, and radio propagation reports
          </span>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV Log
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4">
        {/* Quick Log Entry Form */}
        <form onSubmit={handleAddLog} className="flex flex-col gap-2.5 p-3 bg-neutral-950 rounded border border-neutral-800">
          <span className="text-xs font-mono font-semibold text-neutral-300">
            LOG ACTIVE FREQUENCY
          </span>

          <div className="flex items-center justify-between text-xs font-mono bg-neutral-900 p-2 rounded border border-neutral-800">
            <span className="text-neutral-400">CURRENT TUNER:</span>
            <span className="font-bold text-amber-400 tabular-nums">
              {currentFrequency.toFixed(2)} kHz ({currentMode})
            </span>
          </div>

          <div className="text-xs font-mono text-neutral-400">
            <span>DETECTED: </span>
            <span className="text-neutral-200 font-semibold">
              {measurement.activeStation ? measurement.activeStation.name : 'Unknown / Carrier'}
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">
              SINPO RATING (Signal / Interf / Noise / Prop / Overall)
            </label>
            <select
              value={sinpoVal}
              onChange={(e) => setSinpoVal(e.target.value)}
              className="w-full px-2 py-1.5 text-xs font-mono bg-neutral-900 border border-neutral-800 rounded text-neutral-200 focus:outline-none"
            >
              <option value="55555">55555 (Perfect reception)</option>
              <option value="55445">55445 (Excellent / slight noise)</option>
              <option value="44334">44334 (Good commercial quality)</option>
              <option value="33223">33223 (Fair / readable with difficulty)</option>
              <option value="22112">22112 (Poor / barely audible)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">
              OPERATOR LOG NOTES
            </label>
            <textarea
              rows={2}
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              placeholder="e.g. Shipping forecast gale warnings, time ticks locked, zero-beat..."
              className="w-full p-2 text-xs font-mono bg-neutral-900 border border-neutral-800 rounded text-neutral-200 placeholder:text-neutral-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 text-xs font-mono font-semibold rounded bg-amber-600 hover:bg-amber-500 text-neutral-950 transition-colors flex items-center justify-center gap-1.5"
          >
            {showAddSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-neutral-950" /> LOGGED SUCCESSFULLY
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> COMMIT LOG ENTRY
              </>
            )}
          </button>
        </form>

        {/* Historical Logs List */}
        <div className="lg:col-span-2 flex flex-col bg-neutral-950 rounded border border-neutral-800 p-3">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-xs font-mono text-neutral-400">
            <span>CONFIRMED RECEPTIONS ({logs.length})</span>
            <span>FORMAT: ITU SINPO</span>
          </div>

          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between p-2.5 rounded bg-neutral-900/80 border border-neutral-800 text-xs font-mono"
              >
                <div className="flex flex-col gap-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-400 tabular-nums">
                      {log.frequency.toFixed(1)} kHz
                    </span>
                    <span className="text-neutral-200 font-semibold">{log.stationName}</span>
                    <span className="text-[10px] text-neutral-400">({log.callsign})</span>
                    <span className="text-[10px] bg-neutral-950 border border-neutral-800 px-1 rounded text-neutral-300">
                      {log.mode}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">{log.sinpo}</span>
                  </div>

                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    {log.notes}
                  </p>

                  <span className="text-[10px] text-neutral-400">{log.timestamp}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(log.id)}
                  className="p-1 rounded bg-neutral-800 hover:bg-red-950 text-neutral-500 hover:text-red-400 transition-colors"
                  title="Delete log"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
