import { GameSettings } from "./config.js";

export class SoundManager {
    static audioBuffers = {};
    static isFootstepsPlaying = false;

    static init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.createNoiseBuffer();
            this.loadSound('shoot', './sfx/tir_revolver.mp3');
            this.loadSound('headshot', './sfx/Headshot.mp3');
            this.loadSound('hit', './sfx/hit.mp3');
            this.loadSound('enemyAttack', './sfx/enemy_attack.mp3');
            this.loadSound('laser', './sfx/laser.mp3');
            this.loadSound('bossDeath', './sfx/boss_death.mp3');
            this.loadSound('click', './sfx/click.mp3');
            this.loadSound('victory', './sfx/victory.mp3');
            this.loadSound('lose', './sfx/lose.mp3');
            this.loadSound('pickup', './sfx/pickup.mp3');
            this.loadSound('footstepLoop', './sfx/pas.wav').then(() => {
                this.setupFootstepsLoop();
            });
        }
    }

    static async loadSound(name, url) {
        try {
            const response = await fetch(url);
            if (!response.ok) return; // File not found
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            this.audioBuffers[name] = audioBuffer;
        } catch (e) {
            // Silently fail if custom audio isn't available
        }
    }

    static setupFootstepsLoop() {
        if (this.footstepsSource) return;
        if (!this.audioBuffers['footstepLoop']) return;

        this.footstepsGain = this.ctx.createGain();
        this.footstepsGain.gain.value = 0; // starts muted
        this.footstepsGain.connect(this.ctx.destination);

        this.footstepsSource = this.ctx.createBufferSource();
        this.footstepsSource.buffer = this.audioBuffers['footstepLoop'];
        this.footstepsSource.loop = true;
        this.footstepsSource.connect(this.footstepsGain);
        this.footstepsSource.start();
    }

    static setFootsteps(isWalking) {
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        if (!this.footstepsGain) return;

        const t = this.ctx.currentTime;
        const masterVol = GameSettings.masterVolume !== undefined ? GameSettings.masterVolume : 1.0;
        
        if (isWalking && !this.isFootstepsPlaying) {
            this.isFootstepsPlaying = true;
            this.footstepsGain.gain.cancelScheduledValues(t);
            this.footstepsGain.gain.linearRampToValueAtTime(1.5 * masterVol, t + 0.1); // fade in rapidly (boost volume slightly)
        } else if (!isWalking && this.isFootstepsPlaying) {
            this.isFootstepsPlaying = false;
            this.footstepsGain.gain.cancelScheduledValues(t);
            this.footstepsGain.gain.linearRampToValueAtTime(0, t + 0.15); // fade out rapidly
        }
    }

    static updateVolume() {
        if (this.footstepsGain && this.isFootstepsPlaying) {
            const t = this.ctx.currentTime;
            const masterVol = GameSettings.masterVolume !== undefined ? GameSettings.masterVolume : 1.0;
            this.footstepsGain.gain.cancelScheduledValues(t);
            this.footstepsGain.gain.linearRampToValueAtTime(1.5 * masterVol, t + 0.05);
        }
    }

    static createNoiseBuffer() {
        const bufferSize = this.ctx.sampleRate * 3.0; // 3 seconds of noise
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        this.noiseBuffer = buffer;
    }

    static play(type) {
        try {
            this.init();
            if (this.ctx.state === 'suspended') this.ctx.resume();
            
            const t = this.ctx.currentTime;
            const masterVol = GameSettings.masterVolume !== undefined ? GameSettings.masterVolume : 1.0;
            
            // Si on a un buffer chargé pour ce type de son, on le joue et on s'arrête là
            if (this.audioBuffers[type] && type !== 'footstepLoop') {
                const source = this.ctx.createBufferSource();
                source.buffer = this.audioBuffers[type];
                const gain = this.ctx.createGain();
                
                // Ajustement du volume selon le type et volume général
                let vol = (type === 'shoot') ? 0.8 : 1.0;
                gain.gain.value = vol * masterVol;
                
                source.connect(gain);
                gain.connect(this.ctx.destination);
                source.start(t);
                return; // Empêche de jouer le bruitage synthétique par dessus
            }

            // --- BRUITAGES SYNTHÉTIQUES DE SECOURS ---
            if (type === 'shoot') {
                // Noise for the bullet crack
                const noise = this.ctx.createBufferSource();
                noise.buffer = this.noiseBuffer;
                const noiseFilter = this.ctx.createBiquadFilter();
                noiseFilter.type = 'lowpass';
                noiseFilter.frequency.value = 2000;
                noise.connect(noiseFilter);
                const noiseGain = this.ctx.createGain();
                noiseFilter.connect(noiseGain);
                noiseGain.connect(this.ctx.destination);
                
                noiseGain.gain.setValueAtTime(0.2 * masterVol, t);
                noiseGain.gain.exponentialRampToValueAtTime(0.01 * masterVol, t + 0.15);
                noise.start(t);
                noise.stop(t + 0.15);

                // Oscillator for the "thump"
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(150, t);
                osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
                gain.gain.setValueAtTime(0.2 * masterVol, t);
                gain.gain.exponentialRampToValueAtTime(0.01 * masterVol, t + 0.1);
                osc.start(t);
                osc.stop(t + 0.1);
                
            } else if (type === 'hit') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(120, t);
                osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
                gain.gain.setValueAtTime(0.15 * masterVol, t);
                gain.gain.exponentialRampToValueAtTime(0.01 * masterVol, t + 0.15);
                osc.start(t);
                osc.stop(t + 0.15);
                
            } else if (type === 'headshot') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.type = 'square';
                osc.frequency.setValueAtTime(300, t); // Lower than before
                osc.frequency.exponentialRampToValueAtTime(150, t + 0.15);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
                osc.start(t);
                osc.stop(t + 0.15);
                
            } else if (type === 'enemyAttack') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(90, t);
                osc.frequency.linearRampToValueAtTime(40, t + 0.2);
                gain.gain.setValueAtTime(0.1 * masterVol, t);
                gain.gain.linearRampToValueAtTime(0.01 * masterVol, t + 0.2);
                osc.start(t);
                osc.stop(t + 0.2);
                
            } else if (type === 'laser') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(60, t); // Deeper laser
                osc.frequency.linearRampToValueAtTime(120, t + 0.5);
                
                // Add an LFO for vibration
                const lfo = this.ctx.createOscillator();
                lfo.frequency.value = 15;
                const lfoGain = this.ctx.createGain();
                lfoGain.gain.value = 20;
                lfo.connect(lfoGain);
                lfoGain.connect(osc.frequency);
                lfo.start(t);
                lfo.stop(t + 1.6);

                gain.gain.setValueAtTime(0.1 * masterVol, t);
                gain.gain.linearRampToValueAtTime(0.15 * masterVol, t + 1.5);
                gain.gain.linearRampToValueAtTime(0.01 * masterVol, t + 1.6);
                osc.start(t);
                osc.stop(t + 1.6);
                
            } else if (type === 'bossDeath') {
                // Big explosion noise
                const noise = this.ctx.createBufferSource();
                noise.buffer = this.noiseBuffer;
                const noiseFilter = this.ctx.createBiquadFilter();
                noiseFilter.type = 'lowpass';
                noiseFilter.frequency.value = 400; // Low frequency rumble
                
                // Sweep filter frequency down
                noiseFilter.frequency.exponentialRampToValueAtTime(50, t + 3.0);
                
                noise.connect(noiseFilter);
                const noiseGain = this.ctx.createGain();
                noiseFilter.connect(noiseGain);
                noiseGain.connect(this.ctx.destination);
                
                noiseGain.gain.setValueAtTime(0.4 * masterVol, t);
                noiseGain.gain.linearRampToValueAtTime(0.01 * masterVol, t + 3.0);
                noise.start(t);
                noise.stop(t + 3.0);

                // Deep bass oscillator
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(80, t);
                osc.frequency.exponentialRampToValueAtTime(20, t + 2.0);
                gain.gain.setValueAtTime(0.3 * masterVol, t);
                gain.gain.linearRampToValueAtTime(0.01 * masterVol, t + 2.0);
                osc.start(t);
                osc.stop(t + 2.0);
                
            } else if (type === 'click') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.frequency.setValueAtTime(800, t);
                gain.gain.setValueAtTime(0.1 * masterVol, t);
                gain.gain.exponentialRampToValueAtTime(0.01 * masterVol, t + 0.1);
                osc.start(t);
                osc.stop(t + 0.1);

            } else if (type === 'victory') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.frequency.setValueAtTime(440, t);
                osc.frequency.exponentialRampToValueAtTime(880, t + 0.5);
                gain.gain.setValueAtTime(0.1 * masterVol, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.5);
                osc.start(t);
                osc.stop(t + 0.5);

            } else if (type === 'lose') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.frequency.setValueAtTime(440, t);
                osc.frequency.exponentialRampToValueAtTime(110, t + 1.0);
                gain.gain.setValueAtTime(0.2 * masterVol, t);
                gain.gain.linearRampToValueAtTime(0, t + 1.0);
                osc.start(t);
                osc.stop(t + 1.0);

            } else if (type === 'pickup') {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1200, t);
                osc.frequency.exponentialRampToValueAtTime(1600, t + 0.1);
                gain.gain.setValueAtTime(0.1 * masterVol, t);
                gain.gain.exponentialRampToValueAtTime(0.01 * masterVol, t + 0.2);
                osc.start(t);
                osc.stop(t + 0.2);
            }
        } catch (e) {
            console.error("Audio error", e);
        }
    }
}
