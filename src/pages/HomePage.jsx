import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import VehicleShowcase from '../../components/VehicleShowcase';
import CampaignBanner from '../../components/CampaignBanner';
import VietmapBookingDemo from '../../components/VietmapBookingDemo';
import PricingAndDrivers from '../../components/PricingAndDrivers';
import DriverAuthModal from '../components/DriverAuthModal';
import { driverService } from '../services/driverService';

export default function HomePage() {
  const [selectedDriverId, setSelectedDriverId] = useState('1');
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [currentDriver, setCurrentDriver] = useState(null);
  const [urgentTripsCount, setUrgentTripsCount] = useState(0);

  useEffect(() => {
    const driver = driverService.getCurrentDriver();
    setCurrentDriver(driver);
    if (driver) {
      const urgent = driverService.getImminentTrips(driver.id);
      setUrgentTripsCount(urgent.length);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-red-600 selection:text-white">
      {/* Thanh Header / Navigation bar */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between">
          {/* Logo & Nhận diện Thương hiệu */}
          <Link to="/" className="flex items-center gap-3 sm:gap-4 group cursor-pointer no-underline">
            <div className="relative flex items-center justify-center">
              <img
                src="/trunganhcar_logo.png"
                alt="Trung Anh Car Logo"
                className="h-14 sm:h-20 md:h-22 w-auto object-contain filter drop-shadow-[0_4px_16px_rgba(220,38,38,0.35)] group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            <div>
              <span className="text-lg sm:text-2xl font-black tracking-wider text-white block leading-tight font-sans">
                TRUNG ANH CAR
              </span>
              <span className="text-[11px] sm:text-xs text-red-400 font-semibold uppercase tracking-widest block">
                VinFast Electric Luxury
              </span>
            </div>
          </Link>

          {/* Hotline & Khu vực Tài xế */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Nút dành cho Tài xế */}
            {currentDriver ? (
              <Link
                to="/driver/schedule"
                className="relative flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-red-950/80 to-slate-900 border border-red-700/80 hover:border-red-500 text-xs sm:text-sm text-white shadow-md hover:shadow-red-900/40 transition-all no-underline group"
              >
                <img
                  src={currentDriver.avatar}
                  alt={currentDriver.name}
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-red-400"
                />
                <span className="font-bold text-red-300 group-hover:text-white truncate max-w-[90px] sm:max-w-none">
                  {currentDriver.name}
                </span>
                <span className="hidden md:inline text-xs text-slate-400">• Lịch trình 30 ngày</span>

                {/* Badge thông báo nếu có chuyến sắp chạy */}
                {urgentTripsCount > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping absolute -top-1 -right-1" />
                )}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setIsDriverModalOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-slate-900 border border-red-800/60 hover:border-red-500 text-xs sm:text-sm text-slate-200 hover:text-white shadow-md hover:shadow-red-900/40 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-bold text-red-300">Tài Xế</span>
                <span className="hidden sm:inline text-slate-400 text-xs">Đăng nhập / Đăng ký</span>
              </button>
            )}

            {/* Hotline 24/7 */}
            <a
              href="tel:0362.882.882"
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-slate-900/90 border border-slate-700/80 hover:border-red-500 text-xs sm:text-sm text-slate-200 shadow-md hover:shadow-red-900/30 transition-all duration-200 no-underline"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden lg:inline text-slate-400 font-medium">Hotline:</span>
              <span className="font-bold text-red-400 tracking-wide">0362.882.882</span>
            </a>
          </div>
        </div>
      </header>

      {/* Modal Đăng nhập / Đăng ký Tài xế */}
      <DriverAuthModal
        isOpen={isDriverModalOpen}
        onClose={() => setIsDriverModalOpen(false)}
        onLoginSuccess={(driver) => {
          setCurrentDriver(driver);
          const urgent = driverService.getImminentTrips(driver.id);
          setUrgentTripsCount(urgent.length);
        }}
      />

      {/* Banner Quảng Cáo Chiến Dịch Ưu Đãi (Preview Campaign Banner) */}
      <section aria-label="Chiến dịch ưu đãi">
        <CampaignBanner />
      </section>

      {/* Hero Section Giới thiệu Dịch Vụ */}
      <section className="relative pt-4 pb-8 overflow-hidden">
        {/* Ánh sáng nền trang trí tông Crimson & Titan */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-red-600/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/70 border border-red-800/50 text-red-300 text-xs font-semibold mb-4 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>Dịch vụ xe riêng gia đình cao cấp</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Dịch vụ đặt xe Trung Anh <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-red-600">Êm Ái & Đúng Giờ</span>
            </h1>

            <p className="mt-3.5 sm:mt-4 text-sm sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Phục vụ xe điện VinFast màu đỏ hiện đại, nội thất sạch sẽ, không mùi xe dịch vụ.
            </p>

            {/* Bộ 3 Badge cam kết bắt buộc */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs sm:text-sm font-medium">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-slate-200 shadow-md">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Xe điện không mùi
              </span>
              <span className="text-slate-600">•</span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-slate-200 shadow-md">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Đúng giờ 100%
              </span>
              <span className="text-slate-600">•</span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-slate-200 shadow-md">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Giá trọn gói rõ ràng
              </span>
            </div>
          </div>

          {/* KHỐI ĐẶT XE CHÍNH: BẢN ĐỒ VIETMAP + FORM 2 CỘT TÍNH GIÁ & ĐẶT LỊCH */}
          <div id="booking-section" className="mb-14 scroll-mt-24">
            <VietmapBookingDemo initialDriverId={selectedDriverId} />
          </div>

          {/* BẢNG GIÁ DỊCH VỤ VÀ DANH SÁCH TÀI XẾ */}
          <div className="mt-12 pt-10 border-t border-slate-800">
            <PricingAndDrivers onSelectDriver={(id) => setSelectedDriverId(id)} />
          </div>

          {/* SHOWCASE XE VINFAST MÀU ĐỎ THỰC TẾ */}
          <div className="mt-12 pt-10 border-t border-slate-800">
            <div className="text-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-red-500 bg-red-950/60 px-3 py-1 rounded-full border border-red-800/40">
                Phương Tiện Phục Vụ
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-2">
                Showcase Xe Điện VinFast Limo Green Màu Đỏ
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Ngoại thất lịch lãm, không gian hàng ghế sau rộng rãi, khoang cốp chứa 3-4 vali lớn.
              </p>
            </div>
            <VehicleShowcase />
          </div>
        </div>
      </section>

      {/* Footer Chân Trang */}
      <footer className="border-t border-slate-800 bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-3">
            <img
              src="/trunganhcar_logo.png"
              alt="Trung Anh Car Logo"
              className="h-12 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(220,38,38,0.3)]"
            />
            <span className="text-base font-bold tracking-wider text-slate-200">
              TRUNG ANH CAR BOOKING
            </span>
          </div>

          <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
            Dịch vụ xe điện VinFast riêng cao cấp tại Hà Nội & các tỉnh lân cận. Cam kết mang đến trải nghiệm êm ái, lịch sự, không mùi say xe cho mọi gia đình.
          </p>

          <p className="text-[11px] text-slate-600">
            © 2026 Trung Anh Car Booking. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
