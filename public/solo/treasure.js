const boardEl = document.getElementById('board');
const stepEl = document.getElementById('step');
const winsEl = document.getElementById('wins');
const goalPillEl = document.getElementById('goalPill');
const promptEl = document.getElementById('prompt');
const feedbackEl = document.getElementById('feedback');
const newRoundBtn = document.getElementById('newRound');

const LANDMARKS = [
  { icon: '🌴', label: 'palm tree' },
  { icon: '🪨', label: 'big rock' },
  { icon: '⛵', label: 'boat' },
  { icon: '🐟', label: 'fish' },
  { icon: '🦀', label: 'crab' },
  { icon: '🦜', label: 'parrot' },
  { icon: '🌊', label: 'waves' },
  { icon: '🪙', label: 'coin' },
  { icon: '🧭', label: 'compass' },
  { icon: '🏝️', label: 'island' }
];

let cells = [];
let route = [];
let currentStep = 0;
let wins = 0;
let roundLocked = false;

function level() {
  return localStorage.getItem('bgames:difficulty') || 'large';
}

function config() {
  const l = level();
  if (l === 'small') return { cols: 5, rows: 5, steps: 6 };
  if (l === 'medium') return { cols: 4, rows: 4, steps: 5 };
  return { cols: 4, rows: 3, steps: 4 };
}

function keyOf(col, row) {
  return `${col},${row}`;
}

function neighbors(col, row, cols, rows) {
  const points = [
    { col: col - 1, row },
    { col: col + 1, row },
    { col, row: row - 1 },
    { col, row: row + 1 }
  ];
  return points.filter((p) => p.col >= 0 && p.row >= 0 && p.col < cols && p.row < rows);
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildRoute(cols, rows, steps) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const start = { col: Math.floor(Math.random() * cols), row: Math.floor(Math.random() * rows) };
    const used = new Set([keyOf(start.col, start.row)]);
    const seq = [keyOf(start.col, start.row)];
    let cursor = start;
    while (seq.length < steps) {
      const options = shuffle(neighbors(cursor.col, cursor.row, cols, rows))
        .filter((p) => !used.has(keyOf(p.col, p.row)));
      if (!options.length) break;
      const next = options[0];
      const nextKey = keyOf(next.col, next.row);
      seq.push(nextKey);
      used.add(nextKey);
      cursor = next;
    }
    if (seq.length === steps) return seq;
  }
  return [];
}

function cellByKey(key) {
  return cells.find((cell) => cell.dataset.key === key);
}

function paintCell(cell, className, text) {
  cell.className = `tile medium treasure-cell ${className}`;
  cell.textContent = text;
}

function renderBoard() {
  cells.forEach((cell) => paintCell(cell, '', cell.dataset.landmarkIcon));
  route.forEach((key, idx) => {
    const cell = cellByKey(key);
    if (!cell) return;
    if (idx === 0) {
      paintCell(cell, 'treasure-start', 'S');
      return;
    }
    if (idx < currentStep) {
      paintCell(cell, 'treasure-done', String(idx));
      return;
    }
    if (idx === route.length - 1) {
      paintCell(cell, 'treasure-goal', '🏆');
    }
  });
}

function nextClueText() {
  const nextIndex = currentStep;
  if (nextIndex >= route.length) return 'Treasure found!';
  const key = route[nextIndex];
  const cell = cellByKey(key);
  if (!cell) return 'Follow the map.';
  return `Next clue: ${cell.dataset.landmarkLabel}`;
}

function handleTap(key) {
  if (roundLocked) return;
  if (currentStep >= route.length) return;
  const expected = route[currentStep];
  if (key === expected) {
    window.bgamesSound?.play('good');
    currentStep += 1;
    stepEl.textContent = `${currentStep}/${route.length}`;
    feedbackEl.textContent = nextClueText();
    renderBoard();
    if (currentStep === route.length) {
      roundLocked = true;
      wins += 1;
      winsEl.textContent = String(wins);
      feedbackEl.textContent = 'Treasure found. Amazing map reading!';
      boardEl.classList.add('celebrate');
      setTimeout(() => boardEl.classList.remove('celebrate'), 400);
      window.bgamesSound?.play('win');
      window.bgamesSound?.say('Treasure found!');
    }
    return;
  }

  window.bgamesSound?.play('bad');
  currentStep = 0;
  stepEl.textContent = `0/${route.length}`;
  feedbackEl.textContent = 'Oops. Start again from S.';
  renderBoard();
}

function startRound() {
  roundLocked = false;
  const cfg = config();
  route = buildRoute(cfg.cols, cfg.rows, cfg.steps);
  if (!route.length) {
    setTimeout(startRound, 100);
    return;
  }

  cells = [];
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = `repeat(${cfg.cols}, minmax(0, 1fr))`;
  const shuffledLandmarks = shuffle(LANDMARKS);
  for (let row = 0; row < cfg.rows; row += 1) {
    for (let col = 0; col < cfg.cols; col += 1) {
      const item = shuffledLandmarks[(row * cfg.cols + col) % shuffledLandmarks.length];
      const cell = document.createElement('button');
      cell.className = 'tile medium treasure-cell';
      cell.dataset.key = keyOf(col, row);
      cell.dataset.landmarkIcon = item.icon;
      cell.dataset.landmarkLabel = item.label;
      cell.textContent = item.icon;
      cell.addEventListener('click', () => handleTap(cell.dataset.key));
      boardEl.appendChild(cell);
      cells.push(cell);
    }
  }

  currentStep = 0;
  stepEl.textContent = `0/${route.length}`;
  goalPillEl.textContent = `Goal: ${route.length} clues`;
  promptEl.textContent = 'Tap landmarks in route order from START to TREASURE.';
  feedbackEl.textContent = 'First clue: START tile (S).';
  renderBoard();
}

newRoundBtn.addEventListener('click', startRound);
startRound();
