import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Phone, Calendar, MapPin } from 'lucide-react';
import '../index.css';
const baseUrl = import.meta.env.VITE_API_BASE_URL;
import { toast } from 'react-toastify';
import HotelPartnerForm from './HotelPartnerForm';

const AuthPage = () => {
    const [activeTab, setActiveTab] = useState('login');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phone: '',
        dateOfBirth: '',
        address: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (activeTab === 'login') {
            try {
                const response = await fetch(`${baseUrl}/api/user-hotel/hotelowner/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        matKhau: formData.password
                    }),
                    credentials: 'include'
                });

                const data = await response.json();

                if (!data.msgError && data.token) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));

                    toast.success('Đăng nhập thành công!');
                    if (data.user.role === 'chuKhachSan') {
                        window.location.href = '/homepage';
                    } else {
                        window.location.href = '/admin-hotel';
                    }
                } else {
                    toast.error(data.msgBody);
                }
            } catch (error) {
                console.error('Lỗi đăng nhập:', error);
                toast.error('Có lỗi xảy ra khi đăng nhập!');
            }
        } else if (activeTab === 'register') {
            if (formData.password !== formData.confirmPassword) {
                toast.error('Mật khẩu xác nhận không khớp!');
                return;
            }
            console.log('Đăng ký user:', formData);
            toast.success('Đăng ký thành công!');
        }
    };

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            fullName: '',
            phone: '',
            dateOfBirth: '',
            address: ''
        });
    };

    const renderTabContent = () => {
        if (activeTab === 'hotel-register') {
            return <HotelPartnerForm onBackToLogin={() => setActiveTab('login')} />;
        }

        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                {activeTab === 'register' && (
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Họ và tên"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            required={activeTab === 'register'}
                        />
                    </div>
                )}

                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                    />
                </div>

                {activeTab === 'register' && (
                    <>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="tel"
                                name="phone"
                                placeholder="Số điện thoại"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                required
                            />
                        </div>

                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="date"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleInputChange}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                required
                            />
                        </div>

                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                name="address"
                                placeholder="Địa chỉ"
                                value={formData.address}
                                onChange={handleInputChange}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                required
                            />
                        </div>
                    </>
                )}

                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Mật khẩu"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>

                {activeTab === 'register' && (
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            placeholder="Xác nhận mật khẩu"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                )}

                {activeTab === 'login' && (
                    <div className="text-right">
                        <button
                            type="button"
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200"
                        >
                            Quên mật khẩu?
                        </button>
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                    {activeTab === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                </button>
            </form>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 transform rotate-12 scale-150"></div>
            </div>

            <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-lg">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4 shadow-lg">
                            <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center">
                                <div className="w-4 h-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-sm"></div>
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Staytion</h1>
                        <p className="text-gray-600">
                            {activeTab === 'login' && 'Chào mừng trở lại!'}
                            {activeTab === 'register' && 'Tạo tài khoản mới'}
                            {activeTab === 'hotel-register' && 'Đăng ký trở thành đối tác'}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => {
                                    setActiveTab('login');
                                    resetForm();
                                }}
                                className={`flex-1 py-2 px-3 rounded-md font-medium transition-all duration-200 text-sm ${activeTab === 'login'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Đăng nhập
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('register');
                                    resetForm();
                                }}
                                className={`flex-1 py-2 px-3 rounded-md font-medium transition-all duration-200 text-sm ${activeTab === 'register'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Đăng ký
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('hotel-register');
                                    resetForm();
                                }}
                                className={`flex-1 py-2 px-3 rounded-md font-medium transition-all duration-200 text-sm ${activeTab === 'hotel-register'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Đối tác
                            </button>
                        </div>

                        {renderTabContent()}

                        {activeTab !== 'hotel-register' && (
                            <>
                                <div className="my-6 flex items-center">
                                    <div className="flex-1 border-t border-gray-200"></div>
                                    <span className="px-4 text-gray-500 text-sm">Hoặc</span>
                                    <div className="flex-1 border-t border-gray-200"></div>
                                </div>

                                <div className="space-y-3">
                                    <button className="w-full flex items-center justify-center py-3 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                                        <div className="w-5 h-5 mr-3">
                                            <svg viewBox="0 0 24 24" width="20" height="20">
                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                        </div>
                                        Tiếp tục với Google
                                    </button>

                                    <button className="w-full flex items-center justify-center py-3 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                                        <div className="w-5 h-5 mr-3">
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2">
                                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                            </svg>
                                        </div>
                                        Tiếp tục với Facebook
                                    </button>
                                </div>

                                <div className="mt-6 text-center">
                                    <span className="text-gray-600">
                                        {activeTab === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveTab(activeTab === 'login' ? 'register' : 'login');
                                            resetForm();
                                        }}
                                        className="ml-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                                    >
                                        {activeTab === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="text-center mt-8 text-sm text-gray-500">
                        Bằng việc đăng ký, bạn đồng ý với{' '}
                        <button className="text-blue-600 hover:text-blue-700 transition-colors duration-200">
                            Điều khoản dịch vụ
                        </button>
                        {' '}và{' '}
                        <button className="text-blue-600 hover:text-blue-700 transition-colors duration-200">
                            Chính sách bảo mật
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;