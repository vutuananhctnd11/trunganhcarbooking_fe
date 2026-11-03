import React, { useState } from 'react';
const CAR_IMAGES = [
    {
        id: 1,
        title: 'VinFast Đỏ Crimson Sang Trọng',
        subtitle: 'Ngoại thất góc 3/4 thể thao, lịch lãm và nổi bật mọi cung đường',
        src: 'https://vinfastnghean3s.vn/wp-content/uploads/2025/02/limo-green-mau-do.jpg',
        alt: 'Xe điện VinFast màu đỏ đô bóng bẩy góc 3/4',
        tag: 'Ngoại thất xe',
    },
    {
        id: 2,
        title: 'Hàng Ghế Sau Rộng Rãi & Êm Ái',
        subtitle: 'Ghế bọc da cao cấp, không gian để chân thoải mái, điều hòa ion khử mùi tuyệt đối',
        src: 'https://dubaicare.vn/wp-content/uploads/2025/08/noi-that-limo-green.webp',
        alt: 'Không gian nội thất ghế sau xe điện sang trọng, sạch sẽ',
        tag: 'Nội thất cao cấp',
    },
    {
        id: 3,
        title: 'Khoang Cốp Rộng Cho Mọi Chuyến Đi',
        subtitle: 'Dung tích chứa lớn, để vừa 3-4 vali cỡ lớn hoặc xe đẩy em bé tiện lợi',
        src: 'https://down-vn.img.susercontent.com/file/vn-11134207-820l4-mjhwclryqp6v13',
        alt: 'Cốp xe ô tô rộng rãi sẵn sàng cho vali du lịch và công tác',
        tag: 'Khoang hành lý',
    },
];
const HIGHLIGHT_SPECS = [
    {
        icon: (<svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>),
        label: 'Động cơ điện thuần khiết',
        desc: 'Êm ái tuyệt đối, không rung giật, không mùi xăng dầu',
    },
    {
        icon: (<svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
      </svg>),
        label: 'Tiêu chuẩn an toàn 5 sao',
        desc: 'Hệ thống trợ lái ADAS, túi khí đa điểm bảo vệ cả gia đình',
    },
    {
        icon: (<svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z"/>
      </svg>),
        label: 'Không khí trong lành',
        desc: 'Bộ lọc điều hòa chuẩn PM2.5, khử khuẩn sau mỗi cuốc khách',
    },
    {
        icon: (<svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>),
        label: 'Đón đúng giờ 100%',
        desc: 'Tài xế chủ động đến sớm 10 phút, hỗ trợ mang vác hành lý chu đáo',
    },
];
export default function VehicleShowcase() {
    const [activeIdx, setActiveIdx] = useState(0);
    const activeImage = CAR_IMAGES[activeIdx];
    const handleNext = () => {
        setActiveIdx((prev) => (prev + 1) % CAR_IMAGES.length);
    };
    const handlePrev = () => {
        setActiveIdx((prev) => (prev - 1 + CAR_IMAGES.length) % CAR_IMAGES.length);
    };
    return (<div className="w-full flex flex-col space-y-6">
      {/* Khung Showcase Hình ảnh xe VinFast Đỏ */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl group">
        <div className="relative h-[280px] sm:h-[380px] md:h-[460px] w-full overflow-hidden">
          <img src={activeImage.src} alt={activeImage.alt} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"/>

          {/* Lớp phủ gradient tạo chiều sâu chuẩn phong cách Titan & Đỏ Crimson */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none"/>

          {/* Tag phân loại */}
          <div className="absolute top-4 left-4 z-10">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-red-600/90 text-white backdrop-blur-md shadow-lg shadow-red-900/40 border border-red-500/30">
              {activeImage.tag}
            </span>
          </div>

          {/* Nút lùi/tiến ảnh */}
          <button type="button" onClick={handlePrev} aria-label="Xem ảnh trước" className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-red-600 text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 border border-slate-700/60 hover:border-red-500 hover:scale-110 active:scale-95">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <button type="button" onClick={handleNext} aria-label="Xem ảnh kế tiếp" className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-red-600 text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 border border-slate-700/60 hover:border-red-500 hover:scale-110 active:scale-95">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
            </svg>
          </button>

          {/* Chú thích thông tin ảnh */}
          <div className="absolute bottom-4 left-4 right-4 z-10 text-white">
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white drop-shadow-md">
              {activeImage.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl line-clamp-2 drop-shadow">
              {activeImage.subtitle}
            </p>
          </div>
        </div>

        {/* Thumbnail Selector bên dưới slider */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center gap-3 overflow-x-auto">
          {CAR_IMAGES.map((img, index) => (<button key={img.id} type="button" onClick={() => setActiveIdx(index)} className={`relative flex-shrink-0 w-20 h-14 sm:w-24 sm:h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${activeIdx === index
                ? 'border-red-500 ring-2 ring-red-500/40 scale-100'
                : 'border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'}`}>
              <img src={img.src} alt={img.alt} className="w-full h-full object-cover"/>
              {activeIdx === index && (<div className="absolute inset-0 bg-red-600/10 pointer-events-none"/>)}
            </button>))}
          <div className="ml-auto hidden sm:flex items-center gap-2 text-xs text-slate-400 pr-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"/>
            <span>Sẵn sàng phục vụ 24/7</span>
          </div>
        </div>
      </div>

      {/* Thông số nổi bật & Tiện ích xe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {HIGHLIGHT_SPECS.map((spec, index) => (<div key={index} className="flex items-start gap-3.5 p-3.5 sm:p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/30 text-red-500 flex-shrink-0">
              {spec.icon}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-100">{spec.label}</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{spec.desc}</p>
            </div>
          </div>))}
      </div>
    </div>);
}
