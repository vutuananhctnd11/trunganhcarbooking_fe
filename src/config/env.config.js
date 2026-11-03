/**
 * Cấu hình biến môi trường tập trung (Environment Configuration)
 * Quản lý API endpoints và API keys nhất quán cho React JS.
 */
export const ENV = {
    // Base URL của Backend Spring Boot API
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
    // Khóa API hiển thị bản đồ VIETMAP (Style Map)
    VIETMAP_VIEW_KEY: import.meta.env.VITE_VIEW_VIETMAP_API_KEY ||
        '548b3461922df3f33402daeaed39c5bf2790b2b496540844',
    // Khóa API dịch vụ VIETMAP (Routing, Autocomplete, Place, Reverse Geocoding)
    VIETMAP_SERVICES_KEY: import.meta.env.VITE_VIETMAP_API_KEY ||
        'cbe88ab71880326cd8d59361805f6bde4adeb92d50777849',
};
