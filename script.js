// app.js
let allData = [];
let isShowingAll = false;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
  refreshData();
});

// Récupérer et afficher les données
async function refreshData() {
  showLoading();
  
  try {
    allData = await api.getTopPerformers(100);
    isShowingAll = false;
    updateStats(allData);
    displayLeaderboard(allData.slice(0, 10));
  } catch (error) {
    showError(error.message);
  }
}

// Afficher toutes les données
function showAllData() {
  isShowingAll = !isShowingAll;
  const dataToShow = isShowingAll ? allData : allData.slice(0, 10);
  displayLeaderboard(dataToShow);
  
  const button = document.querySelector('.btn-secondary');
  button.innerHTML = isShowingAll ? 
    '<span class="icon">📋</span> Voir top 10' : 
    '<span class="icon">📊</span> Voir tout';
}

// Mettre à jour les statistiques
function updateStats(data) {
  document.getElementById('totalPeople').textContent = data.length;
  
  const totalPoints = data.reduce((sum, person) => sum + person.combinedTotal, 0);
  const avgPoints = data.length > 0 ? Math.round(totalPoints / data.length) : 0;
  document.getElementById('avgPoints').textContent = avgPoints;
  
  const topScore = data.length > 0 ? Math.round(data[0].combinedTotal) : 0;
  document.getElementById('topScore').textContent = topScore;
}

// Afficher le classement
function displayLeaderboard(data) {
  const container = document.getElementById('leaderboard');
  
  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="loading">
        <div style="font-size: 3rem; margin-bottom: 20px;">📭</div>
        <p>Aucun collaborateur trouvé</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  
  data.forEach((person, index) => {
    const rank = index + 1;
    const rankClass = rank <= 3 ? `rank-${rank}` : '';
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
    
    const initials = person.nom
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    html += `
      <div class="leaderboard-item" onclick="showPersonDetails('${person.matricule}')">
        <div class="rank ${rankClass}">
          ${rank <= 3 ? `<span class="medal">${medal}</span>` : medal}
        </div>
        <div class="avatar">${initials}</div>
        <div class="person-info">
          <div class="person-name">${person.nom}</div>
          <div class="person-details">${person.fonction} • ${person.rattachement}</div>
        </div>
        <div class="points-container">
          <div class="points-group">
            <div class="points-value" style="color: #6C63FF;">${Math.round(person.collectiveTotal || 0)}</div>
            <div class="points-label">Collectif</div>
          </div>
          <div class="points-group">
            <div class="points-value" style="color: #00D4FF;">${Math.round(person.individualTotal || 0)}</div>
            <div class="points-label">Individuel</div>
          </div>
          <div class="points-total">${Math.round(person.combinedTotal)} pts</div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// Filtrer les données
function filterData() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const sortType = document.getElementById('sortSelect').value;
  
  let filteredData = allData.filter(person => 
    person.nom.toLowerCase().includes(searchTerm) ||
    person.fonction.toLowerCase().includes(searchTerm) ||
    person.rattachement.toLowerCase().includes(searchTerm)
  );
  
  // Trier
  filteredData.sort((a, b) => {
    switch(sortType) {
      case 'collective':
        return b.collectiveTotal - a.collectiveTotal;
      case 'individual':
        return b.individualTotal - a.individualTotal;
      default:
        return b.combinedTotal - a.combinedTotal;
    }
  });
  
  const dataToShow = isShowingAll ? filteredData : filteredData.slice(0, 10);
  displayLeaderboard(dataToShow);
  updateStats(filteredData);
}

// Afficher les détails d'une personne
function showPersonDetails(matricule) {
  const person = allData.find(p => p.matricule === matricule);
  if (!person) return;
  
  const modal = document.getElementById('modal');
  const body = document.getElementById('modalBody');
  
  const initials = person.nom
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  let detailsHtml = `
    <div class="modal-person">
      <div class="modal-avatar">${initials}</div>
      <h2>${person.nom}</h2>
      <p class="subtitle">${person.fonction} • ${person.rattachement}</p>
      
      <div class="modal-stats">
        <div class="modal-stat">
          <div class="value" style="color: #6C63FF;">${Math.round(person.collectiveTotal || 0)}</div>
          <div class="label">Points Collectifs</div>
        </div>
        <div class="modal-stat">
          <div class="value" style="color: #00D4FF;">${Math.round(person.individualTotal || 0)}</div>
          <div class="label">Points Individuels</div>
        </div>
        <div class="modal-stat">
          <div class="value" style="color: #FFD700;">${Math.round(person.combinedTotal)}</div>
          <div class="label">Total Combiné</div>
        </div>
      </div>
  `;
  
  // Ajouter les détails individuels si disponibles
  if (person.individualDetails) {
    const details = person.individualDetails;
    detailsHtml += `
      <div style="margin-top: 20px; padding: 15px; background: var(--glass-effect); border-radius: 12px;">
        <h3 style="margin-bottom: 10px;">📊 Détails individuels</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px;">
          <div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Pointages</div>
            <div style="font-size: 1.2rem; font-weight: 600;">${details.totalPointages || 0}</div>
          </div>
          <div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Paries</div>
            <div style="font-size: 1.2rem; font-weight: 600;">${details.totalParies || 0}</div>
          </div>
          <div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Semaines</div>
            <div style="font-size: 1.2rem; font-weight: 600;">${details.semaines ? details.semaines.length : 0}</div>
          </div>
        </div>
      </div>
    `;
  }
  
  detailsHtml += `</div>`;
  body.innerHTML = detailsHtml;
  modal.style.display = 'flex';
}

// Fermer le modal
function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

// Fermer le modal en cliquant à l'extérieur
document.getElementById('modal').addEventListener('click', function(e) {
  if (e.target === this) {
    closeModal();
  }
});

// Afficher le chargement
function showLoading() {
  document.getElementById('leaderboard').innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Chargement des données...</p>
    </div>
  `;
}

// Afficher une erreur
function showError(message) {
  document.getElementById('leaderboard').innerHTML = `
    <div class="loading">
      <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
      <p style="color: var(--accent);">Erreur: ${message}</p>
      <button class="btn btn-primary" onclick="refreshData()" style="margin-top: 20px;">
        Réessayer
      </button>
    </div>
  `;
}

// Keyboard shortcut: Escape pour fermer le modal
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeModal();
  }
});