
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

  // Initialiser le mini-jeu après chargement
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

  if (!grid || !status || !restartBtn) return; // Si pas de mini-jeu, on sort

  let cards = Array.from(grid.querySelectorAll('.card'));
  let gameOver = false;
  let clicksEnabled = true;

  const randInt = (max) => Math.floor(Math.random() * max);

  function clearShinyMarks() {
    cards.forEach(c => { delete c.dataset.shiny; });
  }

  function markOneShiny() {
    const shinyCard = cards[randInt(cards.length)];
    shinyCard.dataset.shiny = '1';
  }

  function wireCardEvents() {
    cards.forEach(card => {
      const clone = card.cloneNode(true);
      card.replaceWith(clone);
    });
    cards = Array.from(grid.querySelectorAll('.card'));
    cards.forEach(card => card.addEventListener('click', onCardClick));
  }

  function resetBoard() {
    cards = Array.from(grid.querySelectorAll('.card'));
    cards.forEach(card => {
      card.classList.remove('flipped', 'revealed', 'win', 'lose');
      card.disabled = false;
    });

    clearShinyMarks();
    markOneShiny();

    gameOver = false;
    clicksEnabled = true;
    status.textContent = 'Clique sur une carte pour tenter ta chance ✨';
    document.body.classList.remove('win-effect');

    wireCardEvents();
  }

  function handleWin(card) {
    card.classList.add('win');
    status.textContent = '🎉 Bravo, carte shiny ! Tu as gagné.';
    gameOver = true;
    cards.forEach(c => c.disabled = true);
    document.body.classList.add('win-effect');
  }

  function handleLose(card) {
    card.classList.add('lose');
    status.textContent = 'Raté… Essaie encore !';
    // Pour un seul essai : décommente
    // gameOver = true;
    // cards.forEach(c => c.disabled = true);
  }

  function onCardClick(e) {
    const card = e.currentTarget;
    if (!clicksEnabled || gameOver) return;
    if (card.classList.contains('flipped')) return;

    card.classList.add('flipped', 'revealed');

    if (card.dataset.shiny === '1') {
      handleWin(card);
    } else {
      handleLose(card);
    }
  }

  restartBtn.addEventListener('click', resetBoard);

  if (revealBtn) {
    revealBtn.addEventListener('click', () => {
      cards.forEach(card => {
        card.classList.add('flipped', 'revealed');
        if (card.dataset.shiny === '1') {
          card.classList.add('win');
        } else {
          card.classList.add('lose');
        }
      });
      status.textContent = 'Révélé (debug).';
      gameOver = true;
      cards.forEach(c => c.disabled = true);
    });
  }

  resetBoard();
}
