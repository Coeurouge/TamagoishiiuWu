// Gestion des onglets (SPA)
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

// Navigation par clic sur les onglets
tabs.forEach(tab =&gt; {
  tab.addEventListener('click', () =&gt; {
    // état visuel actif
    tabs.forEach(t =&gt; t.classList.remove('active'));
    tab.classList.add('active');

    // sections
    const id = tab.dataset.target;
    panels.forEach(p =&gt; p.classList.toggle('visible', p.id === id));

    // mise à jour du hash (pour partager un lien vers un onglet)
    history.replaceState(null, '', `#${id}`);

    // accessibilité : focus sur la section
    const panel = document.getElementById(id);
    panel &amp;&amp; panel.focus();
  });
});

// Liens/boutons avec data-target (CTA internes)
document.addEventListener('click', (e) =&gt; {
  const link = e.target.closest('[data-target]');
  if (!link) return;
  const dest = link.getAttribute('data-target');
  const btn = Array.from(tabs).find(t =&gt; t.dataset.target === dest);
  if (btn) btn.click();
});

// Ouvrir la section depuis l’URL (ex: …/index.html#contact)
window.addEventListener('DOMContentLoaded', () =&gt; {
  const hash = location.hash.replace('#', '');
  const initial = Array.from(tabs).find(t =&gt; t.dataset.target === hash) || tabs[0];
  initial.click();
});
