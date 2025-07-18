// contexts/NotificationContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from '../utils/axiosConfig';
import { toast } from 'react-toastify';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState({
    totalUnread: 0,
    hotelNotifications: {} // { hotelId: { newBookings, pendingBookings, totalUnread } }
  });

  // Ref để theo dõi thông báo trước đó (để so sánh)
  const prevNotificationsRef = useRef({});
  
  // Ref để theo dõi lần đầu load
  const isFirstLoadRef = useRef(true);

  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  // ✅ Helper function để lấy tên khách sạn
  const getHotelName = (hotelId) => {
    const hotelList = JSON.parse(localStorage.getItem('hotelList') || '[]');
    const hotel = hotelList.find(h => h.id === hotelId);
    return hotel?.name || 'Khách sạn';
  };

  // ✅ Hiển thị toast thông báo
  // const showNotificationToast = (hotelName, notificationData) => {
  //   const { newBookings, pendingBookings, totalUnread } = notificationData;
    
  //   if (totalUnread > 0) {
  //     let message = `🏨 ${hotelName}`;
  //     let details = [];
      
  //     if (newBookings > 0) {
  //       details.push(`${newBookings} đơn mới (24h)`);
  //     }
      
  //     if (pendingBookings > 0) {
  //       details.push(`${pendingBookings} đơn chờ xử lý`);
  //     }
      
  //     if (details.length > 0) {
  //       message += `\n${details.join(' • ')}`;
  //     }
      
  //     toast.info(message, {
  //       position: "top-right",
  //       autoClose: 8000,
  //       hideProgressBar: false,
  //       closeOnClick: true,
  //       pauseOnHover: true,
  //       draggable: true,
  //       style: {
  //         background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  //         color: 'white',
  //         borderRadius: '12px',
  //         boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
  //       }
  //     });
  //   }
  // };

  // Fetch thông báo cho một hotel cụ thể
  const fetchHotelNotifications = async (hotelId) => {
    try {
      const response = await axios.get(`${baseUrl}/api/booking-hotel/hotelowner/notifications/${hotelId}`, {
        withCredentials: true
      });
      
      if (response.data) {
        // Lấy dữ liệu thông báo trước đó
        const prevHotelNotif = prevNotificationsRef.current[hotelId] || { totalUnread: 0 };
        const newHotelNotif = response.data;

        // ✅ HIỂN THỊ TOAST CHỈ KHI CÓ THÔNG BÁO MỚI (không phải lần đầu load)
        if (!isFirstLoadRef.current && newHotelNotif.totalUnread > prevHotelNotif.totalUnread) {
          const hotelName = getHotelName(hotelId);
          // showNotificationToast(hotelName, newHotelNotif);
          
          console.log('🔔 Thông báo mới:', {
            hotel: hotelName,
            previous: prevHotelNotif.totalUnread,
            current: newHotelNotif.totalUnread
          });
        }

        // ✅ FIXED: Cập nhật state với callback function
        setNotifications(prevState => {
          const updatedHotelNotifications = {
            ...prevState.hotelNotifications,
            [hotelId]: newHotelNotif
          };
          
          // Tính tổng thông báo từ tất cả hotels
          const totalUnread = Object.values(updatedHotelNotifications)
            .reduce((sum, hotel) => sum + hotel.totalUnread, 0);
          
          return {
            ...prevState,
            hotelNotifications: updatedHotelNotifications,
            totalUnread
          };
        });
        
        // Cập nhật ref để so sánh lần sau
        prevNotificationsRef.current[hotelId] = newHotelNotif;
      }
    } catch (error) {
      console.error('Error fetching hotel notifications:', error);
    }
  };

  // Fetch thông báo cho tất cả hotels
  const fetchAllNotifications = async (hotelList) => {
    try {
      // ✅ Lưu danh sách khách sạn vào localStorage
      localStorage.setItem('hotelList', JSON.stringify(hotelList));
      
      const promises = hotelList.map(hotel => fetchHotelNotifications(hotel.id));
      await Promise.all(promises);
      
      // Đánh dấu đã load xong lần đầu
      if (isFirstLoadRef.current) {
        isFirstLoadRef.current = false;
        console.log('✅ Hoàn thành load thông báo lần đầu');
      }
    } catch (error) {
      console.error('Error fetching all notifications:', error);
    }
  };

  // Đánh dấu đã đọc cho hotel cụ thể
  const markHotelAsRead = (hotelId) => {
    // ✅ Lưu vào localStorage
    const readNotifs = JSON.parse(localStorage.getItem('readNotifications') || '{}');
    readNotifs[hotelId] = Date.now();
    localStorage.setItem('readNotifications', JSON.stringify(readNotifs));
    
    setNotifications(prev => {
      const updatedHotelNotifications = {
        ...prev.hotelNotifications,
        [hotelId]: {
          ...prev.hotelNotifications[hotelId],
          newBookings: 0,
          pendingBookings: 0,
          totalUnread: 0
        }
      };
      
      const totalUnread = Object.values(updatedHotelNotifications)
        .reduce((sum, hotel) => sum + hotel.totalUnread, 0);
      
      return {
        ...prev,
        hotelNotifications: updatedHotelNotifications,
        totalUnread
      };
    });

    // Cập nhật ref để đồng bộ
    if (prevNotificationsRef.current[hotelId]) {
      prevNotificationsRef.current[hotelId] = {
        ...prevNotificationsRef.current[hotelId],
        totalUnread: 0
      };
    }
  };

  // ✅ AUTO REFRESH - Tự động làm mới thông báo
  useEffect(() => {
    const refreshAllNotifications = () => {
      const hotelIds = Object.keys(notifications.hotelNotifications);
      
      if (hotelIds.length > 0) {
        console.log('🔄 Auto refreshing notifications for hotels:', hotelIds);
        hotelIds.forEach(hotelId => {
          fetchHotelNotifications(hotelId);
        });
      }
    };

    // Tự động refresh mỗi 30 giây
    const interval = setInterval(refreshAllNotifications, 30000);

    return () => {
      console.log('🛑 Clearing notification refresh interval');
      clearInterval(interval);
    };
  }, []); // Chỉ chạy 1 lần khi component mount

  // ✅ REFRESH KHI CÓ HOTEL MỚI
  useEffect(() => {
    const currentHotelId = localStorage.getItem("selectedHotelId");
    if (currentHotelId && !notifications.hotelNotifications[currentHotelId]) {
      console.log('🆕 New hotel detected, fetching notifications:', currentHotelId);
      fetchHotelNotifications(currentHotelId);
    }
  }, [notifications.hotelNotifications]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      fetchHotelNotifications,
      fetchAllNotifications,
      markHotelAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
};