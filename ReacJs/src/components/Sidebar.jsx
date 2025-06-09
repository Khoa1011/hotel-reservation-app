import React from 'react';
import { Calendar, Users, Bed, DollarSign, Settings, Bell } from 'lucide-react';
import MenuItem from './MenuItem';
import { formatCurrency } from '../services/utils';

const menuItems = [
  { id: 'bookings', label: 'Đơn Đặt Phòng', icon: Calendar },
  { id: 'rooms', label: 'Quản Lý Phòng', icon: Bed },
  { id: 'guests', label: 'Khách Hàng', icon: Users },
  { id: 'revenue', label: 'Doanh Thu', icon: DollarSign },
  { id: 'notifications', label: 'Thông Báo', icon: Bell },
  { id: 'settings', label: 'Cài Đặt', icon: Settings }
];

const Sidebar = ({ activeMenu, setActiveMenu, stats }) => {
  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-gray-800">Quản Lý Khách Sạn</h1>
        <p className="text-sm text-gray-600">Hotel Paradise</p>
      </div>
      
      <nav className="mt-6">
        {menuItems.map((item) => (
          <MenuItem
            key={item.id}
            item={item}
            isActive={activeMenu === item.id}
            onClick={() => setActiveMenu(item.id)}
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
    </div>
  );
};

export default Sidebar;