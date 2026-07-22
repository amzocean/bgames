const levelEl = document.getElementById('level');
const streakEl = document.getElementById('streak');
const feedbackEl = document.getElementById('feedback');
const playPatternBtn = document.getElementById('playPattern');
const resetInputBtn = document.getElementById('resetInput');
const nextRoundBtn = document.getElementById('nextRound');
const padsEl = document.getElementById('pads');

const ALL_PADS = [
  { id: 0, icon: '🔴', color: '#ff9aa2', freq: 392 },
  { id: 1, icon: '🟡', color: '#ffe28a', freq: 440 },
  { id: 2, icon: '🟢', color: '#baf3c0', freq: 523 },
  { id: 3, icon: '🔵', color: '#b9dcff', freq: 659 },
  { id: 4, icon: '🟣', color: '#d5c2ff', freq: 784 },
  { id: 5, icon: '🟠', color: '#ffd1a6', freq: 880 }
];

let sequence = [];
let input = [];
let streak = 0;
let level = 1;
let locked = false;
let pads = [];

function difficulty() {
  return localStorage.getItem('bgames:difficulty') || 'large';
}

function activePads() {
  const d = difficulty();
  if (d === 'small') return ALL_PADS.slice(0, 6);
  if (d === 'medium') return ALL_PADS.slice(0, 5);
  return ALL_PADS.slice(0, 4);
}

function sequenceLength() {
  const d = difficulty();
  const base = d === 'small' ? 6 : d === 'medium' ? 5 : 4;
  const ramp = Math.min(4, Math.floor((level - 1) / 2));
  return base + ramp;
}

function pulsePad(id) {
  const pad = pads.find((p) => Number(p.dataset.id) === id);
  if (!pad) return;
  pad.classList.add('rhythm-active');
  setTimeout(() => pad.classList.remove('rhythm-active'), 280);
}

function playTone(freq, duration = 0.2) {
  if (!window.bgamesSound?.isOn()) return;
  const ctx = window.__bgamesRhythmCtx || new (window.AudioContext || window.webkitAudioContext)();
  window.__bgamesRhythmCtx = ctx;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration + 0.02);
}

async function playSequence() {
  if (locked) return;
  locked = true;
  const padsPool = activePads();
  const beatMs = Math.max(280, 520 - Math.min(180, level * 14));
  feedbackEl.textContent = 'Watch and listen...';
  for (const id of sequence) {
    pulsePad(id);
    playTone(padsPool[id].freq);
    await new Promise((resolve) => setTimeout(resolve, beatMs));
  }
  feedbackEl.textContent = 'Now copy the pattern.';
  locked = false;
}

function updateUi() {
  levelEl.textContent = String(level);
  streakEl.textContent = String(streak);
}

function buildRound() {
  input = [];
  sequence = [];
  const padsPool = activePads();
  const len = sequenceLength();
  for (let i = 0; i < len; i += 1) {
    sequence.push(Math.floor(Math.random() * padsPool.length));
  }
  feedbackEl.textContent = `Tap Play Pattern, then repeat ${len} beats.`;
  updateUi();
}

function handlePadTap(id) {
  if (locked) return;
  const padsPool = activePads();
  pulsePad(id);
  playTone(padsPool[id].freq, 0.16);
  input.push(id);
  const index = input.length - 1;
  const ok = input[index] === sequence[index];
  if (!ok) {
    streak = 0;
    feedbackEl.textContent = 'Not this order. Tap Play Pattern and try again.';
    window.bgamesSound?.play('bad');
    input = [];
    updateUi();
    return;
  }
  if (input.length === sequence.length) {
    streak += 1;
    level += 1;
    feedbackEl.textContent = streak >= 2 ? `Perfect rhythm streak x${streak}!` : 'Great rhythm repeat!';
    window.bgamesSound?.play('win');
    window.bgamesSound?.say('Great rhythm!');
    padsEl.classList.add('celebrate');
    setTimeout(() => padsEl.classList.remove('celebrate'), 360);
    buildRound();
  }
}

function renderPads() {
  padsEl.innerHTML = '';
  const padsPool = activePads();
  const cols = padsPool.length <= 4 ? 2 : 3;
  padsEl.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
  padsPool.forEach((padInfo, index) => {
    const btn = document.createElement('button');
    btn.className = 'tile large rhythm-pad';
    btn.dataset.id = String(index);
    btn.style.background = `linear-gradient(135deg, ${padInfo.color} 0%, #ffffff 100%)`;
    btn.innerHTML = `<div class="rhythm-pad-icon">${padInfo.icon}</div><div class="rhythm-pad-label">Pad ${index + 1}</div>`;
    btn.addEventListener('click', () => handlePadTap(index));
    padsEl.appendChild(btn);
  });
  pads = [...padsEl.querySelectorAll('.rhythm-pad')];
}

playPatternBtn.addEventListener('click', playSequence);
resetInputBtn.addEventListener('click', () => {
  input = [];
  feedbackEl.textContent = 'Input cleared. Repeat the pattern again.';
});
nextRoundBtn.addEventListener('click', () => {
  level = 1;
  streak = 0;
  renderPads();
  buildRound();
});

renderPads();
buildRound();
