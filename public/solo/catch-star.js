const boardEl = document.getElementById('board');
const caughtEl = document.getElementById('caught');
const bombsEl = document.getElementById('bombs');
const targetPillEl = document.getElementById('targetPill');
const feedbackEl = document.getElementById('feedback');
const newRoundBtn = document.getElementById('newRound');

const GOOD_ICONS = ['⭐', '🌟', '💫'];
const BAD_ICONS = ['💣', '🪨', '☄️'];

let roundToken = 0;
let caughtStars = 0;
let bombsHit = 0;
let starsNeeded = 0;
let activeStar = null;
let starFrame = 0;
let starTimeout = null;
let bombNodes = [];
let locked = false;

function level() {
  return localStorage.getItem('bgames:difficulty') || 'large';
}

function config() {
  const l = level();
  if (l === 'small') return { stars: 6, bombs: 5, speed: 1.35, boardMin: 520 };
  if (l === 'medium') return { stars: 5, bombs: 4, speed: 1.55, boardMin: 500 };
  return { stars: 4, bombs: 3, speed: 1.8, boardMin: 480 };
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function clearRound() {
  if (starTimeout) clearTimeout(starTimeout);
  if (starFrame) cancelAnimationFrame(starFrame);
  starTimeout = null;
  starFrame = 0;
  activeStar = null;
  boardEl.innerHTML = '';
  bombNodes = [];
}

function updateHud() {
  caughtEl.textContent = String(caughtStars);
  bombsEl.textContent = String(bombsHit);
  targetPillEl.textContent = `Catch ${starsNeeded} stars`;
}

function bombIcon() {
  return shuffle(BAD_ICONS)[0];
}

function starIcon() {
  return shuffle(GOOD_ICONS)[0];
}

function createBombs(cfg) {
  bombNodes.forEach((node) => node.remove());
  bombNodes = [];
  const bounds = boardEl.getBoundingClientRect();
  const safeTop = Math.max(120, bounds.height * 0.22);
  for (let i = 0; i < cfg.bombs; i += 1) {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'moving-bomb';
    node.dataset.resolved = '0';
    node.innerHTML = `<span>${bombIcon()}</span>`;
    node.style.left = `${10 + Math.random() * 72}%`;
    node.style.top = `${safeTop + Math.random() * (bounds.height - safeTop - 160)}px`;
    node.addEventListener('click', () => {
      if (node.dataset.resolved === '1') return;
      node.dataset.resolved = '1';
      bombsHit += 1;
      feedbackEl.textContent = 'Boom. Skip the bombs!';
      window.bgamesSound?.play('bad');
      updateHud();
      node.classList.add('falling-bad-hit');
      setTimeout(() => node.remove(), 200);
    });
    boardEl.appendChild(node);
    bombNodes.push(node);
  }
}

function finishWave(success) {
  locked = true;
  if (success) {
    feedbackEl.textContent = 'Amazing! You caught every star.';
    window.bgamesSound?.play('win');
    window.bgamesSound?.say('Great catch!');
  } else {
    feedbackEl.textContent = 'New wave. Watch the next star.';
    window.bgamesSound?.play('good');
  }
  setTimeout(() => startWave(), 1150);
}

function spawnStar(cfg) {
  if (roundToken <= 0) return;
  if (activeStar) return;

  activeStar = document.createElement('button');
  activeStar.type = 'button';
  activeStar.className = 'moving-star';
  activeStar.dataset.resolved = '0';
  activeStar.innerHTML = `<span>${starIcon()}</span>`;
  activeStar.style.left = `${20 + Math.random() * 50}%`;
  activeStar.style.top = `${20 + Math.random() * 26}%`;
  boardEl.appendChild(activeStar);

  const bounds = boardEl.getBoundingClientRect();
  let x = bounds.width * (0.18 + Math.random() * 0.54);
  let y = bounds.height * (0.18 + Math.random() * 0.28);
  let vx = (Math.random() < 0.5 ? -1 : 1) * (1.8 + Math.random() * 1.2) * 60;
  let vy = (Math.random() < 0.5 ? -1 : 1) * (1.5 + Math.random() * 1.0) * 60;
  const size = 88;
  const start = performance.now();

  const step = (now) => {
    if (!activeStar || activeStar.dataset.resolved === '1') return;
    const dt = Math.min(0.03, (now - (step.last || now)) / 1000);
    step.last = now;
    x += vx * dt;
    y += vy * dt;
    const maxX = Math.max(0, bounds.width - size - 12);
    const maxY = Math.max(0, bounds.height - size - 12);
    if (x <= 6 || x >= maxX) vx *= -1;
    if (y <= 6 || y >= maxY) vy *= -1;
    x = Math.max(6, Math.min(maxX, x));
    y = Math.max(6, Math.min(maxY, y));
    activeStar.style.transform = `translate(${x}px, ${y}px)`;
    starFrame = requestAnimationFrame(step);
  };

  activeStar.addEventListener('click', () => {
    if (!activeStar || activeStar.dataset.resolved === '1') return;
    if (starTimeout) clearTimeout(starTimeout);
    activeStar.dataset.resolved = '1';
    caughtStars += 1;
    feedbackEl.textContent = caughtStars >= starsNeeded ? 'Last star! Keep going!' : 'Star caught!';
    window.bgamesSound?.play('good');
    window.bgamesSound?.say('Star caught!');
    updateHud();
    activeStar.classList.add('falling-caught');
    bombNodes.forEach((node) => node.classList.add('quiet-bomb'));
    setTimeout(() => {
      if (activeStar) activeStar.remove();
      activeStar = null;
      bombNodes.forEach((node) => {
        node.classList.remove('quiet-bomb');
        node.dataset.resolved = '1';
        node.remove();
      });
      bombNodes = [];
      if (caughtStars >= starsNeeded) {
        finishWave(true);
      } else {
        createBombs(cfg);
        setTimeout(() => spawnStar(cfg), 420);
      }
    }, 180);
  });

  starTimeout = setTimeout(() => {
    if (!activeStar || activeStar.dataset.resolved === '1') return;
    activeStar.dataset.resolved = '1';
    feedbackEl.textContent = 'The star slipped away.';
    window.bgamesSound?.play('bad');
    activeStar.classList.add('falling-exit');
    setTimeout(() => {
      if (activeStar) activeStar.remove();
      activeStar = null;
      if (caughtStars >= starsNeeded) {
        finishWave(true);
      } else {
        createBombs(cfg);
        setTimeout(() => spawnStar(cfg), 420);
      }
    }, 180);
  }, Math.max(1400, cfg.speed * 1000));

  starFrame = requestAnimationFrame(step);

  // Keep the star moving all the time; bombs are the distractions between catches.
  if (performance.now() - start < 0) return;
}

function startWave() {
  roundToken += 1;
  locked = false;
  clearRound();
  const cfg = config();
  starsNeeded = cfg.stars;
  caughtStars = 0;
  bombsHit = 0;
  updateHud();
  feedbackEl.textContent = 'Follow the star. Tap it before it escapes.';
  boardEl.style.minHeight = `${cfg.boardMin}px`;
  boardEl.classList.add('moving-board');
  createBombs(cfg);
  spawnStar(cfg);
}

newRoundBtn.addEventListener('click', startWave);
startWave();
