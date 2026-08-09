const SURAH_SEQUENCE = window.bgamesQuranSurahs;
const SESSION_LENGTH = 10;
const SET_INSTRUCTION = 'Tap the surahs in the same direction you memorize.';
const choicesEl = document.getElementById('choices');
const orderedListEl = document.getElementById('orderedList');
const feedbackEl = document.getElementById('feedback');
const completedEl = document.getElementById('completed');
const streakEl = document.getElementById('streak');
const groupPillEl = document.getElementById('groupPill');
const newRoundBtn = document.getElementById('newRound');

let sequence = [];
let selectedCount = 0;
let completed = 0;
let perfectRounds = 0;
let streak = 0;
let locked = false;
let hadMistake = false;
let previousStart = -1;
let successTimer = null;

function difficulty() {
  return localStorage.getItem('bgames:difficulty') || 'large';
}

function sequenceLength() {
  const level = difficulty();
  if (level === 'small') return 5;
  if (level === 'medium') return 4;
  return 3;
}

function shuffle(values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function renderSlots(showNumbers = false) {
  orderedListEl.innerHTML = '';
  sequence.forEach((surah, index) => {
    const slot = document.createElement('div');
    slot.className = `surah-order-slot${index < selectedCount ? ' filled' : ''}`;
    if (index < selectedCount) {
      slot.textContent = showNumbers ? `${surah.number}. ${surah.name}` : surah.name;
    } else {
      slot.textContent = String(index + 1);
      slot.setAttribute('aria-label', `Empty position ${index + 1}`);
    }
    orderedListEl.appendChild(slot);
  });
}

function showSessionSuccess() {
  const accuracy = Math.round((perfectRounds / SESSION_LENGTH) * 100);
  window.bgamesQuranSuccess.show({
    accuracy,
    detail: `${perfectRounds} of ${SESSION_LENGTH} groups ordered without a mistake.`,
    onRestart: startSession
  });
}

function showNextGroupAction() {
  newRoundBtn.hidden = false;
  newRoundBtn.disabled = false;
  newRoundBtn.classList.remove('show');
  void newRoundBtn.offsetWidth;
  newRoundBtn.classList.add('show');
  newRoundBtn.focus();
}

function finishRound() {
  locked = true;
  completed += 1;
  if (!hadMistake) {
    perfectRounds += 1;
    streak += 1;
  }
  completedEl.textContent = String(completed);
  streakEl.textContent = String(streak);
  feedbackEl.textContent = 'Excellent! That is the correct surah order.';
  groupPillEl.textContent = `Order: ${sequence[0].number} to ${sequence.at(-1).number}`;
  renderSlots(true);
  choicesEl.querySelectorAll('button').forEach((button) => {
    button.disabled = true;
  });
  window.bgamesSound?.play('good');
  if (completed >= SESSION_LENGTH) {
    newRoundBtn.disabled = true;
    newRoundBtn.hidden = true;
    feedbackEl.textContent = 'Set complete! Your Quran journey results are ready.';
    successTimer = setTimeout(showSessionSuccess, 900);
  } else {
    showNextGroupAction();
  }
}

function chooseSurah(button, surah) {
  if (locked) return;
  const expected = sequence[selectedCount];
  if (surah.number !== expected.number) {
    hadMistake = true;
    streak = 0;
    streakEl.textContent = '0';
    feedbackEl.textContent = 'Almost. Try the surah that comes next from the An-Nas side.';
    button.classList.add('try-again');
    window.bgamesSound?.play('bad');
    setTimeout(() => button.classList.remove('try-again'), 550);
    return;
  }

  selectedCount += 1;
  button.disabled = true;
  button.classList.add('correct-choice');
  feedbackEl.textContent = selectedCount === sequence.length
    ? 'You placed the whole group!'
    : 'Correct. Choose the next surah.';
  renderSlots(false);

  if (selectedCount === sequence.length) {
    finishRound();
  } else {
    window.bgamesSound?.play('good');
  }
}

function startRound() {
  newRoundBtn.hidden = true;
  newRoundBtn.classList.remove('show');
  const count = sequenceLength();
  const maxStart = SURAH_SEQUENCE.length - count;
  let start = Math.floor(Math.random() * (maxStart + 1));
  if (maxStart > 0 && start === previousStart) {
    start = (start + 1) % (maxStart + 1);
  }
  previousStart = start;
  sequence = SURAH_SEQUENCE.slice(start, start + count);
  selectedCount = 0;
  locked = false;
  hadMistake = false;
  groupPillEl.textContent = `Group of ${count}`;
  feedbackEl.textContent = 'Choose the first surah in this group.';
  renderSlots(false);

  choicesEl.style.setProperty('--choice-rows', String(Math.ceil(count / 2)));
  choicesEl.innerHTML = '';
  shuffle(sequence).forEach((surah) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tile surah-choice';
    button.textContent = surah.name;
    button.addEventListener('click', () => chooseSurah(button, surah));
    choicesEl.appendChild(button);
  });

}

function startSession() {
  if (successTimer) {
    clearTimeout(successTimer);
    successTimer = null;
  }
  completed = 0;
  perfectRounds = 0;
  streak = 0;
  previousStart = -1;
  completedEl.textContent = '0';
  streakEl.textContent = '0';
  newRoundBtn.disabled = false;
  newRoundBtn.hidden = true;
  startRound();
  window.bgamesSound?.say(SET_INSTRUCTION);
}

newRoundBtn.addEventListener('click', startRound);
startSession();
