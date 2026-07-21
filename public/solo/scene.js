const zonesEl = document.getElementById('zones');
const trayEl = document.getElementById('tray');
const placedEl = document.getElementById('placed');
const winsEl = document.getElementById('wins');
const scenePillEl = document.getElementById('scenePill');
const feedbackEl = document.getElementById('feedback');
const newRoundBtn = document.getElementById('newRound');

const SCENES = [
  {
    id: 'beach',
    title: 'Beach Day',
    zones: [
      { id: 'sun', hint: 'sky', icon: '☀️', label: 'sun' },
      { id: 'boat', hint: 'water', icon: '⛵', label: 'boat' },
      { id: 'shell', hint: 'sand', icon: '🐚', label: 'shell' },
      { id: 'crab', hint: 'shore', icon: '🦀', label: 'crab' }
    ]
  },
  {
    id: 'park',
    title: 'Park Play',
    zones: [
      { id: 'tree', hint: 'grass', icon: '🌳', label: 'tree' },
      { id: 'kite', hint: 'sky', icon: '🪁', label: 'kite' },
      { id: 'bench', hint: 'path', icon: '🪑', label: 'bench' },
      { id: 'ball', hint: 'field', icon: '⚽', label: 'ball' }
    ]
  },
  {
    id: 'space',
    title: 'Space Trip',
    zones: [
      { id: 'rocket', hint: 'launch', icon: '🚀', label: 'rocket' },
      { id: 'moon', hint: 'orbit', icon: '🌙', label: 'moon' },
      { id: 'star', hint: 'night sky', icon: '⭐', label: 'star' },
      { id: 'planet', hint: 'far side', icon: '🪐', label: 'planet' }
    ]
  }
];

let currentScene = null;
let selectedPiece = null;
let placedCount = 0;
let wins = 0;
let zoneState = new Map();

function level() {
  return localStorage.getItem('bgames:difficulty') || 'large';
}

function activeZoneCount() {
  const l = level();
  if (l === 'small') return 4;
  if (l === 'medium') return 4;
  return 3;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function clearSelection() {
  selectedPiece = null;
  [...trayEl.children].forEach((node) => node.classList.remove('scene-selected'));
}

function renderTray(pieces) {
  trayEl.innerHTML = '';
  trayEl.style.gridTemplateColumns = `repeat(${pieces.length}, minmax(0, 1fr))`;
  pieces.forEach((piece) => {
    const btn = document.createElement('button');
    btn.className = 'tile large story-card';
    btn.dataset.zoneId = piece.id;
    btn.innerHTML = `<div>${piece.icon}</div><div style="font-size:0.95rem; margin-top:6px;">${piece.label}</div>`;
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      clearSelection();
      selectedPiece = piece;
      btn.classList.add('scene-selected');
      feedbackEl.textContent = `Place ${piece.label} in the right spot.`;
      window.bgamesSound?.play('click');
    });
    trayEl.appendChild(btn);
  });
}

function renderZones(zones) {
  zonesEl.innerHTML = '';
  zonesEl.style.gridTemplateColumns = `repeat(${Math.min(2, zones.length)}, minmax(0, 1fr))`;

  zones.forEach((zone) => {
    zoneState.set(zone.id, false);
    const btn = document.createElement('button');
    btn.className = 'tile large scene-zone';
    btn.dataset.zoneId = zone.id;
    btn.innerHTML = `<div style="font-size:1.1rem; font-weight:800;">${zone.hint}</div><div style="font-size:2rem; margin-top:6px;">❔</div>`;
    btn.addEventListener('click', () => {
      if (!selectedPiece) {
        feedbackEl.textContent = 'Pick an item from the tray first.';
        return;
      }
      if (zoneState.get(zone.id)) return;
      const ok = selectedPiece.id === zone.id;
      if (!ok) {
        feedbackEl.textContent = `Not there yet. ${selectedPiece.label} belongs somewhere else.`;
        window.bgamesSound?.play('bad');
        return;
      }

      zoneState.set(zone.id, true);
      placedCount += 1;
      placedEl.textContent = `${placedCount}/${zones.length}`;
      btn.classList.add('scene-zone-done');
      btn.innerHTML = `<div style="font-size:1.1rem; font-weight:800;">${zone.hint}</div><div style="font-size:2.4rem; margin-top:6px;">${zone.icon}</div>`;
      feedbackEl.textContent = `Great. ${zone.label} placed.`;
      window.bgamesSound?.play('good');

      const selectedNode = [...trayEl.children].find((node) => node.dataset.zoneId === zone.id);
      if (selectedNode) {
        selectedNode.disabled = true;
        selectedNode.style.opacity = '0.35';
        selectedNode.classList.remove('scene-selected');
      }
      selectedPiece = null;

      if (placedCount === zones.length) {
        wins += 1;
        winsEl.textContent = String(wins);
        feedbackEl.textContent = 'Scene complete. Fantastic building!';
        zonesEl.classList.add('celebrate');
        setTimeout(() => zonesEl.classList.remove('celebrate'), 380);
        window.bgamesSound?.play('win');
        window.bgamesSound?.say('Scene complete!');
      }
    });
    zonesEl.appendChild(btn);
  });
}

function startRound() {
  selectedPiece = null;
  placedCount = 0;
  zoneState = new Map();
  const scene = shuffle(SCENES)[0];
  const zones = shuffle(scene.zones).slice(0, activeZoneCount());
  currentScene = { ...scene, zones };
  scenePillEl.textContent = `Scene: ${scene.title}`;
  placedEl.textContent = `0/${zones.length}`;
  feedbackEl.textContent = 'Tap a piece, then tap its matching place.';
  renderZones(zones);
  renderTray(shuffle(zones));
}

newRoundBtn.addEventListener('click', startRound);
startRound();
