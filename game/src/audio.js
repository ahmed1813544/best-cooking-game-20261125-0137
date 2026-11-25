// The Golden Ladle — all sound, made in code with the Web Audio API.
// No audio files: every blip, sizzle and chime is synthesised here.

let audioContext = null;
let muted = false;

/** Create (or reuse) the shared AudioContext. Call from a user gesture. */
export function ensureAudio() {
  if (audioContext === null) {
    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
  }
  if (audioContext.state === 'suspended') void audioContext.resume();
  return audioContext;
}

/** True when sound is muted. */
export function isMuted() {
  return muted;
}

/** Flip the mute flag and return the new state. */
export function toggleMute() {
  muted = !muted;
  return muted;
}

function tone(freq, seconds, type, gain, when = 0) {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const start = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  amp.gain.setValueAtTime(gain, start);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(amp).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.02);
}

function noise(seconds, gain, filterFreq, when = 0) {
  if (muted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const start = ctx.currentTime + when;
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(gain, start);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  source.connect(filter).connect(amp).connect(ctx.destination);
  source.start(start);
}

/** A short click when an ingredient is picked up. */
export function playPick() {
  tone(620, 0.07, 'triangle', 0.18);
}

/** A knife chop on the board. */
export function playChop() {
  noise(0.09, 0.35, 1800);
  tone(180, 0.06, 'square', 0.1);
}

/** The grill sizzles while a patty cooks. */
export function playSizzle() {
  noise(0.5, 0.12, 4200);
}

/** A patty is ready to come off the grill. */
export function playReady() {
  tone(880, 0.12, 'sine', 0.22);
  tone(1174, 0.16, 'sine', 0.22, 0.1);
}

/** A plate is served: a happy two-note chime. */
export function playServe() {
  tone(523, 0.12, 'triangle', 0.25);
  tone(659, 0.12, 'triangle', 0.25, 0.09);
  tone(784, 0.22, 'triangle', 0.25, 0.18);
}

/** Something went wrong: a low buzz. */
export function playError() {
  tone(140, 0.22, 'sawtooth', 0.16);
}

/** A new order ticket lands on the board. */
export function playOrder() {
  tone(392, 0.08, 'triangle', 0.18);
  tone(523, 0.1, 'triangle', 0.18, 0.07);
}

/** The shift is over. */
export function playShiftEnd() {
  tone(523, 0.18, 'triangle', 0.22);
  tone(392, 0.18, 'triangle', 0.22, 0.16);
  tone(523, 0.3, 'triangle', 0.22, 0.32);
}
