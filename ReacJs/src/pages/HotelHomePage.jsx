import React, { useState, useEffect, useCallback } from 'react';
import Booking from './Booking/Bookings';
import Rooms from './Room/Rooms';
import { rooms, stats } from '../services/dataTest';
import {
    Calendar,
    CalendarCheck,
    Users,
    Bed,
    DollarSign,
    Settings,
    Bell,
    ChevronDown,
    ChevronRight,
    Eye,
    User,
    Phone,
    Mail,
    MapPin,
    CreditCard,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import Cookies from 'js-cookie';
import axios from '../utils/axiosConfig';
import moment from 'moment-timezone';
import { toast } from 'react-toastify';
import RoomManagementTabs from '../components/RoomManagementTabs';
import HotelSelector from '../components/HotelSelector'; // Import component mới

const HotelManagement = () => {
    const [activeMenu, setActiveMenu] = useState(() => {
        // ✅ Load từ localStorage hoặc mặc định 'bookings'
        const savedMenu = localStorage.getItem('activeMenu');
        console.log('🏨 Loading saved menu:', savedMenu);
        return savedMenu || 'bookings';
    });
    const [bookings, setBookings] = useState([]);
    const [expandedBooking, setExpandedBooking] = useState(null);
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem('token');
    const [error, setError] = useState(null);

    // State cho hotel selector - ✅ Initialize từ localStorage
    const [selectedHotelId, setSelectedHotelId] = useState(() => {
        const saved = localStorage.getItem("selectedHotelId") || '';
        console.log('🏨 HotelManagement: Initializing selectedHotelId with:', saved);
        return saved;
    });
    const [selectedHotelName, setSelectedHotelName] = useState(() => {
        const saved = localStorage.getItem("selectedHotelName") || '';
        console.log('🏨 HotelManagement: Initializing selectedHotelName with:', saved);
        return saved;
    });

    const menuItems = [
        { id: 'bookings', label: 'Đơn Đặt Phòng', icon: Calendar },
        { id: 'rooms', label: 'Quản Lý Phòng', icon: Bed },
        { id: 'guests', label: 'Khách Hàng', icon: Users },
        { id: 'revenue', label: 'Doanh Thu', icon: DollarSign },
        { id: 'notifications', label: 'Thông Báo', icon: Bell },
        { id: 'settings', label: 'Cài Đặt', icon: Settings }
    ];

    // Handle hotel selection change
    const handleHotelChange = (hotelId, hotelName) => {
        setSelectedHotelId(hotelId);
        setSelectedHotelName(hotelName);

        // Có thể trigger refresh data cho menu hiện tại
        console.log('Selected hotel changed:', hotelId, hotelName);

        // Nếu đang ở tab bookings, có thể filter lại
        if (activeMenu === 'bookings') {
            // Có thể gọi function để filter bookings theo hotel
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'text-green-600 bg-green-100';
            case 'pending': return 'text-yellow-600 bg-yellow-100';
            case 'cancelled': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'confirmed': return 'Đã xác nhận';
            case 'pending': return 'Chờ xác nhận';
            case 'cancelled': return 'Đã hủy';
            default: return 'Không xác định';
        }
    };

    const getRoomStatusColor = (status) => {
        switch (status) {
            case 'available': return 'text-green-600 bg-green-100';
            case 'occupied': return 'text-blue-600 bg-blue-100';
            case 'reserved': return 'text-orange-600 bg-orange-100';
            case 'maintenance': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getRoomStatusText = (status) => {
        switch (status) {
            case 'available': return 'Trống';
            case 'occupied': return 'Có khách';
            case 'reserved': return 'Đã đặt';
            case 'maintenance': return 'Bảo trì';
            default: return 'Không xác định';
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return moment(dateString)
            .tz('Asia/Ho_Chi_Minh')
            .format('HH:mm DD/MM/YYYY');
    };

    // Fetch bookings khi component mount
    const fetchBookings = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!token) {
                toast.error('Không tìm thấy token. Vui lòng đăng nhập lại.');
                return;
            }
            const response = await axios.get(`${baseUrl}/api/booking-hotel/hotelowner/bookings`, {
                withCredentials: true
            });
            if (response.status === 404) {
                toast.error('Chưa có khách sạn nào');
                window.location.href = '/';
                return;
            }
            setBookings(response.data);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách đặt phòng:', error.response?.data || error.message);
            console.error('Kiểm tra token trong homepage:', token);
            setError('Không thể lấy danh sách đặt phòng. Vui lòng thử lại.');
            toast.error('Không thể lấy danh sách đặt phòng. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
        // ✅ Bỏ phần load saved hotel selection vì đã có trong useState
    }, []);

    const renderRooms = () => {
        if (rooms && rooms.length > 0) {
            return (
                <Rooms
                    rooms={rooms}
                    getRoomStatusColor={getRoomStatusColor}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                    getRoomStatusText={getRoomStatusText}
                />
            );
        } else {
            return (
                <div className="text-center py-12">
                    <Bed className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600">Quản lý phòng</h3>
                    <p className="text-gray-500 mt-2">Không có phòng</p>
                </div>
            );
        }
    };

    const renderBookings = () => {
        if (loading) {
            return (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Đang tải...</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="text-center py-12">
                    <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600">Lỗi</h3>
                    <p className="text-gray-500 mt-2">{error}</p>
                </div>
            );
        }
        return (
            <Booking
                bookings={bookings}
                setBookings={setBookings}
                expandedBooking={expandedBooking}
                setExpandedBooking={setExpandedBooking}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
                selectedHotelId={selectedHotelId}
            />
        );
    };

    const renderDashboard = () => {
        switch (activeMenu) {
            case 'bookings':
                return renderBookings();
            case 'rooms':
                console.log('🏨 About to render RoomManagementTabs');
                console.log('🏨 Current selectedHotelId state:', selectedHotelId);
                console.log('🏨 selectedHotelId type:', typeof selectedHotelId);
                return <RoomManagementTabs selectedHotelId={selectedHotelId} />;
            case 'guests':
                return (
                    <div className="text-center py-12">
                        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600">Quản Lý Khách Hàng</h3>
                        <p className="text-gray-500 mt-2">Tính năng đang được phát triển...</p>
                        {selectedHotelName && (
                            <p className="text-blue-600 mt-2">Khách sạn: {selectedHotelName}</p>
                        )}
                    </div>
                );
            case 'revenue':
                return (
                    <div className="text-center py-12">
                        <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600">Báo Cáo Doanh Thu</h3>
                        <p className="text-gray-500 mt-2">Tính năng đang được phát triển...</p>
                        {selectedHotelName && (
                            <p className="text-blue-600 mt-2">Khách sạn: {selectedHotelName}</p>
                        )}
                    </div>
                );
            case 'notifications':
                return (
                    <div className="text-center py-12">
                        <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600">Thông Báo</h3>
                        <p className="text-gray-500 mt-2">Không có thông báo mới</p>
                        {selectedHotelName && (
                            <p className="text-blue-600 mt-2">Khách sạn: {selectedHotelName}</p>
                        )}
                    </div>
                );
            case 'settings':
                return (
                    <div className="text-center py-12">
                        <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600">Cài Đặt</h3>
                        <p className="text-gray-500 mt-2">Tính năng đang được phát triển...</p>
                        {selectedHotelName && (
                            <p className="text-blue-600 mt-2">Khách sạn: {selectedHotelName}</p>
                        )}
                    </div>
                );
            default:
                return renderBookings();
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-lg flex flex-col h-full">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold text-gray-800">Quản Lý Khách Sạn</h1>
                </div>

                {/* Hotel Selector */}
                <div className="p-6 border-b">
                    <HotelSelector
                        bookings={bookings}
                        onHotelChange={handleHotelChange}
                        selectedHotelId={selectedHotelId}
                    />
                </div>

                <nav className="mt-6">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    console.log('🏨 Switching to menu:', item.id);
                                    setActiveMenu(item.id);
                                    // ✅ Lưu vào localStorage
                                    localStorage.setItem('activeMenu', item.id);
                                }}
                                className={`w-full flex items-center px-6 py-3 text-left hover:bg-blue-50 hover:text-blue-600 transition-colors ${activeMenu === item.id ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'text-gray-700'
                                    }`}
                            >
                                <Icon className="h-5 w-5 mr-3" />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Stats trong sidebar */}
                {/* <div className="mt-8 px-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Thống kê hôm nay</h3>
                    <div className="mt-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Check-in:</span>
                            <span className="font-semibold text-green-600">{stats.checkInsToday}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Check-out:</span>
                            <span className="font-semibold text-blue-600">{stats.checkOutsToday}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Phòng trống:</span>
                            <span className="font-semibold text-yellow-600">{stats.availableRooms}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Doanh thu:</span>
                            <span className="font-semibold text-purple-600">{formatCurrency(stats.todayRevenue)}</span>
                        </div>
                    </div>
                </div> */}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden"> {/* ✅ FIX: Proper flex container */}
                <div className="flex-1 overflow-y-auto"> {/* ✅ Single scrollable area */}
                    <div className="p-6 h-full"> {/* ✅ Remove max-width constraint */}
                        {renderDashboard()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HotelManagement;