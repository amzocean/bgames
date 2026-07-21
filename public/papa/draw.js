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
const syncStateEl = document.getElementById('syncState');
const paletteEl = document.getElementById('palette');
const clearBtn = document.getElementById('clear');
const newPromptBtn = document.getElementById('newPrompt');
const socket = io('/papa');
const roomCode = localStorage.getItem('bgames:roomCode') || 'default';

let strokeColor = paletteColors[0];
let strokeSize = 6;
let currentState = { promptIndex: 0, prompt: prompts[0], strokes: [] };
let drawing = false;
let lastX = 0;
let lastY = 0;

function drawPrompt(prompt) {
  promptEl.textContent = `Prompt: ${prompt.icon} ${prompt.label}`;
}

function clearCanvas() {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSegment(segment) {
  ctx.beginPath();
  ctx.moveTo(segment.from.x, segment.from.y);
  ctx.lineTo(segment.to.x, segment.to.y);
  ctx.lineWidth = segment.size;
  ctx.strokeStyle = segment.color;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function replayStrokes(strokes) {
  clearCanvas();
  for (const segment of strokes) {
    drawSegment(segment);
  }
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

function joinRoom() {
  socket.emit('papa:join', { game: 'draw', roomCode });
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
  const segment = {
    from: { x: lastX, y: lastY },
    to: { x, y },
    color: strokeColor,
    size: strokeSize
  };
  drawSegment(segment);
  socket.emit('papa:draw:segment', { roomCode, segment });
  lastX = x;
  lastY = y;
});

canvas.addEventListener('pointerup', () => { drawing = false; });
canvas.addEventListener('pointerleave', () => { drawing = false; });

clearBtn.addEventListener('click', () => {
  window.bgamesSound?.play('good');
  socket.emit('papa:draw:clear', { roomCode });
});

newPromptBtn.addEventListener('click', () => {
  window.bgamesSound?.play('good');
  socket.emit('papa:draw:newPrompt', { roomCode });
});

socket.on('connect', joinRoom);

socket.on('papa:draw:state', (nextState) => {
  currentState = {
    promptIndex: nextState.promptIndex ?? 0,
    prompt: nextState.prompt || prompts[0],
    strokes: nextState.strokes || []
  };
  drawPrompt(currentState.prompt);
  replayStrokes(currentState.strokes);
  syncStateEl.textContent = 'Live sync on';
  window.bgamesSound?.play('good');
  window.bgamesSound?.say(`Draw this: ${currentState.prompt.label}`);
});

socket.on('papa:draw:segment', (segment) => {
  currentState.strokes.push(segment);
  drawSegment(segment);
  syncStateEl.textContent = 'Live sync on';
});

socket.on('disconnect', () => {
  syncStateEl.textContent = 'Disconnected';
});

roomEl.textContent = `Room code: ${roomCode}`;
buildPalette();
clearCanvas();
joinRoom();
