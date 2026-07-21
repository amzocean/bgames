const boardEl = document.getElementById('board');
const stateEl = document.getElementById('state');
const syncStateEl = document.getElementById('syncState');
const roomEl = document.getElementById('room');
const matchesEl = document.getElementById('matches');
const leftEl = document.getElementById('left');
const restartBtn = document.getElementById('restart');
const socket = io('/papa');
const roomCode = localStorage.getItem('bgames:roomCode') || 'default';

const FACE_DOWN = '🎴';
const CARD_EMOJIS = ['🐶', '🐱', '🐰', '🦊', '🐼', '🐸', '🦁', '🐵'];

let state = {
  deck: [],
  revealed: [],
  matched: [],
  firstOpen: null,
  locked: false,
  matches: 0,
  totalPairs: 0,
  over: false
};

function playForState(nextState, previousState) {
  if (nextState.over && !previousState.over) {
    window.bgamesSound?.play('win');
    window.bgamesSound?.say('Awesome! You matched them all!');
  } else if (nextState.matches > previousState.matches) {
    window.bgamesSound?.play('good');
  }
}

function render() {
  roomEl.textContent = `Room code: ${roomCode}`;
  stateEl.textContent = state.over
    ? 'All matched! Great memory.'
    : state.locked
      ? 'Hold on... checking the pair.'
      : 'Tap two cards to find a match.';
  syncStateEl.textContent = 'Live sync on';
  matchesEl.textContent = String(state.matches || 0);
  leftEl.textContent = String(Math.max(0, (state.deck.length || 0) - ((state.matches || 0) * 2)));

  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';

  for (let i = 0; i < (state.deck || []).length; i += 1) {
    const btn = document.createElement('button');
    btn.className = 'tile large';
    const visible = state.revealed[i] || state.matched[i];
    btn.textContent = visible ? state.deck[i] : FACE_DOWN;
    btn.disabled = state.locked || state.matched[i] || state.over;
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      window.bgamesSound?.play('pop');
      socket.emit('papa:memory:flip', { roomCode, index: i });
    });
    boardEl.appendChild(btn);
  }
}

function joinRoom() {
  socket.emit('papa:join', { game: 'memory', roomCode });
}

socket.on('connect', joinRoom);

socket.on('papa:memory:state', (nextState) => {
  const previousState = state;
  state = {
    deck: nextState.deck || [],
    revealed: nextState.revealed || [],
    matched: nextState.matched || [],
    firstOpen: nextState.firstOpen ?? null,
    locked: Boolean(nextState.locked),
    matches: nextState.matches || 0,
    totalPairs: nextState.totalPairs || 0,
    over: Boolean(nextState.over)
  };
  playForState(state, previousState);
  render();
});

socket.on('disconnect', () => {
  syncStateEl.textContent = 'Disconnected';
});

restartBtn.addEventListener('click', () => {
  window.bgamesSound?.play('good');
  socket.emit('papa:memory:restart', { roomCode });
});

render();
