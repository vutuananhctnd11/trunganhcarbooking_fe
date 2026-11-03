/**
 * Dịch vụ Quản lý Tài xế & Lịch trình Chuyến đi (Driver Service)
 * Lưu trữ dữ liệu an toàn trên localStorage, hỗ trợ xem lịch trình 30 ngày,
 * chỉnh sửa giá cước, thời gian đón và phát hiện các chuyến sắp xuất phát.
 */

export interface DriverUser {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  carModel: string;
  plateNumber: string;
  rating: number;
  totalTrips: number;
  fullName?: string;
  vehicleModel?: string;
  licensePlate?: string;
  token?: string;
  tokenType?: string;
  seatCount?: number;
  experienceYears?: number;
  isActive?: boolean;
}

export type TripStatus = 'PENDING' | 'ACCEPTED' | 'ARRIVING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

export interface DriverTrip {
  id: string;
  tripCode: string;
  driverId: string;
  customerName: string;
  customerPhone: string;
  customerZalo?: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupDate: string; // YYYY-MM-DD
  pickupTime: string; // HH:mm
  estimatedPrice: number; // VNĐ
  distanceKm: number;
  passengers: number;
  carModel: string;
  status: TripStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEYS = {
  CURRENT_DRIVER: 'tac_current_driver',
  AUTH_TOKEN: 'tac_driver_token',
  DRIVERS_LIST: 'tac_registered_drivers',
  TRIPS_LIST: 'tac_driver_trips_data',
};

// Tài xế mẫu mặc định của Trung Anh Car
export const DEFAULT_DRIVERS: DriverUser[] = [
  {
    id: 'driver_trung_anh',
    name: 'Trung Anh (Chủ xe)',
    phone: '0362882882',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    carModel: 'VinFast Limo Green (VF e34)',
    plateNumber: '30K - 868.86',
    rating: 5.0,
    totalTrips: 1420,
  },
  {
    id: 'driver_tuan_hung',
    name: 'Tuấn Hưng',
    phone: '0988123456',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    carModel: 'VinFast VF 8 Plus Đỏ',
    plateNumber: '30L - 123.45',
    rating: 4.9,
    totalTrips: 980,
  },
];

// Định dạng ngày theo chuẩn YYYY-MM-DD
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Khởi tạo danh sách chuyến đi mẫu trải dài trong 30 ngày tới
function generateInitialTrips(driverId: string): DriverTrip[] {
  const trips: DriverTrip[] = [];
  const now = new Date();

  // 1. Chuyến sắp xuất phát ngay hôm nay (sau thời điểm hiện tại khoảng 35 phút)
  const urgentTime = new Date(now.getTime() + 35 * 60 * 1000);
  const urgentHour = String(urgentTime.getHours()).padStart(2, '0');
  const urgentMin = String(urgentTime.getMinutes()).padStart(2, '0');

  trips.push({
    id: 'trip_urgent_1',
    tripCode: 'TAC-' + Math.floor(1000 + Math.random() * 9000),
    driverId,
    customerName: 'Anh Vũ Hoàng (Khách VIP)',
    customerPhone: '0912.888.999',
    customerZalo: '0912888999',
    pickupAddress: 'Thị trấn Cổ Lễ, Huyện Trực Ninh, Nam Định',
    dropoffAddress: 'Sân bay Quốc tế Nội Bài - Nhà ga T1',
    pickupDate: formatDateKey(now),
    pickupTime: `${urgentHour}:${urgentMin}`,
    estimatedPrice: 900000,
    distanceKm: 135,
    passengers: 3,
    carModel: 'VinFast Limo Green (VF e34)',
    status: 'ACCEPTED',
    note: 'Khách mang 2 vali to đi công tác nước ngoài. Cần đón đúng giờ sảnh T1.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 2. Chuyến chiều tối nay (sau 4 tiếng nữa)
  const laterToday = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  trips.push({
    id: 'trip_today_2',
    tripCode: 'TAC-' + Math.floor(1000 + Math.random() * 9000),
    driverId,
    customerName: 'Chị Mai Linh',
    customerPhone: '0983.456.789',
    pickupAddress: 'Vinhomes Smart City, Tây Mỗ, Nam Từ Liêm, Hà Nội',
    dropoffAddress: 'Thị trấn Liễu Đề, Huyện Nghĩa Hưng, Nam Định',
    pickupDate: formatDateKey(now),
    pickupTime: `${String(laterToday.getHours()).padStart(2, '0')}:00`,
    estimatedPrice: 750000,
    distanceKm: 110,
    passengers: 2,
    carModel: 'VinFast Limo Green (VF e34)',
    status: 'PENDING',
    note: 'Gia đình có trẻ nhỏ, lái xe êm ái.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 3. Khởi tạo các chuyến đi trong 30 ngày tiếp theo
  const sampleRoutes = [
    {
      cust: 'Bác Nguyễn Văn Thành',
      phone: '0977.112.233',
      pickup: 'Xã Liêm Hải, Huyện Trực Ninh, Nam Định',
      drop: 'Bệnh viện Bạch Mai, Đống Đa, Hà Nội',
      price: 650000,
      km: 95,
      time: '06:00',
      note: 'Đi khám định kỳ, mang theo xe lăn gấp gọn.',
    },
    {
      cust: 'Đoàn gia đình Anh Tuấn',
      phone: '0904.333.555',
      pickup: 'Khu đô thị Times City, Hai Bà Trưng, Hà Nội',
      drop: 'Thị trấn Cổ Lễ, Huyện Trực Ninh, Nam Định',
      price: 700000,
      km: 105,
      time: '14:30',
      note: 'Xe êm ái, điều hòa mát vừa phải.',
    },
    {
      cust: 'Chị Bích Ngọc',
      phone: '0915.678.901',
      pickup: 'Xã Trực Cường, Trực Ninh, Nam Định',
      drop: 'Sân bay Quốc tế Nội Bài - Sảnh Quốc tế T2',
      price: 900000,
      km: 140,
      time: '08:00',
      note: 'Đi chuyến bay 12h trưa, đón sớm tránh tắc đường vành đai 3.',
    },
    {
      cust: 'Anh Đức Mạnh',
      phone: '0936.789.123',
      pickup: 'Sân bay Quốc tế Nội Bài, Hà Nội',
      drop: 'Xã Trực Nội, Trực Ninh, Nam Định',
      price: 900000,
      km: 138,
      time: '16:00',
      note: 'Chuyến bay đáp lúc 15:30. Biển tên đón khách tại cột 10.',
    },
    {
      cust: 'Doanh nhân Trần Quang',
      phone: '0989.999.888',
      pickup: 'Khách sạn Daewoo, Ba Đình, Hà Nội',
      drop: 'KCN Bảo Minh, Vụ Bản, Nam Định',
      price: 600000,
      km: 88,
      time: '07:30',
      note: 'Gặp đối tác sản xuất, tài xế trang phục lịch sự.',
    },
    {
      cust: 'Gia đình Chị Hương Giang',
      phone: '0944.222.111',
      pickup: 'Xã Phương Định, Trực Ninh, Nam Định',
      drop: 'Ga Hà Nội, Hoàn Kiếm, Hà Nội',
      price: 650000,
      km: 100,
      time: '11:00',
      note: 'Đi tàu hỏa chiều lúc 15:00.',
    },
  ];

  for (let i = 1; i <= 30; i++) {
    const tripDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    // Mỗi 1 - 2 ngày xếp 1 hoặc 2 chuyến thực tế
    if (i % 2 === 0 || i % 3 === 0 || i === 1) {
      const route = sampleRoutes[(i * 3) % sampleRoutes.length];
      trips.push({
        id: `trip_day_${i}_1`,
        tripCode: 'TAC-' + (7000 + i * 17),
        driverId,
        customerName: route.cust,
        customerPhone: route.phone,
        customerZalo: route.phone.replace(/[^0-9]/g, ''),
        pickupAddress: route.pickup,
        dropoffAddress: route.drop,
        pickupDate: formatDateKey(tripDate),
        pickupTime: route.time,
        estimatedPrice: route.price,
        distanceKm: route.km,
        passengers: 2 + (i % 3),
        carModel: 'VinFast Limo Green (VF e34)',
        status: i === 1 ? 'ACCEPTED' : 'PENDING',
        note: route.note,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Ngày cuối tuần thêm chuyến chiều về
      if (tripDate.getDay() === 0 || tripDate.getDay() === 6) {
        const returnRoute = sampleRoutes[(i * 2 + 1) % sampleRoutes.length];
        trips.push({
          id: `trip_day_${i}_2`,
          tripCode: 'TAC-' + (8000 + i * 19),
          driverId,
          customerName: returnRoute.cust,
          customerPhone: returnRoute.phone,
          customerZalo: returnRoute.phone.replace(/[^0-9]/g, ''),
          pickupAddress: returnRoute.pickup,
          dropoffAddress: returnRoute.drop,
          pickupDate: formatDateKey(tripDate),
          pickupTime: '17:30',
          estimatedPrice: returnRoute.price,
          distanceKm: returnRoute.km,
          passengers: 3,
          carModel: 'VinFast Limo Green (VF e34)',
          status: 'PENDING',
          note: returnRoute.note,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  return trips;
}

// ---------------- API FUNCTIONS CHO TÀI XẾ ----------------

export const driverService = {
  /**
   * Lấy tài xế đang đăng nhập hiện tại
   */
  getCurrentDriver(): DriverUser | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_DRIVER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Đăng nhập tài xế qua Backend API (POST /api/v1/auth/driver/login)
   */
  async login(phone: string, password?: string): Promise<{ success: boolean; driver?: DriverUser; message?: string }> {
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/driver/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone || phone.trim(),
          password: password || '123456',
        }),
      });

      let responseData: any = null;
      try {
        responseData = await response.json();
      } catch {}

      if (response.ok && responseData?.driver) {
        const d = responseData.driver;
        const mappedDriver: DriverUser = {
          id: String(d.id),
          name: d.fullName || d.name || 'Tài xế',
          fullName: d.fullName,
          phone: d.phone,
          avatar: d.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          carModel: d.vehicleModel || 'VinFast Limo Green (VF e34)',
          vehicleModel: d.vehicleModel,
          plateNumber: d.licensePlate || '30K - 999.88',
          licensePlate: d.licensePlate,
          rating: typeof d.rating === 'number' ? d.rating : 5.0,
          totalTrips: d.totalTrips || 0,
          token: responseData.token,
          tokenType: responseData.token_type || responseData.tokenType || 'Bearer',
          seatCount: d.seatCount,
          experienceYears: d.experienceYears,
          isActive: d.isActive,
        };

        if (responseData.token) {
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, responseData.token);
        }
        localStorage.setItem(STORAGE_KEYS.CURRENT_DRIVER, JSON.stringify(mappedDriver));
        this.ensureTripsInitialized(mappedDriver.id);
        return { success: true, driver: mappedDriver };
      } else {
        const errorMsg = responseData?.message || responseData?.error || `Đăng nhập thất bại (HTTP ${response.status})`;
        return { success: false, message: errorMsg };
      }
    } catch (err: any) {
      console.warn('Backend login error, checking local fallback:', err);
      // Fallback cục bộ nếu backend offline
      const drivers = this.getAllDrivers();
      const found = drivers.find((d) => d.phone.replace(/[^0-9]/g, '') === cleanPhone);

      if (found) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_DRIVER, JSON.stringify(found));
        this.ensureTripsInitialized(found.id);
        return { success: true, driver: found };
      }

      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ backend (http://localhost:8080). Vui lòng thử lại sau.',
      };
    }
  },

  /**
   * Đăng nhập nhanh tài xế Trung Anh mẫu
   */
  loginAsDefault(): DriverUser {
    const defaultDriver = DEFAULT_DRIVERS[0];
    localStorage.setItem(STORAGE_KEYS.CURRENT_DRIVER, JSON.stringify(defaultDriver));
    this.ensureTripsInitialized(defaultDriver.id);
    return defaultDriver;
  },

  /**
   * Đăng ký tài xế mới qua Backend API (POST /api/v1/auth/driver/register)
   */
  async register(data: {
    fullName: string;
    phone: string;
    licensePlate: string;
    vehicleModel: string;
    password?: string;
  }): Promise<{ success: boolean; driver?: DriverUser; message?: string }> {
    const cleanPhone = data.phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      return { success: false, message: 'Số điện thoại không hợp lệ.' };
    }

    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/driver/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: data.fullName.trim(),
          phone: cleanPhone,
          licensePlate: data.licensePlate.trim(),
          vehicleModel: data.vehicleModel.trim(),
          password: data.password || 'MatKhauCuaToi123',
        }),
      });

      let responseData: any = null;
      try {
        responseData = await response.json();
      } catch {}

      if (response.ok && responseData?.driver) {
        const d = responseData.driver;
        const mappedDriver: DriverUser = {
          id: String(d.id),
          name: d.fullName || data.fullName.trim(),
          fullName: d.fullName || data.fullName.trim(),
          phone: d.phone || cleanPhone,
          avatar: d.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
          carModel: d.vehicleModel || data.vehicleModel.trim(),
          vehicleModel: d.vehicleModel || data.vehicleModel.trim(),
          plateNumber: d.licensePlate || data.licensePlate.trim(),
          licensePlate: d.licensePlate || data.licensePlate.trim(),
          rating: typeof d.rating === 'number' ? d.rating : 5.0,
          totalTrips: 1,
          token: responseData.token,
          tokenType: responseData.token_type || responseData.tokenType || 'Bearer',
          seatCount: d.seatCount,
          isActive: d.isActive,
        };

        if (responseData.token) {
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, responseData.token);
        }
        localStorage.setItem(STORAGE_KEYS.CURRENT_DRIVER, JSON.stringify(mappedDriver));

        // Khởi tạo các chuyến mẫu cho tài xế mới
        const trips = generateInitialTrips(mappedDriver.id);
        this.saveAllTrips(trips);

        return { success: true, driver: mappedDriver };
      } else {
        const errorMsg = responseData?.message || responseData?.error || `Đăng ký thất bại (HTTP ${response.status})`;
        return { success: false, message: errorMsg };
      }
    } catch (err: any) {
      console.warn('Backend register error, fallback to local register:', err);
      // Fallback local nếu server không chạy
      const drivers = this.getAllDrivers();
      const exists = drivers.find((d) => d.phone.replace(/[^0-9]/g, '') === cleanPhone);
      if (exists) {
        return { success: false, message: 'Số điện thoại này đã được đăng ký tài xế.' };
      }

      const newDriver: DriverUser = {
        id: 'driver_' + Date.now(),
        name: data.fullName.trim() || 'Tài xế Trung Anh',
        fullName: data.fullName.trim(),
        phone: cleanPhone,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        carModel: data.vehicleModel.trim() || 'VinFast Limo Green (VF e34)',
        vehicleModel: data.vehicleModel.trim(),
        plateNumber: data.licensePlate.trim() || '30K - 888.99',
        licensePlate: data.licensePlate.trim(),
        rating: 5.0,
        totalTrips: 1,
      };

      drivers.push(newDriver);
      localStorage.setItem(STORAGE_KEYS.DRIVERS_LIST, JSON.stringify(drivers));
      localStorage.setItem(STORAGE_KEYS.CURRENT_DRIVER, JSON.stringify(newDriver));

      const trips = generateInitialTrips(newDriver.id);
      this.saveAllTrips(trips);

      return { success: true, driver: newDriver };
    }
  },

  /**
   * Đăng xuất tài xế
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_DRIVER);
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    }
  },

  /**
   * Lấy toàn bộ tài xế đăng ký
   */
  getAllDrivers(): DriverUser[] {
    if (typeof window === 'undefined') return DEFAULT_DRIVERS;
    const raw = localStorage.getItem(STORAGE_KEYS.DRIVERS_LIST);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.DRIVERS_LIST, JSON.stringify(DEFAULT_DRIVERS));
      return DEFAULT_DRIVERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_DRIVERS;
    }
  },

  /**
   * Đảm bảo dữ liệu chuyến đi được khởi tạo
   */
  ensureTripsInitialized(driverId: string): void {
    const trips = this.getAllTrips();
    const driverTrips = trips.filter((t) => t.driverId === driverId);
    if (driverTrips.length === 0) {
      const newTrips = generateInitialTrips(driverId);
      const combined = [...trips, ...newTrips];
      this.saveAllTrips(combined);
    }
  },

  /**
   * Lấy toàn bộ chuyến đi trong hệ thống
   */
  getAllTrips(): DriverTrip[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEYS.TRIPS_LIST);
    if (!raw) {
      const initial = generateInitialTrips(DEFAULT_DRIVERS[0].id);
      this.saveAllTrips(initial);
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  /**
   * Lưu toàn bộ chuyến đi
   */
  saveAllTrips(trips: DriverTrip[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.TRIPS_LIST, JSON.stringify(trips));
    }
  },

  /**
   * Lấy các chuyến đi của tài xế theo ngày cụ thể (YYYY-MM-DD)
   */
  getTripsByDate(driverId: string, dateKey: string): DriverTrip[] {
    const all = this.getAllTrips();
    return all
      .filter((t) => t.driverId === driverId && t.pickupDate === dateKey)
      .sort((a, b) => a.pickupTime.localeCompare(b.pickupTime));
  },

  /**
   * Lấy toàn bộ chuyến trong phạm vi 30 ngày sắp tới
   */
  getUpcoming30DaysTrips(driverId: string): DriverTrip[] {
    const all = this.getAllTrips();
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    return all
      .filter((t) => {
        if (t.driverId !== driverId) return false;
        const [year, month, day] = t.pickupDate.split('-').map(Number);
        const tripDate = new Date(year, month - 1, day);
        return tripDate >= startDate && tripDate <= endDate;
      })
      .sort((a, b) => {
        if (a.pickupDate !== b.pickupDate) {
          return a.pickupDate.localeCompare(b.pickupDate);
        }
        return a.pickupTime.localeCompare(b.pickupTime);
      });
  },

  /**
   * Cập nhật thông tin chuyến đi (Giá tiền, Thời gian xuất phát, Trạng thái, Ghi chú)
   */
  updateTrip(
    tripId: string,
    updates: {
      estimatedPrice?: number;
      pickupDate?: string;
      pickupTime?: string;
      status?: TripStatus;
      note?: string;
    }
  ): { success: boolean; trip?: DriverTrip; message?: string } {
    const trips = this.getAllTrips();
    const index = trips.findIndex((t) => t.id === tripId);
    if (index === -1) {
      return { success: false, message: 'Không tìm thấy chuyến đi.' };
    }

    const current = trips[index];
    const updatedTrip: DriverTrip = {
      ...current,
      ...(updates.estimatedPrice !== undefined && { estimatedPrice: updates.estimatedPrice }),
      ...(updates.pickupDate && { pickupDate: updates.pickupDate }),
      ...(updates.pickupTime && { pickupTime: updates.pickupTime }),
      ...(updates.status && { status: updates.status }),
      ...(updates.note !== undefined && { note: updates.note }),
      updatedAt: new Date().toISOString(),
    };

    trips[index] = updatedTrip;
    this.saveAllTrips(trips);

    // Đồng bộ vào sessionStorage nếu có
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`trip_${updatedTrip.tripCode}`, JSON.stringify(updatedTrip));
    }

    return { success: true, trip: updatedTrip };
  },

  /**
   * Phát hiện các chuyến đi sắp đến giờ xuất phát (trong vòng 120 phút hoặc hôm nay chưa chạy)
   */
  getImminentTrips(driverId: string): Array<{
    trip: DriverTrip;
    minutesUntilDeparture: number;
    isUrgent: boolean; // Dưới 60 phút
  }> {
    const all = this.getAllTrips();
    const now = new Date();
    const todayKey = formatDateKey(now);

    const results: Array<{
      trip: DriverTrip;
      minutesUntilDeparture: number;
      isUrgent: boolean;
    }> = [];

    all.forEach((trip) => {
      if (trip.driverId !== driverId) return;
      if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') return;

      if (trip.pickupDate === todayKey) {
        const [hours, minutes] = trip.pickupTime.split(':').map(Number);
        const tripDateTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          hours,
          minutes,
          0
        );

        const diffMinutes = Math.round((tripDateTime.getTime() - now.getTime()) / (1000 * 60));

        // Nếu chuyến còn dưới 180 phút (3 giờ) hoặc đã quá giờ dưới 60 phút
        if (diffMinutes >= -60 && diffMinutes <= 180) {
          results.push({
            trip,
            minutesUntilDeparture: diffMinutes,
            isUrgent: diffMinutes <= 60,
          });
        }
      }
    });

    return results.sort((a, b) => a.minutesUntilDeparture - b.minutesUntilDeparture);
  },
};

