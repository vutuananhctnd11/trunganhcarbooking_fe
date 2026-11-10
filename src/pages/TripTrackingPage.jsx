import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tripService } from '../services/trip.service';

// Định nghĩa 5 trạng thái chuyến đi theo quy trình
export const TIMELINE_STEPS = [
    { key: 'PENDING', label: 'Chờ xác nhận', desc: 'Hệ thống đang gửi điều phối' },
    { key: 'CONFIRM', label: 'Tài xế đã nhận', desc: 'Tài xế Trung Anh đã nhận chuyến' },
    { key: 'ARRIVING', label: 'Đang đến đón', desc: 'Xe đang trên đường đến điểm hẹn' },
    { key: 'COMPLETED', label: 'Hoàn tất', desc: 'Chuyến đi kết thúc an toàn' },
];

/**
 * Phát âm thanh thông báo du dương qua Web Audio API (C5 -> G5)
 */
function playArrivingChime() {
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(783.99, now + 0.15);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.3, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.8);
    } catch (err) {
        console.warn('Không thể phát âm thanh Web Audio:', err);
    }
}

/**
 * Chuẩn hóa mã trạng thái để map đúng vào step timeline
 */
function normalizeStatusKey(status) {
    if (!status) return 'PENDING';
    const s = String(status).toUpperCase();
    if (s === 'CONFIRMED') return 'CONFIRM';
    return s;
}

export default function TripTrackingPage() {
    const { code } = useParams();
    const tripCode = code || 'TAC-DEMO';

    // State thông tin chuyến xe
    const [trip, setTrip] = useState({
        id: null,
        code: tripCode,
        customerName: 'Quý khách',
        phone: '',
        pickupAddress: 'Chung cư Vinhomes Smart City, Tây Mỗ, Hà Nội',
        dropoffAddress: 'Sân bay Quốc tế Nội Bài - Nhà ga T1',
        pickupDate: '',
        pickupTime: '',
        distanceKm: null,
        travelTime: null,
        waitHours: 0,
        isRoundTrip: false,
        luggageOption: '',
        note: '',
        discountCode: '',
        discountAmount: 0,
        estimatedPrice: '320.000 đ',
        status: 'PENDING',
        statusDescription: 'Chờ xác nhận',
        createdAt: '',
        updatedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('vi-VN'),
        driver: {
            name: 'Trung Anh',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            experience: 8,
            vehicleModel: 'VinFast VF e34 (Limo Green Edition)',
            vehicleColor: 'Đỏ Crimson (Đỏ đô ánh kim)',
            licensePlate: '35H - 182.29',
            phone: '0362882882',
        },
    });

    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [sseConnected, setSseConnected] = useState(true);
    const [reconnectAttempt, setReconnectAttempt] = useState(0);
    const [copiedLink, setCopiedLink] = useState(false);
    const previousStatusRef = useRef('PENDING');

    // Chuyển đổi response API (API 2.1: GET /api/v1/trips/{code}) sang object trip của component
    const mapApiResponse = useCallback((apiData) => {
        if (!apiData) return;

        // Phân tích pickupTime: ISO string ("2026-11-10T09:00:00") hoặc trường riêng biệt
        let pickupDate = apiData.pickupDate || '';
        let pickupTime = apiData.pickupTimeStr || '';
        if (apiData.pickupTime) {
            try {
                if (typeof apiData.pickupTime === 'string' && apiData.pickupTime.includes('T')) {
                    const [dPart, tPart] = apiData.pickupTime.split('T');
                    pickupDate = dPart;
                    pickupTime = tPart.slice(0, 5);
                } else {
                    const d = new Date(apiData.pickupTime);
                    if (!isNaN(d.getTime())) {
                        pickupDate = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                        pickupTime = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                    }
                }
            } catch { }
        }

        // Phân tích createdAt & updatedAt
        const formatDateTime = (isoString) => {
            if (!isoString) return '';
            try {
                const d = new Date(isoString);
                if (isNaN(d.getTime())) return isoString;
                const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                return `${time} - ${date}`;
            } catch {
                return isoString || '';
            }
        };

        const formattedCreatedAt = formatDateTime(apiData.createdAt);
        const formattedUpdatedAt = formatDateTime(apiData.updatedAt || apiData.createdAt);

        // Format giá tiền: 350000 -> 350.000 đ
        const rawFare = apiData.finalPrice ?? apiData.estimatedPrice;
        let formattedPrice = '0 đ';
        if (rawFare !== undefined && rawFare !== null) {
            if (typeof rawFare === 'number') {
                formattedPrice = new Intl.NumberFormat('vi-VN').format(rawFare) + ' đ';
            } else if (typeof rawFare === 'string') {
                const num = Number(rawFare.replace(/[^0-9]/g, ''));
                formattedPrice = !isNaN(num) && num > 0 ? new Intl.NumberFormat('vi-VN').format(num) + ' đ' : rawFare;
            }
        }

        const rawDriver = apiData.driver || {};

        setTrip(prev => {
            const nextStatus = normalizeStatusKey(apiData.status || prev.status);
            // Phát chuông nếu trạng thái chuyển sang ARRIVING
            if (nextStatus === 'ARRIVING' && previousStatusRef.current !== 'ARRIVING') {
                playArrivingChime();
            }
            previousStatusRef.current = nextStatus;

            return {
                ...prev,
                id: apiData.id ?? prev.id,
                code: apiData.code || apiData.tripCode || prev.code,
                customerName: apiData.customerName || apiData.name || prev.customerName,
                phone: apiData.customerPhone || apiData.phone || prev.phone,
                pickupAddress: apiData.pickupAddress || prev.pickupAddress,
                dropoffAddress: apiData.dropoffAddress || prev.dropoffAddress,
                pickupDate: pickupDate || prev.pickupDate,
                pickupTime: pickupTime || prev.pickupTime,
                distanceKm: apiData.distanceKm ?? prev.distanceKm,
                travelTime: apiData.travelTime ?? prev.travelTime,
                waitHours: apiData.waitHours ?? prev.waitHours,
                isRoundTrip: apiData.isRoundTrip !== undefined ? Boolean(apiData.isRoundTrip) : prev.isRoundTrip,
                luggageOption: apiData.luggageOption || prev.luggageOption,
                note: apiData.note || prev.note,
                discountCode: apiData.discountCode || prev.discountCode,
                discountAmount: apiData.discountAmount || prev.discountAmount,
                estimatedPrice: formattedPrice || prev.estimatedPrice,
                status: nextStatus,
                statusDescription: apiData.statusDescription || prev.statusDescription,
                updatedAt: formattedUpdatedAt || prev.updatedAt,
                createdAt: formattedCreatedAt || prev.createdAt,
                driver: {
                    name: rawDriver.fullName || rawDriver.name || prev.driver.name,
                    avatar: rawDriver.avatarUrl || rawDriver.avatar || prev.driver.avatar,
                    experience: rawDriver.experienceYears ?? rawDriver.experience ?? prev.driver.experience,
                    vehicleModel: rawDriver.vehicleModel || prev.driver.vehicleModel,
                    vehicleColor: rawDriver.vehicleColor || prev.driver.vehicleColor,
                    licensePlate: rawDriver.licensePlate || prev.driver.licensePlate,
                    phone: rawDriver.phone || prev.driver.phone,
                }
            };
        });
    }, []);

    // 1. Đọc dữ liệu đã lưu tạm từ sessionStorage (nếu vừa đặt từ form)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = sessionStorage.getItem(`trip_${tripCode}`);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setTrip(prev => ({
                        ...prev,
                        customerName: parsed.customerName || prev.customerName,
                        phone: parsed.customerPhone || parsed.phone || prev.phone,
                        pickupAddress: parsed.pickupAddress || prev.pickupAddress,
                        dropoffAddress: parsed.dropoffAddress || prev.dropoffAddress,
                        pickupDate: parsed.pickupDate || (parsed.pickupTime && parsed.pickupTime.includes('T') ? parsed.pickupTime.split('T')[0] : prev.pickupDate),
                        pickupTime: parsed.pickupTimeStr || (parsed.pickupTime && parsed.pickupTime.includes('T') ? parsed.pickupTime.split('T')[1].slice(0, 5) : prev.pickupTime),
                        distanceKm: parsed.distanceKm ?? prev.distanceKm,
                        travelTime: parsed.travelTime ?? prev.travelTime,
                        waitHours: parsed.waitHours ?? prev.waitHours,
                        isRoundTrip: Boolean(parsed.isRoundTrip),
                        luggageOption: parsed.luggageOption || prev.luggageOption,
                        note: parsed.note || prev.note,
                        discountCode: parsed.discountCode || prev.discountCode,
                        estimatedPrice: parsed.estimatedPrice ? (new Intl.NumberFormat('vi-VN').format(parsed.estimatedPrice) + ' đ') : prev.estimatedPrice,
                    }));
                } catch { }
            }
        }
    }, [tripCode]);

    // 2. Fetch API chi tiết chuyến xe: GET http://localhost:8080/api/v1/trips/{code}
    const fetchTripData = useCallback(async (isInitial = false) => {
        if (!tripCode || tripCode === 'TAC-DEMO') return;
        if (isInitial) setIsLoading(true);

        try {
            const res = await tripService.getTripByCode(tripCode);
            // Phản hồi có dạng { code: 200, message: "...", data: { ... } }
            const apiData = res?.data || res;
            if (apiData && (apiData.code || apiData.id || apiData.pickupAddress)) {
                mapApiResponse(apiData);
                setFetchError(null);
            }
        } catch (err) {
            console.warn('Lỗi tải thông tin chuyến đi từ API:', err);
            setFetchError(err.message || 'Không thể kết nối đến máy chủ');
        } finally {
            if (isInitial) setIsLoading(false);
        }
    }, [tripCode, mapApiResponse]);

    // 3. Kết nối Realtime qua Server-Sent Events (SSE): GET /api/v1/trips/{code}/sse
    useEffect(() => {
        // Tải dữ liệu đầy đủ lần đầu qua REST API
        fetchTripData(true);

        if (!tripCode || tripCode === 'TAC-DEMO') return;

        const sseUrl = tripService.getSseUrl(tripCode);
        let eventSource = null;

        try {
            eventSource = new EventSource(sseUrl);

            eventSource.onopen = () => {
                setSseConnected(true);
                setReconnectAttempt(0);
            };

            // Lắng nghe sự kiện CONNECTED từ BE
            eventSource.addEventListener('CONNECTED', (e) => {
                setSseConnected(true);
                setReconnectAttempt(0);
            });

            // Lắng nghe sự kiện TRIP_STATUS_CHANGED từ BE
            eventSource.addEventListener('TRIP_STATUS_CHANGED', (e) => {
                try {
                    const payload = JSON.parse(e.data);
                    if (payload) {
                        mapApiResponse(payload);
                    }
                } catch (parseErr) {
                    console.warn('[SSE] Lỗi parse dữ liệu TRIP_STATUS_CHANGED:', parseErr);
                }
                // Đồng bộ lại dữ liệu chi tiết nhất từ DB
                fetchTripData(false);
            });

            // Lắng nghe tin nhắn mặc định nếu có
            eventSource.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    if (data) {
                        mapApiResponse(data);
                    }
                } catch { }
            };

            eventSource.onerror = (err) => {
                console.warn('[SSE] Kết nối SSE bị ngắt hoặc đang reconnect...', err);
                setSseConnected(false);
                setReconnectAttempt(count => count + 1);
            };
        } catch (err) {
            console.error('[SSE] Không thể khởi tạo EventSource:', err);
            setSseConnected(false);
        }

        // Cleanup: Đóng kết nối SSE khi unmount hoặc tripCode đổi
        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [tripCode, fetchTripData, mapApiResponse]);

    const handleShareTrip = async () => {
        const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
        const shareData = {
            title: `Chuyến xe riêng Trung Anh - Mã: ${tripCode}`,
            text: `Theo dõi lộ trình xe điện VinFast màu đỏ đang đón tôi tại: ${trip.pickupAddress}`,
            url: currentUrl,
        };
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share(shareData);
            } catch { }
        } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
            await navigator.clipboard.writeText(currentUrl);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 3000);
        }
    };

    const currentStepIndex = TIMELINE_STEPS.findIndex((s) => s.key === normalizeStatusKey(trip.status));
    const activeIndex = currentStepIndex >= 0 ? currentStepIndex : 0;

    const handleSimulateStatus = (newStatus) => {
        if (newStatus === 'ARRIVING' && trip.status !== 'ARRIVING') {
            playArrivingChime();
        }
        previousStatusRef.current = newStatus;
        setTrip((prev) => ({
            ...prev,
            status: newStatus,
            updatedAt: new Date().toLocaleTimeString('vi-VN'),
        }));
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-red-600 selection:text-white pb-16">
            {/* Thanh Header Điều hướng */}
            <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group text-slate-300 hover:text-white transition-colors no-underline">
                        <div className="relative flex items-center justify-center">
                            <img
                                src="/trunganhcar_logo.png"
                                alt="Trung Anh Car Logo"
                                className="h-12 sm:h-16 w-auto object-contain filter drop-shadow-[0_4px_12px_rgba(220,38,38,0.35)] group-hover:scale-105 transition-transform duration-200"
                            />
                        </div>
                        <div>
                            <span className="font-extrabold text-base sm:text-lg tracking-wide text-white block leading-tight font-sans">
                                TRUNG ANH CAR
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-red-400 font-semibold uppercase tracking-wider block">
                                VinFast Electric Luxury
                            </span>
                        </div>
                    </Link>

                    {/* Trạng thái kết nối Realtime */}
                    <div className="flex items-center gap-2 text-xs">
                        <span className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'}`} />
                        <span className="text-slate-400 hidden sm:inline">
                            {sseConnected
                                ? 'Đang kết nối Realtime'
                                : reconnectAttempt > 0
                                    ? `Đang kết nối lại (${reconnectAttempt})...`
                                    : 'Đang kết nối...'}
                        </span>
                        <span className="font-mono text-red-400 bg-red-950/70 px-2 py-0.5 rounded border border-red-800/50 font-bold">
                            #{trip.code || tripCode}
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
                {/* Banner Thông Báo Trạng Thái Nổi Bật */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-red-950/40 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-red-600/10 blur-2xl pointer-events-none" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-600 text-white shadow-md">
                                    {trip.statusDescription || TIMELINE_STEPS[activeIndex]?.label || trip.status}
                                </span>
                                <span className="text-xs text-slate-400">
                                    Cập nhật: {trip.updatedAt}
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1.5">
                                {trip.status === 'PENDING' && 'Chuyến đi của bạn đang được xử lý'}
                                {(trip.status === 'CONFIRM' || trip.status === 'CONFIRMED') && 'Tài xế đã xác nhận chuyến đi'}
                                {trip.status === 'ARRIVING' && 'Tài xế đang đến điểm đón, vui lòng chuẩn bị'}
                                {trip.status === 'COMPLETED' && 'Chuyến đi đã hoàn tất. Cảm ơn quý khách!'}
                                {trip.status === 'CANCELLED' && 'Chuyến đi đã bị hủy'}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                                {TIMELINE_STEPS[activeIndex]?.desc || 'Theo dõi hành trình xe điện VinFast'}
                            </p>
                        </div>

                        {/* Cụm nút test mô phỏng trạng thái
                        <div className="flex items-center gap-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
                            <span className="text-[10px] text-slate-400 px-1 font-semibold uppercase">Demo:</span>
                            <button
                                type="button"
                                onClick={() => handleSimulateStatus('CONFIRM')}
                                className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 cursor-pointer transition-colors"
                            >
                                Nhận
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSimulateStatus('ARRIVING')}
                                className="text-[10px] px-2 py-1 bg-red-600/80 hover:bg-red-600 rounded text-white font-medium cursor-pointer transition-colors"
                            >
                                Đến đón 🔔
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSimulateStatus('COMPLETED')}
                                className="text-[10px] px-2 py-1 bg-emerald-700 hover:bg-emerald-600 rounded text-white cursor-pointer transition-colors"
                            >
                                Xong
                            </button>
                        </div> */}
                    </div>
                </div>

                {/* Thanh Tiến Trình Trạng Thái Trực Quan */}
                <section aria-label="Tiến trình chuyến đi" className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6">
                        Tiến trình chuyến xe
                    </h2>

                    <div className="relative">
                        <div className="absolute top-5 left-4 right-4 sm:left-6 sm:right-6 h-1 bg-slate-800 -translate-y-1/2 z-0 hidden sm:block" />
                        <div
                            className="absolute top-5 left-4 sm:left-6 h-1 bg-gradient-to-r from-red-600 to-rose-500 -translate-y-1/2 z-0 hidden sm:block transition-all duration-500"
                            style={{
                                width: `${(activeIndex / (TIMELINE_STEPS.length - 1)) * 92}%`,
                            }}
                        />

                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5 sm:gap-2 relative z-10">
                            {TIMELINE_STEPS.map((step, idx) => {
                                const isPassed = idx < activeIndex;
                                const isCurrent = idx === activeIndex;
                                return (
                                    <div key={step.key} className="flex sm:flex-col items-center sm:text-center gap-3.5 sm:gap-2 flex-1">
                                        <div
                                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 flex-shrink-0 ${
                                                isCurrent
                                                    ? 'bg-red-600 text-white ring-4 ring-red-600/30 shadow-lg shadow-red-900/50 scale-110'
                                                    : isPassed
                                                        ? 'bg-red-900/80 text-red-200 border border-red-500/50'
                                                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                                            }`}
                                        >
                                            {isPassed ? (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <span>{idx + 1}</span>
                                            )}
                                        </div>

                                        <div className="sm:text-center text-left">
                                            <p
                                                className={`text-xs sm:text-sm font-semibold transition-colors ${
                                                    isCurrent
                                                        ? 'text-red-400 font-bold'
                                                        : isPassed
                                                            ? 'text-slate-200'
                                                            : 'text-slate-400'
                                                }`}
                                            >
                                                {step.label}
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 max-w-[150px] sm:mx-auto">
                                                {step.desc}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Thẻ Thông Tin Chuyến Đi & Tài Xế */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cột 1: Thông tin Tài Xế & Phương Tiện */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Tài xế phục vụ
                                </span>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800/40">
                                    ★ 5.0 (Đánh giá cao)
                                </span>
                            </div>

                            <div className="flex items-center gap-4 mt-4">
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-700 to-rose-500 p-0.5 shadow-lg overflow-hidden">
                                        <img
                                            src={trip.driver?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                                            alt={trip.driver?.name || 'Tài xế Trung Anh'}
                                            className="w-full h-full object-cover rounded-[14px]"
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                                            }}
                                        />
                                    </div>
                                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                                        {trip.driver?.name || 'Trung Anh'}
                                        <svg className="w-4 h-4 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Kinh nghiệm {trip.driver?.experience || 8}+ năm • Lái xe cẩn thận, chu đáo
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400">Phương tiện:</span>
                                    <span className="text-xs font-semibold text-slate-200">
                                        {trip.driver?.vehicleModel || 'VinFast VF e34 (Limo Green Edition)'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400">Màu sơn xe:</span>
                                    <span className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-sm shadow-red-500" />
                                        {trip.driver?.vehicleColor || 'Đỏ Crimson (Đỏ đô ánh kim)'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                                    <span className="text-xs text-slate-400">Biển kiểm soát:</span>
                                    <span className="inline-block px-3 py-1 bg-white text-slate-900 font-medium font-bold text-sm tracking-wider rounded-md border-2 border-slate-300 shadow-sm">
                                        {trip.driver?.licensePlate || '35H - 182.29'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-2 gap-3">
                            <a
                                href={`tel:${trip.driver?.phone || '0362882882'}`}
                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-red-600 hover:bg-red-500 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-red-900/40 text-center no-underline"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>Gọi tài xế</span>
                            </a>

                            <a
                                href={`https://zalo.me/${trip.driver?.phone || '0362882882'}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm text-sky-300 bg-sky-950/60 hover:bg-sky-900/80 border border-sky-800/60 active:scale-[0.98] transition-all duration-150 text-center no-underline"
                            >
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.03 2 11c0 2.87 1.5 5.43 3.84 7.07V22l3.87-2.13c.73.2 1.5.31 2.29.31 5.52 0 10-4.03 10-9s-4.48-9-10-9zm1 13h-2v-2h2v2zm0-4h-2V7h2v4z" />
                                </svg>
                                <span>Nhắn Zalo</span>
                            </a>
                        </div>
                    </div>

                    {/* Cột 2: Bản Tóm Tắt Lộ Trình & Giá Cước (Đồng bộ với API 2.1) */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Chi tiết hành trình
                                </span>
                                <span className="text-xs text-slate-400">
                                    {trip.createdAt}
                                </span>
                            </div>

                            {/* Thông tin khách hàng đặt chuyến */}
                            {(trip.customerName || trip.phone) && (
                                <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                                    <span className="text-slate-400">Khách đặt:</span>
                                    <span className="font-semibold text-white">
                                        {trip.customerName} {trip.phone ? `(${trip.phone})` : ''}
                                    </span>
                                </div>
                            )}

                            <div className="mt-4 space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex flex-col items-center">
                                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                                        <div className="w-0.5 h-10 bg-slate-800 my-1" />
                                        <span className="w-3.5 h-3.5 rounded-full bg-red-500 ring-4 ring-red-500/20" />
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase text-emerald-400">
                                                Điểm đón
                                            </p>
                                            <p className="text-xs sm:text-sm font-medium text-slate-100 mt-0.5">
                                                {trip.pickupAddress}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-semibold uppercase text-red-400">
                                                Điểm đến
                                            </p>
                                            <p className="text-xs sm:text-sm font-medium text-slate-100 mt-0.5">
                                                {trip.dropoffAddress}
                                            </p>
                                        </div>

                                        {trip.pickupTime && (
                                            <div>
                                                <p className="text-[11px] font-semibold uppercase text-sky-400">
                                                    Thời gian đón
                                                </p>
                                                <p className="text-xs sm:text-sm font-medium text-slate-100 mt-0.5">
                                                    {trip.pickupTime} - {trip.pickupDate}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Thông số kỹ thuật của chuyến đi từ API 2.1 */}
                            <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                                {trip.distanceKm && (
                                    <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                                        <span className="text-[10px] text-slate-400 block">Quãng đường:</span>
                                        <span className="font-bold text-slate-200">{trip.distanceKm} km</span>
                                    </div>
                                )}
                                {trip.travelTime && (
                                    <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                                        <span className="text-[10px] text-slate-400 block">Thời gian ước tính:</span>
                                        <span className="font-bold text-emerald-400">~{trip.travelTime} phút</span>
                                    </div>
                                )}
                                <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                                    <span className="text-[10px] text-slate-400 block">Hình thức:</span>
                                    <span className="font-bold text-rose-300">
                                        {trip.isRoundTrip ? 'Khứ hồi (2 chiều)' : 'Một chiều'}
                                    </span>
                                </div>
                                {trip.waitHours > 0 && (
                                    <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                                        <span className="text-[10px] text-slate-400 block">Thời gian chờ:</span>
                                        <span className="font-bold text-amber-300">{trip.waitHours} giờ</span>
                                    </div>
                                )}
                            </div>

                            {/* Hành lý & Ghi chú (nếu có) */}
                            {(trip.luggageOption || trip.note || trip.discountCode) && (
                                <div className="mt-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 text-xs">
                                    {trip.luggageOption && (
                                        <p className="text-slate-300 flex items-center justify-between">
                                            <span className="text-slate-400">Hành lý:</span>
                                            <span className="font-medium text-white">{trip.luggageOption}</span>
                                        </p>
                                    )}
                                    {trip.discountCode && (
                                        <p className="text-slate-300 flex items-center justify-between">
                                            <span className="text-slate-400">Mã ưu đãi:</span>
                                            <span className="font-mono font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-900/60 text-[11px]">
                                                {trip.discountCode}
                                            </span>
                                        </p>
                                    )}
                                    {trip.note && (
                                        <p className="text-slate-300 pt-1 border-t border-slate-800/80">
                                            <span className="text-slate-400 block text-[10px] uppercase">Ghi chú:</span>
                                            <span className="italic text-slate-200">{trip.note}</span>
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Box tổng cước phí */}
                            <div className="mt-4 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                                <div>
                                    <span className="text-xs text-slate-400 block">Cước phí trọn gói:</span>
                                    <span className="text-[10px] text-slate-500">Đã bao gồm xe riêng & dịch vụ</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg sm:text-xl font-bold text-red-500">
                                        {trip.estimatedPrice}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={handleShareTrip}
                                className="w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                <span>
                                    {copiedLink ? 'Đã sao chép link hành trình!' : 'Chia sẻ link chuyến đi cho người thân'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-center">
                    <p className="text-xs text-slate-400">
                        Dịch vụ xe riêng Trung Anh - Hotline hỗ trợ 24/7: <a href="tel:0362.882.882" className="text-red-400 font-semibold underline">0362.882.882</a>
                    </p>
                </div>
            </main>
        </div>
    );
}
