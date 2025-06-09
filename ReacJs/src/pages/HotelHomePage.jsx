import React, { useState } from 'react';
import Booking from './Bookings';
import Rooms from './Rooms';
import { bookings, rooms, stats } from '../services/dataTest';
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
import Room from './Rooms';


const HotelManagement = () => {
    const [activeMenu, setActiveMenu] = useState('bookings');
    const [expandedBooking, setExpandedBooking] = useState(null);


    const menuItems = [
        { id: 'bookings', label: 'Đơn Đặt Phòng', icon: Calendar },
        { id: 'rooms', label: 'Quản Lý Phòng', icon: Bed },
        { id: 'guests', label: 'Khách Hàng', icon: Users },
        { id: 'revenue', label: 'Doanh Thu', icon: DollarSign },
        { id: 'notifications', label: 'Thông Báo', icon: Bell },
        { id: 'settings', label: 'Cài Đặt', icon: Settings }
    ];

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
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    //   const renderBookings = () => (
    //     <div className="space-y-4">
    //       <div className="flex justify-between items-center">
    //         <h2 className="text-2xl font-bold text-gray-800">Đơn Đặt Phòng</h2>
    //         <div className="flex space-x-2">
    //           <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
    //             Đơn mới
    //           </button>
    //           <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
    //             Lọc
    //           </button>
    //         </div>
    //       </div>

    //       <div className="bg-white rounded-lg shadow">
    //         {bookings.map((booking) => (
    //           <div key={booking.id} className="border-b border-gray-200 last:border-b-0">
    //             <div 
    //               className="p-4 hover:bg-gray-50 cursor-pointer"
    //               onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
    //             >
    //               <div className="flex items-center justify-between">
    //                 <div className="flex items-center space-x-4">
    //                   <div className="flex items-center">
    //                     {expandedBooking === booking.id ? 
    //                       <ChevronDown className="h-5 w-5 text-gray-400" /> : 
    //                       <ChevronRight className="h-5 w-5 text-gray-400" />
    //                     }
    //                   </div>
    //                   <div>
    //                     <h3 className="font-semibold text-gray-800">{booking.guestName}</h3>
    //                     <p className="text-sm text-gray-600">Mã: {booking.id}</p>
    //                   </div>
    //                   <div>
    //                     <p className="text-sm font-medium">{booking.roomType}</p>
    //                     <p className="text-sm text-gray-600">Phòng {booking.roomNumber}</p>
    //                   </div>
    //                   <div>
    //                     <p className="text-sm font-medium">{formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</p>
    //                     <p className="text-sm text-gray-600">{booking.nights} đêm • {booking.guests} khách</p>
    //                   </div>
    //                 </div>
    //                 <div className="flex items-center space-x-4">
    //                   <div className="text-right">
    //                     <p className="font-bold text-lg">{formatCurrency(booking.totalAmount)}</p>
    //                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
    //                       {getStatusText(booking.status)}
    //                     </span>
    //                   </div>
    //                 </div>
    //               </div>
    //             </div>

    //             {expandedBooking === booking.id && (
    //               <div className="px-4 pb-4 bg-gray-50 border-t">
    //                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
    //                   <div className="space-y-4">
    //                     <h4 className="font-semibold text-gray-800 flex items-center">
    //                       <User className="h-4 w-4 mr-2" />
    //                       Thông tin khách hàng
    //                     </h4>
    //                     <div className="space-y-2 text-sm">
    //                       <div className="flex items-center">
    //                         <Mail className="h-4 w-4 mr-2 text-gray-400" />
    //                         <span>{booking.email}</span>
    //                       </div>
    //                       <div className="flex items-center">
    //                         <Phone className="h-4 w-4 mr-2 text-gray-400" />
    //                         <span>{booking.phone}</span>
    //                       </div>
    //                     </div>

    //                     <h4 className="font-semibold text-gray-800 flex items-center mt-4">
    //                       <Bed className="h-4 w-4 mr-2" />
    //                       Yêu cầu đặc biệt
    //                     </h4>
    //                     <p className="text-sm text-gray-600">{booking.specialRequests}</p>
    //                   </div>

    //                   <div className="space-y-4">
    //                     <h4 className="font-semibold text-gray-800 flex items-center">
    //                       <CreditCard className="h-4 w-4 mr-2" />
    //                       Thông tin thanh toán
    //                     </h4>
    //                     <div className="space-y-2 text-sm">
    //                       <div className="flex justify-between">
    //                         <span>Phương thức:</span>
    //                         <span className="font-medium">{booking.paymentMethod}</span>
    //                       </div>
    //                       <div className="flex justify-between">
    //                         <span>Trạng thái:</span>
    //                         <span className={`font-medium ${booking.paymentStatus === 'Đã thanh toán' ? 'text-green-600' : 'text-yellow-600'}`}>
    //                           {booking.paymentStatus}
    //                         </span>
    //                       </div>
    //                       <div className="flex justify-between">
    //                         <span>Ngày đặt:</span>
    //                         <span>{formatDate(booking.bookingDate)}</span>
    //                       </div>
    //                     </div>

    //                     <div className="flex space-x-2 mt-4">
    //                       <button className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">
    //                         Xác nhận
    //                       </button>
    //                       <button className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700">
    //                         Hủy đơn
    //                       </button>
    //                       <button className="px-3 py-2 border border-gray-300 text-sm rounded hover:bg-gray-50">
    //                         <Eye className="h-4 w-4" />
    //                       </button>
    //                     </div>
    //                   </div>
    //                 </div>
    //               </div>
    //             )}
    //           </div>
    //         ))}
    //       </div>
    //     </div>
    //   );

   const renderRooms = () =>{
    if(rooms && rooms.length > 0){getRoomStatusColor, getRoomStatusText, formatCurrency, formatDate
        return (
            <Rooms
                rooms= {rooms}
                getRoomStatusColor={getRoomStatusColor}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                getRoomStatusText={getRoomStatusText} />
        );
    }else{
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
        if (bookings && bookings.length > 0) {
            return (
                <Booking
                    bookings={bookings}
                    expandedBooking={expandedBooking}
                    setExpandedBooking={setExpandedBooking}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                    getStatusColor={getStatusColor}
                    getStatusText={getStatusText}
                />
            );
        }else{
            return (
                    <div className="text-center py-12">
                        <CalendarCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600">Đơn đặt phòng</h3>
                        <p className="text-gray-500 mt-2">Chưa có đơn đặt nào</p>
                    </div>
                );
        }

    };


    const renderDashboard = () => {
        switch (activeMenu) {
            case 'bookings':
                return renderBookings();
            case 'rooms':
                return renderRooms();
            case 'guests':
                return (
                    <div className="text-center py-12">
                        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600">Quản Lý Khách Hàng</h3>
                        <p className="text-gray-500 mt-2">Tính năng đang được phát triển...</p>
                    </div>
                );
            case 'revenue':
                return (
                    <div className="text-center py-12">
                        <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600">Báo Cáo Doanh Thu</h3>
                        <p className="text-gray-500 mt-2">Tính năng đang được phát triển...</p>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="text-center py-12">
                        <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600">Thông Báo</h3>
                        <p className="text-gray-500 mt-2">Không có thông báo mới</p>
                    </div>
                );
            case 'settings':
                return (
                    <div className="text-center py-12">
                        <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600">Cài Đặt</h3>
                        <p className="text-gray-500 mt-2">Tính năng đang được phát triển...</p>
                    </div>
                );
            default:
                return renderBookings();
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-lg">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold text-gray-800">Quản Lý Khách Sạn</h1>
                    <p className="text-sm text-gray-600">Hotel Paradise</p>
                </div>

                <nav className="mt-6">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveMenu(item.id)}
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
                <div className="mt-8 px-6">
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
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="p-6">
                    {renderDashboard()}
                </div>
            </div>
        </div>
    );
};

export default HotelManagement;