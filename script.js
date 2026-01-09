
// =========================
// Gestion des onglets (SPA)
// =========================
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
});


// =========================
// Mini‑jeu : logique ajoutée
// =========================
(function () {
  // Sélecteurs de la section mini‑jeu (aucune modif HTML requise)
  const panel = document.getElementById('game');           // <section id="game" class="panel">…
  const grid  = document.querySelector('.game-grid');       // conteneur des 3 cartes
  const cards = grid ? Array.from(grid.querySelectorAll('.card')) : [];
  const statusEl = document.querySelector('.game-status');  // zone de statut (optionnelle)
  const replayBtn = document.querySelector('[data-action="replay"]'); // bouton Rejouer

  if (!panel || !grid || cards.length === 0 || !replayBtn) {
    // Si ta page charge les scripts partout, on sort proprement quand les éléments ne sont pas là.
    return;
  }

  const NORMAL_IMG = 'img/normal.jpg';
  const SHINY_IMG  = 'img/shiny.jpg';

  let winningIndex = -1;

  // Évite un "indice" visuel dû au cache navigateur
  function cacheBust(url) {
    const rnd = Math.floor(Math.random() * 1e9);
    return `${url}?cb=${rnd}`;
  }

  // Assigne les images APRÈS le flip‑back complet
  function assignImagesAfterFlipBack() {
    winningIndex = Math.floor(Math.random() * cards.length);

    cards.forEach((card, i) => {
      const img = card.querySelector('.card-img');
      if (!img) return;

      const isWin = i === winningIndex;
      img.src = cacheBust(isWin ? SHINY_IMG : NORMAL_IMG);
      img.alt = isWin ? 'Carte shiny' : 'Carte normale';
    });

    // réinitialise l'état d'une nouvelle manche
    cards.forEach(card => {
      card.classList.remove('revealed', 'win', 'lose');
      card.disabled = false;
    });
    if (statusEl) statusEl.textContent = '';
  }

  // Attendre la fin de la rotation (transform) pour TOUTES les cartes
  function waitForAllFlipBack() {
    const waits = cards.map(card => {
      const inner = card.querySelector('.card-inner');
      if (!inner) return Promise.resolve();

      return new Promise(resolve => {
        // Si déjà côté dos (pas de transform), on résout tout de suite
        const computed = getComputedStyle(inner);
        if (computed.transform === 'none' || !card.classList.contains('flipped')) {
          resolve();
          return;
        }

        const handler = (e) => {
          if (e.propertyName !== 'transform') return; // on ne vise que la rotation
          inner.removeEventListener('transitionend', handler);
          resolve();
        };
        inner.addEventListener('transitionend', handler, { once: true });
      });
    });

    return Promise.all(waits);
  }

  // Révélation d'une carte (au clic utilisateur)
  function revealCard(index) {
    // Une seule révélation visuelle : on retourne toutes les cartes et marque win/lose
    cards.forEach((card, i) => {
      const isWin = i === winningIndex;
      card.classList.add('flipped', 'revealed', isWin ? 'win' : 'lose');
      card.disabled = true;
    });
    if (statusEl) statusEl.textContent = (index === winningIndex) ? 'Gagné ! ✨' : 'Raté…';
  }

  // Initialiser une manche SANS swap pendant la rotation : d'abord flip‑back, ensuite images
  function initGame() {
    // 1) demander le retour côté dos (sans changer les images)
    cards.forEach(card => {
      // masque temporaire pour éviter toute frame visible pendant le retour
      const img = card.querySelector('.card-img');
      if (img) img.style.visibility = 'hidden';

      card.classList.remove('flipped', 'revealed', 'win', 'lose');
      card.disabled = false;
    });

    // 2) attendre la fin du flip‑back de toutes les cartes…
    waitForAllFlipBack().then(() => {
      // 3) …puis changer les images (tirage shiny) et réafficher
      assignImagesAfterFlipBack();

      cards.forEach(card => {
        const img = card.querySelector('.card-img');
        if (img) img.style.visibility = 'visible';
      });
    });
  }

  // Clic sur chaque carte → révélation
  cards.forEach((card, i) => {
    card.addEventListener('click', () => revealCard(i));
  });

  // Bouton Rejouer → réinitialisation "propre"
  replayBtn.addEventListener('click', initGame);

  // Démarrage : initialise quand on ouvre l’onglet Mini‑jeu
  const observer = new MutationObserver(() => {
    if (panel.classList.contains('visible')) initGame();
  });
  observer.observe(panel, { attributes: true, attributeFilter: ['class'] });

  // Cas où le panel est déjà visible au chargement
  if (panel.classList.contains('visible')) initGame();
})();
``

// =========================
// Mini‑jeu : swap APRÈS flip‑back effectif
// =========================
(function () {
  const panel    = document.getElementById('game');           // section du mini‑jeu
  const grid     = document.querySelector('.game-grid');      // grille des cartes
  const cards    = grid ? Array.from(grid.querySelectorAll('.card')) : [];
  const replayBtn = document.querySelector('[data-action="replay"]');
  const statusEl = document.querySelector('.game-status');

  if (!panel || !grid || cards.length === 0 || !replayBtn) return;

  const NORMAL_IMG = 'img/normal.jpg';
  const SHINY_IMG  = 'img/shiny.jpg';
  const FLIP_MS = 420; // doit correspondre à .card-inner { transition: transform 420ms ... }

  let winningIndex = -1;

  function cacheBust(url) {
    return `${url}?cb=${Math.floor(Math.random() * 1e9)}`;
  }

  function assignImages() {
    winningIndex = Math.floor(Math.random() * cards.length);
    cards.forEach((card, i) => {
      const img = card.querySelector('.card-img');
      if (!img) return;
      const isWin = i === winningIndex;
      img.src = cacheBust(isWin ? SHINY_IMG : NORMAL_IMG);
      img.alt = isWin ? 'Carte shiny' : 'Carte normale';
    });
    // reset état de manche
    cards.forEach(card => {
      card.classList.remove('revealed', 'win', 'lose');
      card.disabled = false;
    });
    if (statusEl) statusEl.textContent = '';
  }

  // Attend la fin de la rotation uniquement pour les cartes qui étaient retournées
  function waitFlipBackForFlippedOnes(prevFlippedSet) {
    const waiters = [];

    cards.forEach(card => {
      const inner = card.querySelector('.card-inner');
      if (!inner) return;

      // On ne surveille QUE les cartes qui étaient vraiment flipped avant reset
      if (!prevFlippedSet.has(card)) return;

      waiters.push(new Promise(resolve => {
        let settled = false;

        const onEnd = (e) => {
          if (e.propertyName !== 'transform') return;
          if (settled) return;
          settled = true;
          inner.removeEventListener('transitionend', onEnd);
          resolve();
        };

        // Fallback de sécurité si transitionend ne remonte pas
        const t = setTimeout(() => {
          if (settled) return;
          settled = true;
          inner.removeEventListener('transitionend', onEnd);
          resolve();
        }, FLIP_MS + 30); // petite marge

        inner.addEventListener('transitionend', onEnd, { once: true });

        // Si, pour une raison quelconque, il n'y a pas de transition active, on fallback vite
        const cs = getComputedStyle(inner);
        if (cs.transitionDuration === '0s') {
          clearTimeout(t);
          settled = true;
          inner.removeEventListener('transitionend', onEnd);
          resolve();
        }
      }));
    });

    // Si aucune carte n'était retournée, on attend juste une frame pour éviter le swap immédiat
    if (waiters.length === 0) {
      return new Promise(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
    }

    return Promise.all(waiters);
  }

  function revealCard(index) {
    cards.forEach((card, i) => {
      const isWin = i === winningIndex;
      card.classList.add('flipped', 'revealed', isWin ? 'win' : 'lose');
      card.disabled = true;
    });
    if (statusEl) statusEl.textContent = (index === winningIndex) ? 'Gagné ! ✨' : 'Raté…';
  }

  function initGame() {
    // --- 0) snapshot : quelles cartes étaient vraiment flipped ?
    const previouslyFlipped = new Set(cards.filter(c => c.classList.contains('flipped')));

    // --- 1) masquage visuel de précaution + demande de flip‑back
    cards.forEach(card => {
      const img = card.querySelector('.card-img');
      if (img) img.style.visibility = 'hidden';
      card.classList.remove('flipped', 'revealed', 'win', 'lose');
      card.disabled = false;
    });

    // --- 2) attendre la fin du flip‑back EFFECTIF (ou timeout de secours)
    waitFlipBackForFlippedOnes(previouslyFlipped)
      .then(() => {
        // Attendre encore 1 frame pour garantir un repaint côté dos
        requestAnimationFrame(() => {
          // --- 3) maintenant seulement : tirage + swap d'images
          assignImages();

          // --- 4) ré‑afficher les images
          cards.forEach(card => {
            const img = card.querySelector('.card-img');
            if (img) img.style.visibility = 'visible';
          });
        });
      });
  }

  // Clic utilisateur sur une carte
  cards.forEach((card, i) => {
    card.addEventListener('click', () => revealCard(i));
  });

  // Bouton Rejouer
  replayBtn.addEventListener('click', initGame);

  // Démarrage quand l’onglet Mini‑jeu devient visible
  const observer = new MutationObserver(() => {
    if (panel.classList.contains('visible')) initGame();
  });
  observer.observe(panel, { attributes: true, attributeFilter: ['class'] });

  // Cas où le panel est déjà visible au chargement
  if (panel.classList.contains('visible')) initGame();
})();

