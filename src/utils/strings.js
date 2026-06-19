function displayName(item) {
  return item.display_name || [item.first_name, item.last_name].filter(Boolean).join(' ') || 'Sin nombre';
}

function subtitle(item) {
  const fullName = [item.first_name, item.last_name].filter(Boolean).join(' ');
  if (fullName && fullName.toLowerCase() !== displayName(item).toLowerCase()) return fullName;
  if (item.type === 'SUCURSAL') return item.branch_name || 'Sucursal Coronel';
  return 'Extensión interna';
}

function sectionKey(item) {
  if (item.type === 'OFICINA') return 'OFICINAS';
  if (item.type === 'SUCURSAL') return 'SUCURSALES';
  return 'OPERACION';
}

const SECTION_INFO = {
  OFICINAS: {
    title: 'Oficinas',
    icon: 'fa-building-user',
    description: 'Corporativo, áreas administrativas y extensiones internas.'
  },
  SUCURSALES: {
    title: 'Sucursales',
    icon: 'fa-store',
    description: 'Tiendas y puntos de venta CHC.'
  },
  OPERACION: {
    title: 'Operación y vigilancia',
    icon: 'fa-shield-halved',
    description: 'Panadería, vigilancia y áreas operativas especiales.'
  }
};

const SECTION_ORDER = ['SUCURSALES', 'OFICINAS', 'OPERACION'];

function groupDirectoryItems(rows) {
  const groups = SECTION_ORDER.map((key) => ({ key, ...SECTION_INFO[key], items: [] }));
  const byKey = new Map(groups.map((group) => [group.key, group]));
  rows.forEach((row) => byKey.get(sectionKey(row)).items.push(row));
  return groups.filter((group) => group.items.length > 0);
}

module.exports = { displayName, subtitle, sectionKey, SECTION_INFO, SECTION_ORDER, groupDirectoryItems };
