
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
// Mini-jeu : reset -> dos "?" puis shuffle après flip-back
// =======================
const grid      = document.querySelector('#game .game-grid');
const cards     = document.querySelectorAll('#game .card');
const replayBtn = document.querySelector('#game .game-actions .btn');

// Adapte les chemins d’images côté face :
const images = ['img1.jpg', 'img2.jpg', 'img3.jpg'];

let shinyIndex = -1;
let gameReady = false;
let resetInProgress = false;

// -------- Utils --------
const shuffleArray = arr => arr.sort(() => Math.random() - 0.5);

function setCardFrontData(card, src) {
  // On prépare l'image sans l'afficher (pas de src ici)
  const imgEl = card.querySelector('.card-img');
  if (imgEl) {
    imgEl.removeAttribute('src');      // face avant pas visible avant clic
    imgEl.dataset.front = src;         // on stocke l'URL à utiliser au clic
  }
}

function ensureFrontSrcBeforeFlip(card) {
  // Juste avant d'afficher la face avant, on applique la vraie image
  const imgEl = card.querySelector('.card-img');
  if (imgEl && !imgEl.src) {
    const src = imgEl.dataset.front;
    if (src) imgEl.src = src;
  }
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
    if (!shouldWait) {
      // Double rAF -> garantit un repaint complet même sans transition
      return requestAnimationFrame(() => requestAnimationFrame(resolve));
    }
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

function resetToBackFace() {
  // Montre le dos "?" en retirant flipped et tout état visuel
  cards.forEach(card => {
    card.classList.remove('revealed', 'win', 'lose', 'flipped');
    card.disabled = false;
  });
}

// -------- Init --------
function initGame() {
  shinyIndex = -1;
  gameReady = true;

  // On remet toutes les cartes côté dos "?" (pas d'image front visible)
  resetToBackFace();

  // On efface toute image front visible et data-front
  cards.forEach(card => {
    const imgEl = card.querySelector('.card-img');
    if (imgEl) {
      imgEl.removeAttribute('src');   // pas d'image visible
      delete imgEl.dataset.front;     // pas d'image préparée
    }
  });
}

// -------- Rejouer : d’abord dos "?" + attendre fin flip-back, puis shuffle --------
if (replayBtn) {
  replayBtn.addEventListener('click', async () => {
    if (resetInProgress) return; // anti double-clic
    resetInProgress = true;

    try {
      gameReady = false;
      replayBtn.disabled = true;
      cards.forEach(c => c.disabled = true);

      // Quelles cartes vont animer ? (celles actuellement en "flipped")
      const beforeStates = Array.from(cards).map(c => c.classList.contains('flipped'));

      // 1) Remet immédiatement le dos "?" (retire flipped)
      resetToBackFace();

      // 2) Attendre VRAIMENT la fin du flip-back
      await waitAllFlipBack(beforeStates);

      // 3) Shuffle DOM (après flip-back, donc aucun mouvement visible pendant l’anim)
      const frag = document.createDocumentFragment();
      const shuffledCards = shuffleArray(Array.from(cards));
      shuffledCards.forEach(c => frag.appendChild(c));
      grid.appendChild(frag);

      // 4) Préparer des images aléatoires pour la prochaine manche SANS les afficher
      const shuffledImages = shuffleArray([...images]);
      shuffledCards.forEach((card, i) => setCardFrontData(card, shuffledImages[i]));

      // 5) Fin du reset
      shinyIndex = -1;                // shiny tirée au clic joueur
      shuffledCards.forEach(c => c.disabled = false);
      replayBtn.disabled = false;
      gameReady = true;
    } finally {
      resetInProgress = false;
    }
  });
}

// -------- Clic carte : on charge l'image, on flip, on tire la shiny --------
cards.forEach(card => {
  card.addEventListener('click', () => {
    if (!gameReady || card.disabled) return;

    const currentCards = Array.from(document.querySelectorAll('#game .card'));
    const clickedIndex = currentCards.indexOf(card);

    // Juste avant d’afficher la face avant, on applique l’image préparée
    ensureFrontSrcBeforeFlip(card);

    // Tirage shiny au moment du clic (aucun indice avant)
    if (shinyIndex < 0) {
      shinyIndex = Math.floor(Math.random() * currentCards.length);
    }

    // Flip vers la face avant
    card.classList.add('flipped');

    // Marque résultat
    requestAnimationFrame(() => {
      card.classList.add('revealed', clickedIndex === shinyIndex ? 'win' : 'lose');
    });

    // Si perdue -> révéler la shiny ailleurs après un petit délai
    const half = getFlipDurationMs() / 2;
    if (clickedIndex !== shinyIndex) {
      const shinyCard = currentCards[shinyIndex];
      // S’assurer que la shiny a bien son image avant de la montrer
      ensureFrontSrcBeforeFlip(shinyCard);
      setTimeout(() => {
        shinyCard.classList.add('flipped', 'revealed', 'win');
      }, half);
    }

    // Fin de manche
    currentCards.forEach(c => (c.disabled = true));
    gameReady = false;
  });
});
