const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const feedbackEl = document.getElementById('feedback');
const targetCardEl = document.getElementById('targetCard');
const choicesEl = document.getElementById('choices');
const newRoundBtn = document.getElementById('newRound');

const SHAPES = ['F', 'L', 'P', 'R', 'J', 'C', 'S', 'G', 'K', 'B', '2', '3', '4', '5', '7', '9'];

let score = 0;
let streak = 0;
let answer = '';
let locked = false;

function level() {
  return localStorage.getItem('bgames:difficulty') || 'large';
}

function choiceCount() {
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

function drawSymbol(node, symbol, mirrored) {
  node.innerHTML = `<span class="mirror-symbol${mirrored ? ' mirrored' : ''}">${symbol}</span>`;
}

function makeRound() {
  locked = false;
  choicesEl.innerHTML = '';

  const symbol = shuffle(SHAPES)[0];
  const count = choiceCount();
  const distractors = shuffle(SHAPES.filter((s) => s !== symbol)).slice(0, count - 1);
  const options = shuffle([symbol, ...distractors]);
  answer = symbol;

  drawSymbol(targetCardEl, symbol, false);
  choicesEl.style.gridTemplateColumns = `repeat(${count}, minmax(0, 1fr))`;
  feedbackEl.textContent = 'Find the flipped left-right match.';

  options.forEach((option) => {
    const btn = document.createElement('button');
    btn.className = 'tile large';
    drawSymbol(btn, option, true);
    btn.addEventListener('click', () => {
      if (locked) return;
      const ok = option === answer;
      if (ok) {
        locked = true;
        score += 1;
        streak += 1;
        scoreEl.textContent = String(score);
        streakEl.textContent = String(streak);
        feedbackEl.textContent = streak >= 2 ? `Great mirror streak x${streak}!` : 'Yes, that is the mirror.';
        btn.classList.add('spot-correct');
        window.bgamesSound?.play('good');
        window.bgamesSound?.say('Great mirror match!');
        setTimeout(() => {
          locked = false;
          makeRound();
        }, 900);
      } else {
        streak = 0;
        streakEl.textContent = '0';
        feedbackEl.textContent = 'Not that one. Compare the shape direction.';
        window.bgamesSound?.play('bad');
      }
    });
    choicesEl.appendChild(btn);
  });
  window.bgamesSound?.speakSoloIntro?.();
}

newRoundBtn.addEventListener('click', makeRound);
makeRound();
