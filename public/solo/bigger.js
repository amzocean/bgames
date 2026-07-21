const ICONS = [
  { icon: '🍎', label: 'apple', color: '#ff6b6b' },
  { icon: '⭐', label: 'star', color: '#ffd43b' },
  { icon: '🚗', label: 'car', color: '#8fdcff' },
  { icon: '🐠', label: 'fish', color: '#78ffb3' },
  { icon: '🌙', label: 'moon', color: '#9d8cff' }
];

const board = document.getElementById('board');
const promptEl = document.getElementById('prompt');
const feedbackEl = document.getElementById('feedback');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const targetPillEl = document.getElementById('targetPill');
const newRoundBtn = document.getElementById('newRound');

let score = 0;
let streak = 0;
let locked = false;
let answerIndex = 0;

function level() {
  return localStorage.getItem('bgames:difficulty') || 'large';
}

function choiceCount() {
  const l = level();
  if (l === 'small') return 3;
  if (l === 'medium') return 3;
  return 2;
}

function shuffle(values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildBiggerRound() {
  locked = false;
  board.innerHTML = '';
  const item = shuffle(ICONS)[0];
  const count = choiceCount();
  const scales = count === 2 ? [0.9, 1.18] : [0.78, 1.0, 1.22];
  answerIndex = scales.indexOf(Math.max(...scales));
  promptEl.textContent = 'Tap the bigger one.';
  feedbackEl.textContent = 'Look for the one that is largest.';
  targetPillEl.textContent = `Goal: bigger ${item.icon}`;
  board.style.gridTemplateColumns = `repeat(${count}, minmax(0, 1fr))`;

  scales.forEach((scale, index) => {
    const btn = document.createElement('button');
    btn.className = 'tile large';
    btn.style.background = index === answerIndex ? 'linear-gradient(135deg, #fff6b8 0%, #ffd85c 100%)' : 'linear-gradient(135deg, #eff7ff 0%, #dcebff 100%)';
    btn.style.transform = `scale(${scale})`;
    btn.innerHTML = `<div style="font-size: 4rem;">${item.icon}</div><div style="font-size: 1rem; margin-top: 4px;">${index === answerIndex ? 'Bigger' : 'Smaller'}</div>`;
    btn.addEventListener('click', () => pick(index, answerIndex, 'bigger'));
    board.appendChild(btn);
  });
}

function buildBrighterRound() {
  locked = false;
  board.innerHTML = '';
  const item = shuffle(ICONS)[0];
  const count = choiceCount();
  const brightness = count === 2 ? [0.82, 1.18] : [0.74, 0.96, 1.2];
  answerIndex = brightness.indexOf(Math.max(...brightness));
  promptEl.textContent = 'Tap the brighter one.';
  feedbackEl.textContent = 'Look for the picture with more light.';
  targetPillEl.textContent = `Goal: brighter ${item.icon}`;
  board.style.gridTemplateColumns = `repeat(${count}, minmax(0, 1fr))`;

  brightness.forEach((amount, index) => {
    const btn = document.createElement('button');
    btn.className = 'tile large';
    btn.style.background = `linear-gradient(135deg, rgba(255,255,255,${Math.min(1, amount)}) 0%, rgba(255,255,255,0.5) 100%), ${item.color}`;
    btn.innerHTML = `<div style="font-size: 4rem; filter: brightness(${amount});">${item.icon}</div><div style="font-size: 1rem; margin-top: 4px;">${index === answerIndex ? 'Brighter' : 'Darker'}</div>`;
    btn.addEventListener('click', () => pick(index, answerIndex, 'brighter'));
    board.appendChild(btn);
  });
}

function pick(index, answer, kind) {
  if (locked) return;
  const ok = index === answer;
  if (ok) {
    locked = true;
    score += 1;
    streak += 1;
    scoreEl.textContent = String(score);
    streakEl.textContent = String(streak);
    feedbackEl.textContent = `Yes. That was ${kind}.`;
    window.bgamesSound?.play('good');
    window.bgamesSound?.say(`Great. That one was ${kind}.`);
    board.classList.add('celebrate');
    setTimeout(() => board.classList.remove('celebrate'), 300);
    setTimeout(() => {
      locked = false;
      buildRound();
    }, 850);
  } else {
    streak = 0;
    streakEl.textContent = '0';
    feedbackEl.textContent = 'Try again. Look for the bigger or brighter card.';
    window.bgamesSound?.play('bad');
  }
}

function buildRound() {
  if (Math.random() < 0.5) {
    buildBiggerRound();
  } else {
    buildBrighterRound();
  }
}

newRoundBtn.addEventListener('click', buildRound);
buildRound();
