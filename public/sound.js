(() => {
  const STORAGE_KEY = 'bgames:soundOn';
  let soundOn = localStorage.getItem(STORAGE_KEY) !== 'off';
  let audioCtx = null;
  let lastUiClickAt = 0;
  let preferredVoice = null;

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

    function pickPreferredVoice() {
      if (!('speechSynthesis' in window)) return null;
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return null;

      const scoreVoice = (voice) => {
        const text = `${voice.name} ${voice.lang}`.toLowerCase();
        let score = 0;
        if (text.includes('en')) score += 3;
        if (text.includes('us') || text.includes('uk')) score += 2;
        if (text.includes('child') || text.includes('kid') || text.includes('young')) score += 8;
        if (text.includes('girl') || text.includes('female') || text.includes('samantha') || text.includes('zira')) score += 4;
        if (voice.default) score += 1;
        return score;
      };

      return [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || null;
    }
  }

  function say(text) {
    if (!soundOn || !('speechSynthesis' in window)) return;
    if (!preferredVoice) preferredVoice = pickPreferredVoice();
    const utterance = new SpeechSynthesisUtterance(text);
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 0.8;
    utterance.pitch = 1.25;
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

  function readSoloClueText() {
    const candidates = [
      document.getElementById('feedback'),
      document.getElementById('prompt'),
      document.querySelector('[data-clue-source]')
    ].filter(Boolean);
    for (const node of candidates) {
      const text = String(node.textContent || '').trim().replace(/\s+/g, ' ');
      if (text) return text;
    }
    return '';
  }

  function initSoloClueAudio() {
    if (!window.location.pathname.startsWith('/solo/')) return;
    document.body.classList.add('solo-mode');

    const playArea = document.querySelector('.play-area');
    if (!playArea) return;

    // If a page already has a dedicated clue button (e.g. Treasure Map), keep it as-is.
    if (playArea.querySelector('#hearClue')) return;

    let toolsRow = playArea.querySelector('.mini-tools');
    if (!toolsRow) {
      toolsRow = document.createElement('div');
      toolsRow.className = 'mini-tools';
      const firstBoard = playArea.querySelector('.board, .canvas-box');
      if (firstBoard) {
        playArea.insertBefore(toolsRow, firstBoard);
      } else {
        playArea.appendChild(toolsRow);
      }
    }

    let clueBtn = toolsRow.querySelector('[data-hear-clue]');
    if (!clueBtn) {
      clueBtn = document.createElement('button');
      clueBtn.type = 'button';
      clueBtn.className = 'secondary';
      clueBtn.dataset.hearClue = '1';
      clueBtn.textContent = 'Hear Clue';
      toolsRow.appendChild(clueBtn);
    }

    if (clueBtn.dataset.clueWired === '1') return;
    clueBtn.dataset.clueWired = '1';
    clueBtn.addEventListener('click', (event) => {
      event.preventDefault();
      const clue = readSoloClueText();
      if (clue) say(clue);
    });
  }

  window.bgamesSound = {
    play,
    say,
    isOn: () => soundOn,
    setOn: setSound,
    toggle: toggleSound,
    refreshToggleUi: updateToggleLabels
  };

  if ('speechSynthesis' in window) {
    preferredVoice = pickPreferredVoice();
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      preferredVoice = pickPreferredVoice();
    });
  }

  initUiClickSounds();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initToggles();
      initSoloClueAudio();
    });
  } else {
    initToggles();
    initSoloClueAudio();
  }
})();
