import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import VehicleShowcase from '../components/VehicleShowcase';
import CampaignBanner from '../components/CampaignBanner';
import VietmapBookingDemo from '../components/VietmapBookingDemo';
import PricingAndDrivers from '../components/PricingAndDrivers';
import DriverAuthModal from '../components/DriverAuthModal';
import TripLookupModal from '../components/TripLookupModal';
import { driverService } from '../services/driverService';

export default function HomePage() {
    const [selectedDriverId, setSelectedDriverId] = useState('1');
    const [fixedTripData, setFixedTripData] = useState(null);
    const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
    const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);
    const [lookupPhone, setLookupPhone] = useState('');
    const [quickPhoneInput, setQuickPhoneInput] = useState('');
    const [currentDriver, setCurrentDriver] = useState(null);
    const [urgentTripsCount, setUrgentTripsCount] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const driver = driverService.getCurrentDriver();
        setCurrentDriver(driver);
        if (driver) {
            const urgent = driverService.getImminentTrips(driver.id);
            setUrgentTripsCount(urgent.length);
        }
    }, []);

    const handleQuickLookup = (e) => {
        if (e) e.preventDefault();
        if (quickPhoneInput.trim()) {
            setLookupPhone(quickPhoneInput.trim());
        }
        setIsLookupModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-red-600 selection:text-white">
            {/* Thanh Header / Navigation bar (Chuẩn Responsive Mobile chống vỡ layout) */}
            <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-18 sm:h-22 md:h-24 flex items-center justify-between gap-2">
                    {/* Logo & Nhận diện Thương hiệu (Không bao giờ rớt dòng trên Mobile) */}
                    <Link to="/" className="flex items-center gap-2 sm:gap-3.5 group cursor-pointer no-underline shrink-0 min-w-0">
                        <div className="relative flex items-center justify-center shrink-0">
                            <img
                                src="/trunganhcar_logo.png"
                                alt="Trung Anh Car Logo"
                                className="h-11 sm:h-16 md:h-20 w-auto object-contain filter drop-shadow-[0_4px_16px_rgba(220,38,38,0.35)] group-hover:scale-105 transition-transform duration-300"
                            />
                        </div>

                        <div className="min-w-0">
                            <span className="text-base sm:text-xl md:text-2xl font-black tracking-wide text-white block leading-tight font-sans whitespace-nowrap">
                                TRUNG ANH CAR
                            </span>
                            <span className="text-[10px] sm:text-xs text-red-400 font-semibold uppercase tracking-wider block whitespace-nowrap">
                                VinFast Electric Luxury
                            </span>
                        </div>
                    </Link>

                    {/* DESKTOP MENU (md trở lên): Hiện đủ Tra cứu, Tài xế, Hotline */}
                    <div className="hidden md:flex items-center gap-2.5 lg:gap-3">
                        {/* Nút Tra cứu chuyến xe đã đặt */}
                        <button
                            type="button"
                            onClick={() => {
                                setLookupPhone('');
                                setIsLookupModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 lg:gap-2 px-3.5 py-2.5 rounded-full bg-slate-900 border border-slate-700/80 hover:border-red-500 text-xs sm:text-sm text-slate-200 hover:text-white shadow-md hover:shadow-red-900/30 transition-all cursor-pointer"
                            title="Tra cứu lộ trình & trạng thái chuyến xe theo số điện thoại"
                        >
                            <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span className="font-bold text-white">Tra cứu chuyến đi</span>
                        </button>

                        {/* Nút dành cho Tài xế */}
                        {currentDriver ? (
                            <Link
                                to="/driver/schedule"
                                className="relative flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-red-950/80 to-slate-900 border border-red-700/80 hover:border-red-500 text-xs sm:text-sm text-white shadow-md hover:shadow-red-900/40 transition-all no-underline group"
                            >
                                <img
                                    src={currentDriver.avatar}
                                    alt={currentDriver.name}
                                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-red-400 shrink-0"
                                />
                                <span className="font-bold text-red-300 group-hover:text-white truncate max-w-[100px] lg:max-w-none">
                                    {currentDriver.name}
                                </span>
                                <span className="hidden lg:inline text-xs text-slate-400">• Lịch 30 ngày</span>

                                {/* Badge thông báo nếu có chuyến sắp chạy */}
                                {urgentTripsCount > 0 && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping absolute -top-1 -right-1" />
                                )}
                            </Link>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsDriverModalOpen(true)}
                                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-slate-900 border border-red-800/60 hover:border-red-500 text-xs sm:text-sm text-slate-200 hover:text-white shadow-md hover:shadow-red-900/40 transition-all cursor-pointer"
                            >
                                <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="font-bold text-red-300">Cổng tài xế</span>
                            </button>
                        )}

                        {/* Nút vào Quản trị Admin */}
                        {/* <Link
                            to="/admin"
                            className="px-3 py-2 rounded-full bg-slate-900 border border-slate-700/80 hover:border-red-500 text-xs text-slate-300 hover:text-white transition-all flex items-center gap-1.5 no-underline shrink-0"
                            title="Quản trị CRUD hệ thống"
                        >
                            <span>⚙️ Admin</span>
                        </Link> */}

                        {/* Hotline 24/7 */}
                        <a
                            href="tel:0362.882.882"
                            className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-900/90 border border-slate-700/80 hover:border-red-500 text-xs sm:text-sm text-slate-200 shadow-md hover:shadow-red-900/30 transition-all duration-200 no-underline shrink-0"
                        >
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="hidden lg:inline text-slate-400 font-medium">Hotline:</span>
                            <span className="font-bold text-red-400 tracking-wide">0362.882.882</span>
                        </a>
                    </div>

                    {/* MOBILE ACTIONS (< md): Nút gọi nhanh & Menu Hamburger */}
                    <div className="flex md:hidden items-center gap-1.5 shrink-0">
                        {/* Nút gọi hotline nhanh trên mobile */}
                        <a
                            href="tel:0362.882.882"
                            className="flex items-center gap-1.5 px-2.5 py-2 rounded-full bg-slate-900 border border-slate-700/90 text-red-400 font-bold text-xs no-underline active:scale-95 shadow-sm"
                            title="Gọi Hotline ngay"
                        >
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <span className="tracking-tight text-[11px] sm:text-xs">0362.882.882</span>
                        </a>

                        {/* Nút mở Mobile Menu Hamburger (☰ / ✕) */}
                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 hover:border-red-500 text-white flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-md"
                            aria-label="Mở menu tùy chọn"
                        >
                            {isMobileMenuOpen ? (
                                <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* MOBILE MENU DROPDOWN (Khi bấm nút menu trên điện thoại) */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-slate-800 bg-slate-950/98 backdrop-blur-xl px-4 py-4 space-y-2.5 shadow-2xl animate-in slide-in-from-top-2 duration-200">
                        {/* 1. Tra cứu chuyến xe theo SĐT */}
                        <button
                            type="button"
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                setLookupPhone('');
                                setIsLookupModalOpen(true);
                            }}
                            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-red-500 text-left cursor-pointer transition-all active:scale-98"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-red-950/80 text-red-400 border border-red-800/60 flex items-center justify-center shrink-0">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white leading-tight">Tra cứu chuyến xe</p>
                                    <p className="text-[11px] text-slate-400">Xem lộ trình & vị trí tài xế theo SĐT</p>
                                </div>
                            </div>
                            <span className="text-xs text-red-400 font-bold">Mở →</span>
                        </button>

                        {/* 2. Cổng Tài xế / Lịch trình 30 ngày */}
                        {currentDriver ? (
                            <Link
                                to="/driver/schedule"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-red-950/60 to-slate-900 border border-red-800/80 hover:border-red-500 text-left no-underline transition-all active:scale-98"
                            >
                                <div className="flex items-center gap-3">
                                    <img
                                        src={currentDriver.avatar}
                                        alt={currentDriver.name}
                                        className="w-9 h-9 rounded-xl object-cover border-2 border-red-500 shrink-0"
                                    />
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-sm font-bold text-white leading-tight">{currentDriver.name}</p>
                                            {urgentTripsCount > 0 && (
                                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-red-600 text-white animate-pulse">
                                                    Sắp chạy
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-400">Xem & chỉnh sửa lịch trình 30 ngày</p>
                                    </div>
                                </div>
                                <span className="text-xs text-red-400 font-bold">Vào lịch →</span>
                            </Link>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    setIsDriverModalOpen(true);
                                }}
                                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-red-500 text-left cursor-pointer transition-all active:scale-98"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-slate-800 text-red-400 border border-slate-700 flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white leading-tight">Cổng Tài Xế</p>
                                        <p className="text-[11px] text-slate-400">Đăng nhập tài xế xem lịch chạy</p>
                                    </div>
                                </div>
                                <span className="text-xs text-red-400 font-bold">Đăng nhập →</span>
                            </button>
                        )}

                        {/* 3. Phím tắt nhanh đến các phần của trang */}
                        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    const el = document.getElementById('booking-trip-info') || document.getElementById('booking-section');
                                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                                className="p-2.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800 text-center font-medium cursor-pointer"
                            >
                                📍 Đặt xe trực tuyến
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    const el = document.getElementById('pricing-section');
                                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                                className="p-2.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800 text-center font-medium cursor-pointer"
                            >
                                💰 Tuyến cố định
                            </button>
                        </div>

                        {/* 4. Quản trị hệ thống Admin */}
                        <div className="pt-2 border-t border-slate-800/80">
                            <Link
                                to="/admin"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-bold text-slate-200 hover:text-white no-underline"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">⚙️</span>
                                    <span>Trang Quản Trị Admin (CRUD)</span>
                                </div>
                                <span className="text-red-400">Vào quản trị →</span>
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            {/* Modal Tra cứu chuyến xe theo SĐT */}
            <TripLookupModal
                isOpen={isLookupModalOpen}
                onClose={() => setIsLookupModalOpen(false)}
                initialPhone={lookupPhone}
            />

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
                            <span>Dịch vụ đặt xe cao cấp</span>
                        </div>

                        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                            Dịch vụ đặt xe Trung Anh <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-red-600">
                                Êm Ái & Đúng Giờ
                            </span>
                        </h1>

                        <p className="mt-3.5 sm:mt-4 text-sm sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
                            Phục vụ xe điện VinFast hiện đại, nội thất sạch sẽ, không mùi xe dịch vụ.
                        </p>

                        {/* Thanh tra cứu nhanh chuyến đi theo số điện thoại */}
                        <div className="mt-6 max-w-lg mx-auto">
                            <form
                                onSubmit={handleQuickLookup}
                                className="p-1.5 sm:p-2 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-xl flex items-center gap-2 transition-all"
                            >
                                <div className="pl-2 sm:pl-3 flex items-center gap-2 text-slate-400 shrink-0">
                                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <span className="text-xs font-semibold text-slate-300 hidden sm:inline">Tra cứu:</span>
                                </div>
                                <input
                                    type="tel"
                                    placeholder="Nhập SĐT để tra cứu chuyến đã đặt..."
                                    value={quickPhoneInput}
                                    onChange={(e) => setQuickPhoneInput(e.target.value)}
                                    className="flex-1 bg-transparent border-0 px-2 py-1.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-950/50 cursor-pointer shrink-0"
                                >
                                    Tra cứu
                                </button>
                            </form>
                        </div>

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
                        <VietmapBookingDemo initialDriverId={selectedDriverId} fixedTripData={fixedTripData} />
                    </div>

                    {/* BẢNG GIÁ DỊCH VỤ VÀ DANH SÁCH TÀI XẾ */}
                    <div className="mt-12 pt-10 border-t border-slate-800">
                        <PricingAndDrivers
                            onSelectDriver={(id) => setSelectedDriverId(id)}
                            onSelectFixedTrip={(trip) => setFixedTripData(trip)}
                        />
                    </div>

                    {/* SHOWCASE XE VINFAST MÀU ĐỎ THỰC TẾ */}
                    <div className="mt-12 pt-10 border-t border-slate-800">
                        <div className="text-center mb-6">
                            <span className="text-xs font-bold uppercase tracking-wider text-red-500 bg-red-950/60 px-3 py-1 rounded-full border border-red-800/40">
                                Phương Tiện Phục Vụ
                            </span>
                            <h2 className="text-xl sm:text-2xl font-bold text-white mt-2">
                                Showcase Xe Điện VinFast Limo Green
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
                        Dịch vụ đặt xe VinFast cao cấp tại Hà Nội, Nam Định & các tỉnh lân cận. Cam kết mang đến trải nghiệm êm ái, lịch sự, an toàn cho mọi gia đình.
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-400 py-1">
                        <Link to="/driver/schedule" className="hover:text-red-400 transition-colors no-underline">
                            Cổng Tài Xế
                        </Link>
                        <span>•</span>
                        <Link to="/admin" className="text-red-400 font-semibold hover:text-red-300 transition-colors no-underline flex items-center gap-1">
                            <span>⚙️ Quản Trị Admin</span>
                        </Link>
                        <span>•</span>
                        <a href="tel:0362.882.882" className="hover:text-red-400 transition-colors no-underline">
                            Hotline 0362.882.882
                        </a>
                    </div>

                    <p className="text-[11px] text-slate-600">
                        © 2026 Trung Anh Car Booking. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
