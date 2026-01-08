
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
// Mini-jeu : shiny choisie APRÈS le clic
// =======================
const grid = document.querySelector('#game .game-grid');
const cards = document.querySelectorAll('#game .card');
const replayBtn = document.querySelector('#game .game-actions .btn');

let shinyIndex = -1;
let gameReady = false;

function initGame() {
  cards.forEach(card => {
    card.classList.remove('flipped', 'revealed', 'win', 'lose');
    card.disabled = false;
  });

  shinyIndex = -1; // aucune shiny avant le clic
  gameReady = true;
}

cards.forEach(card => {
  card.addEventListener('click', () => {
    if (!gameReady || card.disabled) return;

    const currentCards = Array.from(document.querySelectorAll('#game .card'));
    const clickedIndex = currentCards.indexOf(card);

    // Choisir la shiny maintenant
    if (shinyIndex < 0) {
      shinyIndex = Math.floor(Math.random() * currentCards.length);
    }

    // Retourne la carte cliquée
    card.classList.add('flipped');
    requestAnimationFrame(() => {
      card.classList.add('revealed', clickedIndex === shinyIndex ? 'win' : 'lose');
    });

    // Si perdue → révéler la shiny ailleurs
    if (clickedIndex !== shinyIndex) {
      const shinyCard = currentCards[shinyIndex];
      setTimeout(() => {
        shinyCard.classList.add('flipped', 'revealed', 'win');
      }, 600); // délai pour laisser l'animation de la carte cliquée
    }

    currentCards.forEach(c => (c.disabled = true));
    gameReady = false;
  });
});

if (replayBtn) {
  replayBtn.addEventListener('click', () => {
    initGame();
  });
}
