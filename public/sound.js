(() => {
  const STORAGE_KEY = 'bgames:soundOn';
  let soundOn = localStorage.getItem(STORAGE_KEY) !== 'off';
  let audioCtx = null;
  let lastUiClickAt = 0;
  let preferredVoice = null;
  let lastSpokenClue = '';
  let lastSpokenAt = 0;
  let clueSpeakTimer = null;
  let initialClueTimer = null;
  let initialCluePending = false;
  let initialClueSession = 0;

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

  function say(text) {
    if (!soundOn || !('speechSynthesis' in window)) return;
    if (!preferredVoice) preferredVoice = pickPreferredVoice();
    const cleanText = stripEmojiFromSpeech(text);
    if (!cleanText) return;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.lang = 'en-US';
    utterance.rate = 0.56;
    utterance.pitch = 1.12;
    utterance.volume = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return utterance;
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
    const candidates = getSoloClueNodes();
    for (const node of candidates) {
      const text = String(node.textContent || '').trim().replace(/\s+/g, ' ');
      if (text && !isPlaceholderClueText(text)) return stripEmojiFromSpeech(text);
    }
    return '';
  }

  function isPlaceholderClueText(text) {
    const normalized = String(text || '').trim().toLowerCase();
    if (!normalized) return true;
    if (normalized === '-' || normalized === '...') return true;
    if (/^(clue|target):\s*[-–—]+$/.test(normalized)) return true;
    if (/^(first|next) clue:\s*\.\.\.$/.test(normalized)) return true;
    if (normalized === 'goal: follow clues') return true;
    return false;
  }

  function getSoloClueNodes() {
    const explicit = [...document.querySelectorAll('[data-clue-source]')];
    if (explicit.length) return explicit;
    return [document.getElementById('prompt'), document.getElementById('feedback')].filter(Boolean);
  }

  function readSoloInstructionText() {
    const explicit = document.querySelector('[data-game-instruction]');
    const text = explicit ? String(explicit.textContent || '').trim().replace(/\s+/g, ' ') : '';
    return stripEmojiFromSpeech(text) || 'Listen carefully. Then follow the clue.';
  }

  function stripEmojiFromSpeech(text) {
    const value = String(text || '');
    const withoutEmoji = value.replace(/[\p{Extended_Pictographic}\u200D\uFE0F\u20E3]/gu, '');
    return withoutEmoji.replace(/\s+/g, ' ').replace(/\s+([.,!?;:])/g, '$1').trim();
  }

  function speakSoloClue(force = false) {
    const clue = readSoloClueText();
    if (!clue) return;
    const now = Date.now();
    if (!force) {
      if (clue === lastSpokenClue && now - lastSpokenAt < 8000) return;
      if (now - lastSpokenAt < 1200) return;
    }
    lastSpokenClue = clue;
    lastSpokenAt = now;
    say(clue);
  }

  function estimateSpeechDelay(text) {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1800, 500 + words * 320);
  }

  function speakSoloInstructionThenClue() {
    initialClueSession += 1;
    const session = initialClueSession;
    initialCluePending = true;
    if (initialClueTimer) clearTimeout(initialClueTimer);
    if (clueSpeakTimer) clearTimeout(clueSpeakTimer);

    const instruction = readSoloInstructionText();
    const speakInitialClue = (attempt = 0) => {
      if (session !== initialClueSession || !initialCluePending) return;
      const clue = readSoloClueText();
      if (!clue) {
        if (attempt >= 8) {
          initialCluePending = false;
          return;
        }
        initialClueTimer = setTimeout(() => speakInitialClue(attempt + 1), 250);
        return;
      }
      initialCluePending = false;
      speakSoloClue(true);
    };

    const instructionUtterance = instruction ? say(instruction) : null;
    const fallbackDelay = Math.max(1800, estimateSpeechDelay(instruction) + 300);

    initialClueTimer = setTimeout(() => {
      speakInitialClue();
    }, fallbackDelay);

    if (instructionUtterance) {
      instructionUtterance.onend = () => {
        if (session !== initialClueSession || !initialCluePending) return;
        if (initialClueTimer) clearTimeout(initialClueTimer);
        initialClueTimer = setTimeout(() => speakInitialClue(), 150);
      };
    }
  }

  function initSoloClueAudio() {
    if (!window.location.pathname.startsWith('/solo/')) return;
    document.body.classList.add('solo-mode');

    const playArea = document.querySelector('.play-area');
    if (!playArea) return;

    let clueBtn = playArea.querySelector('#hearClue');
    if (!clueBtn) {
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

      clueBtn = toolsRow.querySelector('[data-hear-clue]');
      if (!clueBtn) {
        clueBtn = document.createElement('button');
        clueBtn.type = 'button';
        clueBtn.className = 'secondary';
        clueBtn.dataset.hearClue = '1';
        clueBtn.textContent = 'Hear Clue';
        toolsRow.appendChild(clueBtn);
      }
    }

    if (clueBtn.dataset.clueWired !== '1') {
      clueBtn.dataset.clueWired = '1';
      clueBtn.addEventListener('click', (event) => {
        event.preventDefault();
        speakSoloClue(true);
      });
    }

    const watchTargets = getSoloClueNodes();
    if (watchTargets.length) {
      const observer = new MutationObserver(() => {
        if (initialCluePending) return;
        if (clueSpeakTimer) clearTimeout(clueSpeakTimer);
        clueSpeakTimer = setTimeout(() => speakSoloClue(false), 180);
      });
      watchTargets.forEach((target) => {
        observer.observe(target, { childList: true, characterData: true, subtree: true });
      });
    }

    setTimeout(() => speakSoloInstructionThenClue(), 450);
  }

  function initViewportChangeSignal() {
    let rafId = null;
    const notify = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        window.dispatchEvent(new Event('bgames:viewportchange'));
      });
    };
    window.addEventListener('resize', notify);
    window.addEventListener('orientationchange', notify);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', notify);
    }
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

  initViewportChangeSignal();
})();
