const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const targetPillEl = document.getElementById('targetPill');
const feedbackEl = document.getElementById('feedback');
const hearClueBtn = document.getElementById('hearClue');
const newRoundBtn = document.getElementById('newRound');

const BANK = [
  { id: 'cat', icon: '🐱', label: 'cat', clue: 'Find the cat.' },
  { id: 'dog', icon: '🐶', label: 'dog', clue: 'Find the dog.' },
  { id: 'rocket', icon: '🚀', label: 'rocket', clue: 'Find the rocket.' },
  { id: 'fish', icon: '🐟', label: 'fish', clue: 'Find the fish.' },
  { id: 'moon', icon: '🌙', label: 'moon', clue: 'Find the moon.' },
  { id: 'star', icon: '⭐', label: 'star', clue: 'Find the star.' },
  { id: 'apple', icon: '🍎', label: 'apple', clue: 'Find the apple.' },
  { id: 'ball', icon: '⚽', label: 'ball', clue: 'Find the ball.' },
  { id: 'car', icon: '🚗', label: 'car', clue: 'Find the car.' },
  { id: 'flower', icon: '🌸', label: 'flower', clue: 'Find the flower.' }
];

let target = null;
let score = 0;
let streak = 0;
let locked = false;

function level() {
  return localStorage.getItem('bgames:difficulty') || 'large';
}

function choiceCount() {
  const l = level();
  if (l === 'small') return 8;
  if (l === 'medium') return 6;
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

function sayClue() {
  if (!target) return;
  window.bgamesSound?.say(target.clue);
}

function makeRound() {
  locked = false;
  boardEl.innerHTML = '';
  const count = choiceCount();
  const pool = shuffle(BANK);
  target = pool[0];
  const picks = shuffle([target, ...pool.slice(1, count)]).slice(0, count);
  if (!picks.some((p) => p.id === target.id)) picks[0] = target;

  targetPillEl.textContent = `Clue: ${target.label}`;
  feedbackEl.textContent = 'Listen, then tap the match.';
  boardEl.style.gridTemplateColumns = `repeat(${Math.min(4, count)}, minmax(0, 1fr))`;

  picks.forEach((item) => {
    const btn = document.createElement('button');
    btn.className = 'tile large';
    btn.innerHTML = `<div class="sound-choice-icon">${item.icon}</div><div class="sound-choice-label">${item.label}</div>`;
    btn.addEventListener('click', () => {
      if (locked) return;
      const ok = item.id === target.id;
      if (ok) {
        locked = true;
        score += 1;
        streak += 1;
        scoreEl.textContent = String(score);
        streakEl.textContent = String(streak);
        feedbackEl.textContent = 'Great listening. You found it.';
        window.bgamesSound?.play('good');
        window.bgamesSound?.say('Great listening!');
        btn.classList.add('celebrate');
        setTimeout(() => btn.classList.remove('celebrate'), 300);
        setTimeout(() => {
          locked = false;
          makeRound();
        }, 850);
      } else {
        streak = 0;
        streakEl.textContent = '0';
        feedbackEl.textContent = 'Not that one. Hear the clue again.';
        window.bgamesSound?.play('bad');
      }
    });
    boardEl.appendChild(btn);
  });
  window.bgamesSound?.speakSoloIntro?.();
}

hearClueBtn.addEventListener('click', sayClue);
newRoundBtn.addEventListener('click', makeRound);
makeRound();
