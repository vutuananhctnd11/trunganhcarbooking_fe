import { apiClient } from './apiClient';

export const DEFAULT_PROMOTION_TRIPS = [
    {
        id: 1,
        badgeText: 'ĐẶT NHIỀU NHẤT',
        title: 'Đưa Đón Sân Bay Nội Bài',
        slug: 'dua-don-san-bay-noi-bai',
        description: 'Chuyến bay kịp giờ, khoang cốp rộng chứa 3-4 vali lớn',
        price: 250000,
        priceUnit: '/ Trọn gói từ nội thành',
        extraKmPrice: 11900,
        extraKmNote: '11.900 đ/km cự ly xa',
        waitingFeeNote: 'Miễn phí chờ khi delay',
        features: [
            'Theo dõi giờ hạ cánh qua số hiệu chuyến bay',
            'Tài xế chủ động đến sớm 10 phút hỗ trợ hành lý',
            'Miễn phí chờ đợi khi chuyến bay bị delay',
            'Đón trả chuẩn sảnh ga T1 (Quốc nội) & T2 (Quốc tế)',
        ],
        buttonText: 'Chọn gói cước này',
        displayOrder: 1,
        isFeatured: true,
        isActive: true,
        pickupAddress: 'Số 1 Tràng Tiền, Hoàn Kiếm, Hà Nội',
        dropoffAddress: 'Sân bay Quốc tế Nội Bài, Phú Cường, Sóc Sơn, Hà Nội',
        travelTime: 45,
        pickupLng: 105.8576,
        pickupLat: 21.0254,
        dropoffLng: 105.8072,
        dropoffLat: 21.2212,
        distanceKm: 28.5,
    },
    {
        id: 2,
        badgeText: 'TIẾT KIỆM',
        title: 'Di Chuyển Nội Thành & Ngắn',
        slug: 'di-chuyen-noi-thanh',
        description: 'Lộ trình ngắn, đi làm, gặp đối tác, đi chơi gia đình',
        price: 30500,
        priceUnit: '/ 2 km đầu tiên',
        extraKmPrice: 14700,
        extraKmNote: '14.700 đ/km (km 3-12), 13.800 đ/km (km 13-25)',
        waitingFeeNote: 'Miễn phí 30 phút đầu, 30.000 đ/giờ tiếp theo',
        features: [
            'Giá mở cửa (2 km đầu tiên): 30.500 VNĐ',
            'Từ km 3 đến km 12: 14.700 VNĐ/km',
            'Từ km 13 đến km 25: 13.800 VNĐ/km',
            'Từ km 26 trở đi: chỉ 11.900 VNĐ/km',
        ],
        buttonText: 'Chọn gói cước này',
        displayOrder: 2,
        isFeatured: false,
        isActive: true,
        pickupAddress: 'Hồ Hoàn Kiếm, Hoàn Kiếm, Hà Nội',
        dropoffAddress: 'Vincom Center Bà Triệu, Hai Bà Trưng, Hà Nội',
        travelTime: 15,
        pickupLng: 105.8524,
        pickupLat: 21.0287,
        dropoffLng: 105.8497,
        dropoffLat: 21.0113,
        distanceKm: 2.5,
    },
    {
        id: 3,
        badgeText: 'ƯU ĐÃI 35%',
        title: 'Đường Dài & Đi 2 Chiều',
        slug: 'duong-dai-di-2-chieu',
        description: 'Đi tỉnh 1 chiều hoặc 2 chiều trong ngày / qua đêm',
        price: 11900,
        priceUnit: '/ km (từ km 26 trở đi)',
        extraKmPrice: 11900,
        extraKmNote: 'Chiều về chỉ tính 65% chiều đi',
        waitingFeeNote: 'Thỏa thuận theo tour & lộ trình',
        features: [
            'Đi 2 chiều: Chiều về chỉ tính 65% giá chiều đi',
            'Tự động nhân đôi quãng đường và thời gian',
            'Nghỉ ngơi, ngả lưng êm dịu không rung lắc',
            'Bao trọn phí cầu đường theo thỏa thuận',
        ],
        buttonText: 'Chọn gói cước này',
        displayOrder: 3,
        isFeatured: false,
        isActive: true,
        pickupAddress: 'Hà Nội, Việt Nam',
        dropoffAddress: 'Thành phố Ninh Bình, Ninh Bình',
        travelTime: 120,
        pickupLng: 105.8524,
        pickupLat: 21.0287,
        dropoffLng: 105.9745,
        dropoffLat: 20.2506,
        distanceKm: 95.0,
    },
];

export class PromotionTripService {
    /**
     * Gọi API lấy danh sách các gói cước / chuyến ưu đãi (GET /promotion-trips)
     */
    async getPromotionTrips(params = { isActive: true, page: 0, size: 5 }) {
        const data = await apiClient.get('/promotion-trips', params);
        let list = [];
        if (Array.isArray(data)) {
            list = data;
        } else if (Array.isArray(data?.data?.content)) {
            list = data.data.content;
        } else if (Array.isArray(data?.data)) {
            list = data.data;
        } else if (Array.isArray(data?.content)) {
            list = data.content;
        }
        return list;
    }

    /**
     * Lấy danh sách có fallback an toàn nếu backend chưa sẵn sàng
     */
    async getPromotionTripsWithFallback() {
        try {
            const list = await this.getPromotionTrips();
            if (list && list.length > 0) {
                return list;
            }
            return DEFAULT_PROMOTION_TRIPS;
        } catch (err) {
            console.warn('Backend API /promotion-trips không khả dụng, sử dụng bảng giá mặc định:', err);
            return DEFAULT_PROMOTION_TRIPS;
        }
    }
}

export const promotionTripService = new PromotionTripService();
