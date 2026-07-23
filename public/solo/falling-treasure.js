const boardEl = document.getElementById('board');
const treasureEl = document.getElementById('treasure');
const bombsEl = document.getElementById('bombs');
const targetPillEl = document.getElementById('targetPill');
const feedbackEl = document.getElementById('feedback');
const newRoundBtn = document.getElementById('newRound');
const basketEl = document.getElementById('basket');

const GOOD_ICONS = ['💎', '🪙', '💰'];
const BAD_ICONS = ['💣', '🪨', '☄️'];

const ITEM_SIZE = 88;
let waveToken = 0;
let treasureCaught = 0;
let bombsHit = 0;
let treasureNeeded = 0;
let dangerLimit = 3;
let basketX = 0;
let basketWidth = 170;
let boardWidth = 0;
let boardHeight = 0;
let items = [];
let nextItemId = 0;
let loopFrame = 0;
let spawnMs = 0;
let spawnEvery = 880;
let playing = false;

function level() {
  return localStorage.getItem('bgames:difficulty') || 'large';
}

function config() {
  const l = level();
  if (l === 'small') {
    return { target: 9, maxBombs: 4, spawnEvery: 820, minSpeed: 96, maxSpeed: 162, basket: 180 };
  }
  if (l === 'medium') {
    return { target: 8, maxBombs: 3, spawnEvery: 900, minSpeed: 110, maxSpeed: 186, basket: 170 };
  }
  return { target: 7, maxBombs: 3, spawnEvery: 980, minSpeed: 122, maxSpeed: 204, basket: 160 };
}

function randFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function clearBoard() {
  if (loopFrame) cancelAnimationFrame(loopFrame);
  loopFrame = 0;
  playing = false;
  items = [];
  boardEl.querySelectorAll('.falling-item').forEach((node) => node.remove());
}

function updateHud() {
  treasureEl.textContent = String(treasureCaught);
  bombsEl.textContent = String(bombsHit);
  targetPillEl.textContent = `Catch ${treasureNeeded} treasure | Avoid ${dangerLimit} bombs`;
}

function clampBasket(x) {
  const maxX = Math.max(0, boardWidth - basketWidth);
  return Math.max(0, Math.min(maxX, x));
}

function placeBasket(x) {
  basketX = clampBasket(x);
  basketEl.style.left = `${basketX}px`;
  basketEl.style.width = `${basketWidth}px`;
}

function finishWave(success) {
  if (!playing) return;
  playing = false;
  if (loopFrame) cancelAnimationFrame(loopFrame);
  loopFrame = 0;
  waveToken += 1;
  if (success) {
    feedbackEl.textContent = 'Treasure found. Great basket work!';
    window.bgamesSound?.play('win');
    window.bgamesSound?.say('Treasure found!');
  } else {
    feedbackEl.textContent = 'New wave. Drag the basket to the treasure.';
    window.bgamesSound?.play('bad');
    window.bgamesSound?.say('Watch out for bombs!');
  }
  boardEl.querySelectorAll('.falling-item').forEach((node) => {
    node.dataset.resolved = '1';
    node.classList.add('falling-exit');
    setTimeout(() => node.remove(), 180);
  });
  setTimeout(() => startWave(), 1200);
}

function spawnItem(cfg) {
  const type = Math.random() < 0.24 ? 'bomb' : 'treasure';
  const item = {
    id: nextItemId,
    type,
    icon: type === 'bomb' ? randFrom(BAD_ICONS) : randFrom(GOOD_ICONS),
    x: Math.random() * Math.max(10, boardWidth - ITEM_SIZE - 10),
    y: -ITEM_SIZE - 6,
    speed: cfg.minSpeed + Math.random() * (cfg.maxSpeed - cfg.minSpeed),
    resolved: false
  };
  nextItemId += 1;
  const node = document.createElement('button');
  node.type = 'button';
  node.className = `falling-item ${type}`;
  node.dataset.resolved = '0';
  node.innerHTML = `<span>${item.icon}</span>`;
  node.style.left = `${item.x}px`;
  node.style.top = `${item.y}px`;
  boardEl.appendChild(node);
  item.node = node;
  items.push(item);
}

function resolveCatch(item, isCatch) {
  if (item.resolved) return;
  item.resolved = true;
  item.node.dataset.resolved = '1';

  if (isCatch && item.type === 'treasure') {
    treasureCaught += 1;
    feedbackEl.textContent = treasureCaught >= treasureNeeded ? 'Last treasure! Keep catching!' : 'Treasure caught!';
    window.bgamesSound?.play('good');
    window.bgamesSound?.say('Treasure caught!');
    item.node.classList.add('falling-caught');
  } else if (isCatch && item.type === 'bomb') {
    bombsHit += 1;
    feedbackEl.textContent = bombsHit >= dangerLimit ? 'Too many bombs! New wave incoming.' : 'Boom! Keep the basket away from bombs.';
    window.bgamesSound?.play('bad');
    item.node.classList.add('falling-bad-hit');
  } else {
    if (item.type === 'treasure') {
      feedbackEl.textContent = 'A treasure slipped by.';
    }
    item.node.classList.add('falling-exit');
  }

  updateHud();
  setTimeout(() => item.node.remove(), 180);

  if (treasureCaught >= treasureNeeded) {
    finishWave(true);
    return;
  }
  if (bombsHit >= dangerLimit) {
    finishWave(false);
  }
}

function startWave() {
  waveToken += 1;
  clearBoard();
  const cfg = config();
  treasureNeeded = cfg.target;
  dangerLimit = cfg.maxBombs;
  spawnEvery = cfg.spawnEvery;
  basketWidth = cfg.basket;
  nextItemId = 0;
  spawnMs = 0;
  treasureCaught = 0;
  bombsHit = 0;
  items = [];
  updateHud();
  feedbackEl.textContent = 'Drag the basket. Catch treasure and avoid bombs.';
  boardWidth = boardEl.clientWidth;
  boardHeight = boardEl.clientHeight;
  placeBasket((boardWidth - basketWidth) / 2);
  boardEl.style.minHeight = '430px';
  playing = true;

  let last = performance.now();
  const thisWave = waveToken;

  const step = (now) => {
    if (!playing || thisWave !== waveToken) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    spawnMs += dt * 1000;

    if (spawnMs >= spawnEvery) {
      spawnMs = 0;
      spawnItem(cfg);
    }

    const basketTop = boardHeight - 105;
    const basketBottom = boardHeight;
    const basketLeft = basketX;
    const basketRight = basketX + basketWidth;

    for (const item of items) {
      if (item.resolved) continue;
      item.y += item.speed * dt;
      item.node.style.top = `${item.y}px`;
      const itemLeft = item.x;
      const itemRight = item.x + ITEM_SIZE;
      const itemTop = item.y;
      const itemBottom = item.y + ITEM_SIZE;
      const overlapsBasket =
        itemBottom >= basketTop &&
        itemTop <= basketBottom &&
        itemRight >= basketLeft &&
        itemLeft <= basketRight;
      if (overlapsBasket) {
        resolveCatch(item, true);
        if (!playing) break;
      } else if (itemTop > boardHeight + 18) {
        resolveCatch(item, false);
        if (!playing) break;
      }
    }

    items = items.filter((item) => !(item.resolved && !item.node.isConnected));
    loopFrame = requestAnimationFrame(step);
  };

  loopFrame = requestAnimationFrame(step);
  window.bgamesSound?.speakSoloIntro?.();
}

function boardClientX(clientX) {
  const rect = boardEl.getBoundingClientRect();
  return clientX - rect.left - basketWidth / 2;
}

function moveBasketFromClientX(clientX) {
  placeBasket(boardClientX(clientX));
}

boardEl.addEventListener('pointerdown', (event) => {
  if (!playing) return;
  moveBasketFromClientX(event.clientX);
});

boardEl.addEventListener('pointermove', (event) => {
  if (!playing) return;
  if (event.buttons > 0 || event.pointerType === 'touch') {
    moveBasketFromClientX(event.clientX);
  }
});

boardEl.addEventListener('touchmove', (event) => {
  if (!playing || !event.touches[0]) return;
  event.preventDefault();
  moveBasketFromClientX(event.touches[0].clientX);
}, { passive: false });

window.addEventListener('keydown', (event) => {
  if (!playing) return;
  if (event.key === 'ArrowLeft' || event.key === 'a') {
    placeBasket(basketX - 42);
  } else if (event.key === 'ArrowRight' || event.key === 'd') {
    placeBasket(basketX + 42);
  }
});

window.addEventListener('resize', () => {
  boardWidth = boardEl.clientWidth;
  boardHeight = boardEl.clientHeight;
  placeBasket(basketX);
});

newRoundBtn.addEventListener('click', startWave);
startWave();
