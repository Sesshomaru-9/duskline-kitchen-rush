// Tiny WebAudio sound kit: every effect is synthesised, no audio files.
// The context is created lazily on the first user gesture; shot mode never touches it.
export function createAudio() {
  let ctx = null;
  let muted = false;
  let sizzleNodes = null;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      return null;
    }
    return ctx;
  }
  function unlock() { const c = ensure(); if (c && c.state === 'suspended') c.resume().catch(() => {}); }
  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(vol || 0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }
  function noise(dur, vol, freq) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const t = c.currentTime;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq || 1800;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol || 0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(gain).connect(c.destination);
    src.start(t);
  }
  return {
    unlock,
    toggleMute() { muted = !muted; if (muted) this.stopSizzle(); return muted; },
    get muted() { return muted; },
    pickup() { tone(520, 0.07, 'triangle', 0.1); },
    place() { tone(300, 0.08, 'triangle', 0.1, 220); },
    chop() { noise(0.09, 0.22, 2400); },
    chopDone() { tone(660, 0.09, 'triangle', 0.12); tone(880, 0.12, 'triangle', 0.1); },
    sizzleStart() {
      if (muted || sizzleNodes) return;
      const c = ensure();
      if (!c) return;
      const len = c.sampleRate;
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = c.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3000;
      const gain = c.createGain();
      gain.gain.value = 0.035;
      src.connect(filter).connect(gain).connect(c.destination);
      src.start();
      sizzleNodes = { src, gain };
    },
    stopSizzle() {
      if (!sizzleNodes) return;
      try { sizzleNodes.src.stop(); } catch { /* already stopped */ }
      sizzleNodes = null;
    },
    ding() { tone(880, 0.14, 'sine', 0.14); tone(1318, 0.22, 'sine', 0.12); },
    coin() { tone(988, 0.08, 'square', 0.06); setTimeout(() => tone(1319, 0.16, 'square', 0.06), 70); },
    error() { tone(160, 0.18, 'sawtooth', 0.09, 110); },
    expired() { tone(392, 0.16, 'triangle', 0.1, 262); tone(262, 0.3, 'triangle', 0.1, 196); },
    dayClear() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.12), i * 110)); },
    gameOver() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.11), i * 160)); },
  };
}
