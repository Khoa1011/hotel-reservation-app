import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Building, Bell } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

const HotelSelector = ({ hotels = [],bookings = [], onHotelChange, selectedHotelId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, markHotelAsRead } = useNotifications();

  // ✅ Thêm ref để prevent multiple triggers
  const hasTriggeredInitialLoad = useRef(false);

  // Tạo danh sách hotel từ bookings
const getAllHotels = () => {
    console.log('🏨 HotelSelector: hotels prop:', hotels);
    console.log('🏨 HotelSelector: bookings prop:', bookings);
    
    // ✅ Ưu tiên dùng hotels API nếu có
    if (hotels && Array.isArray(hotels) && hotels.length > 0) {
      return hotels.map(h => ({
        id: h.hotelId || h._id,
        name: h.tenKhachSan,
        notifications: notifications.hotelNotifications[h.hotelId || h._id] || { 
          newBookings: 0, 
          pendingBookings: 0, 
          totalUnread: 0 
        }
      }));
    }
    
    // ✅ Fallback về bookings với safety check
    if (!Array.isArray(bookings)) {
      console.log('⚠️ No valid data for hotels');
      return [];
    }
    
    const allHotels = Array.from(
      new Map(bookings.map(b => [b.hotelId?._id, b.hotelId?.tenKhachSan])).entries()
    ).map(([id, name]) => ({
      id,
      name,
      notifications: notifications.hotelNotifications[id] || { 
        newBookings: 0, 
        pendingBookings: 0, 
        totalUnread: 0 
      }
    })).filter(hotel => hotel.id && hotel.name);

    return allHotels;
  };

  const hotelList = getAllHotels();
  const selectedHotel = hotelList.find(h => h.id === selectedHotelId);

  // ✅ Helper function để truncate text dài
  const truncateText = (text, maxLength = 25) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Handle hotel selection
  const handleHotelSelect = (hotelId, hotelName) => {
    console.log('🏨 HotelSelector: handleHotelSelect called:', { hotelId, hotelName });

    // Lưu vào localStorage
    if (hotelId) {
      localStorage.setItem("selectedHotelId", hotelId);
      localStorage.setItem("selectedHotelName", hotelName);

      // Đánh dấu hotel đã đọc khi chọn
      markHotelAsRead(hotelId);
    } else {
      localStorage.removeItem("selectedHotelId");
      localStorage.removeItem("selectedHotelName");
    }

    // Callback để parent component xử lý
    if (onHotelChange) {
      onHotelChange(hotelId, hotelName);
    }

    setIsOpen(false);
  };

  // ✅ Load selected hotel từ localStorage khi component mount (chỉ 1 lần)
  useEffect(() => {
    // Skip nếu đã trigger rồi hoặc đã có selectedHotelId
    if (hasTriggeredInitialLoad.current || selectedHotelId) {
      return;
    }

    const savedHotelId = localStorage.getItem("selectedHotelId");
    const savedHotelName = localStorage.getItem("selectedHotelName");

    console.log('🏨 HotelSelector initial load:', { savedHotelId, savedHotelName });

    // ✅ Chỉ trigger nếu có data và onHotelChange
    if (savedHotelId && savedHotelName && onHotelChange) {
      console.log('🏨 Triggering initial onHotelChange');
      hasTriggeredInitialLoad.current = true;
      onHotelChange(savedHotelId, savedHotelName);
    }
  }, [onHotelChange]); // Chỉ depend on onHotelChange

  return (
    <div className="relative">
      {/* Hotel Selector Dropdown */}
      <div className="mb-0">
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Khách sạn hiện tại
        </label>

        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors min-h-[48px]"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Building className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate" title={selectedHotel?.name || 'Chọn khách sạn'}> {/* ✅ THÊM truncate + title */}
                  {selectedHotel ? selectedHotel.name : 'Chọn khách sạn để bắt đầu'}
                </p>
                {selectedHotel && selectedHotel.notifications.totalUnread > 0 && (
                  <p className="text-xs text-blue-600 truncate">
                    {selectedHotel.notifications.totalUnread} thông báo mới
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              {selectedHotel && selectedHotel.notifications.totalUnread > 0 && (
                <div className="flex items-center">
                  <Bell className="h-3 w-3 text-blue-500" />
                  <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {selectedHotel.notifications.totalUnread}
                  </span>
                </div>
              )}
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Dropdown Menu  */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
              {/* Option: Tất cả khách sạn */}
              <button
                onClick={() => handleHotelSelect('', 'Tất cả khách sạn')}
                className={`w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 border-b border-gray-100 min-h-[48px] ${!selectedHotelId ? 'bg-blue-50 text-blue-600' : ''
                  }`}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <Building className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">Tất cả khách sạn</span>
                </div>
              </button>

              {/* Hotel Options */}
              {hotelList.map((hotel) => (
                <button
                  key={hotel.id}
                  onClick={() => handleHotelSelect(hotel.id, hotel.name)}
                  className={`w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 min-h-[48px] ${selectedHotelId === hotel.id ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Building className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-sm font-medium truncate block"
                        title={hotel.name}
                      >
                        {hotel.name}
                      </span>
                      {hotel.notifications.totalUnread > 0 && (
                        <p className="text-xs text-blue-600 truncate">
                          {hotel.notifications.pendingBookings > 0 && `${hotel.notifications.pendingBookings} đơn chờ`}
                          {hotel.notifications.newBookings > 0 && ` • ${hotel.notifications.newBookings} đơn mới`}
                        </p>
                      )}
                    </div>
                  </div>

                  {hotel.notifications.totalUnread > 0 && (
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <Bell className="h-3 w-3 text-blue-500" />
                      <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                        {hotel.notifications.totalUnread}
                      </span>
                    </div>
                  )}
                </button>
              ))}

              {hotelList.length === 0 && (
                <div className="p-3 text-center text-gray-500 text-sm">
                  Chưa có khách sạn nào
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hotel Details*/}
        {selectedHotel && (
          <div className="mt-1 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm">
              {selectedHotel.notifications.totalUnread === 0 ? (
                <div className="flex items-center text-gray-600">
                  <Bell className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">Không có thông báo mới</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-medium text-blue-800 flex items-center">
                    <Bell className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{selectedHotel.notifications.totalUnread} thông báo mới</span>
                  </p>
                  {selectedHotel.notifications.newBookings > 0 && (
                    <p className="text-blue-600 text-xs pl-4 truncate">
                      • {selectedHotel.notifications.newBookings} đơn mới (24h)
                    </p>
                  )}
                  {selectedHotel.notifications.pendingBookings > 0 && (
                    <p className="text-blue-600 text-xs pl-4 truncate">
                      • {selectedHotel.notifications.pendingBookings} đơn chờ xử lý
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelSelector;