const boardEl = document.getElementById('board');
const stateEl = document.getElementById('state');
const roomEl = document.getElementById('room');
const restartBtn = document.getElementById('restart');
const PLAYER = {
  A: '🐼',
  B: '🐯'
};

let board = Array(9).fill('');
let turn = 'A';
let over = false;

function setup() {
  board = Array(9).fill('');
  turn = 'A';
  over = false;
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = 'repeat(3, minmax(0, 120px))';
  stateEl.textContent = `Turn: ${PLAYER[turn]}`;
  const roomCode = localStorage.getItem('bgames:roomCode') || 'Not set';
  roomEl.textContent = `Room code: ${roomCode}`;

  for (let i = 0; i < 9; i += 1) {
    const btn = document.createElement('button');
    btn.className = 'tile large';
    btn.addEventListener('click', () => play(i, btn));
    boardEl.appendChild(btn);
  }
}

function lines() {
  return [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
}

function winner() {
  for (const [a, b, c] of lines()) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a];
    }
  }
  return '';
}

function play(index, btn) {
  if (over || board[index]) return;
  window.bgamesSound?.play('pop');
  board[index] = turn;
  btn.textContent = PLAYER[turn];
  const win = winner();
  if (win) {
    stateEl.textContent = `Great teamwork. ${PLAYER[win]} wins.`;
    window.bgamesSound?.play('win');
    window.bgamesSound?.say('Yay! We have a winner!');
    over = true;
    return;
  }
  if (board.every(Boolean)) {
    stateEl.textContent = 'Nice round. Draw game.';
    window.bgamesSound?.play('good');
    window.bgamesSound?.say('Great game! It is a draw.');
    over = true;
    return;
  }
  turn = turn === 'A' ? 'B' : 'A';
  stateEl.textContent = `Turn: ${PLAYER[turn]}`;
}

restartBtn.addEventListener('click', setup);
setup();
