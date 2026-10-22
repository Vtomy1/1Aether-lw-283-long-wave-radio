import { FrequencyHistoryEntry, DemodulationMode, FilterBandwidth } from '../types/radio';
import { LONG_WAVE_STATIONS } from '../data/stations';

export const HISTORY_STORAGE_KEY = 'aether_lw_frequency_history';
export const HISTORY_UPDATE_EVENT = 'aether_lw_frequency_history_updated';

export function getFrequencyHistory(): FrequencyHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveFrequencyScan(
  frequency: number,
  mode: DemodulationMode,
  bandwidth: FilterBandwidth,
  source: 'waterfall_click' | 'dial_tuning' | 'preset' | 'step' = 'waterfall_click'
): FrequencyHistoryEntry | null {
  try {
    const existing = getFrequencyHistory();

    // Check if duplicate of most recent entry within 0.1 kHz and 3 seconds
    const now = Date.now();
    const last = existing[0];
    if (last && Math.abs(last.frequency - frequency) < 0.1 && (now - last.timeMs) < 3000) {
      return null;
    }

    // Match closest station
    const matchedStation = LONG_WAVE_STATIONS.find(
      (st) => Math.abs(st.frequency - frequency) <= 1.0
    );

    const nowFormatted = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

    const newEntry: FrequencyHistoryEntry = {
      id: `scan_${now}_${Math.random().toString(36).substring(2, 6)}`,
      frequency: Math.round(frequency * 100) / 100,
      timestamp: nowFormatted,
      timeMs: now,
      stationName: matchedStation?.name,
      callsign: matchedStation?.callsign,
      mode,
      bandwidth,
      source
    };

    // Keep most recent 200 scans
    const updated = [newEntry, ...existing].slice(0, 200);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));

    // Dispatch event so active History tabs update instantly
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(HISTORY_UPDATE_EVENT, { detail: newEntry }));
    }

    return newEntry;
  } catch (err) {
    console.error('Error saving frequency history to local storage:', err);
    return null;
  }
}

export function clearFrequencyHistory(): void {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(HISTORY_UPDATE_EVENT, { detail: null }));
    }
  } catch (err) {
    console.error('Error clearing frequency history:', err);
  }
}
