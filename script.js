
/* =========================
 *  Gestion des onglets (SPA)
 * ========================= */
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

  // ====== Initialiser le mini-jeu une fois le DOM prêt ======
  initShinyGame();
});

/* =========================
 *  Mini-jeu : Carte Shiny
 * ========================= */
function initShinyGame() {
  const grid = document.getElementById('gameGrid');
  const status = document.getElementById('gameStatus');
  const restartBtn = document.getElementById('restartBtn');
  const revealBtn = document.getElementById('revealBtn');

  // Sélectionne les cartes *dynamiquement* (au cas où le DOM change)
  let cards = grid ? Array.from(grid.querySelectorAll('.card')) : [];

  // État global du jeu
  let gameOver = false;
  let clicksEnabled = true;

  const randInt = (max) => Math.floor(Math.random() * max);

  function clearShinyMarks() {
    cards.forEach(c => { delete c.dataset.shiny; });
  }

  function markOneShiny() {
    if (cards.length === 0) return;
    const shinyCard = cards[randInt(cards.length)];
    shinyCard.dataset.shiny = '1';
  }

  function resetBoard() {
    // (re)lier les cartes si la grille a été modifiée
    cards = grid ? Array.from(grid.querySelectorAll('.card')) : [];

    // Nettoyer visuel & interactions
    cards.forEach(card => {
      card.classList.remove('flipped', 'revealed', 'win', 'lose');
      card.disabled = false;
    });

    // Poser une shiny unique
    clearShinyMarks();
    markOneShiny();

    // Reset état global & message
    gameOver = false;
    clicksEnabled = true;
    if (status) status.textContent = 'Clique sur une carte pour tenter ta chance ✨';

    // Retirer l'effet de victoire global
    document.body.classList.remove('win-effect');

    // Rewire des événements (au cas où le DOM a été reconstruit)
    wireCardEvents();
  }

  function handleWin(clickedCard) {
    clickedCard.classList.add('win');
    if (status) status.textContent = '🎉 Bravo, carte shiny ! Tu as gagné.';
    gameOver = true;

    // Bloquer les autres cartes
    cards.forEach(c => c.disabled = true);

    // Animation CSS globale (optionnelle)
    document.body.classList.add('win-effect');

    // TODO: déclencher ici un fetch/event pour enregistrer la victoire côté serveur
  }

  function handleLose(clickedCard) {
    clickedCard.classList.add('lose');
    if (status) status.textContent = 'Raté… Essaie encore !';
    // Si ta règle == 1 essai par partie, décommente :
    // gameOver = true;
    // cards.forEach(c => c.disabled = true);
  }

  function onCardClick(e) {
    const card = e.currentTarget;
    if (!clicksEnabled || gameOver) return;                // jeu bloqué ?
    if (card.classList.contains('flipped')) return;        // déjà retournée ?

    // Retourner la carte (flip visuel)
    card.classList.add('flipped', 'revealed');

    // Déterminer victoire/échec via data-shiny (insensible à l'ordre DOM)
    if (card.dataset.shiny === '1') {
      handleWin(card);
    } else {
      handleLose(card);
    }
  }

  function wireCardEvents() {
    cards.forEach(card => {
      // enlever potentiels anciens listeners en recréant proprement
      card.replaceWith(card.cloneNode(true));
    });
    // Re-sélectionner les clones (remplacent les originaux)
    cards = grid ? Array.from(grid.querySelectorAll('.card')) : [];
    cards.forEach(card => card.addEventListener('click', onCardClick));
  }

  // Bouton "Rejouer"
  if (restartBtn) {
    restartBtn.addEventListener('click', resetBoard);
  }

  // Bouton "Révéler" (debug)
  if (revealBtn) {
    revealBtn.addEventListener('click', () => {
      cards.forEach(card => {
        if (!card.classList.contains('flipped')) {
          card.classList.add('flipped', 'revealed');
        }
        if (card.dataset.shiny === '1') {
          card.classList.add('win');
        } else {
          card.classList.add('lose');
        }
      });
      if (status) status.textContent = 'Révélé (debug).';
      gameOver = true;
      cards.forEach(c => c.disabled = true);
    });
  }

  // Lancement initial
  resetBoard();
}
``
