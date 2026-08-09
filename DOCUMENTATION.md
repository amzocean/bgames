# BGames — Developer Documentation

## 1. Project Summary

`bgames` is a lightweight Node.js game portal for kids, built as a fun play site with two paths:

- **Play Solo**
- **Play with Papa**

The app is intentionally simple: static HTML/CSS/JS served by a small Express server. Most behavior lives in client-side code and `localStorage`, with Socket.IO used for papa-mode cross-device sync.
Shared audio helpers live in `public/sound.js`, and the shared success clip is `public/Good2.mp3`.

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
│   ├── Good2.mp3      # Shared win / success audio
│   ├── fonts/
│   │   ├── NotoNaskhArabic-VariableFont_wght.ttf
│   │   └── NotoNaskhArabic-OFL.txt
│   ├── solo/
│   │   ├── index.html
│   │   ├── surah-order.html / surah-order.js
│   │   ├── hifz-quiz.html / hifz-quiz.js
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
│   ├── quran/
│   │   ├── surah-range.js
│   │   └── husary/
│   │       ├── manifest.json
│   │       └── 083-Al-Mutaffifin/ ... 114-An-Naas/
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

- **Surah Order** — arrange short contiguous groups of known surahs in reverse Mushaf order, beginning from the An-Nas direction
- **Hifz Quiz** — listen to and read a random known ayah, then identify its surah
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

## 7. Quran Memorization Games

These games combine Quran memorization practice with the same accessible visual design used throughout BGames. They are designed for a seven-year-old learner who benefits from large, uncluttered, high-contrast presentation. They are educational practice activities, not a replacement for instruction from a parent or Quran teacher.

### Shared learning range

- Surahs **114 through 83**, from **An-Nas** back to **Al-Mutaffifin**
- Reverse learning order follows the learner's memorization direction: An-Nas, Al-Falaq, Al-Ikhlas, and onward
- The range contains **32 surahs and 388 ayat**
- Arabic text uses the Uthmani edition returned by AlQuran Cloud
- Audio uses Mahmoud Khalil Al-Husary's verse-by-verse recitation (`ar.husary`)
- Text and audio are downloaded ahead of time and served locally from `public/quran/husary/`
- The first ayah audio/text is preserved exactly as supplied by the source, including Bismillah where present

Local assets avoid runtime API delays, CORS failures, service outages, and inconsistent audio loading. `manifest.json` is the canonical game index and maps every ayah to its surah metadata, exact Arabic text, and local MP3 path.

### Accessibility requirements

- Arabic ayah text must be right-to-left, centered, high contrast, and rendered at a tablet-friendly size
- Use a Quran-appropriate Arabic font stack with generous line height; do not compress or truncate text
- Surah choices must use large text buttons with generous spacing
- The bundled Noto Naskh Arabic font keeps Quran text consistent across tablets
- Never rely on color alone to indicate state
- No countdown timers or speed penalties
- Audio can be replayed without limit
- Wrong answers receive gentle guidance and keep the learner in the same round
- Correct answers use positive sound feedback without overlapping the Quran recitation
- Existing `bgames:difficulty` settings control the number of choices, not text size; Quran text remains large at every level

### Surah Order

#### Concept

Surah Order teaches the reverse sequence used by the learner, starting from the An-Nas direction. Each round selects a contiguous group from the known range, shuffles the names, and asks the learner to tap them in the correct reverse Mushaf order.

The game does not show surah numbers while the round is active because descending numbers would reveal the answer. After completion, the ordered sequence may show its numbers as confirmation.

#### Difficulty

- **Large:** 3 surahs
- **Medium:** 4 surahs
- **Small:** 5 surahs

The shared difficulty names describe the general BGames tile-density convention: Large is the easiest mode with the fewest, largest choices.

#### Round behavior

1. Select a contiguous sequence from surahs 114–83.
2. Shuffle its visible choices.
3. Ask the learner to tap from the An-Nas direction.
4. Move each correct choice into a clearly numbered answer row.
5. On a wrong choice, keep the round intact and prompt the learner to try again.
6. Keep **Next Group** hidden while the sequence is active.
7. On completion, reveal the canonical numbers, celebrate, and show a large animated **Next Group** action.
8. Speak the simplified set instruction once per 10-group set, without attempting to pronounce “An-Nas”; do not repeat it for every group.

#### Implementation

- Static client-side HTML and JavaScript
- No server or Socket.IO state
- Shared surah names and reverse order live in `public/quran/surah-range.js`
- Uses shared sound helpers and `bgames:difficulty`
- Touch-first buttons; no drag-and-drop requirement

### Hifz Quiz

#### Concept

Hifz Quiz selects an ayah from the local known-range manifest, displays its Arabic text in large bold type, plays its recitation, and asks which surah contains it. Very short ayat are paired with an adjacent ayah from the same surah.

#### Difficulty

- **Large:** 3 surah choices
- **Medium:** 4 surah choices
- **Small:** 5 surah choices

All distractors must be different surahs from the known range. Choice order is randomized every round.

#### Round behavior

1. Load and validate `public/quran/husary/manifest.json`.
2. Select a random ayah, avoiding an immediate repeat.
3. Pair a very short ayah with an adjacent ayah from the same surah.
4. Display the exact Uthmani Arabic text with `dir="rtl"`.
5. Load the matching local Husary MP3 or consecutive MP3s and attempt playback.
6. If browser autoplay is blocked, clearly prompt the learner to tap the play button.
7. Allow unlimited replay.
8. Keep surah choices disabled until the audio element reports that the complete passage has ended; paired ayat unlock only after both recordings finish.
9. Present large surah-name choices without displaying the correct surah elsewhere.
10. Show one large **Replay** button while the question is active.
11. A wrong answer remains disabled, but the remaining choices stay available immediately; replay occurs only when the learner explicitly selects **Replay**.
12. A correct answer reveals the ayah reference, replaces **Replay** with a large animated **Next Ayah** action, and gives positive feedback.

#### Ten-challenge sets

- Each Hifz Quiz or Surah Order session contains 10 scored challenges.
- Accuracy is the percentage completed without a wrong choice.
- After challenge 10, a randomized Quran-themed reward screen shows `Solved with X% accuracy!`.
- Reward themes vary between moon, star, geometric, emerald, gold, and night-sky treatments.
- The Quran games use synthesized celebration tones and do not play the personal `Good2.mp3` victory recording.

#### Data integrity

The download/build process must fail if:

- a requested surah or ayah is missing
- text and audio ayah numbers do not align
- an audio download is empty or suspiciously small
- the final count is not exactly 32 surahs and 388 ayat
- an audio filename or manifest key is duplicated

The app must surface manifest or audio failures to the user rather than silently substituting another ayah.

#### Implementation

- Static client-side HTML and JavaScript
- `fetch('/quran/husary/manifest.json')` loads local metadata
- The browser `Audio` API plays local verse files
- While the learner answers the current question, the next passage audio is fetched into in-memory blob URLs so **Next Ayah** does not wait on a new server request
- Prepared blob URLs are revoked when consumed, replaced, or abandoned to avoid accumulating browser memory
- No live Quran API is required during gameplay
- Arabic uses the bundled Noto Naskh Arabic variable font with a large responsive size and strong foreground/background contrast

### Quran data provenance

- Metadata and Uthmani text: [AlQuran Cloud](https://alquran.cloud/api)
- Verse audio CDN: Islamic Network, referenced by AlQuran Cloud
- Reciter: Mahmoud Khalil Al-Husary

Quran text must be preserved exactly as downloaded. Source and reciter metadata remain in the manifest for traceability.

## 8. Current Implementation Status

### Quran learning games (implemented)

- Surah Order is implemented and wired into `/solo/index.html`.
- Hifz Quiz is implemented and wired into `/solo/index.html`.
- Both games cover surahs 114–83 and use the shared accessibility and difficulty conventions above.
- Hifz Quiz uses the checked-in local Husary ayah collection and does not require a live Quran API.

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

## 9. UI and Layout

- App pages are now configured to use near full-viewport layout for tablet play.
- Layout remains responsive and collapses to single-column on smaller screens.
- Existing large touch targets and high-contrast visual style are preserved.

## 10. Realtime Notes

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

## 11. Shared UI Conventions

- **Big tile-first layout** for iPad-friendly touch input
- **Positive feedback only**; no harsh failure language
- **Sound toggle on every page**
- Shared audio helpers live in `public/sound.js`
- Shared success audio lives in `public/Good2.mp3` and is used for all shared win states

Sound state is saved in:

- `bgames:soundOn`

## 12. Next Plan

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
