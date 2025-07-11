// services/notification_service.dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
// import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  // static final FlutterLocalNotificationsPlugin _flutterLocalNotificationsPlugin =
  // FlutterLocalNotificationsPlugin();

  static GlobalKey<NavigatorState>? _navigatorKey;

  // ✅ Set navigator key từ main.dart
  static void setNavigatorKey(GlobalKey<NavigatorState> key) {
    _navigatorKey = key;
  }

  // ✅ Initialize local notifications
  // static Future<void> initialize() async {
  //   const AndroidInitializationSettings initializationSettingsAndroid =
  //   AndroidInitializationSettings('@mipmap/ic_launcher');
  //
  //   const InitializationSettings initializationSettings = InitializationSettings(
  //     android: initializationSettingsAndroid,
  //   );
  //
  //   await _flutterLocalNotificationsPlugin.initialize(
  //     initializationSettings,
  //     onDidReceiveNotificationResponse: (NotificationResponse response) {
  //       // Handle notification tap
  //       if (response.payload != null) {
  //         _navigateToBookingDetail(response.payload!);
  //       }
  //     },
  //   );
  //
  //   // Create notification channel for Android
  //   const AndroidNotificationChannel channel = AndroidNotificationChannel(
  //     'booking_notifications',
  //     'Booking Notifications',
  //     description: 'This channel is used for booking notifications.',
  //     importance: Importance.max,
  //   );
  //
  //   await _flutterLocalNotificationsPlugin
  //       .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
  //       ?.createNotificationChannel(channel);
  // }

  static Future<void> initialize() async {
    // ✅ Comment local notifications init
    // const AndroidInitializationSettings initializationSettingsAndroid = ...
    print('📱 Notification service initialized (without local notifications)');
  }

  // ✅ Setup Firebase Messaging listeners
  // static void setupFirebaseMessaging() {
  //   // 📱 Xử lý khi app đang mở (foreground)
  //   FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  //     print('📱 Foreground message: ${message.notification?.title}');
  //     print('🔍 Message data: ${message.data}');
  //
  //
  //     String notificationType = message.data['type'] ?? '';
  //     print('🔍 Notification type: "$notificationType"');
  //
  //     if (notificationType == 'dat_phong_thanh_cong') {
  //       // ✅ Đặt phòng thành công → Hiện popup trong app
  //       print('✅ Showing booking success dialog');
  //       _showBookingSuccessDialog(message);
  //     } else {
  //       print('✅ Showing local notification');
  //       // ✅ Các loại khác → Hiện local notification trên tray
  //       _showLocalNotification(message);
  //     }
  //   });
  //
  //   // 📱 Xử lý khi user tap notification để mở app
  //   FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
  //     print('📱 App opened from notification: ${message.notification?.title}');
  //
  //     String? bookingId = message.data['bookingId'];
  //     if (bookingId != null) {
  //       _navigateToBookingDetail(bookingId);
  //     }
  //   });
  //
  //   // 📱 Xử lý khi app mở từ notification (terminated state)
  //   FirebaseMessaging.instance.getInitialMessage().then((message) {
  //     if (message != null) {
  //       print('📱 App launched from notification: ${message.notification?.title}');
  //
  //       String? bookingId = message.data['bookingId'];
  //       if (bookingId != null) {
  //         _navigateToBookingDetail(bookingId);
  //       }
  //     }
  //   });
  // }


  static void setupFirebaseMessaging() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('📱 Foreground message: ${message.notification?.title}');
      print('🔍 Message data: ${message.data}');

      String notificationType = message.data['type'] ?? '';
      print('🔍 Notification type: "$notificationType"');

      if (notificationType == 'dat_phong_thanh_cong') {
        print('✅ Showing booking success dialog');
        _showBookingSuccessDialog(message);
      } else {
        print('✅ Would show local notification: ${message.notification?.title}');
        // Tạm thời chỉ log
      }
    });
    // ... rest of Firebase setup
  }


  // ✅ Show booking success dialog trong app
  static void _showBookingSuccessDialog(RemoteMessage message) {
    print('🔍 Debug popup:');
    print('   - Navigator key: ${_navigatorKey?.currentContext}');
    print('   - Message data: ${message.data}');
    print('   - Notification type: ${message.data['type']}');
    if (_navigatorKey?.currentContext != null) {
      print('✅ Showing dialog...');
      showDialog(
        context: _navigatorKey!.currentContext!,
        builder: (_) => AlertDialog(
          title: Row(
            children: [
              Text('🎉'),
              SizedBox(width: 8),
              Expanded(child: Text(message.notification?.title ?? '')),
            ],
          ),
          content: Text(message.notification?.body ?? ''),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(_navigatorKey!.currentContext!),
              child: Text('OK'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(_navigatorKey!.currentContext!);
                String? bookingId = message.data['bookingId'];
                if (bookingId != null) {
                  _navigateToBookingDetail(bookingId);
                }
              },
              child: Text('Xem chi tiết'),
            ),
          ],
        ),
      );
    }else {
      print('❌ Navigator key is null!');
    }
  }

  // ✅ Show local notification trên tray
  static Future<void> _showLocalNotification(RemoteMessage message) async {
    print('🔔 Showing local notification: ${message.notification?.title}');

    // const AndroidNotificationDetails androidNotificationDetails =
    // AndroidNotificationDetails(
    //   'booking_notifications',
    //   'Booking Notifications',
    //   channelDescription: 'This channel is used for booking notifications.',
    //   importance: Importance.max,
    //   priority: Priority.high,
    //   icon: '@mipmap/ic_launcher',
    //   color: Color(0xFF14D9E1),
    //   playSound: true,
    //   enableVibration: true,
    // );
    //
    // const NotificationDetails notificationDetails = NotificationDetails(
    //   android: androidNotificationDetails,
    // );
    //
    // await _flutterLocalNotificationsPlugin.show(
    //   message.hashCode,
    //   message.notification?.title,
    //   message.notification?.body,
    //   notificationDetails,
    //   payload: message.data['bookingId'],
    // );
  }

  // ✅ Navigate to booking detail
  static void _navigateToBookingDetail(String bookingId) {
    print('🧭 Navigating to booking: $bookingId');

    if (_navigatorKey?.currentContext != null) {
      // Tùy vào cấu trúc routing của app
      Navigator.pushNamed(
        _navigatorKey!.currentContext!,
        '/booking-detail',
        arguments: bookingId,
      );

      // Hoặc push directly
      // Navigator.push(
      //   _navigatorKey!.currentContext!,
      //   MaterialPageRoute(
      //     builder: (context) => BookingDetailScreen(bookingId: bookingId),
      //   ),
      // );
    }
  }

  // ✅ Get FCM token
  static Future<String?> getFCMToken() async {
    try {
      String? token = await FirebaseMessaging.instance.getToken();
      print('FCM Token: $token');
      return token;
    } catch (e) {
      print('❌ Error getting FCM token: $e');
      return null;
    }
  }

  // ✅ Request notification permission
  static Future<bool> requestPermission() async {
    try {
      NotificationSettings settings = await FirebaseMessaging.instance.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      print('📱 Permission granted: ${settings.authorizationStatus}');
      return settings.authorizationStatus == AuthorizationStatus.authorized;
    } catch (e) {
      print('❌ Error requesting permission: $e');
      return false;
    }
  }
}