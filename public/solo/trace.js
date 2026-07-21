const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const feedback = document.getElementById('feedback');
const progressEl = document.getElementById('progress');
const resetBtn = document.getElementById('reset');

let dots = [];
let nextDot = 1;

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
  if (l === 'small') return 13;
  if (l === 'medium') return 17;
  return 22;
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const expectedId = nextDot;

  for (const d of dots) {
    if (d.id === expectedId && !d.done) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, 18, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffb400';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(d.x, d.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = d.done ? '#8cc0ff' : '#2a64be';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(d.id), d.x, d.y);
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setup() {
  dots = [];
  nextDot = 1;
  feedback.textContent = 'Warm-up round.';
  const count = dotCount();
  for (let i = 1; i <= count; i += 1) {
    dots.push({
      id: i,
      x: randomInt(40, canvas.width - 40),
      y: randomInt(40, canvas.height - 40),
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
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;
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
    ctx.moveTo(previous.x, previous.y);
    ctx.lineTo(expected.x, expected.y);
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

resetBtn.addEventListener('click', setup);
setup();
