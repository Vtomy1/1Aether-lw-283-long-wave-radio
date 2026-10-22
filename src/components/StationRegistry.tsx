import React, { useState } from 'react';
import { LONG_WAVE_STATIONS } from '../data/stations';
import { RadioStation, StationCategory, DemodulationMode, FilterBandwidth } from '../types/radio';
import { Radio, Volume2, Globe, Clock, Shield, Anchor, Zap, HelpCircle } from 'lucide-react';
import { radioEngine } from '../audio/radioEngine';

interface StationRegistryProps {
  currentFrequency: number;
  onTuneStation: (freq: number, mode: DemodulationMode, bw: FilterBandwidth) => void;
  isPowered: boolean;
}

export const StationRegistry: React.FC<StationRegistryProps> = ({
  currentFrequency,
  onTuneStation,
  isPowered
}) => {
  const [selectedCategory, setSelectedCategory] = useState<StationCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSpeechSnippet, setActiveSpeechSnippet] = useState<string | null>(null);

  // Filter stations
  const filteredStations = LONG_WAVE_STATIONS.filter((st) => {
    const matchesCat = selectedCategory === 'all' || st.category === selectedCategory;
    const matchesSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.callsign.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.country.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getCategoryIcon = (cat: StationCategory) => {
    switch (cat) {
      case 'broadcast':
        return <Radio className="w-3.5 h-3.5 text-amber-400" />;
      case 'time_signal':
        return <Clock className="w-3.5 h-3.5 text-emerald-400" />;
      case 'maritime_navtex':
        return <Anchor className="w-3.5 h-3.5 text-cyan-400" />;
      case 'submarine_vlf':
        return <Shield className="w-3.5 h-3.5 text-blue-400" />;
      case 'numbers_station':
        return <HelpCircle className="w-3.5 h-3.5 text-rose-400" />;
      case 'natural_vlf':
        return <Zap className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const handleBroadcastVoice = (st: RadioStation) => {
    if (!st.audioProfile.speechScript || st.audioProfile.speechScript.length === 0) return;
    const scriptItem = st.audioProfile.speechScript[Math.floor(Math.random() * st.audioProfile.speechScript.length)];
    setActiveSpeechSnippet(scriptItem);
    radioEngine.triggerVoiceBroadcast(scriptItem);
  };

  return (
    <div className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-lg p-4 shadow-xl">
      {/* Header and Category Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <h2 className="text-sm font-semibold font-mono text-neutral-200">
            LONG WAVE STATION REGISTRY & LOG
          </h2>
          <p className="text-xs text-neutral-400">
            Verified transatlantic and European LF/VLF transmitters (10 kHz – 520 kHz)
          </p>
        </div>

        {/* Search input */}
        <input
          type="text"
          placeholder="Filter callsign, country, location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-1 text-xs bg-neutral-950 border border-neutral-800 rounded text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 w-full md:w-56"
        />
      </div>

      {/* Category Filter Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 py-2.5 border-b border-neutral-800/80 text-xs">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-2.5 py-1 rounded text-xs transition-colors ${
            selectedCategory === 'all'
              ? 'bg-neutral-800 text-white font-medium border border-neutral-700'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          All ({LONG_WAVE_STATIONS.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory('broadcast')}
          className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-colors ${
            selectedCategory === 'broadcast'
              ? 'bg-neutral-800 text-white font-medium border border-neutral-700'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Radio className="w-3 h-3 text-amber-400" /> AM Broadcast
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory('time_signal')}
          className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-colors ${
            selectedCategory === 'time_signal'
              ? 'bg-neutral-800 text-white font-medium border border-neutral-700'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Clock className="w-3 h-3 text-emerald-400" /> Atomic Time (DCF/MSF)
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory('submarine_vlf')}
          className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-colors ${
            selectedCategory === 'submarine_vlf'
              ? 'bg-neutral-800 text-white font-medium border border-neutral-700'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Shield className="w-3 h-3 text-blue-400" /> Submarine VLF
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory('maritime_navtex')}
          className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-colors ${
            selectedCategory === 'maritime_navtex'
              ? 'bg-neutral-800 text-white font-medium border border-neutral-700'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Anchor className="w-3 h-3 text-cyan-400" /> NAVTEX Maritime
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory('numbers_station')}
          className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-colors ${
            selectedCategory === 'numbers_station'
              ? 'bg-neutral-800 text-white font-medium border border-neutral-700'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <HelpCircle className="w-3 h-3 text-rose-400" /> Numbers Station
        </button>
        <button
          type="button"
          onClick={() => setSelectedCategory('natural_vlf')}
          className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-colors ${
            selectedCategory === 'natural_vlf'
              ? 'bg-neutral-800 text-white font-medium border border-neutral-700'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Zap className="w-3 h-3 text-purple-400" /> Whistlers / Natural
        </button>
      </div>

      {/* Station Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 max-h-[480px] overflow-y-auto pr-1">
        {filteredStations.map((station) => {
          const isTuned = Math.abs(currentFrequency - station.frequency) < 0.2;

          return (
            <div
              key={station.id}
              className={`p-3 rounded-lg border transition-all flex flex-col justify-between ${
                isTuned
                  ? 'bg-neutral-800/90 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                  : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div>
                {/* Station Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(station.category)}
                    <span className="font-mono font-bold text-base text-neutral-100 tabular-nums">
                      {station.frequency.toFixed(1)} kHz
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                    {station.callsign}
                  </span>
                </div>

                {/* Name & Country */}
                <h3 className="font-semibold text-xs text-neutral-200 mt-1 line-clamp-1">
                  {station.name}
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-0.5">
                  <Globe className="w-3 h-3 text-neutral-500 shrink-0" />
                  <span className="truncate">{station.location}</span>
                </div>

                {/* Power & Status Metadata */}
                <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 mt-2 border-t border-neutral-800/60 pt-1.5">
                  <span>{station.powerKw > 0 ? `${station.powerKw} kW` : 'NATURAL'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{station.defaultMode}</span>
                  <span aria-hidden="true">·</span>
                  <span className={station.activeStatus === 'Active' ? 'text-emerald-400' : 'text-amber-400'}>
                    {station.activeStatus}
                  </span>
                </div>

                {/* Historical snippet */}
                <p className="text-[11px] text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                  {station.historicalNote}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-neutral-800/60">
                <button
                  type="button"
                  onClick={() => onTuneStation(station.frequency, station.defaultMode, station.defaultBandwidth)}
                  className={`flex-1 px-2.5 py-1.5 text-xs font-mono font-medium rounded transition-colors ${
                    isTuned
                      ? 'bg-amber-600 text-neutral-950 font-bold'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                  }`}
                >
                  {isTuned ? '● RECEIVING' : 'TUNE IN'}
                </button>

                {/* Broadcast voice snippet trigger if speech is available */}
                {station.audioProfile.speechScript && (
                  <button
                    type="button"
                    onClick={() => handleBroadcastVoice(station)}
                    disabled={!isPowered}
                    title="Simulate Voice Broadcast (e.g. Shipping Forecast)"
                    className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeSpeechSnippet && (
        <div className="mt-3 p-2 bg-neutral-950 rounded border border-neutral-800 text-xs font-mono text-neutral-300 flex items-center justify-between">
          <div className="truncate mr-2">
            <span className="text-amber-400 font-semibold mr-2">[BROADCASTING]:</span>
            <span>{activeSpeechSnippet}</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveSpeechSnippet(null)}
            className="text-[10px] text-neutral-500 hover:text-neutral-300 shrink-0"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};
