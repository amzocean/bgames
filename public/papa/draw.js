const prompts = [
  { label: 'Tree', icon: '🌳' },
  { label: 'Rocket', icon: '🚀' },
  { label: 'Fish', icon: '🐟' },
  { label: 'House', icon: '🏠' },
  { label: 'Car', icon: '🚗' },
  { label: 'Moon', icon: '🌙' },
  { label: 'Star', icon: '⭐' },
  { label: 'Bird', icon: '🐦' },
  { label: 'Apple', icon: '🍎' },
  { label: 'Boat', icon: '⛵' }
];
const paletteColors = ['#154c9f', '#ff4b7c', '#14a96f', '#f59f00', '#8b5cf6', '#111827'];

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const promptEl = document.getElementById('prompt');
const roomEl = document.getElementById('room');
const paletteEl = document.getElementById('palette');
const clearBtn = document.getElementById('clear');
const newPromptBtn = document.getElementById('newPrompt');

let drawing = false;
let lastX = 0;
let lastY = 0;
let strokeColor = paletteColors[0];
let strokeSize = 6;

function drawPrompt() {
  const value = prompts[Math.floor(Math.random() * prompts.length)];
  promptEl.textContent = `Prompt: ${value.icon} ${value.label}`;
  window.bgamesSound?.play('good');
  window.bgamesSound?.say(`Draw this: ${value.label}`);
}

function clearCanvas() {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function buildPalette() {
  paletteEl.innerHTML = '';
  paletteColors.forEach((color, index) => {
    const swatch = document.createElement('button');
    swatch.className = `color-dot${index === 0 ? ' active' : ''}`;
    swatch.style.background = color;
    swatch.type = 'button';
    swatch.addEventListener('click', () => {
      strokeColor = color;
      [...paletteEl.children].forEach((c) => c.classList.remove('active'));
      swatch.classList.add('active');
      window.bgamesSound?.play('click');
    });
    paletteEl.appendChild(swatch);
  });
}

canvas.addEventListener('pointerdown', (e) => {
  drawing = true;
  canvas.setPointerCapture(e.pointerId);
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  lastX = (e.clientX - rect.left) * scaleX;
  lastY = (e.clientY - rect.top) * scaleY;
});

canvas.addEventListener('pointermove', (e) => {
  if (!drawing) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.lineWidth = strokeSize;
  ctx.strokeStyle = strokeColor;
  ctx.lineCap = 'round';
  ctx.stroke();
  lastX = x;
  lastY = y;
});

canvas.addEventListener('pointerup', () => { drawing = false; });
canvas.addEventListener('pointerleave', () => { drawing = false; });

clearBtn.addEventListener('click', () => {
  clearCanvas();
  window.bgamesSound?.play('good');
});
newPromptBtn.addEventListener('click', drawPrompt);

roomEl.textContent = `Room code: ${localStorage.getItem('bgames:roomCode') || 'Not set'}`;
buildPalette();
clearCanvas();
drawPrompt();
