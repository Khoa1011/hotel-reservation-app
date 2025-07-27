import React from 'react';
import { Calendar, Users, Bed, DollarSign, Settings, Bell } from 'lucide-react';
import MenuItem from './MenuItem';
import { formatCurrency } from '../services/utils';
import RoomManagementTabs from './RoomManagementTabs';

const menuItems = [
  { id: 'bookings', label: 'Đơn Đặt Phòng', icon: Calendar },
  { id: 'rooms', label: 'Quản Lý Phòng', icon: Bed },
  { id: 'guests', label: 'Khách Hàng', icon: Users },
  { id: 'revenue', label: 'Doanh Thu', icon: DollarSign },
  { id: 'reviews', label: 'Đánh Giá', icon: Star }
];

const Sidebar = ({ activeMenu, setActiveMenu, stats }) => {


  const { notifications, fetchHotelNotifications, markHotelAsRead } = useNotifications();

  // Lấy hotel ID hiện tại
  const currentHotelId = localStorage.getItem("selectedHotelId");

  // Fetch notifications khi component mount
  useEffect(() => {
    if (currentHotelId) {
      fetchHotelNotifications(currentHotelId);
    }
  }, [currentHotelId, fetchHotelNotifications]);

  // Handle menu click
  const handleMenuClick = (menuId) => {
    setActiveMenu(menuId);
    
    // Đánh dấu đã đọc nếu click vào bookings
    if (menuId === 'bookings' && currentHotelId) {
      markHotelAsRead(currentHotelId);
    }
  };

  // Lấy số thông báo cho menu bookings
  const getNotificationBadge = (menuId) => {
    if (menuId === 'bookings' && currentHotelId) {
      const hotelNotif = notifications.hotelNotifications[currentHotelId];
      return hotelNotif ? hotelNotif.totalUnread : 0;
    }
    return 0;
  };


  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-gray-800">Quản Lý Khách Sạn</h1>


        {/* Tổng thông báo */}
        {notifications.totalUnread > 0 && (
          <div className="mt-2 flex items-center space-x-2 animate-pulse">
            <Bell className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">
              {notifications.totalUnread} thông báo mới
            </span>
          </div>
        )}

      </div>
      
      <nav className="mt-6">
        {menuItems.map((item) => (
          <MenuItem
            key={item.id}
            item={item}
            isActive={activeMenu === item.id}
            onClick={() => handleMenuClick(item.id)}
            badge={getNotificationBadge(item.id)}
          />
        ))}
      </nav>

      
      
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

      {/* Chi tiết thông báo của hotel hiện tại */}
      {currentHotelId && notifications.hotelNotifications[currentHotelId] && (
        <div className="mt-6 px-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Thông báo
          </h3>
          <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            {(() => {
              const hotelNotif = notifications.hotelNotifications[currentHotelId];
              if (hotelNotif.totalUnread === 0) {
                return (
                  <div className="flex items-center text-xs text-gray-600">
                    <Bell className="h-3 w-3 mr-1" />
                    <span>Không có thông báo mới</span>
                  </div>
                );
              }
              return (
                <div className="space-y-1">
                  <div className="flex items-center text-xs font-medium text-blue-800 mb-1">
                    <Bell className="h-3 w-3 mr-1" />
                    <span>{hotelNotif.totalUnread} thông báo mới</span>
                  </div>
                  {hotelNotif.newBookings > 0 && (
                    <p className="text-xs text-blue-600 pl-4">
                      • {hotelNotif.newBookings} đơn mới (24h)
                    </p>
                  )}
                  {hotelNotif.pendingBookings > 0 && (
                    <p className="text-xs text-blue-600 pl-4">
                      • {hotelNotif.pendingBookings} đơn chờ xử lý
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}


    </div>
  );
};

export default Sidebar;