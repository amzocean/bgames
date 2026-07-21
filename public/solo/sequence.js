const stepEl = document.getElementById('step');
const streakEl = document.getElementById('streak');
const modePillEl = document.getElementById('modePill');
const promptEl = document.getElementById('prompt');
const feedbackEl = document.getElementById('feedback');
const orderGuideEl = document.getElementById('orderGuide');
const boardEl = document.getElementById('board');
const newRoundBtn = document.getElementById('newRound');

const DATASETS = [
  {
    mode: 'small -> big',
    cardStyle: 'size',
    items: [
      { icon: '⭐', label: 'tiny', rank: 1, scale: 0.75, color: '#fff3a8' },
      { icon: '⭐', label: 'small', rank: 2, scale: 0.92, color: '#ffe873' },
      { icon: '⭐', label: 'medium', rank: 3, scale: 1.08, color: '#ffd84c' },
      { icon: '⭐', label: 'large', rank: 4, scale: 1.24, color: '#ffcb2f' },
      { icon: '⭐', label: 'giant', rank: 5, scale: 1.4, color: '#fbbf24' }
    ]
  },
  {
    mode: 'dark -> bright',
    cardStyle: 'brightness',
    items: [
      { icon: '🌙', label: 'very dark', rank: 1, bright: 0.45, color: '#9b8cff' },
      { icon: '🌙', label: 'dark', rank: 2, bright: 0.65, color: '#9b8cff' },
      { icon: '🌙', label: 'medium', rank: 3, bright: 0.85, color: '#9b8cff' },
      { icon: '🌙', label: 'bright', rank: 4, bright: 1.05, color: '#9b8cff' },
      { icon: '🌙', label: 'very bright', rank: 5, bright: 1.25, color: '#9b8cff' }
    ]
  },
  {
    mode: 'short -> long',
    cardStyle: 'length',
    items: [
      { icon: '🚗', label: 'short', rank: 1, width: 0.62, color: '#a8e7ff' },
      { icon: '🚗', label: 'small', rank: 2, width: 0.78, color: '#9bdfff' },
      { icon: '🚗', label: 'medium', rank: 3, width: 0.94, color: '#8fd7ff' },
      { icon: '🚗', label: 'long', rank: 4, width: 1.1, color: '#82cfff' },
      { icon: '🚗', label: 'very long', rank: 5, width: 1.26, color: '#74c7ff' }
    ]
  }
];

let sequence = [];
let expectedRank = 1;
let streak = 0;
let roundDone = false;

function level() {
  return localStorage.getItem('bgames:difficulty') || 'large';
}

function cardCount() {
  const l = level();
  if (l === 'small') return 5;
  if (l === 'medium') return 4;
  return 3;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function applyVisual(card, item, cardStyle) {
  card.style.background = `linear-gradient(135deg, ${item.color} 0%, #ffffff 100%)`;
  if (cardStyle === 'size') {
    card.innerHTML = `<span style="display:block; transform: scale(${item.scale});">${item.icon}</span>`;
    return;
  }
  if (cardStyle === 'brightness') {
    card.innerHTML = `<span style="display:block; filter: brightness(${item.bright});">${item.icon}</span>`;
    return;
  }
  if (cardStyle === 'length') {
    card.innerHTML = `<span style="display:block; transform: scaleX(${item.width});">${item.icon}</span>`;
    return;
  }
  card.textContent = item.icon;
}

function makeGuide(count) {
  orderGuideEl.innerHTML = '';
  orderGuideEl.style.gridTemplateColumns = `repeat(${count}, minmax(0, 1fr))`;
  for (let i = 1; i <= count; i += 1) {
    const tile = document.createElement('div');
    tile.className = 'tile medium';
    tile.style.background = '#eef6ff';
    tile.style.fontSize = '1.2rem';
    tile.textContent = String(i);
    orderGuideEl.appendChild(tile);
  }
}

function startRound() {
  roundDone = false;
  expectedRank = 1;
  stepEl.textContent = '1';
  boardEl.innerHTML = '';

  const dataset = DATASETS[Math.floor(Math.random() * DATASETS.length)];
  const total = cardCount();
  const picked = dataset.items.slice(0, total);
  sequence = shuffle(picked);

  modePillEl.textContent = `Mode: ${dataset.mode}`;
  promptEl.textContent = `Tap the cards in order: ${dataset.mode}.`;
  feedbackEl.textContent = 'Start with card 1 order.';
  boardEl.style.gridTemplateColumns = `repeat(${total}, minmax(0, 1fr))`;
  makeGuide(total);

  sequence.forEach((item) => {
    const btn = document.createElement('button');
    btn.className = 'tile large';
    applyVisual(btn, item, dataset.cardStyle);
    btn.dataset.rank = String(item.rank);
    btn.dataset.label = item.label;
    btn.addEventListener('click', () => {
      if (roundDone || btn.disabled) return;
      const rank = Number(btn.dataset.rank);
      const ok = rank === expectedRank;
      if (!ok) {
        streak = 0;
        streakEl.textContent = '0';
        feedbackEl.textContent = 'Try the next step in order.';
        window.bgamesSound?.play('bad');
        return;
      }

      window.bgamesSound?.play('good');
      btn.disabled = true;
      btn.style.opacity = 0.35;
      expectedRank += 1;
      stepEl.textContent = String(Math.min(expectedRank, total));
      feedbackEl.textContent = `Nice. ${btn.dataset.label}.`;

      if (expectedRank > total) {
        roundDone = true;
        streak += 1;
        streakEl.textContent = String(streak);
        feedbackEl.textContent = 'Perfect sequence.';
        boardEl.classList.add('celebrate');
        setTimeout(() => boardEl.classList.remove('celebrate'), 380);
        window.bgamesSound?.play('win');
        window.bgamesSound?.say('Perfect sequence!');
      }
    });
    boardEl.appendChild(btn);
  });
}

newRoundBtn.addEventListener('click', startRound);
startRound();
