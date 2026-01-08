
// ============================
// 1) CONFIG GLOBALE
// ============================
const IMG_PATH = 'assets/images';  // 📂 Dossier des images
const IMG_EXT  = 'jpg';            // 🖼️ 'jpg' | 'png' | 'webp'

// ============================
// 2) TAILLE = PLUS PETITE IMAGE
// ============================
async function setCardSizeFromSmallestImage() {
  const files = [
    ...Array.from({ length: 10 }, (_, i) => `${IMG_PATH}/${i + 1}.${IMG_EXT}`),
    `${IMG_PATH}/shiny.${IMG_EXT}`
  ];

  const loads = files.map(src => new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = src;
  }));

  const results = (await Promise.all(loads)).filter(Boolean);
  if (!results.length) {
    console.warn('[Mini-jeu] Impossible de lire la taille des images, on garde les valeurs CSS par défaut.');
    return;
  }

  const minW = Math.min(...results.map(r => r.w));
  const minH = Math.min(...results.map(r => r.h));

  document.documentElement.style.setProperty('--card-w', `${minW}px`);
  document.documentElement.style.setProperty('--card-h', `${minH}px`);

  console.info(`[Mini-jeu] Cartes réglées sur ${minW}×${minH} (plus petite image)`);
}

window.addEventListener('DOMContentLoaded', () => {
  setCardSizeFromSmallestImage();
});

// ============================
// 3) SPA / ONGLET DE NAVIGATION
// ============================
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const id = tab.dataset.target;
    panels.forEach(p => p.classList.toggle('visible', p.id === id));

    history.replaceState(null, '', `#${id}`);

    const panel = document.getElementById(id);
    panel && panel.focus();
  });
});

document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-target]');
  if (!link) return;
  const dest = link.getAttribute('data-target');
  const btn = Array.from(tabs).find(t => t.dataset.target === dest);
  if (btn) btn.click();
});

window.addEventListener('DOMContentLoaded', () => {
  const hash = location.hash.replace('#', '');
  const initial = Array.from(tabs).find(t => t.dataset.target === hash) || tabs[0];
  initial && initial.click();
});

// ============================
// 4) MINI-JEU
// ============================
(function () {
  const panel     = document.getElementById('minigame');
  const grid      = panel?.querySelector('.game-grid');
  const statusEl  = panel?.querySelector('.game-status');
  const replayBtn = document.getElementById('replay-btn');
  if (!panel || !grid || !statusEl || !replayBtn) return;

  let winningIndex = 0;
  let locked = false;

  function pickTwoDistinctNormalImages() {
    const pool = Array.from({ length: 10 }, (_, i) => `${IMG_PATH}/${i + 1}.${IMG_EXT}`);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 2);
  }

  function initGame() {
    winningIndex = Math.floor(Math.random() * 3);
    locked = false;
    statusEl.textContent = "Choisis une carte…";

    const normals = pickTwoDistinctNormalImages();
    const cards = grid.querySelectorAll('.card');

    cards.forEach((card, idx) => {
      const img = card.querySelector('.card-img');
      const src = (idx === winningIndex)
        ? `${IMG_PATH}/shiny.${IMG_EXT}`
        : normals.pop();

      img.decoding = 'async';
      img.loading = 'lazy';
      img.src = src;
      img.alt = (idx === winningIndex) ? "Carte shiny" : "Carte";

      card.classList.remove('flipped', 'revealed', 'win', 'lose');
      card.disabled = false;
      card.dataset.index = String(idx);
    });
  }

  function reveal(clickedCard) {
    if (locked) return;
    locked = true;

    const clickedIndex = Number(clickedCard.dataset.index);
    const cards = Array.from(grid.querySelectorAll('.card'));

    cards.forEach(c => {
      c.classList.add('flipped', 'revealed');
      c.disabled = true;
    });

    const shinyCard = cards[winningIndex];
    shinyCard.classList.add('win');

    if (clickedIndex !== winningIndex) {
      clickedCard.classList.add('lose');
      statusEl.textContent = "🦶 PERDU, Coup dur pour la joueuse belge ";
    } else {
      statusEl.textContent = "🫦 SMOOCH SMOOCH TU AS GAGNE !";
    }
  }

  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    reveal(card);
  });

  replayBtn.addEventListener('click', initGame);

  const observer = new MutationObserver(() => {
    if (panel.classList.contains('visible')) initGame();
  });
  observer.observe(panel, { attributes: true, attributeFilter: ['class'] });

  if (panel.classList.contains('visible')) initGame();
})();
