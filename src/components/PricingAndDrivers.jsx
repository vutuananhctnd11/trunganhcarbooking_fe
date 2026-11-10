import React, { useState, useEffect } from 'react';
import { DEFAULT_PROMOTION_TRIPS } from '../services/promotionTrip.service';
import { ENV } from '../config/env.config';
import { driverService } from '../services/driverService';

export const DRIVERS_LIST = [
    {
        id: '1',
        name: 'Trung Anh',
        phone: '0362.882.882',
        avatar: 'https://res.cloudinary.com/dzueehiwb/image/upload/v1793693693/profile_driver_fcgfb8.png',
        rating: 5.0,
        tripsCount: 1420,
        carModel: 'VinFast Limo Green (đỏ)',
        plateNumber: '35H - 182.29',
        tag: 'Được đánh giá cao nhất',
        experience: '8 năm kinh nghiệm • Lái xe cẩn thận, chu đáo',
    },
    {
        id: '2',
        name: 'Tuấn Hưng',
        phone: '0988.123.456',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        rating: 4.9,
        tripsCount: 980,
        carModel: 'VinFast VF e34 (Xanh blue)',
        plateNumber: '30L - 123.45',
        tag: 'Tài xế thân thiện, đúng giờ',
        experience: '6 năm kinh nghiệm • Thành thạo tuyến sân bay & liên tỉnh',
    },
    {
        id: '3',
        name: 'Hoàng Minh',
        phone: '0912.345.678',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        rating: 4.9,
        tripsCount: 750,
        carModel: 'VinFast VF 5 Plus (Đỏ Ruby)',
        plateNumber: '30H - 567.89',
        tag: 'Nhiệt tình hỗ trợ hành lý',
        experience: '5 năm kinh nghiệm • Xe luôn sạch sẽ, không mùi',
    },
];

/**
 * Trích xuất danh sách tính năng an toàn (hỗ trợ Array, JSON string, chuỗi cách nhau bởi dấu phẩy/xuống dòng)
 */
function parseFeatures(features) {
    if (!features) return [];
    if (Array.isArray(features)) return features;
    if (typeof features === 'string') {
        try {
            const parsed = JSON.parse(features);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            return features.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
        }
    }
    return [];
}

export default function PricingAndDrivers({ onSelectDriver, onSelectFixedTrip }) {
    // Khởi tạo sẵn bằng danh sách mẫu để giao diện luôn hiển thị, không bị trống
    const [promotionTrips, setPromotionTrips] = useState(DEFAULT_PROMOTION_TRIPS);
    const [isLoadingPromotions, setIsLoadingPromotions] = useState(false);
    const [drivers, setDrivers] = useState(DRIVERS_LIST);

    useEffect(() => {
        let isMounted = true;
        async function fetchPromotions() {
            try {
                setIsLoadingPromotions(true);
                const apiUrl = `${ENV.API_BASE_URL}/promotion-trips?isActive=true&page=0&size=5`;
                const res = await fetch(apiUrl);
                if (res.ok) {
                    const json = await res.json();
                    // Backend Spring Boot bọc dữ liệu trong { status: 200, success: true, data: { content: [...] } }
                    let list = [];
                    if (Array.isArray(json)) {
                        list = json;
                    } else if (Array.isArray(json?.data?.content)) {
                        list = json.data.content;
                    } else if (Array.isArray(json?.data)) {
                        list = json.data;
                    } else if (Array.isArray(json?.content)) {
                        list = json.content;
                    }

                    if (isMounted && Array.isArray(list) && list.length > 0) {
                        setPromotionTrips(list);
                    }
                }
            } catch (err) {
                console.warn('Lỗi kết nối API promotion-trips, sử dụng bảng giá mặc định:', err);
            } finally {
                if (isMounted) setIsLoadingPromotions(false);
            }
        }
        fetchPromotions();
        async function fetchDrivers() {
            try {
                const list = await driverService.getDrivers(true);
                if (isMounted && Array.isArray(list) && list.length > 0) {
                    setDrivers(list);
                }
            } catch (err) {
                console.warn('Lỗi kết nối API danh sách tài xế:', err);
            }
        }
        fetchDrivers();
        return () => {
            isMounted = false;
        };
    }, []);

    const handleSelectPackage = (plan) => {
        const parsedTravelTime = typeof plan.travelTime === 'number'
            ? plan.travelTime
            : (parseInt(String(plan.travelTime || ''), 10) || 45);

        const tripData = {
            isFixedTrip: true,
            id: plan.id,
            promotionTripId: plan.id,
            promotionTripTitle: plan.title,
            title: plan.title,
            dropoffAddress: plan.dropoffAddress,
            dropoffLngLat: plan.dropoffLng && plan.dropoffLat ? [plan.dropoffLng, plan.dropoffLat] : undefined,
            pickupAddress: plan.pickupAddress,
            pickupLngLat: plan.pickupLng && plan.pickupLat ? [plan.pickupLng, plan.pickupLat] : undefined,
            distanceKm: plan.distanceKm,
            travelTime: parsedTravelTime,
            price: plan.price,
            isRoundTrip: false,
            timestamp: Date.now(),
        };

        if (onSelectFixedTrip) {
            onSelectFixedTrip(tripData);
        }

        // Ưu tiên scroll về cột Nhập Thông Tin Chuyến Xe thay vì chỉ scroll đến đỉnh bản đồ
        const infoElement = document.getElementById('booking-trip-info');
        if (infoElement) {
            infoElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            const bookingElement = document.getElementById('booking-section');
            if (bookingElement) {
                bookingElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    const handleChooseDriver = (driverId) => {
        if (onSelectDriver) {
            onSelectDriver(driverId);
        }

        // Ưu tiên scroll về cột Nhập Thông Tin Chuyến Xe thay vì chỉ scroll đến đỉnh bản đồ
        const infoElement = document.getElementById('booking-trip-info');
        if (infoElement) {
            infoElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            const bookingElement = document.getElementById('booking-section');
            if (bookingElement) {
                bookingElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    return (
        <div className="w-full space-y-12">
            {/* 1. BẢNG GIÁ CƯỚC MINH BẠCH / GÓI CƯỚC PROMOTION TRIPS */}
            <section id="pricing-section">
                <div className="text-center max-w-2xl mx-auto mb-8">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-500 bg-red-950/60 px-3 py-1 rounded-full border border-red-800/40">
                        Chương trình khuyến mãi
                    </span>
                    <h2 className="text-xl sm:text-3xl font-extrabold text-white mt-2">
                        Bảng giá cước các tuyến cố định
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                        Giá cước tính theo chương trình khuyến mại cho điểm đón và điểm đến nhất định.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {promotionTrips?.map((plan) => {
                        const featureList = parseFeatures(plan.features);

                        return (
                            <div
                                key={plan.id}
                                className={`rounded-2xl p-5 sm:p-6 border flex flex-col justify-between transition-all duration-300 relative ${
                                    plan.isFeatured
                                        ? 'bg-gradient-to-b from-slate-900 to-red-950/40 border-red-600/80 shadow-2xl shadow-red-950/50 scale-[1.02]'
                                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                                }`}
                            >
                                {plan.badgeText && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white shadow-md">
                                            {plan.badgeText}
                                        </span>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-lg font-bold text-white">{plan.title}</h3>
                                    {plan.description && (
                                        <p className="text-xs text-slate-400 mt-1">{plan.description}</p>
                                    )}

                                    <div className="my-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-red-500">
                                                {typeof plan.price === 'number'
                                                    ? `${plan.price.toLocaleString('vi-VN')} đ`
                                                    : plan.price ? `${plan.price} đ` : 'Liên hệ'}
                                            </span>
                                            {plan.priceUnit && (
                                                <span className="text-xs text-slate-400">{plan.priceUnit}</span>
                                            )}
                                        </div>
                                        {plan.extraKmNote && (
                                            <div className="mt-1 text-xs text-slate-300 flex items-center justify-between">
                                                <span>Km phát sinh:</span>
                                                <strong className="text-slate-100">{plan.extraKmNote}</strong>
                                            </div>
                                        )}
                                        {plan.waitingFeeNote && (
                                            <div className="mt-1 text-xs text-slate-300 flex items-center justify-between border-t border-slate-800/80 pt-1">
                                                <span>Phí thời gian chờ:</span>
                                                <strong className="text-amber-400">{plan.waitingFeeNote}</strong>
                                            </div>
                                        )}
                                    </div>

                                    {featureList.length > 0 && (
                                        <ul className="space-y-2 text-xs text-slate-300 mb-6">
                                            {featureList.map((item, fIdx) => (
                                                <li key={fIdx} className="flex items-start gap-2">
                                                    <svg
                                                        className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2.5}
                                                            d="M5 13l4 4L19 7"
                                                        />
                                                    </svg>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleSelectPackage(plan)}
                                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                        plan.isFeatured
                                            ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/40'
                                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                    }`}
                                >
                                    <span>{plan.buttonText || 'Chọn gói cước này'}</span>
                                    <svg
                                        className="w-3.5 h-3.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                                        />
                                    </svg>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </section>

                        {/* 2. DANH SÁCH TÀI XẾ CHUYÊN NGHIỆP */}
            <section id="drivers-section" className="pt-8 border-t border-slate-800">
                <div className="text-center max-w-2xl mx-auto mb-10">
                    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400 bg-gradient-to-r from-red-950/90 via-red-900/40 to-red-950/90 px-4 py-1.5 rounded-full border border-red-500/30 shadow-inner">
                        <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Đội Ngũ Tài Xế Tiêu Chuẩn 5 Sao</span>
                    </div>

                    <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3 tracking-tight">
                        Tài Xế Phục Vụ <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-300">Tận Tâm & Chu Đáo</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto leading-relaxed">
                        100% tài xế chuyên nghiệp, lịch sự, kinh nghiệm lâu năm. Luôn đảm bảo an toàn, đúng giờ và đồng hành cùng quý khách trên mọi chặng đường.
                    </p>

                    {/* Cam kết dịch vụ ngắn */}
                    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-4 text-[11px] sm:text-xs text-slate-300">
                        <span className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Đón đúng giờ 100%
                        </span>
                        <span className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Không mùi say xe • Xe sạch mát
                        </span>
                        <span className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Hỗ trợ hành lý tận tình
                        </span>
                    </div>
                </div>

                <div className={`flex flex-wrap justify-center gap-6 items-stretch ${drivers.length === 1 ? 'max-w-md mx-auto' : ''}`}>
                    {drivers.map((driver) => {
                        const isMainDriver = driver.id === '1' || String(driver.id) === '1' || (driver.tag && driver.tag.includes('nhất'));

                        return (
                            <div
                                key={driver.id}
                                className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 w-full ${
                                    drivers.length > 1 ? 'sm:max-w-sm md:w-[360px]' : 'max-w-md'
                                } ${
                                    isMainDriver
                                        ? 'bg-gradient-to-b from-slate-900 via-slate-900/95 to-red-950/40 border-2 border-red-500/80 shadow-[0_0_35px_rgba(220,38,38,0.25)] ring-1 ring-red-500/30 md:-translate-y-2'
                                        : 'bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-xl hover:shadow-2xl hover:shadow-slate-950/60'
                                }`}
                            >
                                {/* Badge nổi bật dành riêng cho chủ xe / tài xế chính */}
                                {isMainDriver && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                        <span className="px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 text-white shadow-lg shadow-red-900/50 flex items-center gap-1 border border-white/20">
                                            <svg className="w-3.5 h-3.5 fill-amber-300" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            Chủ Xe • Ưu Tiên Phục Vụ
                                        </span>
                                    </div>
                                )}

                                <div>
                                    {/* Header tài xế: Avatar, Trạng thái online & Đánh giá */}
                                    <div className="flex items-start gap-4 pb-4 border-b border-slate-800/80">
                                        <div className="relative shrink-0">
                                            <img
                                                src={driver.avatar}
                                                alt={driver.name}
                                                className={`w-20 h-20 rounded-2xl object-cover shadow-md ${
                                                    isMainDriver
                                                        ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-slate-950'
                                                        : 'ring-2 ring-slate-700 ring-offset-2 ring-offset-slate-950'
                                                }`}
                                            />
                                            {/* Chấm xanh trạng thái Online có hiệu ứng ping */}
                                            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
                                            </span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="text-lg font-bold text-white truncate">
                                                    {driver.name}
                                                </h3>
                                                {/* Badge xác minh danh tính */}
                                                <span
                                                    title="Đã xác minh bằng lái & danh tính"
                                                    className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 shrink-0"
                                                >
                                                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </span>
                                            </div>

                                            {/* Rating & Chuyến đi */}
                                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs">
                                                    <span>★</span>
                                                    <span>{driver.rating}</span>
                                                </div>
                                                <span className="text-xs text-slate-400 font-medium">
                                                    {driver.tripsCount.toLocaleString('vi-VN')} chuyến
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Khối thông tin Phương tiện & Biển số xe dập nổi */}
                                    <div className="mt-4 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400 flex items-center gap-1.5">
                                                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7h8m-8 4h8m-4 4h4M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                                                </svg>
                                                Dòng xe:
                                            </span>
                                            <span className="font-bold text-slate-100 truncate ml-2">
                                                {driver.carModel}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/50">
                                            <span className="text-slate-400 flex items-center gap-1.5">
                                                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                Biển số xe:
                                            </span>
                                            {/* Biển số chuẩn phong cách phản quang dập nổi */}
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-white text-slate-900 font-medium font-bold text-sm tracking-wider shadow-sm border border-slate-300">
                                                {driver.plateNumber}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Kinh nghiệm tài xế */}
                                    <div className="mt-3.5 flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                                        <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{driver.experience}</span>
                                    </div>

                                    {/* Tag ưu điểm */}
                                    <div className="mt-3">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold ${
                                            isMainDriver
                                                ? 'bg-red-950/70 text-red-300 border border-red-800/50'
                                                : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/50'
                                        }`}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                            {driver.tag}
                                        </span>
                                    </div>
                                </div>

                                {/* Nút hành động kép: Gọi trực tiếp + Chọn tài xế */}
                                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2">
                                    <a
                                        href={`tel:${driver.phone.replace(/[^0-9]/g, '')}`}
                                        title={`Gọi cho ${driver.name} (${driver.phone})`}
                                        className="p-2.5 rounded-xl text-slate-300 bg-slate-800 hover:bg-emerald-600 hover:text-white border border-slate-700 hover:border-emerald-500 transition-all duration-200 flex items-center justify-center shrink-0 cursor-pointer"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </a>

                                    <button
                                        type="button"
                                        onClick={() => handleChooseDriver(driver.id)}
                                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                                            isMainDriver
                                                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-900/40 border border-red-500/50'
                                                : 'bg-slate-800 hover:bg-red-600 text-white border border-slate-700 hover:border-red-500'
                                        }`}
                                    >
                                        <span>Chọn tài xế {driver.name}</span>
                                        <svg
                                            className="w-3.5 h-3.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
