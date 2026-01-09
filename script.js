
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

    if (id === 'game') initGame(); // ouvre le mini-jeu -> reset
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
// Mini-jeu : flip-back PUIS changement d'images
// =======================
const gamePanel = document.getElementById('game');
const grid = document.querySelector('#game .game-grid');
const cards = document.querySelectorAll('#game .card');
const replayBtn = document.querySelector('#game .game-actions .btn');

// Durée d'anim CSS (doit matcher style.css -> transition: transform 420ms)
const FLIP_MS = 420;
const BUFFER_MS = 40;

let shinyIndex = 0;   // index de la carte shiny (garde assets/images/shiny.jpg)
let gameReady = false;

// Chemins des images
const IMAGES_DIR = 'assets/images/';
const SHINY_SRC  = `${IMAGES_DIR}shiny.jpg`;
const NORMAL_POOL = Array.from({ length: 10 }, (_, i) => `${IMAGES_DIR}${i + 1}.jpg`);
// -> ["assets/images/1.jpg", ..., "assets/images/10.jpg"]

// -------- Utilitaires --------
function waitTransformEnd(inner) {
  // Attend la fin de la transition 'transform' d'un .card-inner
  return new Promise(resolve => {
    const handler = (e) => {
      if (e.propertyName === 'transform') {
        inner.removeEventListener('transitionend', handler);
        resolve();
      }
    };
    const computed = getComputedStyle(inner);
    const dur = parseFloat(computed.transitionDuration) || 0;
    if (dur === 0) {
      // déjà côté dos ou pas de transition -> prochaine frame
      requestAnimationFrame(resolve);
    } else {
      inner.addEventListener('transitionend', handler, { once: true });
    }
  });
}

function setCardFrontImage(card, src) {
  const imgEl = card.querySelector('.card-img');
  if (!imgEl) return;
  imgEl.src = src; // on ne fait que poser le src
}

function pickRandomNormal() {
  const idx = Math.floor(Math.random() * NORMAL_POOL.length);
  return NORMAL_POOL[idx];
}

// -------- Logique du jeu --------
function initGame() {
  if (!grid || cards.length === 0) return;

  // 1) Snapshot : seulement les cartes vraiment retournées (avaient .flipped)
  const previouslyFlipped = Array.from(cards).filter(c => c.classList.contains('flipped'));

  // 2) Demander le flip-back (sans toucher aux images ici)
  Array.from(cards).forEach(card => {
    card.classList.remove('flipped', 'revealed', 'win', 'lose');
    card.disabled = false;
  });

  // 3) Attendre la fin du flip-back des cartes concernées
  const waiters = previouslyFlipped.map(card => {
    const inner = card.querySelector('.card-inner');
    return inner ? waitTransformEnd(inner) : Promise.resolve();
  });

  // Fallback : si aucune n'était retournée (ex. première ouverture), attendre 1 frame
  const noFlippedFallback = new Promise(resolve => {
    if (waiters.length > 0) return resolve();
    requestAnimationFrame(resolve);
  });

  // Sécurité : timeout si transitionend ne remonte pas
  const timeoutFallback = new Promise(resolve => setTimeout(resolve, FLIP_MS + BUFFER_MS));

  Promise.all([Promise.all(waiters), noFlippedFallback, timeoutFallback]).then(() => {
    // 4) Maintenant seulement : (ré)assigner les images
    //    La shiny garde la même image SHINY_SRC.
    //    Si tu veux que la POSITION de la shiny change à chaque manche, décommente :
    // shinyIndex = Math.floor(Math.random() * cards.length);

    Array.from(cards).forEach((card, i) => {
      const isShiny = i === shinyIndex;
      const src = isShiny ? SHINY_SRC : pickRandomNormal();
      setCardFrontImage(card, src);
    });

    // Reset d'état pour la nouvelle manche
    gameReady = true;
    const statusEl = document.querySelector('#game .game-status');
    if (statusEl) statusEl.textContent = '';
  });
}

function revealCard(clickedIndex) {
  if (!gameReady) return;
  gameReady = false;

  Array.from(cards).forEach((card, i) => {
    const isWin = i === shinyIndex;
    card.classList.add('flipped', 'revealed', isWin ? 'win' : 'lose');
    card.disabled = true;
  });
}

// -------- Listeners --------
Array.from(cards).forEach((card, i) => {
  card.addEventListener('click', () => revealCard(i));
});

if (replayBtn) {
  replayBtn.addEventListener('click', (e) => {
    // Robustesse : au cas où le bouton soit un <a> ou capté par le délégateur global
    e.stopPropagation();
    if (replayBtn.tagName === 'A') e.preventDefault();
    initGame(); // ⬅️ flip-back d’abord, puis changement des images
  });
}

// Démarrage si l’onglet Mini-jeu est visible au chargement
if (gamePanel && gamePanel.classList.contains('visible')) {
  initGame();
}


