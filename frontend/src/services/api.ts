// Service pour communiquer avec l'API FastAPI
import { API_CONFIG, buildApiUrl } from '@/config/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface UploadResponse {
  message: string;
  filename: string;
  rows: number;
  columns: string[];
  preview: any[];
}

export interface AnalysisResponse {
  query: string;
  analysis: string;
  status: string;
}

export interface VisualizationResponse {
  prompt: string;
  visualization: any;
  status: string;
}

export class ApiService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(buildApiUrl(endpoint), {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API Error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async uploadFile(file: File): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.UPLOAD), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Upload Error:', error);
      return { error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }

  static async analyzeData(query: string): Promise<ApiResponse<AnalysisResponse>> {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ANALYZE), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Analysis Error:', error);
      return { error: error instanceof Error ? error.message : 'Analysis failed' };
    }
  }

  static async createVisualization(prompt: string): Promise<ApiResponse<VisualizationResponse>> {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.VISUALIZE), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Visualization Error:', error);
      return { error: error instanceof Error ? error.message : 'Visualization failed' };
    }
  }

  static async getDataInfo(): Promise<ApiResponse<any>> {
    return this.request(API_CONFIG.ENDPOINTS.DATA_INFO);
  }

  static async clearData(): Promise<ApiResponse<any>> {
    return this.request(API_CONFIG.ENDPOINTS.DATA_CLEAR, { method: 'DELETE' });
  }
}
