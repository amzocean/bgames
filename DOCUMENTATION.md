# BGames — Developer Documentation

## 1. Project Summary

`bgames` is a lightweight Node.js game portal for kids, built as a fun play site with two paths:

- **Play Solo**
- **Play with Papa**

The app is intentionally simple: static HTML/CSS/JS served by a small Express server. Most behavior lives in client-side code and `localStorage`, with Socket.IO used for papa-mode cross-device sync.

## 2. Repository

- **Local path:** `C:\Users\huseinm\Downloads\bgames`
- **GitHub repo:** `https://github.com/amzocean/bgames.git`
- **Default branch:** `main`
- **Runtime:** Node.js

## 3. Runtime / Deployment

The app uses a single `server.js` file:

- serves `public/` with `express.static()`
- forces HTML revalidation with `Cache-Control: no-cache`
- reads `process.env.PORT || 3000`

### Local run
```bash
cd C:\Users\huseinm\Downloads\bgames
npm install
npm start
```

### Render deployment

This repo is set up to run as a **Render Web Service**.

- **Build command:** `npm install`
- **Start command:** `node server.js`
- **Root directory:** repo root
- **Environment variables:** none required today

## 4. Folder Structure

```text
bgames/
├── server.js          # Express + Socket.IO server
├── package.json       # Node metadata + start script
├── public/
│   ├── index.html     # Home page with Solo / Papa entry tiles
│   ├── styles.css     # Shared UI styles
│   ├── sound.js       # Shared sound toggle + audio helpers
│   ├── solo/
│   │   ├── index.html
│   │   ├── detective.html / detective.js
│   │   ├── memory.html / memory.js
│   │   ├── hunt.html / hunt.js
│   │   ├── pattern.html / pattern.js
│   │   ├── odd-one.html / odd-one.js
│   │   ├── maze.html / maze.js
│   │   ├── treasure.html / treasure.js
│   │   ├── story.html / story.js
│   │   ├── sound.html / sound.js
│   │   ├── scene.html / scene.js
│   │   ├── spot.html / spot.js
│   │   ├── mirror.html / mirror.js
│   │   ├── rhythm.html / rhythm.js
│   │   └── categories.html / categories.js
│   └── papa/
│       ├── index.html
│       ├── tictactoe.html / tictactoe.js
│       ├── memory.html / memory.js
│       └── draw.html / draw.js
└── DOCUMENTATION.md
```

## 5. App Flow

### Home

`/` shows two large tiles:

- **Play Solo**
- **Play with Papa**

### Solo mode

`/solo/` is a game picker. It also stores the shared difficulty level in `localStorage` under:

- `bgames:difficulty`

### Papa mode

`/papa/` is the shared play picker. It stores the room code in:

- `bgames:roomCode`

Papa games join a Socket.IO room using the shared room code. The server keeps in-memory room state so both devices see the same Tic-Tac-Toe board or drawing canvas.

## 6. Game Behavior

All games are client-side and use local state only.

### Solo games

- **Detective Find-It** — icon search and completion celebration
- **Memory Cards** — picture matching with peek time and streak feedback
- **Letter/Number Hunt** — visual scanning game
- **Trace/Connect-the-Dots** — guided tap order game
- **Pattern Builder** — complete a repeating visual pattern
- **Odd One Out** — spot the item that does not belong
- **Catch the Star** — tap the falling star and avoid bombs
- **Falling Treasure** — catch treasure as it falls while dodging bombs
- **Hidden Path / Maze** — remember and follow a short path to treasure
- **Treasure Map** — follow ordered landmark clues to reach treasure
- **Story Match** — connect two cards that belong to the same mini-story
- **Sound Hunt** — listen to a clue and tap the matching picture
- **Build the Scene** — place items into the right scene spots
- **Spot the Change** — compare two boards and find one changed card
- **Mirror Match** — pick the left-right mirrored version of a target shape
- **Repeat the Rhythm** — copy a short visual/audio tap pattern
- **Quick Categories** — sort cards into two large category buckets

### Papa games

- **Tic-Tac-Toe** — two-player live sync via Socket.IO room state
- **Memory Cards** — two-player live sync via Socket.IO room state
- **Drawing Guessing** — shared drawing canvas with live stroke sync and shared prompts

## 7. Current Implementation Status

### Phase 1 (implemented)

- Pattern Builder
- Odd One Out
These are now wired into `/solo/index.html` and follow the same shared sound and difficulty model as the original solo games.

### Phase 2 (in progress)

- Hidden Path / Maze is now implemented and wired into `/solo/index.html`.
- Treasure Map is now implemented and wired into `/solo/index.html`.
- Story Match is now implemented and wired into `/solo/index.html`.
- Sound Hunt is now implemented and wired into `/solo/index.html`.
- Build the Scene is now implemented and wired into `/solo/index.html`.
- Spot the Change is now implemented and wired into `/solo/index.html`.
- Mirror Match is now implemented and wired into `/solo/index.html`.
- Repeat the Rhythm is now implemented and wired into `/solo/index.html`.
- Quick Categories is now implemented and wired into `/solo/index.html`.
- Catch the Star and Falling Treasure are now implemented and wired into `/solo/index.html`.

## 8. UI and Layout

- App pages are now configured to use near full-viewport layout for tablet play.
- Layout remains responsive and collapses to single-column on smaller screens.
- Existing large touch targets and high-contrast visual style are preserved.

## 9. Realtime Notes

- Socket namespace: `/papa`
- Room key format: `game:roomCode` (for example `tictactoe:family1`)
- Room code is normalized to lowercase alphanumerics, `_`, and `-`
- State is in-memory only; a Render restart clears active papa rooms

### Tictactoe sync

- Server owns board state, turn order, and win/draw detection
- Clients send only moves and restarts
- Clients render from the latest state broadcast by the server

### Drawing sync

- Server owns the active prompt and stroke list
- Clients send drawing segments, clears, and new-prompt requests
- Joining clients receive the full stroke history and replay it locally

### Memory sync

- Server owns deck order, flipped cards, match count, and lock state
- Clients send card flip requests and restart requests
- Server resolves match logic and broadcasts the canonical board state

## 10. Shared UI Conventions

- **Big tile-first layout** for iPad-friendly touch input
- **Positive feedback only**; no harsh failure language
- **Sound toggle on every page**
- Shared audio helpers live in `public/sound.js`

Sound state is saved in:

- `bgames:soundOn`

## 11. Next Plan

Planned next solo batch (from the implementation plan):

- Current roadmap batch completed.

### Additional idea backlog

1. Spot the Change
2. Mirror Match
3. Repeat the Rhythm
4. Quick Categories

### Development pattern for each new game

- Keep new pages visually large and touch-friendly.
- If adding new games, follow the existing pattern:
  1. add `html`
  2. add `js`
  3. wire it into the relevant mode picker
  4. include `sound.js`
- If real-time multiplayer is added later, Express alone will not be enough; add a realtime backend service.
