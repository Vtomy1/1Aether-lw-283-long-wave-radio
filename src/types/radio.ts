export type DemodulationMode = 'AM' | 'USB' | 'LSB' | 'CW' | 'DATA';

export type FilterBandwidth = 0.5 | 2.4 | 6.0 | 9.0; // kHz

export type StationCategory = 
  | 'broadcast' 
  | 'time_signal' 
  | 'maritime_navtex' 
  | 'submarine_vlf' 
  | 'numbers_station' 
  | 'natural_vlf';

export interface RadioStation {
  id: string;
  frequency: number; // in kHz (e.g. 198.0)
  callsign: string;
  name: string;
  country: string;
  location: string;
  powerKw: number;
  category: StationCategory;
  defaultMode: DemodulationMode;
  defaultBandwidth: FilterBandwidth;
  activeStatus: 'Active' | 'Historical' | 'Intermittent';
  description: string;
  historicalNote: string;
  coordinates?: { lat: number; lng: number };
  audioProfile: {
    type: 'speech' | 'time_ticks' | 'fsk' | 'cw' | 'music_box' | 'natural_chirp';
    customAudioSnippet?: string;
    morseText?: string;
    speechScript?: string[];
  };
}

export interface ReceiverState {
  power: boolean;
  frequency: number; // in kHz, float (e.g. 198.00)
  mode: DemodulationMode;
  bandwidth: FilterBandwidth;
  volume: number; // 0 to 1
  rfGain: number; // 0 to 1
  squelch: number; // 0 to 1
  bfoPitch: number; // Hz, e.g. 700 Hz
  noiseBlanker: boolean;
  qrnLevel: number; // atmospheric static (0 to 1)
  timeOfDay: 'day' | 'dusk' | 'night'; // influences ionospheric propagation
  displayColor: 'phosphor' | 'amber' | 'cyan' | 'monochrome';
  bfoEnabled: boolean;
  notchFilter: boolean;
  notchFreq: number; // Hz
}

export interface LogEntry {
  id: string;
  timestamp: string;
  frequency: number;
  stationName: string;
  callsign: string;
  mode: DemodulationMode;
  sinpo: string; // e.g. "55444"
  notes: string;
  recordedAudioUrl?: string;
}

export interface SignalMeasurement {
  carrierStrength: number; // 0 to 100
  sUnits: number; // 0 to 9 + decibels above 9 (e.g. 9.2 = S9+20dB)
  snrDb: number;
  isLocked: boolean;
  activeStation: RadioStation | null;
  tuningOffsetHz: number;
}

export interface FrequencyHistoryEntry {
  id: string;
  frequency: number; // in kHz
  timestamp: string; // e.g. "2026-10-21 19:04:15"
  timeMs: number;
  stationName?: string;
  callsign?: string;
  mode: DemodulationMode;
  bandwidth: FilterBandwidth;
  source: 'waterfall_click' | 'dial_tuning' | 'preset' | 'step';
}

