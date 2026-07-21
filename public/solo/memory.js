const promptEl = document.getElementById('prompt');
const board = document.getElementById('board');
const stateEl = document.getElementById('state');
const matchesEl = document.getElementById('matches');
const streakEl = document.getElementById('streak');
const restartBtn = document.getElementById('restart');
const PICTURE_SET = ['🐶', '🐱', '🐰', '🦊', '🐼', '🐸', '🦁', '🐵', '🐙', '🦄', '🍎', '🍓', '🍌', '🍉', '🚗', '🚀', '⚽', '🎈'];

let first = null;
let second = null;
let lock = false;
let matches = 0;
let streak = 0;

function level() {
  return localStorage.getItem('bgames:difficulty') || 'large';
}

function pairCount() {
  const l = level();
  if (l === 'small') return 12;
  if (l === 'medium') return 10;
  return 8;
}

function sizeClass() {
  return level();
}

function shuffled(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function resetBoard() {
  first = null;
  second = null;
  lock = false;
  matches = 0;
  streak = 0;
  matchesEl.textContent = '0';
  streakEl.textContent = '0';

  const symbols = PICTURE_SET.slice(0, pairCount());
  const cards = shuffled([...symbols, ...symbols]);
  const cols = Math.ceil(Math.sqrt(cards.length));
  board.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
  board.innerHTML = '';
  promptEl.textContent = 'Peek time: remember the pictures.';
  stateEl.textContent = 'Warm-up round.';

  cards.forEach((symbol) => {
    const btn = document.createElement('button');
    btn.className = `tile ${sizeClass()}`;
    btn.dataset.symbol = symbol;
    btn.textContent = '🎴';
    btn.addEventListener('click', () => flip(btn));
    board.appendChild(btn);
  });

  setTimeout(() => {
    [...board.children].forEach((card) => {
      if (!card.disabled) card.textContent = '🎴';
    });
    stateEl.textContent = 'Go! Find matching pairs.';
  }, 1200);
}

function flip(btn) {
  if (lock || btn === first || btn.disabled) return;
  btn.textContent = btn.dataset.symbol;

  if (!first) {
    first = btn;
    return;
  }

  second = btn;
  lock = true;
  const ok = first.dataset.symbol === second.dataset.symbol;

  if (ok) {
    window.bgamesSound?.play('good');
    first.disabled = true;
    second.disabled = true;
    matches += 1;
    streak += 1;
    matchesEl.textContent = String(matches);
    streakEl.textContent = String(streak);
    stateEl.textContent = streak >= 2 ? `Amazing streak x${streak}!` : 'Great memory match.';
    first = null;
    second = null;
    lock = false;
    board.classList.add('celebrate');
    setTimeout(() => board.classList.remove('celebrate'), 300);
    if ([...board.children].every((c) => c.disabled)) {
      stateEl.textContent = 'You win! All pairs matched.';
      window.bgamesSound?.play('win');
      window.bgamesSound?.say('Amazing memory! You matched every card!');
    }
  } else {
    window.bgamesSound?.play('bad');
    streak = 0;
    streakEl.textContent = '0';
    stateEl.textContent = 'Close one. Try two nearby cards next.';
    setTimeout(() => {
      first.textContent = '🎴';
      second.textContent = '🎴';
      first = null;
      second = null;
      lock = false;
    }, 700);
  }
}

restartBtn.addEventListener('click', resetBoard);
resetBoard();
