
// =======================
// Gestion des onglets (SPA)
// =======================
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

    if (id === 'game') initGame();
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
  initial.click();
});

// =======================
// Mini-jeu : attendre FIN du flip-back, puis réorganiser
// =======================
const grid      = document.querySelector('#game .game-grid');
const cards     = document.querySelectorAll('#game .card');
const replayBtn = document.querySelector('#game .game-actions .btn');

// Images côté face (adapte les chemins)
const images = ['img1.jpg', 'img2.jpg', 'img3.jpg'];

let shinyIndex = -1;
let gameReady = false;
let resetInProgress = false;

// -------- Utils --------
const shuffleArray = arr => arr.sort(() => Math.random() - 0.5);

function setCardFrontImage(card, src) {
  const imgEl = card.querySelector('.card-img');
  if (imgEl) imgEl.src = src;
}

function getFlipDurationMs() {
  const inner = document.querySelector('#game .card .card-inner');
  if (!inner) return 420;
  const d = getComputedStyle(inner).transitionDuration.split(',')[0].trim();
  if (d.endsWith('ms')) return parseFloat(d) || 420;
  if (d.endsWith('s')) return (parseFloat(d) || 0.42) * 1000;
  return 420;
}

function waitFlipBackFor(inner, shouldWait, timeoutMs) {
  return new Promise(resolve => {
    if (!shouldWait) return requestAnimationFrame(() => requestAnimationFrame(resolve));
    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;
      inner.removeEventListener('transitionend', onEnd);
      clearTimeout(fallback);
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    };
    const onEnd = (e) => {
      if (e.propertyName === 'transform') cleanup();
    };
    inner.addEventListener('transitionend', onEnd, { once: true });
    const fallback = setTimeout(cleanup, timeoutMs + 200);
  });
}

async function waitAllFlipBack(beforeStates) {
  const inners = Array.from(document.querySelectorAll('#game .card .card-inner'));
  const flipMs = getFlipDurationMs();
  const waits = inners.map((inner, i) => waitFlipBackFor(inner, !!beforeStates[i], flipMs));
  await Promise.all(waits);
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
}

function resetVisualState() {
  cards.forEach(card => {
    card.classList.remove('revealed', 'win', 'lose', 'flipped');
    card.disabled = false;
  });
}

// -------- Init --------
function initGame() {
  shinyIndex = -1;
  gameReady = true;
  resetVisualState();
  cards.forEach(card => {
    const imgEl = card.querySelector('.card-img');
    if (imgEl) imgEl.removeAttribute('src'); // ou imgEl.src = 'dos.png';
  });
}

// -------- Rejouer --------
if (replayBtn) {
  replayBtn.addEventListener('click', async () => {
    if (resetInProgress) return;
    resetInProgress = true;

    try {
      gameReady = false;
      replayBtn.disabled = true;
      cards.forEach(c => c.disabled = true);

      const beforeStates = Array.from(cards).map(c => c.classList.contains('flipped'));

      // Masquer les faces avant pendant le reset
      grid.classList.add('lock');

      // Flip-back
      resetVisualState();

      // Attendre la fin complète du flip-back
      await waitAllFlipBack(beforeStates);

      // Shuffle DOM
      const frag = document.createDocumentFragment();
      const shuffledCards = shuffleArray(Array.from(cards));
      shuffledCards.forEach(c => frag.appendChild(c));
      grid.appendChild(frag);

      // Réattribuer les images
      const shuffledImages = shuffleArray([...images]);
      shuffledCards.forEach((card, i) => setCardFrontImage(card, shuffledImages[i]));

      // Réafficher les faces avant
      grid.classList.remove('lock');

      // Réactiver
      shinyIndex = -1;
      shuffledCards.forEach(c => c.disabled = false);
      replayBtn.disabled = false;
      gameReady = true;
    } finally {
      resetInProgress = false;
    }
  });
}

// -------- Clic carte --------
cards.forEach(card => {
  card.addEventListener('click', () => {
    if (!gameReady || card.disabled) return;

    const currentCards = Array.from(document.querySelectorAll('#game .card'));
    const clickedIndex = currentCards.indexOf(card);

    if (shinyIndex < 0) {
      shinyIndex = Math.floor(Math.random() * currentCards.length);
    }

    card.classList.add('flipped');
    requestAnimationFrame(() => {
      card.classList.add('revealed', clickedIndex === shinyIndex ? 'win' : 'lose');
    });

    if (clickedIndex !== shinyIndex) {
      const shinyCard = currentCards[shinyIndex];
      setTimeout(() => {
        shinyCard.classList.add('flipped', 'revealed', 'win');
      }, getFlipDurationMs() / 2);
    }

    currentCards.forEach(c => (c.disabled = true));
    gameReady = false;
  });
});
