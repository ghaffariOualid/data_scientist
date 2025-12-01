// Configuration de l'API
export const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production'
    ? 'https://your-api-domain.com'
    : 'http://localhost:8000',

  ENDPOINTS: {
    UPLOAD: '/data/upload',
    ANALYZE: '/analysis/analyze',
    VISUALIZE: '/analysis/visualize',
    DATA_INFO: '/data/info',
    DATA_CLEAR: '/data/clear',
    HEALTH: '/health',
  },

  TIMEOUT: 30000, // 30 secondes
};

// Fonction pour construire l'URL complète
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};



