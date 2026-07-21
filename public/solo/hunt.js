const bank = [
  { id: '1', icon: '1️⃣', label: 'number 1' },
  { id: '2', icon: '2️⃣', label: 'number 2' },
  { id: '3', icon: '3️⃣', label: 'number 3' },
  { id: '4', icon: '4️⃣', label: 'number 4' },
  { id: 'a', icon: '🅰️', label: 'letter A' },
  { id: 'b', icon: '🅱️', label: 'letter B' },
  { id: 'cat', icon: '🐱', label: 'cat' },
  { id: 'dog', icon: '🐶', label: 'dog' },
  { id: 'fish', icon: '🐟', label: 'fish' },
  { id: 'star', icon: '⭐', label: 'star' },
  { id: 'ball', icon: '⚽', label: 'ball' },
  { id: 'moon', icon: '🌙', label: 'moon' }
];
const board = document.getElementById('board');
const promptEl = document.getElementById('prompt');
const feedbackEl = document.getElementById('feedback');
const foundEl = document.getElementById('found');
const leftEl = document.getElementById('left');
const targetPillEl = document.getElementById('targetPill');
const nextBtn = document.getElementById('next');

let target = bank[0];
let found = 0;
let totalTargets = 0;

function level() {
  return localStorage.getItem('bgames:difficulty') || 'large';
}

function config() {
  const l = level();
  if (l === 'small') return { cols: 8, rows: 6 };
  if (l === 'medium') return { cols: 7, rows: 5 };
  return { cols: 6, rows: 4 };
}

function sizeClass() {
  return level();
}

function startRound() {
  const cfg = config();
  board.style.gridTemplateColumns = `repeat(${cfg.cols}, minmax(0, 1fr))`;
  board.innerHTML = '';
  found = 0;
  totalTargets = 0;
  foundEl.textContent = '0';
  leftEl.textContent = '0';
  feedbackEl.textContent = 'Warm-up round.';
  target = bank[Math.floor(Math.random() * bank.length)];
  promptEl.textContent = `Tap every ${target.label} ${target.icon} you see.`;
  targetPillEl.textContent = `Target: ${target.icon} ${target.label}`;

  const total = cfg.cols * cfg.rows;
  const targetMin = 3;
  let placedTargets = 0;
  for (let i = 0; i < total; i += 1) {
    const item = (Math.random() < 0.16 || (placedTargets < targetMin && i < targetMin))
      ? target
      : bank[Math.floor(Math.random() * bank.length)];
    if (item.id === target.id) {
      placedTargets += 1;
      totalTargets += 1;
    }
    const btn = document.createElement('button');
    btn.className = `tile ${sizeClass()}`;
    btn.textContent = item.icon;
    btn.dataset.itemId = item.id;
    btn.addEventListener('click', () => {
      const ok = btn.dataset.itemId === target.id;
      if (ok && !btn.disabled) {
        window.bgamesSound?.play('good');
        btn.disabled = true;
        btn.style.opacity = 0.35;
        found += 1;
        foundEl.textContent = String(found);
        leftEl.textContent = String(Math.max(0, totalTargets - found));
        feedbackEl.textContent = found === totalTargets ? 'Perfect round. You found them all.' : 'Nice scan.';
        if (found === totalTargets) {
          board.classList.add('celebrate');
          setTimeout(() => board.classList.remove('celebrate'), 400);
          window.bgamesSound?.play('win');
          window.bgamesSound?.say('You found all of them. Great job!');
        }
      } else if (!ok) {
        window.bgamesSound?.play('bad');
        feedbackEl.textContent = 'Try again. Match the icon exactly.';
      }
    });
    board.appendChild(btn);
  }
  leftEl.textContent = String(totalTargets);
}

nextBtn.addEventListener('click', startRound);
startRound();
