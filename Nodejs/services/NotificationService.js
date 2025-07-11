const moment = require('moment-timezone');
const logger = require('../config/logger');
const FirebaseService = require('./FirebaseService');
const NotificationLog = require('../Model/Notification');
const Booking = require('../Model/Booking/Booking'); // Sử dụng model có sẵn của bạn
const User = require('../Model/User/User');
const Hotel = require('../Model/Hotel/Hotel');
const RoomType = require('../Model/RoomType/RoomType');

class NotificationService {
  constructor() {
    this.timezone = process.env.TIMEZONE || 'Asia/Ho_Chi_Minh';
  }

  /**
   * 🎉 Gửi thông báo đặt phòng thành công (REALTIME)
   */
  async sendBookingSuccessNotification(bookingId) {
    try {
      logger.info(`🎉 Sending booking success notification for: ${bookingId}`);

      const booking = await this.getBookingDetails(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      const notification = {
        title: '🎉 Đặt phòng thành công!',
        body: `Bạn đã đặt phòng ${booking.roomType} tại ${booking.hotelName} thành công. Mã đặt phòng: ${booking.bookingCode}`,
        type: 'dat_phong_thanh_cong'
      };

      const data = {
        bookingId: bookingId.toString(),
        hotelId: booking.maKhachSan.toString(),
        action: 'view_booking',
        screen: 'booking_detail'
      };

      // Gửi notification
      const result = await FirebaseService.sendToUser(
        booking.maNguoiDung._id || booking.maNguoiDung, 
        notification, 
        data
      );

      // Log notification
      await this.logNotification({
        maDatPhong: bookingId,
        maNguoiDung: booking.maNguoiDung,
        loaiThongBao: 'dat_phong_thanh_cong',
        tieuDe: notification.title,
        noiDung: notification.body,
        duLieu: data,
        result: result,
        thongTinThem: {
          ngayNhanPhong: booking.ngayNhanPhong,
          gioNhanPhong: booking.gioNhanPhong,
          tenKhachSan: booking.hotelName,
          loaiPhong: booking.roomType,
          maBooking: booking.bookingCode
        }
      });

      logger.info(`✅ Booking success notification sent successfully`);
      return result;

    } catch (error) {
      logger.error(`❌ Error sending booking success notification:`, error);
      throw error;
    }
  }

  /**
   * ⏰ Lên lịch gửi thông báo trước check-in 1 tiếng
   */
  async scheduleBeforeCheckinNotification(bookingId) {
    try {
      logger.info(`⏰ Scheduling before check-in notification for: ${bookingId}`);

      const booking = await this.getBookingDetails(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Tính thời gian gửi (1 tiếng trước check-in)
      const checkInDateTime = moment.tz(
        `${moment(booking.ngayNhanPhong).format('YYYY-MM-DD')} ${booking.gioNhanPhong}`,
        'YYYY-MM-DD HH:mm',
        this.timezone
      );
      
      const scheduledTime = checkInDateTime.clone().subtract(1, 'hour');

      // Không lên lịch nếu thời gian đã qua
      if (scheduledTime.isBefore(moment())) {
        logger.warn(`⚠️ Schedule time is in the past, skipping: ${scheduledTime.format()}`);
        return null;
      }

      const notification = {
        title: '⏰ Sắp đến giờ nhận phòng!',
        body: `Còn 1 tiếng nữa là đến giờ nhận phòng tại ${booking.hotelName}. Vui lòng chuẩn bị!`,
        type: 'truoc_nhan_phong_1h'
      };

      // Lưu notification log
      const notificationLog = await this.logNotification({
        maDatPhong: bookingId,
        maNguoiDung: booking.maNguoiDung,
        loaiThongBao: 'truoc_nhan_phong_1h',
        tieuDe: notification.title,
        noiDung: notification.body,
        henGio: scheduledTime.toDate(),
        trangThai: 'da_len_lich',
        thongTinThem: {
          ngayNhanPhong: booking.ngayNhanPhong,
          gioNhanPhong: booking.gioNhanPhong,
          tenKhachSan: booking.hotelName,
          loaiPhong: booking.roomType,
          maBooking: booking.bookingCode
        }
      });

      logger.info(`✅ Before check-in notification scheduled for: ${scheduledTime.format()}`);
      return notificationLog;

    } catch (error) {
      logger.error(`❌ Error scheduling before check-in notification:`, error);
      throw error;
    }
  }

  /**
   * 🏨 Lên lịch gửi thông báo đến giờ check-in
   */
  async scheduleCheckinTimeNotification(bookingId) {
    try {
      logger.info(`🏨 Scheduling check-in time notification for: ${bookingId}`);

      const booking = await this.getBookingDetails(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Thời gian check-in chính xác
      const checkInDateTime = moment.tz(
        `${moment(booking.ngayNhanPhong).format('YYYY-MM-DD')} ${booking.gioNhanPhong}`,
        'YYYY-MM-DD HH:mm',
        this.timezone
      );

      // Không lên lịch nếu thời gian đã qua
      if (checkInDateTime.isBefore(moment())) {
        logger.warn(`⚠️ Check-in time is in the past, skipping: ${checkInDateTime.format()}`);
        return null;
      }

      const notification = {
        title: '🏨 Đã đến giờ nhận phòng!',
        body: `Bạn có thể nhận phòng ${booking.roomType} tại ${booking.hotelName} ngay bây giờ!`,
        type: 'den_gio_nhan_phong'
      };

      // Lưu notification log
      const notificationLog = await this.logNotification({
        maDatPhong: bookingId,
        maNguoiDung: booking.maNguoiDung,
        loaiThongBao: 'den_gio_nhan_phong',
        tieuDe: notification.title,
        noiDung: notification.body,
        henGio: checkInDateTime.toDate(),
        trangThai: 'da_len_lich',
        thongTinThem: {
          ngayNhanPhong: booking.ngayNhanPhong,
          gioNhanPhong: booking.gioNhanPhong,
          tenKhachSan: booking.hotelName,
          loaiPhong: booking.roomType,
          maBooking: booking.bookingCode
        }
      });

      logger.info(`✅ Check-in time notification scheduled for: ${checkInDateTime.format()}`);
      return notificationLog;

    } catch (error) {
      logger.error(`❌ Error scheduling check-in time notification:`, error);
      throw error;
    }
  }

  /**
   * ⏰ Lên lịch gửi thông báo trễ check-in 1 tiếng
   */
  async scheduleOverdueCheckinNotification(bookingId) {
    try {
      logger.info(`⏰ Scheduling overdue check-in notification for: ${bookingId}`);

      const booking = await this.getBookingDetails(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Thời gian quá hạn (1 tiếng sau check-in)
      const checkInDateTime = moment.tz(
        `${moment(booking.ngayNhanPhong).format('YYYY-MM-DD')} ${booking.gioNhanPhong}`,
        'YYYY-MM-DD HH:mm',
        this.timezone
      );
      
      const overdueTime = checkInDateTime.clone().add(1, 'hour');

      const notification = {
        title: '⚠️ Quá giờ nhận phòng!',
        body: `Bạn đã quá giờ nhận phòng tại ${booking.hotelName} 1 tiếng. Vui lòng liên hệ khách sạn!`,
        type: 'tre_nhan_phong_1h'
      };

      // Lưu notification log
      const notificationLog = await this.logNotification({
        maDatPhong: bookingId,
        maNguoiDung: booking.maNguoiDung,
        loaiThongBao: 'tre_nhan_phong_1h',
        tieuDe: notification.title,
        noiDung: notification.body,
        henGio: overdueTime.toDate(),
        trangThai: 'da_len_lich',
        thongTinThem: {
          ngayNhanPhong: booking.ngayNhanPhong,
          gioNhanPhong: booking.gioNhanPhong,
          tenKhachSan: booking.hotelName,
          loaiPhong: booking.roomType,
          maBooking: booking.bookingCode
        }
      });

      logger.info(`✅ Overdue check-in notification scheduled for: ${overdueTime.format()}`);
      return notificationLog;

    } catch (error) {
      logger.error(`❌ Error scheduling overdue check-in notification:`, error);
      throw error;
    }
  }

  /**
   * 📊 Lên lịch tất cả notifications cho một booking
   */
  async scheduleAllNotifications(bookingId) {
    try {
      logger.info(`📊 Scheduling all notifications for booking: ${bookingId}`);

      const results = await Promise.allSettled([
        this.scheduleBeforeCheckinNotification(bookingId),
        this.scheduleCheckinTimeNotification(bookingId),
        this.scheduleOverdueCheckinNotification(bookingId)
      ]);

      const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
      const failureCount = results.filter(r => r.status === 'rejected').length;

      logger.info(`✅ Scheduled ${successCount} notifications, ${failureCount} failed for booking ${bookingId}`);

      return {
        success: successCount > 0,
        successCount,
        failureCount,
        results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
      };

    } catch (error) {
      logger.error(`❌ Error scheduling all notifications:`, error);
      throw error;
    }
  }

  /**
   * 🚀 Gửi notifications đã lên lịch (được gọi bởi cron job)
   */
  async sendScheduledNotifications() {
    try {
      const now = moment().toDate();
      
      // Tìm các notifications cần gửi
      const pendingNotifications = await NotificationLog.find({
        trangThai: 'da_len_lich',
        henGio: { $lte: now }
      }).limit(50); // Giới hạn để tránh overload

      if (pendingNotifications.length === 0) {
        logger.info('📭 No scheduled notifications to send');
        return { processed: 0, success: 0, failed: 0 };
      }

      logger.info(`📬 Processing ${pendingNotifications.length} scheduled notifications`);

      let successCount = 0;
      let failCount = 0;

      for (const notif of pendingNotifications) {
        try {
          // Kiểm tra booking còn hợp lệ không
          const booking = await Booking.findById(notif.maDatPhong);
          if (!booking || booking.trangThai === 'da_huy') {
            notif.trangThai = 'da_huy';
            await notif.save();
            continue;
          }

          const notification = {
            title: notif.tieuDe,
            body: notif.noiDung,
            type: notif.loaiThongBao
          };

          const data = {
            bookingId: notif.maDatPhong.toString(),
            notificationType: notif.loaiThongBao,
            action: 'view_booking',
            screen: 'booking_detail',
            ...notif.duLieu
          };

          // Gửi notification
          const result = await FirebaseService.sendToUser(
            notif.maNguoiDung,
            notification,
            data
          );

          // Cập nhật log
          notif.trangThai = result.success ? 'da_gui' : 'that_bai';
          notif.thoiGianGui = new Date();
          notif.tongSoToken = result.totalTokens;
          notif.soThanhCong = result.successCount;
          notif.soThatBai = result.failureCount;
          
          if (!result.success) {
            notif.soLanThu += 1;
            // Retry sau 5 phút nếu chưa quá 3 lần
            if (notif.soLanThu <= 3) {
              notif.henGio = moment().add(5, 'minutes').toDate();
              notif.trangThai = 'da_len_lich';
            }
          }

          await notif.save();

          if (result.success) {
            successCount++;
            logger.info(`✅ Sent notification: ${notif.loaiThongBao} for booking ${notif.maDatPhong}`);
          } else {
            failCount++;
            logger.warn(`❌ Failed to send notification: ${notif.loaiThongBao} for booking ${notif.maDatPhong}`);
          }

        } catch (error) {
          failCount++;
          logger.error(`❌ Error processing notification ${notif._id}:`, error);
          
          // Mark as failed
          notif.trangThai = 'that_bai';
          notif.soLanThu += 1;
          await notif.save();
        }
      }

      logger.info(`📊 Processed ${pendingNotifications.length} notifications: ${successCount} success, ${failCount} failed`);

      return {
        processed: pendingNotifications.length,
        success: successCount,
        failed: failCount
      };

    } catch (error) {
      logger.error('❌ Error sending scheduled notifications:', error);
      throw error;
    }
  }

  /**
   * 📋 Lấy chi tiết booking với thông tin liên quan
   */
  async getBookingDetails(bookingId) {
    try {
      const booking = await Booking.findById(bookingId)
        .populate('maNguoiDung', 'tenNguoiDung email soDienThoai')
        .populate('maKhachSan', 'tenKhachSan diaChiDayDu soDienThoai')
        .populate('maLoaiPhong', 'tenLoaiPhong')
        .lean();

      if (!booking) {
        return null;
      }

      return {
        ...booking,
        maNguoiDung: booking.maNguoiDung._id || booking.maNguoiDung,
        hotelName: booking.maKhachSan?.tenKhachSan || 'Khách sạn',
        roomType: booking.maLoaiPhong?.tenLoaiPhong || 'Phòng',
        guestName: booking.maNguoiDung?.tenNguoiDung || 'Khách hàng',
        bookingCode: booking._id.toString().slice(-8).toUpperCase()
      };

    } catch (error) {
      logger.error(`❌ Error getting booking details for ${bookingId}:`, error);
      throw error;
    }
  }

  /**
   * 💾 Lưu notification log
   */
  async logNotification(logData) {
    try {
      const log = new NotificationLog({
        maDatPhong: logData.maDatPhong,
        maNguoiDung: logData.maNguoiDung,
        loaiThongBao: logData.loaiThongBao,
        tieuDe: logData.tieuDe,
        noiDung: logData.noiDung,
        duLieu: logData.duLieu || {},
        henGio: logData.henGio,
        thoiGianGui: logData.result ? new Date() : undefined,
        trangThai: logData.trangThai || (logData.result ? 'da_gui' : 'da_len_lich'),
        tongSoToken: logData.result?.totalTokens || 0,
        soThanhCong: logData.result?.successCount || 0,
        soThatBai: logData.result?.failureCount || 0,
        thongTinThem: logData.thongTinThem || {}
      });

      return await log.save();
    } catch (error) {
      // Nếu duplicate (booking + type), chỉ log warning
      if (error.code === 11000) {
        logger.warn(`⚠️ Notification already exists: ${logData.loaiThongBao} for booking ${logData.maDatPhong}`);
        return null;
      }
      throw error;
    }
  }

  /**
   * 🗑️ Cleanup old logs (chạy hàng ngày)
   */
  async cleanupOldLogs() {
    try {
      const cutoffDate = moment().subtract(30, 'days').toDate();
      
      const result = await NotificationLog.deleteMany({
        createdAt: { $lt: cutoffDate },
        trangThai: { $in: ['da_gui', 'that_bai', 'da_huy'] }
      });

      logger.info(`🗑️ Cleaned up ${result.deletedCount} old notification logs`);
      return result.deletedCount;
    } catch (error) {
      logger.error('❌ Error cleaning up old logs:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();