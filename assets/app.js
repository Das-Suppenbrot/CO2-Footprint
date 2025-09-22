function sanitizeText(val) {
  return String(val).replace(/[<>`$\\]/g, '').trim();
}

function normalizeForCompare(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function tokenizeWords(s) {
  return normalizeForCompare(s).split(/[^a-z0-9]+/).filter(Boolean);
}

// automatische Sprache & Richtung
(function setLangDir() {
  const lang = navigator.language || navigator.userLanguage || 'de';
  const rtl = ['ar', 'he', 'fa', 'ur'];
  document.documentElement.setAttribute('dir', rtl.some(l => lang.startsWith(l)) ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lang);
})();

const DATA = [
  { country: 'Deutschland', company: 'EcoCorp', sector: 'Energie', emissions: 212.4, year: 2023 },
  { country: 'USA', company: 'TransLog', sector: 'Transport', emissions: 310.7, year: 2024 },
  { country: 'Frankreich', company: 'GreenSteel', sector: 'Industrie', emissions: 180.1, year: 2023 },
  { country: 'China', company: 'MegaPower', sector: 'Energie', emissions: 1200.5, year: 2024 },
  { country: 'Brasilien', company: 'AgroPlus', sector: 'Landwirtschaft', emissions: 340.2, year: 2022 },
  { country: 'Indien', company: 'UrbanBuild', sector: 'Bau', emissions: 450.6, year: 2023 },
  { country: 'Kanada', company: 'MapleOil', sector: 'Energie', emissions: 390.0, year: 2023 },
  { country: 'Japan', company: 'TechMotors', sector: 'Transport', emissions: 280.4, year: 2022 },
  { country: 'Australien', company: 'MineWorks', sector: 'Industrie', emissions: 600.7, year: 2023 },
  { country: 'Südafrika', company: 'SolarFuture', sector: 'Energie', emissions: 150.3, year: 2024 },
  { country: 'Norwegen', company: 'HydroPower', sector: 'Energie', emissions: 90.1, year: 2022 },
  { country: 'Mexiko', company: 'Cemex', sector: 'Bau', emissions: 320.5, year: 2023 },
  { country: 'Russland', company: 'GazpromX', sector: 'Energie', emissions: 980.0, year: 2023 },
  { country: 'Italien', company: 'FoodGroup', sector: 'Landwirtschaft', emissions: 210.2, year: 2024 },
  { country: 'Spanien', company: 'WindNow', sector: 'Energie', emissions: 170.8, year: 2022 },
  { country: 'Südkorea', company: 'ElectroCar', sector: 'Transport', emissions: 190.9, year: 2023 },
  { country: 'UK', company: 'BritSteel', sector: 'Industrie', emissions: 410.0, year: 2022 },
  { country: 'Schweiz', company: 'AlpAgro', sector: 'Landwirtschaft', emissions: 75.4, year: 2024 },
  { country: 'Türkei', company: 'BuildFast', sector: 'Bau', emissions: 280.6, year: 2023 },
  { country: 'Ägypten', company: 'NileEnergy', sector: 'Energie', emissions: 330.0, year: 2023 },
  { country: 'Vereinigtes Königreich', company: 'United Energy', sector: 'Energie', emissions: 250.0, year: 2023 },
  { country: 'Vereinigte Staaten', company: 'New Horizon Logistics', sector: 'Transport', emissions: 345.2, year: 2024 }
];

const els = {
  tbody: document.getElementById('tableBody'),
  badge: document.getElementById('rowsBadge'),
  form: document.getElementById('filterForm'),
  year: document.getElementById('year')
};

let sortState = { key: null, dir: 'asc' };

function numericSanitize(value) { return value.replace(/[^\d.,]/g, ''); }

function setupNumericInputs() {
  if (!els.form) return;
  els.form.addEventListener('input', (e) => {
    const t = e.target;
    if (t && (t.name === 'min' || t.name === 'max')) {
      const cleaned = numericSanitize(t.value);
      if (cleaned !== t.value) t.value = cleaned;
    }
  });
}

// Wortanfangs-Filter: Beginn jedes Wortes
function wordStartMatch(fieldValue, query) {
  if (!query) return true;
  const tokens = normalizeForCompare(fieldValue).split(/[^a-z0-9]+/).filter(Boolean);
  const q = normalizeForCompare(query);
  return tokens.some(tok => tok.startsWith(q));
}

function applyFilters(rows = DATA) {
  if (!els.form) return rows;
  const c = sanitizeText((els.form.country?.value || ''));
  const comp = sanitizeText((els.form.company?.value || ''));

  const minRaw = numericSanitize((els.form.min?.value || ''));
  const maxRaw = numericSanitize((els.form.max?.value || ''));
  const min = minRaw === '' ? 0 : Number(minRaw.replace(',', '.'));
  const max = maxRaw === '' ? Number.POSITIVE_INFINITY : Number(maxRaw.replace(',', '.'));

  return rows.filter(r =>
    wordStartMatch(r.country, c) &&
    wordStartMatch(r.company, comp) &&
    r.emissions >= min && r.emissions <= max
  );
}

function sortRows(rows) {
  const { key, dir } = sortState;
  if (!key) return rows;
  const sorted = [...rows].sort((a, b) => {
    const x = a[key]; const y = b[key];
    const num = (typeof x === 'number' && typeof y === 'number');
    const cmp = num ? (x - y) : String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: 'base' });
    return dir === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

function renderHeaderIndicators() {
  document.querySelectorAll('th[data-key]').forEach(th => {
    th.setAttribute('aria-sort', 'none');
    th.classList.remove('sorted-asc', 'sorted-desc');
  });
  if (!sortState.key) return;
  const th = document.querySelector(`th[data-key="${sortState.key}"]`);
  if (th) {
    th.setAttribute('aria-sort', sortState.dir === 'asc' ? 'ascending' : 'descending');
    th.classList.add(sortState.dir === 'asc' ? 'sorted-asc' : 'sorted-desc');
  }
}

function renderTable(rows) {
  if (!els.tbody) return;
  els.tbody.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    [r.country, r.company, r.sector, r.emissions.toFixed(1), r.year].forEach(val => {
      const td = document.createElement('td');
      td.textContent = val;
      tr.appendChild(td);
    });
    els.tbody.appendChild(tr);
  });
  if (els.badge) els.badge.textContent = rows.length + ' Einträge';
  renderHeaderIndicators();
}

function update() {
  const filtered = applyFilters(DATA);
  const sorted = sortRows(filtered);
  renderTable(sorted);
}

function initSorting() {
  document.querySelectorAll('th[data-key]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.key;
      if (sortState.key === key) {
        sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
      } else {
        sortState.key = key;
        sortState.dir = 'asc';
      }
      update();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupNumericInputs();
  if (els.form) {
    els.form.addEventListener('input', update);
    els.form.addEventListener('reset', () => { requestAnimationFrame(update); });
  }
  if (els.year) els.year.textContent = new Date().getFullYear();
  initSorting();
  update();
});
