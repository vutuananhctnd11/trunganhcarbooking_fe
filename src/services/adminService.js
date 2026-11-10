import { ENV } from '../config/env.config';
import { driverService } from './driverService';

/**
 * Service Quản Trị Hệ Thống (Admin Service)
 * Quản lý toàn bộ API CRUD theo tài liệu Postman:
 * - 5. Quản lý tài xế & Phê duyệt (Drivers Management)
 * - 7. Quản lý gói cước chuyến cố định (Promotion Trips)
 * - 8. Quản lý mã giảm giá (Discounts & Vouchers)
 * - 9. Quản lý Banner quảng cáo (Banners)
 * - 1. Tra cứu đơn đặt xe & Lịch sử (Bookings)
 */

const STORAGE_KEYS = {
    ADMIN_DRIVERS: 'tac_admin_drivers_list',
    ADMIN_PROMOTIONS: 'tac_admin_promotions_list',
    ADMIN_DISCOUNTS: 'tac_admin_discounts_list',
    ADMIN_BANNERS: 'tac_admin_banners_list',
};

// Dữ liệu mẫu ban đầu cho Drivers
const DEFAULT_ADMIN_DRIVERS = [
    {
        id: 1,
        fullName: 'Vũ Văn Trung',
        phone: '0362882882',
        experienceYears: 15,
        vehicleModel: 'VinFast Limo Green (VF e34)',
        vehicleColor: '🔴 Đỏ Crimson',
        seatCount: 7,
        licensePlate: '35H - 182.29',
        telegramChatId: '123456789',
        avatarUrl: 'https://res.cloudinary.com/dzueehiwb/image/upload/v1793693693/profile_driver_fcgfb8.png',
        rating: 5.0,
        approvalStatus: 'APPROVED',
        rejectionReason: null,
        isActive: true,
        createdAt: '2026-11-01T08:00:00',
    },
    {
        id: 2,
        fullName: 'Trần Văn Cảnh',
        phone: '0977889900',
        experienceYears: 6,
        vehicleModel: 'VinFast VF 8 Plus',
        vehicleColor: '⚪ Trắng ngọc trai',
        seatCount: 5,
        licensePlate: '30H - 567.89',
        telegramChatId: '987654321',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        rating: 4.9,
        approvalStatus: 'PENDING',
        rejectionReason: null,
        isActive: false,
        createdAt: '2026-11-07T14:30:00',
    },
    {
        id: 3,
        fullName: 'Nguyễn Văn Đạt',
        phone: '0912345678',
        experienceYears: 8,
        vehicleModel: 'VinFast VF 9',
        vehicleColor: '⚫ Đen bóng kim loại',
        seatCount: 7,
        licensePlate: '29A - 999.99',
        telegramChatId: '112233445',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        rating: 4.8,
        approvalStatus: 'APPROVED',
        rejectionReason: null,
        isActive: true,
        createdAt: '2026-11-02T10:00:00',
    },
];

// Dữ liệu mẫu ban đầu cho Promotion Trips
const DEFAULT_ADMIN_PROMOTIONS = [
    {
        id: 1,
        badgeText: 'HOT DEAL 900K',
        title: 'Trực Ninh ⇄ Sân Bay Nội Bài',
        slug: 'truc-ninh-san-bay-noi-bai',
        description: 'Đưa đón tận nhà, trọn gói bao vé cầu đường cao tốc, xe VinFast Limo Green điều hòa êm ái',
        dropoffAddress: 'Sân bay Quốc tế Nội Bài, Phú Cường, Sóc Sơn, Hà Nội',
        travelTime: 120,
        price: 900000,
        priceUnit: '/ Trọn gói 1 chiều',
        extraKmPrice: 10000,
        extraKmNote: '10.000 đ/km cự ly phát sinh',
        waitingFeeNote: 'Miễn phí chờ 45 phút sảnh sân bay',
        features: [
            'Bao trọn vé cầu đường cao tốc Pháp Vân - Cầu Giẽ',
            'Nước suối đóng chai & khăn lạnh miễn phí',
            'Hỗ trợ mang vác hành lý cẩn thận',
            'Cam kết không tăng giá giờ cao điểm',
        ],
        buttonText: 'Đặt chuyến ngay',
        displayOrder: 1,
        isFeatured: true,
        isActive: true,
    },
    {
        id: 2,
        badgeText: 'TIẾT KIỆM 20%',
        title: 'Hà Nội ⇄ Hạ Long Cao Tốc',
        slug: 'ha-noi-ha-long-cao-toc',
        description: 'Xe riêng đưa đón tận nhà, chạy toàn tuyến cao tốc 5B êm ái, dừng nghỉ theo yêu cầu',
        dropoffAddress: 'Cảng Tuần Châu, Bãi Cháy, TP Hạ Long, Quảng Ninh',
        travelTime: 120,
        price: 1200000,
        priceUnit: '/ Trọn gói 1 chiều',
        extraKmPrice: 12000,
        extraKmNote: '12.000 đ/km cự ly phát sinh',
        waitingFeeNote: 'Miễn phí chờ 30 phút',
        features: [
            'Bao trọn vé cầu đường cao tốc',
            'Nước suối và khăn lạnh miễn phí',
            'Dừng nghỉ ăn uống theo yêu cầu của quý khách',
        ],
        buttonText: 'Đặt xe ngay',
        displayOrder: 2,
        isFeatured: true,
        isActive: true,
    },
    {
        id: 3,
        badgeText: 'GIÁ ƯU ĐÃI',
        title: 'Hà Nội ⇄ Tam Chúc - Bái Đính',
        slug: 'ha-noi-tam-chuc-bai-dinh',
        description: 'Chuyến xe du lịch tâm linh đón trả tận nơi, tài xế bản địa thông thạo tuyến điểm',
        dropoffAddress: 'Chùa Tam Chúc, Kim Bảng, Hà Nam',
        travelTime: 75,
        price: 650000,
        priceUnit: '/ Trọn gói 1 chiều',
        extraKmPrice: 10000,
        extraKmNote: '10.000 đ/km cự ly phát sinh',
        waitingFeeNote: 'Miễn phí chờ 60 phút',
        features: [
            'Xe sạch sẽ, không mùi khói thuốc',
            'Lái xe an toàn, lịch thiệp',
            'Hỗ trợ đặt vé thắng cảnh nếu khách cần',
        ],
        buttonText: 'Đặt chuyến ngay',
        displayOrder: 3,
        isFeatured: false,
        isActive: true,
    },
];

// Dữ liệu mẫu ban đầu cho Discounts
const DEFAULT_ADMIN_DISCOUNTS = [
    {
        id: 1,
        code: 'TRUNGANH50K',
        title: 'Khách hàng mới trải nghiệm',
        description: 'Giảm ngay 50.000đ cho đơn đặt xe đầu tiên từ 300.000đ',
        discountType: 'FIXED_AMOUNT',
        discountValue: 50000,
        minTripPrice: 300000,
        usageLimit: 200,
        usedCount: 45,
        startAt: '2026-11-01T00:00:00',
        endAt: '2026-12-31T23:59:59',
        isActive: true,
    },
    {
        id: 2,
        code: 'GIAM100K',
        title: 'Voucher đặc biệt tri ân',
        description: 'Giảm ngay 100.000đ cho chuyến đi xa từ 500.000đ',
        discountType: 'FIXED_AMOUNT',
        discountValue: 100000,
        minTripPrice: 500000,
        usageLimit: 50,
        usedCount: 12,
        startAt: '2026-11-01T00:00:00',
        endAt: '2026-12-31T23:59:59',
        isActive: true,
    },
    {
        id: 3,
        code: 'VIP10',
        title: 'Ưu đãi khách hàng VIP',
        description: 'Giảm 10% tổng cước chuyến đi đường dài',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minTripPrice: 400000,
        usageLimit: 100,
        usedCount: 28,
        startAt: '2026-11-01T00:00:00',
        endAt: '2026-12-31T23:59:59',
        isActive: true,
    },
];

// Dữ liệu mẫu ban đầu cho Banners
const DEFAULT_ADMIN_BANNERS = [
    {
        id: 1,
        title: 'Trực Ninh ⇄ Nội Bài - Chỉ 900K',
        tagline: 'Đặt xe VinFast Limo Green trọn gói 900k/chuyến (Bao trọn xe) • Đón trả tận nơi',
        badge: 'HOT DEAL 900K',
        image: 'https://res.cloudinary.com/dzueehiwb/image/upload/v1793693693/banner_vinfast_limo_red.png',
        alt: 'Đặt xe VinFast Limo Green từ Trực Ninh đến Nội Bài chỉ 900k Trung Anh Car',
        actionText: 'Đặt xe đi sân bay ngay',
        actionUrl: '/#booking-trip-info',
        isGraphicBanner: true,
        displayOrder: 1,
        status: 'ACTIVE',
        startAt: '2026-11-01T00:00:00',
        endAt: '2026-12-31T23:59:59',
    },
    {
        id: 2,
        title: 'Trải Nghiệm Xe Điện VinFast Sang Trọng',
        tagline: 'Êm ái, không mùi xăng xe, trang bị đầy đủ sạc điện thoại và wifi tốc độ cao',
        badge: 'TIỆN NGHI 5 SAO',
        image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
        alt: 'Nội thất sang trọng xe VinFast điện Trung Anh Car',
        actionText: 'Xem bảng giá chi tiết',
        actionUrl: '/#pricing-section',
        isGraphicBanner: false,
        displayOrder: 2,
        status: 'ACTIVE',
        startAt: '2026-11-01T00:00:00',
        endAt: '2026-12-31T23:59:59',
    },
];

class AdminService {
    /**
     * Tạo headers an toàn, tự động đính kèm accessToken vào header (không truyền query param)
     */
    getHeaders(custom = {}) {
        const token = driverService.getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...custom,
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            headers['accessToken'] = token;
        }
        return headers;
    }

    // ==========================================
    // 5. DRIVER MANAGEMENT APIS (CRUD TÀI XẾ & DUYỆT)
    // ==========================================

    async getDrivers(filters = {}) {
        try {
            const params = new URLSearchParams();
            if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
            if (filters.approvalStatus) params.append('approvalStatus', filters.approvalStatus);

            const queryStr = params.toString() ? `?${params.toString()}` : '';
            const res = await fetch(`${ENV.API_BASE_URL}/drivers${queryStr}`, {
                headers: this.getHeaders(),
            });
            if (res.ok) {
                const json = await res.json();
                const list = json?.data || json;
                if (Array.isArray(list)) {
                    localStorage.setItem(STORAGE_KEYS.ADMIN_DRIVERS, JSON.stringify(list));
                    return list;
                }
            }
        } catch (e) {
            console.warn('API /drivers error, fallback to local:', e);
        }
        // Fallback local
        const local = localStorage.getItem(STORAGE_KEYS.ADMIN_DRIVERS);
        let list = local ? JSON.parse(local) : DEFAULT_ADMIN_DRIVERS;
        if (filters.approvalStatus) {
            list = list.filter((d) => d.approvalStatus === filters.approvalStatus);
        }
        return list;
    }

    async getDriverById(id) {
        try {
            const res = await fetch(`${ENV.API_BASE_URL}/drivers/${id}`, {
                headers: this.getHeaders(),
            });
            if (res.ok) {
                const json = await res.json();
                return json?.data || json;
            }
        } catch (e) {
            console.warn(`API /drivers/${id} error:`, e);
        }
        const drivers = await this.getDrivers();
        return drivers.find((d) => String(d.id) === String(id)) || null;
    }

    async createDriver(driverData) {
        try {
            const res = await fetch(`${ENV.API_BASE_URL}/drivers`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(driverData),
            });
            if (res.ok) {
                const json = await res.json();
                const newDriver = json?.data || json;
                await this.refreshLocalDrivers();
                return { success: true, data: newDriver };
            }
        } catch (e) {
            console.warn('Backend createDriver failed, saving local:', e);
        }
        // Fallback local
        const drivers = await this.getDrivers();
        const newD = {
            ...driverData,
            id: Date.now(),
            approvalStatus: driverData.approvalStatus || 'APPROVED',
            rating: driverData.rating || 5.0,
            createdAt: new Date().toISOString(),
        };
        drivers.unshift(newD);
        localStorage.setItem(STORAGE_KEYS.ADMIN_DRIVERS, JSON.stringify(drivers));
        return { success: true, data: newD };
    }

    async updateDriver(id, updateData) {
        try {
            const res = await fetch(`${ENV.API_BASE_URL}/drivers/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(updateData),
            });
            if (res.ok) {
                const json = await res.json();
                await this.refreshLocalDrivers();
                return { success: true, data: json?.data || json };
            }
        } catch (e) {
            console.warn(`Backend updateDriver ${id} failed:`, e);
        }
        // Fallback local
        const drivers = await this.getDrivers();
        const idx = drivers.findIndex((d) => String(d.id) === String(id));
        if (idx !== -1) {
            drivers[idx] = { ...drivers[idx], ...updateData };
            localStorage.setItem(STORAGE_KEYS.ADMIN_DRIVERS, JSON.stringify(drivers));
            return { success: true, data: drivers[idx] };
        }
        return { success: false, message: 'Không tìm thấy tài xế' };
    }

    async deleteDriver(id) {
        try {
            const res = await fetch(`${ENV.API_BASE_URL}/drivers/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });
            if (res.ok) {
                await this.refreshLocalDrivers();
                return { success: true };
            }
        } catch (e) {
            console.warn(`Backend deleteDriver ${id} failed:`, e);
        }
        const drivers = await this.getDrivers();
        const filtered = drivers.filter((d) => String(d.id) !== String(id));
        localStorage.setItem(STORAGE_KEYS.ADMIN_DRIVERS, JSON.stringify(filtered));
        return { success: true };
    }

    async approveDriver(id) {
        try {
            const res = await fetch(`${ENV.API_BASE_URL}/drivers/${id}/approve`, {
                method: 'POST',
                headers: this.getHeaders(),
            });
            if (res.ok) {
                await this.refreshLocalDrivers();
                return { success: true };
            }
        } catch (e) {
            console.warn(`Backend approveDriver ${id} error:`, e);
        }
        return this.updateDriver(id, { approvalStatus: 'APPROVED', isActive: true, approvedAt: new Date().toISOString() });
    }

    async rejectDriver(id, reason = 'Thông tin giấy tờ chưa đầy đủ') {
        try {
            const res = await fetch(`${ENV.API_BASE_URL}/drivers/${id}/reject`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ reason }),
            });
            if (res.ok) {
                await this.refreshLocalDrivers();
                return { success: true };
            }
        } catch (e) {
            console.warn(`Backend rejectDriver ${id} error:`, e);
        }
        return this.updateDriver(id, { approvalStatus: 'REJECTED', rejectionReason: reason, isActive: false });
    }

    async refreshLocalDrivers() {
        try {
            const res = await fetch(`${ENV.API_BASE_URL}/drivers`, { headers: this.getHeaders() });
            if (res.ok) {
                const json = await res.json();
                const list = json?.data || json;
                if (Array.isArray(list)) {
                    localStorage.setItem(STORAGE_KEYS.ADMIN_DRIVERS, JSON.stringify(list));
                }
            }
        } catch {}
    }

    // ==========================================
    // 7. PROMOTION TRIP APIS (CRUD GÓI CƯỚC CHUYẾN CỐ ĐỊNH)
    // ==========================================

    async getPromotionTrips(page = 0, size = 20) {
        try {
            const res = await fetch(`${ENV.API_BASE_URL}/promotion-trips/all?page=${page}&size=${size}&sort=displayOrder,asc`, {
                headers: this.getHeaders(),
            });
            if (res.ok) {
                const json = await res.json();
                const list = json?.data?.content || json?.data || json;
                if (Array.isArray(list)) {
                    localStorage.setItem(STORAGE_KEYS.ADMIN_PROMOTIONS, JSON.stringify(list));
                    return list;
                }
            }
        } catch (e) {
            console.warn('API /promotion-trips/all error, fallback local:', e);
        }
        const local = localStorage.getItem(STORAGE_KEYS.ADMIN_PROMOTIONS);
        return local ? JSON.parse(local) : DEFAULT_ADMIN_PROMOTIONS;
    }

    async createPromotionTrip(data) {
        try {
            const res = await fetch(`${ENV.API_BASE_URL}/promotion-trips`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
            });
            if (res.ok) {
                const json = await res.json();
                return { success: true, data: json?.data || json };
            }
        } catch (e) {
            console.warn('Backend createPromotionTrip error, saving local:', e);
        }
        const list = await this.getPromotionTrips();
        const newItem = {
            ...data,
            id: Date.now(),
            features: Array.isArray(data.features) ? data.features : (data.features || '').split('\n').filter(Boolean),
        };
        list.push(newItem);
        localStorage.setItem(STORAGE_KEYS.ADMIN_PROMOTIONS, JSON.stringify(list));
        return { success: true, data: newItem };
    }

    async updatePromotionTrip(id, data) {
        try {
            const res = await fetch(`${ENV.API_BASE_URL}/promotion-trips/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
            });
            if (res.ok) {
                const json = await res.json();
                return { success: true, data: json?.data || json };
            }
        } catch (e) {
            console.warn(`Backend updatePromotionTrip ${id} error:`, e);
        }
        const list = await this.getPromotionTrips();
        const idx = list.findIndex((item) => String(item.id) === String(id));
        if (idx !== -1) {
            list[idx] = {
                ...list[idx],
                ...data,
                features: Array.isArray(data.features) ? data.features : (data.features || '').split('\n').filter(Boolean),
            };
            localStorage.setItem(STORAGE_KEYS.ADMIN_PROMOTIONS, JSON.stringify(list));
            return { success: true, data: list[idx] };
        }
        return { success: false, message: 'Không tìm thấy gói cước' };
    }

    async deletePromotionTrip(id) {
        try {
            const res = await fetch(`${ENV.API_BASE_URL}/promotion-trips/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });
            if (res.ok) {
                return { success: true };
            }
        } catch (e) {
            console.warn(`Backend deletePromotionTrip ${id} error:`, e);
        }
        const list = await this.getPromotionTrips();
        const filtered = list.filter((item) => String(item.id) !== String(id));
        localStorage.setItem(STORAGE_KEYS.ADMIN_PROMOTIONS, JSON.stringify(filtered));
        return { success: true };
    }

    // ==========================================
    // 8. DISCOUNT / VOUCHER APIS (CRUD MÃ GIẢM GIÁ)
    // ==========================================

    async getDiscounts(page = 0, size = 20) {
        try {
            const res = await fetch(`${ENV.API_BASE_URL}/discounts?page=${page}&size=${size}&sort=createdAt,desc`, {
                headers: this.getHeaders(),
            });
            if (res.ok) {
                const json = await res.json();
                const list = json?.data?.content || json?.data || json;
                if (Array.isArray(list)) {
                    localStorage.setItem(STORAGE_KEYS.ADMIN_DISCOUNTS, JSON.stringify(list));
                    return list;
                }
            }
        } catch (e) {
            console.warn('API /discounts error, fallback local:', e);
        }
        const local = localStorage.getItem(STORAGE_KEYS.ADMIN_DISCOUNTS);
        return local ? JSON.parse(local) : DEFAULT_ADMIN_DISCOUNTS;
    }

    async createDiscount(data) {
        try {
            const res = await fetch(`${ENV.API_BASE_URL}/discounts`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
            });
            if (res.ok) {
                const json = await res.json();
                return { success: true, data: json?.data || json };
            }
        } catch (e) {
            console.warn('Backend createDiscount error, saving local:', e);
        }
        const list = await this.getDiscounts();
        const newD = {
            ...data,
            id: Date.now(),
            usedCount: 0,
            code: (data.code || '').toUpperCase().trim(),
        };
        list.unshift(newD);
        localStorage.setItem(STORAGE_KEYS.ADMIN_DISCOUNTS, JSON.stringify(list));
        return { success: true, data: newD };
    }

    async updateDiscount(id, data) {
        try {
            const res = await fetch(`${ENV.API_BASE_URL}/discounts/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
            });
            if (res.ok) {
                const json = await res.json();
                return { success: true, data: json?.data || json };
            }
        } catch (e) {
            console.warn(`Backend updateDiscount ${id} error:`, e);
        }
        const list = await this.getDiscounts();
        const idx = list.findIndex((item) => String(item.id) === String(id));
        if (idx !== -1) {
            list[idx] = { ...list[idx], ...data, code: (data.code || list[idx].code).toUpperCase().trim() };
            localStorage.setItem(STORAGE_KEYS.ADMIN_DISCOUNTS, JSON.stringify(list));
            return { success: true, data: list[idx] };
        }
        return { success: false, message: 'Không tìm thấy mã giảm giá' };
    }

    async deleteDiscount(id) {
        try {
            const res = await fetch(`${ENV.API_BASE_URL}/discounts/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });
            if (res.ok) {
                return { success: true };
            }
        } catch (e) {
            console.warn(`Backend deleteDiscount ${id} error:`, e);
        }
        const list = await this.getDiscounts();
        const filtered = list.filter((item) => String(item.id) !== String(id));
        localStorage.setItem(STORAGE_KEYS.ADMIN_DISCOUNTS, JSON.stringify(filtered));
        return { success: true };
    }

    // ==========================================
    // 9. BANNER MANAGEMENT APIS (CRUD BANNER)
    // ==========================================

    async getBanners(page = 0, size = 20) {
        try {
            const res = await fetch(`${ENV.API_BASE_URL}/banners/all?page=${page}&size=${size}&sort=displayOrder,asc`, {
                headers: this.getHeaders(),
            });
            if (res.ok) {
                const json = await res.json();
                const list = json?.data?.content || json?.data || json;
                if (Array.isArray(list)) {
                    localStorage.setItem(STORAGE_KEYS.ADMIN_BANNERS, JSON.stringify(list));
                    return list;
                }
            }
        } catch (e) {
            console.warn('API /banners/all error, fallback local:', e);
        }
        const local = localStorage.getItem(STORAGE_KEYS.ADMIN_BANNERS);
        return local ? JSON.parse(local) : DEFAULT_ADMIN_BANNERS;
    }

    async createBanner(data) {
        try {
            const res = await fetch(`${ENV.API_BASE_URL}/banners`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
            });
            if (res.ok) {
                const json = await res.json();
                return { success: true, data: json?.data || json };
            }
        } catch (e) {
            console.warn('Backend createBanner error, saving local:', e);
        }
        const list = await this.getBanners();
        const newB = { ...data, id: Date.now() };
        list.push(newB);
        localStorage.setItem(STORAGE_KEYS.ADMIN_BANNERS, JSON.stringify(list));
        return { success: true, data: newB };
    }

    async updateBanner(id, data) {
        try {
            const res = await fetch(`${ENV.API_BASE_URL}/banners/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
            });
            if (res.ok) {
                const json = await res.json();
                return { success: true, data: json?.data || json };
            }
        } catch (e) {
            console.warn(`Backend updateBanner ${id} error:`, e);
        }
        const list = await this.getBanners();
        const idx = list.findIndex((item) => String(item.id) === String(id));
        if (idx !== -1) {
            list[idx] = { ...list[idx], ...data };
            localStorage.setItem(STORAGE_KEYS.ADMIN_BANNERS, JSON.stringify(list));
            return { success: true, data: list[idx] };
        }
        return { success: false, message: 'Không tìm thấy banner' };
    }

    async deleteBanner(id) {
        try {
            const res = await fetch(`${ENV.API_BASE_URL}/banners/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });
            if (res.ok) {
                return { success: true };
            }
        } catch (e) {
            console.warn(`Backend deleteBanner ${id} error:`, e);
        }
        const list = await this.getBanners();
        const filtered = list.filter((item) => String(item.id) !== String(id));
        localStorage.setItem(STORAGE_KEYS.ADMIN_BANNERS, JSON.stringify(filtered));
        return { success: true };
    }

    // ==========================================
    // 1 & 2. BOOKINGS & TRIP TRACKING (TRA CỨU ĐƠN HÀNG)
    // ==========================================

    async lookupBookingsByPhone(phone) {
        const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
        if (!cleanPhone) return [];
        try {
            const res = await fetch(`${ENV.API_BASE_URL}/bookings/upcoming?phone=${encodeURIComponent(cleanPhone)}`, {
                headers: this.getHeaders(),
            });
            if (res.ok) {
                const json = await res.json();
                const list = json?.data || json;
                if (Array.isArray(list) && list.length > 0) return list;
            }
        } catch (e) {
            console.warn('API /bookings/upcoming error:', e);
        }
        // Fallback kiểm tra trips trong driverService
        const allTrips = driverService.getAllTrips();
        return allTrips.filter((t) => (t.customerPhone || '').replace(/[^0-9]/g, '') === cleanPhone);
    }
}

export const adminService = new AdminService();
