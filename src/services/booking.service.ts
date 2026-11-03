import { apiClient } from './apiClient';

export interface BookingPayload {
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  dropoffAddress: string;
  distanceKm: number;
  estimatedPrice: number;
  pickupTime: string;
  waitHours?: number;
  driverId?: string;
  isRoundTrip?: boolean;
  isFixedTrip?: boolean;
  fixedTripTitle?: string;
  promotionTripId?: number;
  discountCode?: string;
  discountAmount?: number;
  luggageOption?: string;
  note?: string;
}

export interface BookingResponse {
  id?: string | number;
  tripCode?: string;
  code?: string;
  customerName?: string;
  customerPhone?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  estimatedPrice?: number;
  status?: string;
  message?: string;
}

export class BookingService {
  /**
   * Tạo đơn đặt xe mới (POST /bookings)
   */
  async createBooking(payload: BookingPayload): Promise<BookingResponse> {
    return apiClient.post<BookingResponse>('/bookings', payload);
  }

  /**
   * Lấy thông tin chuyến đi theo mã chuyến (GET /bookings/{code})
   */
  async getBookingByCode(code: string): Promise<BookingResponse> {
    return apiClient.get<BookingResponse>(`/bookings/${code}`);
  }
}

export const bookingService = new BookingService();
