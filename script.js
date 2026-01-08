
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
// Mini-jeu : logique
// =======================
const gamePanel = document.getElementById('game');
const cards = document.querySelectorAll('#game .card');
const replayBtn = document.querySelector('#game .game-actions .btn');
let shinyIndex = -1;
let gameReady = false;

function initGame() {
  const grid = document.querySelector('#game .game-grid');

  // Cache complètement la grille pendant le reset
  grid.style.opacity = '0';
  grid.style.pointerEvents = 'none';

  // Nettoie les classes
  cards.forEach(card => {
    card.classList.remove('flipped', 'revealed', 'win', 'lose');
    card.disabled = false;
  });

  // Choix interne de la shiny
  shinyIndex = Math.floor(Math.random() * cards.length);

  // Shuffle DOM
  const shuffled = Array.from(cards).sort(() => Math.random() - 0.5);
  shuffled.forEach(c => grid.appendChild(c));

  // Réaffiche après un court délai (le temps que le DOM soit prêt)
  setTimeout(() => {
    grid.style.opacity = '1';
    grid.style.pointerEvents = 'auto';
    gameReady = true;
  }, 150); // délai suffisant pour éviter tout flash
}

cards.forEach(card => {
  card.addEventListener('click', () => {
    if (!gameReady || card.disabled) return;

    const currentCards = Array.from(document.querySelectorAll('#game .card'));
    const index = currentCards.indexOf(card);

    card.classList.add('flipped');
    requestAnimationFrame(() => {
      card.classList.add('revealed', index === shinyIndex ? 'win' : 'lose');
    });

    currentCards.forEach(c => (c.disabled = true));
    gameReady = false;
  });
});

if (replayBtn) {
  replayBtn.addEventListener('click', () => {
    initGame();
  });
}
