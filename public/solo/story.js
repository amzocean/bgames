const boardEl = document.getElementById('board');
const matchesEl = document.getElementById('matches');
const streakEl = document.getElementById('streak');
const pairsPillEl = document.getElementById('pairsPill');
const feedbackEl = document.getElementById('feedback');
const newRoundBtn = document.getElementById('newRound');

const STORY_PAIRS = [
  [{ icon: '🌧️', label: 'rain' }, { icon: '☂️', label: 'umbrella' }],
  [{ icon: '🐝', label: 'bee' }, { icon: '🌸', label: 'flower' }],
  [{ icon: '🚗', label: 'car' }, { icon: '⛽', label: 'fuel' }],
  [{ icon: '🦷', label: 'tooth' }, { icon: '🪥', label: 'toothbrush' }],
  [{ icon: '📚', label: 'books' }, { icon: '🎒', label: 'school bag' }],
  [{ icon: '🌙', label: 'night' }, { icon: '😴', label: 'sleep' }],
  [{ icon: '🎂', label: 'cake' }, { icon: '🎉', label: 'party' }],
  [{ icon: '⚽', label: 'ball' }, { icon: '🥅', label: 'goal' }],
  [{ icon: '🧊', label: 'ice' }, { icon: '🥤', label: 'drink' }],
  [{ icon: '🗺️', label: 'map' }, { icon: '🧭', label: 'compass' }]
];

let cards = [];
let selected = null;
let matches = 0;
let streak = 0;
let totalPairs = 0;
let lock = false;

function level() {
  return localStorage.getItem('bgames:difficulty') || 'large';
}

function pairCount() {
  const l = level();
  if (l === 'small') return 6;
  if (l === 'medium') return 5;
  return 4;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function render() {
  boardEl.innerHTML = '';
  const cols = Math.ceil(Math.sqrt(cards.length));
  boardEl.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

  cards.forEach((card) => {
    const btn = document.createElement('button');
    btn.className = 'tile large story-card';
    btn.disabled = card.done;
    btn.style.opacity = card.done ? '0.35' : '1';
    if (selected && selected.id === card.id && !card.done) {
      btn.classList.add('story-selected');
    }
    btn.innerHTML = `<div class="story-card-icon">${card.icon}</div><div class="story-card-label">${card.label}</div>`;
    btn.addEventListener('click', () => selectCard(card));
    boardEl.appendChild(btn);
  });
}

function completeRound() {
  feedbackEl.textContent = 'All story pairs matched!';
  boardEl.classList.add('celebrate');
  setTimeout(() => boardEl.classList.remove('celebrate'), 380);
  window.bgamesSound?.play('win');
  window.bgamesSound?.say('Amazing story matching!');
}

function selectCard(card) {
  if (lock || card.done) return;

  if (!selected) {
    selected = card;
    feedbackEl.textContent = `Picked: ${card.label}. Find its story partner.`;
    render();
    return;
  }

  if (selected.id === card.id) return;

  const ok = selected.pairId === card.pairId;
  if (ok) {
    card.done = true;
    selected.done = true;
    selected = null;
    matches += 1;
    streak += 1;
    matchesEl.textContent = String(matches);
    streakEl.textContent = String(streak);
    feedbackEl.textContent = streak >= 2 ? `Great chain x${streak}!` : 'Nice story match.';
    window.bgamesSound?.play('good');
    render();
    if (matches === totalPairs) completeRound();
    return;
  }

  lock = true;
  streak = 0;
  streakEl.textContent = '0';
  feedbackEl.textContent = 'Not that pair. Try another partner.';
  window.bgamesSound?.play('bad');
  selected = null;
  render();
  setTimeout(() => {
    lock = false;
  }, 250);
}

function startRound() {
  selected = null;
  lock = false;
  matches = 0;
  streak = 0;
  matchesEl.textContent = '0';
  streakEl.textContent = '0';

  const pickedPairs = shuffle(STORY_PAIRS).slice(0, pairCount());
  totalPairs = pickedPairs.length;
  pairsPillEl.textContent = `Pairs: ${totalPairs}`;

  cards = pickedPairs.flatMap((pair, idx) => ([
    { id: `a-${idx}`, pairId: idx, icon: pair[0].icon, label: pair[0].label, done: false },
    { id: `b-${idx}`, pairId: idx, icon: pair[1].icon, label: pair[1].label, done: false }
  ]));
  cards = shuffle(cards);
  feedbackEl.textContent = 'Tap one card, then its matching story card.';
  render();
}

newRoundBtn.addEventListener('click', startRound);
startRound();
