const boardEl = document.getElementById('board');
const stateEl = document.getElementById('state');
const roomEl = document.getElementById('room');
const syncStateEl = document.getElementById('syncState');
const restartBtn = document.getElementById('restart');

const PLAYER = { A: '🐼', B: '🐯' };
const socket = io('/papa');
const roomCode = localStorage.getItem('bgames:roomCode') || 'default';

let state = { board: Array(9).fill(null), turn: 'A', over: false, winner: null };

function render() {
  roomEl.textContent = `Room code: ${roomCode}`;
  stateEl.textContent = state.over
    ? (state.winner ? `Great teamwork. ${PLAYER[state.winner]} wins.` : 'Nice round. Draw game.')
    : `Turn: ${PLAYER[state.turn]}`;
  syncStateEl.textContent = state.over ? 'Live sync on' : 'Live sync on';

  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = 'repeat(3, minmax(0, 120px))';
  for (let i = 0; i < 9; i += 1) {
    const btn = document.createElement('button');
    btn.className = 'tile large';
    btn.textContent = state.board[i] ? PLAYER[state.board[i]] : '';
    btn.disabled = Boolean(state.board[i]) || state.over;
    btn.addEventListener('click', () => {
      if (state.over || state.board[i]) return;
      window.bgamesSound?.play('pop');
      socket.emit('papa:tictactoe:move', { roomCode, index: i });
    });
    boardEl.appendChild(btn);
  }
}

function joinRoom() {
  socket.emit('papa:join', { game: 'tictactoe', roomCode });
}

socket.on('connect', joinRoom);
socket.on('papa:tictactoe:state', (nextState) => {
  state = {
    board: nextState.board || Array(9).fill(null),
    turn: nextState.turn || 'A',
    over: Boolean(nextState.over),
    winner: nextState.winner || null
  };
  if (state.over) {
    if (state.winner) {
      window.bgamesSound?.play('win');
      window.bgamesSound?.say('Yay! We have a winner!');
    } else {
      window.bgamesSound?.play('good');
      window.bgamesSound?.say('Great game! It is a draw.');
    }
  } else {
    window.bgamesSound?.play('good');
  }
  render();
});

socket.on('disconnect', () => {
  syncStateEl.textContent = 'Disconnected';
});

restartBtn.addEventListener('click', () => {
  window.bgamesSound?.play('good');
  socket.emit('papa:tictactoe:restart', { roomCode });
});

render();
