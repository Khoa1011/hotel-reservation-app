// File: lib/firebase_options.dart
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError(
        'DefaultFirebaseOptions have not been configured for web - '
            'you can reconfigure this by running the FlutterFire CLI again.',
      );
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for macos - '
              'you can reconfigure this by running the FlutterFire CLI again.',
        );
      case TargetPlatform.windows:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for windows - '
              'you can reconfigure this by running the FlutterFire CLI again.',
        );
      case TargetPlatform.linux:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for linux - '
              'you can reconfigure this by running the FlutterFire CLI again.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  // ✅ Android config (từ google-services.json của bạn)
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyC2ijy5bP-D4xMgryv2BnyIdRjjrIDyfvY',
    appId: '1:879501096162:android:e43f778bc45137e550dabb',
    messagingSenderId: '879501096162',
    projectId: 'datphong-c362e',
    storageBucket: 'datphong-c362e.firebasestorage.app',
  );

  // ✅ iOS config (placeholder - update nếu cần iOS)
  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyC2ijy5bP-D4xMgryv2BnyIdRjjrIDyfvY',
    appId: '1:879501096162:ios:d19397197ebb39cf50dabb',
    messagingSenderId: '879501096162',
    projectId: 'datphong-c362e',
    storageBucket: 'datphong-c362e.firebasestorage.app',
    iosBundleId: 'com.example.doan_datphong',
  );
}