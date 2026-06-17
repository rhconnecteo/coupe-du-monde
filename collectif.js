// collectif.js
// Expose function to load collective data into any container
window.loadCollectiveInto = async function(containerId = 'collectiveSlide', teamsWrapperId = 'teamsWrapper'){
  const groupContainer = document.getElementById(containerId);
  const teamsWrapper = document.getElementById(teamsWrapperId);
  if(!groupContainer) return;
  groupContainer.innerHTML = `<div class="loading"><div class="spinner"></div><p>Chargement...</p></div>`;
  if(teamsWrapper) teamsWrapper.innerHTML = '';

  try{
    const groups = await api.getCollectiveData();
    const arr = Array.isArray(groups) ? groups : [];
    const grouped = groupByRattachement(arr);
    grouped.sort((a,b)=> (b.totalPoints||0) - (a.totalPoints||0));
    window.collectiveCache = grouped;
    groupContainer.innerHTML = grouped.map((g,i)=> renderGroupItem(g,i+1)).join('');

    if(teamsWrapper) teamsWrapper.innerHTML = grouped.map(g=> renderTeamDistribution(g)).join('');
  }catch(err){
    groupContainer.innerHTML = `<div class="loading"><p style="color:var(--accent);">Erreur: ${err.message}</p></div>`;
  }
}

function renderGroupItem(g, rank){
  return `
    <div class="leaderboard-item" onclick="showGroupModal('${escapeHtml(g.name)}')">
      <div class="rank ${rank<=3?('rank-'+rank):''}">${rank<=3? (rank===1?'🥇':rank===2?'🥈':'🥉') : '#'+rank}</div>
      <div class="avatar">${(g.name||'G').slice(0,2).toUpperCase()}</div>
      <div class="person-info">
        <div class="person-name">${g.name}</div>
        <div class="person-details">${g.members?g.members.length+' membres':''}</div>
      </div>
      <div class="points-total">${Math.round(g.totalPoints||0)} pts</div>
    </div>
  `;
}

function renderTeamDistribution(g){
  const members = Array.isArray(g.members) ? g.members.slice() : [];
  members.sort((a,b)=> (b.totalPoints||0)-(a.totalPoints||0));
  const top5 = members.slice(0,5);
  const bottom5 = members.slice(-5).reverse();

  return `
    <div class="team-card">
      <div class="team-card-header">
        <div style="font-weight:700;">${g.name}</div>
        <div style="font-weight:700; color:var(--primary);">${Math.round(g.totalPoints||0)} pts</div>
      </div>
      <div style="font-size:0.9rem; color:var(--text-secondary); margin-bottom:12px;">${g.members?g.members.length+' participants':''}</div>
      <div class="team-card-section">
        <div>
          <div style="font-size:0.9rem; color:var(--text-secondary); margin-bottom:6px;">Top 5</div>
          ${top5.map(m=> smallPersonCard(m)).join('')}
        </div>
        <div>
          <div style="font-size:0.9rem; color:var(--text-secondary); margin-bottom:6px;">Bottom 5</div>
          ${bottom5.map(m=> smallPersonCard(m)).join('')}
        </div>
      </div>
    </div>
  `;
}

function smallPersonCard(p){
  const initials = (p.nom||'').split(' ').map(s=>s[0]).join('').toUpperCase().slice(0,2) || '—';
  return `
    <div style="display:flex; align-items:center; gap:10px; padding:8px 0;">
      <div class="avatar" style="width:40px; height:40px; font-size:1rem;">${initials}</div>
      <div style="flex:1;">
        <div style="font-weight:600;">${p.nom||'—'}</div>
        <div style="font-size:0.8rem; color:var(--text-secondary);">${p.matricule||''} • ${p.fonction||''}</div>
      </div>
    </div>
  `;
}

function groupByRattachement(items){
  const groups = {};
  items.forEach(item => {
    const rattachement = item.rattachement || item.rattachement || 'Sans rattachement';
    if (!groups[rattachement]) {
      groups[rattachement] = {
        name: rattachement,
        rattachement,
        totalPoints: 0,
        members: []
      };
    }
    groups[rattachement].members.push(item);
    groups[rattachement].totalPoints += Number(item.totalPoints || item.totalPoints || 0);
  });
  return Object.values(groups);
}

function showGroupModal(name){
  const g = (window.collectiveCache || []).find(x=>x.name===name);
  if(!g) return;
  const modal = document.getElementById('modal');
  const body = document.getElementById('modalBody');
  body.innerHTML = `
    <h2>${g.name}</h2>
    <p class="subtitle">${g.rattachement||''} • ${g.members?g.members.length+' membres':''}</p>
    <div style="margin-top:12px;">${g.members? g.members.map(m=> `<div style="padding:6px 0;">${m.nom} — ${Math.round(m.totalPoints||0)} pts</div>`).join('') : ''}</div>
  `;
  modal.style.display = 'flex';
}

function closeModal(){ document.getElementById('modal').style.display = 'none'; }

function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });
