const express = require('express');
const router = express.Router();
const logger = require('../config/logger');
const FirebaseService = require('../services/FirebaseService');
const NotificationService = require('../services/NotificationService');
const UserDevice = require('../Model/User/UserDevice');
const NotificationLog = require('../Model/Notification');
const mongoose = require('mongoose');

/**
* 📱 Đăng ký FCM token cho user
* POST /api/notification/register-token
*/
router.post('/register-token', async (req, res) => {
 try {
   const { userId, fcmToken, deviceInfo } = req.body;

   if (!userId || !fcmToken) {
     return res.status(400).json({
       success: false,
       message: 'userId và fcmToken là bắt buộc'
     });
   }

   logger.info(`📱 Registering FCM token for user: ${userId}`);

   const result = await FirebaseService.registerToken(userId, fcmToken, deviceInfo);

   res.status(200).json({
     success: true,
     message: 'FCM token đã được đăng ký thành công',
     data: {
       deviceId: result._id,
       userId: result.maNguoiDung,
       deviceType: result.loaiThietBi,
       registeredAt: result.ngayDangKy
     }
   });

 } catch (error) {
   logger.error('❌ Error registering FCM token:', error);
   res.status(500).json({
     success: false,
     message: 'Lỗi khi đăng ký FCM token',
     error: error.message
   });
 }
});

/**
* 🗑️ Hủy đăng ký FCM token
* POST /api/notification/unregister-token
*/
router.post('/unregister-token', async (req, res) => {
 try {
   const { fcmToken } = req.body;

   if (!fcmToken) {
     return res.status(400).json({
       success: false,
       message: 'fcmToken là bắt buộc'
     });
   }

   const result = await FirebaseService.unregisterToken(fcmToken);

   res.status(200).json({
     success: true,
     message: 'FCM token đã được hủy đăng ký',
     data: result
   });

 } catch (error) {
   logger.error('❌ Error unregistering FCM token:', error);
   res.status(500).json({
     success: false,
     message: 'Lỗi khi hủy đăng ký FCM token',
     error: error.message
   });
 }
});

/**
* 🧪 Test gửi notification
* POST /api/notification/test-send
*/
router.post('/test-send', async (req, res) => {
 try {
   const { userId, title, body, data } = req.body;

   if (!userId || !title || !body) {
     return res.status(400).json({
       success: false,
       message: 'userId, title và body là bắt buộc'
     });
   }

   const notification = { title, body, type: 'test' };
   const result = await FirebaseService.sendToUser(userId, notification, data);

   res.status(200).json({
     success: true,
     message: 'Test notification đã được gửi',
     result: result
   });

 } catch (error) {
   logger.error('❌ Error sending test notification:', error);
   res.status(500).json({
     success: false,
     message: 'Lỗi khi gửi test notification',
     error: error.message
   });
 }
});

/**
* 📊 Lấy thống kê notifications của user
* GET /api/notification/user/:userId/stats
*/
router.get('/user/:userId/stats', async (req, res) => {
 try {
   const { userId } = req.params;

   // Đếm devices
   const deviceCount = await UserDevice.countDocuments({
     maNguoiDung: userId,
     trangThaiHoatDong: true
   });

   // Thống kê notifications
   const notificationStats = await NotificationLog.aggregate([
     { $match: { maNguoiDung: new mongoose.Types.ObjectId(userId) } },
     {
       $group: {
         _id: '$trangThai',
         count: { $sum: 1 }
       }
     }
   ]);

   // Notifications gần đây
   const recentNotifications = await NotificationLog.find({
     maNguoiDung: userId
   })
   .sort({ createdAt: -1 })
   .limit(10)
   .select('loaiThongBao tieuDe noiDung trangThai thoiGianGui createdAt');

   const stats = {
     activeDevices: deviceCount,
     notifications: {
       total: notificationStats.reduce((sum, stat) => sum + stat.count, 0),
       byStatus: notificationStats.reduce((acc, stat) => {
         acc[stat._id] = stat.count;
         return acc;
       }, {})
     },
     recent: recentNotifications
   };

   res.status(200).json({
     success: true,
     message: 'Thống kê notifications thành công',
     data: stats
   });

 } catch (error) {
   logger.error('❌ Error getting notification stats:', error);
   res.status(500).json({
     success: false,
     message: 'Lỗi khi lấy thống kê notifications',
     error: error.message
   });
 }
});

/**
* 🔄 Trigger lên lịch notifications cho booking (manual)
* POST /api/notification/schedule/:bookingId
*/
router.post('/schedule/:bookingId', async (req, res) => {
 try {
   const { bookingId } = req.params;

   logger.info(`🔄 Manual scheduling notifications for booking: ${bookingId}`);

   const result = await NotificationService.scheduleAllNotifications(bookingId);

   res.status(200).json({
     success: true,
     message: 'Notifications đã được lên lịch thành công',
     data: result
   });

 } catch (error) {
   logger.error('❌ Error scheduling notifications:', error);
   res.status(500).json({
     success: false,
     message: 'Lỗi khi lên lịch notifications',
     error: error.message
   });
 }
});

/**
* 🚀 Trigger gửi notifications đã lên lịch (manual)
* POST /api/notification/send-scheduled
*/
router.post('/send-scheduled', async (req, res) => {
 try {
   logger.info('🚀 Manual trigger for sending scheduled notifications');

   const result = await NotificationService.sendScheduledNotifications();

   res.status(200).json({
     success: true,
     message: 'Scheduled notifications đã được xử lý',
     data: result
   });

 } catch (error) {
   logger.error('❌ Error sending scheduled notifications:', error);
   res.status(500).json({
     success: false,
     message: 'Lỗi khi gửi scheduled notifications',
     error: error.message
   });
 }
});

module.exports = router;