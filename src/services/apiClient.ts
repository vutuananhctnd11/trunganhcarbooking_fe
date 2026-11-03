import { ENV } from '../config/env.config';

export class ApiException extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number = 500, data: any = null) {
    super(message);
    this.name = 'ApiException';
    this.status = status;
    this.data = data;
  }
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = ENV.API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('tac_driver_token');
  }

  private buildHeaders(customHeaders?: HeadersInit): Headers {
    const headers = new Headers({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...customHeaders,
    });

    const token = this.getAuthToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${this.baseUrl}${cleanEndpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  async get<T>(endpoint: string, params?: Record<string, any>, options?: RequestInit): Promise<T> {
    const url = this.buildUrl(endpoint, params);
    const headers = this.buildHeaders(options?.headers);

    const response = await fetch(url, {
      ...options,
      method: 'GET',
      headers,
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    const url = this.buildUrl(endpoint);
    const headers = this.buildHeaders(options?.headers);

    const response = await fetch(url, {
      ...options,
      method: 'POST',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    const url = this.buildUrl(endpoint);
    const headers = this.buildHeaders(options?.headers);

    const response = await fetch(url, {
      ...options,
      method: 'PUT',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = this.buildUrl(endpoint);
    const headers = this.buildHeaders(options?.headers);

    const response = await fetch(url, {
      ...options,
      method: 'DELETE',
      headers,
    });

    return this.handleResponse<T>(response);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    let data: any = null;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      try {
        data = await response.text();
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      const errorMessage =
        (data && typeof data === 'object' && (data.message || data.error)) ||
        `Lỗi gọi API: HTTP ${response.status} (${response.statusText})`;

      throw new ApiException(errorMessage, response.status, data);
    }

    return data as T;
  }
}

// Singleton API client dùng chung
export const apiClient = new ApiClient();
