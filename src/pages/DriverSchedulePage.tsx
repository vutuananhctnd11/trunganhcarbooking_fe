import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  driverService,
  DriverTrip,
  DriverUser,
  formatDateKey,
  TripStatus,
} from '../services/driverService';
import DriverAuthModal from '../components/DriverAuthModal';

/**
 * Phát âm thanh chuông thông báo chuyến đi sắp đến giờ
 */
function playUrgentNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880.0, now + 0.15); // A5
    osc.frequency.setValueAtTime(1174.66, now + 0.3); // D6

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.8);
  } catch (err) {
    console.warn('Audio notification unavailable:', err);
  }
}

export default function DriverSchedulePage() {
  const navigate = useNavigate();

  // State tài xế hiện tại
  const [currentDriver, setCurrentDriver] = useState<DriverUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // State dữ liệu chuyến đi
  const [allTrips, setAllTrips] = useState<DriverTrip[]>([]);
  const [selectedDateKey, setSelectedDateKey] = useState<string>(''); // YYYY-MM-DD hoặc 'ALL'
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // State modal chỉnh sửa chuyến đi
  const [selectedTrip, setSelectedTrip] = useState<DriverTrip | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDate, setEditDate] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');
  const [editStatus, setEditStatus] = useState<TripStatus>('PENDING');
  const [editNote, setEditNote] = useState<string>('');
  const [saveSuccessToast, setSaveSuccessToast] = useState<string>('');

  // State thông báo chuyến sắp chạy
  const [imminentTrips, setImminentTrips] = useState<
    Array<{ trip: DriverTrip; minutesUntilDeparture: number; isUrgent: boolean }>
  >([]);
  const [hasPlayedSound, setHasPlayedSound] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  // Tải dữ liệu tài xế và chuyến đi
  const loadDriverData = () => {
    let driver = driverService.getCurrentDriver();
    if (!driver) {
      // Nếu chưa có tài xế đăng nhập, tự động đăng nhập mẫu Trung Anh Car để người dùng trải nghiệm ngay
      driver = driverService.loginAsDefault();
    }
    setCurrentDriver(driver);

    // Tải danh sách 30 ngày
    const trips = driverService.getUpcoming30DaysTrips(driver.id);
    setAllTrips(trips);

    // Kiểm tra chuyến sắp xuất phát
    const urgent = driverService.getImminentTrips(driver.id);
    setImminentTrips(urgent);

    if (urgent.length > 0 && !hasPlayedSound) {
      playUrgentNotificationSound();
      setHasPlayedSound(true);
    }
  };

  useEffect(() => {
    const todayStr = formatDateKey(new Date());
    setSelectedDateKey(todayStr);
    loadDriverData();

    // Tự động kiểm tra chuyến sắp xuất phát mỗi phút
    const interval = setInterval(() => {
      if (currentDriver) {
        const urgent = driverService.getImminentTrips(currentDriver.id);
        setImminentTrips(urgent);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Tạo danh sách 30 ngày sắp tới từ hôm nay
  const next30Days = useMemo(() => {
    const days: Array<{
      dateKey: string;
      dayOfWeek: string;
      dayNumber: number;
      monthNumber: number;
      isToday: boolean;
      tripsCount: number;
    }> = [];

    const now = new Date();
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const key = formatDateKey(d);
      const count = allTrips.filter((t) => t.pickupDate === key).length;

      days.push({
        dateKey: key,
        dayOfWeek: i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : dayNames[d.getDay()],
        dayNumber: d.getDate(),
        monthNumber: d.getMonth() + 1,
        isToday: i === 0,
        tripsCount: count,
      });
    }

    return days;
  }, [allTrips]);

  // Lọc chuyến đi theo ngày đã chọn và trạng thái
  const filteredTrips = useMemo(() => {
    return allTrips.filter((trip) => {
      // Lọc theo ngày
      if (selectedDateKey !== 'ALL' && trip.pickupDate !== selectedDateKey) {
        return false;
      }
      // Lọc theo trạng thái
      if (statusFilter !== 'ALL' && trip.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [allTrips, selectedDateKey, statusFilter]);

  // Mở modal xem thông tin và chỉnh sửa chuyến đi
  const handleOpenEditModal = (trip: DriverTrip) => {
    setSelectedTrip(trip);
    setEditPrice(trip.estimatedPrice);
    setEditDate(trip.pickupDate);
    setEditTime(trip.pickupTime);
    setEditStatus(trip.status);
    setEditNote(trip.note || '');
    setIsEditModalOpen(true);
  };

  // Lưu chỉnh sửa chuyến đi
  const handleSaveTripChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip) return;

    const res = driverService.updateTrip(selectedTrip.id, {
      estimatedPrice: Number(editPrice),
      pickupDate: editDate,
      pickupTime: editTime,
      status: editStatus,
      note: editNote,
    });

    if (res.success && res.trip) {
      // Cập nhật lại state
      loadDriverData();
      setIsEditModalOpen(false);
      setSaveSuccessToast(`Đã cập nhật chuyến ${selectedTrip.tripCode} thành công!`);
      setTimeout(() => setSaveSuccessToast(''), 4000);
    }
  };

  // Đăng xuất
  const handleLogout = () => {
    driverService.logout();
    setCurrentDriver(null);
    navigate('/');
  };

  // Format tiền tệ VNĐ
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-red-600 selection:text-white pb-16">
      {/* Toast thông báo lưu thành công */}
      {saveSuccessToast && (
        <div className="fixed top-24 right-4 sm:right-8 z-50 p-4 rounded-2xl bg-emerald-950/90 border border-emerald-600 text-white shadow-2xl shadow-emerald-950/80 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold">{saveSuccessToast}</p>
            <p className="text-xs text-emerald-300">Thông tin giá và thời gian đã được đồng bộ.</p>
          </div>
        </div>
      )}

      {/* Header thanh điều hướng tài xế */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Tên Cổng */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 no-underline group">
              <img
                src="/trunganhcar_logo.png"
                alt="Logo"
                className="h-10 sm:h-12 w-auto object-contain filter drop-shadow-[0_2px_10px_rgba(220,38,38,0.4)] group-hover:scale-105 transition-transform"
              />
              <div>
                <span className="text-base sm:text-lg font-black text-white block leading-tight">
                  TRUNG ANH CAR
                </span>
                <span className="text-[10px] text-red-400 font-bold tracking-wider uppercase block">
                  Cổng Điều Hành Lịch Trình Tài Xế
                </span>
              </div>
            </Link>
          </div>

          {/* Thông tin tài xế & Chuông thông báo */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Chuông thông báo chuyến sắp chạy */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                className="relative p-2.5 rounded-full bg-slate-900 border border-slate-700/80 hover:border-red-500 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Thông báo chuyến sắp xuất phát"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {imminentTrips.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center animate-pulse border-2 border-slate-950">
                    {imminentTrips.length}
                  </span>
                )}
              </button>

              {/* Dropdown danh sách chuyến sắp chạy */}
              {isNotifDropdownOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl shadow-red-950/60 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                      <h4 className="text-xs sm:text-sm font-bold text-white">Chuyến Sắp Xuất Phát</h4>
                    </div>
                    <span className="text-[11px] text-red-400 font-semibold">{imminentTrips.length} chuyến</span>
                  </div>

                  <div className="mt-3 space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {imminentTrips.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">Hiện không có chuyến nào sắp đến giờ xuất phát.</p>
                    ) : (
                      imminentTrips.map(({ trip, minutesUntilDeparture, isUrgent }) => (
                        <div
                          key={trip.id}
                          onClick={() => {
                            handleOpenEditModal(trip);
                            setIsNotifDropdownOpen(false);
                          }}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            isUrgent
                              ? 'bg-red-950/50 border-red-800 hover:border-red-500'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{trip.tripCode}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white animate-pulse">
                              {minutesUntilDeparture <= 0 ? 'TỚI GIỜ ĐÓN' : `Còn ${minutesUntilDeparture} phút`}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-200 mt-1 truncate">{trip.customerName}</p>
                          <p className="text-[11px] text-slate-400 truncate">Đón: {trip.pickupAddress}</p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60">
                            <span className="text-xs font-bold text-amber-400">{formatVND(trip.estimatedPrice)}</span>
                            <span className="text-[11px] text-red-400 font-semibold flex items-center gap-1">
                              Xem & sửa giá →
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile tài xế */}
            {currentDriver && (
              <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-800">
                <img
                  src={currentDriver.avatar}
                  alt={currentDriver.name}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-red-500/80 shadow-md"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-white leading-tight">{currentDriver.name}</p>
                  <p className="text-[10px] text-slate-400">{currentDriver.plateNumber} • {currentDriver.carModel}</p>
                </div>

                {/* Nút Đổi tài xế / Đăng xuất */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                  title="Đăng xuất / Về trang chủ"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* PHẦN 1: THÔNG BÁO CHUYẾN ĐI SẮP ĐẾN GIỜ XUẤT PHÁT (Departure Alert Banner) */}
        {imminentTrips.length > 0 && (
          <section
            aria-label="Cảnh báo chuyến xe sắp xuất phát"
            className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-red-950 via-slate-900 to-amber-950/70 border-2 border-red-600/80 shadow-2xl shadow-red-950/80 p-4 sm:p-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center flex-shrink-0 text-white shadow-xl shadow-red-900/80 animate-bounce">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>

                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-black uppercase tracking-wider mb-1 shadow-md">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>CHUYẾN SẮP ĐẾN GIỜ KHỞI HÀNH</span>
                  </div>

                  <h3 className="text-base sm:text-xl font-extrabold text-white leading-tight">
                    Chuyến {imminentTrips[0].trip.tripCode}: {imminentTrips[0].trip.customerName}
                    <span className="text-amber-400 ml-2">
                      ({imminentTrips[0].minutesUntilDeparture <= 0 ? 'ĐÃ ĐẾN GIỜ ĐÓN' : `Sau ${imminentTrips[0].minutesUntilDeparture} phút nữa`})
                    </span>
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 mt-1 line-clamp-1">
                    <span className="text-red-400 font-bold">Điểm đón:</span> {imminentTrips[0].trip.pickupAddress}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-300 line-clamp-1">
                    <span className="text-emerald-400 font-bold">Điểm đến:</span> {imminentTrips[0].trip.dropoffAddress}
                  </p>
                </div>
              </div>

              {/* Nút thao tác nhanh */}
              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                <a
                  href={`tel:${imminentTrips[0].trip.customerPhone}`}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 no-underline"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>Gọi khách</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleOpenEditModal(imminentTrips[0].trip)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-950/60 transition-all flex items-center gap-1.5 cursor-pointer border border-white/20"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Xem & Chỉnh sửa</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* PHẦN 2: THANH CHỌN LỊCH TRÌNH 30 NGÀY (30-Day Date Slider) */}
        <section className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                <span>Lịch Trình 30 Ngày Sắp Tới</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                  {allTrips.length} chuyến
                </span>
              </h2>
              <p className="text-xs text-slate-400">Bấm vào ngày để xem chi tiết hoặc bấm vào từng chuyến để chỉnh sửa giá tiền & giờ bắt đầu</p>
            </div>

            {/* Nút Xem tất cả vs Hôm nay */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDateKey(formatDateKey(new Date()))}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedDateKey === formatDateKey(new Date())
                    ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => setSelectedDateKey('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedDateKey === 'ALL'
                    ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Tất cả 30 ngày
              </button>
            </div>
          </div>

          {/* Dải 30 ngày cuộn ngang */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
            {next30Days.map((d) => {
              const isSelected = selectedDateKey === d.dateKey;
              return (
                <button
                  key={d.dateKey}
                  type="button"
                  onClick={() => setSelectedDateKey(d.dateKey)}
                  className={`flex-shrink-0 w-16 sm:w-20 p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-red-500 bg-gradient-to-b from-red-950/80 to-slate-900 text-white shadow-lg shadow-red-950/50 scale-105'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase truncate">{d.dayOfWeek}</p>
                  <p className="text-base sm:text-lg font-black my-0.5 text-white">{d.dayNumber}</p>
                  <p className="text-[10px] text-slate-400">Tháng {d.monthNumber}</p>

                  {/* Chấm hiển thị số chuyến */}
                  {d.tripsCount > 0 ? (
                    <span className="inline-block mt-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-red-600 text-white">
                      {d.tripsCount} xe
                    </span>
                  ) : (
                    <span className="inline-block mt-1 text-[9px] text-slate-600">Trống</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* PHẦN 3: DANH SÁCH CÁC CHUYẾN ĐI (Trip Cards List) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-white">
              {selectedDateKey === 'ALL'
                ? 'Toàn bộ danh sách chuyến đi trong 30 ngày'
                : `Lịch chạy ngày ${selectedDateKey}`}
              <span className="text-xs text-slate-400 font-normal ml-2">
                ({filteredTrips.length} chuyến)
              </span>
            </h3>

            {/* Lọc trạng thái */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold focus:outline-none focus:border-red-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ đón</option>
              <option value="ACCEPTED">Đã nhận</option>
              <option value="ARRIVING">Đang đến</option>
              <option value="COMPLETED">Hoàn tất</option>
            </select>
          </div>

          {filteredTrips.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
              <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-300">Không có chuyến đi nào trong ngày này</p>
              <p className="text-xs text-slate-500 mt-1">Tài xế có thể nghỉ ngơi hoặc chọn ngày khác trên dải 30 ngày phía trên</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTrips.map((trip) => {
                const isUrgent = imminentTrips.some((it) => it.trip.id === trip.id);

                return (
                  <div
                    key={trip.id}
                    onClick={() => handleOpenEditModal(trip)}
                    className={`relative rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer group hover:scale-[1.01] hover:shadow-xl ${
                      isUrgent
                        ? 'bg-gradient-to-br from-red-950/60 to-slate-900 border-red-600/90 shadow-red-950/40'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-slate-950/50'
                    }`}
                  >
                    {/* Header Thẻ Chuyến: Giờ đón & Mã chuyến */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="text-lg sm:text-xl font-black text-white group-hover:text-red-400 transition-colors">
                          {trip.pickupTime}
                        </span>
                        <span className="text-xs text-slate-400">({trip.pickupDate})</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {trip.tripCode}
                        </span>
                        {isUrgent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse">
                            SẮP CHẠY
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Lộ trình Điểm đón & Điểm đến */}
                    <div className="py-3.5 space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-slate-400 uppercase font-semibold">Điểm đón</p>
                          <p className="text-xs sm:text-sm font-semibold text-slate-200 truncate">{trip.pickupAddress}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-slate-400 uppercase font-semibold">Điểm đến</p>
                          <p className="text-xs sm:text-sm font-semibold text-slate-200 truncate">{trip.dropoffAddress}</p>
                        </div>
                      </div>
                    </div>

                    {/* Thông tin Khách hàng */}
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{trip.customerName}</p>
                        <p className="text-[11px] text-slate-400">{trip.customerPhone}</p>
                      </div>

                      <a
                        href={`tel:${trip.customerPhone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-400 transition-colors flex-shrink-0"
                        title="Gọi khách"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </a>
                    </div>

                    {/* Footer Thẻ: Giá tiền & Nút sửa */}
                    <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Giá cước chuyến</p>
                        <p className="text-base sm:text-lg font-black text-amber-400">{formatVND(trip.estimatedPrice)}</p>
                      </div>

                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg bg-slate-800 group-hover:bg-red-600 group-hover:text-white text-slate-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>Sửa giá & giờ</span>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* MODAL CHI TIẾT & CHỈNH SỬA CHUYẾN ĐI (Trip Detail & Edit Modal) */}
      {isEditModalOpen && selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
            onClick={() => setIsEditModalOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl shadow-red-950/60 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-red-950/40 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-xs font-black bg-red-600 text-white">
                    {selectedTrip.tripCode}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white">Chỉnh Sửa Thông Tin Chuyến Xe</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Khách hàng: {selectedTrip.customerName} • {selectedTrip.customerPhone}</p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form chỉnh sửa */}
            <form onSubmit={handleSaveTripChanges} className="p-6 space-y-5">
              {/* Thông tin lộ trình tóm tắt */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                <p className="text-slate-300">
                  <span className="text-emerald-400 font-bold">Điểm đón:</span> {selectedTrip.pickupAddress}
                </p>
                <p className="text-slate-300">
                  <span className="text-red-400 font-bold">Điểm đến:</span> {selectedTrip.dropoffAddress}
                </p>
                <p className="text-slate-400">
                  <span className="font-semibold text-slate-300">Khoảng cách:</span> ~{selectedTrip.distanceKm} km • Xe: {selectedTrip.carModel}
                </p>
              </div>

              {/* PHẦN 1: CHỈNH SỬA GIÁ TIỀN */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-white mb-1.5">
                  Giá cước chuyến đi (VNĐ) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="10000"
                    min="50000"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-amber-400 font-extrabold text-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    VNĐ
                  </span>
                </div>

                {/* Phím bấm chọn nhanh giá cước */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-[11px] text-slate-400 font-semibold">Gợi ý nhanh:</span>
                  {[250000, 650000, 900000, 1200000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditPrice(preset)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      {formatVND(preset)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEditPrice((prev) => prev + 50000)}
                    className="px-2 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 text-xs font-bold cursor-pointer"
                  >
                    +50.000đ
                  </button>
                </div>
              </div>

              {/* PHẦN 2: CHỈNH SỬA THỜI GIAN BẮT ĐẦU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-white mb-1.5">
                    Ngày bắt đầu đón <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-white mb-1.5">
                    Giờ xuất phát <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              {/* Trạng thái chuyến đi */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-white mb-1.5">
                  Trạng thái chuyến xe
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as TripStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="PENDING">Chờ xác nhận / Chờ đón</option>
                  <option value="ACCEPTED">Tài xế đã nhận chuyến</option>
                  <option value="ARRIVING">Đang đến đón khách</option>
                  <option value="IN_TRANSIT">Đang chở khách di chuyển</option>
                  <option value="COMPLETED">Chuyến đi đã hoàn tất</option>
                  <option value="CANCELLED">Đã hủy chuyến</option>
                </select>
              </div>

              {/* Ghi chú tài xế */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-white mb-1.5">
                  Ghi chú riêng của tài xế
                </label>
                <textarea
                  rows={2}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="VD: Khách có 2 vali lớn, hẹn đón cổng chính..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              {/* Nút hành động */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs sm:text-sm shadow-xl shadow-red-950/60 active:scale-95 transition-all cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal xác thực tài xế khi cần đổi tài khoản */}
      <DriverAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(driver) => {
          setCurrentDriver(driver);
          loadDriverData();
        }}
      />
    </div>
  );
}

