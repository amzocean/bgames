(() => {
  const themes = [
    {
      className: 'success-theme-moon',
      title: 'A Beautiful Quran Journey!',
      symbols: ['☾', '✦', '✧', '★']
    },
    {
      className: 'success-theme-emerald',
      title: 'Your Knowledge Is Growing!',
      symbols: ['◆', '✦', '❖', '✧']
    },
    {
      className: 'success-theme-gold',
      title: 'A Brilliant Set Complete!',
      symbols: ['✦', '★', '✧', '◆']
    },
    {
      className: 'success-theme-night',
      title: 'Ten Quran Challenges Complete!',
      symbols: ['☾', '★', '✦', '❖']
    }
  ];

  let previousTheme = -1;
  let restartHandler = null;

  function createOverlay() {
    const overlay = document.createElement('section');
    overlay.className = 'quran-success';
    overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'quranSuccessTitle');
    overlay.innerHTML = `
      <div class="quran-success-pattern" aria-hidden="true"></div>
      <div class="quran-success-card">
        <div class="quran-success-sparkles" aria-hidden="true"></div>
        <p class="quran-success-kicker">10-challenge set complete</p>
        <p class="quran-success-arabic" lang="ar" dir="rtl">مَا شَاءَ ٱللَّٰهُ</p>
        <h2 id="quranSuccessTitle"></h2>
        <p class="quran-success-score"></p>
        <p class="quran-success-detail"></p>
        <div class="quran-success-actions">
          <button class="quran-success-restart" type="button">Play Another Set</button>
          <a href="/solo/">Back to Solo Games</a>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('.quran-success-restart').addEventListener('click', () => {
      overlay.hidden = true;
      restartHandler?.();
    });
    return overlay;
  }

  function pickTheme() {
    let index = Math.floor(Math.random() * themes.length);
    if (themes.length > 1 && index === previousTheme) {
      index = (index + 1) % themes.length;
    }
    previousTheme = index;
    return themes[index];
  }

  function renderSparkles(container, symbols) {
    container.replaceChildren();
    for (let index = 0; index < 24; index += 1) {
      const sparkle = document.createElement('span');
      sparkle.textContent = symbols[index % symbols.length];
      sparkle.style.setProperty('--sparkle-x', `${5 + Math.random() * 90}%`);
      sparkle.style.setProperty('--sparkle-y', `${4 + Math.random() * 88}%`);
      sparkle.style.setProperty('--sparkle-delay', `${Math.random() * 1.4}s`);
      sparkle.style.setProperty('--sparkle-size', `${0.8 + Math.random() * 1.5}rem`);
      container.appendChild(sparkle);
    }
  }

  function show({ accuracy, detail, onRestart }) {
    const overlay = document.querySelector('.quran-success') || createOverlay();
    const theme = pickTheme();
    restartHandler = onRestart;
    overlay.className = `quran-success ${theme.className}`;
    overlay.querySelector('#quranSuccessTitle').textContent = theme.title;
    overlay.querySelector('.quran-success-score').textContent =
      `Solved with ${accuracy}% accuracy!`;
    overlay.querySelector('.quran-success-detail').textContent = detail;
    renderSparkles(overlay.querySelector('.quran-success-sparkles'), theme.symbols);
    overlay.hidden = false;
    overlay.querySelector('.quran-success-restart').focus();
    window.bgamesSound?.play('celebrate');
  }

  window.bgamesQuranSuccess = { show };
})();
