import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { driverService } from '../services/driverService';
export default function DriverAuthModal({ isOpen, onClose, onLoginSuccess }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('LOGIN');
    // State đăng nhập
    const [phone, setPhone] = useState('0988123456');
    const [password, setPassword] = useState('MatKhauCuaToi123');
    // State đăng ký
    const [registerName, setRegisterName] = useState('Vũ Tuấn Anh');
    const [registerPhone, setRegisterPhone] = useState('0988123456');
    const [registerPlate, setRegisterPlate] = useState('30K - 999.88');
    const [registerCarModel, setRegisterCarModel] = useState('VinFast Limo Green (VF 8)');
    const [registerPassword, setRegisterPassword] = useState('MatKhauCuaToi123');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    if (!isOpen)
        return null;
    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoading(true);
        try {
            const res = await driverService.login(phone, password);
            if (res.success && res.driver) {
                if (onLoginSuccess)
                    onLoginSuccess(res.driver);
                onClose();
                navigate('/driver/schedule');
            }
            else {
                setErrorMessage(res.message || 'Đăng nhập không thành công.');
            }
        }
        catch (err) {
            setErrorMessage(err.message || 'Lỗi kết nối máy chủ');
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleQuickLoginDefault = () => {
        setIsLoading(true);
        setTimeout(() => {
            const driver = driverService.loginAsDefault();
            setIsLoading(false);
            if (onLoginSuccess)
                onLoginSuccess(driver);
            onClose();
            navigate('/driver/schedule');
        }, 300);
    };
    const handleRegister = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        if (!registerName.trim()) {
            setErrorMessage('Vui lòng nhập họ và tên tài xế.');
            return;
        }
        if (!registerPhone.trim()) {
            setErrorMessage('Vui lòng nhập số điện thoại liên hệ.');
            return;
        }
        if (!registerPlate.trim()) {
            setErrorMessage('Vui lòng nhập biển số xe.');
            return;
        }
        if (!registerPassword.trim()) {
            setErrorMessage('Vui lòng nhập mật khẩu tài xế.');
            return;
        }
        setIsLoading(true);
        try {
            const res = await driverService.register({
                fullName: registerName.trim(),
                phone: registerPhone.trim(),
                licensePlate: registerPlate.trim(),
                vehicleModel: registerCarModel.trim(),
                password: registerPassword.trim(),
            });
            if (res.success && res.driver) {
                if (onLoginSuccess)
                    onLoginSuccess(res.driver);
                onClose();
                navigate('/driver/schedule');
            }
            else {
                setErrorMessage(res.message || 'Đăng ký tài xế thất bại.');
            }
        }
        catch (err) {
            setErrorMessage(err.message || 'Lỗi kết nối máy chủ');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop mờ nền */}
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" onClick={onClose}/>

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-red-950/40 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-slate-900 to-red-950/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-red-900/40">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">Cổng Tài Xế Trung Anh</h3>
              <p className="text-xs text-slate-400">Quản lý lịch trình & điều hành chuyến xe</p>
            </div>
          </div>

          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Tab Switcher: Đăng nhập vs Đăng ký */}
        <div className="p-2 bg-slate-950/60 border-b border-slate-800 flex gap-1">
          <button type="button" onClick={() => {
            setActiveTab('LOGIN');
            setErrorMessage('');
        }} className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${activeTab === 'LOGIN'
            ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}>
            Đăng Nhập Tài Xế
          </button>
          <button type="button" onClick={() => {
            setActiveTab('REGISTER');
            setErrorMessage('');
        }} className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${activeTab === 'REGISTER'
            ? 'bg-red-600 text-white shadow-md shadow-red-950/50'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}>
            Đăng Ký Tài Xế Mới
          </button>
        </div>

        {/* Thông báo lỗi nếu có */}
        {errorMessage && (<div className="mx-6 mt-4 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <span>{errorMessage}</span>
          </div>)}

        {/* FORM ĐĂNG NHẬP */}
        {activeTab === 'LOGIN' && (<form onSubmit={handleLogin} className="p-6 space-y-4">
            {/* Nút 1-Click Test Tài khoản Mẫu */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-red-950/40 via-slate-900 to-amber-950/30 border border-red-900/40 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">Tài xế mẫu: Trung Anh (Chủ xe)</p>
                <p className="text-[11px] text-slate-400 truncate">SĐT: 0362.882.882 • Xe VinFast VF e34</p>
              </div>
              <button type="button" onClick={handleQuickLoginDefault} className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-950/50 flex-shrink-0 cursor-pointer">
                Vào xem ngay
              </button>
            </div>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-800 w-full"/>
              <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase font-semibold">
                hoặc đăng nhập bằng SĐT
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Số điện thoại tài xế
              </label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="VD: 0362882882" required className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"/>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mật khẩu
              </label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nhập mật khẩu (Mặc định 123456)" required className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"/>
            </div>

            <button type="submit" disabled={isLoading} className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm shadow-xl shadow-red-950/60 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
              {isLoading ? (<>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  <span>Đang đăng nhập...</span>
                </>) : (<span>Đăng Nhập Lịch Trình</span>)}
            </button>
          </form>)}

        {/* FORM ĐĂNG KÝ TÀI XẾ */}
        {activeTab === 'REGISTER' && (<form onSubmit={handleRegister} className="p-6 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Họ và tên tài xế
              </label>
              <input type="text" value={registerName} onChange={(e) => setRegisterName(e.target.value)} placeholder="VD: Vũ Tuấn Anh" required className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"/>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Số điện thoại liên hệ
              </label>
              <input type="tel" value={registerPhone} onChange={(e) => setRegisterPhone(e.target.value)} placeholder="VD: 0988123456" required className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"/>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mật khẩu đăng nhập
              </label>
              <input type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} placeholder="VD: MatKhauCuaToi123" required className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"/>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Biển số xe
                </label>
                <input type="text" value={registerPlate} onChange={(e) => setRegisterPlate(e.target.value)} placeholder="VD: 30K - 999.88" required className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"/>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dòng xe VinFast
                </label>
                <select value={registerCarModel} onChange={(e) => setRegisterCarModel(e.target.value)} className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-red-500 transition-colors">
                  <option value="VinFast Limo Green (VF 8)">VinFast Limo Green (VF 8)</option>
                  <option value="VinFast Limo Green (VF e34)">VinFast Limo Green (VF e34)</option>
                  <option value="VinFast VF 8 Plus Đỏ">VinFast VF 8 Plus</option>
                  <option value="VinFast VF 5 Plus">VinFast VF 5 Plus</option>
                  <option value="VinFast VF 9 Eco">VinFast VF 9</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm shadow-xl shadow-red-950/60 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
              {isLoading ? (<>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  <span>Đang đăng ký tài xế...</span>
                </>) : (<span>Đăng Ký & Vào Lịch Trình</span>)}
            </button>
          </form>)}
      </div>
    </div>);
}
