import { apiClient } from './apiClient';
export class BookingService {
    /**
     * Tạo đơn đặt xe mới (POST /bookings)
     */
    async createBooking(payload) {
        return apiClient.post('/bookings', payload);
    }
    /**
     * Lấy thông tin chuyến đi theo mã chuyến (GET /bookings/{code})
     */
    async getBookingByCode(code) {
        return apiClient.get(`/bookings/${code}`);
    }
}
export const bookingService = new BookingService();
