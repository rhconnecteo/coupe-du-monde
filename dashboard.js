// dashboard.js
// ============================
// FONCTIONS UTILITAIRES
// ============================

function escapeHtml(value) {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function loadingMarkup() {
  return `<div class="loading"><div class="spinner"></div><p>Chargement...</p></div>`;
}

function showError(message) {
  const html = `<div class="loading"><div style="font-size: 2rem; margin-bottom: 16px;">⚠️</div><p style="color: var(--accent);">${escapeHtml(message)}</p></div>`;
  document.getElementById('individualList').innerHTML = html;
  document.getElementById('collectiveList').innerHTML = html;
  document.getElementById('quickGameList').innerHTML = html;
  document.getElementById('topPoleChart').innerHTML = html;
}

// ============================
// INTERACTIONS (Ballons, couleurs, rotation)
// ============================

const _panelIntervals = [];
const _balloonIntervals = [];

function getPoleColor(name) {
  if (!name) return '#999';
  const map = {
    'Marketing': '#FF7A7A',
    'Ventes': '#FFD36B',
    'Technique': '#6C63FF',
    'RH': '#6EE7B7',
    'Finance': '#66D9EF',
    'Support': '#FFB3E6'
  };
  if (map[name]) return map[name];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h << 5) - h + name.charCodeAt(i);
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 70% 60%)`;
}

function addBalloonsToPanel(panelEl) {
  if (!panelEl) return;
  const wrapper = panelEl.querySelector('.header-balloons') || panelEl;
  if (wrapper.querySelector('.balloons')) return;
  const container = document.createElement('div');
  container.className = 'balloons';
  wrapper.appendChild(container);
  const colors = ['#FF7A7A','#FFD36B','#6C63FF','#6EE7B7','#66D9EF','#FFB3E6'];
  const shapes = ['default', 'star', 'moon', 'spark'];
  const createBalloon = () => {
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const b = document.createElement('div');
    b.className = `balloon balloon-${shape}`;
    b.style.left = Math.random() * 90 + '%';
    b.style.width = `${16 + Math.random() * 24}px`;
    b.style.height = `${18 + Math.random() * 26}px`;
    b.style.opacity = 0.75 + Math.random() * 0.2;
    b.style.animationDuration = `${7 + Math.random() * 3}s`;
    b.style.background = colors[Math.floor(Math.random()*colors.length)];
    container.appendChild(b);
    setTimeout(() => { b.remove(); }, 9000 + Math.random() * 3000);
  };
  for (let i = 0; i < 15; i++) {
    createBalloon();
  }
  const interval = setInterval(createBalloon, 300);
  _balloonIntervals.push(interval);
}

function clearAllBalloons() {
  _balloonIntervals.forEach(i => clearInterval(i));
  _balloonIntervals.length = 0;
}

function startAutoRotate() {
  const panels = [];
  const indiv = document.getElementById('individualList')?.closest('.panel');
  const coll = document.getElementById('collectiveList')?.closest('.panel');
  const quick = document.getElementById('quickGameList')?.closest('.panel');
  const top = document.getElementById('topPoleChart')?.closest('.panel');
  const all = null;
  if (indiv) panels.push(indiv);
  if (coll) panels.push(coll);
  if (quick) panels.push(quick);
  if (top) panels.push(top);
  panels.push(all);
  let idx = 0;
  _panelIntervals.forEach(i => clearInterval(i));
  _panelIntervals.length = 0;
  function focusStep() {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('panel-focused'));
    const target = panels[idx];
    if (target) {
      target.classList.add('panel-focused');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const header = document.querySelector('.header');
      if (header) addBalloonsToPanel(header);
    } else {
      clearAllBalloons();
      document.querySelector('.container')?.scrollIntoView({ behavior: 'smooth' });
    }
    idx = (idx + 1) % panels.length;
  }
  focusStep();
  const id = setInterval(focusStep, 60 * 1000);
  _panelIntervals.push(id);
}

function stopAutoRotate() {
  _panelIntervals.forEach(i => clearInterval(i));
  _panelIntervals.length = 0;
  clearAllBalloons();
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('panel-focused'));
}

// ============================
// CHARGEMENT DU DASHBOARD
// ============================

async function loadDashboard() {
  document.getElementById('individualList').innerHTML = loadingMarkup();
  document.getElementById('collectiveList').innerHTML = loadingMarkup();
  document.getElementById('quickGameList').innerHTML = loadingMarkup();
  document.getElementById('topPoleChart').innerHTML = loadingMarkup();

  try {
    const [individualData, collectiveData, quickGameData, topPoleData] = await Promise.all([
      api.getIndividualData(),
      api.getCollectiveData(),
      api.getQuickGameData(),
      api.getTopPoleData()
    ]);

    renderIndividualTable(individualData);
    renderCollectiveTable(collectiveData);
    renderQuickGameTable(quickGameData);
    renderTopPoleChart(individualData, collectiveData, quickGameData);
    try { startAutoRotate(); } catch(e){ console.warn('Auto-rotate failed', e); }
  } catch (error) {
    console.error('Erreur dashboard:', error);
    showError(error.message || 'Impossible de charger le dashboard');
  }
}

// ============================
// RENDU INDIVIDUEL (TOUS LES ÉLÉMENTS AVEC SCROLL)
// ============================

function renderIndividualTable(data) {
  const wrapper = document.getElementById('individualList');
  if (!data || data.length === 0) {
    wrapper.innerHTML = '<div class="empty-state">Aucune donnée individuelle disponible</div>';
    return;
  }

  // Trier par points totaux (du plus haut au plus bas)
  const sorted = [...data].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
  
  // Afficher TOUS les éléments avec un scroll
  const rows = sorted.map(person => {
    const weeks = Array.isArray(person.semaines) 
      ? [...new Set(person.semaines.map(s => s.semaine).filter(Boolean))].join(', ') 
      : '';
    const poleName = person.poles || person.rattachement || '';
    const poleColor = getPoleColor(poleName);
    return `
      <tr onclick="showIndividualDetail('${escapeHtml(person.matricule || '')}')">
        <td>${escapeHtml(person.nom || '')}</td>
        <td><span class="pole-badge" style="background:${poleColor}"></span> ${escapeHtml(poleName)}</td>
        <td>${escapeHtml(weeks)}</td>
        <td>${person.totalPoint || 0}</td>
        <td>${person.totalParis || 0}</td>
        <td>${person.totalQuizz || 0}</td>
        <td>${person.totalPoints || 0}</td>
      </tr>
    `;
  }).join('');

  wrapper.innerHTML = `
    <div class="table-scroll no-hscroll" style="max-height: 320px; overflow-y: auto;">
      <table class="table">
        <thead>
          <tr>
            <th><span>Nom</span></th>
            <th><span>Pôle</span></th>
            <th><span>Semaine</span></th>
            <th><span>Pointage</span></th>
            <th><span>Paris</span></th>
            <th><span>Quizz</span></th>
            <th><span>Total</span></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="text-align: center; padding: 6px 0; font-size: 0.75rem; color: var(--text-secondary); opacity: 0.7;">
      ${sorted.length} participants
    </div>
  `;
}

// ============================
// RENDU COLLECTIF (TOUS LES ÉLÉMENTS AVEC SCROLL)
// ============================

function renderCollectiveTable(data) {
  const wrapper = document.getElementById('collectiveList');
  if (!data || data.length === 0) {
    wrapper.innerHTML = '<div class="empty-state">Aucune donnée collective disponible</div>';
    return;
  }

  const sorted = [...data].sort((a, b) => (b.totalGeneral || b.total || b.points || 0) - (a.totalGeneral || a.total || a.points || 0));
  
  const rows = sorted.map(group => {
    const groupName = group.group || group.name || group.pole || group.rattachement || group.poles || '';
    const poleName = group.pole || group.rattachement || group.poles || '';
    const color = getPoleColor(poleName || groupName);
    return `
      <tr onclick="showCollectiveDetail('${escapeHtml(groupName)}')">
        <td>${escapeHtml(groupName)}</td>
        <td>${group.points || 0}</td>
        <td><span class="pole-badge" style="background:${color}"></span> ${escapeHtml(poleName)}</td>
        <td>${group.footPoints || 0}</td>
        <td>${group.babyFootPoints || 0}</td>
        <td>${group.totalGeneral || group.total || 0}</td>
      </tr>
    `;
  }).join('');

  wrapper.innerHTML = `
    <div class="table-scroll" style="max-height: 320px; overflow-y: auto;">
      <table class="table">
        <thead>
          <tr>
            <th><span>Groupe</span></th>
            <th><span>Points</span></th>
            <th><span>Pôle</span></th>
            <th><span>Foot</span></th>
            <th><span>Baby-foot</span></th>
            <th><span>Total General</span></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="text-align: center; padding: 6px 0; font-size: 0.75rem; color: var(--text-secondary); opacity: 0.7;">
      ${sorted.length} groupes
    </div>
  `;

  // After rendering the collective table, refresh the Top Pôles chart so
  // collective totals immediately reflect in the chart when collectif changes.
  if (typeof updateTopPoleChart === 'function') {
    updateTopPoleChart();
  }
}

// Fetch fresh data and re-render the Top Pôles chart.
async function updateTopPoleChart() {
  try {
    const [individualData, collectiveData, quickGameData] = await Promise.all([
      api.getIndividualData(),
      api.getCollectiveData(),
      api.getQuickGameData()
    ]);
    renderTopPoleChart(individualData, collectiveData, quickGameData);
  } catch (e) {
    console.warn('Erreur lors de la mise à jour du Top Pôles:', e);
  }
}

// ============================
// RENDU JEU RAPIDE (TOUS LES ÉLÉMENTS AVEC SCROLL)
// ============================

function renderQuickGameTable(data) {
  const wrapper = document.getElementById('quickGameList');
  if (!data || data.length === 0) {
    wrapper.innerHTML = '<div class="empty-state">Aucune donnée Jeu Rapide disponible</div>';
    return;
  }

  const sorted = [...data].sort((a, b) => (b.points || 0) - (a.points || 0));
  
  const rows = sorted.map(item => {
    const poleName = item.poles || '';
    const color = getPoleColor(poleName);
    return `
      <tr>
        <td>${escapeHtml(item.matricule || '')}</td>
        <td>${escapeHtml(item.nom || '')}</td>
        <td><span class="pole-badge" style="background:${color}"></span> ${escapeHtml(poleName)}</td>
        <td>${escapeHtml(item.semaine || '')}</td>
        <td>${item.points || 0}</td>
      </tr>
    `;
  }).join('');

  wrapper.innerHTML = `
    <div class="table-scroll" style="max-height: 320px; overflow-y: auto;">
      <table class="table">
        <thead>
          <tr>
            <th><span>Matricule</span></th>
            <th><span>Nom</span></th>
            <th><span>Pôle</span></th>
            <th><span>Semaine</span></th>
            <th><span>Points</span></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="text-align: center; padding: 6px 0; font-size: 0.75rem; color: var(--text-secondary); opacity: 0.7;">
      ${sorted.length} participants
    </div>
  `;
}

// ============================
// RENDU TOP PÔLES (TOUS LES ÉLÉMENTS AVEC SCROLL)
// ============================

function renderTopPoleChart(individualData, collectiveData, quickGameData) {
  const wrapper = document.getElementById('topPoleChart');
  
  // 1. Récupérer tous les noms de pôles uniques
  const allPoles = new Set();
  
  (individualData || []).forEach(p => {
    const pole = p.poles || p.rattachement || '';
    if (pole) allPoles.add(pole);
  });
  
  (collectiveData || []).forEach(p => {
    let pole = p.pole || p.name || p.rattachement || p.poles || '';
    if (String(pole).trim().toUpperCase() === 'COMEX') {
      pole = 'SUPPORT';
    }
    if (pole) allPoles.add(pole);
  });
  
  (quickGameData || []).forEach(p => {
    const pole = p.poles || '';
    if (pole) allPoles.add(pole);
  });

  if (allPoles.size === 0) {
    wrapper.innerHTML = '<div class="empty-state">Aucun pôle disponible</div>';
    return;
  }

  // 2. Calculer les totaux par pôle
  const poleTotals = {};
  const poleColors = {};

  allPoles.forEach(pole => {
    let individualTotal = 0;
    (individualData || []).forEach(p => {
      const pPole = p.poles || p.rattachement || '';
      if (pPole === pole) {
        individualTotal += p.totalPoints || 0;
      }
    });

    let collectiveTotal = 0;
    (collectiveData || []).forEach(p => {
      let pPole = p.pole || p.name || p.rattachement || p.poles || '';
      if (String(pPole).trim().toUpperCase() === 'COMEX') {
        pPole = 'SUPPORT';
      }
      if (pPole === pole) {
        collectiveTotal += p.totalGeneral || p.total || 0;
      }
    });

    let quickTotal = 0;
    (quickGameData || []).forEach(p => {
      const pPole = p.poles || '';
      if (pPole === pole) {
        quickTotal += p.points || 0;
      }
    });

    const grandTotal = individualTotal + collectiveTotal + quickTotal;
    
    poleTotals[pole] = {
      individual: individualTotal,
      collective: collectiveTotal,
      quick: quickTotal,
      total: grandTotal
    };
    
    poleColors[pole] = getPoleColor(pole);
  });

  // 3. Trier les pôles par total général
  const sortedPoles = Object.keys(poleTotals).sort(
    (a, b) => poleTotals[b].total - poleTotals[a].total
  );

  if (sortedPoles.length === 0) {
    wrapper.innerHTML = '<div class="empty-state">Aucune donnée Top Pôle disponible</div>';
    return;
  }

  const maxValue = Math.max(...sortedPoles.map(p => poleTotals[p].total), 1);

  // 4. Afficher TOUS les pôles avec scroll
  const rows = sortedPoles.map(pole => {
    const data = poleTotals[pole];
    const width = Math.round((data.total / maxValue) * 100);
    const color = poleColors[pole];
    return `
      <div class="bar-row">
        <div class="bar-label">${escapeHtml(pole)}</div>
        <div class="bar-fill">
          <div class="bar-fill-inner" style="width: ${width}%; background: ${color}"></div>
        </div>
        <div class="bar-value">${data.total}</div>
      </div>
    `;
  }).join('');

  wrapper.innerHTML = `
    <div class="bar-chart-scroll" style="max-height: 300px; overflow-y: auto;">
      ${rows}
    </div> 
  `;
}
// <div style="text-align: center; padding: 4px 0; font-size: 0.7rem; color: var(--text-secondary); opacity: 0.7;">
    //   ${sortedPoles.length} pôles • ↓ Scroll pour voir plus
    // </div>
// ============================
// MODALS
// ============================

//<div class="bar-legend">
  //    <span style="color:#6C63FF;">● Individuel</span>
    //  <span style="color:#FFD36B;">● Collectif</span>
      //<span style="color:#FF7A7A;">● Jeu Rapide</span>
      //<span style="font-weight:600;">= Total Général</span>
    //</div>

function showIndividualDetail(matricule) {
  const modal = document.getElementById('modal');
  const body = document.getElementById('modalBody');
  api.getIndividualData().then(data => {
    const person = (Array.isArray(data) ? data : []).find(item => item.matricule === matricule);
    if (!person) return;
    const weeks = Array.isArray(person.semaines) 
      ? person.semaines.map(s => `${escapeHtml(s.semaine)}: ${s.points || 0} pts`).join('<br>') 
      : '';
    body.innerHTML = `
      <div class="modal-person">
        <div class="modal-avatar">${escapeHtml((person.nom || '').slice(0,2).toUpperCase())}</div>
        <h2>${escapeHtml(person.nom || '')}</h2>
        <p class="subtitle">${escapeHtml(person.fonction || '')} • ${escapeHtml(person.poles || person.rattachement || '')}</p>
        <div class="modal-stats">
          <div class="modal-stat"><div class="value">${person.totalPoint || 0}</div><div class="label">Point</div></div>
          <div class="modal-stat"><div class="value">${person.totalParis || 0}</div><div class="label">Paris</div></div>
          <div class="modal-stat"><div class="value">${person.totalQuizz || 0}</div><div class="label">Quizz</div></div>
          <div class="modal-stat"><div class="value">${person.totalPoints || 0}</div><div class="label">Total de point</div></div>
        </div>
        <div style="margin-top:16px; color: var(--text-secondary); font-size:0.95rem;">${weeks}</div>
      </div>
    `;
    modal.style.display = 'flex';
  }).catch(err => console.warn(err));
}

function showCollectiveDetail(groupName) {
  const modal = document.getElementById('modal');
  const body = document.getElementById('modalBody');
  api.getCollectiveData().then(data => {
    const group = (Array.isArray(data) ? data : []).find(item => (item.group || item.name || item.pole || item.rattachement || item.poles || '') === groupName);
    if (!group) return;
    const poleName = group.pole || group.rattachement || group.poles || '';
    body.innerHTML = `
      <div class="modal-person">
        <h2><span class="pole-badge" style="background:${getPoleColor(poleName || groupName)}"></span> ${escapeHtml(group.group || group.name || poleName || '')}</h2>
        <p class="subtitle">Finale tir au but et dress code</p>
        <div class="modal-stats">
          <div class="modal-stat"><div class="value">${group.points || 0}</div><div class="label">Points</div></div>
          <div class="modal-stat"><div class="value">${group.footPoints || 0}</div><div class="label">Foot</div></div>
          <div class="modal-stat"><div class="value">${group.babyFootPoints || 0}</div><div class="label">Baby-foot</div></div>
          <div class="modal-stat"><div class="value">${group.dressCodePoints || 0}</div><div class="label">Dress code</div></div>
          <div class="modal-stat"><div class="value">${group.tirAuBut || 0}</div><div class="label">Tir au but</div></div>
          <div class="modal-stat"><div class="value">${group.totalGeneral || group.total || 0}</div><div class="label">Total General</div></div>
        </div>
      </div>
    `;
    modal.style.display = 'flex';
  }).catch(err => console.warn(err));
}

function closeModal() {
  const modal = document.getElementById('modal');
  if (modal) modal.style.display = 'none';
}

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeModal();
  }
})
document.addEventListener('DOMContentLoaded', loadDashboard);