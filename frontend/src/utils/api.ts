const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {};
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, val]) => {
      headers[key] = val as string;
    });
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do not set Content-Type if we are uploading FormData (Multer needs boundaries)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const api = {
  get: <T>(endpoint: string, options: RequestInit = {}) =>
    apiRequest<T>(endpoint, { method: 'GET', ...options }),
    
  post: <T>(endpoint: string, body: any, options: RequestInit = {}) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),
    
  put: <T>(endpoint: string, body: any, options: RequestInit = {}) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    }),
    
  patch: <T>(endpoint: string, body: any, options: RequestInit = {}) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...options,
    }),
    
  delete: <T>(endpoint: string, options: RequestInit = {}) =>
    apiRequest<T>(endpoint, { method: 'DELETE', ...options }),
};
export default api;
