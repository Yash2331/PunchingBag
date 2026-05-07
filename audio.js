/* ════════════════════════════════════════════════════════════
   audio.js — Web Audio API wrapper
   All sounds are procedurally generated; no external files needed.
   ════════════════════════════════════════════════════════════ */

let ctx = null;
let musicGain = null;
let sfxGain   = null;
let musicLoop = null;
let musicRunning = false;

const state = {
  musicEnabled:    true,
  sfxEnabled:      true,
  currentPhase:    'normal',   // normal | chaotic | emotional | wholesome
};

/* ── Lazy-init AudioContext (must be after user gesture) ── */
function ensureCtx() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  musicGain = ctx.createGain();
  sfxGain   = ctx.createGain();
  musicGain.gain.value = 0.25;
  sfxGain.gain.value   = 0.6;
  musicGain.connect(ctx.destination);
  sfxGain.connect(ctx.destination);
}

/* ── Utility: oscillator one-shot ─────────────────────── */
function tone(freq, type, duration, gain, startTime, gainNode) {
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  g.gain.setValueAtTime(gain, startTime);
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(g);
  g.connect(gainNode || sfxGain);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

/* ── Noise burst (for slap/hit) ───────────────────────── */
function noiseBurst(duration, gainVal, startTime) {
  const bufSize = ctx.sampleRate * duration;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  const filt = ctx.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.value = 1200;
  filt.Q.value = 0.5;
  g.gain.setValueAtTime(gainVal, startTime);
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  src.connect(filt);
  filt.connect(g);
  g.connect(sfxGain);
  src.start(startTime);
  src.stop(startTime + duration + 0.01);
}

/* ══════════════════════════════════════════════════════════
   SFX
   ══════════════════════════════════════════════════════════ */

export function sfxPoke() {
  if (!state.sfxEnabled) return;
  ensureCtx();
  const t = ctx.currentTime;
  tone(800, 'sine', 0.08, 0.4, t);
  tone(1100, 'sine', 0.06, 0.2, t + 0.04);
}

export function sfxSlap() {
  if (!state.sfxEnabled) return;
  ensureCtx();
  const t = ctx.currentTime;
  noiseBurst(0.12, 0.8, t);
  tone(200, 'sawtooth', 0.08, 0.3, t);
}

export function sfxThrow() {
  if (!state.sfxEnabled) return;
  ensureCtx();
  const t = ctx.currentTime;
  // Whoosh
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(300, t);
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.25);
  g.gain.setValueAtTime(0.3, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
  osc.connect(g); g.connect(sfxGain);
  osc.start(t); osc.stop(t + 0.26);
  // Impact
  noiseBurst(0.08, 0.6, t + 0.22);
}

export function sfxCombo(count) {
  if (!state.sfxEnabled) return;
  ensureCtx();
  const t = ctx.currentTime;
  const freqs = [440, 550, 660, 880, 1100];
  const f = freqs[Math.min(count - 1, freqs.length - 1)];
  tone(f, 'square', 0.12, 0.35, t);
  tone(f * 1.5, 'sine', 0.08, 0.2, t + 0.08);
}

export function sfxDramaticFall() {
  if (!state.sfxEnabled) return;
  ensureCtx();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.8);
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
  osc.connect(g); g.connect(sfxGain);
  osc.start(t); osc.stop(t + 0.85);
}

export function sfxCry() {
  if (!state.sfxEnabled) return;
  ensureCtx();
  const t = ctx.currentTime;
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(350 - i * 30, t + i * 0.35);
    osc.frequency.exponentialRampToValueAtTime(200 - i * 20, t + i * 0.35 + 0.3);
    g.gain.setValueAtTime(0.25, t + i * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.35 + 0.35);
    osc.connect(g); g.connect(sfxGain);
    osc.start(t + i * 0.35); osc.stop(t + i * 0.35 + 0.38);
  }
}

export function sfxHug() {
  if (!state.sfxEnabled) return;
  ensureCtx();
  const t = ctx.currentTime;
  const melody = [523, 659, 784, 1047];
  melody.forEach((f, i) => {
    tone(f, 'sine', 0.3, 0.3, t + i * 0.12);
    tone(f * 0.5, 'sine', 0.18, 0.15, t + i * 0.12);
  });
}

export function sfxAchievement() {
  if (!state.sfxEnabled) return;
  ensureCtx();
  const t = ctx.currentTime;
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((f, i) => {
    tone(f, 'triangle', 0.18, 0.4, t + i * 0.08);
  });
}

export function sfxApologize() {
  if (!state.sfxEnabled) return;
  ensureCtx();
  const t = ctx.currentTime;
  tone(440, 'sine', 0.2, 0.3, t);
  tone(392, 'sine', 0.2, 0.25, t + 0.2);
  tone(349, 'sine', 0.25, 0.3, t + 0.4);
}

/* ══════════════════════════════════════════════════════════
   Background Music  (lo-fi chords via oscillators)
   ══════════════════════════════════════════════════════════ */

const CHORDS = {
  normal:    [[261, 329, 392], [220, 277, 330], [174, 220, 261], [196, 247, 294]],
  chaotic:   [[146, 185, 220], [164, 207, 247], [130, 164, 196], [110, 138, 164]],
  emotional: [[130, 155, 196], [116, 138, 174], [123, 155, 185], [116, 146, 174]],
  wholesome: [[261, 329, 392], [293, 370, 440], [349, 440, 523], [392, 494, 587]],
};

let chordIndex = 0;
let chordTimer = null;

function scheduleChord() {
  if (!musicRunning || !state.musicEnabled) return;
  const chord = CHORDS[state.currentPhase] || CHORDS.normal;
  const freqs = chord[chordIndex % chord.length];
  const t = ctx.currentTime;
  const bpm = state.currentPhase === 'chaotic' ? 110 : 75;
  const beatLen = 60 / bpm;

  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.05);
    g.gain.linearRampToValueAtTime(0.08, t + beatLen * 1.8);
    g.gain.linearRampToValueAtTime(0, t + beatLen * 2);
    osc.connect(g); g.connect(musicGain);
    osc.start(t); osc.stop(t + beatLen * 2 + 0.05);
  });

  // Bass note
  const bassosc = ctx.createOscillator();
  const bassg   = ctx.createGain();
  bassosc.type = 'sine';
  bassosc.frequency.value = freqs[0] / 2;
  bassg.gain.setValueAtTime(0.18, t);
  bassg.gain.exponentialRampToValueAtTime(0.0001, t + beatLen * 2);
  bassosc.connect(bassg); bassg.connect(musicGain);
  bassosc.start(t); bassosc.stop(t + beatLen * 2 + 0.05);

  chordIndex++;
  const ms = beatLen * 2 * 1000;
  chordTimer = setTimeout(scheduleChord, ms);
}

export function startMusic() {
  ensureCtx();
  if (musicRunning) return;
  musicRunning = true;
  scheduleChord();
}

export function stopMusic() {
  musicRunning = false;
  if (chordTimer) clearTimeout(chordTimer);
}

export function setMusicPhase(phase) {
  state.currentPhase = phase;
}

export function setMusicEnabled(v) {
  state.musicEnabled = v;
  if (!v) stopMusic();
  else { ensureCtx(); if (!musicRunning) startMusic(); }
}

export function setSfxEnabled(v) { state.sfxEnabled = v; }

export function resumeCtx() {
  if (ctx && ctx.state === 'suspended') ctx.resume();
}
