(() => {
  const STORAGE_KEY = 'bgames:quran-known-through';
  const MINIMUM_SURAHS = 3;
  const DEFAULT_SURAH_NUMBER = 84;
  const surahs = window.bgamesQuranSurahs;
  const defaultIndex = surahs.findIndex((surah) => surah.number === DEFAULT_SURAH_NUMBER);
  let selectedIndex = defaultIndex;
  let startHandler = null;

  function storedIndex() {
    const storedNumber = Number(localStorage.getItem(STORAGE_KEY));
    const index = surahs.findIndex((surah) => surah.number === storedNumber);
    return index >= MINIMUM_SURAHS - 1 ? index : defaultIndex;
  }

  function createOverlay() {
    const overlay = document.createElement('section');
    overlay.className = 'quran-range-setup';
    overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'quranRangeTitle');
    overlay.innerHTML = `
      <div class="quran-range-pattern" aria-hidden="true"></div>
      <div class="quran-range-card">
        <p class="quran-range-symbols" aria-hidden="true">✦ ☾ ✦</p>
        <p class="quran-range-kicker">Choose your Quran journey</p>
        <h2 id="quranRangeTitle">I memorized from An-Nas to...</h2>
        <div class="quran-range-stepper">
          <button class="quran-range-less" type="button" aria-label="Choose fewer learned surahs">
            <span aria-hidden="true">←</span>
            Less
          </button>
          <div class="quran-range-selection" aria-live="polite">
            <strong class="quran-range-name"></strong>
            <span class="quran-range-number"></span>
            <span class="quran-range-count"></span>
          </div>
          <button class="quran-range-more" type="button" aria-label="Choose more learned surahs">
            More
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <div class="quran-range-progress" aria-hidden="true">
          <span></span>
        </div>
        <p class="quran-range-summary"></p>
        <button class="quran-range-start" type="button">Start 10-Challenge Set</button>
        <a href="/solo/" class="quran-range-back">Back to Solo Games</a>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('.quran-range-less').addEventListener('click', () => {
      selectedIndex = Math.max(MINIMUM_SURAHS - 1, selectedIndex - 1);
      render(overlay);
    });
    overlay.querySelector('.quran-range-more').addEventListener('click', () => {
      selectedIndex = Math.min(surahs.length - 1, selectedIndex + 1);
      render(overlay);
    });
    overlay.querySelector('.quran-range-start').addEventListener('click', () => {
      const selected = surahs[selectedIndex];
      localStorage.setItem(STORAGE_KEY, String(selected.number));
      overlay.hidden = true;
      startHandler?.(selected.number);
    });
    return overlay;
  }

  function render(overlay) {
    const selected = surahs[selectedIndex];
    const learnedCount = selectedIndex + 1;
    overlay.querySelector('.quran-range-name').textContent = selected.name;
    overlay.querySelector('.quran-range-number').textContent = `Surah ${selected.number}`;
    overlay.querySelector('.quran-range-count').textContent =
      `${learnedCount} surahs learned`;
    overlay.querySelector('.quran-range-summary').textContent =
      `This set will use surahs from An-Nas through ${selected.name}.`;
    overlay.querySelector('.quran-range-progress span').style.width =
      `${(learnedCount / surahs.length) * 100}%`;
    overlay.querySelector('.quran-range-less').disabled =
      selectedIndex === MINIMUM_SURAHS - 1;
    overlay.querySelector('.quran-range-more').disabled =
      selectedIndex === surahs.length - 1;
  }

  function show({ onStart }) {
    const overlay = document.querySelector('.quran-range-setup') || createOverlay();
    startHandler = onStart;
    selectedIndex = storedIndex();
    render(overlay);
    overlay.hidden = false;
    overlay.querySelector('.quran-range-start').focus();
  }

  window.bgamesQuranRangeSetup = { show };
})();
