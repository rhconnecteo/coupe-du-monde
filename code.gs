// Code.gs
const SPREADSHEET_ID = '1OeJKig5Xm23941rpUKUsy62xEf_bqXV7KFusFg8PmsM';

function doGet(e) {
  const action = e.parameter.action || '';
  
  try {
    switch(action) {
      case 'getTopPerformers':
        const limit = parseInt(e.parameter.limit) || 10;
        return ContentService
          .createTextOutput(JSON.stringify(getTopPerformers(limit)))
          .setMimeType(ContentService.MimeType.JSON);
      
      case 'getCollectiveData':
        return ContentService
          .createTextOutput(JSON.stringify(getCollectiveData()))
          .setMimeType(ContentService.MimeType.JSON);
      
      case 'getCollectiveGroups':
        return ContentService
          .createTextOutput(JSON.stringify(getCollectiveGroups()))
          .setMimeType(ContentService.MimeType.JSON);
      
      case 'getIndividualData':
        return ContentService
          .createTextOutput(JSON.stringify(getIndividualData()))
          .setMimeType(ContentService.MimeType.JSON);
      
      case 'getQuickGameData':
        return ContentService
          .createTextOutput(JSON.stringify(getQuickGameData()))
          .setMimeType(ContentService.MimeType.JSON);
      
      case 'getTopPoleData':
        return ContentService
          .createTextOutput(JSON.stringify(getTopPoleData()))
          .setMimeType(ContentService.MimeType.JSON);
      
      default:
        return ContentService
          .createTextOutput(JSON.stringify({ error: 'Action non reconnue' }))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getCollectiveData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('collectif');
    
    if (!sheet) {
      throw new Error('Feuille "collectif" non trouvée');
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0] || [];
    const rows = data.slice(1);
    
    const matriculeIndex = getHeaderIndex(headers, ['Matricule', 'matricule']);
    const nomIndex = getHeaderIndex(headers, ['Nom et prénom', 'Nom et Prénom', 'Nom', 'nom']);
    const fonctionIndex = getHeaderIndex(headers, ['Fonction', 'fonction']);
    const rattachementIndex = getHeaderIndex(headers, ['Pôles', 'Pôle', 'Pole', 'pole', 'Rattachement', 'Rattachement']);
    const footIndex = getHeaderIndex(headers, ['Point Foot', 'Foot', 'Points foot', 'Point foot', 'Foot points']);
    const babyIndex = getHeaderIndex(headers, ['Point baby-foot', 'Baby-foot', 'Baby foot', 'Babyfoot', 'Point baby foot']);
    const dressIndex = getHeaderIndex(headers, ['Dress code de la finale', 'Dress code', 'Dresscode']);
    const tirIndex = getHeaderIndex(headers, ['Final Tir au but', 'Tir au but', 'Tir au But', 'Tir au but']);
    const totalIndex = getHeaderIndex(headers, ['Total', 'Total General', 'Total Général', 'Total général', 'Total de point']);
    const totalGeneralIndex = getHeaderIndex(headers, ['Total General', 'Total Général', 'Total général', 'Total général']);

    return rows.map(row => {
      const footPoints = parseNumber(row[footIndex]);
      const babyFootPoints = parseNumber(row[babyIndex]);
      const dressCodePoints = parseNumber(row[dressIndex]);
      const tirAuBut = parseNumber(row[tirIndex]);
      const total = parseNumber(row[totalIndex]);
      const totalGeneral = parseNumber(row[totalGeneralIndex]);
      const computedTotal = footPoints + babyFootPoints + dressCodePoints;

      return {
        matricule: row[matriculeIndex] || '',
        nom: row[nomIndex] || '',
        fonction: row[fonctionIndex] || '',
        rattachement: row[rattachementIndex] || '',
        footPoints: footPoints,
        babyFootPoints: babyFootPoints,
        dressCodePoints: dressCodePoints,
        tirAuBut: tirAuBut,
        total: total || computedTotal,
        totalGeneral: totalGeneral || total || computedTotal
      };
    }).filter(item => item.matricule || item.nom || item.rattachement)
      .sort((a, b) => (b.totalGeneral || b.total || 0) - (a.totalGeneral || a.total || 0));
      
  } catch (error) {
    console.error('Erreur collectif:', error);
    throw new Error('Erreur lors de la récupération des données collectives: ' + error.message);
  }
}

function getIndividualData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('individuel');
    
    if (!sheet) {
      throw new Error('Feuille "individuel" non trouvée');
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0] || [];
    const rows = data.slice(1);
    
    const matriculeIndex = getHeaderIndex(headers, ['Matricule', 'matricule']);
    const nomIndex = getHeaderIndex(headers, ['Nom et Prénom', 'Nom et prénom', 'Nom et prénoms', 'Nom', 'nom']);
    const fonctionIndex = getHeaderIndex(headers, ['Fonction', 'fonction']);
    const rattachementIndex = getHeaderIndex(headers, ['Rattachement', 'Pôles', 'Pôle', 'Pole', 'pole']);
    const pointIndex = getHeaderIndex(headers, ['Point', 'Points', 'point']);
    const parisIndex = getHeaderIndex(headers, ['Paris', 'Parie', 'pronostic', 'Pronostic']);
    const quizzIndex = getHeaderIndex(headers, ['Quiz', 'Quizz', 'Point Quizz', 'point quizz', 'point quiz']);
    const totalPointIndex = getHeaderIndex(headers, ['Total de point', 'Total de points', 'Total', 'Score']);
    const semaineIndex = getHeaderIndex(headers, ['Semaine', 'semaine']);
    
    const peopleMap = new Map();
    
    rows.forEach(row => {
      const matricule = row[matriculeIndex] || '';
      if (!matricule) return;
      
      if (!peopleMap.has(matricule)) {
        peopleMap.set(matricule, {
          matricule: matricule,
          nom: row[nomIndex] || '',
          fonction: row[fonctionIndex] || '',
          rattachement: row[rattachementIndex] || '',
          poles: row[rattachementIndex] || '',
          totalPoint: 0,
          totalParis: 0,
          totalQuizz: 0,
          totalPoints: 0,
          semaines: []
        });
      }
      
      const person = peopleMap.get(matricule);
      const points = parseNumber(row[pointIndex]);
      const paris = parseNumber(row[parisIndex]);
      const quizz = parseNumber(row[quizzIndex]);
      const total = parseNumber(row[totalPointIndex]);

      person.totalPoint += points;
      person.totalParis += paris;
      person.totalQuizz += quizz;
      person.totalPoints += total;
      
      if (row[semaineIndex]) {
        person.semaines.push({
          semaine: row[semaineIndex],
          point: points,
          paris: paris,
          quizz: quizz,
          total: total
        });
      }
    });
    
    return Array.from(peopleMap.values())
      .filter(person => person.totalPoints > 0 || person.totalPoint > 0 || person.totalParis > 0 || person.totalQuizz > 0)
      .sort((a, b) => b.totalPoints - a.totalPoints);
      
  } catch (error) {
    console.error('Erreur individuel:', error);
    throw new Error('Erreur lors de la récupération des données individuelles: ' + error.message);
  }
}

function getQuickGameData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = findSheetByName(ss, ['Jeu Rapide', 'JeuRapide', 'Jeu rapide', 'Jeu_Rapide']);
    if (!sheet) {
      throw new Error('Feuille "Jeu Rapide" non trouvée');
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    const matriculeIndex = getHeaderIndex(headers, ['Matricule', 'matricule']);
    const nomIndex = getHeaderIndex(headers, ['Nom et prénoms', 'Nom et Prénom', 'Nom', 'nom']);
    const poleIndex = getHeaderIndex(headers, ['Pôles', 'Pôles', 'Pole', 'pole', 'Pôles']);
    const semaineIndex = getHeaderIndex(headers, ['Semaine', 'semaine']);
    const pointIndex = getHeaderIndex(headers, ['Point', 'Points', 'Total', 'Score']);

    return rows.map(row => ({
      matricule: row[matriculeIndex] || '',
      nom: row[nomIndex] || '',
      poles: row[poleIndex] || '',
      semaine: row[semaineIndex] || '',
      points: parseNumber(row[pointIndex])
    })).filter(item => item.matricule || item.nom);
  } catch (error) {
    console.error('Erreur Jeu Rapide:', error);
    throw new Error('Erreur lors de la récupération des données Jeu Rapide: ' + error.message);
  }
}

function getTopPoleData() {
  try {
    const individual = getIndividualData();
    const groups = {};

    individual.forEach(item => {
      const pole = String(item.pole || item.rattachement || 'Non renseigné');
      const value = item.totalPoints || (parseNumber(item.totalPoint) + parseNumber(item.totalParis) + parseNumber(item.totalQuizz));
      groups[pole] = groups[pole] || { pole: pole, totalPoints: 0 };
      groups[pole].totalPoints += value;
    });

    return Object.values(groups)
      .sort((a, b) => b.totalPoints - a.totalPoints);
  } catch (error) {
    console.error('Erreur Top Pôle:', error);
    throw new Error('Erreur lors de la récupération des données Top Pôle: ' + error.message);
  }
}

function findSheetByName(ss, names) {
  const lowerNames = names.map(name => String(name || '').toLowerCase());
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    const title = sheets[i].getName().toLowerCase();
    for (let j = 0; j < lowerNames.length; j++) {
      if (title === lowerNames[j] || title.indexOf(lowerNames[j]) !== -1) {
        return sheets[i];
      }
    }
  }
  return null;
}

function getHeaderIndex(headers, names) {
  const lowerHeaders = headers.map(h => String(h || '').toLowerCase().trim());
  for (let i = 0; i < names.length; i++) {
    const target = String(names[i] || '').toLowerCase().trim();
    const exact = lowerHeaders.indexOf(target);
    if (exact !== -1) {
      return exact;
    }
  }
  for (let i = 0; i < names.length; i++) {
    const target = String(names[i] || '').toLowerCase().trim();
    const found = lowerHeaders.findIndex(h => h.indexOf(target) !== -1);
    if (found !== -1) {
      return found;
    }
  }
  return -1;
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const num = parseFloat(String(value).toString().replace(/[^0-9.,-]/g, '').replace(',', '.'));
  return Number.isFinite(num) ? num : 0;
}

function getTopPerformers(limit = 10) {
  try {
    const collective = getCollectiveData();
    const individual = getIndividualData();
    
    const individualMap = new Map();
    individual.forEach(person => {
      individualMap.set(person.matricule, person);
    });
    
    const combined = collective.map(collectivePerson => {
      const individualPerson = individualMap.get(collectivePerson.matricule);
      return {
        ...collectivePerson,
        individualTotal: individualPerson ? individualPerson.totalPoints : 0,
        individualDetails: individualPerson || null,
        combinedTotal: collectivePerson.totalPoints + (individualPerson ? individualPerson.totalPoints : 0)
      };
    });
    
    return combined
      .sort((a, b) => b.combinedTotal - a.combinedTotal)
      .slice(0, limit);
      
  } catch (error) {
    console.error('Erreur top performers:', error);
    throw new Error('Erreur lors de la combinaison des données: ' + error.message);
  }
}