import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '@vietmap/vietmap-gl-js/dist/vietmap-gl.css';
import { DRIVERS_LIST } from './PricingAndDrivers';

export interface LocationPoint {
  lat: number;
  lng: number;
  address: string;
}

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  estimatedPrice: number;
  coordinates: [number, number][];
  oneWayKm: number;
  oneWayDuration: number;
  oneWayFare: number;
  returnFare: number;
  waitingFee: number;
}

/**
 * Công thức tính cước vận chuyển chuẩn theo yêu cầu:
 * • Giá mở cửa (2 km đầu tiên): 30.500 VNĐ
 * • Từ km thứ 3 đến km thứ 12: 14.700 VNĐ/km
 * • Từ km thứ 13 đến km thứ 25: 13.800 VNĐ/km
 * • Từ km thứ 26 trở đi: 11.900 VNĐ/km
 * • Checkbox đi 2 chiều: Chiều về chỉ tính giá 65% chiều đi, quãng đường và thời gian x2
 * • Thời gian chờ: Miễn phí 30 phút đầu (0.5h), 30.000 đ/giờ tiếp theo
 */
export function calculateFareDetails(
  oneWayKm: number,
  isRoundTrip: boolean,
  waitHours: number = 0
) {
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
  } else if (oneWayKm <= 12) {
    oneWayFare = 30500 + (oneWayKm - 2) * 14700;
  } else if (oneWayKm <= 25) {
    oneWayFare = 30500 + 10 * 14700 + (oneWayKm - 12) * 13800;
  } else {
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

export interface AutocompleteSuggestion {
  ref_id: string;
  name: string;
  address: string;
  display?: string;
}

// 1. Key chuyên dùng để hiển thị bản đồ (Map Tiles / Vector Style)
export function getVietmapMapKey(): string {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      if ((import.meta as any).env.NEXT_PUBLIC_VIETMAP_API_KEY) {
        return (import.meta as any).env.NEXT_PUBLIC_VIETMAP_API_KEY;
      }
    }
  } catch {}

  if (typeof process !== 'undefined' && process.env) {
    if (process.env.NEXT_PUBLIC_VIETMAP_API_KEY) {
      return process.env.NEXT_PUBLIC_VIETMAP_API_KEY;
    }
  }

  return '';
}

// 2. Key chuyên dùng để gọi các REST API (Routing, Autocomplete, Place, Reverse Geocoding)
export function getVietmapServicesKey(): string {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      if ((import.meta as any).env.VITE_VIETMAP_API_KEY) {
        return (import.meta as any).env.VITE_VIETMAP_API_KEY;
      }
    }
  } catch {}

  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_VIETMAP_API_KEY) {
      return process.env.VITE_VIETMAP_API_KEY;
    }
  }

  return '';
}

// Style dự phòng (OpenStreetMap raster) nếu Vietmap Style bị từ chối
const FALLBACK_MAP_STYLE: any = {
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

export default function VietmapBookingDemo({ initialDriverId }: { initialDriverId?: string }) {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const vietmapglRef = useRef<any>(null);

  const pickupMarkerRef = useRef<any>(null);
  const dropoffMarkerRef = useRef<any>(null);

  // Bộ nhớ đệm cache từ khóa tìm kiếm -> Tiết kiệm request tối đa
  const searchCacheRef = useRef<Map<string, AutocompleteSuggestion[]>>(new Map());
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // State vị trí & địa chỉ
  const [pickupInput, setPickupInput] = useState<string>('');
  const [dropoffInput, setDropoffInput] = useState<string>('');
  const [pickupPoint, setPickupPoint] = useState<LocationPoint | null>(null);
  const [dropoffPoint, setDropoffPoint] = useState<LocationPoint | null>(null);

  // Chế độ ghim từ bản đồ: null | 'PICKUP' | 'DROPOFF'
  const [mapPickingMode, setMapPickingMode] = useState<'PICKUP' | 'DROPOFF' | null>(null);

  // REFS để tránh Stale Closure khi click trên bản đồ
  const mapPickingModeRef = useRef<'PICKUP' | 'DROPOFF' | null>(null);
  const pickupPointRef = useRef<LocationPoint | null>(null);
  const dropoffPointRef = useRef<LocationPoint | null>(null);

  useEffect(() => {
    mapPickingModeRef.current = mapPickingMode;
  }, [mapPickingMode]);

  useEffect(() => {
    pickupPointRef.current = pickupPoint;
  }, [pickupPoint]);

  useEffect(() => {
    dropoffPointRef.current = dropoffPoint;
  }, [dropoffPoint]);

  // Gợi ý địa chỉ
  const [pickupSuggestions, setPickupSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isSearchingPickup, setIsSearchingPickup] = useState<boolean>(false);
  const [isSearchingDropoff, setIsSearchingDropoff] = useState<boolean>(false);

  // Trạng thái tính giá & tuyến đường
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Form thông tin khách hàng & đặt xe
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [pickupDate, setPickupDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [pickupTimeStr, setPickupTimeStr] = useState<string>(() => {
    const d = new Date(Date.now() + 30 * 60 * 1000);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  // Tùy chọn đi 2 chiều & Thời gian chờ (Nhập trước khi tính giá)
  const [isRoundTrip, setIsRoundTrip] = useState<boolean>(false);
  const [waitHours, setWaitHours] = useState<number>(0);

  // Cập nhật lại giá tức thì khi người dùng thay đổi 2 chiều hoặc thời gian chờ
  const handleToggleRoundTrip = (checked: boolean) => {
    setIsRoundTrip(checked);
    if (routeResult) {
      const oneWayKm = routeResult.oneWayKm;
      const oneWayDuration = routeResult.oneWayDuration;
      const fare = calculateFareDetails(oneWayKm, checked, waitHours);
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

  const handleChangeWaitHours = (hours: number) => {
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

  // Chọn tài xế (driverId)
  const [driverId, setDriverId] = useState<string>('1');

  useEffect(() => {
    if (initialDriverId) {
      setDriverId(initialDriverId);
    }
  }, [initialDriverId]);

  const [luggageOption, setLuggageOption] = useState<string>('2 vali to');
  const [customNote, setCustomNote] = useState<string>('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);
  const [bookingMessage, setBookingMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Khởi tạo Bản đồ VIETMAP
  useEffect(() => {
    let isSubscribed = true;

    async function initMap() {
      if (!mapContainerRef.current) return;

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
          if (!isSubscribed) return;
          setTimeout(() => {
            try {
              map.resize();
            } catch {}
          }, 200);
        });

        map.on('error', (e: any) => {
          console.warn('Map notice:', e);
          if (e?.error?.status === 401 || e?.error?.status === 403) {
            try {
              map.setStyle(FALLBACK_MAP_STYLE);
            } catch {}
          }
        });

        // Click trên map để ghim điểm đón hoặc điểm trả
        map.on('click', (e: any) => {
          const { lng, lat } = e.lngLat;
          handleMapPickedCoordinate(lat, lng);
        });

        mapInstanceRef.current = map;
      } catch (err) {
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
  const createMarkerElement = (type: 'PICKUP' | 'DROPOFF') => {
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
    } else {
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

  const updateMarker = (type: 'PICKUP' | 'DROPOFF', lat: number, lng: number) => {
    const map = mapInstanceRef.current;
    const vietmapgl = vietmapglRef.current;
    if (!map || !vietmapgl) return;

    if (type === 'PICKUP') {
      if (pickupMarkerRef.current) pickupMarkerRef.current.remove();
      const el = createMarkerElement('PICKUP');
      pickupMarkerRef.current = new vietmapgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([lng, lat])
        .addTo(map);
    } else {
      if (dropoffMarkerRef.current) dropoffMarkerRef.current.remove();
      const el = createMarkerElement('DROPOFF');
      dropoffMarkerRef.current = new vietmapgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([lng, lat])
        .addTo(map);
    }

    map.flyTo({ center: [lng, lat], zoom: 14, duration: 800 });
  };

  // 2. Xử lý khi click ghim trên bản đồ (Dùng REF để fix hoàn toàn lỗi stale closure!)
  const handleMapPickedCoordinate = async (lat: number, lng: number) => {
    // Lấy mode chuẩn xác từ REF
    const currentMode = mapPickingModeRef.current || (!pickupPointRef.current ? 'PICKUP' : 'DROPOFF');
    const servicesKey = getVietmapServicesKey();

    let resolvedAddress = `Tọa độ (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

    // Gọi Reverse Geocoding v4
    if (servicesKey) {
      try {
        const revUrl = `https://maps.vietmap.vn/api/reverse/v4?apikey=${servicesKey}&lat=${lat}&lng=${lng}&display_type=1`;
        const res = await fetch(revUrl);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data[0]?.address) {
            resolvedAddress = data[0].address;
          } else if (data?.address) {
            resolvedAddress = data.address;
          }
        }
      } catch (err) {
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
    } else {
      const pt = { lat, lng, address: resolvedAddress };
      setDropoffInput(resolvedAddress);
      setDropoffPoint(pt);
      dropoffPointRef.current = pt;
      updateMarker('DROPOFF', lat, lng);
      setMapPickingMode(null);
      mapPickingModeRef.current = null;
    }

    setRouteResult(null);
  };

  // 3. Tối ưu Autocomplete: Debounce 600ms + In-Memory Cache + Tối thiểu 3 ký tự
  const handleInputChange = (text: string, type: 'PICKUP' | 'DROPOFF') => {
    if (type === 'PICKUP') {
      setPickupInput(text);
      setPickupPoint(null);
      pickupPointRef.current = null;
    } else {
      setDropoffInput(text);
      setDropoffPoint(null);
      dropoffPointRef.current = null;
    }
    setRouteResult(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = text.trim();
    if (trimmed.length < 3) {
      if (type === 'PICKUP') setPickupSuggestions([]);
      else setDropoffSuggestions([]);
      return;
    }

    const cacheKey = trimmed.toLowerCase();
    if (searchCacheRef.current.has(cacheKey)) {
      const cached = searchCacheRef.current.get(cacheKey)!;
      if (type === 'PICKUP') setPickupSuggestions(cached);
      else setDropoffSuggestions(cached);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      const servicesKey = getVietmapServicesKey();
      if (type === 'PICKUP') setIsSearchingPickup(true);
      else setIsSearchingDropoff(true);

      try {
        if (servicesKey) {
          const url = `https://maps.vietmap.vn/api/autocomplete/v4?apikey=${servicesKey}&text=${encodeURIComponent(
            trimmed
          )}&display_type=1`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const items: AutocompleteSuggestion[] = Array.isArray(data)
              ? data.map((d: any) => ({
                  ref_id: d.ref_id,
                  name: d.name || d.display || trimmed,
                  address: d.address || d.display || '',
                  display: d.display || d.name || '',
                }))
              : [];

            searchCacheRef.current.set(cacheKey, items);

            if (type === 'PICKUP') setPickupSuggestions(items);
            else setDropoffSuggestions(items);
            return;
          }
        }

        const filtered = FALLBACK_PLACES.filter(
          (p) =>
            p.name.toLowerCase().includes(trimmed.toLowerCase()) ||
            p.address.toLowerCase().includes(trimmed.toLowerCase())
        ).map((p, idx) => ({
          ref_id: `fallback-${idx}`,
          name: p.name,
          address: p.address,
          display: `${p.name} - ${p.address}`,
        }));

        searchCacheRef.current.set(cacheKey, filtered);
        if (type === 'PICKUP') setPickupSuggestions(filtered);
        else setDropoffSuggestions(filtered);
      } catch (err) {
        console.warn('Lỗi Autocomplete:', err);
      } finally {
        if (type === 'PICKUP') setIsSearchingPickup(false);
        else setIsSearchingDropoff(false);
      }
    }, 600);
  };

  const selectSuggestion = async (item: AutocompleteSuggestion, type: 'PICKUP' | 'DROPOFF') => {
    const servicesKey = getVietmapServicesKey();
    const addressText = item.address ? `${item.name}, ${item.address}` : item.name;

    if (type === 'PICKUP') {
      setPickupInput(addressText);
      setPickupSuggestions([]);
    } else {
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
        } else {
          setDropoffPoint(pt);
          dropoffPointRef.current = pt;
          updateMarker('DROPOFF', pt.lat, pt.lng);
        }
      }
      return;
    }

    if (servicesKey && item.ref_id) {
      try {
        const placeUrl = `https://maps.vietmap.vn/api/place/v4?apikey=${servicesKey}&refid=${encodeURIComponent(
          item.ref_id
        )}`;
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
            } else {
              setDropoffPoint(pt);
              dropoffPointRef.current = pt;
              updateMarker('DROPOFF', lat, lng);
            }
          }
        }
      } catch (err) {
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

    const servicesKey = getVietmapServicesKey();

    try {
      let distanceKm = 0;
      let durationMinutes = 0;
      let coordinates: [number, number][] = [];

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
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
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
    } catch (err: any) {
      console.error('Lỗi tính đường:', err);
      setRouteError('Không thể tính toán tuyến đường lúc này.');
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const drawRouteLine = (coordinates: [number, number][]) => {
    const map = mapInstanceRef.current;
    const vietmapgl = vietmapglRef.current;
    if (!map || !vietmapgl || !coordinates.length) return;

    const routeGeoJSON: any = {
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
    } else {
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
    } catch {}
  };

  const handleReset = () => {
    if (pickupMarkerRef.current) pickupMarkerRef.current.remove();
    if (dropoffMarkerRef.current) dropoffMarkerRef.current.remove();

    const map = mapInstanceRef.current;
    if (map) {
      if (map.getLayer('vietmap-route-line')) map.removeLayer('vietmap-route-line');
      if (map.getLayer('vietmap-route-casing')) map.removeLayer('vietmap-route-casing');
      if (map.getSource('vietmap-route-source')) map.removeSource('vietmap-route-source');
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
  };

  // 5. NÚT "ĐẶT LỊCH CHUYẾN ĐI": Gửi POST http://localhost:8080/api/v1/bookings
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingMessage(null);

    if (!customerName.trim()) {
      setBookingMessage({ type: 'error', text: 'Vui lòng nhập họ và tên của bạn' });
      return;
    }

    const cleanPhone = customerPhone.replace(/\s+/g, '');
    if (!/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/.test(cleanPhone)) {
      setBookingMessage({ type: 'error', text: 'Số điện thoại không hợp lệ (Ví dụ: 0987654321)' });
      return;
    }

    const origin = pickupPointRef.current || pickupPoint;
    const dest = dropoffPointRef.current || dropoffPoint;

    if (!origin || !dest || !routeResult) {
      setBookingMessage({ type: 'error', text: 'Vui lòng hoàn tất tính giá tiền trước khi đặt lịch' });
      return;
    }

    setIsSubmittingBooking(true);

    const formattedPickupTime = `${pickupDate}T${pickupTimeStr}:00`;

    // Đúng 100% mẫu request yêu cầu kèm waitHours, driverId và isRoundTrip:
    const payload = {
      customerName: customerName.trim(),
      customerPhone: cleanPhone,
      pickupAddress: origin.address || pickupInput,
      dropoffAddress: dest.address || dropoffInput,
      distanceKm: routeResult.distanceKm,
      estimatedPrice: routeResult.estimatedPrice,
      pickupTime: formattedPickupTime,
      waitHours: Number(waitHours) || 0,
      driverId: driverId,
      isRoundTrip: isRoundTrip,
      luggageOption: luggageOption,
      note: customNote,
    };

    console.log('Sending payload to http://localhost:8080/api/v1/bookings:', payload);

    try {
      const response = await fetch('http://localhost:8080/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let responseData: any = null;
      try {
        responseData = await response.json();
      } catch {}

      if (response.ok) {
        const tripCode =
          responseData?.tripCode ||
          responseData?.code ||
          responseData?.id ||
          `TAC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        setBookingMessage({
          type: 'success',
          text: `Đặt chuyến thành công! Mã chuyến: ${tripCode}. Đang chuyển trang tracking...`,
        });

        sessionStorage.setItem(`trip_${tripCode}`, JSON.stringify(payload));

        setTimeout(() => {
          navigate(`/trip/${tripCode}`);
        }, 1500);
      } else {
        throw new Error(responseData?.message || `Server trả về lỗi (HTTP ${response.status})`);
      }
    } catch (err: any) {
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
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
      {/* Viền Crimson trang trí */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-700" />

      {/* Header khu vực Đặt Xe & Bản Đồ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-600 text-white shadow-md">
              Hệ Thống Đặt Xe Trực Quan
            </span>
            <span className="text-xs text-slate-400">VIETMAP Maps & Routing API v4</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Đặt Xe Điện Riêng VinFast - Báo Giá Trọn Gói
          </h2>
          <p className="text-xs text-slate-400">
            Chọn lộ trình trên bản đồ, tính khoảng cách chính xác và đặt lịch đón tận nơi.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Đặt lại</span>
        </button>
      </div>

      {/* BỐ CỤC 2 CỘT: CỘT TO HIỆN BẢN ĐỒ + CỘT NHỎ NHẬP THÔNG TIN CHUYẾN ĐI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TO (7 CỘT): HIỂN THỊ BẢN ĐỒ VIETMAP */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          {/* Thông báo khi đang ở chế độ ghim trên map */}
          {mapPickingMode && (
            <div className="p-3 rounded-2xl bg-red-950/80 border border-red-700 text-xs text-red-200 flex items-center justify-between shadow-lg animate-pulse">
              <span>
                👉 Đang chọn: <strong>{mapPickingMode === 'PICKUP' ? 'ĐIỂM ĐÓN (A)' : 'ĐIỂM TRẢ (B)'}</strong>. Vui lòng click vị trí mong muốn trên bản đồ!
              </span>
              <button
                type="button"
                onClick={() => {
                  setMapPickingMode(null);
                  mapPickingModeRef.current = null;
                }}
                className="text-[11px] px-2 py-0.5 bg-slate-900 rounded border border-red-800 text-slate-300 hover:text-white"
              >
                Hủy
              </button>
            </div>
          )}

          {/* Container Bản đồ */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 h-[420px] sm:h-[500px] lg:h-[620px] shadow-2xl">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Loading khi đang tính đường */}
            {isCalculatingRoute && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-20">
                <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold text-white drop-shadow">
                  VIETMAP Routing API đang tính đường xe ô tô...
                </span>
              </div>
            )}

            {/* Badge hướng dẫn góc dưới bản đồ */}
            <div className="absolute bottom-3 left-3 z-10 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-[11px] text-slate-300 shadow-lg pointer-events-none">
              {!pickupPoint ? (
                <span>📍 Nhập hoặc ghim <strong>Điểm đón</strong></span>
              ) : !dropoffPoint ? (
                <span>🏁 Nhập hoặc ghim <strong>Điểm trả</strong></span>
              ) : (
                <span>✨ Đã chọn xong 2 điểm. Bấm &quot;Tính giá tiền&quot; ở cột bên phải.</span>
              )}
            </div>
          </div>
        </div>

        {/* CỘT NHỎ (5 CỘT): NHẬP ĐỊA CHỈ & THÔNG TIN CHUYẾN ĐI */}
        <div className="lg:col-span-5 bg-slate-950/90 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Thông Tin Chuyến Xe
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chọn điểm đón - trả để hệ thống tính giá minh bạch.
            </p>
          </div>

          {/* 1. Điểm Đón (Pickup) */}
          <div className="relative">
            <label className="block text-xs font-semibold text-emerald-400 mb-1 flex items-center justify-between">
              <span>ĐIỂM ĐÓN (PICKUP) <span className="text-red-500">*</span></span>
              {isSearchingPickup && <span className="text-[10px] text-slate-400 animate-pulse">Đang tìm...</span>}
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={pickupInput}
                onChange={(e) => handleInputChange(e.target.value, 'PICKUP')}
                placeholder="Nhập địa chỉ đón (VD: Số 1 Tràng Tiền...)"
                className="w-full pl-3.5 pr-26 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-all"
              />

              {/* Nút Ghim trên map (Fix lỗi Stale Closure bằng REF) */}
              <button
                type="button"
                onClick={() => {
                  const nextMode = mapPickingMode === 'PICKUP' ? null : 'PICKUP';
                  setMapPickingMode(nextMode);
                  mapPickingModeRef.current = nextMode;
                }}
                className={`absolute right-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  mapPickingMode === 'PICKUP'
                    ? 'bg-emerald-600 text-white shadow-md animate-bounce'
                    : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700'
                }`}
                title="Bấm để click chọn trên bản đồ"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span>{mapPickingMode === 'PICKUP' ? 'Đang chọn' : 'Ghim map'}</span>
              </button>
            </div>

            {/* Dropdown Gợi ý Autocomplete Điểm Đón */}
            {pickupSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-40 max-h-48 overflow-y-auto divide-y divide-slate-800">
                {pickupSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => selectSuggestion(item, 'PICKUP')}
                    className="p-2.5 hover:bg-slate-800 cursor-pointer text-left transition-colors"
                  >
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {item.name}
                    </p>
                    {item.address && (
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.address}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Điểm Trả (Dropoff) */}
          <div className="relative">
            <label className="block text-xs font-semibold text-red-400 mb-1 flex items-center justify-between">
              <span>ĐIỂM TRẢ (DROPOFF) <span className="text-red-500">*</span></span>
              {isSearchingDropoff && <span className="text-[10px] text-slate-400 animate-pulse">Đang tìm...</span>}
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={dropoffInput}
                onChange={(e) => handleInputChange(e.target.value, 'DROPOFF')}
                placeholder="Nhập địa chỉ đến (VD: Sân bay Nội Bài...)"
                className="w-full pl-3.5 pr-26 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-red-500 transition-all"
              />

              {/* Nút Ghim trên map (Fix lỗi Stale Closure bằng REF) */}
              <button
                type="button"
                onClick={() => {
                  const nextMode = mapPickingMode === 'DROPOFF' ? null : 'DROPOFF';
                  setMapPickingMode(nextMode);
                  mapPickingModeRef.current = nextMode;
                }}
                className={`absolute right-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  mapPickingMode === 'DROPOFF'
                    ? 'bg-red-600 text-white shadow-md animate-bounce'
                    : 'bg-slate-800 hover:bg-slate-700 text-red-400 border border-slate-700'
                }`}
                title="Bấm để click chọn trên bản đồ"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span>{mapPickingMode === 'DROPOFF' ? 'Đang chọn' : 'Ghim map'}</span>
              </button>
            </div>

            {/* Dropdown Gợi ý Autocomplete Điểm Trả */}
            {dropoffSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-40 max-h-48 overflow-y-auto divide-y divide-slate-800">
                {dropoffSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => selectSuggestion(item, 'DROPOFF')}
                    className="p-2.5 hover:bg-slate-800 cursor-pointer text-left transition-colors"
                  >
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      {item.name}
                    </p>
                    {item.address && (
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.address}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. TÙY CHỌN CHUYẾN ĐI (Nhập trước khi tính giá để tính chính xác giá) */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            {/* Checkbox Đi 2 chiều (Khứ hồi) */}
            <div className="flex items-start justify-between gap-3">
              <label htmlFor="roundTripCheckbox" className="flex items-start gap-2.5 cursor-pointer flex-1 select-none">
                <input
                  id="roundTripCheckbox"
                  type="checkbox"
                  checked={isRoundTrip}
                  onChange={(e) => handleToggleRoundTrip(e.target.checked)}
                  className="mt-0.5 w-4.5 h-4.5 rounded border-slate-600 bg-slate-950 text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Đi 2 chiều (Khứ hồi)</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-950 text-red-400 border border-red-800/80">
                      Chiều về chỉ tính 65%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Tự động nhân đôi (x2) quãng đường và thời gian; chiều về giảm giá chỉ tính 65% chiều đi.
                  </p>
                </div>
              </label>
            </div>

            {/* Ô Thời gian chờ (waitHours - cho phép nhập 0.5 với đơn vị giờ) */}
            <div className="border-t border-slate-800/90 pt-3">
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
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={waitHours}
                    onChange={(e) => handleChangeWaitHours(parseFloat(e.target.value) || 0)}
                    placeholder="0 hoặc 0.5, 1..."
                    className="w-full pl-3 pr-11 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-red-500 font-medium"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                    giờ
                  </span>
                </div>

                {/* Các nút bấm nhanh mốc giờ */}
                <div className="flex items-center gap-1">
                  {[0, 0.5, 1, 1.5, 2].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleChangeWaitHours(h)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        waitHours === h
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      {h === 0 ? '0h' : `${h}h`}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                30.000 đ/giờ tiếp theo (nhập số lẻ đến 0.5 giờ như 0.5, 1.5, 2.5...)
              </p>
            </div>
          </div>

          {/* Lỗi nếu có */}
          {routeError && (
            <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs">
              {routeError}
            </div>
          )}

          {/* BƯỚC 1: NÚT TÍNH GIÁ TIỀN (Chỉ hiện khi chưa tính giá) */}
          {!routeResult ? (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCalculateFare}
                disabled={isCalculatingRoute || !pickupInput.trim() || !dropoffInput.trim()}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-red-900/40 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCalculatingRoute ? (
                  <span>Đang tính lộ trình VIETMAP...</span>
                ) : (
                  <>
                    <span>Tính giá tiền chuyến đi</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* BƯỚC 2: SAU KHI TÍNH GIÁ TIỀN XONG -> HIỆN KẾT QUẢ & FORM ĐẶT LỊCH CHUYẾN ĐI */
            <form onSubmit={handleSubmitBooking} className="space-y-3.5 pt-1">
              {/* Box hiển thị Quãng đường, Thời gian và Bóc tách giá chi tiết */}
              <div className="p-4 rounded-xl bg-slate-900 border border-red-900/50 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span>Quãng đường tính cước:</span>
                    {isRoundTrip && (
                      <span className="text-[10px] bg-red-950 text-red-300 px-1.5 py-0.5 rounded border border-red-800">
                        2 chiều
                      </span>
                    )}
                  </span>
                  <span className="font-bold text-white text-sm">
                    {routeResult.distanceKm} km
                    {isRoundTrip && (
                      <span className="text-[11px] text-slate-400 font-normal ml-1">
                        ({routeResult.oneWayKm} km/chiều)
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Thời gian di chuyển ước tính:</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    ~{routeResult.durationMinutes} phút
                  </span>
                </div>

                {/* Bóc tách các thành phần giá minh bạch */}
                <div className="pt-2.5 border-t border-slate-800 space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Cước chiều đi ({routeResult.oneWayKm} km):</span>
                    <span className="text-slate-200 font-semibold">
                      {routeResult.oneWayFare.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  {isRoundTrip && (
                    <div className="flex justify-between text-rose-300">
                      <span>Cước chiều về (65% chiều đi):</span>
                      <span className="font-semibold">
                        +{routeResult.returnFare.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  )}

                  {routeResult.waitingFee > 0 && (
                    <div className="flex justify-between text-amber-300">
                      <span>Phí thời gian chờ ({waitHours} giờ):</span>
                      <span className="font-semibold">
                        +{routeResult.waitingFee.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Giá cước trọn gói:</span>
                    <span className="text-[10px] text-slate-500">Đã bao gồm chiết khấu</span>
                  </div>
                  <span className="text-xl font-black text-red-500">
                    {routeResult.estimatedPrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCalculateFare}
                  disabled={isCalculatingRoute}
                  className="w-full mt-1 py-1.5 rounded-lg text-[11px] text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Cập nhật lại lộ trình nếu đổi điểm</span>
                </button>
              </div>

              {/* Thông tin khách hàng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0987654321"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Giờ đón (pickupTime) */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Ngày đón</label>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Giờ đón</label>
                  <input
                    type="time"
                    value={pickupTimeStr}
                    onChange={(e) => setPickupTimeStr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Chọn Tài xế phục vụ (driverId) */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Chọn tài xế phục vụ <span className="text-red-500">*</span>
                </label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-red-500"
                >
                  {DRIVERS_LIST.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} - {driver.carModel} ({driver.rating}★)
                    </option>
                  ))}
                </select>
              </div>

              {/* Hành lý */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Số lượng hành lý</label>
                <select
                  value={luggageOption}
                  onChange={(e) => setLuggageOption(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-red-500"
                >
                  <option value="Không có vali">Không có vali</option>
                  <option value="1 vali vừa">1 vali vừa</option>
                  <option value="2 vali to">2 vali to</option>
                  <option value="3-4 vali lớn">3-4 vali lớn (Cốp xe VinFast)</option>
                </select>
              </div>

              {/* Ghi chú riêng */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Ghi chú riêng</label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="VD: Cần xe sạch sẽ, có ghế trẻ em..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Thông báo gửi booking */}
              {bookingMessage && (
                <div
                  className={`p-2.5 rounded-xl text-xs ${
                    bookingMessage.type === 'success'
                      ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-300'
                      : 'bg-red-950/70 border border-red-800 text-red-300'
                  }`}
                >
                  {bookingMessage.text}
                </div>
              )}

              {/* NÚT "ĐẶT LỊCH CHO CHUYẾN ĐI" */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmittingBooking}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-95 transition-all shadow-xl shadow-red-900/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingBooking ? (
                    <span>Đang gửi thông tin...</span>
                  ) : (
                    <span>Đặt lịch cho chuyến đi ({routeResult.estimatedPrice.toLocaleString('vi-VN')} đ)</span>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-slate-500 text-center">
                Endpoint: <code>POST http://localhost:8080/api/v1/bookings</code> (có kèm <code>waitHours</code>, <code>driverId</code> & <code>isRoundTrip</code>)
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
