import { RadioStation, ReceiverState, SignalMeasurement } from '../types/radio';
import { LONG_WAVE_STATIONS } from '../data/stations';

export class RadioEngine {
  private ctx: AudioContext | null = null;
  private isInitialized = false;

  // Audio Nodes
  private masterGain: GainNode | null = null;
  private rfGainNode: GainNode | null = null;
  private noiseGainNode: GainNode | null = null;
  private carrierGainNode: GainNode | null = null;
  private signalGainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private notchNode: BiquadFilterNode | null = null;
  private squelchGainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private audioDestinationNode: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  // Oscillators and Generators
  private noiseSource: AudioBufferSourceNode | null = null;
  private sfericsTimer: number | null = null;
  private carrierOsc: OscillatorNode | null = null;
  private bfoOsc: OscillatorNode | null = null;
  private fskOsc: OscillatorNode | null = null;
  private fskTimer: number | null = null;
  private timeTickTimer: number | null = null;
  private morseTimer: number | null = null;
  private whistlerTimer: number | null = null;
  private speechSynthesisActive = false;
  private poacherTimer: number | null = null;

  // Signal State
  private lastMeasurement: SignalMeasurement = {
    carrierStrength: 0,
    sUnits: 0,
    snrDb: 0,
    isLocked: false,
    activeStation: null,
    tuningOffsetHz: 0
  };

  private currentState: ReceiverState = {
    power: false,
    frequency: 198.0,
    mode: 'AM',
    bandwidth: 9.0,
    volume: 0.75,
    rfGain: 0.85,
    squelch: 0.05,
    bfoPitch: 700,
    noiseBlanker: false,
    qrnLevel: 0.4,
    timeOfDay: 'dusk',
    displayColor: 'phosphor',
    bfoEnabled: false,
    notchFilter: false,
    notchFreq: 1000
  };

  constructor() {
    // Lazy AudioContext initialization on first user interaction
  }

  public async init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Create Main Audio Graph
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0; // Starts silent until power turned on

    this.rfGainNode = this.ctx.createGain();
    this.rfGainNode.gain.value = 0.85;

    this.squelchGainNode = this.ctx.createGain();
    this.squelchGainNode.gain.value = 1.0;

    // IF Bandpass Filter (shapes demodulated audio based on selected receiver bandwidth)
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 4500; // 9 kHz AM = ±4.5 kHz audio
    this.filterNode.Q.value = 0.707;

    // Tunable Notch Filter (to cancel interfering carrier heterodynes)
    this.notchNode = this.ctx.createBiquadFilter();
    this.notchNode.type = 'notch';
    this.notchNode.frequency.value = 1000;
    this.notchNode.Q.value = 10.0;

    // FFT & Oscilloscope Analyser
    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 1024;
    this.analyserNode.smoothingTimeConstant = 0.8;

    // Sub-gains
    this.noiseGainNode = this.ctx.createGain();
    this.noiseGainNode.gain.value = 0.15;

    this.carrierGainNode = this.ctx.createGain();
    this.carrierGainNode.gain.value = 0.0;

    this.signalGainNode = this.ctx.createGain();
    this.signalGainNode.gain.value = 0.0;

    // Recording Destination
    this.audioDestinationNode = this.ctx.createMediaStreamDestination();

    // Wire up nodes:
    // (Noise + Carrier + Signal) -> rfGainNode -> squelchGainNode -> filterNode -> notchNode -> masterGain -> [destination, analyser, recorder]
    this.noiseGainNode.connect(this.rfGainNode);
    this.carrierGainNode.connect(this.rfGainNode);
    this.signalGainNode.connect(this.rfGainNode);

    this.rfGainNode.connect(this.squelchGainNode);
    this.squelchGainNode.connect(this.filterNode);
    this.filterNode.connect(this.notchNode);
    this.notchNode.connect(this.masterGain);

    this.masterGain.connect(this.ctx.destination);
    this.masterGain.connect(this.analyserNode);
    this.masterGain.connect(this.audioDestinationNode);

    // Start atmospheric noise generator
    this.startAtmosphericNoise();

    // Start periodic background routines
    this.startSfericsGenerator();
    this.startTimeTickGenerator();
    this.startFskGenerator();
    this.startMorseGenerator();
    this.startWhistlerGenerator();
    this.startPoacherGenerator();

    this.isInitialized = true;
  }

  // Generate pink/brown atmospheric low frequency radio noise
  private startAtmosphericNoise() {
    if (!this.ctx || !this.noiseGainNode) return;

    const bufferSize = this.ctx.sampleRate * 4; // 4 seconds looped noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown/Pink filtered noise approximation (realistic ionospheric rumble)
      lastOut = (lastOut * 0.96) + (white * 0.08);
      data[i] = lastOut + (white * 0.03);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.noiseGainNode);
    source.start();
    this.noiseSource = source;
  }

  // Lightning sferics generator (sharp atmospheric crackles echoing from distant thunderstorms)
  private startSfericsGenerator() {
    const triggerSferic = () => {
      if (this.ctx && this.noiseGainNode && this.currentState.power) {
        const qrn = this.currentState.qrnLevel;
        if (Math.random() < qrn) {
          const crackleGain = this.ctx.createGain();
          crackleGain.gain.value = 0.05 + Math.random() * 0.2 * qrn;

          // Bandpass filter centered around 1.5 - 4 kHz
          const crackleFilter = this.ctx.createBiquadFilter();
          crackleFilter.type = 'bandpass';
          crackleFilter.frequency.value = 800 + Math.random() * 2500;
          crackleFilter.Q.value = 2 + Math.random() * 4;

          const osc = this.ctx.createOscillator();
          osc.type = Math.random() > 0.5 ? 'sawtooth' : 'triangle';
          osc.frequency.setValueAtTime(200 + Math.random() * 600, this.ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.08);

          osc.connect(crackleFilter);
          crackleFilter.connect(crackleGain);
          crackleGain.connect(this.noiseGainNode);

          osc.start();
          osc.stop(this.ctx.currentTime + 0.08);
        }
      }

      // Next crackle burst
      const nextDelay = 80 + Math.random() * 500 * (1.1 - this.currentState.qrnLevel);
      this.sfericsTimer = window.setTimeout(triggerSferic, nextDelay);
    };

    triggerSferic();
  }

  // Time standard atomic tick pulses (for DCF77, MSF, WWVB)
  private startTimeTickGenerator() {
    const tick = () => {
      if (this.ctx && this.signalGainNode && this.currentState.power) {
        const station = this.lastMeasurement.activeStation;
        if (station && station.category === 'time_signal' && this.lastMeasurement.carrierStrength > 10) {
          const now = new Date();
          const second = now.getSeconds();
          
          // DCF77 omits the 59th second pulse as minute synchronization marker
          const isOmitted = (station.id === 'dcf77' && second === 59);

          if (!isOmitted) {
            // German DCF77: 100ms = binary 0, 200ms = binary 1
            const pulseLength = (second % 3 === 0) ? 0.2 : 0.1;

            const osc = this.ctx.createOscillator();
            const toneGain = this.ctx.createGain();

            // Demodulated BFO pitch or 1000 Hz reference pip
            const pitch = this.currentState.bfoEnabled ? this.currentState.bfoPitch : 1000;
            osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);

            // Pulse envelope with soft rise/decay to avoid key click
            const nowTime = this.ctx.currentTime;
            toneGain.gain.setValueAtTime(0.001, nowTime);
            toneGain.gain.linearRampToValueAtTime(0.25 * (this.lastMeasurement.carrierStrength / 100), nowTime + 0.008);
            toneGain.gain.setValueAtTime(0.25 * (this.lastMeasurement.carrierStrength / 100), nowTime + pulseLength - 0.008);
            toneGain.gain.linearRampToValueAtTime(0.001, nowTime + pulseLength);

            osc.connect(toneGain);
            toneGain.connect(this.signalGainNode);

            osc.start(nowTime);
            osc.stop(nowTime + pulseLength + 0.01);
          }
        }
      }

      // Synchronize to next millisecond interval approaching full second
      const nowMs = Date.now();
      const delay = 1000 - (nowMs % 1000);
      this.timeTickTimer = window.setTimeout(tick, delay);
    };

    tick();
  }

  // NAVTEX & Submarine VLF FSK (Frequency Shift Keying) tone generation
  private startFskGenerator() {
    let fskBit = 0;
    const fskStep = () => {
      if (this.ctx && this.signalGainNode && this.currentState.power) {
        const station = this.lastMeasurement.activeStation;
        if (station && (station.category === 'maritime_navtex' || station.category === 'submarine_vlf') && this.lastMeasurement.carrierStrength > 15) {
          // NAVTEX standard: 100 baud, 1700 Hz center, ±85 Hz shift (1615 Hz / 1785 Hz)
          // Submarine VLF (DHO38): 200 baud, ~1500 Hz audio shift
          const centerFreq = station.category === 'submarine_vlf' ? 1200 : 1700;
          const shift = station.category === 'submarine_vlf' ? 100 : 85;

          fskBit = (fskBit + 1) % 7;
          const isMark = Math.random() > 0.45;
          const toneFreq = isMark ? (centerFreq + shift) : (centerFreq - shift);

          if (!this.fskOsc) {
            this.fskOsc = this.ctx.createOscillator();
            this.fskOsc.type = 'sine';
            this.fskOsc.frequency.setValueAtTime(toneFreq, this.ctx.currentTime);
            this.fskOsc.connect(this.signalGainNode);
            this.fskOsc.start();
          } else {
            this.fskOsc.frequency.setValueAtTime(toneFreq, this.ctx.currentTime);
          }

          // Scale signal gain node
          const strength = (this.lastMeasurement.carrierStrength / 100) * 0.18;
          this.signalGainNode.gain.setTargetAtTime(strength, this.ctx.currentTime, 0.05);
        } else {
          if (this.fskOsc) {
            try { this.fskOsc.stop(); } catch { /* ignore */ }
            this.fskOsc.disconnect();
            this.fskOsc = null;
          }
        }
      }

      this.fskTimer = window.setTimeout(fskStep, 10); // 100 baud timing
    };

    fskStep();
  }

  // Grimeton SAQ 17.2 kHz Morse Code CW generator
  private startMorseGenerator() {
    const morsePattern = '.-.-. -.-. --.- -.-. --.- -.-. --.- -.. . ... .- --.- ';
    let charIndex = 0;

    const playSymbol = () => {
      if (this.ctx && this.signalGainNode && this.currentState.power) {
        const station = this.lastMeasurement.activeStation;
        if (station && station.id === 'saq_grimeton' && this.lastMeasurement.carrierStrength > 15) {
          const char = morsePattern[charIndex];
          charIndex = (charIndex + 1) % morsePattern.length;

          let duration = 0.08; // dot length in seconds (approx 15 WPM)
          let isSound = false;

          if (char === '.') {
            duration = 0.08;
            isSound = true;
          } else if (char === '-') {
            duration = 0.24;
            isSound = true;
          } else if (char === ' ') {
            duration = 0.16;
            isSound = false;
          }

          if (isSound && this.ctx) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            // Grimeton SAQ characteristic pure 800 Hz pitch
            const pitch = this.currentState.bfoEnabled ? this.currentState.bfoPitch : 800;
            osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);

            const nowTime = this.ctx.currentTime;
            const str = (this.lastMeasurement.carrierStrength / 100) * 0.22;
            gain.gain.setValueAtTime(0.001, nowTime);
            gain.gain.linearRampToValueAtTime(str, nowTime + 0.005);
            gain.gain.setValueAtTime(str, nowTime + duration - 0.005);
            gain.gain.linearRampToValueAtTime(0.001, nowTime + duration);

            osc.connect(gain);
            gain.connect(this.signalGainNode);

            osc.start(nowTime);
            osc.stop(nowTime + duration + 0.01);
          }

          this.morseTimer = window.setTimeout(playSymbol, (duration + 0.06) * 1000);
          return;
        }
      }

      this.morseTimer = window.setTimeout(playSymbol, 500);
    };

    playSymbol();
  }

  // Natural VLF Whistlers generator (descending FM audio sweep caused by lightning)
  private startWhistlerGenerator() {
    const triggerWhistler = () => {
      if (this.ctx && this.signalGainNode && this.currentState.power) {
        const station = this.lastMeasurement.activeStation;
        if (station && station.id === 'vlf_natural' && this.lastMeasurement.carrierStrength > 20) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          const now = this.ctx.currentTime;
          const duration = 1.2 + Math.random() * 0.8;

          // Distinctive ionospheric dispersion curve: frequency drops from ~6000 Hz down to 600 Hz
          osc.type = 'sine';
          osc.frequency.setValueAtTime(5500 + Math.random() * 1000, now);
          osc.frequency.exponentialRampToValueAtTime(700, now + duration);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.18, now + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

          osc.connect(gain);
          gain.connect(this.signalGainNode);

          osc.start(now);
          osc.stop(now + duration + 0.05);
        }
      }

      // Next whistler event in 4 - 12 seconds
      const delay = 4000 + Math.random() * 8000;
      this.whistlerTimer = window.setTimeout(triggerWhistler, delay);
    };

    triggerWhistler();
  }

  // The Lincolnshire Poacher Numbers Station music box tune
  private startPoacherGenerator() {
    // Two bars of "The Lincolnshire Poacher" notes (in Hz)
    const melody = [
      { note: 523.25, dur: 0.2 }, // C5
      { note: 587.33, dur: 0.2 }, // D5
      { note: 659.25, dur: 0.2 }, // E5
      { note: 698.46, dur: 0.2 }, // F5
      { note: 783.99, dur: 0.4 }, // G5
      { note: 783.99, dur: 0.4 }, // G5
      { note: 880.00, dur: 0.2 }, // A5
      { note: 783.99, dur: 0.2 }, // G5
      { note: 659.25, dur: 0.4 }, // E5
      { note: 523.25, dur: 0.4 }, // C5
    ];

    let noteIdx = 0;
    const playNote = () => {
      if (this.ctx && this.signalGainNode && this.currentState.power) {
        const station = this.lastMeasurement.activeStation;
        if (station && station.id === 'lincolnshire_poacher' && this.lastMeasurement.carrierStrength > 15) {
          const { note, dur } = melody[noteIdx];
          noteIdx = (noteIdx + 1) % melody.length;

          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'triangle'; // chime / music box character
          osc.frequency.setValueAtTime(note, this.ctx.currentTime);

          const now = this.ctx.currentTime;
          const str = (this.lastMeasurement.carrierStrength / 100) * 0.2;
          gain.gain.setValueAtTime(str, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + dur + 0.1);

          osc.connect(gain);
          gain.connect(this.signalGainNode);

          osc.start(now);
          osc.stop(now + dur + 0.15);

          this.poacherTimer = window.setTimeout(playNote, (dur + 0.05) * 1000);
          return;
        }
      }

      this.poacherTimer = window.setTimeout(playNote, 1000);
    };

    playNote();
  }

  // Trigger synthesized voice broadcast (Shipping Forecast on BBC Radio 4 or Polskie Radio)
  public triggerVoiceBroadcast(text: string) {
    if (!('speechSynthesis' in window) || this.speechSynthesisActive) return;
    if (!this.currentState.power || this.lastMeasurement.carrierStrength < 20) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.88; // calm, measured Met Office shipping forecast delivery
    utterance.pitch = 0.95;
    utterance.volume = Math.min(1, (this.lastMeasurement.carrierStrength / 100) * this.currentState.volume);

    // Try finding a British voice for BBC, or standard English/Polish
    const voices = window.speechSynthesis.getVoices();
    if (this.lastMeasurement.activeStation?.id === 'bbc_radio_4') {
      const gbVoice = voices.find(v => v.lang.includes('en-GB') || v.name.includes('British') || v.name.includes('UK'));
      if (gbVoice) utterance.voice = gbVoice;
    } else if (this.lastMeasurement.activeStation?.id === 'polskie_radio_1') {
      const plVoice = voices.find(v => v.lang.includes('pl'));
      if (plVoice) utterance.voice = plVoice;
    }

    this.speechSynthesisActive = true;
    utterance.onend = () => {
      this.speechSynthesisActive = false;
    };
    utterance.onerror = () => {
      this.speechSynthesisActive = false;
    };

    window.speechSynthesis.speak(utterance);
  }

  // Update receiver settings and calculate RF physics
  public updateState(newState: Partial<ReceiverState>) {
    this.currentState = { ...this.currentState, ...newState };

    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Master Power & Volume
    if (this.masterGain) {
      if (this.currentState.power) {
        this.masterGain.gain.setTargetAtTime(this.currentState.volume, now, 0.05);
      } else {
        this.masterGain.gain.setTargetAtTime(0, now, 0.05);
      }
    }

    // RF Gain
    if (this.rfGainNode) {
      this.rfGainNode.gain.setTargetAtTime(this.currentState.rfGain, now, 0.05);
    }

    // Filter Bandwidth
    if (this.filterNode) {
      let cutoff = 4500;
      if (this.currentState.mode === 'CW') cutoff = 600;
      else if (this.currentState.mode === 'USB' || this.currentState.mode === 'LSB') cutoff = 2400;
      else if (this.currentState.mode === 'DATA') cutoff = 2000;
      else cutoff = (this.currentState.bandwidth * 1000) / 2;

      this.filterNode.frequency.setTargetAtTime(cutoff, now, 0.05);
    }

    // Notch Filter
    if (this.notchNode) {
      if (this.currentState.notchFilter) {
        this.notchNode.frequency.setTargetAtTime(this.currentState.notchFreq, now, 0.05);
        this.notchNode.Q.setTargetAtTime(12, now, 0.05);
      } else {
        this.notchNode.frequency.setTargetAtTime(20, now, 0.05); // Move out of audible passband
      }
    }

    // Atmospheric Noise Level (QRN + propagation effects)
    if (this.noiseGainNode) {
      // Noise is higher at night due to ionospheric reflection, but stations are stronger too!
      const timeFactor = this.currentState.timeOfDay === 'night' ? 1.4 : this.currentState.timeOfDay === 'dusk' ? 1.1 : 0.8;
      const noiseLevel = (0.05 + this.currentState.qrnLevel * 0.25) * timeFactor;
      this.noiseGainNode.gain.setTargetAtTime(noiseLevel, now, 0.05);
    }

    // Calculate signal reception based on tuning frequency
    this.computeSignalPhysics();
  }

  // Calculate carrier reception, tuning heterodyne whistle, and S-Meter reading
  private computeSignalPhysics() {
    if (!this.ctx) return;

    const currentFreq = this.currentState.frequency;
    let closestStation: RadioStation | null = null;
    let minDistance = Infinity;

    for (const station of LONG_WAVE_STATIONS) {
      const dist = Math.abs(currentFreq - station.frequency);
      if (dist < minDistance) {
        minDistance = dist;
        closestStation = station;
      }
    }

    // Max tuning capture range is ±3.5 kHz
    const captureRadiusKhz = 3.5;
    let carrierStrength = 0;
    let tuningOffsetHz = 0;
    let isLocked = false;

    if (closestStation && minDistance <= captureRadiusKhz) {
      tuningOffsetHz = Math.round((currentFreq - closestStation.frequency) * 1000);

      // Propagation multiplier based on time of day
      let propagation = 1.0;
      if (this.currentState.timeOfDay === 'night') propagation = 1.45; // Skywave skip
      else if (this.currentState.timeOfDay === 'dusk') propagation = 1.2;
      else propagation = 0.9; // Day groundwave with D-layer absorption

      // Normalize power (e.g. 1000 kW is strong, 1 kW is weak)
      const powerFactor = Math.sqrt(closestStation.powerKw || 10) / Math.sqrt(1000);

      // Signal falls off with distance from center carrier
      const resonance = Math.max(0, 1 - Math.pow(minDistance / captureRadiusKhz, 1.8));

      carrierStrength = Math.min(100, Math.round(resonance * (60 + powerFactor * 40) * propagation));
      isLocked = minDistance <= 0.2; // locked within ±200 Hz
    }

    // Calculate S-Meter: S0 to S9 + 30 dB
    // 0 = S0, 50 = S6, 75 = S9, 90 = S9+10dB, 100 = S9+30dB
    let sUnits = 0;
    if (carrierStrength <= 75) {
      sUnits = (carrierStrength / 75) * 9.0;
    } else {
      sUnits = 9.0 + ((carrierStrength - 75) / 25) * 3.0; // above S9
    }

    // Squelch handling
    const squelchThreshold = this.currentState.squelch * 100;
    const isSquelched = carrierStrength < squelchThreshold && this.currentState.squelch > 0.02;

    if (this.squelchGainNode) {
      const targetGain = isSquelched ? 0.0001 : 1.0;
      this.squelchGainNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.04);
    }

    // Heterodyne carrier whistle generation (classic analog zero-beat effect)
    this.updateHeterodyneWhistle(minDistance, tuningOffsetHz, carrierStrength);

    this.lastMeasurement = {
      carrierStrength: isSquelched ? 0 : carrierStrength,
      sUnits: isSquelched ? 0 : Math.round(sUnits * 10) / 10,
      snrDb: Math.max(0, Math.round((carrierStrength - 15) * 0.6)),
      isLocked,
      activeStation: minDistance <= captureRadiusKhz ? closestStation : null,
      tuningOffsetHz
    };
  }

  // Generate authentic carrier beat oscillator (heterodyne whistle)
  private updateHeterodyneWhistle(distKhz: number, offsetHz: number, strength: number) {
    if (!this.ctx || !this.carrierGainNode) return;

    const absOffset = Math.abs(offsetHz);

    // In CW or SSB mode, or when tuning close in AM mode, we hear the heterodyne carrier
    const isCwOrSsb = this.currentState.mode === 'CW' || this.currentState.mode === 'USB' || this.currentState.mode === 'LSB';
    const isAmHeterodyne = this.currentState.mode === 'AM' && distKhz > 0.05 && distKhz <= 3.5;

    if ((isCwOrSsb || isAmHeterodyne) && strength > 5 && this.currentState.power) {
      let whistleFreq = absOffset;

      if (this.currentState.mode === 'CW') {
        // In CW mode, carrier mixes with BFO pitch
        whistleFreq = Math.abs(absOffset - (this.currentState.bfoEnabled ? this.currentState.bfoPitch : 700));
      } else if (this.currentState.mode === 'USB') {
        whistleFreq = Math.max(200, offsetHz + 1500);
      } else if (this.currentState.mode === 'LSB') {
        whistleFreq = Math.max(200, -offsetHz + 1500);
      }

      // Bound to audible audio range
      whistleFreq = Math.min(6000, Math.max(40, whistleFreq));

      if (!this.carrierOsc) {
        this.carrierOsc = this.ctx.createOscillator();
        this.carrierOsc.type = 'sine';
        this.carrierOsc.frequency.setValueAtTime(whistleFreq, this.ctx.currentTime);
        this.carrierOsc.connect(this.carrierGainNode);
        this.carrierOsc.start();
      } else {
        this.carrierOsc.frequency.setTargetAtTime(whistleFreq, this.ctx.currentTime, 0.02);
      }

      // In AM mode, volume dips to zero right at exact center zero-beat
      let volumeFactor = (strength / 100) * 0.12;
      if (this.currentState.mode === 'AM') {
        volumeFactor *= Math.min(1.0, absOffset / 600); // zero-beat silence
      }

      this.carrierGainNode.gain.setTargetAtTime(volumeFactor, this.ctx.currentTime, 0.03);
    } else {
      if (this.carrierOsc) {
        this.carrierGainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
        try { this.carrierOsc.stop(); } catch { /* ignore */ }
        this.carrierOsc.disconnect();
        this.carrierOsc = null;
      }
    }
  }

  // Get current signal measurement for S-Meter and Telemetry HUD
  public getMeasurement(): SignalMeasurement {
    return this.lastMeasurement;
  }

  // Get time domain byte data for oscilloscope display
  public getWaveformData(array: Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteTimeDomainData(array as unknown as Uint8Array<ArrayBuffer>);
    }
  }

  // Get frequency byte data for spectrum analyzer / waterfall
  public getFrequencyData(array: Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(array as unknown as Uint8Array<ArrayBuffer>);
    }
  }

  // Start audio recording (Wire/Tape capture)
  public startRecording(): boolean {
    if (!this.audioDestinationNode) return false;

    try {
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(this.audioDestinationNode.stream);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };
      this.mediaRecorder.start(100);
      return true;
    } catch {
      return false;
    }
  }

  // Stop recording and return downloadable blob URL
  public stopRecording(): Promise<string> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve('');
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        resolve(url);
      };

      this.mediaRecorder.stop();
    });
  }

  // Clean up all resources
  public destroy() {
    if (this.sfericsTimer) clearTimeout(this.sfericsTimer);
    if (this.timeTickTimer) clearTimeout(this.timeTickTimer);
    if (this.fskTimer) clearTimeout(this.fskTimer);
    if (this.morseTimer) clearTimeout(this.morseTimer);
    if (this.whistlerTimer) clearTimeout(this.whistlerTimer);
    if (this.poacherTimer) clearTimeout(this.poacherTimer);

    if (this.noiseSource) {
      try { this.noiseSource.stop(); } catch { /* ignore */ }
    }
    if (this.carrierOsc) {
      try { this.carrierOsc.stop(); } catch { /* ignore */ }
    }
    if (this.fskOsc) {
      try { this.fskOsc.stop(); } catch { /* ignore */ }
    }

    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
    }
  }
}

// Singleton export
export const radioEngine = new RadioEngine();
