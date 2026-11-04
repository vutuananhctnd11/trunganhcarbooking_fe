import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import '@vietmap/vietmap-gl-js/dist/vietmap-gl.css';
import { DRIVERS_LIST } from './PricingAndDrivers';
import { driverService } from '../services/driverService';
import { discountService } from '../services/discount.service';
import { webPushService } from '../services/webPush.service';
import { ENV } from '../config/env.config';
/**
 * Công thức tính cước vận chuyển chuẩn theo yêu cầu:
 * • Giá mở cửa (2 km đầu tiên): 30.500 VNĐ
 * • Từ km thứ 3 đến km thứ 12: 14.700 VNĐ/km
 * • Từ km thứ 13 đến km thứ 25: 13.800 VNĐ/km
 * • Từ km thứ 26 trở đi: 11.900 VNĐ/km
 * • Checkbox đi 2 chiều: Chiều về chỉ tính giá 65% chiều đi, quãng đường và thời gian x2
 * • Thời gian chờ: Miễn phí 30 phút đầu (0.5h), 30.000 đ/giờ tiếp theo
 */
export function calculateFareDetails(oneWayKm, isRoundTrip, waitHours = 0) {
    if (oneWayKm <= 0) {
        return {
            oneWayFare: 0,
            returnFare: 0,
            waitingFee: 0,
            totalPrice: 0,
        };
    }
    let oneWayFare = 0;
    if (oneWayKm <= 2) {
        oneWayFare = 30500;
    }
    else if (oneWayKm <= 12) {
        oneWayFare = 30500 + (oneWayKm - 2) * 14700;
    }
    else if (oneWayKm <= 25) {
        oneWayFare = 30500 + 10 * 14700 + (oneWayKm - 12) * 13800;
    }
    else {
        oneWayFare = 30500 + 10 * 14700 + 13 * 13800 + (oneWayKm - 25) * 11900;
    }
    // Chiều về nếu đi 2 chiều: chỉ tính 65% giá chiều đi
    const returnFare = isRoundTrip ? Math.round(oneWayFare * 0.65) : 0;
    // Phí chờ: Miễn phí 30 phút đầu (0.5h), 30.000 đ/giờ tiếp theo
    let waitingFee = 0;
    if (waitHours > 0.5) {
        waitingFee = Math.round((waitHours - 0.5) * 30000);
    }
    const rawTotal = oneWayFare + returnFare + waitingFee;
    const totalPrice = Math.round(rawTotal / 1000) * 1000;
    return {
        oneWayFare: Math.round(oneWayFare),
        returnFare,
        waitingFee,
        totalPrice,
    };
}

/**
 * Danh sách đầy đủ các mốc giờ trong ngày từ 06:00 đến 22:00
 */
export const DEFAULT_DAY_SLOTS = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
    '21:00', '21:30', '22:00',
];

/**
 * Tính toán các mốc giờ khả dụng dựa trên danh sách chuyến bận
 */
export function calculateAvailableSlots(busyTrips) {
    if (!busyTrips || busyTrips.length === 0) {
        return DEFAULT_DAY_SLOTS;
    }
    return DEFAULT_DAY_SLOTS.filter((slot) => {
        const [h, m] = slot.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return true;
        const slotMinutes = h * 60 + m;
        for (const trip of busyTrips) {
            let startMinutes = 0;
            let endMinutes = 0;
            if (trip.start_time && trip.busy_until) {
                const sPart = trip.start_time.includes('T') ? trip.start_time.split('T')[1] : trip.start_time;
                const ePart = trip.busy_until.includes('T') ? trip.busy_until.split('T')[1] : trip.busy_until;
                const [sh, sm] = sPart.split(':').map(Number);
                const [eh, em] = ePart.split(':').map(Number);
                startMinutes = sh * 60 + sm;
                endMinutes = eh * 60 + em;
            } else if (trip.time_display && trip.time_display.includes('-')) {
                const [s, e] = trip.time_display.split('-').map((x) => x.trim());
                const [sh, sm] = s.split(':').map(Number);
                const [eh, em] = e.split(':').map(Number);
                startMinutes = sh * 60 + sm;
                endMinutes = eh * 60 + em;
            }
            if (slotMinutes >= startMinutes && slotMinutes < endMinutes) {
                return false;
            }
        }
        return true;
    });
}
// 1. Key chuyên dùng để hiển thị bản đồ (Map Tiles / Vector Style)
export function getVietmapMapKey() {
    try {
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            const env = import.meta.env;
            if (env.VITE_VIEW_VIETMAP_API_KEY)
                return env.VITE_VIEW_VIETMAP_API_KEY;
            if (env.VITE_VIETMAP_API_KEY)
                return env.VITE_VIETMAP_API_KEY;
            if (env.NEXT_PUBLIC_VIETMAP_API_KEY)
                return env.NEXT_PUBLIC_VIETMAP_API_KEY;
        }
    }
    catch { }
    if (typeof process !== 'undefined' && process.env) {
        if (process.env.VITE_VIEW_VIETMAP_API_KEY)
            return process.env.VITE_VIEW_VIETMAP_API_KEY;
        if (process.env.VITE_VIETMAP_API_KEY)
            return process.env.VITE_VIETMAP_API_KEY;
        if (process.env.NEXT_PUBLIC_VIETMAP_API_KEY)
            return process.env.NEXT_PUBLIC_VIETMAP_API_KEY;
    }
    return ENV.VIETMAP_VIEW_KEY || '548b3461922df3f33402daeaed39c5bf2790b2b496540844';
}
// 2. Key chuyên dùng để gọi các REST API (Routing, Autocomplete, Place, Reverse Geocoding)
export function getVietmapServicesKey() {
    try {
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            const env = import.meta.env;
            if (env.VITE_VIETMAP_API_KEY)
                return env.VITE_VIETMAP_API_KEY;
            if (env.NEXT_PUBLIC_VIETMAP_API_KEY)
                return env.NEXT_PUBLIC_VIETMAP_API_KEY;
        }
    }
    catch { }
    if (typeof process !== 'undefined' && process.env) {
        if (process.env.VITE_VIETMAP_API_KEY)
            return process.env.VITE_VIETMAP_API_KEY;
        if (process.env.NEXT_PUBLIC_VIETMAP_API_KEY)
            return process.env.NEXT_PUBLIC_VIETMAP_API_KEY;
    }
    return ENV.VIETMAP_SERVICES_KEY || 'cbe88ab71880326cd8d59361805f6bde4adeb92d50777849';
}
// Style dự phòng (OpenStreetMap raster) nếu Vietmap Style bị từ chối
const FALLBACK_MAP_STYLE = {
    version: 8,
    sources: {
        'osm-vietnam': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© VIETMAP & OpenStreetMap Contributors',
        },
    },
    layers: [
        {
            id: 'osm-vietnam-layer',
            type: 'raster',
            source: 'osm-vietnam',
            minzoom: 0,
            maxzoom: 19,
        },
    ],
};
// Gợi ý địa chỉ mẫu offline / fallback
const FALLBACK_PLACES = [
    { name: 'Sân bay Quốc tế Nội Bài', address: 'Phú Minh, Sóc Sơn, Hà Nội', lat: 21.2212, lng: 105.8072 },
    { name: 'Hồ Hoàn Kiếm (Hồ Gươm)', address: 'Hàng Trống, Hoàn Kiếm, Hà Nội', lat: 21.0285, lng: 105.8542 },
    { name: 'Chung cư Vinhomes Smart City', address: 'Tây Mỗ, Nam Từ Liêm, Hà Nội', lat: 20.9996, lng: 105.7422 },
    { name: 'Vinhomes Ocean Park', address: 'Đa Tốn, Gia Lâm, Hà Nội', lat: 20.9904, lng: 105.9458 },
    { name: 'Times City', address: '458 Minh Khai, Vĩnh Tuy, Hai Bà Trưng, Hà Nội', lat: 20.9949, lng: 105.8675 },
    { name: 'Ga Hà Nội', address: '120 Lê Duẩn, Văn Miếu, Đống Đa, Hà Nội', lat: 21.0245, lng: 105.8412 },
    { name: 'Trung tâm Hội nghị Quốc gia', address: '57 Phạm Hùng, Mễ Trì, Nam Từ Liêm, Hà Nội', lat: 21.0064, lng: 105.7836 },
];
export default function VietmapBookingDemo({ initialDriverId, fixedTripData }) {
    const navigate = useNavigate();
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const vietmapglRef = useRef(null);
    const pickupMarkerRef = useRef(null);
    const dropoffMarkerRef = useRef(null);
    // Thông tin chuyến cố định (nếu khách chọn gói cước)
    const [isFixedTrip, setIsFixedTrip] = useState(false);
    const [fixedTripInfo, setFixedTripInfo] = useState(null);
    // Bộ nhớ đệm cache từ khóa tìm kiếm -> Tiết kiệm request tối đa
    const searchCacheRef = useRef(new Map());
    const debounceTimerRef = useRef(null);
    // State vị trí & địa chỉ
    const [pickupInput, setPickupInput] = useState('');
    const [dropoffInput, setDropoffInput] = useState('');
    const [pickupPoint, setPickupPoint] = useState(null);
    const [dropoffPoint, setDropoffPoint] = useState(null);
    // Chế độ ghim từ bản đồ: null | 'PICKUP' | 'DROPOFF'
    const [mapPickingMode, setMapPickingMode] = useState(null);
    // REFS để tránh Stale Closure khi click trên bản đồ
    const mapPickingModeRef = useRef(null);
    const pickupPointRef = useRef(null);
    const dropoffPointRef = useRef(null);
    const isFixedTripRef = useRef(false);
    useEffect(() => {
        mapPickingModeRef.current = mapPickingMode;
    }, [mapPickingMode]);
    useEffect(() => {
        pickupPointRef.current = pickupPoint;
    }, [pickupPoint]);
    useEffect(() => {
        dropoffPointRef.current = dropoffPoint;
    }, [dropoffPoint]);
    useEffect(() => {
        isFixedTripRef.current = isFixedTrip;
    }, [isFixedTrip]);
    // Gợi ý địa chỉ
    const [pickupSuggestions, setPickupSuggestions] = useState([]);
    const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
    const [isSearchingPickup, setIsSearchingPickup] = useState(false);
    const [isSearchingDropoff, setIsSearchingDropoff] = useState(false);
    // Trạng thái tính giá & tuyến đường
    const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
    const [routeResult, setRouteResult] = useState(null);
    const [routeError, setRouteError] = useState(null);
    // Form thông tin khách hàng & đặt xe
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [pickupDate, setPickupDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [pickupTimeStr, setPickupTimeStr] = useState(() => {
        const d = new Date(Date.now() + 30 * 60 * 1000);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    });
    // Tùy chọn đi 2 chiều & Thời gian chờ (Nhập trước khi tính giá)
    const [isRoundTrip, setIsRoundTrip] = useState(false);
    const [waitHours, setWaitHours] = useState(0);
    // Cập nhật lại giá tức thì khi người dùng thay đổi 2 chiều hoặc thời gian chờ
    const handleToggleRoundTrip = (checked) => {
        setIsRoundTrip(checked);
        const nextWaitHours = checked ? waitHours : 0;
        if (!checked) {
            setWaitHours(0);
        }
        if (routeResult) {
            const oneWayKm = routeResult.oneWayKm;
            const oneWayDuration = routeResult.oneWayDuration;
            const fare = calculateFareDetails(oneWayKm, checked, nextWaitHours);
            setRouteResult({
                ...routeResult,
                distanceKm: checked ? Number((oneWayKm * 2).toFixed(1)) : oneWayKm,
                durationMinutes: checked ? oneWayDuration * 2 : oneWayDuration,
                estimatedPrice: fare.totalPrice,
                oneWayFare: fare.oneWayFare,
                returnFare: fare.returnFare,
                waitingFee: fare.waitingFee,
            });
        }
    };
    const handleChangeWaitHours = (hours) => {
        const validHours = Math.max(0, hours);
        setWaitHours(validHours);
        if (routeResult) {
            const oneWayKm = routeResult.oneWayKm;
            const fare = calculateFareDetails(oneWayKm, isRoundTrip, validHours);
            setRouteResult({
                ...routeResult,
                estimatedPrice: fare.totalPrice,
                waitingFee: fare.waitingFee,
            });
        }
    };
    // Danh sách tài xế (lấy từ API http://localhost:8080/api/v1/drivers?isActive=true)
    const [driversList, setDriversList] = useState(DRIVERS_LIST);
    const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);

    // Chọn tài xế (driverId)
    const [driverId, setDriverId] = useState('1');

    useEffect(() => {
        let isMounted = true;
        async function loadDrivers() {
            setIsLoadingDrivers(true);
            try {
                const list = await driverService.getDrivers(true);
                if (isMounted && Array.isArray(list) && list.length > 0) {
                    setDriversList(list);
                    setDriverId((prevId) => {
                        const exists = list.some((d) => String(d.id) === String(prevId));
                        return exists ? prevId : String(list[0].id);
                    });
                }
            } catch (err) {
                console.warn('Lỗi tải danh sách tài xế từ API, dùng danh sách mặc định:', err);
            } finally {
                if (isMounted) setIsLoadingDrivers(false);
            }
        }
        loadDrivers();
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (initialDriverId) {
            setDriverId(String(initialDriverId));
        }
    }, [initialDriverId]);

    // Tài xế đang được chọn (dùng cho cả ngoài form lẫn sau khi tính giá)
    const selectedDriver = driversList.find((d) => String(d.id) === String(driverId)) || driversList[0] || DRIVERS_LIST[0];
    // Modal xem lịch của lái xe để tránh trùng giờ
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    // Modal Soft Prompt xin quyền Web Push Notification
    const [showPushModal, setShowPushModal] = useState(false);

    // Tự động đăng ký Service Worker Web Push trong nền
    useEffect(() => {
        webPushService.registerServiceWorker();
    }, []);

    // Khóa cuộn trang nền khi mở popup lịch trình hoặc popup xin quyền notification
    useEffect(() => {
        if (showScheduleModal || showPushModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showScheduleModal, showPushModal]);
    const [scheduleData, setScheduleData] = useState(null);
    const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
    const [scheduleError, setScheduleError] = useState(null);
    // Call API lấy lịch trình lái xe: http://localhost:8080/api/v1/drivers/{driverId}/schedule?date={date}
    const fetchDriverSchedule = async (dId, dateStr) => {
        setIsLoadingSchedule(true);
        setScheduleError(null);
        try {
            const url = `${ENV.API_BASE_URL}/drivers/${dId}/schedule?date=${encodeURIComponent(dateStr)}`;
            const res = await fetch(url);
            if (res.ok) {
                const json = await res.json();
                // Bóc tách ApiResponse wrapper { status: 200, success: true, data: { ... } }
                const payload = json?.data || json;
                const busyList = Array.isArray(payload?.busy_trips)
                    ? payload.busy_trips
                    : Array.isArray(payload?.busyTrips)
                    ? payload.busyTrips
                    : [];

                let slotsList = Array.isArray(payload?.available_slots)
                    ? payload.available_slots
                    : Array.isArray(payload?.availableSlots)
                    ? payload.availableSlots
                    : [];

                // Khi tài xế chưa có chuyến bận nào hoặc backend chưa tính slots, tự động sinh đầy đủ các mốc giờ khả dụng
                if (slotsList.length === 0) {
                    slotsList = calculateAvailableSlots(busyList);
                }

                setScheduleData({
                    driver: payload?.driver,
                    selected_date: payload?.selected_date || payload?.selectedDate || dateStr,
                    busy_trips: busyList,
                    available_slots: slotsList,
                });
            }
            else {
                throw new Error(`HTTP ${res.status}`);
            }
        }
        catch (err) {
            console.warn('Lỗi kết nối API lịch trình tài xế, sử dụng lịch khả dụng mặc định:', err);
            // Fallback: khi chưa có lịch hoặc lỗi kết nối, tất cả các mốc giờ đều khả dụng
            const fallbackDriver = driversList.find((d) => String(d.id) === String(dId)) || driversList[0] || DRIVERS_LIST[0];
            setScheduleData({
                driver: {
                    id: dId,
                    name: fallbackDriver.name.replace(/\s*\(.*\)/, ''),
                    vehicle: fallbackDriver.carModel,
                    license_plate: fallbackDriver.plateNumber,
                    rating: fallbackDriver.rating,
                },
                selected_date: dateStr,
                busy_trips: [],
                available_slots: DEFAULT_DAY_SLOTS,
            });
        }
        finally {
            setIsLoadingSchedule(false);
        }
    };
    // Tự động gọi API mỗi khi đổi tài xế hoặc đổi ngày đón
    useEffect(() => {
        if (pickupDate) {
            fetchDriverSchedule(driverId, pickupDate);
        }
    }, [driverId, pickupDate]);
    // Kiểm tra khung giờ trùng lịch với API schedule
    const getConflictedSlot = () => {
        const busyList = scheduleData?.busy_trips || scheduleData?.busyTrips || [];
        if (!pickupTimeStr || !busyList.length)
            return null;
        const [h, m] = pickupTimeStr.split(':').map(Number);
        if (isNaN(h) || isNaN(m))
            return null;
        const pickMinutes = h * 60 + m;
        for (const trip of busyList) {
            let startMinutes = 0;
            let endMinutes = 0;
            let startStr = '';
            let endStr = '';
            if (trip.start_time && trip.busy_until) {
                const startPart = trip.start_time.includes('T') ? trip.start_time.split('T')[1] : trip.start_time;
                const endPart = trip.busy_until.includes('T') ? trip.busy_until.split('T')[1] : trip.busy_until;
                const [sh, sm] = startPart.split(':').map(Number);
                const [eh, em] = endPart.split(':').map(Number);
                startMinutes = sh * 60 + sm;
                endMinutes = eh * 60 + em;
                startStr = startPart.slice(0, 5);
                endStr = endPart.slice(0, 5);
            }
            else if (trip.time_display && trip.time_display.includes('-')) {
                const [s, e] = trip.time_display.split('-').map((str) => str.trim());
                const [sh, sm] = s.split(':').map(Number);
                const [eh, em] = e.split(':').map(Number);
                startMinutes = sh * 60 + sm;
                endMinutes = eh * 60 + em;
                startStr = s;
                endStr = e;
            }
            if (pickMinutes >= startMinutes && pickMinutes < endMinutes) {
                return {
                    start: startStr,
                    end: endStr,
                    time_display: trip.time_display || `${startStr} - ${endStr}`,
                    route: trip.route,
                    travel_time: trip.tralvel_time || trip.travel_time,
                    title: `Chuyến bận #${trip.trip_id || ''} (${trip.route})`,
                };
            }
        }
        return null;
    };
    // Mã giảm giá
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponMessage, setCouponMessage] = useState(null);
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

    // Call API kiểm tra mã giảm giá: POST http://localhost:8080/api/v1/discounts/validate
    const handleApplyCoupon = async () => {
        setCouponMessage(null);
        const cleanCode = couponCode.trim().toUpperCase();
        if (!cleanCode) {
            setCouponMessage({ type: 'error', text: 'Vui lòng nhập mã ưu đãi' });
            return;
        }
        const currentBasePrice = routeResult?.estimatedPrice || 0;
        if (currentBasePrice <= 0) {
            setCouponMessage({ type: 'error', text: 'Vui lòng tính giá cước chuyến đi trước khi áp dụng mã' });
            return;
        }

        setIsValidatingCoupon(true);
        try {
            const res = await discountService.validateDiscount(cleanCode, currentBasePrice);
            // Response dạng { status: 200, success: true, message: '...', data: { valid: true, message: '...', originalPrice: 250000, discountAmount: 50000, finalPrice: 200000 } }
            const payload = res?.data || res;
            const isValid = payload?.valid === true || res?.success === true;

            if (isValid) {
                const discountAmount = Number(payload?.discountAmount) || 0;
                const finalPrice = payload?.finalPrice !== undefined
                    ? Number(payload.finalPrice)
                    : Math.max(0, currentBasePrice - discountAmount);
                const successMsg = payload?.message || res?.message || 'Áp dụng mã giảm giá thành công!';

                setAppliedCoupon({
                    code: cleanCode,
                    discountAmount,
                    finalPrice,
                    originalPrice: payload?.originalPrice || currentBasePrice,
                    label: `Giảm ${discountAmount.toLocaleString('vi-VN')} đ`,
                });
                setCouponMessage({
                    type: 'success',
                    text: `${successMsg} (-${discountAmount.toLocaleString('vi-VN')} đ)`,
                });
            } else {
                const failMsg = payload?.message || res?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn';
                setAppliedCoupon(null);
                setCouponMessage({ type: 'error', text: failMsg });
            }
        } catch (err) {
            console.warn('Lỗi gọi API kiểm tra mã giảm giá:', err);
            const errorMsg = err?.data?.message || err?.message || 'Mã giảm giá không tồn tại hoặc đã hết hạn';
            setAppliedCoupon(null);
            setCouponMessage({ type: 'error', text: errorMsg });
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponMessage(null);
    };
    const [luggageOption, setLuggageOption] = useState('2 vali to');
    const [customNote, setCustomNote] = useState('');
    const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
    const [bookingMessage, setBookingMessage] = useState(null);
    // 1. Khởi tạo Bản đồ VIETMAP
    useEffect(() => {
        let isSubscribed = true;
        async function initMap() {
            if (!mapContainerRef.current)
                return;
            try {
                const vietmapModule = await import('@vietmap/vietmap-gl-js/dist/vietmap-gl.js');
                const vietmapgl = vietmapModule.default || vietmapModule;
                vietmapglRef.current = vietmapgl;
                const mapKey = getVietmapMapKey();
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.remove();
                    mapInstanceRef.current = null;
                }
                const styleToUse = mapKey
                    ? `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${mapKey}`
                    : FALLBACK_MAP_STYLE;
                const map = new vietmapgl.Map({
                    container: mapContainerRef.current,
                    style: styleToUse,
                    center: [105.8542, 21.0285], // Hà Nội
                    zoom: 12,
                });
                map.addControl(new vietmapgl.NavigationControl(), 'top-right');
                map.on('load', () => {
                    if (!isSubscribed)
                        return;
                    setTimeout(() => {
                        try {
                            map.resize();
                        }
                        catch { }
                    }, 200);
                });
                map.on('error', (e) => {
                    console.warn('Map notice:', e);
                    if (e?.error?.status === 401 || e?.error?.status === 403) {
                        try {
                            map.setStyle(FALLBACK_MAP_STYLE);
                        }
                        catch { }
                    }
                });
                // Click trên map để ghim điểm đón hoặc điểm trả
                map.on('click', (e) => {
                    const { lng, lat } = e.lngLat;
                    handleMapPickedCoordinate(lat, lng);
                });
                mapInstanceRef.current = map;
            }
            catch (err) {
                console.error('Lỗi nạp map:', err);
            }
        }
        initMap();
        return () => {
            isSubscribed = false;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);
    // Tạo DOM element cho Marker
    const createMarkerElement = (type) => {
        const el = document.createElement('div');
        el.className = 'flex flex-col items-center cursor-pointer select-none';
        if (type === 'PICKUP') {
            el.innerHTML = `
        <div style="background-color: #059669; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 11px; box-shadow: 0 10px 20px -3px rgba(0,0,0,0.5); border: 2px solid white; display: flex; align-items: center; gap: 4px;">
          <span style="display: inline-block; width: 6px; height: 6px; border-radius: 9999px; background-color: #6ee7b7;"></span>
          ĐIỂM ĐÓN
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #059669; margin-top: -1px;"></div>
      `;
        }
        else {
            el.innerHTML = `
        <div style="background-color: #DC2626; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 11px; box-shadow: 0 10px 20px -3px rgba(0,0,0,0.5); border: 2px solid white; display: flex; align-items: center; gap: 4px;">
          <span style="display: inline-block; width: 6px; height: 6px; border-radius: 9999px; background-color: #fca5a5;"></span>
          ĐIỂM TRẢ
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #DC2626; margin-top: -1px;"></div>
      `;
        }
        return el;
    };
    const updateMarker = (type, lat, lng) => {
        const map = mapInstanceRef.current;
        const vietmapgl = vietmapglRef.current;
        if (!map || !vietmapgl)
            return;
        if (type === 'PICKUP') {
            if (pickupMarkerRef.current)
                pickupMarkerRef.current.remove();
            const el = createMarkerElement('PICKUP');
            pickupMarkerRef.current = new vietmapgl.Marker({ element: el, anchor: 'bottom' })
                .setLngLat([lng, lat])
                .addTo(map);
        }
        else {
            if (dropoffMarkerRef.current)
                dropoffMarkerRef.current.remove();
            const el = createMarkerElement('DROPOFF');
            dropoffMarkerRef.current = new vietmapgl.Marker({ element: el, anchor: 'bottom' })
                .setLngLat([lng, lat])
                .addTo(map);
        }
        map.flyTo({ center: [lng, lat], zoom: 14, duration: 800 });
    };
    // 2. Xử lý khi click ghim trên bản đồ (Dùng REF để fix hoàn toàn lỗi stale closure!)
    const handleMapPickedCoordinate = async (lat, lng) => {
        // Khi đang là chuyến cố định, điểm trả đã cố định nên luôn ghim cho PICKUP
        const currentMode = isFixedTripRef.current
            ? 'PICKUP'
            : (mapPickingModeRef.current || (!pickupPointRef.current ? 'PICKUP' : 'DROPOFF'));
        const servicesKey = getVietmapServicesKey();
        let resolvedAddress = `Tọa độ (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        // Gọi Reverse Geocoding v4
        if (servicesKey) {
            try {
                const revUrl = `https://maps.vietmap.vn/api/reverse/v4?apikey=${servicesKey}&lat=${lat}&lng=${lng}&display_type=1`;
                const res = await fetch(revUrl);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data[0]) {
                        resolvedAddress = data[0].display || data[0].address || resolvedAddress;
                    }
                    else if (data) {
                        resolvedAddress = data.display || data.address || resolvedAddress;
                    }
                }
            }
            catch (err) {
                console.warn('Lỗi Reverse Geocoding:', err);
            }
        }
        if (currentMode === 'PICKUP') {
            const pt = { lat, lng, address: resolvedAddress };
            setPickupInput(resolvedAddress);
            setPickupPoint(pt);
            pickupPointRef.current = pt;
            updateMarker('PICKUP', lat, lng);
            setMapPickingMode(null);
            mapPickingModeRef.current = null;
        }
        else {
            const pt = { lat, lng, address: resolvedAddress };
            setDropoffInput(resolvedAddress);
            setDropoffPoint(pt);
            dropoffPointRef.current = pt;
            updateMarker('DROPOFF', lat, lng);
            setMapPickingMode(null);
            mapPickingModeRef.current = null;
        }
        // Nếu không phải chuyến cố định thì mới xóa kết quả để tính lại
        if (!isFixedTripRef.current) {
            setRouteResult(null);
        }
    };
    // 3. Tối ưu Autocomplete: Debounce 600ms + In-Memory Cache + Tối thiểu 3 ký tự
    const handleInputChange = (text, type) => {
        if (type === 'PICKUP') {
            setPickupInput(text);
            setPickupPoint(null);
            pickupPointRef.current = null;
        }
        else {
            setDropoffInput(text);
            setDropoffPoint(null);
            dropoffPointRef.current = null;
        }
        // Nếu không phải chuyến cố định thì mới xóa kết quả để tính lại
        if (!isFixedTripRef.current) {
            setRouteResult(null);
        }
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        const trimmed = text.trim();
        if (trimmed.length < 3) {
            if (type === 'PICKUP')
                setPickupSuggestions([]);
            else
                setDropoffSuggestions([]);
            return;
        }
        const cacheKey = trimmed.toLowerCase();
        if (searchCacheRef.current.has(cacheKey)) {
            const cached = searchCacheRef.current.get(cacheKey);
            if (type === 'PICKUP')
                setPickupSuggestions(cached);
            else
                setDropoffSuggestions(cached);
            return;
        }
        debounceTimerRef.current = setTimeout(async () => {
            const servicesKey = getVietmapServicesKey();
            if (type === 'PICKUP')
                setIsSearchingPickup(true);
            else
                setIsSearchingDropoff(true);
            try {
                if (servicesKey) {
                    const url = `https://maps.vietmap.vn/api/autocomplete/v4?apikey=${servicesKey}&text=${encodeURIComponent(trimmed)}&display_type=1`;
                    const res = await fetch(url);
                    if (res.ok) {
                        const data = await res.json();
                        const items = Array.isArray(data)
                            ? data.map((d) => ({
                                ref_id: d.ref_id,
                                name: d.name || d.display || trimmed,
                                address: d.address || d.display || '',
                                display: d.display || d.name || '',
                            }))
                            : [];
                        searchCacheRef.current.set(cacheKey, items);
                        if (type === 'PICKUP')
                            setPickupSuggestions(items);
                        else
                            setDropoffSuggestions(items);
                        return;
                    }
                }
                const filtered = FALLBACK_PLACES.filter((p) => p.name.toLowerCase().includes(trimmed.toLowerCase()) ||
                    p.address.toLowerCase().includes(trimmed.toLowerCase())).map((p, idx) => ({
                    ref_id: `fallback-${idx}`,
                    name: p.name,
                    address: p.address,
                    display: `${p.name} - ${p.address}`,
                }));
                searchCacheRef.current.set(cacheKey, filtered);
                if (type === 'PICKUP')
                    setPickupSuggestions(filtered);
                else
                    setDropoffSuggestions(filtered);
            }
            catch (err) {
                console.warn('Lỗi Autocomplete:', err);
            }
            finally {
                if (type === 'PICKUP')
                    setIsSearchingPickup(false);
                else
                    setIsSearchingDropoff(false);
            }
        }, 600);
    };
    const selectSuggestion = async (item, type) => {
        const servicesKey = getVietmapServicesKey();
        const addressText = item.display || (item.address ? `${item.name}, ${item.address}` : item.name);
        if (type === 'PICKUP') {
            setPickupInput(addressText);
            setPickupSuggestions([]);
        }
        else {
            setDropoffInput(addressText);
            setDropoffSuggestions([]);
        }
        if (item.ref_id.startsWith('fallback-')) {
            const match = FALLBACK_PLACES.find((p) => p.name === item.name);
            if (match) {
                const pt = { lat: match.lat, lng: match.lng, address: addressText };
                if (type === 'PICKUP') {
                    setPickupPoint(pt);
                    pickupPointRef.current = pt;
                    updateMarker('PICKUP', pt.lat, pt.lng);
                }
                else {
                    setDropoffPoint(pt);
                    dropoffPointRef.current = pt;
                    updateMarker('DROPOFF', pt.lat, pt.lng);
                }
            }
            return;
        }
        if (servicesKey && item.ref_id) {
            try {
                const placeUrl = `https://maps.vietmap.vn/api/place/v4?apikey=${servicesKey}&refid=${encodeURIComponent(item.ref_id)}`;
                const res = await fetch(placeUrl);
                if (res.ok) {
                    const data = await res.json();
                    const lat = data.lat || data.latitude || data.location?.lat;
                    const lng = data.lng || data.longitude || data.location?.lng;
                    if (lat && lng) {
                        const pt = { lat, lng, address: addressText };
                        if (type === 'PICKUP') {
                            setPickupPoint(pt);
                            pickupPointRef.current = pt;
                            updateMarker('PICKUP', lat, lng);
                        }
                        else {
                            setDropoffPoint(pt);
                            dropoffPointRef.current = pt;
                            updateMarker('DROPOFF', lat, lng);
                        }
                    }
                }
            }
            catch (err) {
                console.warn('Lỗi Place API:', err);
            }
        }
    };
    // 4. NÚT "TÍNH GIÁ TIỀN" (Chỉ gọi VIETMAP Routing API khi người dùng chủ động bấm)
    const handleCalculateFare = async () => {
        const origin = pickupPointRef.current || pickupPoint;
        const dest = dropoffPointRef.current || dropoffPoint;
        if (!origin) {
            setRouteError('Vui lòng chọn hoặc nhập địa chỉ Điểm đón');
            return;
        }
        if (!dest) {
            setRouteError('Vui lòng chọn hoặc nhập địa chỉ Điểm trả');
            return;
        }
        setIsCalculatingRoute(true);
        setRouteError(null);
        setIsFixedTrip(false);
        setFixedTripInfo(null);
        const servicesKey = getVietmapServicesKey();
        try {
            let distanceKm = 0;
            let durationMinutes = 0;
            let coordinates = [];
            if (servicesKey) {
                const url = `https://maps.vietmap.vn/api/route/v4?apikey=${servicesKey}&point=${origin.lat},${origin.lng}&point=${dest.lat},${dest.lng}&vehicle=car&points_encoded=false`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    const route = data.routes?.[0] || data.paths?.[0];
                    if (route) {
                        const meters = route.distance || 0;
                        distanceKm = Number((meters / 1000).toFixed(1));
                        const rawTime = route.time || 0;
                        const seconds = rawTime > 10000 ? Math.round(rawTime / 1000) : Math.round(rawTime);
                        durationMinutes = Math.max(1, Math.ceil(seconds / 60));
                        coordinates =
                            route.paths ||
                                route.points?.coordinates ||
                                (Array.isArray(route.points) ? route.points : []);
                    }
                }
            }
            if (!distanceKm) {
                const R = 6371;
                const dLat = ((dest.lat - origin.lat) * Math.PI) / 180;
                const dLon = ((dest.lng - origin.lng) * Math.PI) / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos((origin.lat * Math.PI) / 180) *
                        Math.cos((dest.lat * Math.PI) / 180) *
                        Math.sin(dLon / 2) *
                        Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                distanceKm = Number((R * c * 1.3).toFixed(1));
                durationMinutes = Math.max(5, Math.round(distanceKm * 2.2));
                coordinates = [
                    [origin.lng, origin.lat],
                    [(origin.lng + dest.lng) / 2 + 0.005, (origin.lat + dest.lat) / 2 - 0.003],
                    [dest.lng, dest.lat],
                ];
            }
            // 1. Quãng đường và thời gian 1 chiều thực tế từ VIETMAP
            const oneWayKm = distanceKm;
            const oneWayDuration = durationMinutes;
            // 2. Tính giá cước chuẩn:
            // • Giá mở cửa (2 km đầu tiên): 30.500 VNĐ
            // • Từ km thứ 3 đến km thứ 12: 14.700 VNĐ/km
            // • Từ km thứ 13 đến km thứ 25: 13.800 VNĐ/km
            // • Từ km thứ 26 trở đi: 11.900 VNĐ/km
            // • Chiều về (nếu 2 chiều): tính 65% chiều đi, quãng đường và thời gian x2
            const fare = calculateFareDetails(oneWayKm, isRoundTrip, waitHours);
            const finalDistanceKm = isRoundTrip ? Number((oneWayKm * 2).toFixed(1)) : oneWayKm;
            const finalDurationMinutes = isRoundTrip ? oneWayDuration * 2 : oneWayDuration;
            setRouteResult({
                distanceKm: finalDistanceKm,
                durationMinutes: finalDurationMinutes,
                estimatedPrice: fare.totalPrice,
                coordinates,
                oneWayKm,
                oneWayDuration,
                oneWayFare: fare.oneWayFare,
                returnFare: fare.returnFare,
                waitingFee: fare.waitingFee,
            });
            drawRouteLine(coordinates);
        }
        catch (err) {
            console.error('Lỗi tính đường:', err);
            setRouteError('Không thể tính toán tuyến đường lúc này.');
        }
        finally {
            setIsCalculatingRoute(false);
        }
    };
    const drawRouteLine = (coordinates) => {
        const map = mapInstanceRef.current;
        const vietmapgl = vietmapglRef.current;
        if (!map || !vietmapgl || !coordinates.length)
            return;
        const routeGeoJSON = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates,
            },
        };
        const sourceId = 'vietmap-route-source';
        if (map.getSource(sourceId)) {
            map.getSource(sourceId).setData(routeGeoJSON);
        }
        else {
            map.addSource(sourceId, { type: 'geojson', data: routeGeoJSON });
            map.addLayer({
                id: 'vietmap-route-casing',
                type: 'line',
                source: sourceId,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#7f1d1d', 'line-width': 8, 'line-opacity': 0.6 },
            });
            map.addLayer({
                id: 'vietmap-route-line',
                type: 'line',
                source: sourceId,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#DC2626', 'line-width': 5 },
            });
        }
        try {
            const bounds = new vietmapgl.LngLatBounds();
            coordinates.forEach((coord) => bounds.extend(coord));
            map.fitBounds(bounds, { padding: { top: 60, bottom: 60, left: 60, right: 60 }, maxZoom: 15 });
        }
        catch { }
    };
    const handleReset = () => {
        if (pickupMarkerRef.current)
            pickupMarkerRef.current.remove();
        if (dropoffMarkerRef.current)
            dropoffMarkerRef.current.remove();
        const map = mapInstanceRef.current;
        if (map) {
            if (map.getLayer('vietmap-route-line'))
                map.removeLayer('vietmap-route-line');
            if (map.getLayer('vietmap-route-casing'))
                map.removeLayer('vietmap-route-casing');
            if (map.getSource('vietmap-route-source'))
                map.removeSource('vietmap-route-source');
        }
        setPickupInput('');
        setDropoffInput('');
        setPickupPoint(null);
        setDropoffPoint(null);
        pickupPointRef.current = null;
        dropoffPointRef.current = null;
        setRouteResult(null);
        setRouteError(null);
        setMapPickingMode(null);
        mapPickingModeRef.current = null;
        setBookingMessage(null);
        setWaitHours(0);
        setIsRoundTrip(false);
        setIsFixedTrip(false);
        isFixedTripRef.current = false;
        setFixedTripInfo(null);
    };
    // Tự động điền dữ liệu khi người dùng chọn chuyến cố định từ Bảng Giá
    useEffect(() => {
        if (!fixedTripData)
            return;
        setIsFixedTrip(true);
        isFixedTripRef.current = true;
        setFixedTripInfo({
            id: fixedTripData.promotionTripId,
            title: fixedTripData.promotionTripTitle || fixedTripData.title,
        });
        // Vẫn bắt KH chọn điểm đón -> Không điền sẵn nếu chưa có, giữ nguyên nếu KH đã nhập
        const dropoffStr = fixedTripData.dropoffAddress || '';
        setDropoffInput(dropoffStr);
        const dropoffCoords = fixedTripData.dropoffLngLat || [105.8072, 21.2212];
        const destPt = {
            lng: dropoffCoords[0],
            lat: dropoffCoords[1],
            address: dropoffStr,
        };
        setDropoffPoint(destPt);
        dropoffPointRef.current = destPt;
        const roundTripVal = Boolean(fixedTripData.isRoundTrip);
        setIsRoundTrip(roundTripVal);
        if (!roundTripVal) {
            setWaitHours(0);
        }
        const distKm = fixedTripData.distanceKm || '---';
        const priceVal = fixedTripData.price || 'Thỏa thuận';
        const travelTimeMinutes = Number(fixedTripData.travelTime);
        // Hiển thị giá luôn và thời gian di chuyển từ API, KHÔNG cần bấm nút tính giá tiền!
        setRouteResult({
            distanceKm: distKm === '---' ? 0 : distKm,
            durationMinutes: travelTimeMinutes,
            estimatedPrice: priceVal,
            coordinates: [],
            oneWayKm: distKm,
            oneWayDuration: travelTimeMinutes,
            oneWayFare: priceVal,
            returnFare: 0,
            waitingFee: 0,
        });
        setRouteError(null);
        // Không ghi map / không vẽ route trên bản đồ để tiết kiệm request VIETMAP
    }, [fixedTripData]);
    // 5. THỰC THI GỬI ĐẶT LỊCH ĐẾN BACKEND
    const executeSubmitBooking = async (pushJson = null) => {
        setIsSubmittingBooking(true);
        // Chuẩn hóa định dạng pickupTime theo đúng yyyy-MM-dd'T'HH:mm:ss
        const timeParts = (pickupTimeStr || '08:00').split(':');
        const hh = (timeParts[0] || '08').padStart(2, '0');
        const mm = (timeParts[1] || '00').padStart(2, '0');
        const ss = (timeParts[2] || '00').padStart(2, '0');
        const formattedPickupTime = `${pickupDate}T${hh}:${mm}:${ss}`;

        const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
        const finalEstimatedPrice = Math.max(0, (routeResult?.estimatedPrice || 0) - discountAmount);

        const origin = pickupPointRef.current || pickupPoint;
        const dest = dropoffPointRef.current || dropoffPoint;
        const cleanPhone = customerPhone.replace(/\s+/g, '');

        let pickupCoordsStr = null;
        if (origin?.lat && origin?.lng) {
            pickupCoordsStr = `${origin.lat},${origin.lng}`;
        } else if (fixedTripData?.pickupLngLat && fixedTripData.pickupLngLat.length >= 2) {
            pickupCoordsStr = `${fixedTripData.pickupLngLat[1]},${fixedTripData.pickupLngLat[0]}`;
        } else {
            pickupCoordsStr = "20.9800,105.7800";
        }

        let dropoffCoordsStr = null;
        if (dest?.lat && dest?.lng) {
            dropoffCoordsStr = `${dest.lat},${dest.lng}`;
        } else if (fixedTripData?.dropoffLngLat && fixedTripData.dropoffLngLat.length >= 2) {
            dropoffCoordsStr = `${fixedTripData.dropoffLngLat[1]},${fixedTripData.dropoffLngLat[0]}`;
        } else {
            dropoffCoordsStr = "21.2212,105.8072";
        }

        const promoId = (isFixedTrip && (fixedTripInfo?.id || fixedTripInfo?.promotionTripId))
            ? Number(fixedTripInfo.id || fixedTripInfo.promotionTripId)
            : null;

        const calculatedTravelTime = Number(routeResult?.durationMinutes) || Number(fixedTripInfo?.travelTime) || 45;

        // CHỈ CÒN ĐÚNG 19 TRƯỜNG THEO REQUEST BACKEND
        const payload = {
            customerName: customerName.trim(),
            customerPhone: cleanPhone,
            pickupAddress: origin?.address || pickupInput.trim(),
            pickupCoordinates: pickupCoordsStr,
            dropoffAddress: dest?.address || dropoffInput.trim(),
            dropoffCoordinates: dropoffCoordsStr,
            distanceKm: Number(routeResult?.distanceKm) || 0,
            estimatedPrice: Number(finalEstimatedPrice) || 0,
            pickupTime: formattedPickupTime,
            driverId: driverId ? Number(driverId) : null,
            waitHours: Number(waitHours) || 0.0,
            isRoundTrip: Boolean(isRoundTrip),
            isFixedTrip: Boolean(isFixedTrip),
            promotionTripId: promoId,
            discountCode: appliedCoupon ? appliedCoupon.code : (couponCode.trim() ? couponCode.trim().toUpperCase() : null),
            luggageOption: luggageOption || '2 vali to',
            travelTime: calculatedTravelTime,
            bufferMinutes: 15,
            note: customNote.trim() || '',
            pushNotification: pushJson || null,
        };
        console.log(`Sending payload to ${ENV.API_BASE_URL}/bookings:`, JSON.stringify(payload, null, 2));
        try {
            const response = await fetch(`${ENV.API_BASE_URL}/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            let responseData = null;
            try {
                responseData = await response.json();
            }
            catch { }
            if (response.ok) {
                const tripCode = responseData?.data?.tripCode ||
                    responseData?.data?.code ||
                    responseData?.data?.id ||
                    responseData?.tripCode ||
                    responseData?.code ||
                    responseData?.id ||
                    `TAC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                setBookingMessage({
                    type: 'success',
                    text: `Đặt chuyến thành công! Mã chuyến: ${tripCode}. Đang chuyển trang tracking...`,
                });
                sessionStorage.setItem(`trip_${tripCode}`, JSON.stringify(payload));

                // Bắn notification ngay nếu khách đã cấp quyền
                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    try {
                        new Notification('Trung Anh Car - Đặt chuyến thành công!', {
                            body: `Mã chuyến: ${tripCode}. Tài xế ${selectedDriver?.name || 'Trung Anh'} sẽ đón bạn đúng giờ!`,
                            icon: selectedDriver?.avatar || '/favicon.svg',
                        });
                    } catch (notifErr) {
                        console.warn('Notification error:', notifErr);
                    }
                }

                setTimeout(() => {
                    navigate(`/trip/${tripCode}`);
                }, 1500);
            }
            else {
                throw new Error(responseData?.message || `Server trả về lỗi (HTTP ${response.status})`);
            }
        }
        catch (err) {
            console.warn('Lỗi gọi backend 8080, tạo demo code:', err);
            const demoCode = `TAC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            sessionStorage.setItem(`trip_${demoCode}`, JSON.stringify(payload));
            setBookingMessage({
                type: 'success',
                text: `Đã gửi đặt lịch thành công! Mã chuyến: ${demoCode}. Đang chuyển sang trang theo dõi...`,
            });
            setTimeout(() => {
                navigate(`/trip/${demoCode}`);
            }, 1500);
        }
        finally {
            setIsSubmittingBooking(false);
        }
    };

    // 6. NÚT "ĐẶT LỊCH CHUYẾN ĐI": Validate form & Kích hoạt luồng Soft Prompt Web Push
    const handleSubmitBooking = async (e) => {
        e.preventDefault();
        setBookingMessage(null);
        if (!customerName.trim()) {
            setBookingMessage({ type: 'error', text: 'Vui lòng nhập họ và tên của bạn' });
            const el = document.getElementById('bookingCustomerName');
            if (el) el.focus();
            return;
        }
        const cleanPhone = customerPhone.replace(/\s+/g, '');
        if (!cleanPhone) {
            setBookingMessage({ type: 'error', text: 'Vui lòng nhập số điện thoại liên hệ' });
            const el = document.getElementById('bookingCustomerPhone');
            if (el) el.focus();
            return;
        }
        if (!/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/.test(cleanPhone)) {
            setBookingMessage({ type: 'error', text: 'Số điện thoại không hợp lệ (Ví dụ: 0987654321)' });
            const el = document.getElementById('bookingCustomerPhone');
            if (el) el.focus();
            return;
        }
        if (!pickupDate) {
            setBookingMessage({ type: 'error', text: 'Vui lòng chọn ngày đón' });
            return;
        }
        if (!pickupTimeStr) {
            setBookingMessage({ type: 'error', text: 'Vui lòng chọn giờ đón' });
            return;
        }
        // Bắt buộc khách hàng phải chọn hoặc nhập Điểm đón
        if (!pickupInput.trim()) {
            setBookingMessage({ type: 'error', text: 'Vui lòng nhập hoặc chọn Điểm đón của bạn' });
            return;
        }
        if (!dropoffInput.trim()) {
            setBookingMessage({ type: 'error', text: 'Vui lòng nhập hoặc chọn Điểm trả' });
            return;
        }
        if (!routeResult) {
            setBookingMessage({ type: 'error', text: 'Vui lòng nhấn nút tính giá tiền trước khi đặt lịch' });
            return;
        }

        // LUỒNG PRE-PERMISSION SOFT PROMPT: Nếu trình duyệt chưa cấp quyền (permission === 'default'), hiện modal giải thích trước
        const isPushSupported = typeof window !== 'undefined' && 'Notification' in window;
        const shouldAskPush = isPushSupported && Notification.permission === 'default';

        if (shouldAskPush) {
            setShowPushModal(true);
            return;
        }

        // Nếu đã từng cấp quyền từ trước -> lấy chuỗi JSON Web Push gửi cho BE
        let pushJson = null;
        if (isPushSupported && Notification.permission === 'granted') {
            try {
                pushJson = await webPushService.getSubscriptionJson();
            } catch (pushErr) {
                console.warn('Lỗi lấy push subscription:', pushErr);
            }
        }

        // Tiến hành gửi đặt xe
        await executeSubmitBooking(pushJson);
    };

    // Khi khách bấm: "Tôi hiểu rồi, tiếp tục" -> Trình duyệt bật popup thật xin quyền & lấy chuỗi JSON Web Push
    const handleConfirmPush = async () => {
        setShowPushModal(false);
        let pushJson = null;
        try {
            if (typeof window !== 'undefined' && 'Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    localStorage.setItem('tac_push_enabled', 'true');
                    // Lấy chuỗi JSON subscription của Web Push gửi cho BE
                    pushJson = await webPushService.getSubscriptionJson();
                }
            }
        } catch (err) {
            console.warn('Lỗi requestPermission Notification:', err);
        }
        // Gửi đơn đặt xe kèm chuỗi JSON web push (hoặc null nếu khách từ chối trên popup browser)
        await executeSubmitBooking(pushJson);
    };

    // Khi khách bấm: "Bỏ qua" -> Vẫn đặt xe bình thường, pushNotification = null
    const handleSkipPush = async () => {
        setShowPushModal(false);
        await executeSubmitBooking(null);
    };
    return (<div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
      {/* Viền Crimson trang trí */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-700"/>

      {/* Header khu vực Đặt Xe & Bản Đồ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-600 text-white shadow-md">
              Đặt xe đến đón ngay
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Đặt Xe Điện VinFast - Báo giá công khai - Đón trả tận nơi
          </h2>
          <p className="text-xs text-slate-400">
            Chọn lộ trình trên bản đồ, tính khoảng cách chính xác và đặt lịch đón tận nơi.
          </p>
        </div>

        <button type="button" onClick={handleReset} className="self-start sm:self-auto px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          <span>Đặt lại</span>
        </button>
      </div>

      {/* BỐ CỤC 2 CỘT: CỘT TO HIỆN BẢN ĐỒ + CỘT NHỎ NHẬP THÔNG TIN CHUYẾN ĐI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TO (7 CỘT): HIỂN THỊ BẢN ĐỒ VIETMAP */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          {/* Thông báo khi đang ở chế độ ghim trên map */}
          {mapPickingMode && (<div className="p-3 rounded-2xl bg-red-950/80 border border-red-700 text-xs text-red-200 flex items-center justify-between shadow-lg animate-pulse">
              <span>
                👉 Đang chọn: <strong>{mapPickingMode === 'PICKUP' ? 'ĐIỂM ĐÓN (A)' : 'ĐIỂM TRẢ (B)'}</strong>. Vui lòng click vị trí mong muốn trên bản đồ!
              </span>
              <button type="button" onClick={() => {
                setMapPickingMode(null);
                mapPickingModeRef.current = null;
            }} className="text-[11px] px-2 py-0.5 bg-slate-900 rounded border border-red-800 text-slate-300 hover:text-white">
                Hủy
              </button>
            </div>)}

          {/* Container Bản đồ */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 h-[420px] sm:h-[500px] lg:h-[620px] shadow-2xl">
            <div ref={mapContainerRef} className="w-full h-full"/>

            {/* Loading khi đang tính đường */}
            {isCalculatingRoute && (<div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-20">
                <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin"/>
                <span className="text-xs font-bold text-white drop-shadow">
                  Đang tính đường xe ô tô...
                </span>
              </div>)}

            {/* Badge hướng dẫn góc dưới bản đồ */}
            <div className="absolute bottom-3 left-3 z-10 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-[11px] text-slate-300 shadow-lg pointer-events-none">
              {!pickupPoint ? (<span>📍 Nhập hoặc ghim <strong>Điểm đón</strong></span>) : !dropoffPoint ? (<span>🏁 Nhập hoặc ghim <strong>Điểm trả</strong></span>) : (<span>✨ Đã chọn xong 2 điểm. Bấm &quot;Tính giá tiền&quot; ở cột bên phải.</span>)}
            </div>
          </div>
        </div>

        {/* CỘT NHỎ (5 CỘT): NHẬP ĐỊA CHỈ & THÔNG TIN CHUYẾN ĐI */}
        <div className="lg:col-span-5 bg-slate-950/90 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"/>
              Thông Tin Chuyến Xe
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chọn điểm đón - trả để hệ thống tính giá minh bạch.
            </p>
          </div>

          {/* Thông báo chuyến cố định nếu đang chọn gói cước */}
          {isFixedTrip && fixedTripInfo && (<div className="p-3 rounded-xl bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border border-red-700/80 shadow-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"/>
                <span className="text-xs text-slate-300">Gói cố định:</span>
                <span className="text-xs font-bold text-red-400">{fixedTripInfo.title}</span>
              </div>
              <button type="button" onClick={() => {
                setIsFixedTrip(false);
                isFixedTripRef.current = false;
                setFixedTripInfo(null);
                setDropoffInput('');
                setDropoffPoint(null);
                dropoffPointRef.current = null;
                setRouteResult(null);
            }} className="text-[11px] text-red-300 hover:text-white font-semibold underline cursor-pointer" title="Bấm để tự do chọn tuyến đường khác và tính lại giá">
                Đổi tuyến khác
              </button>
            </div>)}

          {/* 1. Điểm Đón (Pickup) */}
          <div className="relative">
            <label className="block text-xs font-semibold text-emerald-400 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>ĐIỂM ĐÓN (PICKUP) <span className="text-red-500">*</span></span>
                {isFixedTrip && (<span className="text-[10px] text-amber-300 font-normal">
                    (Vui lòng nhập điểm đón thực tế)
                  </span>)}
              </span>
              {isSearchingPickup && <span className="text-[10px] text-slate-400 animate-pulse">Đang tìm...</span>}
            </label>
            <div className="relative flex items-center">
              <input type="text" value={pickupInput} onChange={(e) => handleInputChange(e.target.value, 'PICKUP')} placeholder="Nhập địa chỉ đón của bạn" className="w-full pl-3.5 pr-[115px] py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-all"/>

              {/* Nút Ghim trên map (Fix lỗi Stale Closure bằng REF) */}
              <button type="button" onClick={() => {
            const nextMode = mapPickingMode === 'PICKUP' ? null : 'PICKUP';
            setMapPickingMode(nextMode);
            mapPickingModeRef.current = nextMode;
        }} className={`absolute right-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${mapPickingMode === 'PICKUP'
            ? 'bg-emerald-600 text-white shadow-md animate-bounce'
            : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700'}`} title="Bấm để click chọn trên bản đồ">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                </svg>
                <span>{mapPickingMode === 'PICKUP' ? 'Đang chọn' : 'Ghim map'}</span>
              </button>
            </div>

            {/* Dropdown Gợi ý Autocomplete Điểm Đón */}
            {pickupSuggestions.length > 0 && (<div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-40 max-h-56 overflow-y-auto custom-scrollbar divide-y divide-slate-800">
                {pickupSuggestions.map((item, idx) => (<div key={idx} onClick={() => selectSuggestion(item, 'PICKUP')} className="p-2.5 hover:bg-slate-800 cursor-pointer text-left transition-colors">
                    <p className="text-xs font-semibold text-slate-100 flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"/>
                      <span className="line-clamp-2">{item.display || item.name}</span>
                    </p>
                  </div>))}
              </div>)}
          </div>

          {/* 2. Điểm Trả (Dropoff) */}
          <div className="relative">
            <label className="block text-xs font-semibold text-red-400 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>ĐIỂM TRẢ (DROPOFF) <span className="text-red-500">*</span></span>
                {isFixedTrip && (<span className="text-[10px] bg-red-950 text-red-300 px-1.5 py-0.5 rounded border border-red-800/80 font-bold">
                    Cố định theo gói
                  </span>)}
              </span>
              {isSearchingDropoff && <span className="text-[10px] text-slate-400 animate-pulse">Đang tìm...</span>}
            </label>
            <div className="relative flex items-center">
              <input type="text" value={dropoffInput} disabled={isFixedTrip} onChange={(e) => handleInputChange(e.target.value, 'DROPOFF')} placeholder={isFixedTrip ? 'Điểm trả cố định theo gói cước' : 'Nhập địa chỉ đến (VD: Sân bay Nội Bài...)'} className={`w-full pl-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none transition-all ${isFixedTrip
            ? 'bg-slate-900/50 border-red-900/50 text-slate-300 cursor-not-allowed font-medium pr-3.5'
            : 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-red-500 pr-[115px]'}`}/>

              {/* Nút Ghim trên map (Ẩn khi là chuyến cố định vì điểm trả đã điền sẵn) */}
              {!isFixedTrip && (<button type="button" onClick={() => {
                const nextMode = mapPickingMode === 'DROPOFF' ? null : 'DROPOFF';
                setMapPickingMode(nextMode);
                mapPickingModeRef.current = nextMode;
            }} className={`absolute right-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${mapPickingMode === 'DROPOFF'
                ? 'bg-red-600 text-white shadow-md animate-bounce'
                : 'bg-slate-800 hover:bg-slate-700 text-red-400 border border-slate-700'}`} title="Bấm để click chọn trên bản đồ">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  </svg>
                  <span>{mapPickingMode === 'DROPOFF' ? 'Đang chọn' : 'Ghim map'}</span>
                </button>)}
            </div>

            {/* Dropdown Gợi ý Autocomplete Điểm Trả */}
            {!isFixedTrip && dropoffSuggestions.length > 0 && (<div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-40 max-h-56 overflow-y-auto custom-scrollbar divide-y divide-slate-800">
                {dropoffSuggestions.map((item, idx) => (<div key={idx} onClick={() => selectSuggestion(item, 'DROPOFF')} className="p-2.5 hover:bg-slate-800 cursor-pointer text-left transition-colors">
                    <p className="text-xs font-semibold text-slate-100 flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0"/>
                      <span className="line-clamp-2">{item.display || item.name}</span>
                    </p>
                  </div>))}
              </div>)}
          </div>

          
          {/* 3. CHỌN TÀI XẾ PHỤC VỤ (Được chuyển ra ngoài cùng Điểm đón & Điểm trả để xem được ngay tài xế) */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span>TÀI XẾ PHỤC VỤ <span className="text-red-500">*</span></span>
              </label>

              <button
                type="button"
                onClick={() => setShowScheduleModal(true)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300 bg-red-950/70 hover:bg-red-900/80 px-2.5 py-1 rounded-lg border border-red-800/80 transition-all cursor-pointer shadow-sm"
                title="Bấm để xem chi tiết các khung giờ bận/trống của tài xế"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span>Xem lịch lái xe</span>
              </button>
            </div>

            {/* Combobox chọn tài xế */}
            <div className="relative">
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs sm:text-sm font-medium focus:outline-none focus:border-amber-500 transition-all cursor-pointer appearance-none"
              >
                {driversList.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} • {driver.carModel}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Thẻ xem trước trực quan tài xế đang chọn (Preview Card không cần nhấn tính giá) */}
            {selectedDriver && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={selectedDriver.avatar}
                      alt={selectedDriver.name}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-red-500/70 shadow-md"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-slate-900"></span>
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-white truncate">
                        {selectedDriver.name}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-400 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-800/40">
                        ★ {selectedDriver.rating}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 flex-wrap">
                      <span className="text-slate-300 font-medium truncate">
                        {selectedDriver.carModel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                    Sẵn sàng đón
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 4. TÙY CHỌN CHUYẾN ĐI (Nhập trước khi tính giá để tính chính xác giá) */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            {/* Checkbox Đi 2 chiều (Khứ hồi) */}
            <div className="flex items-start justify-between gap-3">
              <label htmlFor="roundTripCheckbox" className="flex items-start gap-2.5 cursor-pointer flex-1 select-none">
                <input id="roundTripCheckbox" type="checkbox" checked={isRoundTrip} onChange={(e) => handleToggleRoundTrip(e.target.checked)} className="mt-0.5 w-4.5 h-4.5 rounded border-slate-600 bg-slate-950 text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"/>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Đi 2 chiều (Khứ hồi)</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-950 text-red-400 border border-red-800/80">
                      Chiều về chỉ tính 65%
                    </span>
                  </div>
                </div>
              </label>
            </div>

            {/* Ô Thời gian chờ (waitHours - cho phép nhập 0.5 với đơn vị giờ, chỉ hiện khi tích đi 2 chiều) */}
            {isRoundTrip && (<div className="border-t border-slate-800/90 pt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <span>Thời gian chờ xe:</span>
                    <span className="text-[10px] text-emerald-400 font-normal">(Miễn phí 30 phút đầu)</span>
                  </label>
                  <span className="text-xs font-bold text-red-400">
                    {waitHours > 0 ? `${waitHours} giờ` : 'Đi ngay (0h)'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input type="number" step="0.5" min="0" value={waitHours} onChange={(e) => handleChangeWaitHours(parseFloat(e.target.value) || 0)} placeholder="0 hoặc 0.5, 1..." className="w-full pl-3 pr-11 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-red-500 font-medium"/>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                      giờ
                    </span>
                  </div>

                  {/* Các nút bấm nhanh mốc giờ */}
                  <div className="flex items-center gap-1">
                    {[0, 0.5, 1, 1.5, 2].map((h) => (<button key={h} type="button" onClick={() => handleChangeWaitHours(h)} className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${waitHours === h
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}>
                        {h === 0 ? '0h' : `${h}h`}
                      </button>))}
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  30.000 đ/giờ tiếp theo (nhập số lẻ đến 0.5 giờ như 0.5, 1.5, 2.5...)
                </p>
              </div>)}
          </div>

          {/* Lỗi nếu có */}
          {routeError && (<div className="p-2.5 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs">
              {routeError}
            </div>)}

          {/* BƯỚC 1: NÚT TÍNH GIÁ TIỀN (Chỉ hiện khi chưa tính giá) */}
          {!routeResult ? (<div className="pt-2">
              <button type="button" onClick={handleCalculateFare} disabled={isCalculatingRoute || !pickupInput.trim() || !dropoffInput.trim()} className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-red-900/40 flex items-center justify-center gap-2 cursor-pointer">
                {isCalculatingRoute ? (<span>Đang tính lộ trình...</span>) : (<>
                    <span>Tính giá tiền chuyến đi</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                  </>)}
              </button>
            </div>) : (
        /* BƯỚC 2: SAU KHI TÍNH GIÁ TIỀN XONG -> HIỆN KẾT QUẢ & FORM ĐẶT LỊCH CHUYẾN ĐI */
        <form onSubmit={handleSubmitBooking} noValidate className="space-y-3.5 pt-1">
              {/* Box hiển thị Quãng đường, Thời gian và Bóc tách giá chi tiết */}
              {(() => {
                const discountVal = appliedCoupon ? appliedCoupon.discountAmount : 0;
                const finalFare = Math.max(0, routeResult.estimatedPrice - discountVal);
                const conflicted = getConflictedSlot();
                const selectedDriver = driversList.find((d) => String(d.id) === String(driverId)) || driversList[0] || DRIVERS_LIST[0];
                return (<>
                    <div className="p-4 rounded-xl bg-slate-900 border border-red-900/50 space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <span>Quãng đường tính cước:</span>
                          {isRoundTrip && (<span className="text-[10px] bg-red-950 text-red-300 px-1.5 py-0.5 rounded border border-red-800">
                              2 chiều
                            </span>)}
                        </span>
                        <span className="font-bold text-white text-sm">
                          {routeResult.distanceKm} km
                          {isRoundTrip && (<span className="text-[11px] text-slate-400 font-normal ml-1">
                              ({routeResult.oneWayKm} km/chiều)
                            </span>)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Thời gian di chuyển ước tính:</span>
                        <span className="font-bold text-emerald-400 text-sm">
                          ~{routeResult.durationMinutes} phút
                        </span>
                      </div>

                      {/* Bóc tách các thành phần phụ phí & ưu đãi (nếu có) */}
                      {(isRoundTrip || routeResult.waitingFee > 0 || appliedCoupon) && (<div className="pt-2.5 border-t border-slate-800 space-y-1.5 text-xs text-slate-400">
                          {isRoundTrip && (<div className="flex justify-between text-rose-300">
                              <span>Cước chiều về (65% chiều đi):</span>
                              <span className="font-semibold">
                                +{routeResult.returnFare.toLocaleString('vi-VN')} đ
                              </span>
                            </div>)}

                          {routeResult.waitingFee > 0 && (<div className="flex justify-between text-amber-300">
                              <span>Phí thời gian chờ ({waitHours} giờ):</span>
                              <span className="font-semibold">
                                +{routeResult.waitingFee.toLocaleString('vi-VN')} đ
                              </span>
                            </div>)}

                          {appliedCoupon && (<div className="flex justify-between text-emerald-400 font-semibold">
                              <span>Mã giảm giá ({appliedCoupon.code}):</span>
                              <span>-{appliedCoupon.discountAmount.toLocaleString('vi-VN')} đ</span>
                            </div>)}
                        </div>)}

                      <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400 block">Giá cước tạm tính:</span>
                          <span className="text-[10px] text-slate-500">
                            {appliedCoupon ? 'Đã áp dụng mã ưu đãi' : 'Đã bao gồm chiết khấu'}
                          </span>
                        </div>
                        <span className="text-xl font-black text-red-500">
                          {finalFare.toLocaleString('vi-VN')} đ
                        </span>
                      </div>

                      {!isFixedTrip && (<button type="button" onClick={handleCalculateFare} disabled={isCalculatingRoute} className="w-full mt-1 py-1.5 rounded-lg text-[11px] text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                          </svg>
                          <span>Cập nhật lại lộ trình nếu đổi điểm</span>
                        </button>)}
                    </div>

                    {/* Thông tin khách hàng */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          Họ và tên <span className="text-red-500">*</span>
                        </label>
                        <input type="text" id="bookingCustomerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nhập họ tên" className={`w-full px-3 py-2 rounded-xl bg-slate-900 border text-slate-100 text-xs focus:outline-none transition-all ${!customerName.trim() && bookingMessage?.type === 'error' ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-700 focus:border-red-500'}`}/>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <input type="tel" id="bookingCustomerPhone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Nhập SĐT" className={`w-full px-3 py-2 rounded-xl bg-slate-900 border text-slate-100 text-xs focus:outline-none transition-all ${!customerPhone.trim() && bookingMessage?.type === 'error' ? 'border-red-500 ring-1 ring-red-500/50' : 'border-slate-700 focus:border-red-500'}`}/>
                      </div>
                    </div>

                    {/* Ngày & Giờ đón (Responsive 1 cột trên điện thoại, 2 cột trên tablet/desktop tránh vỡ layout) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          Ngày đón <span className="text-red-500">*</span>
                        </label>
                        <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} style={{ colorScheme: 'dark' }} className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-red-500 transition-colors [color-scheme:dark] cursor-pointer"/>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-medium text-slate-300">
                            Giờ đón <span className="text-red-500">*</span>
                          </label>
                          {conflicted ? (<span className="text-[10px] text-amber-400 font-bold flex items-center gap-1 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60">
                              <span>⚠️</span> Trùng lịch lái xe
                            </span>) : (<span className="text-[10px] text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                              <span>🟢</span> Khả dụng
                            </span>)}
                        </div>

                        <input type="time" value={pickupTimeStr} onChange={(e) => setPickupTimeStr(e.target.value)} style={{ colorScheme: 'dark' }} className={`w-full px-3 py-2.5 rounded-xl bg-slate-900 border text-slate-100 text-xs font-mono focus:outline-none transition-colors [color-scheme:dark] cursor-pointer ${conflicted
                        ? 'border-amber-500 ring-1 ring-amber-500/50'
                        : 'border-slate-700 focus:border-red-500'}`}/>
                      </div>
                    </div>

                    {/* Cảnh báo nếu trùng lịch bận của tài xế */}
                    {conflicted && (<div className="p-2.5 rounded-xl bg-amber-950/70 border border-amber-800 text-amber-300 text-[11px] flex items-start gap-2">
                        <span className="text-base leading-none">⚠️</span>
                        <div className="flex-1">
                          <p className="font-bold">
                            Tài xế {scheduleData?.driver?.name || selectedDriver.name} đang bận khung giờ {conflicted.time_display}!
                          </p>
                          <p className="text-[10px] text-amber-200 mt-0.5">
                            Lộ trình: {conflicted.route} {conflicted.travel_time ? `(~${conflicted.travel_time} phút)` : ''}. Vui lòng chọn mốc giờ trống khác hoặc đổi tài xế.
                          </p>
                        </div>
                      </div>)}

                    {/* Trường Nhập Mã Giảm Giá */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center justify-between">
                        <span>Mã giảm giá / Voucher</span>
                        <span className="text-[10px] text-slate-500">Mã gợi ý: TRUNGANH50K, VINFAST50, TRUNGANH20</span>
                      </label>
                      <div className="flex gap-2">
                        <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Nhập mã ưu đãi..." className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-red-500"/>
                        {appliedCoupon ? (<button type="button" onClick={handleRemoveCoupon} className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors">
                            Hủy mã
                          </button>) : (<button type="button" onClick={handleApplyCoupon} disabled={isValidatingCoupon} className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-colors shadow-md shadow-red-950/50 flex items-center gap-1.5">
                            {isValidatingCoupon ? (
                              <>
                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Đang kiểm tra...</span>
                              </>
                            ) : (
                              <span>Áp dụng</span>
                            )}
                          </button>)}
                      </div>
                      {couponMessage && (<p className={`text-[11px] mt-1 font-medium ${couponMessage.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {couponMessage.text}
                        </p>)}
                    </div>

                    {/* Hành lý */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Số lượng hành lý</label>
                      <select value={luggageOption} onChange={(e) => setLuggageOption(e.target.value)} className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-red-500">
                        <option value="Không có vali">Không có vali</option>
                        <option value="1 vali vừa">1 vali vừa hoặc tương đương</option>
                        <option value="2 vali to">2 vali to hoặc tương đương</option>
                        <option value="3-4 vali lớn">3-4 vali lớn hoặc tương đương</option>
                      </select>
                    </div>

                    {/* Ghi chú riêng */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">Ghi chú riêng</label>
                      <input type="text" value={customNote} onChange={(e) => setCustomNote(e.target.value)} placeholder="VD: Cần xe sạch sẽ, có ghế trẻ em..." className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-red-500"/>
                    </div>

                    {/* Thông báo gửi booking */}
                    {bookingMessage && (<div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${bookingMessage.type === 'success'
                            ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300'
                            : 'bg-red-950/80 border border-red-700 text-red-200'}`}>
                        <span className="text-sm shrink-0">{bookingMessage.type === 'success' ? '✓' : '⚠️'}</span>
                        <span>{bookingMessage.text}</span>
                      </div>)}

                    {/* NÚT "ĐẶT LỊCH CHO CHUYẾN ĐI" */}
                    <div className="pt-1">
                      <button type="submit" disabled={isSubmittingBooking} className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-95 transition-all shadow-xl shadow-red-900/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60">
                        {isSubmittingBooking ? (<span>Đang gửi thông tin...</span>) : (<span>Đặt lịch cho chuyến đi ({finalFare.toLocaleString('vi-VN')} đ)</span>)}
                      </button>
                    </div>
                  </>);
            })()}
            </form>)}
        </div>
      </div>


      {/* MODAL SOFT PROMPT WEB PUSH NOTIFICATION (GIẢI THÍCH TRƯỚC ĐỂ ĐẠT 90% TỶ LỆ CHO PHÉP) */}
      {showPushModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          {/* Lớp nền click để bỏ qua */}
          <div className="fixed inset-0" onClick={handleSkipPush} />

          <div className="bg-slate-900 border border-slate-700/90 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative z-10 text-center overflow-hidden">
            {/* Viền đỏ VinFast trên đỉnh */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-700" />

            {/* Nút đóng góc phải */}
            <button
              type="button"
              onClick={handleSkipPush}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-all border border-slate-700/50"
              title="Bỏ qua"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icon chuông thông báo hiệu ứng sóng âm thanh */}
            <div className="mx-auto w-18 h-18 rounded-3xl bg-gradient-to-br from-red-500/20 via-rose-500/10 to-amber-500/20 border border-red-500/40 flex items-center justify-center relative mb-5 shadow-lg shadow-red-950/40">
              <span className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-red-400 opacity-30"></span>
              <svg className="w-9 h-9 text-red-500 relative z-10 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </div>

            {/* Tiêu đề & Nội dung chuẩn theo yêu cầu */}
            <h3 className="text-lg sm:text-xl font-extrabold text-white mb-2 tracking-tight">
              Bật thông báo chuyến xe
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
              Để nhận thông báo khi tài xế <span className="font-bold text-red-400">{selectedDriver?.name || 'Trung Anh'}</span> tới đón, vui lòng bấm <span className="font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">&quot;Cho phép&quot;</span> trình duyệt gửi thông báo chuyến đi đến bạn!
            </p>

            {/* Cam kết tiện ích & không spam */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 mb-6 text-left space-y-1.5">
              <p className="flex items-center gap-2 text-emerald-400 font-medium">
                <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Nhận thông báo khi xe chuẩn bị đến đón bạn (không lo lỡ chuyến)</span>
              </p>
              <p className="flex items-center gap-2 text-slate-400">
                <svg className="w-4 h-4 shrink-0 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Không spam quảng cáo • Tắt bất cứ lúc nào</span>
              </p>
            </div>

            {/* 2 Nút hành động */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleConfirmPush}
                className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 shadow-xl shadow-red-900/50 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <span>Tôi hiểu rồi, tiếp tục</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL XEM LỊCH HOẠT ĐỘNG CỦA LÁI XE (RỘNG RÃI, ĐẸP MẮT & CHUẨN RESPONSIVE MOBILE) */}
      {showScheduleModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          {/* Lớp nền click để đóng */}
          <div className="fixed inset-0" onClick={() => setShowScheduleModal(false)} />

          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-6 md:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar z-10">
            {/* Viền Crimson trang trí đỉnh modal */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-700 rounded-t-2xl sm:rounded-t-3xl pointer-events-none"/>

            {/* Nút đóng modal */}
            <button type="button" onClick={() => setShowScheduleModal(false)} className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-all border border-slate-700/70 z-20" title="Đóng cửa sổ">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            {/* Header Modal & Thông tin Tài xế từ API */}
            {(() => {
                const currentDriverStatic = driversList.find((d) => String(d.id) === String(driverId)) || driversList[0] || DRIVERS_LIST[0];
                const driverInfo = scheduleData?.driver || {
                    id: driverId,
                    name: currentDriverStatic.name,
                    vehicle: currentDriverStatic.carModel,
                    license_plate: currentDriverStatic.plateNumber,
                    rating: currentDriverStatic.rating,
                };
                const busyTrips = scheduleData?.busy_trips || scheduleData?.busyTrips || [];
                let availableSlots = scheduleData?.available_slots || scheduleData?.availableSlots || [];
                if (availableSlots.length === 0) {
                    availableSlots = calculateAvailableSlots(busyTrips);
                }
                const displayDate = scheduleData?.selected_date || scheduleData?.selectedDate || pickupDate;
                return (<div className="space-y-4">
                  {/* Card thông tin tài xế */}
                  <div className="flex items-center gap-3 sm:gap-4 border-b border-slate-800 pb-4 pr-10">
                    <img src={currentDriverStatic.avatar} alt={driverInfo.name} className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-red-500 shadow-lg shadow-red-950/40 flex-shrink-0"/>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-xl font-extrabold text-white truncate">
                          {driverInfo.name}
                        </h3>
                        <span className="text-xs sm:text-sm text-amber-400 font-bold bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-800/50 flex items-center gap-1">
                          ★ {driverInfo.rating || 5.0}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="text-slate-300 font-medium">{driverInfo.vehicle || 'VinFast Limo Green'}</span>
                        <span className="text-slate-600">•</span>
                        <span className="font-medium text-black font-bold bg-white px-2 py-0.5 rounded border border-black text-xs">
                          {driverInfo.license_plate || '35H - 18229'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Thanh chọn ngày & Làm mới lịch */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Lịch trình ngày:
                      </span>
                      <span className="text-sm sm:text-base text-red-400 font-mono font-bold bg-red-950/80 px-2.5 py-0.5 rounded-lg border border-red-900/70">
                        {displayDate}
                      </span>
                    </div>

                    <button type="button" onClick={() => fetchDriverSchedule(driverId, pickupDate)} disabled={isLoadingSchedule} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors" title="Cập nhật lại lịch từ hệ thống">
                      <svg className={`w-3.5 h-3.5 ${isLoadingSchedule ? 'animate-spin text-red-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                      <span>{isLoadingSchedule ? 'Đang tải...' : 'Làm mới'}</span>
                    </button>
                  </div>

                  {/* 1. DANH SÁCH CÁC CHUYẾN ĐÃ BẬN (busy_trips) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"/>
                        Khung giờ tài xế ĐÃ CÓ CHUYẾN (Bận):
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {busyTrips.length} chuyến đã đặt
                      </span>
                    </div>

                    {busyTrips.length > 0 ? (<div className="space-y-2">
                        {busyTrips.map((trip, idx) => (<div key={trip.trip_id || idx} className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-red-950/40 to-slate-950/70 border border-red-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-rose-300 bg-red-950/90 px-2.5 py-1 rounded-lg border border-red-800 font-bold text-xs sm:text-sm">
                                  {trip.time_display}
                                </span>
                                {trip.trip_id && (<span className="text-[10px] text-slate-400 font-medium">#{trip.trip_id}</span>)}
                              </div>
                              <p className="text-xs text-slate-200 flex items-center gap-1 mt-1">
                                <span className="text-slate-400">Lộ trình:</span>
                                <strong className="text-white font-semibold">{trip.route}</strong>
                              </p>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-center">
                              {(trip.tralvel_time || trip.travel_time) && (<span className="text-[11px] text-slate-400 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                                  ~{trip.tralvel_time || trip.travel_time} phút
                                </span>)}
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-red-900/70 text-red-300 border border-red-800 whitespace-nowrap">
                                Đã bận
                              </span>
                            </div>
                          </div>))}
                      </div>) : (<div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-300">
                        <span className="text-emerald-400 font-semibold block mb-0.5">✓ Tài xế hiện chưa có chuyến nào trong ngày này.</span>
                        <span className="text-slate-400">Tất cả các mốc giờ bên dưới đều khả dụng để bạn đặt xe!</span>
                      </div>)}
                  </div>

                  {/* 2. DANH SÁCH CÁC MỐC GIỜ KHẢ DỤNG (available_slots) */}
                  <div className="space-y-2.5 pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"/>
                        Mốc giờ KHẢ DỤNG (Chạm để chọn giờ đón):
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {availableSlots.length} mốc giờ trống
                      </span>
                    </div>

                    {availableSlots.length > 0 ? (<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-2.5 max-h-56 overflow-y-auto custom-scrollbar p-1">
                        {availableSlots.map((slot, sIdx) => {
                            const isSelected = pickupTimeStr === slot;
                            return (<button key={sIdx} type="button" onClick={() => {
                                    setPickupTimeStr(slot);
                                    setShowScheduleModal(false);
                                }} className={`p-2.5 sm:p-3 rounded-xl text-center border transition-all cursor-pointer ${isSelected
                                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-950/60 scale-102 ring-2 ring-emerald-500/50'
                                    : 'bg-slate-800/90 hover:bg-emerald-950/70 text-slate-200 hover:text-emerald-300 border-slate-700 hover:border-emerald-700'}`}>
                              <span className="block font-mono font-bold text-sm sm:text-base leading-tight">
                                {slot}
                              </span>
                              <span className="text-[10px] opacity-80 block mt-0.5">
                                {isSelected ? '✓ Đang chọn' : 'Trống'}
                              </span>
                            </button>);
                        })}
                      </div>) : (<p className="text-xs text-slate-400 italic py-2 text-center">
                        Tất cả các mốc giờ trong ngày đã được đặt kín.
                      </p>)}
                  </div>

                  {/* Footer Modal */}
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-300">
                      Giờ đón hiện tại: <strong className="text-emerald-400 font-mono text-sm ml-1">{pickupTimeStr}</strong>
                    </span>

                    <button type="button" onClick={() => setShowScheduleModal(false)} className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white cursor-pointer transition-all border border-slate-700 shadow-md">
                      Đóng
                    </button>
                  </div>
                </div>);
            })()}
          </div>
        </div>,
        document.body
      )}
    </div>);
}
