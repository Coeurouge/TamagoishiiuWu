
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
// Mini‑jeu : images figées entre les manches (pas de réassignation au rejouer)
// =======================
const grid      = document.querySelector('#game .game-grid');
const cards     = document.querySelectorAll('#game .card');
const replayBtn = document.querySelector('#game .game-actions .btn');

// 👉 Chemin des images (adapter si besoin)
const IMAGE_BASE = 'assets/images/';
// On utilise 1.jpg à 10.jpg ; pas d'image shiny dédiée pour éviter l'indice
const images = Array.from({ length: 10 }, (_, i) => `${IMAGE_BASE}${i + 1}.jpg`);

let shinyIndex = -1;
let gameReady = false;
let imagesAssigned = false; // ✅ Empêche de réassigner les images si on revient sur l'onglet Game

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
