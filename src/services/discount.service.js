import { apiClient } from './apiClient';

/**
 * Service kiểm tra và áp dụng mã giảm giá / Voucher
 */
export class DiscountService {
    /**
     * Xác thực mã giảm giá qua API (POST /discounts/validate)
     * @param {string} code - Mã giảm giá (VD: TRUNGANH50K)
     * @param {number|string} tripPrice - Giá cước ban đầu của chuyến đi
     * @returns {Promise<any>} Response từ backend
     */
    async validateDiscount(code, tripPrice) {
        return apiClient.post('/discounts/validate', {
            code: String(code || '').trim().toUpperCase(),
            tripPrice: String(tripPrice || 0),
        });
    }
}

export const discountService = new DiscountService();

