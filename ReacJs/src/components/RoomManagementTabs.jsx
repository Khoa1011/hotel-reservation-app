import React, { useState } from 'react';
import { Home, BedDouble } from 'lucide-react';
import RoomTypeManagement from '../pages/RoomType/RoomType';
import RoomManagement from '../pages/Room/Rooms';

const RoomManagementTabs = ({ selectedHotelId }) => {
   const [activeTab, setActiveTab] = useState(() => {
    // ✅ Load từ localStorage hoặc mặc định 'roomTypes'
    const savedTab = localStorage.getItem('roomManagementTab');
    console.log('🏨 Loading saved room tab:', savedTab);
    return savedTab || 'roomTypes';
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản Lý Phòng Khách Sạn</h1>
          <p className="text-gray-600">Quản lý loại phòng và phòng của khách sạn</p>
          
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
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => {
                  console.log('🏨 Switching to room tab:', 'roomTypes');
                  setActiveTab('roomTypes');
                  // ✅ Lưu vào localStorage
                  localStorage.setItem('roomManagementTab', 'roomTypes');
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'roomTypes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Home className="inline-block w-4 h-4 mr-2" />
                Loại Phòng
              </button>
              <button
                onClick={() => {
                  console.log('🏨 Switching to room tab:', 'rooms');
                  setActiveTab('rooms');
                  // ✅ Lưu vào localStorage
                  localStorage.setItem('roomManagementTab', 'rooms');
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'rooms'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BedDouble className="inline-block w-4 h-4 mr-2" />
                Phòng
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'roomTypes' ? (
            <RoomTypeManagement selectedHotelId={selectedHotelId} />
          ) : (
            <RoomManagement selectedHotelId={selectedHotelId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomManagementTabs;