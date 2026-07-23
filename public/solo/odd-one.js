const GROUPS = [
  { id: 'animals', label: 'animals', items: [
    { icon: '🐶', label: 'dog' }, { icon: '🐱', label: 'cat' }, { icon: '🐰', label: 'rabbit' }, { icon: '🦊', label: 'fox' }, { icon: '🐼', label: 'panda' }
  ]},
  { id: 'food', label: 'food', items: [
    { icon: '🍎', label: 'apple' }, { icon: '🍌', label: 'banana' }, { icon: '🍓', label: 'strawberry' }, { icon: '🍉', label: 'watermelon' }, { icon: '🍇', label: 'grapes' }
  ]},
  { id: 'vehicles', label: 'vehicles', items: [
    { icon: '🚗', label: 'car' }, { icon: '🚙', label: 'jeep' }, { icon: '🚌', label: 'bus' }, { icon: '🚲', label: 'bike' }, { icon: '✈️', label: 'plane' }
  ]},
  { id: 'space', label: 'space', items: [
    { icon: '🌙', label: 'moon' }, { icon: '⭐', label: 'star' }, { icon: '🚀', label: 'rocket' }, { icon: '🪐', label: 'planet' }, { icon: '☄️', label: 'comet' }
  ]}
];

const board = document.getElementById('board');
const promptEl = document.getElementById('prompt');
const feedbackEl = document.getElementById('feedback');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const groupPillEl = document.getElementById('groupPill');
const newRoundBtn = document.getElementById('newRound');

let score = 0;
let streak = 0;
let locked = false;
let correctBtn = null;

function level() {
  return localStorage.getItem('bgames:difficulty') || 'large';
}

function config() {
  const l = level();
  if (l === 'small') return { count: 6 };
  if (l === 'medium') return { count: 5 };
  return { count: 4 };
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeRound() {
  locked = false;
  board.innerHTML = '';

  const cfg = config();
  const group = GROUPS[Math.floor(Math.random() * GROUPS.length)];
  const oddGroup = shuffle(GROUPS.filter((item) => item.id !== group.id))[0];
  const mainItems = shuffle(group.items).slice(0, cfg.count - 1);
  const oddItem = shuffle(oddGroup.items)[0];
  const tiles = shuffle([...mainItems, oddItem]);

  promptEl.textContent = 'Tap the one that does not belong.';
  feedbackEl.textContent = 'Look for the picture that feels different.';
  groupPillEl.textContent = `Group: ${group.label}`;

  tiles.forEach((item) => {
    const btn = document.createElement('button');
    btn.className = 'tile large';
    btn.textContent = item.icon;
    btn.dataset.group = group.id;
    btn.dataset.kind = item === oddItem ? 'odd' : 'group';
    btn.addEventListener('click', () => {
      if (locked) return;
      const ok = btn.dataset.kind === 'odd';
      if (ok) {
        locked = true;
        score += 1;
        streak += 1;
        scoreEl.textContent = String(score);
        streakEl.textContent = String(streak);
        feedbackEl.textContent = 'Great. That one was different.';
        window.bgamesSound?.play('good');
        window.bgamesSound?.say('Great job!');
        btn.classList.add('celebrate');
        setTimeout(() => btn.classList.remove('celebrate'), 300);
        setTimeout(makeRound, 800);
      } else {
        streak = 0;
        streakEl.textContent = '0';
        feedbackEl.textContent = 'Not quite. Find the picture that does not fit the group.';
        window.bgamesSound?.play('bad');
      }
    });
    if (btn.dataset.kind === 'odd') correctBtn = btn;
    board.appendChild(btn);
  });
  window.bgamesSound?.speakSoloIntro?.();
}

newRoundBtn.addEventListener('click', makeRound);
makeRound();
