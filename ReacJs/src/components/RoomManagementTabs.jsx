import React, { useState } from 'react';
import { Home, BedDouble, BarChart3 } from 'lucide-react';
import RoomTypeManagement from '../pages/RoomType/RoomType';
import RoomManagement from '../pages/Room/Rooms';

const RoomManagementTabs = ({ selectedHotelId }) => {
  const [activeTab, setActiveTab] = useState(() => {
    // Load từ localStorage hoặc mặc định 'rooms' (thay đổi từ 'roomTypes')
    const savedTab = localStorage.getItem('roomManagementTab');
    console.log('🏨 Loading saved room tab:', savedTab);
    return savedTab || 'rooms'; // ✅ Mặc định hiển thị tab "Phòng" trước
  });

  const switchTab = (tabName) => {
    console.log('🏨 Switching to room tab:', tabName);
    setActiveTab(tabName);
    localStorage.setItem('roomManagementTab', tabName);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex-shrink-0 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản Lý Phòng Khách Sạn</h1>
          <p className="text-gray-600">Quản lý phòng và loại phòng của khách sạn</p>
          
          {/* Hotel Info */}
          {selectedHotelId ? (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <Home className="inline w-4 h-4 mr-1" />
                Đang quản lý: {localStorage.getItem("selectedHotelName") || "Khách sạn đã chọn"}
              </p>
            </div>
          ) : (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <Home className="inline w-4 h-4 mr-1" />
                Vui lòng chọn khách sạn từ menu bên trái để quản lý
              </p>
            </div>
          )}
        </div>

        {/* Tabs Navigation */}
        <div className="flex-shrink-0 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {/* ✅ SỬA: Đổi thứ tự, đặt "Phòng" trước */}
              <button
                onClick={() => switchTab('rooms')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'rooms'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BedDouble className="w-4 h-4" />
                Tất cả phòng
                {/* ✅ THÊM: Badge hiển thị tổng số phòng nếu có */}
                {selectedHotelId && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                    Tổng quan
                  </span>
                )}
              </button>
              
              <button
                onClick={() => switchTab('roomTypes')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'roomTypes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Home className="w-4 h-4" />
                Loại phòng
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'rooms' ? (
            <RoomManagement selectedHotelId={selectedHotelId} />
          ) : (
            <RoomTypeManagement selectedHotelId={selectedHotelId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomManagementTabs;