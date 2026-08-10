const KNOWN_SURAHS = window.bgamesQuranSurahs;
const DISPLAY_NAMES = new Map(KNOWN_SURAHS.map((surah) => [surah.number, surah.name]));
const SESSION_LENGTH = 10;
const SHORT_AYAH_MAX_LETTERS = 18;
const MAX_PAIRED_PASSAGE_LETTERS = 55;
const ayahTextEl = document.getElementById('ayahText');
const promptEl = document.getElementById('prompt');
const referenceEl = document.getElementById('reference');
const feedbackEl = document.getElementById('feedback');
const choicesEl = document.getElementById('choices');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const choicePillEl = document.getElementById('choicePill');
const playAyahBtn = document.getElementById('playAyah');
const nextAyahBtn = document.getElementById('nextAyah');
const quranFontEl = document.getElementById('quranFont');
const audio = new Audio();

let activeSurahs = KNOWN_SURAHS;
let activeSurahNumbers = new Set(KNOWN_SURAHS.map((surah) => surah.number));
let activeThroughNumber = KNOWN_SURAHS.at(-1).number;
let manifest = null;
let currentAyah = null;
let currentPassage = [];
let currentAudioUrls = [];
let currentAudioIndex = 0;
let previousKeys = new Set();
let preparedRound = null;
let prefetchPromise = null;
let prefetchController = null;
let score = 0;
let perfectRounds = 0;
let streak = 0;
let locked = true;
let wrongAttempts = 0;
let successTimer = null;

function applyQuranFont(value) {
  const font = value === 'mushaf' ? 'mushaf' : 'naskh';
  document.body.dataset.quranFont = font;
  quranFontEl.value = font;
  localStorage.setItem('bgames:quran-font', font);
}

function difficulty() {
  return localStorage.getItem('bgames:difficulty') || 'large';
}

function choiceCount() {
  const level = difficulty();
  let requested = 3;
  if (level === 'small') requested = 5;
  if (level === 'medium') requested = 4;
  return Math.min(requested, activeSurahs.length);
}

function shuffle(values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function arabicLetterCount(text) {
  return Array.from(
    text.normalize('NFD').replace(/\p{M}/gu, '').replace(/[^\p{L}]/gu, '')
  ).length;
}

function buildPassage(seed) {
  if (arabicLetterCount(seed.text) > SHORT_AYAH_MAX_LETTERS) {
    return [seed];
  }

  const seedIndex = manifest.ayahs.findIndex((ayah) => ayah.key === seed.key);
  const neighbors = [manifest.ayahs[seedIndex + 1], manifest.ayahs[seedIndex - 1]];
  const neighbor = neighbors.find((candidate) => {
    if (!candidate || Number(candidate.surahNumber) !== Number(seed.surahNumber)) {
      return false;
    }
    const isConsecutive = Math.abs(
      Number(candidate.ayahNumber) - Number(seed.ayahNumber)
    ) === 1;
    const combinedLetters =
      arabicLetterCount(seed.text) + arabicLetterCount(candidate.text);
    return isConsecutive && combinedLetters <= MAX_PAIRED_PASSAGE_LETTERS;
  });

  return neighbor
    ? [seed, neighbor].sort((a, b) => Number(a.ayahNumber) - Number(b.ayahNumber))
    : [seed];
}

function createRoundData(excludedKeys = new Set()) {
  const candidates = manifest.ayahs.filter((ayah) => {
    if (!activeSurahNumbers.has(Number(ayah.surahNumber)) ||
        excludedKeys.has(ayah.key)) {
      return false;
    }
    return buildPassage(ayah).every((passageAyah) => !excludedKeys.has(passageAyah.key));
  });
  const seed = candidates[Math.floor(Math.random() * candidates.length)];
  return { passage: buildPassage(seed), audioUrls: [] };
}

function passageReference() {
  const surahName = DISPLAY_NAMES.get(Number(currentAyah.surahNumber));
  if (currentPassage.length === 1) {
    return `${surahName}, Ayah ${currentAyah.ayahNumber}`;
  }
  return `${surahName}, Ayat ${currentPassage[0].ayahNumber}-${currentPassage.at(-1).ayahNumber}`;
}

function loadPassageAudio(index) {
  currentAudioIndex = index;
  audio.src = currentAudioUrls[index] ||
    `/quran/husary/${currentPassage[index].audioFile}`;
  audio.load();
}

function replayButtonLabel() {
  return currentPassage.length > 1 ? 'Replay Both Ayat' : 'Replay Ayah';
}

function setReplayPlaying(isPlaying) {
  playAyahBtn.disabled = isPlaying;
  playAyahBtn.textContent = isPlaying ? 'Playing Recitation...' : replayButtonLabel();
}

function showNextAyahAction() {
  playAyahBtn.hidden = true;
  nextAyahBtn.hidden = false;
  nextAyahBtn.disabled = false;
  nextAyahBtn.classList.remove('show');
  void nextAyahBtn.offsetWidth;
  nextAyahBtn.classList.add('show');
  nextAyahBtn.focus();
}

function releaseAudioUrls(urls) {
  urls.forEach((url) => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
}

function discardPreparedRound() {
  prefetchController?.abort();
  prefetchController = null;
  if (preparedRound) {
    releaseAudioUrls(preparedRound.audioUrls);
    preparedRound = null;
  }
}

async function fetchRoundAudio(round, signal) {
  const audioUrls = [];
  try {
    for (const ayah of round.passage) {
      const response = await fetch(`/quran/husary/${ayah.audioFile}`, { signal });
      if (!response.ok) {
        throw new Error(`Next ayah audio prefetch failed with status ${response.status}.`);
      }
      const blob = await response.blob();
      audioUrls.push(URL.createObjectURL(blob));
    }
    return audioUrls;
  } catch (error) {
    releaseAudioUrls(audioUrls);
    throw error;
  }
}

function queueNextRound() {
  discardPreparedRound();
  const round = createRoundData(previousKeys);
  const controller = new AbortController();
  prefetchController = controller;
  const promise = fetchRoundAudio(round, controller.signal)
    .then((audioUrls) => {
      if (controller.signal.aborted) {
        releaseAudioUrls(audioUrls);
        return;
      }
      preparedRound = { passage: round.passage, audioUrls };
    })
    .catch((error) => {
      if (error.name !== 'AbortError') {
        console.error('Could not prepare the next ayah audio in advance.', error);
      }
    })
    .finally(() => {
      if (prefetchController === controller) {
        prefetchController = null;
      }
      if (prefetchPromise === promise) {
        prefetchPromise = null;
      }
    });
  prefetchPromise = promise;
}

function showSessionSuccess() {
  const accuracy = Math.round((perfectRounds / SESSION_LENGTH) * 100);
  window.bgamesQuranSuccess.show({
    accuracy,
    detail: `${perfectRounds} of ${SESSION_LENGTH} passages solved on the first try.`,
    onRestart: () => startSession(),
    onChangeRange: showRangeSetup
  });
}

function finishScoredRound(isPerfect) {
  score += 1;
  if (isPerfect) {
    perfectRounds += 1;
    streak += 1;
  } else {
    streak = 0;
  }
  scoreEl.textContent = String(score);
  streakEl.textContent = String(streak);

  if (score >= SESSION_LENGTH) {
    discardPreparedRound();
    nextAyahBtn.disabled = true;
    nextAyahBtn.hidden = true;
    playAyahBtn.hidden = true;
    feedbackEl.textContent = 'Set complete! Your Quran journey results are ready.';
    successTimer = setTimeout(showSessionSuccess, 900);
    return;
  }
  showNextAyahAction();
}

function showFailure(message, error) {
  locked = true;
  audio.pause();
  playAyahBtn.disabled = true;
  nextAyahBtn.disabled = true;
  choicesEl.innerHTML = '';
  ayahTextEl.textContent = 'Quran content could not be loaded.';
  feedbackEl.textContent = message;
  referenceEl.textContent = '';
  console.error(error);
}

function validateManifest(data) {
  if (!data || data.surahCount !== 37 || data.ayahCount !== 564) {
    throw new Error('The Quran manifest does not contain the expected 37 surahs and 564 ayat.');
  }
  if (!Array.isArray(data.surahs) || data.surahs.length !== 37 ||
      !Array.isArray(data.ayahs) || data.ayahs.length !== 564) {
    throw new Error('The Quran manifest arrays are incomplete.');
  }

  const keys = new Set();
  const audioFiles = new Set();
  data.ayahs.forEach((ayah) => {
    if (!ayah.key || !ayah.text || !ayah.audioFile ||
        !Number.isInteger(Number(ayah.ayahNumber)) || Number(ayah.ayahNumber) < 1 ||
        !DISPLAY_NAMES.has(Number(ayah.surahNumber))) {
      throw new Error(`Invalid ayah manifest entry: ${ayah?.key || 'unknown'}`);
    }
    if (keys.has(ayah.key)) {
      throw new Error(`Duplicate ayah manifest key: ${ayah.key}`);
    }
    keys.add(ayah.key);
    if (audioFiles.has(ayah.audioFile)) {
      throw new Error(`Duplicate ayah audio file: ${ayah.audioFile}`);
    }
    audioFiles.add(ayah.audioFile);
  });
}

async function playAyah(userInitiated = false) {
  if (!currentPassage.length) return;
  try {
    setReplayPlaying(true);
    loadPassageAudio(0);
    await audio.play();
    if (locked) {
      feedbackEl.textContent = 'Listen again, then tap Next Ayah when you are ready.';
    } else if (wrongAttempts > 0) {
      feedbackEl.textContent = currentPassage.length > 1
        ? 'Listen to both ayat again, then choose another surah.'
        : 'Listen again, then choose another surah.';
    } else {
      feedbackEl.textContent = currentPassage.length > 1
        ? 'Listen carefully to both ayat, then choose the surah.'
        : 'Listen carefully, then choose the surah.';
    }
  } catch (error) {
    setReplayPlaying(false);
    feedbackEl.textContent = userInitiated
      ? `The audio could not play. Select ${replayButtonLabel()} to try again.`
      : `Select ${replayButtonLabel()} to hear the recitation.`;
    if (userInitiated) {
      console.error(error);
    }
  }
}

function buildChoices() {
  const total = choiceCount();
  const correctSurah = activeSurahs.find(
    (surah) => surah.number === Number(currentAyah.surahNumber)
  );
  const distractors = shuffle(
    activeSurahs.filter((surah) => surah.number !== correctSurah.number)
  ).slice(0, total - 1);
  const choices = shuffle([correctSurah, ...distractors]);
  choicePillEl.textContent = `Choices: ${total}`;
  choicesEl.style.setProperty('--choice-count', String(total));
  choicesEl.innerHTML = '';

  choices.forEach((surah) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tile hifz-choice';
    button.textContent = surah.name;
    button.dataset.surahNumber = String(surah.number);
    button.addEventListener('click', () => chooseSurah(button, surah));
    choicesEl.appendChild(button);
  });
}

function chooseSurah(button, surah) {
  if (locked) return;
  const isCorrect = surah.number === Number(currentAyah.surahNumber);

  if (!isCorrect) {
    button.disabled = true;
    button.classList.add('try-again');
    wrongAttempts += 1;
    streak = 0;
    streakEl.textContent = '0';
    feedbackEl.textContent =
      `Good try. Choose another surah or select ${replayButtonLabel()}.`;
    window.bgamesSound?.play('bad');
    return;
  }

  locked = true;
  audio.pause();
  audio.currentTime = 0;
  const isPerfect = wrongAttempts === 0;
  button.classList.add('correct-choice');
  choicesEl.querySelectorAll('button').forEach((choice) => {
    choice.disabled = true;
  });
  referenceEl.textContent =
    passageReference();
  feedbackEl.textContent = 'Excellent! You found the correct surah.';
  finishScoredRound(isPerfect);
  window.bgamesSound?.play('good');
}

async function startRound() {
  if (!manifest) return;
  nextAyahBtn.disabled = true;
  audio.pause();
  let round = preparedRound;
  if (!round && prefetchPromise) {
    feedbackEl.textContent = 'Preparing the next ayah.';
    await prefetchPromise;
    round = preparedRound;
  }
  preparedRound = null;
  releaseAudioUrls(currentAudioUrls);
  currentAudioUrls = [];
  if (!round) {
    round = createRoundData(previousKeys);
  }

  currentPassage = round.passage;
  currentAudioUrls = round.audioUrls;
  currentAyah = currentPassage[0];
  previousKeys = new Set(currentPassage.map((ayah) => ayah.key));
  locked = false;
  wrongAttempts = 0;
  referenceEl.textContent = '';
  const isPaired = currentPassage.length > 1;
  promptEl.textContent = isPaired
    ? 'Listen to both ayat, read the large Arabic text, and choose their surah.'
    : 'Listen to the ayah, read the large Arabic text, and choose its surah.';
  feedbackEl.textContent = isPaired
    ? 'Listen carefully to both ayat, then choose the surah.'
    : 'Listen carefully, then choose the surah.';
  playAyahBtn.hidden = false;
  nextAyahBtn.hidden = true;
  nextAyahBtn.classList.remove('show');
  playAyahBtn.textContent = replayButtonLabel();
  if (currentPassage.length === 1) {
    ayahTextEl.textContent = currentPassage[0].text;
  } else {
    const firstWords = currentPassage[0].text.trim().split(/\s+/);
    const finalWord = firstWords.pop();
    const boundary = document.createElement('span');
    boundary.className = 'ayah-boundary';
    boundary.append(document.createTextNode(`${finalWord} `));
    const stop = document.createElement('span');
    stop.className = 'ayah-stop';
    stop.setAttribute('aria-hidden', 'true');
    stop.textContent = '•';
    boundary.append(stop);

    const passageNodes = [];
    if (firstWords.length) {
      passageNodes.push(document.createTextNode(`${firstWords.join(' ')} `));
    }
    passageNodes.push(boundary);
    passageNodes.push(document.createTextNode(` ${currentPassage[1].text}`));
    ayahTextEl.replaceChildren(...passageNodes);
  }
  const characterCount = Array.from(ayahTextEl.textContent).length;
  ayahTextEl.classList.toggle('long-ayah', characterCount > 130);
  ayahTextEl.classList.toggle('very-long-ayah', characterCount > 240);
  loadPassageAudio(0);
  playAyahBtn.disabled = false;
  nextAyahBtn.disabled = true;
  buildChoices();
  playAyah(false);
  queueNextRound();
}

async function initialize() {
  const response = await fetch('/quran/husary/manifest.json', { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`Quran manifest request failed with status ${response.status}.`);
  }
  const data = await response.json();
  validateManifest(data);
  manifest = data;
  showRangeSetup();
}

function applyActiveRange(throughNumber) {
  const endpoint = KNOWN_SURAHS.findIndex((surah) => surah.number === throughNumber);
  const safeEndpoint = endpoint >= 2 ? endpoint : KNOWN_SURAHS.length - 1;
  activeSurahs = KNOWN_SURAHS.slice(0, safeEndpoint + 1);
  activeSurahNumbers = new Set(activeSurahs.map((surah) => surah.number));
  activeThroughNumber = activeSurahs.at(-1).number;
}

function showRangeSetup() {
  audio.pause();
  discardPreparedRound();
  releaseAudioUrls(currentAudioUrls);
  currentAudioUrls = [];
  window.bgamesQuranRangeSetup.show({ onStart: startSession });
}

function startSession(throughNumber = activeThroughNumber) {
  applyActiveRange(throughNumber);
  if (successTimer) {
    clearTimeout(successTimer);
    successTimer = null;
  }
  score = 0;
  perfectRounds = 0;
  streak = 0;
  previousKeys = new Set();
  discardPreparedRound();
  releaseAudioUrls(currentAudioUrls);
  currentAudioUrls = [];
  scoreEl.textContent = '0';
  streakEl.textContent = '0';
  startRound();
}

audio.addEventListener('error', () => {
  setReplayPlaying(false);
  feedbackEl.textContent = 'This ayah audio could not be loaded. Select Replay to try again.';
});

audio.addEventListener('ended', () => {
  if (currentAudioIndex < currentPassage.length - 1) {
    loadPassageAudio(currentAudioIndex + 1);
    audio.play().catch((error) => {
      setReplayPlaying(false);
      feedbackEl.textContent =
        'The next ayah audio could not play. Select Replay Both Ayat to try again.';
      console.error(error);
    });
    return;
  }
  setReplayPlaying(false);
  if (!locked) {
    feedbackEl.textContent = 'Now choose the surah.';
  }
});

playAyahBtn.addEventListener('click', () => playAyah(true));
nextAyahBtn.addEventListener('click', startRound);
quranFontEl.addEventListener('change', () => applyQuranFont(quranFontEl.value));

applyQuranFont(localStorage.getItem('bgames:quran-font'));
initialize().catch((error) => {
  showFailure('The local Quran collection is incomplete or unavailable.', error);
});
