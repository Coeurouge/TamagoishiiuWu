
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
// Mini-jeu : mélange APRÈS flip-back
// =======================
const gamePanel = document.getElementById('game');
const grid = document.querySelector('#game .game-grid');
const cards = document.querySelectorAll('#game .card');
const replayBtn = document.querySelector('#game .game-actions .btn');

// Durée d'anim CSS (doit matcher style.css -> transition: transform 420ms)
const FLIP_MS = 420;
const BUFFER_MS = 40;

let shinyIndex = -1;
let gameReady = false;

// --- Chemins d'images (📝 adapte si besoin : 'img/shiny.jpg' vs 'shiny.jpg')
const NORMAL_SRC = 'normal.jpg';
const SHINY_SRC  = 'shiny.jpg';

// Utilitaires
const shuffleArray = arr => arr.sort(() => Math.random() - 0.5);

function waitTransformEnd(inner) {
  return new Promise(resolve => {
    const handler = (e) => {
      if (e.propertyName === 'transform') {
        inner.removeEventListener('transitionend', handler);
        resolve();
      }
    };
    // Si aucune transition ne se produit (déjà côté dos), on résout après un micro délai
    const computed = getComputedStyle(inner);
    const dur = parseFloat(computed.transitionDuration) || 0;
    if (dur === 0) {
      setTimeout(resolve, 0);
    } else {
      inner.addEventListener('transitionend', handler, { once: true });
    }
  });
}

// Met une image côté front, dos neutre (optionnel)
function setCardFrontImage(card, src) {
  const imgEl = card.querySelector('.card-img');
  if (!imgEl) return;
  // cache-buster pour éviter toute frame due au cache
  const cb = Math.floor(Math.random() * 1e9);
  imgEl.src = `${src}?cb=${cb}`;
  imgEl.alt = src.includes('shiny') ? 'Carte shiny' : 'Carte normale';
}

/** Affecte les images selon shinyIndex (appeler UNIQUEMENT après flip-back) */
function assignNewImages() {
  if (shinyIndex < 0) {
    shinyIndex = Math.floor(Math.random() * cards.length);
  }
  Array.from(cards).forEach((card, i) => {
    setCardFrontImage(card, i === shinyIndex ? SHINY_SRC : NORMAL_SRC);
  });

  // Reset état pour nouvelle manche
  Array.from(cards).forEach(card => {
    card.classList.remove('revealed', 'win', 'lose');
    card.disabled = false;
  });

  gameReady = true;
}

/** Init manche : flip-back d'abord, swap d'images ensuite (après transition) */
function initGame() {
  if (!grid || cards.length === 0) return;

  // 0) snapshot : on ne surveille que celles qui étaient vraiment retournées
  const previouslyFlipped = new Set(Array.from(cards).filter(c => c.classList.contains('flipped')));

  // 1) Prépare le retour côté dos (sans swap d'images ici)
  Array.from(cards).forEach(card => {
    // Masque temporaire pour empêcher toute frame visible pendant le retour
    const img = card.querySelector('.card-img');
    if (img) img.style.visibility = 'hidden';

    // Demande le flip-back + reset visuel
    card.classList.remove('flipped', 'revealed', 'win', 'lose');
    card.disabled = false;
  });

  // 2) Attendre la fin du flip-back des cartes concernées
  const waiters = Array.from(previouslyFlipped).map(card => {
    const inner = card.querySelector('.card-inner');
    return inner ? waitTransformEnd(inner) : Promise.resolve();
  });

  // Sécurité si aucune n'était flipped : on attend 2 frames pour forcer un repaint
  const noFlippedFallback = new Promise(resolve => {
    if (waiters.length > 0) return resolve(); // ignoré si on a des waiters
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });

  // Timeout de secours si 'transitionend' ne remonte pas
  const timeoutFallback = new Promise(resolve => setTimeout(resolve, FLIP_MS + BUFFER_MS));

  Promise.all([Promise.all(waiters), noFlippedFallback, timeoutFallback]).then(() => {
    // 3) Une frame après que tout soit revenu côté dos → swap d'images
    requestAnimationFrame(() => {
      shinyIndex = Math.floor(Math.random() * cards.length);
      assignNewImages();

      // 4) Réafficher les images (devenues invisibles pendant le flip-back)
      Array.from(cards).forEach(card => {
        const img = card.querySelector('.card-img');
        if (img) img.style.visibility = 'visible';
      });
    });
  });
}

/** Révélation : au clic, on flippe toutes et on marque win/lose */
function revealCard(clickedIndex) {
  if (!gameReady) return;
  gameReady = false;

  Array.from(cards).forEach((card, i) => {
    const isWin = i === shinyIndex;
    card.classList.add('flipped', 'revealed', isWin ? 'win' : 'lose');
    card.disabled = true;
  });
}

// --- Listeners carte & rejouer
Array.from(cards).forEach((card, i) => {
  card.addEventListener('click', () => revealCard(i));
});

if (replayBtn) {
  replayBtn.addEventListener('click', (e) => {
    // Empêche le délégateur [data-target] global d'agir si jamais ce bouton en a un
    e.stopPropagation();
    if (replayBtn.tagName === 'A') e.preventDefault();
    initGame();
  });
}

// --- Démarrage : si l'onglet Mini-jeu est/ devient visible, on init
if (gamePanel) {
  // Si déjà visible (ex: open by hash)
  if (gamePanel.classList.contains('visible')) initGame();

  // Si devient visible (via tes tabs)
  const obs = new MutationObserver(() => {
    if (gamePanel.classList.contains('visible')) initGame();
  });
  obs.observe(gamePanel, { attributes: true, attributeFilter: ['class'] });
}
