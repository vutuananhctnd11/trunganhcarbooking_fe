import { apiClient } from './apiClient';

export interface BannerItem {
  id: number;
  title: string;
  tagline: string;
  badge: string;
  image: string;
  alt: string;
  actionText?: string;
  actionUrl?: string;
  isGraphicBanner?: boolean;
  displayOrder?: number;
  status?: string;
}

export const FALLBACK_BANNERS: BannerItem[] = [
  {
    id: 1,
    title: 'Trực Ninh ⇄ Nội Bài - Chỉ 900K',
    tagline: 'Đặt xe VinFast Limo Green trọn gói 900k/chuyến (Bao trọn xe) • Đón trả tận nơi',
    badge: 'HOT DEAL 900K',
    image: 'https://res.cloudinary.com/dzueehiwb/image/upload/v1793693689/banner_truc_ninh_noi_bai_zwoaat.png',
    alt: 'Đặt xe VinFast Limo Green từ Trực Ninh đến Nội Bài chỉ 900k Trung Anh Car',
    actionText: 'Đặt xe đi sân bay ngay',
    actionUrl: '/booking?route=truc-ninh-noi-bai',
    isGraphicBanner: true,
    displayOrder: 1,
    status: 'ACTIVE',
  },
  {
    id: 2,
    title: 'Hành Trình Du Lịch & Về Quê Êm Ái',
    tagline: 'Không gian tĩnh lặng, không mùi say xe • Cả gia đình thoải mái suốt chuyến đi xa',
    badge: 'GIA ĐÌNH YÊU THÍCH',
    image: 'https://res.cloudinary.com/dzueehiwb/image/upload/v1793692013/photo_2026-11-02_23-00-22_jsarg5.jpg',
    alt: 'Chiến dịch xe gia đình về quê du lịch',
    actionText: 'Xem báo giá đường dài',
    actionUrl: '/booking?route=du-lich-ve-que',
    displayOrder: 2,
    status: 'ACTIVE',
  },
  {
    id: 3,
    title: 'Phục Vụ Sự Kiện & Gặp Gỡ Đối Tác',
    tagline: 'Tài xế lịch thiệp, đón đúng giờ 100% • Nâng tầm hình ảnh chuyên nghiệp',
    badge: 'DOANH NHÂN & CÔNG TÁC',
    image: 'https://vinfastauto-danang.vn/wp-content/uploads/2025/03/vinfast-limo-green-250303-06-1200.jpg',
    alt: 'Chiến dịch xe phục vụ hội nghị và sự kiện',
    actionText: 'Liên hệ đặt lịch hẹn',
    actionUrl: '/booking?route=su-kien-doi-tac',
    displayOrder: 3,
    status: 'ACTIVE',
  },
];

export class BannerService {
  /**
   * Gọi API lấy danh sách banners từ Backend (GET /banners)
   */
  async getBanners(): Promise<BannerItem[]> {
    const data = await apiClient.get<BannerItem[] | { content: BannerItem[] }>('/banners');
    const list = Array.isArray(data) ? data : data?.content || [];
    return list
      .filter((item) => !item.status || item.status === 'ACTIVE')
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  /**
   * Lấy danh sách banner có fallback dữ liệu mẫu nếu máy chủ offline
   */
  async getBannersWithFallback(): Promise<BannerItem[]> {
    try {
      const list = await this.getBanners();
      if (list && list.length > 0) {
        return list;
      }
      return FALLBACK_BANNERS;
    } catch (err) {
      console.warn('Backend API /banners không khả dụng, sử dụng banner dự phòng:', err);
      return FALLBACK_BANNERS;
    }
  }
}

export const bannerService = new BannerService();
