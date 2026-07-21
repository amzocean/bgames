const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

const PAPA_PROMPTS = [
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

const MEMORY_PICTURES = ['🐶', '🐱', '🐰', '🦊', '🐼', '🐸', '🦁', '🐵'];

const roomStates = new Map();

function cleanRoomCode(roomCode) {
  const value = String(roomCode || '').trim().toLowerCase();
  return value.replace(/[^a-z0-9_-]/g, '') || 'default';
}

function tttState() {
  return {
    board: Array(9).fill(null),
    turn: 'A',
    over: false,
    winner: null
  };
}

function drawState() {
  const promptIndex = Math.floor(Math.random() * PAPA_PROMPTS.length);
  return {
    promptIndex,
    prompt: PAPA_PROMPTS[promptIndex],
    strokes: []
  };
}

function memoryState() {
  const deck = shuffle([...MEMORY_PICTURES, ...MEMORY_PICTURES]);
  return {
    deck,
    revealed: Array(deck.length).fill(false),
    matched: Array(deck.length).fill(false),
    firstOpen: null,
    locked: false,
    matches: 0,
    totalPairs: MEMORY_PICTURES.length,
    over: false
  };
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getRoomState(roomCode) {
  const key = cleanRoomCode(roomCode);
  if (!roomStates.has(key)) {
    roomStates.set(key, {
      code: key,
      tictactoe: tttState(),
      draw: drawState(),
      memory: memoryState()
    });
  }
  return roomStates.get(key);
}

function checkWinner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a];
    }
  }
  return null;
}

app.use((req, res, next) => {
  const wantsHtml = req.path.endsWith('.html');
  const isDirectoryPath = req.path === '/' || req.path.endsWith('/');
  if (wantsHtml || isDirectoryPath) res.setHeader('Cache-Control', 'no-cache');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

const papaNs = io.of('/papa');

papaNs.on('connection', (socket) => {
  socket.on('papa:join', ({ game, roomCode }) => {
    const normalizedRoom = cleanRoomCode(roomCode);
    const roomKey = `${game}:${normalizedRoom}`;
    socket.data.game = game;
    socket.data.roomCode = normalizedRoom;
    socket.join(roomKey);

    const room = getRoomState(normalizedRoom);
    if (game === 'tictactoe') {
      socket.emit('papa:tictactoe:state', room.tictactoe);
    } else if (game === 'draw') {
      socket.emit('papa:draw:state', {
        promptIndex: room.draw.promptIndex,
        prompt: room.draw.prompt,
        strokes: room.draw.strokes
      });
    } else if (game === 'memory') {
      socket.emit('papa:memory:state', room.memory);
    }
  });

  socket.on('papa:tictactoe:move', ({ roomCode, index }) => {
    const normalizedRoom = cleanRoomCode(roomCode);
    const room = getRoomState(normalizedRoom);
    const state = room.tictactoe;
    const moveIndex = Number(index);
    if (state.over || Number.isNaN(moveIndex) || moveIndex < 0 || moveIndex > 8) return;
    if (state.board[moveIndex]) return;

    state.board[moveIndex] = state.turn;
    const winner = checkWinner(state.board);
    if (winner) {
      state.over = true;
      state.winner = winner;
    } else if (state.board.every(Boolean)) {
      state.over = true;
      state.winner = null;
    } else {
      state.turn = state.turn === 'A' ? 'B' : 'A';
    }

    papaNs.to(`tictactoe:${normalizedRoom}`).emit('papa:tictactoe:state', state);
  });

  socket.on('papa:tictactoe:restart', ({ roomCode }) => {
    const normalizedRoom = cleanRoomCode(roomCode);
    const room = getRoomState(normalizedRoom);
    room.tictactoe = tttState();
    papaNs.to(`tictactoe:${normalizedRoom}`).emit('papa:tictactoe:state', room.tictactoe);
  });

  socket.on('papa:draw:newPrompt', ({ roomCode }) => {
    const normalizedRoom = cleanRoomCode(roomCode);
    const room = getRoomState(normalizedRoom);
    const currentIndex = room.draw.promptIndex;
    let nextIndex = Math.floor(Math.random() * PAPA_PROMPTS.length);
    if (PAPA_PROMPTS.length > 1) {
      while (nextIndex === currentIndex) {
        nextIndex = Math.floor(Math.random() * PAPA_PROMPTS.length);
      }
    }
    room.draw.promptIndex = nextIndex;
    room.draw.prompt = PAPA_PROMPTS[nextIndex];
    room.draw.strokes = [];
    papaNs.to(`draw:${normalizedRoom}`).emit('papa:draw:state', {
      promptIndex: room.draw.promptIndex,
      prompt: room.draw.prompt,
      strokes: room.draw.strokes
    });
  });

  socket.on('papa:draw:clear', ({ roomCode }) => {
    const normalizedRoom = cleanRoomCode(roomCode);
    const room = getRoomState(normalizedRoom);
    room.draw.strokes = [];
    papaNs.to(`draw:${normalizedRoom}`).emit('papa:draw:state', {
      promptIndex: room.draw.promptIndex,
      prompt: room.draw.prompt,
      strokes: room.draw.strokes
    });
  });

  socket.on('papa:draw:segment', ({ roomCode, segment }) => {
    const normalizedRoom = cleanRoomCode(roomCode);
    const room = getRoomState(normalizedRoom);
    room.draw.strokes.push(segment);
    socket.to(`draw:${normalizedRoom}`).emit('papa:draw:segment', segment);
  });

  socket.on('papa:memory:flip', ({ roomCode, index }) => {
    const normalizedRoom = cleanRoomCode(roomCode);
    const room = getRoomState(normalizedRoom);
    const state = room.memory;
    const flipIndex = Number(index);

    if (state.over || state.locked || Number.isNaN(flipIndex)) return;
    if (flipIndex < 0 || flipIndex >= state.deck.length) return;
    if (state.matched[flipIndex] || state.revealed[flipIndex]) return;

    state.revealed[flipIndex] = true;

    if (state.firstOpen === null) {
      state.firstOpen = flipIndex;
      papaNs.to(`memory:${normalizedRoom}`).emit('papa:memory:state', state);
      return;
    }

    const firstIndex = state.firstOpen;
    const isMatch = state.deck[firstIndex] === state.deck[flipIndex];
    if (isMatch) {
      state.matched[firstIndex] = true;
      state.matched[flipIndex] = true;
      state.matches += 1;
      state.firstOpen = null;
      if (state.matches >= state.totalPairs) {
        state.over = true;
      }
      papaNs.to(`memory:${normalizedRoom}`).emit('papa:memory:state', state);
      return;
    }

    state.locked = true;
    papaNs.to(`memory:${normalizedRoom}`).emit('papa:memory:state', state);
    setTimeout(() => {
      state.revealed[firstIndex] = false;
      state.revealed[flipIndex] = false;
      state.firstOpen = null;
      state.locked = false;
      papaNs.to(`memory:${normalizedRoom}`).emit('papa:memory:state', state);
    }, 900);
  });

  socket.on('papa:memory:restart', ({ roomCode }) => {
    const normalizedRoom = cleanRoomCode(roomCode);
    const room = getRoomState(normalizedRoom);
    room.memory = memoryState();
    papaNs.to(`memory:${normalizedRoom}`).emit('papa:memory:state', room.memory);
  });

  socket.on('disconnect', () => {});
});

server.listen(port, () => {
  console.log(`BGames running on http://localhost:${port}`);
});
