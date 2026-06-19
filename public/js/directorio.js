(() => {
  const normalize = (text) => String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const cards = Array.from(document.querySelectorAll('.extension-card'));
  const sections = Array.from(document.querySelectorAll('.directory-section'));
  const search = document.getElementById('directory-search');
  const filterRow = document.getElementById('filter-row');
  const empty = document.getElementById('directory-empty');
  const visibleCount = document.getElementById('visible-count');
  const firstExt = document.getElementById('first-ext');
  const lastExt = document.getElementById('last-ext');
  const copyVisible = document.getElementById('copy-visible-btn');
  const toast = document.getElementById('copy-toast');

  let activeFilter = 'TODOS';
  let toastTimer = null;

  const params = new URLSearchParams(window.location.search);
  const initialTipo = (params.get('tipo') || '').toUpperCase();
  const initialSearch = params.get('q') || '';
  if (search && initialSearch) search.value = initialSearch;
  if (initialTipo && ['OFICINA', 'SUCURSAL', 'PANADERIA', 'VIGILANCIA'].includes(initialTipo)) {
    activeFilter = initialTipo;
    if (filterRow) {
      filterRow.querySelectorAll('.filter-chip').forEach((chip) => {
        chip.classList.toggle('active', chip.dataset.filter === initialTipo);
      });
    }
  }

  function showToast(message) {
    if (!toast) return;
    toast.innerHTML = `<i class="fa-solid fa-check"></i> ${message}`;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1500);
  }

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      const temp = document.createElement('textarea');
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      temp.remove();
    }
    showToast(label);
  }

  function applyFilters() {
    const query = normalize(search ? search.value : '');
    const visibleExtensions = [];

    cards.forEach((card) => {
      const typeMatch = activeFilter === 'TODOS' || card.dataset.type === activeFilter;
      const searchMatch = !query || normalize(card.dataset.search).includes(query);
      const isVisible = typeMatch && searchMatch;
      card.style.display = isVisible ? '' : 'none';
      if (isVisible) {
        const numberButton = card.querySelector('.extension-number');
        if (numberButton) visibleExtensions.push(numberButton.dataset.copy);
      }
    });

    sections.forEach((section) => {
      const hasVisibleCards = Array.from(section.querySelectorAll('.extension-card')).some((card) => card.style.display !== 'none');
      section.style.display = hasVisibleCards ? '' : 'none';
      const count = section.querySelectorAll('.extension-card:not([style*="display: none"])').length;
      const counter = section.querySelector('.directory-section-count');
      if (counter) counter.textContent = `${count} extensiones`;
    });

    if (empty) empty.style.display = visibleExtensions.length ? 'none' : 'block';
    if (visibleCount) visibleCount.textContent = visibleExtensions.length;
    const numbers = visibleExtensions.map(Number).filter((num) => !Number.isNaN(num));
    if (firstExt) firstExt.textContent = numbers.length ? Math.min(...numbers) : '--';
    if (lastExt) lastExt.textContent = numbers.length ? Math.max(...numbers) : '--';
  }

  if (search) search.addEventListener('input', applyFilters);

  if (filterRow) {
    filterRow.addEventListener('click', (event) => {
      const button = event.target.closest('.filter-chip');
      if (!button) return;
      activeFilter = button.dataset.filter;
      filterRow.querySelectorAll('.filter-chip').forEach((chip) => chip.classList.toggle('active', chip === button));
      applyFilters();
    });
  }

  document.addEventListener('click', (event) => {
    const copyButton = event.target.closest('[data-copy]');
    if (!copyButton) return;
    copyText(copyButton.dataset.copy, `Extensión ${copyButton.dataset.copy} copiada`);
  });

  if (copyVisible) {
    copyVisible.addEventListener('click', () => {
      const lines = cards
        .filter((card) => card.style.display !== 'none')
        .map((card) => {
          const extension = card.querySelector('.extension-number')?.dataset.copy || '';
          const name = card.querySelector('.extension-title')?.textContent || '';
          const type = card.dataset.type || '';
          return `${extension} - ${name} (${type})`;
        });
      copyText(lines.join('\n') || 'Sin resultados', 'Resultados visibles copiados');
    });
  }

  applyFilters();
})();
