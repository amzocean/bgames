const ITEMS = [
  { id: 'apple', icon: '🍎', label: 'apple' },
  { id: 'car', icon: '🚗', label: 'car' },
  { id: 'star', icon: '⭐', label: 'star' },
  { id: 'fish', icon: '🐟', label: 'fish' },
  { id: 'moon', icon: '🌙', label: 'moon' },
  { id: 'ball', icon: '⚽', label: 'ball' },
  { id: 'cat', icon: '🐱', label: 'cat' },
  { id: 'flower', icon: '🌸', label: 'flower' }
];
const boardEl = document.getElementById('board');
const promptEl = document.getElementById('prompt');
const feedbackEl = document.getElementById('feedback');
const scoreEl = document.getElementById('score');
const remainingEl = document.getElementById('remaining');
const targetPillEl = document.getElementById('targetPill');
const newRoundBtn = document.getElementById('newRound');
const celebrationEl = document.getElementById('celebration');

let score = 0;
let target = ITEMS[0];
let targetsRemaining = 0;
let roundComplete = false;

function getDifficulty() {
  return localStorage.getItem('bgames:difficulty') || 'large';
}

function sizeClass() {
  return getDifficulty();
}

function boardConfig() {
  const level = getDifficulty();
  if (level === 'small') return { cols: 7, rows: 6, distractors: 7 };
  if (level === 'medium') return { cols: 6, rows: 5, distractors: 6 };
  return { cols: 5, rows: 4, distractors: 5 };
}

function showCelebration() {
  celebrationEl.classList.remove('show');
  void celebrationEl.offsetWidth;
  celebrationEl.classList.add('show');
  window.bgamesSound?.play('win');
  window.bgamesSound?.say('Great job! You found everything!');
  setTimeout(() => celebrationEl.classList.remove('show'), 1400);
}

function newRound() {
  boardEl.innerHTML = '';
  roundComplete = false;
  const cfg = boardConfig();
  boardEl.style.gridTemplateColumns = `repeat(${cfg.cols}, minmax(0, 1fr))`;

  target = ITEMS[Math.floor(Math.random() * ITEMS.length)];
  promptEl.textContent = `Tap every ${target.label} you can spot.`;
  targetPillEl.textContent = `Target: ${target.icon} ${target.label}`;
  feedbackEl.textContent = 'Tip: scan left to right, then top to bottom.';

  const cells = [];
  const cellCount = cfg.cols * cfg.rows;
  for (let i = 0; i < cellCount; i += 1) {
    const item = Math.random() < 0.22 ? target : ITEMS[Math.floor(Math.random() * cfg.distractors)];
    cells.push(item);
  }
  if (!cells.some((item) => item.id === target.id)) {
    cells[Math.floor(Math.random() * cells.length)] = target;
  }
  targetsRemaining = cells.filter((item) => item.id === target.id).length;
  remainingEl.textContent = String(targetsRemaining);

  for (const item of cells) {
    const btn = document.createElement('button');
    btn.className = `tile ${sizeClass()}`;
    btn.textContent = item.icon;
    btn.dataset.itemId = item.id;
    btn.addEventListener('click', () => {
      if (roundComplete) return;
      const ok = btn.dataset.itemId === target.id;
      if (ok) {
        window.bgamesSound?.play('good');
        score += 1;
        scoreEl.textContent = String(score);
        btn.disabled = true;
        btn.style.opacity = 0.35;
        targetsRemaining -= 1;
        remainingEl.textContent = String(targetsRemaining);
        feedbackEl.textContent = targetsRemaining > 0 ? 'Great find. Keep going.' : 'Awesome. You found them all.';
        if (targetsRemaining === 0) {
          roundComplete = true;
          [...boardEl.children].forEach((tile) => { tile.disabled = true; });
          boardEl.classList.add('celebrate');
          setTimeout(() => boardEl.classList.remove('celebrate'), 450);
          showCelebration();
        }
      } else {
        window.bgamesSound?.play('bad');
        feedbackEl.textContent = 'Oops. Try again and look for the exact icon.';
      }
    });
    boardEl.appendChild(btn);
  }
  window.bgamesSound?.speakSoloIntro?.();
}

newRoundBtn.addEventListener('click', newRound);
newRound();
