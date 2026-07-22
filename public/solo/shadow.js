const ICONS = [
  { id: 'bird', icon: '🐦', label: 'bird', color: '#8fd2ff' },
  { id: 'car', icon: '🚗', label: 'car', color: '#ffd166' },
  { id: 'fish', icon: '🐟', label: 'fish', color: '#73e0ff' },
  { id: 'cat', icon: '🐱', label: 'cat', color: '#ffb4db' },
  { id: 'rocket', icon: '🚀', label: 'rocket', color: '#b3a2ff' },
  { id: 'flower', icon: '🌸', label: 'flower', color: '#ff9fe1' },
  { id: 'moon', icon: '🌙', label: 'moon', color: '#9fd1ff' },
  { id: 'apple', icon: '🍎', label: 'apple', color: '#ff7f8f' }
];

const targetEl = document.getElementById('target');
const choicesEl = document.getElementById('choices');
const promptEl = document.getElementById('prompt');
const feedbackEl = document.getElementById('feedback');
const matchesEl = document.getElementById('matches');
const targetPillEl = document.getElementById('targetPill');
const newRoundBtn = document.getElementById('newRound');

let matches = 0;
let locked = false;
let answer = null;

function level() {
  return localStorage.getItem('bgames:difficulty') || 'large';
}

function choiceCount() {
  const l = level();
  if (l === 'small') return 4;
  if (l === 'medium') return 3;
  return 2;
}

function shuffle(values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function renderTarget(icon) {
  targetEl.innerHTML = '';
  targetEl.style.gridTemplateColumns = '1fr';
  const card = document.createElement('div');
  card.className = 'tile large';
  card.style.background = `linear-gradient(135deg, ${icon.color} 0%, #fff 100%)`;
  card.innerHTML = `<div class="shadow-target-label">${icon.label}</div><div class="shadow-target-icon">${icon.icon}</div>`;
  targetEl.appendChild(card);
}

function makeRound() {
  locked = false;
  choicesEl.innerHTML = '';

  const pool = shuffle(ICONS);
  answer = pool[0];
  const distractors = pool.slice(1, choiceCount());
  const choices = shuffle([answer, ...distractors]).slice(0, choiceCount());

  promptEl.textContent = 'Find the shadow that matches.';
  feedbackEl.textContent = 'Look at the shape and picture.';
  targetPillEl.textContent = `Shadow: ${answer.icon} ${answer.label}`;
  renderTarget(answer);

  choicesEl.style.gridTemplateColumns = `repeat(${choices.length}, minmax(0, 1fr))`;
  choices.forEach((item) => {
    const btn = document.createElement('button');
    btn.className = 'tile large';
    btn.innerHTML = `<div class="shadow-choice-icon" aria-hidden="true">${item.icon}</div><div class="shadow-choice-label">${item.label}</div>`;
    btn.addEventListener('click', () => {
      if (locked) return;
      const ok = item.id === answer.id;
      if (ok) {
        locked = true;
        matches += 1;
        matchesEl.textContent = String(matches);
        feedbackEl.textContent = 'Yes. That shadow matches.';
        window.bgamesSound?.play('good');
        window.bgamesSound?.say('Great match!');
        btn.classList.add('celebrate');
        setTimeout(() => btn.classList.remove('celebrate'), 300);
        setTimeout(makeRound, 800);
      } else {
        feedbackEl.textContent = 'Try again. Pick the matching shadow.';
        window.bgamesSound?.play('bad');
      }
    });
    choicesEl.appendChild(btn);
  });
}

newRoundBtn.addEventListener('click', makeRound);
makeRound();
