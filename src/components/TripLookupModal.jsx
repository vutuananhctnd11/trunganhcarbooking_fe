import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../services/booking.service';

/**
 * Badge hiển thị trạng thái chuyến đi
 */
function TripStatusBadge({ status }) {
    const s = String(status || 'PENDING').toUpperCase();
    if (s === 'COMPLETED') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Hoàn tất
            </span>
        );
    }
    if (s === 'ARRIVING' || s === 'IN_PROGRESS') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                Đang đón / Di chuyển
            </span>
        );
    }
    if (s === 'CONFIRM' || s === 'CONFIRMED' || s === 'ACCEPTED') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-950/80 text-blue-300 border border-blue-800">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Tài xế đã nhận
            </span>
        );
    }
    if (s === 'CANCELLED') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                Đã hủy
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Chờ xác nhận
        </span>
    );
}

export default function TripLookupModal({ isOpen, onClose, initialPhone = '' }) {
    const navigate = useNavigate();
    const [phone, setPhone] = useState(initialPhone);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [trips, setTrips] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');
    // Tab lọc: 'UPCOMING' (API 1.4: Chuyến sắp tới / gần nhất) | 'HISTORY' (API 1.5: Toàn bộ lịch sử)
    const [activeTab, setActiveTab] = useState('UPCOMING');

    // Khóa cuộn trang khi modal mở
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (initialPhone) {
                setPhone(initialPhone);
                handleSearch(initialPhone, activeTab);
            }
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, initialPhone]);

    const handleSearch = async (phoneToSearch, tabToUse = activeTab) => {
        const targetPhone = typeof phoneToSearch === 'string' ? phoneToSearch : phone;
        const clean = targetPhone.replace(/\D/g, '');
        if (!clean || clean.length < 8) {
            setErrorMsg('Vui lòng nhập số điện thoại hợp lệ (tối thiểu 8-10 chữ số)');
            return;
        }

        setErrorMsg('');
        setIsLoading(true);
        setHasSearched(true);

        try {
            // Gọi API 1.4 (/bookings/upcoming) nếu là UPCOMING, hoặc API 1.5 (/bookings/history) nếu là HISTORY
            const results = await bookingService.getBookingsByPhone(clean, tabToUse);
            setTrips(results);
        } catch (err) {
            console.error('Lỗi tra cứu chuyến:', err);
            setErrorMsg('Có lỗi xảy ra khi tra cứu, vui lòng thử lại');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangeTab = (tab) => {
        setActiveTab(tab);
        if (hasSearched && phone) {
            handleSearch(phone, tab);
        }
    };

    const handleGoToTracking = (tripCode) => {
        onClose();
        navigate(`/trip/${tripCode}`);
    };

    const handleScrollToBooking = () => {
        onClose();
        const el = document.getElementById('booking-section');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
            {/* Lớp nền click để đóng */}
            <div className="fixed inset-0" onClick={onClose} />

            {/* Khung Modal */}
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl max-w-xl w-full shadow-2xl relative max-h-[92dvh] sm:max-h-[90vh] flex flex-col z-10 overflow-hidden">
                {/* Viền Crimson trang trí đỉnh modal */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-700 pointer-events-none z-30" />

                {/* Header Modal */}
                <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95 shrink-0 relative pr-12">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-all border border-slate-700/70 z-20"
                        title="Đóng cửa sổ"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-red-950/50 shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                                Tra Cứu Chuyến Xe Đã Đặt
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Nhập số điện thoại để xem hành trình và tình trạng tài xế
                            </p>
                        </div>
                    </div>
                </div>

                {/* Thân Modal cuộn mượt mà */}
                <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                    {/* Form nhập số điện thoại */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSearch(phone);
                        }}
                        className="space-y-2"
                    >
                        <label className="block text-xs font-semibold text-slate-300">
                            Số điện thoại đặt xe <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Nhập SĐT (VD: 0912888999...)"
                                    className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs sm:text-sm font-medium focus:outline-none focus:border-red-500 transition-colors placeholder-slate-500"
                                    autoFocus
                                />
                                {phone && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPhone('');
                                            setTrips([]);
                                            setHasSearched(false);
                                        }}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-red-950/40 flex items-center gap-1.5 shrink-0 cursor-pointer"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>Đang tìm...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <span>Tra cứu</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {errorMsg && (
                            <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>
                        )}
                    </form>

                    {/* Bộ lọc Tab: Chuyến sắp tới (Gần nhất - API 1.4) vs Toàn bộ lịch sử (API 1.5) */}
                    <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
                        <button
                            type="button"
                            onClick={() => handleChangeTab('UPCOMING')}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                activeTab === 'UPCOMING'
                                    ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                            }`}
                        >
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Chuyến sắp tới (Gần nhất)</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleChangeTab('HISTORY')}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                activeTab === 'HISTORY'
                                    ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                            }`}
                        >
                            <span>Toàn bộ lịch sử</span>
                        </button>
                    </div>

                    {/* Danh sách kết quả tra cứu */}
                    {hasSearched && (
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-300">
                                    Kết quả tra cứu:
                                </span>
                                <span className="text-[11px] text-slate-400">
                                    {trips.length > 0 ? `Tìm thấy ${trips.length} chuyến xe` : 'Không có chuyến nào'}
                                </span>
                            </div>

                            {trips.length > 0 ? (
                                <div className="space-y-3">
                                    {trips.map((trip) => (
                                        <div
                                            key={trip.tripCode || trip.id}
                                            className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 transition-all space-y-3 shadow-md"
                                        >
                                            {/* Header chuyến */}
                                            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-bold text-red-400 bg-red-950/80 px-2.5 py-0.5 rounded-lg border border-red-900/60">
                                                        #{trip.tripCode}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        {trip.pickupDate || 'Hôm nay'} • {trip.pickupTime}
                                                    </span>
                                                </div>

                                                <TripStatusBadge status={trip.status} />
                                            </div>

                                            {/* Lộ trình */}
                                            <div className="space-y-2 text-xs">
                                                <div className="flex items-start gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
                                                    <div>
                                                        <span className="text-slate-500 text-[10px] block">ĐIỂM ĐÓN:</span>
                                                        <span className="text-slate-200 font-medium line-clamp-2">
                                                            {trip.pickupAddress}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-rose-400 mt-1 shrink-0" />
                                                    <div>
                                                        <span className="text-slate-500 text-[10px] block">ĐIỂM TRẢ:</span>
                                                        <span className="text-slate-200 font-medium line-clamp-2">
                                                            {trip.dropoffAddress}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Tài xế & Giá tiền */}
                                            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                                                <div>
                                                    <span className="text-slate-400 block text-[10px]">Tài xế & Phương tiện:</span>
                                                    <span className="text-slate-200 font-semibold">
                                                        {trip.driverName} • {trip.carModel}
                                                    </span>
                                                </div>

                                                <div className="text-right">
                                                    <span className="text-slate-400 block text-[10px]">Giá cước:</span>
                                                    <span className="text-sm font-bold text-red-400">
                                                        {typeof trip.estimatedPrice === 'number'
                                                            ? `${trip.estimatedPrice.toLocaleString('vi-VN')} đ`
                                                            : trip.estimatedPrice}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Nút hành động */}
                                            <div className="pt-2 flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleGoToTracking(trip.tripCode)}
                                                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold transition-all shadow-md shadow-red-950/40 flex items-center justify-center gap-1.5 cursor-pointer"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    <span>Xem chi tiết & Theo dõi trực tiếp</span>
                                                </button>

                                                <a
                                                    href={`tel:${trip.driverPhone || '0362882882'}`}
                                                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1 no-underline"
                                                    title="Gọi tài xế"
                                                >
                                                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 4V3z" />
                                                    </svg>
                                                    <span className="hidden sm:inline">Gọi điện</span>
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
                                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-300 font-medium">
                                        Không tìm thấy chuyến xe nào gắn với số điện thoại <strong className="text-white font-mono">{phone}</strong>
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        Quý khách có thể kiểm tra lại số điện thoại hoặc đặt chuyến xe mới ngay bây giờ.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleScrollToBooking}
                                        className="mt-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-950/40 cursor-pointer"
                                    >
                                        Đặt chuyến xe mới ngay
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Modal */}
                <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 shrink-0 flex items-center justify-between text-xs text-slate-400">
                    <span>Tổng đài hỗ trợ: <strong className="text-red-400 font-bold">0362.882.882</strong></span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

