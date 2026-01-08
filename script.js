
// =======================
// Gestion des onglets (SPA)
// =======================
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

// Navigation par clic sur les onglets
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    // état visuel actif
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // sections
    const id = tab.dataset.target;
    panels.forEach(p => p.classList.toggle('visible', p.id === id));

    // mise à jour du hash (pour partager un lien vers un onglet)
    history.replaceState(null, '', `#${id}`);

    // accessibilité : focus sur la section
    const panel = document.getElementById(id);
    panel && panel.focus();

    // Si on ouvre le mini-jeu, on réinitialise
    if (id === 'game') initGame();
  });
});

// Liens/boutons avec data-target (CTA internes)
document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-target]');
  if (!link) return;
  const dest = link.getAttribute('data-target');
  const btn = Array.from(tabs).find(t => t.dataset.target === dest);
  if (btn) btn.click();
});

// Ouvrir la section depuis l’URL (ex: …/index.html#contact)
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

// Initialisation du jeu
function initGame() {
  // Nettoie les classes
  cards.forEach(card => {
    card.classList.remove('flipped', 'revealed', 'win', 'lose');
    card.disabled = false;
  });

  // Choix interne de la shiny
  shinyIndex = Math.floor(Math.random() * cards.length);

  // Shuffle DOM pour éviter prédiction
  const grid = document.querySelector('#game .game-grid');
  const shuffled = Array.from(cards).sort(() => Math.random() - 0.5);
  shuffled.forEach(c => grid.appendChild(c));

  gameReady = true;
}

// Clic sur une carte
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

// Bouton "Rejouer"
if (replayBtn) {
  replayBtn.addEventListener('click', () => {
    initGame();
  });
}
``
