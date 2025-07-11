const { admin } = require('../config/firebase');
const logger = require('../config/logger');
const UserDevice = require('../Model/User/UserDevice');

class FirebaseService {
  constructor() {
    this.messaging = null;
  }
  getMessaging() {
    if (!this.messaging) {
      const { admin } = require('../config/firebase');
      this.messaging = admin.messaging();
    }
    return this.messaging;
  }

  /**
   * Gửi notification đến một user
   */
  async sendToUser(userId, notification, data = {}) {
    try {
      logger.info(`📱 Sending notification to user: ${userId}`);

      // Lấy tất cả device tokens của user
      const devices = await UserDevice.find({
        maNguoiDung: userId,
        trangThaiHoatDong: true
      });

      if (devices.length === 0) {
        logger.warn(`⚠️ No active devices found for user: ${userId}`);
        return {
          success: false,
          message: 'No active devices found',
          totalTokens: 0,
          successCount: 0,
          failureCount: 0
        };
      }

      const tokens = devices.map(device => device.fcmToken);
      logger.info(`📋 Found ${tokens.length} active devices for user ${userId}`);

      // Gửi notification
      const result = await this.sendToMultipleTokens(tokens, notification, data);
      
      // Cập nhật lastUsed cho các devices thành công
      if (result.successCount > 0) {
        await UserDevice.updateMany(
          { maNguoiDung: userId, trangThaiHoatDong: true },
          { lanSuDungCuoi: new Date() }
        );
      }

      return result;

    } catch (error) {
      logger.error(`❌ Error sending to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Gửi notification đến nhiều tokens
   */
  // async sendToMultipleTokens(tokens, notification, data = {}) {
  //   try {
  //     if (!tokens || tokens.length === 0) {
  //       return {
  //         success: false,
  //         message: 'No tokens provided',
  //         totalTokens: 0,
  //         successCount: 0,
  //         failureCount: 0
  //       };
  //     }

  //     const message = {
  //       notification: {
  //         title: notification.title,
  //         body: notification.body,
  //       },
  //       data: {
  //         type: notification.type || 'general',
  //         ...data
  //       },
  //       android: {
  //         notification: {
  //           icon: 'ic_notification',
  //           color: '#2196F3',
  //           sound: 'default',
  //           priority: 'high'
  //         }
  //       },
  //       apns: {
  //         payload: {
  //           aps: {
  //             sound: 'default',
  //             'content-available': 1
  //           }
  //         }
  //       },
  //       tokens: tokens
  //     };

  //     logger.info(`🚀 Sending multicast message to ${tokens.length} tokens`);

  //     const messaging = this.getMessaging();
  //     const response = await messaging.sendMulticast(message);

  //     logger.info(`📊 Multicast result: ${response.successCount}/${tokens.length} successful`);

  //     // Xử lý failed tokens
  //     if (response.failureCount > 0) {
  //       const invalidTokens = [];
        
  //       response.responses.forEach((resp, idx) => {
  //         if (!resp.success) {
  //           const error = resp.error;
  //           logger.warn(`❌ Token ${idx} failed:`, error.code);
            
  //           // Thu thập invalid tokens để cleanup
  //           if (error.code === 'messaging/invalid-registration-token' || 
  //               error.code === 'messaging/registration-token-not-registered') {
  //             invalidTokens.push(tokens[idx]);
  //           }
  //         }
  //       });

  //       // Cleanup invalid tokens
  //       if (invalidTokens.length > 0) {
  //         await this.cleanupInvalidTokens(invalidTokens);
  //       }
  //     }

  //     return {
  //       success: response.successCount > 0,
  //       message: `Sent to ${response.successCount}/${tokens.length} devices`,
  //       totalTokens: tokens.length,
  //       successCount: response.successCount,
  //       failureCount: response.failureCount,
  //       invalidTokens: response.responses
  //         .filter(r => !r.success)
  //         .map(r => r.error?.code)
  //     };

  //   } catch (error) {
  //     logger.error('❌ Error sending multicast message:', error);
  //     throw error;
  //   }
  // }

  async sendToMultipleTokens(tokens, notification, data = {}) {
    try {
      if (!tokens || tokens.length === 0) {
        return {
          success: false,
          message: 'No tokens provided',
          totalTokens: 0,
          successCount: 0,
          failureCount: 0
        };
      }

      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          type: notification.type || 'general',
          ...data
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#2196F3',
            sound: 'default',
            priority: 'high'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              'content-available': 1
            }
          }
        },
        tokens: tokens
      };

      logger.info(`🚀 Sending multicast message to ${tokens.length} tokens`);

      const messaging = this.getMessaging();
    
    // ✅ Thử cách khác nếu sendMulticast không work
    try {
      const response = await messaging.sendMulticast(message);
      logger.info(`📊 Multicast result: ${response.successCount}/${tokens.length} successful`);
      // ... rest of success handling
    } catch (multicastError) {
      // ✅ Fallback: Gửi từng token một
      console.log('🔄 Fallback to individual sends...');
      let successCount = 0;
      
      for (const token of tokens) {
        try {
          await messaging.send({
            ...message,
            token: token,
            tokens: undefined // Remove tokens field
          });
          successCount++;
        } catch (e) {
          console.log(`❌ Failed to send to token: ${e.message}`);
        }
      }
      
      return {
        success: successCount > 0,
        message: `Sent to ${successCount}/${tokens.length} devices (fallback)`,
        totalTokens: tokens.length,
        successCount: successCount,
        failureCount: tokens.length - successCount,
        invalidTokens: []
      };
    }

    } catch (error) {
      logger.error('❌ Error sending multicast message:', error);
      throw error;
    }
  }

  /**
   * Cleanup invalid tokens
   */
  async cleanupInvalidTokens(invalidTokens) {
    try {
      logger.info(`🧹 Cleaning up ${invalidTokens.length} invalid tokens`);
      
      const result = await UserDevice.updateMany(
        { fcmToken: { $in: invalidTokens } },
        { trangThaiHoatDong: false }
      );

      logger.info(`✅ Deactivated ${result.modifiedCount} invalid tokens`);
    } catch (error) {
      logger.error('❌ Error cleaning up invalid tokens:', error);
    }
  }

  /**
   * Register FCM token cho user
   */
  async registerToken(userId, fcmToken, deviceInfo = {}) {
    try {
      logger.info(`📝 Registering FCM token for user: ${userId}`);

      const deviceData = {
        maNguoiDung: userId,
        fcmToken: fcmToken,
        loaiThietBi: deviceInfo.deviceType || 'android',
        maThietBi: deviceInfo.deviceId,
        phienBanApp: deviceInfo.appVersion,
        trangThaiHoatDong: true,
        lanSuDungCuoi: new Date(),
        ngayDangKy: new Date()
      };

      // Upsert token (update if exists, create if not)
      const result = await UserDevice.findOneAndUpdate(
        { fcmToken: fcmToken },
        deviceData,
        { 
          upsert: true, 
          new: true,
          setDefaultsOnInsert: true
        }
      );

      logger.info(`✅ FCM token registered successfully for user ${userId}`);
      return result;

    } catch (error) {
      if (error.code === 11000) {
        logger.warn(`⚠️ FCM token already exists, updating...`);
        // Token đã tồn tại, chỉ cập nhật thông tin
        return await UserDevice.findOneAndUpdate(
          { fcmToken: fcmToken },
          { 
            maNguoiDung: userId,
            trangThaiHoatDong: true,
            lanSuDungCuoi: new Date()
          },
          { new: true }
        );
      }
      
      logger.error(`❌ Error registering FCM token for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Unregister FCM token
   */
  async unregisterToken(fcmToken) {
    try {
      logger.info(`🗑️ Unregistering FCM token: ${fcmToken.substring(0, 20)}...`);

      const result = await UserDevice.findOneAndUpdate(
        { fcmToken: fcmToken },
        { trangThaiHoatDong: false },
        { new: true }
      );

      if (result) {
        logger.info(`✅ FCM token unregistered successfully`);
      } else {
        logger.warn(`⚠️ FCM token not found for unregistration`);
      }

      return result;
    } catch (error) {
      logger.error('❌ Error unregistering FCM token:', error);
      throw error;
    }
  }
}

module.exports = new FirebaseService();