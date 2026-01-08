
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
// Mini-jeu : flip-back avec images actuelles, puis changer images
// =======================
const grid      = document.querySelector('#game .game-grid');
const cards     = document.querySelectorAll('#game .card');
const replayBtn = document.querySelector('#game .game-actions .btn');
const images    = ['img1.jpg', 'img2.jpg', 'img3.jpg']; // adapte tes images

let shinyIndex = -1;
let gameReady = false;

// Mélange tableau
const shuffleArray = arr => arr.sort(() => Math.random() - 0.5);

// Durée flip CSS
function getFlipDurationMs() {
  const inner = document.querySelector('#game .card .card-inner');
  if (!inner) return 420;
  const d = getComputedStyle(inner).transitionDuration.split(',')[0].trim();
  if (d.endsWith('ms')) return parseFloat(d) || 420;
  if (d.endsWith('s')) return (parseFloat(d) || 0.42) * 1000;
  return 420;
}

// Reset visuel
function resetVisualState() {
  cards.forEach(card => {
    card.classList.remove('revealed', 'win', 'lose');
    card.disabled = false;
  });
}

// Init
function initGame() {
  shinyIndex = -1;
  gameReady = true;
  resetVisualState();
}

// Rejouer
replayBtn.addEventListener('click', async () => {
  gameReady = false;
  replayBtn.disabled = true;
  cards.forEach(c => c.disabled = true);

  // 1) Retirer flipped pour lancer flip-back (avec images actuelles)
  cards.forEach(card => card.classList.remove('flipped'));

  // 2) Attendre la fin du flip-back
  await new Promise(r => setTimeout(r, getFlipDurationMs() + 100));

  // 3) Shuffle DOM
  const shuffledCards = shuffleArray(Array.from(cards));
  shuffledCards.forEach(c => grid.appendChild(c));

  // 4) Changer les images pour la prochaine manche (après flip-back terminé)
  const shuffledImages = shuffleArray([...images]);
  shuffledCards.forEach((card, i) => {
    const imgEl = card.querySelector('.card-img');
    if (imgEl) imgEl.src = shuffledImages[i];
  });

  // 5) Réactiver
  shinyIndex = -1;
  shuffledCards.forEach(c => c.disabled = false);
  replayBtn.disabled = false;
  gameReady = true;
});

// Clic carte
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
      }, getFlipDurationMs() / 2);
    }

    currentCards.forEach(c => (c.disabled = true));
    gameReady = false;
  });
});

initGame();
