// Configuration de l'API
// Determine the API URL at runtime
// const getApiUrl = (): string => {
//   // In development, always use localhost
//   if (import.meta.env.MODE === 'development') {
//     return 'http://localhost:8001';
//   }
//   // In production (Docker), use the injected value or fallback
//   if (typeof window !== 'undefined') {
//     // Try to read from script tag data attribute (injected by entrypoint.sh)
//     const scripts = document.querySelectorAll('script[data-api-url]');
//     if (scripts.length > 0) {
//       return scripts[0].getAttribute('data-api-url') || 'http://localhost:8001';
//     }
//   }
//   return 'http://localhost:8001';
// };

const getApiUrl = (): string => {
  // Utilise la variable injectée par Docker/Vite, sinon repli sur localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:8001';
};

export const API_CONFIG = {
  BASE_URL: getApiUrl(),

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



