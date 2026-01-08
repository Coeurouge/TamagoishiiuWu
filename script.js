
<script>
document.addEventListener('DOMContentLoaded', () => {
  // =======================
  // Gestion des onglets (SPA)
  // =======================
  const tabsContainer = document.querySelector('.tabs'); // conteneur de tes boutons d'onglet
  const tabs   = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');

  if (tabsContainer && tabs.length && panels.length) {
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

    // 🔒 Scope le délégateur de clics aux onglets seulement (évite d'intercepter d'autres boutons)
    tabsContainer.addEventListener('click', (e) => {
      const link = e.target.closest('.tab[data-target]');
      if (!link) return;
      const dest = link.getAttribute('data-target');
      const btn = Array.from(tabs).find(t => t.dataset.target === dest);
      if (btn) btn.click();
    });

    const hash = location.hash.replace('#', '');
    const initial = Array.from(tabs).find(t => t.dataset.target === hash) || tabs[0];
    initial && initial.click();
  }

  // =======================
  // Mini‑jeu : images figées entre les manches
  // =======================
  const grid      = document.querySelector('#game .game-grid');
  const cards     = document.querySelectorAll('#game .card');
  const replayBtn = document.querySelector('#game .game-actions .btn');

  // Garde-fous : si l'un manque, on n'attache rien pour éviter les erreurs bloquantes
  if (!grid || !cards.length || !replayBtn) {
    console.warn('[Game] Éléments manquants :',
      { hasGrid: !!grid, cardsCount: cards.length, hasReplayBtn: !!replayBtn });
    return; // on sort proprement → le reste du site reste cliquable
  }

  // 👉 Chemin des images (adapter si besoin)
  const IMAGE_BASE = 'assets/images/';
  const images = Array.from({ length: 10 }, (_, i) => `${IMAGE_BASE}${i + 1}.jpg`);

  let shinyIndex = -1;
  let gameReady = false;
  let imagesAssigned = false; // ✅ Assigner les images une fois

  // --- Utils ---
  const shuffleArray = arr => arr.sort(() => Math.random() - 0.5);

  function preloadImages(urls) {
    return Promise.all(urls.map(url => new Promise(res => {
      const img = new Image();
      img.onload = img.onerror = () => res();
      img.src = url;
    })));
  }

  // Attendre la fin réelle du flip-back
  function waitFlipBackAll(beforeStates) {
    const inners = Array.from(document.querySelectorAll('#game .card .card-inner'));
    const waits = inners.map((inner, i) => {
      return new Promise(resolve => {
        if (!beforeStates[i]) {
          return requestAnimationFrame(() => requestAnimationFrame(resolve));
        }
        const onEnd = (e) => {
          if (e.target === inner && e.propertyName === 'transform') {
            inner.removeEventListener('transitionend', onEnd);
            requestAnimationFrame(() => requestAnimationFrame(resolve));
          }
        };
        inner.addEventListener('transitionend', onEnd, { once: true });
        setTimeout(() => {
          inner.removeEventListener('transitionend', onEnd);
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        }, 1000);
      });
    });
    return Promise.all(waits);
  }

  // Enlever les états visuels (sans toucher aux images)
  function resetVisualState() {
    cards.forEach(card => {
      card.classList.remove('revealed', 'win', 'lose', 'is-disabled');
    });
  }

  // --- Init ---
  function initGame() {
    shinyIndex = -1;
    gameReady = true;
    resetVisualState();

    // ✅ Assigner les images une seule fois
    if (!imagesAssigned) {
      const imgList = shuffleArray([...images]);
      // Précharge non bloquant
      preloadImages(imgList);
      cards.forEach((card, i) => {
        const imgEl = card.querySelector('.card-img');
        if (imgEl) imgEl.src = imgList[i % imgList.length];
      });
      imagesAssigned = true;
    }
  }

  // --- Rejouer : flip-back → attendre → (optionnel) shuffle POSITIONS (images figées)
  replayBtn.addEventListener('click', async (e) => {
    e.preventDefault(); // au cas où c'est un <a>
    if (!grid) return;

    gameReady = false;
    replayBtn.classList.add('is-disabled'); // éviter d'utiliser l'attribut disabled
    cards.forEach(c => c.classList.add('is-disabled'));

    const beforeStates = Array.from(cards).map(c => c.classList.contains('flipped'));

    // 1) Flip-back
    cards.forEach(card => card.classList.remove('flipped'));

    // 2) Attendre la fin réelle du flip-back
    await waitFlipBackAll(beforeStates);

    // 3) (Optionnel) Mélanger la POSITION des cartes (les images restent dans chaque carte)
    const frag = document.createDocumentFragment();
    const shuffledCards = shuffleArray(Array.from(cards));
    shuffledCards.forEach(c => frag.appendChild(c));
    grid.appendChild(frag);

    // 4) Réactiver la manche
    shinyIndex = -1;
    shuffledCards.forEach(c => c.classList.remove('is-disabled'));
    replayBtn.classList.remove('is-disabled');
    gameReady = true;
  });

  // --- Clic carte ---
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      // Empêche qu'un clic sur la carte affecte d'autres handlers globaux
      e.stopPropagation();

      if (!gameReady || card.classList.contains('is-disabled')) return;

      const currentCards = Array.from(document.querySelectorAll('#game .card'));
      const clickedIndex = currentCards.indexOf(card);

      // Tirage de la shiny au moment du clic
      if (shinyIndex < 0) {
        shinyIndex = Math.floor(Math.random() * currentCards.length);
      }

      // Flip vers la face
      card.classList.add('flipped');

      // Marquer résultat (visuel uniquement)
      requestAnimationFrame(() => {
        card.classList.add('revealed', clickedIndex === shinyIndex ? 'win' : 'lose');
      });

      // Si perdue : révéler la shiny ailleurs après un petit délai
      const inner = card.querySelector('.card-inner');
      const flipDurationMs = (() => {
        if (!inner) return 420;
        const d = getComputedStyle(inner).transitionDuration.split(',')[0].trim();
        if (d.endsWith('ms')) return parseFloat(d) || 420;
        if (d.endsWith('s')) return (parseFloat(d) || 0.42) * 1000;
        return 420;
      })();

      if (clickedIndex !== shinyIndex) {
        const shinyCard = currentCards[shinyIndex];
        setTimeout(() => {
          shinyCard.classList.add('flipped', 'revealed', 'win');
        }, flipDurationMs / 2);
      }

      // Fin de manche
      currentCards.forEach(c => c.classList.add('is-disabled'));
      gameReady = false;
    });
  });

  // Lance l'init si l'onglet Game est déjà visible à l'arrivée
  const gamePanelVisible = document.querySelector('#game.panel.visible');
  if (gamePanelVisible) initGame();
});
</script>
``
