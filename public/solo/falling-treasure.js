const boardEl = document.getElementById('board');
const treasureEl = document.getElementById('treasure');
const bombsEl = document.getElementById('bombs');
const targetPillEl = document.getElementById('targetPill');
const feedbackEl = document.getElementById('feedback');
const newRoundBtn = document.getElementById('newRound');
const basketEl = document.getElementById('basket');
const basketButtons = [...document.querySelectorAll('[data-basket-lane]')];

const GOOD_ICONS = ['💎', '🪙', '💰'];
const BAD_ICONS = ['💣', '🪨', '☄️'];

let roundToken = 0;
let treasureCaught = 0;
let bombsHit = 0;
let treasureNeeded = 0;
let activeItems = 0;
let basketLane = 1;
let spawnTimer = null;

function level() {
  return localStorage.getItem('bgames:difficulty') || 'large';
}

function config() {
  const l = level();
  if (l === 'small') return { total: 11, treasure: 5, lanes: 3, speed: 1700, gap: 680 };
  if (l === 'medium') return { total: 9, treasure: 4, lanes: 3, speed: 1900, gap: 760 };
  return { total: 7, treasure: 3, lanes: 3, speed: 2200, gap: 840 };
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function clearBoard() {
  if (spawnTimer) clearTimeout(spawnTimer);
  spawnTimer = null;
  boardEl.innerHTML = '';
}

function updateHud() {
  treasureEl.textContent = String(treasureCaught);
  bombsEl.textContent = String(bombsHit);
  targetPillEl.textContent = `Catch ${treasureNeeded} treasure`;
}

function setBasketLane(nextLane) {
  const cfg = config();
  basketLane = Math.max(0, Math.min(cfg.lanes - 1, nextLane));
  basketButtons.forEach((btn) => {
    btn.classList.toggle('active', Number(btn.dataset.basketLane) === basketLane);
  });
  basketEl.style.left = `calc(${(100 / cfg.lanes) * basketLane}% + 2%)`;
  basketEl.style.width = `calc(${100 / cfg.lanes}% - 4%)`;
}

function createWave() {
  const cfg = config();
  treasureNeeded = cfg.treasure;
  const items = [
    ...Array.from({ length: cfg.treasure }, () => ({ type: 'treasure', icon: shuffle(GOOD_ICONS)[0] })),
    ...Array.from({ length: cfg.total - cfg.treasure }, () => ({ type: 'bomb', icon: shuffle(BAD_ICONS)[0] }))
  ];
  return shuffle(items);
}

function finishWave(success) {
  if (success) {
    feedbackEl.textContent = 'Treasure found. Great basket work!';
    window.bgamesSound?.play('win');
    window.bgamesSound?.say('Treasure found!');
  } else {
    feedbackEl.textContent = 'New wave. Move the basket to the treasure.';
    window.bgamesSound?.play('good');
  }
  roundToken += 1;
  setTimeout(() => startWave(), 1100);
}

function handleLand(item, node) {
  if (node.dataset.resolved === '1') return;
  node.dataset.resolved = '1';
  if (item.type === 'treasure') {
    treasureCaught += 1;
    feedbackEl.textContent = treasureCaught >= treasureNeeded ? 'Last treasure! Keep catching!' : 'Treasure caught!';
    window.bgamesSound?.play('good');
    window.bgamesSound?.say('Treasure caught!');
  } else {
    bombsHit += 1;
    feedbackEl.textContent = 'Boom. Keep the basket away from bombs!';
    window.bgamesSound?.play('bad');
  }
  updateHud();
  node.classList.add(item.type === 'treasure' ? 'falling-caught' : 'falling-bad-hit');
  setTimeout(() => node.remove(), 200);
  activeItems -= 1;
  if (activeItems === 0 && treasureCaught >= treasureNeeded) finishWave(true);
  if (activeItems === 0 && treasureCaught < treasureNeeded) finishWave(false);
}

function spawnItem(item, cfg, index) {
  activeItems += 1;
  const laneWidth = 100 / cfg.lanes;
  const lane = index % cfg.lanes;
  const node = document.createElement('button');
  node.type = 'button';
  node.className = `falling-item ${item.type === 'treasure' ? 'treasure' : 'bomb'}`;
  node.dataset.resolved = '0';
  node.innerHTML = `<span>${item.icon}</span>`;
  node.style.left = `calc(${lane * laneWidth}% + ${laneWidth * 0.16}%)`;
  node.style.width = `calc(${laneWidth}% - ${laneWidth * 0.32}%)`;
  node.style.setProperty('--fall-duration', `${cfg.speed}ms`);
  boardEl.appendChild(node);

  requestAnimationFrame(() => {
    node.classList.add('falling-start');
    setTimeout(() => node.classList.add('falling-drop'), 20);
  });

  setTimeout(() => {
    if (node.dataset.resolved === '1') return;
    const basketLaneIndex = basketLane;
    node.dataset.resolved = '1';
    if (lane === basketLaneIndex) {
      handleLand(item, node);
    } else {
      if (item.type === 'treasure') {
        feedbackEl.textContent = 'A treasure missed the basket.';
        window.bgamesSound?.play('bad');
      }
      node.classList.add('falling-exit');
      setTimeout(() => node.remove(), 180);
      activeItems -= 1;
      if (activeItems === 0 && treasureCaught >= treasureNeeded) finishWave(true);
      if (activeItems === 0 && treasureCaught < treasureNeeded) finishWave(false);
    }
  }, cfg.speed + 80);
}

function startWave() {
  roundToken += 1;
  clearBoard();
  const cfg = config();
  const items = createWave();
  treasureCaught = 0;
  bombsHit = 0;
  activeItems = 0;
  basketLane = 1;
  updateHud();
  feedbackEl.textContent = 'Move the basket under the treasure.';
  boardEl.style.gridTemplateColumns = `repeat(${cfg.lanes}, minmax(0, 1fr))`;
  boardEl.style.minHeight = '430px';
  setBasketLane(1);

  let index = 0;
  const spawnNext = () => {
    if (roundToken <= 0) return;
    if (index >= items.length) return;
    spawnItem(items[index], cfg, index);
    index += 1;
    if (index < items.length) {
      spawnTimer = setTimeout(spawnNext, cfg.gap);
    } else {
      spawnTimer = null;
    }
  };

  spawnNext();
}

basketButtons.forEach((btn) => {
  btn.addEventListener('click', () => setBasketLane(Number(btn.dataset.basketLane)));
});

newRoundBtn.addEventListener('click', startWave);
startWave();
