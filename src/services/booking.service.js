import { apiClient } from './apiClient';

export class BookingService {
    /**
     * Tạo đơn đặt xe mới (POST /bookings)
     */
    async createBooking(payload) {
        return apiClient.post('/bookings', payload);
    }

    /**
     * Lấy thông tin chuyến đi theo mã chuyến (GET /trips/{code})
     */
    async getTripByCode(code) {
        return apiClient.get(`/trips/${code}`);
    }

    /**
     * Lấy thông tin chuyến đi (legacy alias)
     */
    async getBookingByCode(code) {
        return apiClient.get(`/trips/${code}`);
    }
}

export const bookingService = new BookingService();
