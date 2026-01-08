
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
// Mini‑jeu : flip‑back avec images actuelles, puis changement d’images APRÈS transitionend
// =======================
const grid      = document.querySelector('#game .game-grid');
const cards     = document.querySelectorAll('#game .card');
const replayBtn = document.querySelector('#game .game-actions .btn');


// Dossier où se trouvent tes images
const IMAGE_BASE = 'assets/images/';

// Images de base (1 à 10)
const images = Array.from({ length: 10 }, (_, i) => `${IMAGE_BASE}${i + 1}.jpg`);

// Image spéciale (si tu veux l'utiliser à part)
const SHINY_IMAGE = `${IMAGE_BASE}shiny.jpg`;


let shinyIndex = -1;
let gameReady = false;

// --- Utils ---
const shuffleArray = arr => arr.sort(() => Math.random() - 0.5);

function preloadImages(urls) {
  return Promise.all(urls.map(url => new Promise(res => {
    const img = new Image();
    img.onload = img.onerror = () => res();
    img.src = url;
  })));
}

// Attendre VRAIMENT la fin du flip‑back (transitionend: transform) sur chaque carte
function waitFlipBackAll(beforeStates) {
  const inners = Array.from(document.querySelectorAll('#game .card .card-inner'));
  const waits = inners.map((inner, i) => {
    return new Promise(resolve => {
      // Si la carte n’était pas flipped, rien à attendre → on résout après 2 rAF
      if (!beforeStates[i]) {
        return requestAnimationFrame(() => requestAnimationFrame(resolve));
      }
      const onEnd = (e) => {
        if (e.target === inner && e.propertyName === 'transform') {
          inner.removeEventListener('transitionend', onEnd);
          // Double rAF pour garantir que le repaint est terminé
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        }
      };
      inner.addEventListener('transitionend', onEnd, { once: true });
      // Fallback sécurité si transitionend ne se déclenche pas
      setTimeout(() => {
        inner.removeEventListener('transitionend', onEnd);
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }, 1000);
    });
  });
  return Promise.all(waits);
}

// Enlever les états visuels (mais NE PAS toucher aux images ici)
function resetVisualState() {
  cards.forEach(card => {
    card.classList.remove('revealed', 'win', 'lose');
    card.disabled = false;
  });
}

// --- Init ---
function initGame() {
  shinyIndex = -1;
  gameReady = true;
  resetVisualState();
  // On laisse les images telles quelles ; le changement se fera au bon moment.
}

// --- Rejouer : flip‑back avec images actuelles → attendre transitionend → shuffle & nouvelles images ---
replayBtn.addEventListener('click', async () => {
  if (!grid) return;

  gameReady = false;
  replayBtn.disabled = true;
  cards.forEach(c => c.disabled = true);

  // 1) Repérer quelles cartes vont ANIMER (celles actuellement flipped)
  const beforeStates = Array.from(cards).map(c => c.classList.contains('flipped'));

  // 2) Lancer le flip‑back : retirer .flipped (les cartes se retournent AVEC LES IMAGES ACTUELLES)
  cards.forEach(card => card.classList.remove('flipped'));

  // 3) Attendre la fin RÉELLE du flip‑back sur toutes les cartes
  await waitFlipBackAll(beforeStates);

  // 4) Préparer les nouvelles images (précharge pour éviter tout flash)
  const shuffledImages = shuffleArray([...images]);
  await preloadImages(shuffledImages);

  // 5) Réorganiser le DOM (shuffle) APRÈS le flip‑back
  const frag = document.createDocumentFragment();
  const shuffledCards = shuffleArray(Array.from(cards));
  shuffledCards.forEach(c => frag.appendChild(c));
  grid.appendChild(frag);

  // 6) Appliquer les nouvelles images MAINTENANT (les cartes sont côté dos → changement invisible)
  shuffledCards.forEach((card, i) => {
    const imgEl = card.querySelector('.card-img');
    if (imgEl) imgEl.src = shuffledImages[i];
  });

  // 7) Réactiver la manche
  shinyIndex = -1; // shiny sera tirée au clic du joueur
  shuffledCards.forEach(c => c.disabled = false);
  replayBtn.disabled = false;
  gameReady = true;
});

// --- Clic carte : shiny tirée au clic, pas d’indice avant ---
cards.forEach(card => {
  card.addEventListener('click', () => {
    if (!gameReady || card.disabled) return;

    const currentCards = Array.from(document.querySelectorAll('#game .card'));
    const clickedIndex = currentCards.indexOf(card);

    // Tirage de la shiny au moment du clic
    if (shinyIndex < 0) {
      shinyIndex = Math.floor(Math.random() * currentCards.length);
    }

    // Flip vers la face
    card.classList.add('flipped');

    // Marquer résultat
    requestAnimationFrame(() => {
      card.classList.add('revealed', clickedIndex === shinyIndex ? 'win' : 'lose');
    });

    // Si perdue : révéler la shiny ailleurs après un petit délai
    const inner = card.querySelector('.card-inner');
    const flipDurationMs = (() => {
      if (!inner) return 420;
      const d = getComputedStyle(inner).transitionDuration.split(',')[0].trim();
      if (d.endsWith('ms')) return parseFloat(d) || 420;
      if (d.endsWith('s')) return (parseFloat(d) || 0.42) * 1000;
      return 420;
    })();

    if (clickedIndex !== shinyIndex) {
      const shinyCard = currentCards[shinyIndex];
      setTimeout(() => {
        shinyCard.classList.add('flipped', 'revealed', 'win');
      }, flipDurationMs / 2);
    }

    // Fin de manche
    currentCards.forEach(c => (c.disabled = true));
    gameReady = false;
  });
});
