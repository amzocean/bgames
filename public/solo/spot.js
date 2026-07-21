const leftBoardEl = document.getElementById('leftBoard');
const rightBoardEl = document.getElementById('rightBoard');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const feedbackEl = document.getElementById('feedback');
const newRoundBtn = document.getElementById('newRound');

const ICONS = ['🐶', '🐱', '🐰', '🦊', '🐼', '🐸', '🦁', '🐵', '🐟', '🌙', '⭐', '🍎', '⚽', '🚗', '🚀', '🌸'];

let score = 0;
let streak = 0;
let answerIndex = 0;
let locked = false;

function level() {
  return localStorage.getItem('bgames:difficulty') || 'large';
}

function cardCount() {
  const l = level();
  if (l === 'small') return 10;
  if (l === 'medium') return 8;
  return 6;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function renderPair(leftItems, rightItems) {
  leftBoardEl.innerHTML = '';
  rightBoardEl.innerHTML = '';
  const cols = leftItems.length <= 6 ? 3 : 4;
  leftBoardEl.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
  rightBoardEl.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

  leftItems.forEach((icon) => {
    const tile = document.createElement('div');
    tile.className = 'tile large';
    tile.textContent = icon;
    leftBoardEl.appendChild(tile);
  });

  rightItems.forEach((icon, index) => {
    const btn = document.createElement('button');
    btn.className = 'tile large';
    btn.textContent = icon;
    btn.addEventListener('click', () => {
      if (locked) return;
      const ok = index === answerIndex;
      if (ok) {
        locked = true;
        score += 1;
        streak += 1;
        scoreEl.textContent = String(score);
        streakEl.textContent = String(streak);
        feedbackEl.textContent = streak >= 2 ? `Great spotting streak x${streak}!` : 'Correct. You found the changed card.';
        btn.classList.add('spot-correct');
        window.bgamesSound?.play('good');
        window.bgamesSound?.say('Great spotting!');
        setTimeout(() => {
          locked = false;
          buildRound();
        }, 900);
      } else {
        streak = 0;
        streakEl.textContent = '0';
        feedbackEl.textContent = 'Not that one. Compare the same positions again.';
        window.bgamesSound?.play('bad');
      }
    });
    rightBoardEl.appendChild(btn);
  });
}

function buildRound() {
  locked = false;
  const total = cardCount();
  const leftItems = shuffle(ICONS).slice(0, total);
  const rightItems = [...leftItems];
  answerIndex = Math.floor(Math.random() * total);
  const replacementOptions = ICONS.filter((icon) => icon !== leftItems[answerIndex]);
  rightItems[answerIndex] = shuffle(replacementOptions)[0];
  feedbackEl.textContent = 'Scan left to right. There is only one difference.';
  renderPair(leftItems, rightItems);
}

newRoundBtn.addEventListener('click', buildRound);
buildRound();
