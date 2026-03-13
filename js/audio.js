// ============================================
// PROCEDURAL AUDIO ENGINE (Web Audio API)
// ============================================
class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.currentMusic = null;
        this.radioStation = 0;
        this.radioPlaying = false;
        this.radioGain = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.3;
        this.musicGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.6;
        this.sfxGain.connect(this.masterGain);
        this.initialized = true;
    }

    // --- SFX ---
    playGunshot() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.1));
        noise.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        noise.connect(filter).connect(gain).connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.15);
    }

    playShotgun() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.2, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.15));
        noise.buffer = buf;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        noise.connect(gain).connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.25);
    }

    playExplosion() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.8, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.3));
        noise.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        noise.connect(filter).connect(gain).connect(this.sfxGain);
        noise.start(now);
    }

    playSiren() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(900, now + 0.3);
        osc.frequency.linearRampToValueAtTime(600, now + 0.6);
        osc.frequency.linearRampToValueAtTime(900, now + 0.9);
        osc.frequency.linearRampToValueAtTime(600, now + 1.2);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.setValueAtTime(0, now + 1.2);
        osc.connect(gain).connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 1.3);
    }

    playTireScreech() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.3, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
        noise.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2000;
        filter.Q.value = 5;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        noise.connect(filter).connect(gain).connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.35);
    }

    playFootstep() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.3));
        noise.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;
        const gain = this.ctx.createGain();
        gain.gain.value = 0.08;
        noise.connect(filter).connect(gain).connect(this.sfxGain);
        noise.start(now);
    }

    playPickup() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.1);
        osc.frequency.setValueAtTime(784, now + 0.2);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain).connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.35);
    }

    playCarDoor() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.15, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.2));
        noise.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass'; filter.frequency.value = 800; filter.Q.value = 2;
        const gain = this.ctx.createGain();
        gain.gain.value = 0.2;
        noise.connect(filter).connect(gain).connect(this.sfxGain);
        noise.start(now);
    }

    playEngineLoop(speed) {
        // Managed externally via vehicle
    }

    // --- MUSIC / RADIO ---
    _createSynthNote(freq, startTime, duration, type = 'sawtooth', vol = 0.1, output = this.musicGain) {
        const osc = this.ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, startTime);
        gain.gain.setValueAtTime(vol, startTime + duration * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1500;
        osc.connect(filter).connect(gain).connect(output);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
        return osc;
    }

    _playDrumHit(startTime, output = this.musicGain) {
        const noise = this.ctx.createBufferSource();
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.15));
        noise.buffer = buf;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
        noise.connect(gain).connect(output);
        noise.start(startTime);
    }

    _playKick(startTime, output = this.musicGain) {
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(150, startTime);
        osc.frequency.exponentialRampToValueAtTime(50, startTime + 0.1);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
        osc.connect(gain).connect(output);
        osc.start(startTime);
        osc.stop(startTime + 0.2);
    }

    startRadio(station) {
        if (!this.ctx) return;
        this.stopRadio();
        this.radioStation = station;
        this.radioPlaying = true;
        this.stopAmbientMusic();
        this.radioGain = this.ctx.createGain();
        this.radioGain.gain.value = 1;
        this.radioGain.connect(this.musicGain);
        this._loopRadio();
    }

    cycleRadio() {
        if (!this.ctx) return;
        if (!this.radioPlaying) {
            this.startRadio(0);
            return;
        }
        if (this.radioStation >= 2) {
            this.stopRadio();
            return;
        }
        this.startRadio(this.radioStation + 1);
    }

    _loopRadio() {
        if (!this.radioPlaying || !this.ctx) return;
        const now = this.ctx.currentTime;
        const output = this.radioGain || this.musicGain;
        const bpm = [128, 100, 140][this.radioStation] || 120;
        const beatLen = 60 / bpm;
        const barLen = beatLen * 4;
        const bars = 4;

        if (this.radioStation === 0) {
            // Synthwave
            const notes = [65.41, 82.41, 98.00, 73.42]; // bass C2, E2, G2, D2
            const melody = [261.63, 329.63, 392.00, 349.23, 293.66, 261.63, 329.63, 392.00];
            for (let bar = 0; bar < bars; bar++) {
                this._createSynthNote(notes[bar % notes.length], now + bar * barLen, barLen * 0.9, 'sawtooth', 0.08, output);
                for (let beat = 0; beat < 4; beat++) {
                    this._playKick(now + bar * barLen + beat * beatLen, output);
                    if (beat % 2 === 1) this._playDrumHit(now + bar * barLen + beat * beatLen, output);
                    this._createSynthNote(melody[(bar * 4 + beat) % melody.length] * 2, now + bar * barLen + beat * beatLen, beatLen * 0.4, 'square', 0.03, output);
                }
            }
        } else if (this.radioStation === 1) {
            // Hip hop
            const bassNotes = [55, 55, 73.42, 65.41];
            for (let bar = 0; bar < bars; bar++) {
                this._createSynthNote(bassNotes[bar % bassNotes.length], now + bar * barLen, barLen * 0.5, 'triangle', 0.12, output);
                for (let beat = 0; beat < 4; beat++) {
                    if (beat === 0 || beat === 2) this._playKick(now + bar * barLen + beat * beatLen, output);
                    if (beat === 1 || beat === 3) this._playDrumHit(now + bar * barLen + beat * beatLen, output);
                }
            }
        } else {
            // Electronic/Dance
            const chords = [[130.81, 164.81, 196], [146.83, 174.61, 220], [164.81, 196, 246.94], [130.81, 164.81, 196]];
            for (let bar = 0; bar < bars; bar++) {
                const chord = chords[bar % chords.length];
                chord.forEach(f => this._createSynthNote(f, now + bar * barLen, barLen * 0.7, 'sawtooth', 0.04, output));
                for (let beat = 0; beat < 8; beat++) {
                    this._playKick(now + bar * barLen + beat * beatLen / 2, output);
                    if (beat % 2 === 1) this._playDrumHit(now + bar * barLen + beat * beatLen / 2, output);
                }
            }
        }

        this._radioTimeout = setTimeout(() => this._loopRadio(), bars * barLen * 1000);
    }

    stopRadio() {
        this.radioPlaying = false;
        if (this._radioTimeout) clearTimeout(this._radioTimeout);
        this._radioTimeout = null;
        if (this.radioGain) {
            try { this.radioGain.disconnect(); } catch (err) {}
            this.radioGain = null;
        }
        if (this.ctx) this.startAmbientMusic();
    }

    startAmbientMusic() {
        if (this._ambientLoop) return;
        this._ambientPlaying = true;
        this._playAmbientLoop();
    }

    _playAmbientLoop() {
        if (!this._ambientPlaying || !this.ctx) return;
        const now = this.ctx.currentTime;
        // Chill ambient pad
        [130.81, 164.81, 196].forEach(f => {
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = f;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.03, now + 1);
            gain.gain.setValueAtTime(0.03, now + 3);
            gain.gain.linearRampToValueAtTime(0, now + 4);
            osc.connect(gain).connect(this.musicGain);
            osc.start(now);
            osc.stop(now + 4.1);
        });
        this._ambientLoop = setTimeout(() => this._playAmbientLoop(), 4500);
    }

    stopAmbientMusic() {
        this._ambientPlaying = false;
        if (this._ambientLoop) clearTimeout(this._ambientLoop);
        this._ambientLoop = null;
    }

    playMissionComplete() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
            this._createSynthNote(f, now + i * 0.15, 0.4, 'sine', 0.15);
        });
    }

    playWantedUp() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [200, 250, 300].forEach((f, i) => {
            this._createSynthNote(f, now + i * 0.1, 0.2, 'square', 0.1);
        });
    }

    playHeliSound() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Low rhythmic thud to simulate helicopter rotor
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain).connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.2);
    }
}
