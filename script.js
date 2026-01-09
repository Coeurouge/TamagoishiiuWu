
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

    if (id === 'game') initGame(); // ouvre le mini-jeu -> reset
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
// Mini-jeu : mélange APRÈS flip-back
// =======================
const gamePanel = document.getElementById('game');
const grid = document.querySelector('#game .game-grid');
const cards = document.querySelectorAll('#game .card');
const replayBtn = document.querySelector('#game .game-actions .btn');

// Images possibles (adapte les chemins)
const images = ['img1.jpg', 'img2.jpg', 'img3.jpg'];

// Durée d'anim CSS (doit matcher style.css -> transition: transform 420ms)
const FLIP_MS = 420;
const BUFFER_MS = 40;

let shinyIndex = -1;
let gameReady = false;

// Utilitaires
const shuffleArray = arr => arr.sort(() => Math.random() - 0.5);

function waitTransformEnd(inner) {
  return new Promise(resolve => {
    const handler = (e) => {
      if (e.propertyName === 'transform') {
        inner.removeEventListener('transitionend', handler);
        resolve();
      }
    };
    // Si aucune transition ne se produit (déjà côté dos), on résout après un micro délai
    const computed = getComputedStyle(inner);
    const dur = parseFloat(computed.transitionDuration) || 0;
    if (dur === 0) {
      setTimeout(resolve, 0);
    } else {
      inner.addEventListener('transitionend', handler, { once: true });
    }
  });
}

// Met une image côté front, dos neutre (optionnel)
function setCardFrontImage(card, src) {
  const imgEl = card.querySelector('.card-img');
