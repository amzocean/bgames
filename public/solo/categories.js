const sortedEl = document.getElementById('sorted');
const streakEl = document.getElementById('streak');
const feedbackEl = document.getElementById('feedback');
const goalPillEl = document.getElementById('goalPill');
const trayEl = document.getElementById('tray');
const bucketAEl = document.getElementById('bucketA');
const bucketBEl = document.getElementById('bucketB');
const newRoundBtn = document.getElementById('newRound');

const SETS = [
  {
    a: { name: 'Animals', icon: '🐾' },
    b: { name: 'Vehicles', icon: '🚗' },
    items: [
      { icon: '🐶', label: 'dog', category: 'a' },
      { icon: '🐱', label: 'cat', category: 'a' },
      { icon: '🐟', label: 'fish', category: 'a' },
      { icon: '🦊', label: 'fox', category: 'a' },
      { icon: '🚗', label: 'car', category: 'b' },
      { icon: '🚌', label: 'bus', category: 'b' },
      { icon: '🚲', label: 'bike', category: 'b' },
      { icon: '🚀', label: 'rocket', category: 'b' }
    ]
  },
  {
    a: { name: 'Food', icon: '🍎' },
    b: { name: 'Toys', icon: '🧸' },
    items: [
      { icon: '🍎', label: 'apple', category: 'a' },
      { icon: '🍌', label: 'banana', category: 'a' },
      { icon: '🍓', label: 'strawberry', category: 'a' },
      { icon: '🍉', label: 'watermelon', category: 'a' },
      { icon: '🧸', label: 'teddy', category: 'b' },
      { icon: '⚽', label: 'ball', category: 'b' },
      { icon: '🪁', label: 'kite', category: 'b' },
      { icon: '🧩', label: 'puzzle', category: 'b' }
    ]
  }
];

let currentSet = null;
let cards = [];
let selectedCardId = null;
let sorted = 0;
let streak = 0;

function level() {
  return localStorage.getItem('bgames:difficulty') || 'large';
}

function itemCount() {
  const d = level();
  if (d === 'small') return 8;
  if (d === 'medium') return 6;
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

function updateHud() {
  sortedEl.textContent = `${sorted}/${cards.length}`;
  streakEl.textContent = String(streak);
  goalPillEl.textContent = `Goal: Sort all ${cards.length} cards`;
}

function renderTray() {
  trayEl.innerHTML = '';
  const cols = cards.length <= 4 ? 4 : Math.min(4, cards.length);
  trayEl.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
  cards.forEach((card) => {
    const btn = document.createElement('button');
    btn.className = 'tile large';
    btn.dataset.id = card.id;
    btn.disabled = card.done;
    btn.style.opacity = card.done ? '0.3' : '1';
    if (!card.done && selectedCardId === card.id) btn.classList.add('scene-selected');
    btn.innerHTML = `<div class="category-icon">${card.icon}</div><div class="category-label">${card.label}</div>`;
    btn.addEventListener('click', () => {
      if (card.done) return;
      selectedCardId = card.id;
      feedbackEl.textContent = `Now choose bucket: ${card.label}`;
      renderTray();
    });
    trayEl.appendChild(btn);
  });
}

function completeRound() {
  feedbackEl.textContent = 'All sorted. Amazing categorizing!';
  trayEl.classList.add('celebrate');
  setTimeout(() => trayEl.classList.remove('celebrate'), 360);
  window.bgamesSound?.play('win');
  window.bgamesSound?.say('Great sorting!');
}

function sortInto(bucket) {
  if (!selectedCardId) {
    feedbackEl.textContent = 'Pick a card first.';
    return;
  }
  const card = cards.find((c) => c.id === selectedCardId);
  if (!card || card.done) return;
  const ok = card.category === bucket;
  if (!ok) {
    streak = 0;
    feedbackEl.textContent = 'Not this bucket. Try the other one.';
    window.bgamesSound?.play('bad');
    updateHud();
    return;
  }

  card.done = true;
  selectedCardId = null;
  sorted += 1;
  streak += 1;
  updateHud();
  feedbackEl.textContent = streak >= 2 ? `Great sort streak x${streak}!` : 'Correct bucket.';
  window.bgamesSound?.play('good');
  renderTray();
  if (sorted === cards.length) completeRound();
}

function startRound() {
  const set = shuffle(SETS)[0];
  currentSet = set;
  const picked = shuffle(set.items).slice(0, itemCount());
  cards = picked.map((item, idx) => ({ ...item, id: `card-${idx}`, done: false }));
  selectedCardId = null;
  sorted = 0;
  streak = 0;

  bucketAEl.innerHTML = `<div class="category-bucket-icon">${set.a.icon}</div><div class="category-bucket-label">${set.a.name}</div>`;
  bucketBEl.innerHTML = `<div class="category-bucket-icon">${set.b.icon}</div><div class="category-bucket-label">${set.b.name}</div>`;
  feedbackEl.textContent = 'Pick a card, then pick its category bucket.';
  updateHud();
  renderTray();
}

bucketAEl.addEventListener('click', () => sortInto('a'));
bucketBEl.addEventListener('click', () => sortInto('b'));
newRoundBtn.addEventListener('click', startRound);

startRound();
