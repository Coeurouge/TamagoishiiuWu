
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
// Mini-jeu : attendre flip-back avant shuffle
// =======================
const grid = document.querySelector('#game .game-grid');
const cards = document.querySelectorAll('#game .card');
const replayBtn = document.querySelector('#game .game-actions .btn');
const images = ['img1.jpg', 'img2.jpg', 'img3.jpg']; // adapte tes images
const FLIP_MS = 420; // durée CSS de transition transform
const BUFFER_MS = 100;

let shinyIndex = -1;
let gameReady = false;

function shuffleArray(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function setCardFrontImage(card, src) {
  const imgEl = card.querySelector('.card-img');
  if (imgEl) imgEl.src = src;
}

function resetVisualState() {
  cards.forEach(card => {
    card.classList.remove('revealed', 'win', 'lose', 'flipped');
    card.disabled = false;
  });
}

function initGame() {
  shinyIndex = -1;
  gameReady = true;
  resetVisualState();
  cards.forEach(card => {
    const imgEl = card.querySelector('.card-img');
    if (imgEl) imgEl.removeAttribute('src'); // ou mettre image du dos
  });
}

// === Rejouer : attendre flip-back avant réorg ===
if (replayBtn) {
  replayBtn.addEventListener('click', async () => {
    gameReady = false;
    replayBtn.disabled = true;
    cards.forEach(c => c.disabled = true);

    // 1) Retirer .flipped pour lancer le flip-back
    resetVisualState();

    // 2) Attendre la fin de l'animation (flip-back)
    await new Promise(r => setTimeout(r, FLIP_MS + BUFFER_MS));

    // 3) Cache la grille pendant la réorganisation
    grid.style.visibility = 'hidden';

    // 4) Mélange le DOM
    const shuffledCards = shuffleArray(Array.from(cards));
    shuffledCards.forEach(c => grid.appendChild(c));

    // 5) Attribue les images aléatoires
    const shuffledImages = shuffleArray([...images]);
    shuffledCards.forEach((card, i) => setCardFrontImage(card, shuffledImages[i]));

    // 6) Réaffiche la grille
    grid.style.visibility = 'visible';

    // Réactive le jeu
    shinyIndex = -1;
    shuffledCards.forEach(c => c.disabled = false);
    replayBtn.disabled = false;
    gameReady = true;
  });
}

// === Clic carte : shiny choisie après clic ===
cards.forEach(card => {
  card.addEventListener('click', () => {
    if (!gameReady || card.disabled) return;

    const currentCards = Array.from(document.querySelectorAll('#game .card'));
    const clickedIndex = currentCards.indexOf(card);

    if (shinyIndex < 0) {
      shinyIndex = Math.floor(Math.random() * currentCards.length);
    }

    card.classList.add('flipped');
    requestAnimationFrame(() => {
      card.classList.add('revealed', clickedIndex === shinyIndex ? 'win' : 'lose');
    });

    if (clickedIndex !== shinyIndex) {
      const shinyCard = currentCards[shinyIndex];
      setTimeout(() => {
        shinyCard.classList.add('flipped', 'revealed', 'win');
      }, FLIP_MS / 2);
    }

    currentCards.forEach(c => (c.disabled = true));
    gameReady = false;
  });
});
``
