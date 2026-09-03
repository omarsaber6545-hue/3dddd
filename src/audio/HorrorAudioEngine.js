/**
 * Procedural Horror Audio Engine (Web Audio API)
 * Generates rich spatial atmospheric soundscapes, electrical buzzes, footsteps, dripping water,
 * and generator engine rumbles natively without external audio files.
 */
export class HorrorAudioEngine {
  constructor() {
    this.ctx = null;
    this.isInitialized = false;
    this.isMuted = false;
    this.generatorRunning = false;
  }

  init() {
    if (this.isInitialized) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    // Master bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Horror drone bus
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    this.droneGain.connect(this.masterGain);

    this.startAmbientDrone();
    this.startWaterDrips();

    this.isInitialized = true;
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Continuous ominous sub-bass ambient horror drone with slow resonant sweep
   */
  startAmbientDrone() {
    if (!this.ctx) return;

    // Sub oscillator (deep 48Hz rumble)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(46.0, this.ctx.currentTime);

    // Detuned sub oscillator (49.5Hz creating binaural beating)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(49.2, this.ctx.currentTime);

    // Low-pass resonant filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, this.ctx.currentTime);
    filter.Q.setValueAtTime(4.5, this.ctx.currentTime);

    // LFO to slowly sweep the cutoff frequency
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // Slow 12-second cycle

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(45, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(this.droneGain);

    osc1.start();
    osc2.start();
    lfo.start();

    // Brown noise generator for distant air conditioning / wind draft
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(220, this.ctx.currentTime);
    noiseFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.droneGain);

    whiteNoise.start();
  }

  /**
   * Occasional distant water droplet drip with echo reverb
   */
  startWaterDrips() {
    if (!this.ctx) return;

    const scheduleDrip = () => {
      const nextTime = 4000 + Math.random() * 6000;
      setTimeout(() => {
        this.playWaterDrip();
        scheduleDrip();
      }, nextTime);
    };

    scheduleDrip();
  }

  playWaterDrip() {
    if (!this.ctx || this.ctx.state !== 'running') return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const startFreq = 1200 + Math.random() * 400;
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 1.6, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  /**
   * Fluorescent light electrical buzzing and arc crackle (synchronized with flicker)
   */
  playFluorescentBuzz(intensity = 1.0) {
    if (!this.ctx || this.ctx.state !== 'running') return;

    // 120Hz mains hum with harsh harmonics
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800 + Math.random() * 400, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    const duration = 0.08 + Math.random() * 0.15;
    gain.gain.setValueAtTime(0.15 * intensity, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  /**
   * Procedural Footstep sound
   */
  playFootstep(isSprinting = false, isConcrete = false) {
    if (!this.ctx || this.ctx.state !== 'running') return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pitch & timbre: tile slap vs dull concrete thud
    const baseFreq = isConcrete ? 85 : 120;
    osc.type = isConcrete ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(baseFreq + Math.random() * 20, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.08);

    const vol = isSprinting ? 0.25 : 0.14;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  /**
   * Flashlight Click Switch
   */
  playFlashlightClick() {
    if (!this.ctx || this.ctx.state !== 'running') return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.025);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.03);
  }

  /**
   * Heavy Door Creak
   */
  playDoorCreak() {
    if (!this.ctx || this.ctx.state !== 'running') return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    const startF = 320 + Math.random() * 80;
    osc.frequency.setValueAtTime(startF, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(startF - 120, this.ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  /**
   * Diesel Generator Startup and Continuous Engine Rumble
   */
  startGeneratorRumble() {
    if (!this.ctx || this.generatorRunning) return;
    this.generatorRunning = true;

    // Starter crank sound
    const crankOsc = this.ctx.createOscillator();
    crankOsc.type = 'sawtooth';
    crankOsc.frequency.setValueAtTime(70, this.ctx.currentTime);
    crankOsc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.8);

    const crankGain = this.ctx.createGain();
    crankGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    crankGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.85);

    crankOsc.connect(crankGain);
    crankGain.connect(this.masterGain);
    crankOsc.start();
    crankOsc.stop(this.ctx.currentTime + 0.9);

    // Continuous 55Hz heavy diesel thrumming
    setTimeout(() => {
      const genOsc = this.ctx.createOscillator();
      genOsc.type = 'triangle';
      genOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

      const genGain = this.ctx.createGain();
      genGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

      genOsc.connect(genGain);
      genGain.connect(this.masterGain);
      genOsc.start();
    }, 850);
  }

  /**
   * Tense Heartbeat Pulse
   */
  playHeartbeat() {
    if (!this.ctx || this.ctx.state !== 'running') return;

    // "Lub-dub" double pulse
    const playPulse = (delay, freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + delay + 0.12);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + 0.18);
    };

    playPulse(0, 75);
    playPulse(0.12, 60);
  }
}
