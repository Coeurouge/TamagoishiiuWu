// Gestion des onglets (SPA)
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


if (replayBtn) {
  replayBtn.addEventListener('click', () => {
    // 1) Masquer la face avant pour éviter de voir shiny.jpg pendant le flip
    cards.forEach(card => {
      const img = card.querySelector('.card-img');
      if (img) img.style.visibility = 'hidden';

      // flip back & reset état visuel
      card.classList.remove('flipped', 'revealed', 'win', 'lose');
      card.disabled = false;
    });

    // 2) Attendre la fin de la transition de rotation, puis réassigner les images
    const firstInner = cards[0]?.querySelector('.card-inner');
    const afterFlip = () => {
      firstInner.removeEventListener('transitionend', onEnd);

      // Tirage + changement des src
      assignImages();

      // 3) Réafficher les faces avant (maintenant que les src sont mis à jour)
      cards.forEach(card => {
        const img = card.querySelector('.card-img');
        if (img) img.style.visibility = 'visible';
      });
    };

    const onEnd = (e) => {
      if (e.propertyName !== 'transform') return; // on ne répond qu'à la rotation Y
      afterFlip();
    };

    if (firstInner) {
      // Garantir qu'une transition se produit bien
      requestAnimationFrame(() => {
        firstInner.addEventListener('transitionend', onEnd);
      });
    } else {
      // Fallback si ta structure diffère: on respecte la durée de l'anim CSS (420 ms)
      setTimeout(() => afterFlip(), 420);
    }
  });
}

