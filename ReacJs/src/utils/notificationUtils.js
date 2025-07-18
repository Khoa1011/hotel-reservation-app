// utils/notificationUtils.js
import { toast } from 'react-toastify';

// ✅ 1. Enhanced Toast Messages Function
export const showNotificationToast = (hotelName, notificationData) => {
  const { newBookings, pendingBookings, totalUnread } = notificationData;
  
  if (totalUnread > 0) {
    let message = `🏨 ${hotelName}`;
    let details = [];
    
    if (newBookings > 0) {
      details.push(`${newBookings} đơn mới`);
    }
    
    if (pendingBookings > 0) {
      details.push(`${pendingBookings} đơn chờ`);
    }
    
    if (details.length > 0) {
      message += `\n${details.join(', ')}`;
    }
    
    toast.info(message, {
      position: "top-right",
      autoClose: 7000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      className: "toast-notification"
    });
  }
};

// ✅ 2. Local Storage Helper để persist notifications
export const NotificationStorage = {
  // Lưu thông báo đã đọc
  setReadNotifications: (hotelId, timestamp) => {
    const readNotifs = JSON.parse(localStorage.getItem('readNotifications') || '{}');
    readNotifs[hotelId] = timestamp;
    localStorage.setItem('readNotifications', JSON.stringify(readNotifs));
  },
  
  // Lấy thông báo đã đọc
  getReadNotifications: (hotelId) => {
    const readNotifs = JSON.parse(localStorage.getItem('readNotifications') || '{}');
    return readNotifs[hotelId] || 0;
  },
  
  // Lưu danh sách khách sạn
  setHotelList: (hotelList) => {
    localStorage.setItem('hotelList', JSON.stringify(hotelList));
  },
  
  // Lấy danh sách khách sạn
  getHotelList: () => {
    return JSON.parse(localStorage.getItem('hotelList') || '[]');
  }
};

// ✅ 3. Toast cho từng loại thông báo
export const showBookingToast = (type, data) => {
  switch (type) {
    case 'NEW_BOOKING':
      toast.success(`🎉 Đơn mới tại ${data.hotelName}!`, {
        position: "top-right",
        autoClose: 5000,
      });
      break;
      
    case 'BOOKING_CONFIRMED':
      toast.info(`✅ Đơn ${data.bookingId} đã được xác nhận`, {
        position: "top-right",
        autoClose: 4000,
      });
      break;
      
    case 'BOOKING_CANCELLED':
      toast.warning(`❌ Đơn ${data.bookingId} đã bị hủy`, {
        position: "top-right",
        autoClose: 4000,
      });
      break;
      
    case 'ROOM_ASSIGNED':
      toast.success(`🏠 Phòng ${data.roomNumber} đã được gán`, {
        position: "top-right",
        autoClose: 4000,
      });
      break;
      
    default:
      toast.info('Có thông báo mới!', {
        position: "top-right",
        autoClose: 3000,
      });
  }
};