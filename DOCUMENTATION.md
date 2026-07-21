# BGames — Developer Documentation

## 1. Project Summary

`bgames` is a lightweight Node.js game portal for kids, built as a fun play site with two paths:

- **Play Solo**
- **Play with Papa**

The app is intentionally simple: static HTML/CSS/JS served by a small Express server. Most behavior lives in client-side code and `localStorage`.

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
├── server.js          # Express server
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
│   │   └── trace.html / trace.js
│   └── papa/
│       ├── index.html
│       ├── tictactoe.html / tictactoe.js
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

## 6. Game Behavior

All games are client-side and use local state only.

### Solo games

- **Detective Find-It** — icon search and completion celebration
- **Memory Cards** — picture matching with peek time and streak feedback
- **Letter/Number Hunt** — visual scanning game
- **Trace/Connect-the-Dots** — guided tap order game

### Papa games

- **Tic-Tac-Toe** — two-player local turn-taking
- **Drawing Guessing** — shared drawing canvas with prompt rotation

## 7. Shared UI Conventions

- **Big tile-first layout** for iPad-friendly touch input
- **Positive feedback only**; no harsh failure language
- **Sound toggle on every page**
- Shared audio helpers live in `public/sound.js`

Sound state is saved in:

- `bgames:soundOn`

## 8. Notes for Future Work

- Keep new pages visually large and touch-friendly.
- If adding new games, follow the existing pattern:
  1. add `html`
  2. add `js`
  3. wire it into the relevant mode picker
  4. include `sound.js`
- If real-time multiplayer is added later, Express alone will not be enough; add a realtime backend service.

