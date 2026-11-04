import { apiClient } from './apiClient';
import { ENV } from '../config/env.config';

export class TripService {
    /**
     * Lấy thông tin chi tiết chuyến đi theo mã (GET /trips/{code})
     * @param {string} code Mã chuyến xe
     */
    async getTripByCode(code) {
        return apiClient.get(`/trips/${code}`);
    }

    /**
     * Lấy URL kết nối SSE thời gian thực cho chuyến đi
     * @param {string} code Mã chuyến xe
     */
    getSseUrl(code) {
        const baseUrl = (ENV.API_BASE_URL || 'http://localhost:8080/api/v1').replace(/\/+$/, '');
        return `${baseUrl}/trips/${code}/sse`;
    }
}

export const tripService = new TripService();


