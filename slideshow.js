// slideshow.js
// Load both views and alternate every 2 minutes (120000 ms)
const SLIDE_INTERVAL_MS = 120000;
let currentSlide = 0; // 0 = individual, 1 = collective

let teamScrollIntervalId = null;

function showSlide(idx){
  const ind = document.getElementById('slide-individual');
  const col = document.getElementById('slide-collective');
  if(!ind || !col) return;
  if(idx === 0){
    ind.style.display = 'block';
    col.style.display = 'none';
    stopTeamAutoScroll();
  } else {
    ind.style.display = 'none';
    col.style.display = 'block';
    startTeamAutoScroll();
  }
  currentSlide = idx;
}

function startTeamAutoScroll(){
  const wrapper = document.getElementById('teamsWrapper');
  if(!wrapper) return;
  stopTeamAutoScroll();
  wrapper.scrollTop = 0;
  teamScrollIntervalId = setInterval(() => {
    if (wrapper.scrollHeight <= wrapper.clientHeight) return;
    wrapper.scrollTop += 1;
    if (wrapper.scrollTop + wrapper.clientHeight >= wrapper.scrollHeight - 1) {
      wrapper.scrollTop = 0;
    }
  }, 50);
}

function stopTeamAutoScroll(){
  if(teamScrollIntervalId){
    clearInterval(teamScrollIntervalId);
    teamScrollIntervalId = null;
  }
}

async function initSlideshow(){
  // Load data into the designated containers
  try{
    if(typeof loadIndividualsInto === 'function') await loadIndividualsInto('individualSlide');
    if(typeof loadCollectiveInto === 'function') await loadCollectiveInto('collectiveSlide');
  }catch(e){ console.warn('Erreur initialisation slides', e); }

  // start visible
  showSlide(0);

  // rotate
  setInterval(()=>{
    showSlide(currentSlide === 0 ? 1 : 0);
  }, SLIDE_INTERVAL_MS);
}

document.addEventListener('DOMContentLoaded', initSlideshow);

// expose for debugging
window.showSlide = showSlide;
