import { apiClient } from './apiClient';
import { driverService } from './driverService';

export class BookingService {
    /**
     * Tạo đơn đặt xe mới (POST /api/v1/bookings - API 1.1)
     */
    async createBooking(payload) {
        return apiClient.post('/bookings', payload);
    }

    /**
     * Lấy thông tin chuyến đi theo mã chuyến (GET /api/v1/trips/{code} - API 2.1)
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

    /**
     * API 1.4: Xem danh sách chuyến sắp tới theo SĐT (Không cần login)
     * GET /api/v1/bookings/upcoming?phone={phone}
     */
    async getUpcomingBookingsByPhone(phone) {
        if (!phone) return [];
        const cleanPhone = String(phone).replace(/\D/g, '');
        if (cleanPhone.length < 8) return [];

        try {
            const apiRes = await apiClient.get('/bookings/upcoming', { phone: cleanPhone });
            const list = Array.isArray(apiRes)
                ? apiRes
                : (apiRes?.data?.content || apiRes?.data || apiRes?.content || []);
            if (Array.isArray(list) && list.length > 0) {
                return list.map((item) => this.normalizeTripData(item));
            }
        } catch (err) {
            console.warn('Backend API 1.4 (/bookings/upcoming) offline or empty:', err);
        }
        return [];
    }

    /**
     * API 1.5: Xem toàn bộ lịch sử chuyến theo SĐT (Không cần login)
     * GET /api/v1/bookings/history?phone={phone}
     */
    async getBookingHistoryByPhone(phone) {
        if (!phone) return [];
        const cleanPhone = String(phone).replace(/\D/g, '');
        if (cleanPhone.length < 8) return [];

        try {
            const apiRes = await apiClient.get('/bookings/history', { phone: cleanPhone });
            const list = Array.isArray(apiRes)
                ? apiRes
                : (apiRes?.data?.content || apiRes?.data || apiRes?.content || []);
            if (Array.isArray(list) && list.length > 0) {
                return list.map((item) => this.normalizeTripData(item));
            }
        } catch (err) {
            console.warn('Backend API 1.5 (/bookings/history) offline or empty:', err);
        }
        return [];
    }

    /**
     * Tra cứu danh sách chuyến xe đã đặt theo số điện thoại (Tích hợp API 1.4 & API 1.5 kèm Fallback)
     * @param {string} phone Số điện thoại cần tra cứu
     * @param {'UPCOMING' | 'HISTORY' | 'ALL'} filterType Bộ lọc chuyến sắp tới hay toàn bộ lịch sử
     */
    async getBookingsByPhone(phone, filterType = 'UPCOMING') {
        if (!phone) return [];
        const cleanPhone = String(phone).replace(/\D/g, '');
        if (cleanPhone.length < 8) return [];

        let trips = [];

        // 1. Gọi API 1.4 (/bookings/upcoming) hoặc API 1.5 (/bookings/history)
        if (filterType === 'UPCOMING') {
            trips = await this.getUpcomingBookingsByPhone(cleanPhone);
        } else if (filterType === 'HISTORY') {
            trips = await this.getBookingHistoryByPhone(cleanPhone);
        } else {
            // ALL: Thử cả upcoming và history
            const [upcoming, history] = await Promise.all([
                this.getUpcomingBookingsByPhone(cleanPhone),
                this.getBookingHistoryByPhone(cleanPhone),
            ]);
            const map = new Map();
            [...upcoming, ...history].forEach((t) => map.set(t.tripCode, t));
            trips = Array.from(map.values());
        }

        // 2. Tra cứu thêm trong localStorage (tac_booked_trips lưu trên trình duyệt) nếu danh sách chưa có hoặc backend offline
        try {
            if (typeof window !== 'undefined') {
                const localBooked = JSON.parse(localStorage.getItem('tac_booked_trips') || '[]');
                if (Array.isArray(localBooked)) {
                    localBooked.forEach((item) => {
                        const itemPhone = String(item.customerPhone || item.phone || '').replace(/\D/g, '');
                        if (itemPhone && (itemPhone.includes(cleanPhone) || cleanPhone.includes(itemPhone))) {
                            const code = item.tripCode || item.code;
                            if (!trips.some((t) => t.tripCode === code)) {
                                trips.push(this.normalizeTripData(item));
                            }
                        }
                    });
                }

                // Kiểm tra thêm các session trip_
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    if (key && key.startsWith('trip_')) {
                        try {
                            const raw = JSON.parse(sessionStorage.getItem(key) || '{}');
                            const itemPhone = String(raw.customerPhone || raw.phone || '').replace(/\D/g, '');
                            if (itemPhone && (itemPhone.includes(cleanPhone) || cleanPhone.includes(itemPhone))) {
                                const code = raw.tripCode || raw.code || key.replace('trip_', '');
                                if (!trips.some((t) => t.tripCode === code)) {
                                    trips.push(this.normalizeTripData({ ...raw, tripCode: code }));
                                }
                            }
                        } catch {}
                    }
                }
            }
        } catch {}

        // 3. Fallback danh sách chuyến mẫu nếu vẫn trống để trải nghiệm UI ngay
        if (trips.length === 0) {
            try {
                if (driverService && typeof driverService.getUpcoming30DaysTrips === 'function') {
                    const sampleTrips = driverService.getUpcoming30DaysTrips('1');
                    if (Array.isArray(sampleTrips)) {
                        sampleTrips.forEach((item) => {
                            const itemPhone = String(item.customerPhone || item.phone || '').replace(/\D/g, '');
                            if (itemPhone && (itemPhone.includes(cleanPhone) || cleanPhone.includes(itemPhone))) {
                                const code = item.tripCode || item.code;
                                if (!trips.some((t) => t.tripCode === code)) {
                                    trips.push(this.normalizeTripData(item));
                                }
                            }
                        });
                    }
                }
            } catch {}
        }

        // Lọc theo trạng thái nếu là UPCOMING
        if (filterType === 'UPCOMING') {
            trips = trips.filter((t) => {
                const s = String(t.status || '').toUpperCase();
                return s !== 'COMPLETED' && s !== 'CANCELLED';
            });
        }

        // Sắp xếp các chuyến mới nhất lên đầu
        trips.sort((a, b) => new Date(b.createdAt || b.pickupTime || 0) - new Date(a.createdAt || a.pickupTime || 0));

        return trips;
    }

    normalizeTripData(data) {
        const code = data.tripCode || data.code || data.id || 'TAC-TRIP';
        return {
            id: data.id || code,
            tripCode: code,
            customerName: data.customerName || data.name || 'Quý khách',
            customerPhone: data.customerPhone || data.phone || '',
            pickupAddress: data.pickupAddress || 'Điểm đón theo yêu cầu',
            dropoffAddress: data.dropoffAddress || 'Điểm trả theo yêu cầu',
            pickupDate: data.pickupDate || (data.pickupTime ? data.pickupTime.split('T')[0] : ''),
            pickupTime: data.pickupTime ? (data.pickupTime.includes('T') ? data.pickupTime.split('T')[1].slice(0, 5) : data.pickupTime) : '08:00',
            estimatedPrice: data.estimatedPrice || data.price || 0,
            status: data.status || 'PENDING',
            driverName: data.driver?.name || data.driverName || 'Tài xế Trung Anh',
            driverPhone: data.driver?.phone || data.driverPhone || '0362.882.882',
            carModel: data.carModel || data.driver?.vehicle || 'VinFast Limo Green (VF e34)',
            licensePlate: data.licensePlate || data.driver?.license_plate || '35H - 182.29',
            createdAt: data.createdAt || new Date().toISOString(),
        };
    }
}

export const bookingService = new BookingService();
