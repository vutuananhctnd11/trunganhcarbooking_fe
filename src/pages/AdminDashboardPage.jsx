import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/adminService';

function formatVND(amount) {
    if (typeof amount !== 'number') {
        const parsed = Number(amount);
        if (isNaN(parsed)) return '0 đ';
        amount = parsed;
    }
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

export default function AdminDashboardPage() {
    // Tab đang chọn
    const [activeTab, setActiveTab] = useState('DRIVERS'); // DRIVERS | PROMOTIONS | DISCOUNTS | BANNERS | BOOKINGS

    // State Dữ liệu
    const [drivers, setDrivers] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [discounts, setDiscounts] = useState([]);
    const [banners, setBanners] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // State Modal Thêm / Sửa Tài Xế
    const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);
    const [driverForm, setDriverForm] = useState({
        fullName: '',
        phone: '',
        licensePlate: '',
        vehicleModel: 'VinFast Limo Green (VF e34)',
        vehicleColor: '🔴 Đỏ Crimson',
        seatCount: 5,
        experienceYears: 5,
        avatarUrl: '',
        isActive: true,
    });

    // State Modal Từ chối Tài xế
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectingDriverId, setRejectingDriverId] = useState(null);
    const [rejectReason, setRejectReason] = useState('Thông tin giấy tờ xe chưa hợp lệ');

    // State Modal Thêm / Sửa Gói Cước
    const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState(null);
    const [promoForm, setPromoForm] = useState({
        title: '',
        slug: '',
        badgeText: 'HOT DEAL',
        description: '',
        dropoffAddress: '',
        travelTime: 120,
        price: 900000,
        priceUnit: '/ Trọn gói 1 chiều',
        extraKmPrice: 10000,
        extraKmNote: '10.000 đ/km cự ly phát sinh',
        waitingFeeNote: 'Miễn phí chờ 30 phút',
        featuresText: 'Bao trọn vé cầu đường cao tốc\nNước suối và khăn lạnh miễn phí',
        buttonText: 'Đặt chuyến ngay',
        displayOrder: 1,
        isFeatured: true,
        isActive: true,
    });

    // State Modal Thêm / Sửa Mã Giảm Giá
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState(null);
    const [discountForm, setDiscountForm] = useState({
        code: '',
        title: '',
        description: '',
        discountType: 'FIXED_AMOUNT',
        discountValue: 50000,
        minTripPrice: 300000,
        usageLimit: 100,
        isActive: true,
    });

    // State Modal Thêm / Sửa Banner
    const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [bannerForm, setBannerForm] = useState({
        title: '',
        tagline: '',
        badge: 'HOT DEAL',
        image: '',
        alt: '',
        actionText: 'Đặt xe ngay',
        actionUrl: '/#booking-trip-info',
        displayOrder: 1,
        status: 'ACTIVE',
        isGraphicBanner: true,
    });

    // State Tra cứu đơn hàng
    const [lookupPhone, setLookupPhone] = useState('0362882882');
    const [lookupResults, setLookupResults] = useState([]);
    const [isLookingUp, setIsLookingUp] = useState(false);

    // Filter Tài xế
    const [driverFilter, setDriverFilter] = useState('ALL'); // ALL | PENDING | APPROVED

    // Hiển thị toast thông báo
    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3500);
    };

    // Tải dữ liệu ban đầu
    const loadAllData = async () => {
        setIsLoading(true);
        try {
            const [dList, pList, dcList, bList] = await Promise.all([
                adminService.getDrivers(),
                adminService.getPromotionTrips(),
                adminService.getDiscounts(),
                adminService.getBanners(),
            ]);
            setDrivers(dList);
            setPromotions(pList);
            setDiscounts(dcList);
            setBanners(bList);
        } catch (e) {
            console.error('Error loading admin data:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    // ==========================================
    // HANDLERS TÀI XẾ
    // ==========================================
    const handleOpenDriverModal = (driver = null) => {
        if (driver) {
            setEditingDriver(driver);
            setDriverForm({
                fullName: driver.fullName || '',
                phone: driver.phone || '',
                licensePlate: driver.licensePlate || '',
                vehicleModel: driver.vehicleModel || 'VinFast Limo Green (VF e34)',
                vehicleColor: driver.vehicleColor || '🔴 Đỏ Crimson',
                seatCount: driver.seatCount || 5,
                experienceYears: driver.experienceYears || 5,
                avatarUrl: driver.avatarUrl || '',
                isActive: driver.isActive !== undefined ? driver.isActive : true,
            });
        } else {
            setEditingDriver(null);
            setDriverForm({
                fullName: '',
                phone: '',
                licensePlate: '',
                vehicleModel: 'VinFast Limo Green (VF e34)',
                vehicleColor: '🔴 Đỏ Crimson',
                seatCount: 5,
                experienceYears: 5,
                avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                isActive: true,
            });
        }
        setIsDriverModalOpen(true);
    };

    const handleSaveDriver = async (e) => {
        e.preventDefault();
        if (editingDriver) {
            const res = await adminService.updateDriver(editingDriver.id, driverForm);
            if (res.success) {
                showToast(`Đã cập nhật tài xế ${driverForm.fullName}`);
            }
        } else {
            const res = await adminService.createDriver(driverForm);
            if (res.success) {
                showToast(`Đã thêm mới tài xế ${driverForm.fullName}`);
            }
        }
        setIsDriverModalOpen(false);
        const updated = await adminService.getDrivers();
        setDrivers(updated);
    };

    const handleDeleteDriver = async (id, name) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa tài xế "${name}"?`)) {
            await adminService.deleteDriver(id);
            showToast(`Đã xóa tài xế "${name}"`);
            const updated = await adminService.getDrivers();
            setDrivers(updated);
        }
    };

    const handleApproveDriver = async (id, name) => {
        await adminService.approveDriver(id);
        showToast(`Đã phê duyệt tài xế "${name}" thành công!`);
        const updated = await adminService.getDrivers();
        setDrivers(updated);
    };

    const handleOpenRejectModal = (id) => {
        setRejectingDriverId(id);
        setRejectReason('Giấy tờ xe chưa hợp lệ hoặc thiếu chứng nhận lái xe');
        setIsRejectModalOpen(true);
    };

    const handleConfirmReject = async () => {
        if (rejectingDriverId) {
            await adminService.rejectDriver(rejectingDriverId, rejectReason);
            showToast('Đã từ chối tài xế kèm lý do.');
            setIsRejectModalOpen(false);
            const updated = await adminService.getDrivers();
            setDrivers(updated);
        }
    };

    // ==========================================
    // HANDLERS GÓI CƯỚC
    // ==========================================
    const handleOpenPromoModal = (item = null) => {
        if (item) {
            setEditingPromo(item);
            setPromoForm({
                title: item.title || '',
                slug: item.slug || '',
                badgeText: item.badgeText || 'HOT DEAL',
                description: item.description || '',
                dropoffAddress: item.dropoffAddress || '',
                travelTime: item.travelTime || 120,
                price: item.price || 900000,
                priceUnit: item.priceUnit || '/ Trọn gói 1 chiều',
                extraKmPrice: item.extraKmPrice || 10000,
                extraKmNote: item.extraKmNote || '10.000 đ/km cự ly phát sinh',
                waitingFeeNote: item.waitingFeeNote || 'Miễn phí chờ 30 phút',
                featuresText: Array.isArray(item.features) ? item.features.join('\n') : '',
                buttonText: item.buttonText || 'Đặt chuyến ngay',
                displayOrder: item.displayOrder || 1,
                isFeatured: item.isFeatured !== undefined ? item.isFeatured : true,
                isActive: item.isActive !== undefined ? item.isActive : true,
            });
        } else {
            setEditingPromo(null);
            setPromoForm({
                title: '',
                slug: '',
                badgeText: 'HOT DEAL',
                description: '',
                dropoffAddress: '',
                travelTime: 120,
                price: 900000,
                priceUnit: '/ Trọn gói 1 chiều',
                extraKmPrice: 10000,
                extraKmNote: '10.000 đ/km cự ly phát sinh',
                waitingFeeNote: 'Miễn phí chờ 30 phút',
                featuresText: 'Bao trọn vé cầu đường cao tốc\nNước suối và khăn lạnh miễn phí\nĐón trả tận nhà êm ái',
                buttonText: 'Đặt chuyến ngay',
                displayOrder: promotions.length + 1,
                isFeatured: true,
                isActive: true,
            });
        }
        setIsPromoModalOpen(true);
    };

    const handleSavePromo = async (e) => {
        e.preventDefault();
        const payload = {
            ...promoForm,
            slug: promoForm.slug || promoForm.title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            features: promoForm.featuresText.split('\n').map((s) => s.trim()).filter(Boolean),
        };
        if (editingPromo) {
            await adminService.updatePromotionTrip(editingPromo.id, payload);
            showToast(`Đã cập nhật gói "${payload.title}"`);
        } else {
            await adminService.createPromotionTrip(payload);
            showToast(`Đã thêm gói cước mới "${payload.title}"`);
        }
        setIsPromoModalOpen(false);
        const updated = await adminService.getPromotionTrips();
        setPromotions(updated);
    };

    const handleDeletePromo = async (id, title) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa gói cước "${title}"?`)) {
            await adminService.deletePromotionTrip(id);
            showToast(`Đã xóa gói cước "${title}"`);
            const updated = await adminService.getPromotionTrips();
            setPromotions(updated);
        }
    };

    // ==========================================
    // HANDLERS MÃ GIẢM GIÁ
    // ==========================================
    const handleOpenDiscountModal = (item = null) => {
        if (item) {
            setEditingDiscount(item);
            setDiscountForm({
                code: item.code || '',
                title: item.title || '',
                description: item.description || '',
                discountType: item.discountType || 'FIXED_AMOUNT',
                discountValue: item.discountValue || 50000,
                minTripPrice: item.minTripPrice || 300000,
                usageLimit: item.usageLimit || 100,
                isActive: item.isActive !== undefined ? item.isActive : true,
            });
        } else {
            setEditingDiscount(null);
            setDiscountForm({
                code: '',
                title: '',
                description: '',
                discountType: 'FIXED_AMOUNT',
                discountValue: 50000,
                minTripPrice: 300000,
                usageLimit: 100,
                isActive: true,
            });
        }
        setIsDiscountModalOpen(true);
    };

    const handleSaveDiscount = async (e) => {
        e.preventDefault();
        const payload = {
            ...discountForm,
            code: discountForm.code.toUpperCase().trim(),
        };
        if (editingDiscount) {
            await adminService.updateDiscount(editingDiscount.id, payload);
            showToast(`Đã cập nhật mã ${payload.code}`);
        } else {
            await adminService.createDiscount(payload);
            showToast(`Đã tạo mã giảm giá mới ${payload.code}`);
        }
        setIsDiscountModalOpen(false);
        const updated = await adminService.getDiscounts();
        setDiscounts(updated);
    };

    const handleDeleteDiscount = async (id, code) => {
        if (window.confirm(`Bạn có chắc muốn xóa mã giảm giá "${code}"?`)) {
            await adminService.deleteDiscount(id);
            showToast(`Đã xóa voucher ${code}`);
            const updated = await adminService.getDiscounts();
            setDiscounts(updated);
        }
    };

    // ==========================================
    // HANDLERS BANNERS
    // ==========================================
    const handleOpenBannerModal = (item = null) => {
        if (item) {
            setEditingBanner(item);
            setBannerForm({
                title: item.title || '',
                tagline: item.tagline || '',
                badge: item.badge || 'HOT DEAL',
                image: item.image || '',
                alt: item.alt || '',
                actionText: item.actionText || 'Đặt xe ngay',
                actionUrl: item.actionUrl || '/#booking-trip-info',
                displayOrder: item.displayOrder || 1,
                status: item.status || 'ACTIVE',
                isGraphicBanner: item.isGraphicBanner !== undefined ? item.isGraphicBanner : true,
            });
        } else {
            setEditingBanner(null);
            setBannerForm({
                title: '',
                tagline: '',
                badge: 'HOT DEAL 900K',
                image: 'https://res.cloudinary.com/dzueehiwb/image/upload/v1793693693/banner_vinfast_limo_red.png',
                alt: 'Banner xe VinFast',
                actionText: 'Đặt xe ngay',
                actionUrl: '/#booking-trip-info',
                displayOrder: banners.length + 1,
                status: 'ACTIVE',
                isGraphicBanner: true,
            });
        }
        setIsBannerModalOpen(true);
    };

    const handleSaveBanner = async (e) => {
        e.preventDefault();
        if (editingBanner) {
            await adminService.updateBanner(editingBanner.id, bannerForm);
            showToast(`Đã cập nhật banner "${bannerForm.title}"`);
        } else {
            await adminService.createBanner(bannerForm);
            showToast(`Đã tạo banner mới "${bannerForm.title}"`);
        }
        setIsBannerModalOpen(false);
        const updated = await adminService.getBanners();
        setBanners(updated);
    };

    const handleDeleteBanner = async (id, title) => {
        if (window.confirm(`Bạn có chắc muốn xóa banner "${title}"?`)) {
            await adminService.deleteBanner(id);
            showToast(`Đã xóa banner "${title}"`);
            const updated = await adminService.getBanners();
            setBanners(updated);
        }
    };

    // ==========================================
    // HANDLERS TRA CỨU ĐƠN
    // ==========================================
    const handleLookup = async (e) => {
        e.preventDefault();
        setIsLookingUp(true);
        try {
            const list = await adminService.lookupBookingsByPhone(lookupPhone);
            setLookupResults(list);
            if (list.length === 0) {
                showToast(`Không tìm thấy đơn nào của SĐT ${lookupPhone}`);
            }
        } finally {
            setIsLookingUp(false);
        }
    };

    // Lọc danh sách tài xế theo tab filter
    const filteredDrivers = drivers.filter((d) => {
        if (driverFilter === 'PENDING') return d.approvalStatus === 'PENDING';
        if (driverFilter === 'APPROVED') return d.approvalStatus === 'APPROVED';
        return true;
    });

    const pendingCount = drivers.filter((d) => d.approvalStatus === 'PENDING').length;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
            {/* TOAST THÔNG BÁO */}
            {toastMessage && (
                <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-sm shadow-2xl shadow-red-950 flex items-center gap-2 animate-in slide-in-from-top-4">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* HEADER ADMIN */}
            <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-red-700 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-red-950/60">
                            TA
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                                    Trung Anh Car Admin
                                </h1>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                                    Control Panel
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 hidden sm:block">
                                Quản trị toàn bộ dữ liệu CRUD hệ thống theo chuẩn Postman
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link
                            to="/driver/schedule"
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5"
                        >
                            <span>Cổng Tài Xế</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        </Link>
                        <Link
                            to="/"
                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-950/60"
                        >
                            Về Trang Chủ
                        </Link>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT CONTAINER */}
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 flex-1 w-full space-y-6">
                {/* 1. TOP STATS CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div
                        onClick={() => setActiveTab('DRIVERS')}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                            activeTab === 'DRIVERS'
                                ? 'bg-gradient-to-br from-red-950/50 via-slate-900 to-slate-900 border-red-500 shadow-xl shadow-red-950/40 ring-1 ring-red-500/50'
                                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-400">Tài xế</span>
                            <span className="text-lg">🚗</span>
                        </div>
                        <p className="text-2xl font-black text-white">{drivers.length}</p>
                        {pendingCount > 0 ? (
                            <span className="inline-block mt-1 text-[10px] font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-800/80 animate-pulse">
                                {pendingCount} tài xế chờ duyệt
                            </span>
                        ) : (
                            <span className="text-[11px] text-slate-500 block mt-1">Đã kiểm duyệt đầy đủ</span>
                        )}
                    </div>

                    <div
                        onClick={() => setActiveTab('PROMOTIONS')}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                            activeTab === 'PROMOTIONS'
                                ? 'bg-gradient-to-br from-red-950/50 via-slate-900 to-slate-900 border-red-500 shadow-xl shadow-red-950/40 ring-1 ring-red-500/50'
                                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-400">Gói cố định</span>
                            <span className="text-lg">🏷️</span>
                        </div>
                        <p className="text-2xl font-black text-white">{promotions.length}</p>
                        <span className="text-[11px] text-slate-500 block mt-1">Tuyến Nội Bài, Hạ Long...</span>
                    </div>

                    <div
                        onClick={() => setActiveTab('DISCOUNTS')}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                            activeTab === 'DISCOUNTS'
                                ? 'bg-gradient-to-br from-red-950/50 via-slate-900 to-slate-900 border-red-500 shadow-xl shadow-red-950/40 ring-1 ring-red-500/50'
                                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-400">Mã giảm giá</span>
                            <span className="text-lg">🎟️</span>
                        </div>
                        <p className="text-2xl font-black text-white">{discounts.length}</p>
                        <span className="text-[11px] text-slate-500 block mt-1">Voucher 50K, 100K...</span>
                    </div>

                    <div
                        onClick={() => setActiveTab('BANNERS')}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                            activeTab === 'BANNERS'
                                ? 'bg-gradient-to-br from-red-950/50 via-slate-900 to-slate-900 border-red-500 shadow-xl shadow-red-950/40 ring-1 ring-red-500/50'
                                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-400">Banners</span>
                            <span className="text-lg">🖼️</span>
                        </div>
                        <p className="text-2xl font-black text-white">{banners.length}</p>
                        <span className="text-[11px] text-slate-500 block mt-1">Chiến dịch hiển thị trang chủ</span>
                    </div>
                </div>

                {/* 2. TABS NAVIGATOR (TOUCH-FRIENDLY SCROLL TRÊN MOBILE) */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800">
                    <button
                        type="button"
                        onClick={() => setActiveTab('DRIVERS')}
                        className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 border-b-2 ${
                            activeTab === 'DRIVERS'
                                ? 'border-red-500 text-white bg-slate-900'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <span>🚗 Quản lý Tài xế</span>
                        {pendingCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-600 text-white font-black animate-pulse">
                                {pendingCount}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('PROMOTIONS')}
                        className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 border-b-2 ${
                            activeTab === 'PROMOTIONS'
                                ? 'border-red-500 text-white bg-slate-900'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <span>🏷️ Gói cước Chuyến cố định</span>
                        <span className="text-[11px] text-slate-500">({promotions.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('DISCOUNTS')}
                        className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 border-b-2 ${
                            activeTab === 'DISCOUNTS'
                                ? 'border-red-500 text-white bg-slate-900'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <span>🎟️ Mã giảm giá (Vouchers)</span>
                        <span className="text-[11px] text-slate-500">({discounts.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('BANNERS')}
                        className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 border-b-2 ${
                            activeTab === 'BANNERS'
                                ? 'border-red-500 text-white bg-slate-900'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <span>🖼️ Banners quảng cáo</span>
                        <span className="text-[11px] text-slate-500">({banners.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('BOOKINGS')}
                        className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 border-b-2 ${
                            activeTab === 'BOOKINGS'
                                ? 'border-red-500 text-white bg-slate-900'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <span>🔍 Tra cứu Đơn đặt xe</span>
                    </button>
                </div>

                {/* 3. NỘI DUNG TỪNG TAB */}

                {/* TAB 1: DRIVERS */}
                {activeTab === 'DRIVERS' && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDriverFilter('ALL')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        driverFilter === 'ALL'
                                            ? 'bg-red-600 text-white'
                                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                                    }`}
                                >
                                    Tất cả ({drivers.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDriverFilter('PENDING')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                        driverFilter === 'PENDING'
                                            ? 'bg-amber-600 text-white'
                                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                                    }`}
                                >
                                    <span>Chờ duyệt</span>
                                    {pendingCount > 0 && (
                                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-600 text-white font-extrabold">
                                            {pendingCount}
                                        </span>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDriverFilter('APPROVED')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        driverFilter === 'APPROVED'
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                                    }`}
                                >
                                    Đã duyệt ({drivers.filter((d) => d.approvalStatus === 'APPROVED').length})
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleOpenDriverModal()}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-950/60 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Thêm Tài Xế Mới (API 5.6)</span>
                            </button>
                        </div>

                        {/* DANH SÁCH TÀI XẾ (RESPONSIVE CARDS & TABLE) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {filteredDrivers.map((driver) => {
                                const isPending = driver.approvalStatus === 'PENDING';
                                const isApproved = driver.approvalStatus === 'APPROVED';
                                return (
                                    <div
                                        key={driver.id}
                                        className={`p-4 rounded-2xl border transition-all duration-200 relative bg-slate-900/90 shadow-lg ${
                                            isPending
                                                ? 'border-amber-600/80 bg-gradient-to-b from-amber-950/30 to-slate-900'
                                                : 'border-slate-800 hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <img
                                                    src={driver.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                                                    alt={driver.fullName}
                                                    className="w-12 h-12 rounded-xl object-cover border-2 border-red-500 shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                                                        {driver.fullName}
                                                    </h3>
                                                    <p className="text-xs text-red-400 font-mono font-semibold">{driver.phone}</p>
                                                </div>
                                            </div>

                                            {isPending ? (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/50 shrink-0 animate-pulse">
                                                    Chờ duyệt
                                                </span>
                                            ) : isApproved ? (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shrink-0">
                                                    Đã duyệt
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/50 shrink-0">
                                                    Từ chối
                                                </span>
                                            )}
                                        </div>

                                        <div className="my-3 py-2.5 border-y border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-slate-400 block text-[11px]">Dòng xe:</span>
                                                <span className="font-semibold text-white truncate block">
                                                    {driver.vehicleModel || 'VinFast Limo'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[11px]">Biển số:</span>
                                                <span className="font-mono font-bold text-black bg-white px-1.5 py-0.2 rounded text-[11px] inline-block">
                                                    {driver.licensePlate || '30K-999.88'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[11px]">Kinh nghiệm:</span>
                                                <span className="font-semibold text-slate-200">
                                                    {driver.experienceYears || 5} năm ({driver.seatCount || 5} chỗ)
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block text-[11px]">Đánh giá:</span>
                                                <span className="text-amber-400 font-bold">★ {driver.rating || 5.0}</span>
                                            </div>
                                        </div>

                                        {/* NÚT THAO TÁC DUYỆT / SỬA / XÓA */}
                                        <div className="flex items-center justify-between gap-1.5 pt-1">
                                            {isPending ? (
                                                <div className="flex items-center gap-1.5 w-full">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApproveDriver(driver.id, driver.fullName)}
                                                        className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                                                    >
                                                        Duyệt tài xế (API 5.3)
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenRejectModal(driver.id)}
                                                        className="py-1.5 px-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold text-xs border border-rose-800 transition-all active:scale-95 cursor-pointer"
                                                    >
                                                        Từ chối
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenDriverModal(driver)}
                                                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
                                                    >
                                                        Sửa (PUT 5.7)
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteDriver(driver.id, driver.fullName)}
                                                        className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 text-xs font-semibold transition-all border border-red-900/60 cursor-pointer"
                                                    >
                                                        Xóa (DEL 5.9)
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* TAB 2: PROMOTION TRIPS */}
                {activeTab === 'PROMOTIONS' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base sm:text-lg font-extrabold text-white">
                                Danh sách Gói cước Chuyến cố định (API 7.2)
                            </h2>
                            <button
                                type="button"
                                onClick={() => handleOpenPromoModal()}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-950/60 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Thêm Gói Cước Mới (API 7.5)</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {promotions.map((promo) => (
                                <div
                                    key={promo.id}
                                    className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-xl flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-950 text-red-400 border border-red-800">
                                                {promo.badgeText || 'HOT DEAL'}
                                            </span>
                                            <span className="text-xs text-slate-500 font-mono">#{promo.id} • Thứ tự: {promo.displayOrder}</span>
                                        </div>
                                        <h3 className="text-base font-extrabold text-white leading-tight mb-1">
                                            {promo.title}
                                        </h3>
                                        <p className="text-xs text-slate-400 line-clamp-2 mb-3">{promo.description}</p>

                                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 mb-3 space-y-1">
                                            <div className="flex items-baseline justify-between">
                                                <span className="text-[11px] text-slate-400">Giá trọn gói:</span>
                                                <span className="text-lg font-black text-amber-400 font-mono">
                                                    {formatVND(promo.price)}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 truncate">Điểm đến: {promo.dropoffAddress}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenPromoModal(promo)}
                                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
                                        >
                                            Sửa (PUT 7.6)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeletePromo(promo.id, promo.title)}
                                            className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 text-xs font-semibold transition-all border border-red-900/60 cursor-pointer"
                                        >
                                            Xóa (DEL 7.7)
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 3: DISCOUNTS */}
                {activeTab === 'DISCOUNTS' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base sm:text-lg font-extrabold text-white">
                                Quản lý Mã Giảm Giá / Voucher (API 8.3)
                            </h2>
                            <button
                                type="button"
                                onClick={() => handleOpenDiscountModal()}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-950/60 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Thêm Voucher Mới (API 8.6)</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {discounts.map((voucher) => (
                                <div
                                    key={voucher.id}
                                    className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-xl flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <span className="px-3 py-1 rounded-lg text-xs font-mono font-black bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md">
                                                {voucher.code}
                                            </span>
                                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                                                {voucher.discountType === 'PERCENTAGE' ? `Giảm ${voucher.discountValue}%` : `Giảm ${formatVND(voucher.discountValue)}`}
                                            </span>
                                        </div>

                                        <h3 className="text-sm font-bold text-white mb-1">{voucher.title}</h3>
                                        <p className="text-xs text-slate-400 mb-3">{voucher.description}</p>

                                        <div className="text-[11px] text-slate-400 space-y-1 mb-3">
                                            <p>Đơn tối thiểu: <strong className="text-slate-200">{formatVND(voucher.minTripPrice || 0)}</strong></p>
                                            <p>Lượt dùng: <strong className="text-slate-200">{voucher.usedCount || 0} / {voucher.usageLimit || '∞'}</strong></p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenDiscountModal(voucher)}
                                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
                                        >
                                            Sửa (PUT 8.7)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteDiscount(voucher.id, voucher.code)}
                                            className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 text-xs font-semibold transition-all border border-red-900/60 cursor-pointer"
                                        >
                                            Xóa (DEL 8.8)
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 4: BANNERS */}
                {activeTab === 'BANNERS' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base sm:text-lg font-extrabold text-white">
                                Quản lý Banner Quảng cáo (API 9.2)
                            </h2>
                            <button
                                type="button"
                                onClick={() => handleOpenBannerModal()}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-950/60 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Thêm Banner Mới (API 9.4)</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {banners.map((banner) => (
                                <div
                                    key={banner.id}
                                    className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-xl flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-950 text-red-400 border border-red-800">
                                                {banner.badge || 'PROMOTION'}
                                            </span>
                                            <span className="text-xs text-slate-500">Thứ tự: {banner.displayOrder}</span>
                                        </div>

                                        <h3 className="text-base font-extrabold text-white mb-1">{banner.title}</h3>
                                        <p className="text-xs text-slate-400 mb-3">{banner.tagline}</p>

                                        {banner.image && (
                                            <div className="h-32 rounded-xl overflow-hidden mb-3 bg-slate-950 border border-slate-800">
                                                <img
                                                    src={banner.image}
                                                    alt={banner.alt || banner.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenBannerModal(banner)}
                                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
                                        >
                                            Sửa (PUT 9.5)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteBanner(banner.id, banner.title)}
                                            className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 text-xs font-semibold transition-all border border-red-900/60 cursor-pointer"
                                        >
                                            Xóa (DEL 9.6)
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 5: BOOKINGS LOOKUP */}
                {activeTab === 'BOOKINGS' && (
                    <div className="space-y-4">
                        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-xl">
                            <h2 className="text-base sm:text-lg font-extrabold text-white mb-1">
                                Tra cứu Lịch sử Chuyến xe theo Số điện thoại (API 1.4 & 1.5)
                            </h2>
                            <p className="text-xs text-slate-400 mb-4">
                                Xem thông tin các đơn đặt xe, mã chuyến, lộ trình đón trả và giá cước
                            </p>

                            <form onSubmit={handleLookup} className="flex gap-2 max-w-md">
                                <input
                                    type="tel"
                                    value={lookupPhone}
                                    onChange={(e) => setLookupPhone(e.target.value)}
                                    placeholder="Nhập SĐT khách hàng (VD: 0362882882)"
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-red-500"
                                />
                                <button
                                    type="submit"
                                    disabled={isLookingUp}
                                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-md transition-all disabled:opacity-50"
                                >
                                    {isLookingUp ? 'Đang tìm...' : 'Tra cứu'}
                                </button>
                            </form>
                        </div>

                        {lookupResults.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-slate-300">
                                    Tìm thấy {lookupResults.length} chuyến xe:
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    {lookupResults.map((trip, idx) => (
                                        <div
                                            key={trip.id || idx}
                                            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-lg"
                                        >
                                            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                                <span className="text-sm font-mono font-bold text-red-400">
                                                    {trip.tripCode || `TAC-${trip.id}`}
                                                </span>
                                                <span className="text-xs text-slate-400 font-mono">
                                                    {trip.pickupDate} lúc {trip.pickupTime}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-300">
                                                <strong className="text-emerald-400">Đón:</strong> {trip.pickupAddress}
                                            </p>
                                            <p className="text-xs text-slate-300">
                                                <strong className="text-rose-400">Trả:</strong> {trip.dropoffAddress}
                                            </p>
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                                                <span className="text-slate-400">Khách: {trip.customerName} ({trip.customerPhone})</span>
                                                <span className="text-amber-400 font-bold font-mono text-sm">
                                                    {formatVND(trip.estimatedPrice || trip.price || 350000)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ========================================== */}
            {/* MODAL THÊM / SỬA TÀI XẾ (API 5.6 & 5.7) */}
            {/* ========================================== */}
            {isDriverModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                            <h3 className="text-base font-extrabold text-white">
                                {editingDriver ? 'Cập Nhật Tài Xế (PUT 5.7)' : 'Tạo Mới Tài Xế (POST 5.6)'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsDriverModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveDriver} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-slate-400 mb-1 font-semibold">Họ và tên tài xế</label>
                                <input
                                    type="text"
                                    value={driverForm.fullName}
                                    onChange={(e) => setDriverForm({ ...driverForm, fullName: e.target.value })}
                                    required
                                    placeholder="VD: Vũ Văn Trung"
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 mb-1 font-semibold">Số điện thoại</label>
                                    <input
                                        type="tel"
                                        value={driverForm.phone}
                                        onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                                        required
                                        placeholder="VD: 0362882882"
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1 font-semibold">Biển số xe</label>
                                    <input
                                        type="text"
                                        value={driverForm.licensePlate}
                                        onChange={(e) => setDriverForm({ ...driverForm, licensePlate: e.target.value })}
                                        required
                                        placeholder="VD: 35H - 182.29"
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 mb-1 font-semibold">Dòng xe VinFast</label>
                                    <select
                                        value={driverForm.vehicleModel}
                                        onChange={(e) => setDriverForm({ ...driverForm, vehicleModel: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500"
                                    >
                                        <option value="VinFast Limo Green (VF e34)">VinFast Limo Green (VF e34)</option>
                                        <option value="VinFast VF 8 Plus">VinFast VF 8 Plus</option>
                                        <option value="VinFast VF 9">VinFast VF 9</option>
                                        <option value="VinFast VF 5 Plus">VinFast VF 5 Plus</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1 font-semibold">Số năm kinh nghiệm</label>
                                    <input
                                        type="number"
                                        value={driverForm.experienceYears}
                                        onChange={(e) => setDriverForm({ ...driverForm, experienceYears: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1 font-semibold">URL Ảnh đại diện (Avatar)</label>
                                <input
                                    type="url"
                                    value={driverForm.avatarUrl}
                                    onChange={(e) => setDriverForm({ ...driverForm, avatarUrl: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="driverActive"
                                    checked={driverForm.isActive}
                                    onChange={(e) => setDriverForm({ ...driverForm, isActive: e.target.checked })}
                                    className="w-4 h-4 rounded text-red-600 bg-slate-950 border-slate-800"
                                />
                                <label htmlFor="driverActive" className="text-slate-300 font-semibold cursor-pointer">
                                    Kích hoạt hoạt động (isActive)
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsDriverModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer shadow-lg shadow-red-950/60"
                                >
                                    Lưu Thay Đổi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL TỪ CHỐI TÀI XẾ (API 5.4) */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3">
                        <h3 className="text-sm font-bold text-white">Từ chối phê duyệt tài xế (API 5.4)</h3>
                        <p className="text-xs text-slate-400">Nhập lý do từ chối để hệ thống gửi thông báo cho tài xế:</p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={3}
                            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500"
                        />
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsRejectModalOpen(false)}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmReject}
                                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                            >
                                Xác nhận từ chối
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* MODAL THÊM / SỬA GÓI CƯỚC (API 7.5 & 7.6) */}
            {/* ========================================== */}
            {isPromoModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                            <h3 className="text-base font-extrabold text-white">
                                {editingPromo ? 'Sửa Gói Cước Cố Định (PUT 7.6)' : 'Tạo Mới Gói Cước (POST 7.5)'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsPromoModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSavePromo} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-slate-400 mb-1 font-semibold">Tiêu đề gói cước</label>
                                <input
                                    type="text"
                                    value={promoForm.title}
                                    onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                                    required
                                    placeholder="VD: Trực Ninh ⇄ Sân Bay Nội Bài"
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 mb-1 font-semibold">Giá cước trọn gói (VNĐ)</label>
                                    <input
                                        type="number"
                                        value={promoForm.price}
                                        onChange={(e) => setPromoForm({ ...promoForm, price: Number(e.target.value) })}
                                        required
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1 font-semibold">Badge nhãn nổi bật</label>
                                    <input
                                        type="text"
                                        value={promoForm.badgeText}
                                        onChange={(e) => setPromoForm({ ...promoForm, badgeText: e.target.value })}
                                        placeholder="VD: HOT DEAL 900K"
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1 font-semibold">Điểm đến mặc định (dropoffAddress)</label>
                                <input
                                    type="text"
                                    value={promoForm.dropoffAddress}
                                    onChange={(e) => setPromoForm({ ...promoForm, dropoffAddress: e.target.value })}
                                    placeholder="Sân bay Quốc tế Nội Bài..."
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1 font-semibold">Mô tả ngắn</label>
                                <textarea
                                    value={promoForm.description}
                                    onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                                    rows={2}
                                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1 font-semibold">Danh sách tiện ích (Mỗi dòng 1 tiện ích)</label>
                                <textarea
                                    value={promoForm.featuresText}
                                    onChange={(e) => setPromoForm({ ...promoForm, featuresText: e.target.value })}
                                    rows={3}
                                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsPromoModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer shadow-lg shadow-red-950/60"
                                >
                                    Lưu Gói Cước
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* MODAL THÊM / SỬA VOUCHER (API 8.6 & 8.7) */}
            {/* ========================================== */}
            {isDiscountModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                            <h3 className="text-base font-extrabold text-white">
                                {editingDiscount ? 'Sửa Mã Giảm Giá (PUT 8.7)' : 'Tạo Mã Giảm Giá Mới (POST 8.6)'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsDiscountModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveDiscount} className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 mb-1 font-semibold">Mã Code Voucher</label>
                                    <input
                                        type="text"
                                        value={discountForm.code}
                                        onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })}
                                        required
                                        placeholder="VD: TRUNGANH50K"
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono font-bold focus:outline-none focus:border-red-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1 font-semibold">Loại giảm giá</label>
                                    <select
                                        value={discountForm.discountType}
                                        onChange={(e) => setDiscountForm({ ...discountForm, discountType: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500"
                                    >
                                        <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
                                        <option value="PERCENTAGE">Phần trăm (%)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 mb-1 font-semibold">
                                        Mức giảm {discountForm.discountType === 'PERCENTAGE' ? '(%)' : '(VNĐ)'}
                                    </label>
                                    <input
                                        type="number"
                                        value={discountForm.discountValue}
                                        onChange={(e) => setDiscountForm({ ...discountForm, discountValue: Number(e.target.value) })}
                                        required
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono font-bold focus:outline-none focus:border-red-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1 font-semibold">Đơn tối thiểu (VNĐ)</label>
                                    <input
                                        type="number"
                                        value={discountForm.minTripPrice}
                                        onChange={(e) => setDiscountForm({ ...discountForm, minTripPrice: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-red-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1 font-semibold">Tiêu đề / Tên chương trình</label>
                                <input
                                    type="text"
                                    value={discountForm.title}
                                    onChange={(e) => setDiscountForm({ ...discountForm, title: e.target.value })}
                                    required
                                    placeholder="VD: Tri ân khách hàng thân thiết"
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1 font-semibold">Mô tả chi tiết</label>
                                <input
                                    type="text"
                                    value={discountForm.description}
                                    onChange={(e) => setDiscountForm({ ...discountForm, description: e.target.value })}
                                    placeholder="Áp dụng cho chuyến đi từ 300k..."
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsDiscountModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer shadow-lg shadow-red-950/60"
                                >
                                    Lưu Voucher
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* MODAL THÊM / SỬA BANNER (API 9.4 & 9.5) */}
            {/* ========================================== */}
            {isBannerModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                            <h3 className="text-base font-extrabold text-white">
                                {editingBanner ? 'Sửa Banner (PUT 9.5)' : 'Tạo Banner Mới (POST 9.4)'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsBannerModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveBanner} className="space-y-3 text-xs">
                            <div>
                                <label className="block text-slate-400 mb-1 font-semibold">Tiêu đề Banner</label>
                                <input
                                    type="text"
                                    value={bannerForm.title}
                                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                                    required
                                    placeholder="VD: Trực Ninh ⇄ Nội Bài - Chỉ 900K"
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1 font-semibold">Mô tả phụ (Tagline)</label>
                                <textarea
                                    value={bannerForm.tagline}
                                    onChange={(e) => setBannerForm({ ...bannerForm, tagline: e.target.value })}
                                    rows={2}
                                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 mb-1 font-semibold">Badge nhãn</label>
                                    <input
                                        type="text"
                                        value={bannerForm.badge}
                                        onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1 font-semibold">Thứ tự hiển thị</label>
                                    <input
                                        type="number"
                                        value={bannerForm.displayOrder}
                                        onChange={(e) => setBannerForm({ ...bannerForm, displayOrder: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1 font-semibold">URL Hình ảnh</label>
                                <input
                                    type="text"
                                    value={bannerForm.image}
                                    onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-red-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsBannerModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer shadow-lg shadow-red-950/60"
                                >
                                    Lưu Banner
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
