import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError, AxiosInstance } from 'axios';

// Extend AxiosInstance type to include our custom properties
declare module 'axios' {
  interface AxiosInstance {
    dashboard: {
      getStats: () => Promise<AxiosResponse>;
      getVulnerabilityTrends: () => Promise<AxiosResponse>;
      getRecentScans: () => Promise<AxiosResponse>;
      getTopVulnerableAssets: () => Promise<AxiosResponse>;
    };
  }
}

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If not on login page, redirect to login
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (email: string, password: string) => {
    return api.post('/auth/login', { email, password });
  },
  register: (name: string, email: string, password: string) => {
    return api.post('/auth/register', { name, email, password });
  },
  logout: () => {
    localStorage.removeItem('token');
    return api.post('/auth/logout');
  },
  getCurrentUser: () => {
    return api.get('/auth/me');
  },
  changePassword: (currentPassword: string, newPassword: string) => {
    return api.post('/auth/change-password', { currentPassword, newPassword });
  },
};

// Dashboard services
export const dashboardService = {
  getStats: () => {
    return api.get('/dashboard/stats');
  },
  getVulnerabilityTrends: () => {
    return api.get('/dashboard/vulnerability-trends');
  },
  getRecentScans: () => {
    return api.get('/dashboard/recent-scans');
  },
  getTopVulnerableAssets: () => {
    return api.get('/dashboard/top-vulnerable-assets');
  },
};

// Settings services
export const settingsService = {
  getSettings: () => {
    return api.get('/settings');
  },
  updateSettings: (settings: any) => {
    return api.put('/settings', settings);
  },
};

// API key services
export const apiKeyService = {
  getApiKeys: () => {
    return api.get('/api-keys');
  },
  createApiKey: (name: string, expiresInDays: number = 365) => {
    return api.post('/api-keys', { name, expiresInDays });
  },
  deleteApiKey: (id: number) => {
    return api.delete(`/api-keys/${id}`);
  },
};

// Asset services
export const assetService = {
  getAssets: (params: any = {}) => {
    return api.get('/assets', { params });
  },
  getAssetById: (id: number) => {
    return api.get(`/assets/${id}`);
  },
  createAsset: (asset: any) => {
    return api.post('/assets', asset);
  },
  updateAsset: (id: number, asset: any) => {
    return api.put(`/assets/${id}`, asset);
  },
  deleteAsset: (id: number) => {
    return api.delete(`/assets/${id}`);
  },
};

// Vulnerability services
export const vulnerabilityService = {
  getVulnerabilities: (params: any = {}) => {
    return api.get('/vulnerabilities', { params });
  },
  getVulnerabilityById: (id: number) => {
    return api.get(`/vulnerabilities/${id}`);
  },
  createVulnerability: (vulnerability: any) => {
    return api.post('/vulnerabilities', vulnerability);
  },
  updateVulnerability: (id: number, vulnerability: any) => {
    return api.put(`/vulnerabilities/${id}`, vulnerability);
  },
  deleteVulnerability: (id: number) => {
    return api.delete(`/vulnerabilities/${id}`);
  },
};

// Scan services
export const scanService = {
  getScans: (params: any = {}) => {
    return api.get('/scans', { params });
  },
  getScanById: (id: number) => {
    return api.get(`/scans/${id}`);
  },
  startScan: (scanData: any) => {
    return api.post('/scans', scanData);
  },
  cancelScan: (id: number) => {
    return api.post(`/scans/${id}/cancel`);
  },
  deleteScan: (id: number) => {
    return api.delete(`/scans/${id}`);
  },
};

// Report services
export const reportService = {
  getReports: (params: any = {}) => {
    return api.get('/reports', { params });
  },
  getReportById: (id: number) => {
    return api.get(`/reports/${id}`);
  },
  generateReport: (reportData: any) => {
    return api.post('/reports', reportData);
  },
  deleteReport: (id: number) => {
    return api.delete(`/reports/${id}`);
  },
  downloadReport: (id: number) => {
    return api.get(`/reports/${id}/download`, { responseType: 'blob' });
  },
};

// Add dashboard property to the default export
api.dashboard = dashboardService;

export default api; 