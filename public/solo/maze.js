const boardEl = document.getElementById('board');
const progressEl = document.getElementById('progress');
const winsEl = document.getElementById('wins');
const goalPillEl = document.getElementById('goalPill');
const feedbackEl = document.getElementById('feedback');
const newRoundBtn = document.getElementById('newRound');

let cells = [];
let path = [];
let currentStep = 0;
let wins = 0;
let revealMode = true;
let roundLocked = false;

function level() {
  return localStorage.getItem('bgames:difficulty') || 'large';
}

function config() {
  const l = level();
  if (l === 'small') return { cols: 6, rows: 6, pathLen: 11, revealMs: 1300 };
  if (l === 'medium') return { cols: 5, rows: 5, pathLen: 9, revealMs: 1500 };
  return { cols: 4, rows: 4, pathLen: 7, revealMs: 1700 };
}

function keyOf(col, row) {
  return `${col},${row}`;
}

function parseKey(key) {
  const [col, row] = key.split(',').map(Number);
  return { col, row };
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

function buildPath(cols, rows, pathLen) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const start = { col: Math.floor(Math.random() * cols), row: Math.floor(Math.random() * rows) };
    const used = new Set([keyOf(start.col, start.row)]);
    const seq = [keyOf(start.col, start.row)];
    let cursor = start;

    while (seq.length < pathLen) {
      const options = shuffle(neighbors(cursor.col, cursor.row, cols, rows))
        .filter((p) => !used.has(keyOf(p.col, p.row)));
      if (!options.length) break;
      const next = options[0];
      const nextKey = keyOf(next.col, next.row);
      seq.push(nextKey);
      used.add(nextKey);
      cursor = next;
    }
    if (seq.length >= pathLen) return seq;
  }
  return [];
}

function buildGrid(cols, rows) {
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
  cells = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const key = keyOf(col, row);
      const btn = document.createElement('button');
      btn.className = 'tile medium maze-cell';
      btn.dataset.key = key;
      btn.textContent = '';
      btn.addEventListener('click', () => handleTap(btn.dataset.key));
      boardEl.appendChild(btn);
      cells.push(btn);
    }
  }
}

function cellByKey(key) {
  return cells.find((c) => c.dataset.key === key);
}

function resetCellStyle(cell) {
  cell.classList.remove('maze-start', 'maze-goal', 'maze-reveal', 'maze-current', 'maze-step-done');
  cell.textContent = '';
}

function render() {
  cells.forEach(resetCellStyle);
  if (!path.length) return;

  const start = path[0];
  const goal = path[path.length - 1];
  const currentKey = path[currentStep];
  const startCell = cellByKey(start);
  const goalCell = cellByKey(goal);
  if (startCell) {
    startCell.classList.add('maze-start');
    startCell.textContent = 'S';
  }
  if (goalCell) {
    goalCell.classList.add('maze-goal');
    goalCell.textContent = '🏆';
  }

  if (revealMode) {
    path.forEach((k, idx) => {
      const cell = cellByKey(k);
      if (!cell) return;
      cell.classList.add('maze-reveal');
      if (idx !== 0 && idx !== path.length - 1) cell.textContent = '•';
    });
    return;
  }

  for (let i = 0; i < currentStep; i += 1) {
    const done = cellByKey(path[i]);
    if (done) done.classList.add('maze-step-done');
  }

  const current = cellByKey(currentKey);
  if (current) {
    current.classList.add('maze-current');
    if (currentKey !== start && currentKey !== goal) current.textContent = '●';
  }
}

function finishRound() {
  roundLocked = true;
  wins += 1;
  winsEl.textContent = String(wins);
  feedbackEl.textContent = 'Treasure found. Great path memory!';
  window.bgamesSound?.play('win');
  window.bgamesSound?.say('Great maze run!');
  boardEl.classList.add('celebrate');
  setTimeout(() => boardEl.classList.remove('celebrate'), 400);
}

function handleTap(key) {
  if (revealMode || roundLocked || !path.length) return;
  const expected = path[currentStep + 1];
  if (!expected) return;

  if (key === expected) {
    currentStep += 1;
    progressEl.textContent = `${currentStep}/${path.length - 1}`;
    feedbackEl.textContent = currentStep === path.length - 1 ? 'Nice finish!' : 'Great. Keep going.';
    window.bgamesSound?.play(currentStep === path.length - 1 ? 'good' : 'pop');
    render();
    if (currentStep === path.length - 1) finishRound();
    return;
  }

  currentStep = 0;
  progressEl.textContent = `0/${path.length - 1}`;
  feedbackEl.textContent = 'Path lost. Start from S again.';
  window.bgamesSound?.play('bad');
  render();
}

function startRound() {
  const cfg = config();
  roundLocked = false;
  revealMode = true;
  currentStep = 0;
  goalPillEl.textContent = `Goal: ${cfg.cols}x${cfg.rows} treasure path`;
  feedbackEl.textContent = 'Watch the path...';
  buildGrid(cfg.cols, cfg.rows);
  path = buildPath(cfg.cols, cfg.rows, cfg.pathLen);
  if (!path.length) {
    feedbackEl.textContent = 'Resetting maze...';
    setTimeout(startRound, 100);
    return;
  }
  progressEl.textContent = `0/${path.length - 1}`;
  render();

  setTimeout(() => {
    revealMode = false;
    feedbackEl.textContent = 'Now tap from S to the treasure.';
    render();
  }, cfg.revealMs);
}

newRoundBtn.addEventListener('click', startRound);
startRound();
