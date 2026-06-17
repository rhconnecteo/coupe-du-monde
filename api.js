// api.js
class TopPerformersAPI {
  constructor() {
    this.baseUrl = CONFIG.API_URL;
  }

  async getTopPerformers(limit = 10) {
    try {
      const url = `${this.baseUrl}?action=getTopPerformers&limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des top performers:', error);
      throw error;
    }
  }

  async getCollectiveData() {
    try {
      const url = `${this.baseUrl}?action=getCollectiveData`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données collectives:', error);
      throw error;
    }
  }

  async getIndividualData() {
    try {
      const url = `${this.baseUrl}?action=getIndividualData`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données individuelles:', error);
      throw error;
    }
  }

  async getQuickGameData() {
    try {
      const url = `${this.baseUrl}?action=getQuickGameData`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données Jeu Rapide:', error);
      throw error;
    }
  }

  async getTopPoleData() {
    try {
      const url = `${this.baseUrl}?action=getTopPoleData`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données Top Pôle:', error);
      throw error;
    }
  }
}

// Créer une instance unique
const api = new TopPerformersAPI();