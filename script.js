
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

// Adapte aux chemins réels de tes images côté face
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
  // Lit la durée exacte de transition CSS sur .card-inner
  const inner = document.querySelector('#game .card .card-inner');
  if (!inner) return 420; // fallback
  const d = getComputedStyle(inner).transitionDuration.split(',')[0].trim(); // "0.42s" ou "420ms"
  if (d.endsWith('ms')) return parseFloat(d) || 420;
  if (d.endsWith('s'))  return (parseFloat(d) || 0.42) * 1000;
  return 420;
}

function waitFlipBackFor(inner, shouldWait, timeoutMs) {
  // Attend transitionend(transform) sur inner si la carte était flipped
  return new Promise(resolve => {
    if (!shouldWait) {
      // Double rAF pour garantir un re-peint même sans transition
      return requestAnimationFrame(() => requestAnimationFrame(resolve));
    }
    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;
      inner.removeEventListener('transitionend', onEnd);
      clearTimeout(fallback);
      // Double rAF pour être sûr que le navigateur ait fini de peindre
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    };
    const onEnd = (e) => {
      if (e.target !== inner) return;
      if (e.propertyName !== 'transform') return;
      cleanup();
    };
    inner.addEventListener('transitionend', onEnd, { once: true });
    // Fallback si transitionend ne se déclenche pas
    const fallback = setTimeout(cleanup, timeoutMs + 200);
  });
}

async function waitAllFlipBack(beforeStates) {
  const inners = Array.from(document.querySelectorAll('#game .card .card-inner'));
  const flipMs = getFlipDurationMs();
  const waits = inners.map((inner, i) => waitFlipBackFor(inner, !!beforeStates[i], flipMs));
  await Promise.all(waits);
  // Tampon supplémentaire pour éviter tout micro-flash
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
}

function resetVisualState() {
  cards.forEach(card => {
    // revenir côté dos et nettoyer les états
    card.classList.remove('revealed', 'win', 'lose', 'flipped');
    card.disabled = false;
  });
}

// -------- Init --------
function initGame() {
  shinyIndex = -1;
  gameReady = true;
  resetVisualState();
  // Optionnel : dos de carte (si tu en as un)
  cards.forEach(card => {
    const imgEl = card.querySelector('.card-img');
    if (imgEl) imgEl.removeAttribute('src'); // ou imgEl.src = 'dos.png';
  });
}

// -------- Rejouer : attendre 100% la fin du flip-back, puis réorganiser --------
if (replayBtn) {
  replayBtn.addEventListener('click', async () => {
    if (resetInProgress) return; // anti double-clic
    resetInProgress = true;

    try {
      // Bloquer interaction
      gameReady = false;
      replayBtn.disabled = true;
      cards.forEach(c => c.disabled = true);

      // 1) Marquer les cartes qui vont ANIMER (celles actuellement flipped)
      const beforeStates = Array.from(cards).map(c => c.classList.contains('flipped'));

      // 2) Masquer les faces avant pendant le flip-back (évite de voir les images)
      grid.classList.add('lock');

      // 3) Lancer flip-back (retirer .flipped sur toutes)
      resetVisualState();

      // 4) Attendre VRAIMENT la fin du flip-back sur toutes les cartes
      await waitAllFlipBack(beforeStates);

      // 5) Réorganiser APRÈS flip-back (mouvement invisible car grid.lock)
      const frag = document.createDocumentFragment();
      const shuffledCards = shuffleArray(Array.from(cards));
      shuffledCards.forEach(c => frag.appendChild(c));
      grid.appendChild(frag);

      // 6) (Ré)attribuer des images aléatoires côté face
      const shuffledImages = shuffleArray([...images]);
      shuffledCards.forEach((card, i) => setCardFrontImage(card, shuffledImages[i]));

      // 7) Réafficher les faces avant seulement une fois tout terminé
      grid.classList.remove('lock');

      // 8) Réactiver interaction
      shinyIndex = -1; // shiny choisie au clic joueur
      shuffledCards.forEach(c => c.disabled = false);
      replayBtn.disabled = false;
      gameReady = true;
    } finally {
      resetInProgress = false;
    }
  });
}

// -------- Clic carte : shiny choisie APRÈS le clic --------
cards.forEach(card => {
  card.addEventListener('click', () => {
    if (!gameReady || card.disabled) return;

    const currentCards = Array.from(document.querySelectorAll('#game .card'));
    const clickedIndex = currentCards.indexOf(card);

    // Choisir la shiny AU MOMENT du clic (zéro indice avant)
    if (shinyIndex < 0) {
      shinyIndex = Math.floor(Math.random() * currentCards.length);
    }

    // Retourner la carte cliquée (vers face)
    card.classList.add('flipped');

    // Marquer le résultat une fois le flip enclenché
    requestAnimationFrame(() => {
      card.classList.add('revealed', clickedIndex === shinyIndex ? 'win' : 'lose');
    });

    // Si perdue → révéler la shiny ailleurs après un petit délai (effet sympa)
    const half = getFlipDurationMs() / 2;
    if (clickedIndex !== shinyIndex) {
      const shinyCard = currentCards[shinyIndex];
      setTimeout(() => {
        shinyCard.classList.add('flipped', 'revealed', 'win');
      }, half);
    }

    // Fin de manche
    currentCards.forEach(c => (c.disabled = true));
    gameReady = false;
  });
});
