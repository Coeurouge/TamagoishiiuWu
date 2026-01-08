
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

    // ouverture du mini-jeu -> reset propre
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
// Mini-jeu : logique SANS indice
// =======================
const gamePanel = document.getElementById('game');
const grid = document.querySelector('#game .game-grid');
const cards = document.querySelectorAll('#game .card');
const replayBtn = document.querySelector('#game .game-actions .btn');

let shinyIndex = -1;   // pas choisie tant que l'utilisateur n'a pas cliqué
let gameReady = false; // interaction autorisée

// Reset du jeu : aucune shiny choisie ici, grille non rendue pendant le shuffle
function initGame() {
  // Retire la grille du rendu immédiatement (aucun flash possible)
  if (grid) grid.style.display = 'none';

  // Nettoie toute trace visuelle / interaction
  cards.forEach(card => {
    card.classList.remove('flipped', 'revealed', 'win', 'lose');
    card.disabled = false;
  });

  // Mélange les cartes en réordonnant le DOM pendant qu'il est caché
  const shuffled = Array.from(cards).sort(() => Math.random() - 0.5);
  shuffled.forEach(c => grid.appendChild(c));

  // IMPORTANT : aucune shiny choisie pendant le reset
  shinyIndex = -1;

  // Force un reflow puis ré-affiche la grille
  // (garantit que le navigateur a fini le travail avant affichage)
  void grid.offsetHeight;
  grid.style.display = '';

  gameReady = true;
}

// Clic sur une carte : choix de la shiny AU MOMENT du clic -> aucune info avant
cards.forEach(card => {
  card.addEventListener('click', () => {
    if (!gameReady || card.disabled) return;

    const currentCards = Array.from(document.querySelectorAll('#game .card'));
    const clickedIndex = currentCards.indexOf(card);

    // Si aucune shiny n'a encore été choisie, on la tire MAINTENANT
    if (shinyIndex < 0) {
      shinyIndex = Math.floor(Math.random() * currentCards.length);
    }

    // Animation de flip puis révélation (win/lose)
    card.classList.add('flipped');
    requestAnimationFrame(() => {
      card.classList.add('revealed', clickedIndex === shinyIndex ? 'win' : 'lose');
    });

    // Fin de manche : on bloque les autres cartes
    currentCards.forEach(c => (c.disabled = true));
    gameReady = false;
  });
});

// Bouton "Rejouer" : cache dès mousedown, reset ensuite
if (replayBtn) {
  // Cache dès que l'utilisateur enfonce le bouton (encore plus safe)
  replayBtn.addEventListener('mousedown', () => {
    if (grid) grid.style.display = 'none';
  });

  replayBtn.addEventListener('click', () => {
    initGame();
  });
}
