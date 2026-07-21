(() => {
  const STORAGE_KEY = 'bgames:soundOn';
  let soundOn = localStorage.getItem(STORAGE_KEY) !== 'off';
  let audioCtx = null;
  let lastUiClickAt = 0;

  function ensureAudio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function tone(freq, duration, type, gainValue, whenOffset = 0) {
    if (!soundOn) return;
    const ctx = ensureAudio();
    if (!ctx) return;
    const when = ctx.currentTime + whenOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(gainValue, when + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(when);
    osc.stop(when + duration + 0.02);
  }

  function play(name) {
    if (!soundOn) return;
    switch (name) {
      case 'click':
        tone(500, 0.06, 'triangle', 0.035);
        break;
      case 'good':
        tone(660, 0.09, 'triangle', 0.08);
        tone(880, 0.11, 'triangle', 0.08, 0.09);
        break;
      case 'bad':
        tone(280, 0.11, 'sawtooth', 0.06);
        tone(220, 0.12, 'sawtooth', 0.05, 0.08);
        break;
      case 'pop':
        tone(740, 0.08, 'square', 0.06);
        break;
      case 'win':
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          tone(freq, 0.16, 'triangle', 0.13, i * 0.11);
        });
        break;
      default:
        tone(520, 0.08, 'triangle', 0.05);
    }
  }

  function say(text) {
    if (!soundOn || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1.12;
    utterance.volume = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function setSound(on) {
    soundOn = on;
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
    updateToggleLabels();
    if (!on && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  function toggleSound() {
    setSound(!soundOn);
    if (soundOn) play('good');
  }

  function updateToggleLabels() {
    document.querySelectorAll('[data-sound-toggle]').forEach((el) => {
      el.textContent = soundOn ? 'Sound: On 🔊' : 'Sound: Off 🔇';
      el.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
    });
  }

  function initToggles() {
    document.querySelectorAll('[data-sound-toggle]').forEach((el) => {
      if (el.dataset.soundWired === '1') return;
      el.dataset.soundWired = '1';
      el.addEventListener('click', (event) => {
        event.preventDefault();
        toggleSound();
      });
    });
    updateToggleLabels();
  }

  function initUiClickSounds() {
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-sound-toggle]')) return;
      if (!target.closest('button, a, .tile, .game-tile, .mode-tile, .chip, .color-dot')) return;
      const now = Date.now();
      if (now - lastUiClickAt < 70) return;
      lastUiClickAt = now;
      play('click');
    }, true);
  }

  window.bgamesSound = {
    play,
    say,
    isOn: () => soundOn,
    setOn: setSound,
    toggle: toggleSound,
    refreshToggleUi: updateToggleLabels
  };

  initUiClickSounds();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initToggles);
  } else {
    initToggles();
  }
})();
