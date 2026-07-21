const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const feedback = document.getElementById('feedback');
const progressEl = document.getElementById('progress');
const resetBtn = document.getElementById('reset');

let dots = [];
let nextDot = 1;
const BASE_WIDTH = 820;
const BASE_HEIGHT = 420;
let renderWidth = BASE_WIDTH;
let renderHeight = BASE_HEIGHT;

function level() {
  return localStorage.getItem('bgames:difficulty') || 'large';
}

function dotCount() {
  const l = level();
  if (l === 'small') return 16;
  if (l === 'medium') return 12;
  return 9;
}

function hitRadius() {
  const l = level();
  if (l === 'small') return 0.018;
  if (l === 'medium') return 0.022;
  return 0.027;
}

function resizeCanvas() {
  const container = canvas.parentElement;
  const maxWidth = Math.min(container.clientWidth, 1200);
  const nextWidth = Math.max(320, Math.floor(maxWidth));
  const nextHeight = Math.max(220, Math.floor(nextWidth * (BASE_HEIGHT / BASE_WIDTH)));
  canvas.width = nextWidth;
  canvas.height = nextHeight;
  renderWidth = nextWidth;
  renderHeight = nextHeight;
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const expectedId = nextDot;

  for (const d of dots) {
    if (d.id === expectedId && !d.done) {
      ctx.beginPath();
      ctx.arc(d.x * canvas.width, d.y * canvas.height, 18 * Math.min(canvas.width / BASE_WIDTH, canvas.height / BASE_HEIGHT), 0, Math.PI * 2);
      ctx.strokeStyle = '#ffb400';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(d.x * canvas.width, d.y * canvas.height, 12 * Math.min(canvas.width / BASE_WIDTH, canvas.height / BASE_HEIGHT), 0, Math.PI * 2);
    ctx.fillStyle = d.done ? '#8cc0ff' : '#2a64be';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.max(12, Math.round(12 * Math.min(canvas.width / BASE_WIDTH, canvas.height / BASE_HEIGHT)))}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(d.id), d.x * canvas.width, d.y * canvas.height);
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setup() {
  resizeCanvas();
  dots = [];
  nextDot = 1;
  feedback.textContent = 'Warm-up round.';
  const count = dotCount();
  for (let i = 1; i <= count; i += 1) {
    dots.push({
      id: i,
      x: randomInt(6, 94) / 100,
      y: randomInt(12, 88) / 100,
      done: false
    });
  }
  progressEl.textContent = `0/${count}`;
  drawScene();
}

canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = ((event.clientX - rect.left) * scaleX) / canvas.width;
  const y = ((event.clientY - rect.top) * scaleY) / canvas.height;
  const expected = dots.find((d) => d.id === nextDot);
  if (!expected) return;

  const distance = Math.hypot(expected.x - x, expected.y - y);
  const ok = distance <= hitRadius();
  if (!ok) {
    window.bgamesSound?.play('bad');
    feedback.textContent = 'Helper mode: tap closer to the highlighted number.';
    return;
  }
  window.bgamesSound?.play('pop');

  expected.done = true;
  if (nextDot > 1) {
    const previous = dots.find((d) => d.id === nextDot - 1);
    ctx.beginPath();
    ctx.moveTo(previous.x * canvas.width, previous.y * canvas.height);
    ctx.lineTo(expected.x * canvas.width, expected.y * canvas.height);
    ctx.strokeStyle = '#f59f00';
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  drawScene();
  progressEl.textContent = `${nextDot}/${dots.length}`;
  nextDot += 1;
  if (nextDot > dots.length) {
    feedback.textContent = 'Great tracing. Pattern complete.';
    progressEl.textContent = `${dots.length}/${dots.length}`;
    canvas.classList.add('celebrate');
    setTimeout(() => canvas.classList.remove('celebrate'), 400);
    window.bgamesSound?.play('win');
    window.bgamesSound?.say('Fantastic tracing! You finished the pattern.');
  } else {
    feedback.textContent = `Good. Next number: ${nextDot}.`;
  }
});

function handleViewportChange() {
  resizeCanvas();
  drawScene();
}

resetBtn.addEventListener('click', setup);
window.addEventListener('resize', handleViewportChange);
window.addEventListener('orientationchange', handleViewportChange);
window.addEventListener('bgames:viewportchange', handleViewportChange);
setup();
