// File: lib/firebase_test_screen.dart
import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class FirebaseTestScreen extends StatefulWidget {
  @override
  _FirebaseTestScreenState createState() => _FirebaseTestScreenState();
}

class _FirebaseTestScreenState extends State<FirebaseTestScreen> {
  String _fcmToken = "Đang lấy token...";
  String _permissionStatus = "Đang kiểm tra quyền...";
  List<String> _notifications = [];
  StreamSubscription<RemoteMessage>? _messageSubscription;
  @override
  void initState() {
    super.initState();
    _initializeFirebase();
  }

  Future<void> _initializeFirebase() async {
    try {
      // 1. Lấy FCM token
      String? token = await FirebaseMessaging.instance.getToken();
      setState(() {
        _fcmToken = token ?? "Không lấy được token";
      });
      print("🔑 FCM Token: $token");

      // 2. Kiểm tra permission
      NotificationSettings settings = await FirebaseMessaging.instance.requestPermission();
      setState(() {
        _permissionStatus = "Permission: ${settings.authorizationStatus}";
      });

      // 3. Listen for foreground messages
      _messageSubscription = FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        print('📱 Received message: ${message.notification?.title}');

        // ✅ FIX: Check mounted trước khi setState
        if (mounted) {
          setState(() {
            _notifications.insert(0,
                "${message.notification?.title ?? 'No title'}: ${message.notification?.body ?? 'No body'}"
            );
          });
        }
      });


    } catch (e) {
      if (mounted) {  // ✅ FIX: Check mounted
        setState(() {
          _fcmToken = "Lỗi: $e";
        });
      }
    }
  }

  @override
  void dispose() {
    // ✅ FIX: Cancel subscription
    _messageSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Firebase Test'),
        backgroundColor: Colors.blue,
      ),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ✅ Permission Status
            Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.green),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Firebase Status:',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  SizedBox(height: 8),
                  Text(_permissionStatus),
                ],
              ),
            ),

            SizedBox(height: 16),

            // ✅ FCM Token
            Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'FCM Token:',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      IconButton(
                        icon: Icon(Icons.copy),
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: _fcmToken));
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Token copied!')),
                          );
                        },
                      ),
                    ],
                  ),
                  Container(
                    padding: EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      _fcmToken,
                      style: TextStyle(fontSize: 12, fontFamily: 'monospace'),
                    ),
                  ),
                ],
              ),
            ),

            SizedBox(height: 16),

            // ✅ Test Buttons
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: _refreshToken,
                    child: Text('Refresh Token'),
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _testLocalNotification,
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                    child: Text('Test Local Notification'),
                  ),
                ),
              ],
            ),

            SizedBox(height: 16),

            // ✅ Received Notifications
            Text(
              'Received Notifications:',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            SizedBox(height: 8),
            Expanded(
              child: _notifications.isEmpty
                  ? Container(
                padding: EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(
                    'Chưa có thông báo nào.\nTest bằng Firebase Console!',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ),
              )
                  : ListView.builder(
                itemCount: _notifications.length,
                itemBuilder: (context, index) {
                  return Card(
                    child: ListTile(
                      leading: Icon(Icons.notifications, color: Colors.blue),
                      title: Text(_notifications[index]),
                      subtitle: Text('${DateTime.now().toString().substring(11, 19)}'),
                    ),
                  );
                },
              ),
            ),

            SizedBox(height: 16),

            // ✅ Instructions
            Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.orange[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.orange),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Cách test:',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  Text('1. Copy FCM Token'),
                  Text('2. Vào Firebase Console > Cloud Messaging'),
                  Text('3. Tạo notification mới'),
                  Text('4. Paste token vào "Send test message"'),
                  Text('5. Gửi và check kết quả'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _refreshToken() async {
    String? token = await FirebaseMessaging.instance.getToken();
    setState(() {
      _fcmToken = token ?? "Không lấy được token";
    });
  }

  void _testLocalNotification() {
    setState(() {
      _notifications.insert(0, "Test Local Notification: ${DateTime.now()}");
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Test notification added!'),
        backgroundColor: Colors.green,
      ),
    );
  }
}