const BANK = [
  { id: 'apple', icon: '🍎', label: 'apple', color: '#ff6b6b' },
  { id: 'star', icon: '⭐', label: 'star', color: '#ffd43b' },
  { id: 'moon', icon: '🌙', label: 'moon', color: '#78c2ff' },
  { id: 'leaf', icon: '🍃', label: 'leaf', color: '#67d27a' },
  { id: 'heart', icon: '💖', label: 'heart', color: '#ff7ac8' },
  { id: 'rocket', icon: '🚀', label: 'rocket', color: '#9d8cff' },
  { id: 'fish', icon: '🐟', label: 'fish', color: '#79d7ff' },
  { id: 'ball', icon: '⚽', label: 'ball', color: '#78ffb3' },
  { id: 'kite', icon: '🪁', label: 'kite', color: '#9ee5ff' },
  { id: 'flower', icon: '🌸', label: 'flower', color: '#ff9fda' },
  { id: 'car', icon: '🚗', label: 'car', color: '#ffc27a' },
  { id: 'tree', icon: '🌳', label: 'tree', color: '#84dd98' },
  { id: 'cloud', icon: '☁️', label: 'cloud', color: '#cfd9ff' },
  { id: 'gift', icon: '🎁', label: 'gift', color: '#ffb08a' }
];

const patternView = document.getElementById('patternView');
const choicesEl = document.getElementById('choices');
const promptEl = document.getElementById('prompt');
const feedbackEl = document.getElementById('feedback');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const targetPillEl = document.getElementById('targetPill');
const nextBtn = document.getElementById('next');

let pattern = [];
let answer = null;
let locked = false;
let score = 0;
let streak = 0;
let hiddenIndex = 0;

function level() {
  return localStorage.getItem('bgames:difficulty') || 'large';
}

function config() {
  const l = level();
  if (l === 'small') return { total: 6, motif: 3, choices: 5 };
  if (l === 'medium') return { total: 5, motif: 3, choices: 4 };
  return { total: 4, motif: 2, choices: 4 };
}

function shuffle(values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function renderPattern() {
  patternView.innerHTML = '';
  patternView.style.gridTemplateColumns = `repeat(${pattern.length}, minmax(0, 1fr))`;
  pattern.forEach((item, index) => {
    const tile = document.createElement('div');
    tile.className = 'tile large';
    tile.style.background = item.color;
    tile.style.color = '#16304b';
    tile.textContent = index === hiddenIndex ? '❓' : item.icon;
    patternView.appendChild(tile);
  });
}

function renderChoices() {
  choicesEl.innerHTML = '';
  choicesEl.style.gridTemplateColumns = `repeat(${Math.min(choices.length, 4)}, minmax(0, 1fr))`;
  for (const item of choices) {
    const btn = document.createElement('button');
    btn.className = 'tile large';
    btn.style.background = item.color;
    btn.style.color = '#16304b';
    btn.textContent = item.icon;
    btn.addEventListener('click', () => {
      if (locked) return;
      const ok = item.id === answer.id;
      if (ok) {
        locked = true;
        score += 1;
        streak += 1;
        scoreEl.textContent = String(score);
        streakEl.textContent = String(streak);
        feedbackEl.textContent = streak >= 2 ? `Great pattern streak x${streak}!` : 'Nice pattern match.';
        targetPillEl.textContent = `Pattern: ${answer.icon} next`;
        window.bgamesSound?.play('good');
        window.bgamesSound?.say('Great pattern!');
        patternView.classList.add('celebrate');
        setTimeout(() => patternView.classList.remove('celebrate'), 350);
        setTimeout(() => {
          locked = false;
          buildRound();
        }, 800);
      } else {
        streak = 0;
        streakEl.textContent = '0';
        feedbackEl.textContent = 'Oops. Look for the repeating part of the pattern.';
        window.bgamesSound?.play('bad');
      }
    });
    choicesEl.appendChild(btn);
  }
}

function buildRound() {
  const cfg = config();
  const motif = shuffle(BANK).slice(0, cfg.motif);
  const offset = Math.floor(Math.random() * motif.length);
  const fullSequence = [];
  while (fullSequence.length < cfg.total + cfg.motif + 1) {
    const idx = (fullSequence.length + offset) % motif.length;
    fullSequence.push(motif[idx]);
  }
  pattern = fullSequence.slice(0, cfg.total);
  hiddenIndex = Math.max(1, Math.floor(Math.random() * cfg.total));
  answer = pattern[hiddenIndex];
  const pool = shuffle([
    ...motif,
    ...shuffle(BANK).filter((item) => item.id !== answer.id)
  ]).filter((item, index, arr) => arr.findIndex((x) => x.id === item.id) === index);
  choices = shuffle([answer, ...pool]).slice(0, cfg.choices);
  if (!choices.some((item) => item.id === answer.id)) {
    choices[0] = answer;
  }
  promptEl.textContent = 'What comes next in the pattern?';
  feedbackEl.textContent = 'Tap the matching picture.';
  targetPillEl.textContent = `Pattern: ${pattern.map((item, index) => (index === hiddenIndex ? '❓' : item.icon)).join(' ')}`;
  renderPattern();
  renderChoices();
}

let choices = [];

nextBtn.addEventListener('click', () => {
  locked = false;
  streak = 0;
  streakEl.textContent = '0';
  buildRound();
});

buildRound();
