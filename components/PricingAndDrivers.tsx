import React from 'react';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  rating: number;
  tripsCount: number;
  carModel: string;
  plateNumber: string;
  tag: string;
  experience: string;
}

export const DRIVERS_LIST: Driver[] = [
  {
    id: '1',
    name: 'Trung Anh (Chủ xe)',
    phone: '0362.882.882',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    rating: 5.0,
    tripsCount: 1420,
    carModel: 'VinFast VF 8 Plus (Đỏ Crimson)',
    plateNumber: '30K - 868.86',
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
    carModel: 'VinFast VF e34 (Limo Green Đỏ)',
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

const PRICING_PLANS = [
  {
    name: 'Di Chuyển Nội Thành & Ngắn',
    subtitle: 'Lộ trình ngắn, đi làm, gặp đối tác, đi chơi gia đình',
    basePrice: '30.500 đ',
    baseKm: '2 km đầu tiên',
    perKm: '14.700 đ/km (km 3-12)',
    waitingFee: '30.000 đ/giờ (Miễn phí 30p đầu)',
    highlight: false,
    features: [
      'Giá mở cửa (2 km đầu tiên): 30.500 VNĐ',
      'Từ km 3 đến km 12: 14.700 VNĐ/km',
      'Từ km 13 đến km 25: 13.800 VNĐ/km',
      'Từ km 26 trở đi: chỉ 11.900 VNĐ/km',
    ],
  },
  {
    name: 'Đưa Đón Sân Bay Nội Bài',
    subtitle: 'Chuyến bay kịp giờ, khoang cốp rộng chứa 3-4 vali lớn',
    basePrice: '250.000 đ',
    baseKm: 'Trọn gói từ nội thành',
    perKm: '11.900 đ/km cự ly xa',
    waitingFee: 'Miễn phí chờ khi delay',
    highlight: true,
    badge: 'ĐẶT NHIỀU NHẤT',
    features: [
      'Theo dõi giờ hạ cánh qua số hiệu chuyến bay',
      'Tài xế chủ động đến sớm 10 phút hỗ trợ hành lý',
      'Miễn phí chờ đợi khi chuyến bay bị delay',
      'Đón trả chuẩn sảnh ga T1 (Quốc nội) & T2 (Quốc tế)',
    ],
  },
  {
    name: 'Đường Dài & Đi 2 Chiều',
    subtitle: 'Đi tỉnh 1 chiều hoặc 2 chiều trong ngày / qua đêm',
    basePrice: '11.900 đ/km',
    baseKm: 'Cự ly từ km thứ 26 trở đi',
    perKm: 'Chiều về chỉ tính 65%',
    waitingFee: 'Thỏa thuận theo tour',
    highlight: false,
    features: [
      'Đi 2 chiều: Chiều về chỉ tính 65% giá chiều đi',
      'Tự động nhân đôi quãng đường và thời gian',
      'Nghỉ ngơi, ngả lưng êm dịu không rung lắc',
      'Bao trọn phí cầu đường theo thỏa thuận',
    ],
  },
];

export default function PricingAndDrivers({ onSelectDriver }: { onSelectDriver?: (driverId: string) => void }) {
  const handleChooseDriver = (driverId: string) => {
    if (onSelectDriver) {
      onSelectDriver(driverId);
    }
    const bookingElement = document.getElementById('booking-section');
    if (bookingElement) {
      bookingElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full space-y-12">
      {/* 1. BẢNG GIÁ CƯỚC MINH BẠCH */}
      <section id="pricing-section">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-red-500 bg-red-950/60 px-3 py-1 rounded-full border border-red-800/40">
            Minh Bạch Cước Phí
          </span>
          <h2 className="text-xl sm:text-3xl font-extrabold text-white mt-2">
            Bảng Giá Cước Xe Điện VinFast Trọn Gói
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Giá cước tính theo lộ trình thực tế, thời gian chờ linh hoạt tính từ 0.5 giờ, không phí ẩn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PRICING_PLANS.map((plan, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-5 sm:p-6 border flex flex-col justify-between transition-all duration-300 relative ${
                plan.highlight
                  ? 'bg-gradient-to-b from-slate-900 to-red-950/40 border-red-600/80 shadow-2xl shadow-red-950/50 scale-[1.02]'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white shadow-md">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{plan.subtitle}</p>

                <div className="my-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-red-500">{plan.basePrice}</span>
                    <span className="text-xs text-slate-400">/ {plan.baseKm}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-300 flex items-center justify-between">
                    <span>Km tiếp theo:</span>
                    <strong className="text-slate-100">{plan.perKm}</strong>
                  </div>
                  <div className="mt-1 text-xs text-slate-300 flex items-center justify-between border-t border-slate-800/80 pt-1">
                    <span>Phí thời gian chờ:</span>
                    <strong className="text-amber-400">{plan.waitingFee}</strong>
                  </div>
                </div>

                <ul className="space-y-2 text-xs text-slate-300 mb-6">
                  {plan.features.map((item, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleChooseDriver('1')}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  plan.highlight
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <span>Chọn gói cước này</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 2. DANH SÁCH TÀI XẾ CHUYÊN NGHIỆP */}
      <section id="drivers-section" className="pt-6 border-t border-slate-800">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-red-500 bg-red-950/60 px-3 py-1 rounded-full border border-red-800/40">
            Đội Ngũ Tài Xế
          </span>
          <h2 className="text-xl sm:text-3xl font-extrabold text-white mt-2">
            Đội Ngũ Tài Xế Phục Vụ Tận Tâm
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            100% tài xế chuyên nghiệp, lịch sự, lái xe điện VinFast màu đỏ an toàn và chu đáo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {DRIVERS_LIST.map((driver) => (
            <div
              key={driver.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all"
            >
              <div>
                {/* Header tài xế: Avatar & Đánh giá */}
                <div className="flex items-center gap-3.5 pb-3 border-b border-slate-800">
                  <div className="relative">
                    <img
                      src={driver.avatar}
                      alt={driver.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-red-600/70 shadow-md"
                    />
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      {driver.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <span className="text-amber-400 font-bold flex items-center">
                        ★ {driver.rating}
                      </span>
                      <span>•</span>
                      <span>{driver.tripsCount} chuyến</span>
                    </div>
                  </div>
                </div>

                {/* Thông tin phương tiện xe VinFast đỏ */}
                <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Phương tiện:</span>
                    <span className="font-semibold text-slate-200">{driver.carModel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Biển số xe:</span>
                    <span className="font-mono font-bold text-red-400 bg-red-950/50 px-2 py-0.5 rounded border border-red-900/40">
                      {driver.plateNumber}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                  {driver.experience}
                </p>

                <div className="mt-2.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    {driver.tag}
                  </span>
                </div>
              </div>

              {/* Nút Chọn tài xế này */}
              <div className="mt-5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleChooseDriver(driver.id)}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-red-600 border border-slate-700 hover:border-red-500 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Chọn tài xế {driver.name.split(' ')[0]}</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

