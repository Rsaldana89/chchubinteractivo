(() => {
  const normalize = (text) => String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  const search = document.getElementById('location-search');
  const cards = Array.from(document.querySelectorAll('.location-card'));
  const empty = document.getElementById('location-empty');

  function applyFilters() {
    const query = normalize(search ? search.value : '');
    let visible = 0;
    cards.forEach((card) => {
      const show = !query || normalize(card.dataset.search).includes(query);
      card.style.display = show ? '' : 'none';
      if (show) visible += 1;
    });
    if (empty) empty.style.display = visible ? 'none' : 'block';
  }

  if (search) search.addEventListener('input', applyFilters);
  applyFilters();
})();
