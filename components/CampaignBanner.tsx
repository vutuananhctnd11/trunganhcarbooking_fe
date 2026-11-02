'use client';

import React, { useState, useEffect } from 'react';

export interface CampaignSlide {
  id: number;
  title: string;
  tagline: string;
  badge: string;
  image: string;
  alt: string;
  actionText?: string;
  isGraphicBanner?: boolean;
}

const CAMPAIGN_SLIDES: CampaignSlide[] = [
  {
    id: 1,
    title: 'Trực Ninh ⇄ Nội Bài - Chỉ 900K',
    tagline: 'Đặt xe VinFast Limo Green trọn gói 900k/chuyến (Bao trọn xe) • Đón trả tận nơi',
    badge: 'HOT DEAL 900K',
    image: '/banner_truc_ninh_noi_bai.png',
    alt: 'Đặt xe VinFast Limo Green từ Trực Ninh đến Nội Bài chỉ 900k Trung Anh Car',
    actionText: 'Đặt xe đi sân bay ngay',
    isGraphicBanner: true,
  },
  {
    id: 2,
    title: 'Hành Trình Du Lịch & Về Quê Êm Ái',
    tagline: 'Không gian tĩnh lặng, không mùi say xe • Cả gia đình thoải mái suốt chuyến đi xa',
    badge: 'GIA ĐÌNH YÊU THÍCH',
    image: 'https://mediagiaothong.tapchixaydung.vn/mediav2/upload/giaothong/tapchigiaothong.qltns.mediacdn.vn/481400261263945728/2025/3/31/vinfast-limo-green-1743431109130226245032.jpg',
    alt: 'Chiến dịch xe gia đình về quê du lịch',
    actionText: 'Xem báo giá đường dài',
  },
  {
    id: 3,
    title: 'Phục Vụ Sự Kiện & Gặp Gỡ Đối Tác',
    tagline: 'Tài xế lịch thiệp, đón đúng giờ 100% • Nâng tầm hình ảnh chuyên nghiệp',
    badge: 'DOANH NHÂN & CÔNG TÁC',
    image: 'https://vinfastauto-danang.vn/wp-content/uploads/2025/03/vinfast-limo-green-250303-06-1200.jpg',
    alt: 'Chiến dịch xe phục vụ hội nghị và sự kiện',
    actionText: 'Liên hệ đặt lịch hẹn',
  },
];

export default function CampaignBanner() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Tự động chuyển banner sau mỗi 5 giây nếu không hover
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % CAMPAIGN_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const currentSlide = CAMPAIGN_SLIDES[currentIdx];

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % CAMPAIGN_SLIDES.length);
  };

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev - 1 + CAMPAIGN_SLIDES.length) % CAMPAIGN_SLIDES.length);
  };

  const handleScrollToBooking = () => {
    const bookingElement = document.getElementById('booking-section');
    if (bookingElement) {
      bookingElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6 sm:my-8">
      <div
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl shadow-red-950/20 group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Banner Image Container */}
        <div
          className={`relative aspect-[16/9] max-h-[520px] w-full overflow-hidden select-none ${
            currentSlide.isGraphicBanner ? 'cursor-pointer' : ''
          }`}
          onClick={currentSlide.isGraphicBanner ? handleScrollToBooking : undefined}
          title={currentSlide.isGraphicBanner ? 'Nhấn để đặt xe ngay' : undefined}
        >
          <img
            src={currentSlide.image}
            alt={currentSlide.alt}
            className="w-full h-full object-cover object-center transition-all duration-700 ease-out transform group-hover:scale-[1.01]"
          />

          {/* Lớp Overlay Gradient */}
          {currentSlide.isGraphicBanner ? (
            /* Banner đồ họa có sẵn chữ quảng cáo: giữ sáng rõ 100%, không phủ lớp đen dày làm tối thông tin */
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent pointer-events-none" />
          ) : (
            /* Banner ảnh thông thường: overlay dịu nhẹ để làm nổi bật ảnh và chữ dễ đọc */
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20 pointer-events-none" />
            </>
          )}

          {/* Nội dung Banner chiến dịch */}
          {currentSlide.isGraphicBanner ? (
            /* Dành cho banner đồ họa: nút CTA đặt ở góc trên bên phải (khu vực thoáng, không che chữ hay hotline) */
            <div className="absolute top-3 right-12 sm:top-5 sm:right-16 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleScrollToBooking();
                }}
                className="px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs sm:text-sm font-bold shadow-xl shadow-red-950/70 hover:shadow-red-800/80 active:scale-95 transition-all duration-200 flex items-center gap-2 cursor-pointer border border-white/20"
              >
                <span>{currentSlide.actionText || 'Đặt xe ngay'}</span>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          ) : (
            /* Dành cho banner thông thường */
            <div className="absolute inset-0 flex flex-col justify-end sm:justify-center p-6 sm:p-10 md:p-14 max-w-2xl z-10 pointer-events-none">
              {/* Badge chiến dịch */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600 text-white text-[11px] sm:text-xs font-bold tracking-wider uppercase mb-3 shadow-lg shadow-red-900/50 border border-red-400/40 w-fit pointer-events-auto">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>{currentSlide.badge}</span>
              </div>

              {/* Tiêu đề & Tagline */}
              <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
                {currentSlide.title}
              </h2>
              <p className="text-xs sm:text-base text-slate-200 mt-2 sm:mt-3 leading-relaxed drop-shadow max-w-xl">
                {currentSlide.tagline}
              </p>

              {/* Nút Call To Action */}
              <div className="mt-4 sm:mt-6 flex items-center gap-3 pointer-events-auto">
                <button
                  type="button"
                  onClick={handleScrollToBooking}
                  className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs sm:text-sm font-bold shadow-xl shadow-red-900/50 hover:shadow-red-800/70 active:scale-95 transition-all duration-200 flex items-center gap-2 cursor-pointer"
                >
                  <span>{currentSlide.actionText || 'Đặt chuyến ngay'}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Nút lùi / tiến Banner */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Xem chiến dịch trước"
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-950/70 hover:bg-red-600 text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 border border-slate-700/60 hover:border-red-500 hover:scale-110 active:scale-95 shadow-lg cursor-pointer"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Xem chiến dịch tiếp theo"
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-950/70 hover:bg-red-600 text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 border border-slate-700/60 hover:border-red-500 hover:scale-110 active:scale-95 shadow-lg cursor-pointer"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Thanh điều hướng Dots & Preview Thumbnail */}
        <div className="p-3 sm:p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-4">
          {/* Thumbnails preview chiến dịch */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
            {CAMPAIGN_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentIdx(idx)}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg border text-left transition-all duration-200 flex-shrink-0 cursor-pointer ${
                  currentIdx === idx
                    ? 'border-red-500 bg-red-950/50 text-white shadow-md shadow-red-900/30'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="w-10 h-7 rounded overflow-hidden flex-shrink-0 bg-slate-800">
                  <img src={slide.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold line-clamp-1">{slide.title}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {CAMPAIGN_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIdx(idx)}
                aria-label={`Chuyển tới slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentIdx === idx ? 'w-6 bg-red-600' : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
