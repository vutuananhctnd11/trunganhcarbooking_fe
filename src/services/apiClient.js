import { ENV } from '../config/env.config';
export class ApiException extends Error {
    constructor(message, status = 500, data = null) {
        super(message);
        this.name = 'ApiException';
        this.status = status;
        this.data = data;
    }
}
export class ApiClient {
    constructor(baseUrl = ENV.API_BASE_URL) {
        this.baseUrl = baseUrl.replace(/\/+$/, '');
    }
    getAuthToken() {
        if (typeof window === 'undefined')
            return null;
        return (
            localStorage.getItem('tac_driver_token') ||
            localStorage.getItem('accessToken') ||
            localStorage.getItem('driverToken') ||
            localStorage.getItem('token') ||
            null
        );
    }
    buildHeaders(customHeaders) {
        const headers = new Headers({
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...customHeaders,
        });
        const token = this.getAuthToken();
        if (token) {
            if (!headers.has('Authorization')) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            if (!headers.has('accessToken')) {
                headers.set('accessToken', token);
            }
            if (!headers.has('token')) {
                headers.set('token', token);
            }
        }
        return headers;
    }
    buildUrl(endpoint, params) {
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
    async get(endpoint, params, options) {
        const url = this.buildUrl(endpoint, params);
        const headers = this.buildHeaders(options?.headers);
        const response = await fetch(url, {
            ...options,
            method: 'GET',
            headers,
        });
        return this.handleResponse(response);
    }
    async post(endpoint, body, options) {
        const url = this.buildUrl(endpoint);
        const headers = this.buildHeaders(options?.headers);
        const response = await fetch(url, {
            ...options,
            method: 'POST',
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        return this.handleResponse(response);
    }
    async put(endpoint, body, options) {
        const url = this.buildUrl(endpoint);
        const headers = this.buildHeaders(options?.headers);
        const response = await fetch(url, {
            ...options,
            method: 'PUT',
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        return this.handleResponse(response);
    }
    async delete(endpoint, options) {
        const url = this.buildUrl(endpoint);
        const headers = this.buildHeaders(options?.headers);
        const response = await fetch(url, {
            ...options,
            method: 'DELETE',
            headers,
        });
        return this.handleResponse(response);
    }
    async handleResponse(response) {
        let data = null;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try {
                data = await response.json();
            }
            catch {
                data = null;
            }
        }
        else {
            try {
                data = await response.text();
            }
            catch {
                data = null;
            }
        }
        if (!response.ok) {
            const errorMessage = (data && typeof data === 'object' && (data.message || data.error)) ||
                `Lỗi gọi API: HTTP ${response.status} (${response.statusText})`;
            throw new ApiException(errorMessage, response.status, data);
        }
        return data;
    }
}
// Singleton API client dùng chung
export const apiClient = new ApiClient();
