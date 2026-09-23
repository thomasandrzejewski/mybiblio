(() => {
  const STORAGE_KEY = 'mybiblio-list-view';
  const savedView = localStorage.getItem(STORAGE_KEY) === 'compact' ? 'compact' : 'detailed';
  document.body.classList.add(`view-${savedView}`);

  const updateButtons = (controls, view) => {
    controls.querySelectorAll('[data-view]').forEach((button) => {
      const selected = button.dataset.view === view;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  };

  const addControls = () => {
    document.querySelectorAll('.book-grid').forEach((grid) => {
      if (grid.previousElementSibling?.classList.contains('view-controls')) return;
      const controls = document.createElement('div');
      controls.className = 'view-controls';
      controls.setAttribute('aria-label', 'Présentation de la liste');
      controls.innerHTML = `
        <span class="view-controls-label">Affichage</span>
        <div class="view-controls-buttons" role="group">
          <button type="button" data-view="compact" aria-label="Affichage réduit" title="Sans photo">Réduit</button>
          <button type="button" data-view="detailed" aria-label="Affichage détaillé" title="Avec photo">Détaillé</button>
        </div>`;
      grid.parentNode.insertBefore(controls, grid);
      updateButtons(controls, savedView);
      controls.addEventListener('click', (event) => {
        const button = event.target.closest('[data-view]');
        if (!button) return;
        const view = button.dataset.view;
        document.body.classList.remove('view-compact', 'view-detailed');
        document.body.classList.add(`view-${view}`);
        localStorage.setItem(STORAGE_KEY, view);
        updateButtons(controls, view);
      });
    });
  };

  addControls();
  new MutationObserver(addControls).observe(document.body, { childList: true, subtree: true });
})();
