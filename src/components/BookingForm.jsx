import React, { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
export default function BookingForm() {
    const navigate = useNavigate();
    const nameId = useId();
    const phoneId = useId();
    const pickupId = useId();
    const dropoffId = useId();
    const dateId = useId();
    const timeId = useId();
    const passengersId = useId();
    const luggageId = useId();
    const notesId = useId();
    // Khởi tạo thời gian đón mặc định là 30 phút sau thời điểm hiện tại
    const now = new Date();
    const defaultDate = now.toISOString().split('T')[0];
    const later30Min = new Date(now.getTime() + 30 * 60 * 1000);
    const defaultTime = `${String(later30Min.getHours()).padStart(2, '0')}:${String(later30Min.getMinutes()).padStart(2, '0')}`;
    const [formData, setFormData] = useState({
        customerName: '',
        phone: '',
        pickupAddress: '',
        dropoffAddress: '',
        pickupDate: defaultDate,
        pickupTime: defaultTime,
        passengers: 2,
        luggageCount: 1,
        notes: '',
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState(null);
    // Regex kiểm tra số điện thoại Việt Nam chuẩn (10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09 hoặc +84)
    const VIETNAM_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    const validate = () => {
        const newErrors = {};
        if (!formData.customerName.trim()) {
            newErrors.customerName = 'Vui lòng nhập họ và tên của bạn';
        }
        if (!formData.phone.trim()) {
            newErrors.phone = 'Vui lòng nhập số điện thoại liên hệ';
        }
        else if (!VIETNAM_PHONE_REGEX.test(formData.phone.trim().replace(/\s+/g, ''))) {
            newErrors.phone = 'Số điện thoại không hợp lệ (Ví dụ: 0912345678 hoặc +84912345678)';
        }
        if (!formData.pickupAddress.trim()) {
            newErrors.pickupAddress = 'Vui lòng nhập địa chỉ đón khách';
        }
        if (!formData.dropoffAddress.trim()) {
            newErrors.dropoffAddress = 'Vui lòng nhập địa chỉ trả khách';
        }
        if (!formData.pickupDate) {
            newErrors.pickupDate = 'Vui lòng chọn ngày đón';
        }
        if (!formData.pickupTime) {
            newErrors.pickupTime = 'Vui lòng chọn giờ đón';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'passengers' || name === 'luggageCount' ? Number(value) : value,
        }));
        // Xóa lỗi của trường tương ứng khi người dùng nhập lại
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError(null);
        if (!validate()) {
            return;
        }
        setIsSubmitting(true);
        try {
            // Chuẩn hóa định dạng số điện thoại
            const sanitizedPhone = formData.phone.trim().replace(/\s+/g, '');
            const payload = {
                ...formData,
                phone: sanitizedPhone,
            };
            // Gửi POST request tới API tạo đơn
            const response = await fetch('/api/trips', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            let tripCode = '';
            if (response.ok) {
                const data = await response.json();
                tripCode = data.tripCode || data.code || data.id;
            }
            else {
                // Dự phòng tạo mã tạm thời nếu backend chưa cấu hình endpoint hoặc mock demo
                console.warn('API trả về phản hồi không thành công, tạo mã chuyến đi giả lập cho demo');
                const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                tripCode = `TAC-${randomCode}`;
            }
            // Lưu thông tin chuyến vào sessionStorage để trang chi tiết có thể hiển thị dữ liệu tức thì
            if (typeof window !== 'undefined') {
                sessionStorage.setItem(`trip_${tripCode}`, JSON.stringify(payload));
            }
            // Chuyển hướng ngay sang màn hình Tracking Realtime theo yêu cầu
            navigate(`/trip/${tripCode}`);
        }
        catch (error) {
            console.error('Lỗi khi gọi API tạo chuyến:', error);
            // Fallback: Nếu không có backend server, vẫn tạo mã trải nghiệm khách hàng
            const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const fallbackCode = `TAC-${randomCode}`;
            if (typeof window !== 'undefined') {
                sessionStorage.setItem(`trip_${fallbackCode}`, JSON.stringify(formData));
            }
            navigate(`/trip/${fallbackCode}`);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<div className="w-full bg-slate-900/95 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Điểm nhấn thẩm mỹ dải viền Crimson */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-700"/>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-red-500 bg-red-950/60 px-2.5 py-1 rounded border border-red-800/40">
            Đặt Xe Trực Tiếp
          </span>
          <span className="text-xs text-slate-400 font-medium">Báo giá minh bạch</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mt-2">
          Thông Tin Chuyến Xe Riêng
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Tài xế Trung Anh liên hệ xác nhận trong vòng 3 phút qua điện thoại/Zalo.
        </p>
      </div>

      {apiError && (<div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs sm:text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          <span>{apiError}</span>
        </div>)}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Họ tên & Số điện thoại */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={nameId} className="block text-xs font-medium text-slate-300 mb-1.5">
              Họ và tên khách hàng <span className="text-red-500">*</span>
            </label>
            <input id={nameId} type="text" name="customerName" placeholder="Nguyễn Văn A" value={formData.customerName} onChange={handleChange} className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all ${errors.customerName
            ? 'border-red-500 focus:ring-red-500/40'
            : 'border-slate-800 focus:border-red-500 focus:ring-red-500/30'}`}/>
            {errors.customerName && (<p className="text-red-400 text-xs mt-1">{errors.customerName}</p>)}
          </div>

          <div>
            <label htmlFor={phoneId} className="block text-xs font-medium text-slate-300 mb-1.5">
              Số điện thoại liên hệ <span className="text-red-500">*</span>
            </label>
            <input id={phoneId} type="tel" name="phone" placeholder="0912 345 678" value={formData.phone} onChange={handleChange} className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all ${errors.phone
            ? 'border-red-500 focus:ring-red-500/40'
            : 'border-slate-800 focus:border-red-500 focus:ring-red-500/30'}`}/>
            {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
          </div>
        </div>

        {/* Điểm đón & Điểm đến */}
        <div className="space-y-3">
          <div>
            <label htmlFor={pickupId} className="block text-xs font-medium text-slate-300 mb-1.5">
              Điểm đón (Pickup address) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"/>
              <input id={pickupId} type="text" name="pickupAddress" placeholder="VD: Chung cư Vinhomes Smart City, Tây Mỗ, Hà Nội" value={formData.pickupAddress} onChange={handleChange} className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950/70 border text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all ${errors.pickupAddress
            ? 'border-red-500 focus:ring-red-500/40'
            : 'border-slate-800 focus:border-red-500 focus:ring-red-500/30'}`}/>
            </div>
            {errors.pickupAddress && (<p className="text-red-400 text-xs mt-1">{errors.pickupAddress}</p>)}
          </div>

          <div>
            <label htmlFor={dropoffId} className="block text-xs font-medium text-slate-300 mb-1.5">
              Điểm đến (Dropoff address) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-red-500 ring-4 ring-red-500/20"/>
              <input id={dropoffId} type="text" name="dropoffAddress" placeholder="VD: Sân bay Nội Bài - Nhà ga T1" value={formData.dropoffAddress} onChange={handleChange} className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950/70 border text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all ${errors.dropoffAddress
            ? 'border-red-500 focus:ring-red-500/40'
            : 'border-slate-800 focus:border-red-500 focus:ring-red-500/30'}`}/>
            </div>
            {errors.dropoffAddress && (<p className="text-red-400 text-xs mt-1">{errors.dropoffAddress}</p>)}
          </div>
        </div>

        {/* Thời gian đón: Ngày & Giờ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={dateId} className="block text-xs font-medium text-slate-300 mb-1.5">
              Ngày đón <span className="text-red-500">*</span>
            </label>
            <input id={dateId} type="date" name="pickupDate" value={formData.pickupDate} onChange={handleChange} className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border text-slate-100 text-sm focus:outline-none focus:ring-2 transition-all ${errors.pickupDate
            ? 'border-red-500 focus:ring-red-500/40'
            : 'border-slate-800 focus:border-red-500 focus:ring-red-500/30'}`}/>
            {errors.pickupDate && <p className="text-red-400 text-xs mt-1">{errors.pickupDate}</p>}
          </div>

          <div>
            <label htmlFor={timeId} className="block text-xs font-medium text-slate-300 mb-1.5">
              Giờ đón <span className="text-red-500">*</span>
            </label>
            <input id={timeId} type="time" name="pickupTime" value={formData.pickupTime} onChange={handleChange} className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border text-slate-100 text-sm focus:outline-none focus:ring-2 transition-all ${errors.pickupTime
            ? 'border-red-500 focus:ring-red-500/40'
            : 'border-slate-800 focus:border-red-500 focus:ring-red-500/30'}`}/>
            {errors.pickupTime && <p className="text-red-400 text-xs mt-1">{errors.pickupTime}</p>}
          </div>
        </div>

        {/* Số người đi & Ghi chú hành lý */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={passengersId} className="block text-xs font-medium text-slate-300 mb-1.5">
              Số người đi
            </label>
            <select id={passengersId} name="passengers" value={formData.passengers} onChange={handleChange} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all">
              <option value={1}>1 người</option>
              <option value={2}>2 người</option>
              <option value={3}>3 người</option>
              <option value={4}>4 người (Tối đa)</option>
            </select>
          </div>

          <div>
            <label htmlFor={luggageId} className="block text-xs font-medium text-slate-300 mb-1.5">
              Hành lý dự kiến
            </label>
            <select id={luggageId} name="luggageCount" value={formData.luggageCount} onChange={handleChange} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all">
              <option value={0}>Không có vali</option>
              <option value={1}>1 vali vừa / balo</option>
              <option value={2}>2 vali</option>
              <option value={3}>3 - 4 vali lớn</option>
            </select>
          </div>
        </div>

        {/* Ghi chú thêm */}
        <div>
          <label htmlFor={notesId} className="block text-xs font-medium text-slate-300 mb-1.5">
            Ghi chú thêm (Có trẻ em, cần ghế trẻ em, chuyến bay số hiệu, ...)
          </label>
          <textarea id={notesId} name="notes" rows={2} placeholder="VD: Cần xe đón đúng 08h30 để kịp chuyến bay VN214, có 1 vali lớn..." value={formData.notes} onChange={handleChange} className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all resize-none"/>
        </div>

        {/* Nút Submit */}
        <div className="pt-2">
          <button type="submit" disabled={isSubmitting} className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-[0.99] transition-all duration-200 shadow-xl shadow-red-900/40 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
            {isSubmitting ? (<>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                <span>Đang xử lý đặt xe...</span>
              </>) : (<>
                <span>Xác nhận đặt chuyến</span>
                <svg className="w-5 h-5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
              </>)}
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-500">
          Cam kết bảo mật thông tin khách hàng • Giá cước không phát sinh phụ phí ẩn
        </p>
      </form>
    </div>);
}
