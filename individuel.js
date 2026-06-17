// individuel.js
// Expose function to load into any container
window.loadIndividualsInto = async function(containerId = 'individualList') {
  const container = document.getElementById(containerId);
  if(!container) return;
  container.innerHTML = `<div class="loading"><div class="spinner"></div><p>Chargement...</p></div>`;

  try {
    const data = await api.getIndividualData();
    const arr = Array.isArray(data) ? data : [];
    arr.sort((a,b) => (Number(b.totalPoints || b.combinedTotal || 0) - Number(a.totalPoints || a.combinedTotal || 0)));
    const top10 = arr.slice(0,10);
    window.individualCache = arr;
    container.innerHTML = top10.map((p, i) => renderIndividualItem(p, i+1)).join('');
  } catch (err) {
    container.innerHTML = `<div class="loading"><p style="color:var(--accent);">Erreur: ${err.message}</p></div>`;
  }
}

function normalizeIndividualData(person) {
  if (!person || typeof person !== 'object') return {};
  const normalized = {};
  normalized.matricule = getField(person, ['matricule', 'Matricule']);
  normalized.nom = getField(person, ['nom', 'Nom et Prénom', 'Nom', 'nom et prénom']);
  normalized.photo = getField(person, ['photo', 'Photo', 'photoUrl', 'avatar']);
  normalized.fonction = getField(person, ['fonction', 'Fonction']);
  normalized.rattachement = getField(person, ['rattachement', 'Rattachement']);
  normalized.nombrePointage = Number(getField(person, ['totalPointages', 'Nombre de pointage', 'nombre de pointage', 'nombre_pointage', 'nombrePointage', 'pointage', 'nbPointage'])) || 0;
  normalized.nombreParie = Number(getField(person, ['totalParies', 'Nombre de parie', 'nombre de parie', 'nombre_parie', 'nombreParie', 'parie', 'paries'])) || 0;
  normalized.totalPoint = Number(getField(person, ['totalPoints', 'Total de point', 'total de point', 'total_de_point', 'totalPoint', 'points', 'TotalPoint', 'total', 'Total'])) || 0;
  normalized.combinedTotal = normalized.totalPoint || Number(getField(person, ['combinedTotal', 'totalCombined', 'Total combiné', 'TotalCombiné'])) || 0;
  return normalized;
}

function renderIndividualItem(p, rank) {
  const data = normalizeIndividualData(p);
  const initials = getInitials(data.nom || p.nom);
  const photo = getPhotoTag(data, initials);
  const pointage = data.nombrePointage || 0;
  const parie = data.nombreParie || 0;
  const total = data.totalPoint || data.combinedTotal || 0;

  return `
    <div class="leaderboard-item" onclick="showIndividualModal('${escapeHtml(data.matricule || p.matricule || '')}')">
      <div class="rank ${rank<=3?('rank-'+rank):''}">${rank<=3? (rank===1?'🥇':rank===2?'🥈':'🥉') : '#'+rank}</div>
      ${photo}
      <div class="person-info">
        <div class="person-name">${escapeHtml(data.nom || p.nom || '—')} <span style="font-weight:400; font-size:0.85rem; color:var(--text-secondary)">(${escapeHtml(data.matricule || p.matricule || '—')})</span></div>
        <div class="person-details">${escapeHtml(data.fonction || p.fonction || '—')} • ${escapeHtml(data.rattachement || p.rattachement || '—')}</div>
      </div>
      <div class="points-container">
        <div class="points-group">
          <div class="points-value" style="color:#6C63FF;">${pointage}</div>
          <div class="points-label">Nombre de pointage</div>
        </div>
        <div class="points-group">
          <div class="points-value" style="color:#00D4FF;">${parie}</div>
          <div class="points-label">Nombre de parie</div>
        </div>
        <div class="points-total">${total} pts</div>
      </div>
    </div>
  `;
}

function getInitials(name){
  if(!name) return '??';
  return name.split(' ').map(s=>s[0]).join('').toUpperCase().slice(0,2);
}

function getPhotoTag(p, initials){
  const url = p.photo || p.photoUrl || p.avatar;
  if(url) return `<div class="avatar" style="background-image:url('${url}'); background-size:cover; background-position:center"></div>`;
  return `<div class="avatar">${initials}</div>`;
}

function lookupValue(obj, keys){
  for(const k of keys){
    if(obj && Object.prototype.hasOwnProperty.call(obj, k)) return obj[k];
  }
  return null;
}

function getField(obj, keys){
  const value = lookupValue(obj, keys);
  if (value === undefined || value === null) return null;
  return value;
}

function escapeHtml(value){
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showIndividualModal(matricule){
  const person = (window.individualCache || []).find(x=>x.matricule===matricule) || null;
  if(!person){
    api.getIndividualData().then(data=>{
      window.individualCache = data;
      const p = data.find(x=>x.matricule===matricule);
      if(p) showIndividualModalRender(p);
    }).catch(()=>{});
    return;
  }
  showIndividualModalRender(person);
}

function showIndividualModalRender(person){
  const modal = document.getElementById('modal');
  const body = document.getElementById('modalBody');
  const data = normalizeIndividualData(person);
  const initials = getInitials(data.nom || person.nom);
  const photo = getPhotoTag(data, initials);
  const pointage = data.nombrePointage;
  const parie = data.nombreParie;
  const total = data.totalPoint || data.combinedTotal;

  body.innerHTML = `
    <div class="modal-person">
      <div class="modal-avatar">${initials}</div>
      <h2>${escapeHtml(data.nom || person.nom || '')}</h2>
      <p class="subtitle">${escapeHtml(data.fonction || person.fonction || '')} • ${escapeHtml(data.rattachement || person.rattachement || '')}</p>
      <div class="modal-stats">
        <div class="modal-stat"><div class="value">${pointage}</div><div class="label">Nombre de pointage</div></div>
        <div class="modal-stat"><div class="value">${parie}</div><div class="label">Nombre de parie</div></div>
        <div class="modal-stat"><div class="value">${total}</div><div class="label">Total de point</div></div>
      </div>
    </div>
  `;
  modal.style.display = 'flex';
}

function closeModal(){ document.getElementById('modal').style.display = 'none'; }

document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });
