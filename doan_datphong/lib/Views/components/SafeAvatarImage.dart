// lib/Views/components/SafeAvatarImage.dart
import 'package:flutter/material.dart';
import 'dart:io';

class SafeAvatarImage extends StatelessWidget {
  final String? imageUrl;
  final double radius;
  final Widget? defaultChild;

  const SafeAvatarImage({
    Key? key,
    this.imageUrl,
    this.radius = 50,
    this.defaultChild,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    print("🖼️ SafeAvatarImage loading: $imageUrl");

    // ✅ Return default avatar if no URL or invalid URL
    if (imageUrl == null || imageUrl!.isEmpty || !_isValidUrl(imageUrl!)) {
      print("❌ Invalid avatar URL, using default: $imageUrl");
      return _buildDefaultAvatar();
    }

    // ✅ Network image
    if (imageUrl!.startsWith('http://') || imageUrl!.startsWith('https://')) {
      return CircleAvatar(
        radius: radius,
        backgroundColor: Colors.transparent,
        child: ClipOval(
          child: Image.network(
            imageUrl!,
            width: radius * 2,
            height: radius * 2,
            fit: BoxFit.cover,
            headers: {
              'User-Agent': 'Flutter-App/1.0',
              'ngrok-skip-browser-warning': 'true',
              'Cache-Control': 'no-cache',
            },
            loadingBuilder: (context, child, loadingProgress) {
              if (loadingProgress == null) {
                print("✅ Avatar loaded: $imageUrl");
                return child;
              }
              return _buildLoadingAvatar();
            },
            errorBuilder: (context, error, stackTrace) {
              print("❌ Avatar load failed: $imageUrl");
              print("❌ Error: $error");
              return _buildDefaultAvatar();
            },
          ),
        ),
      );
    }

    // ✅ Local file image
    if (imageUrl!.startsWith('/') || imageUrl!.startsWith('file://')) {
      String filePath = imageUrl!.startsWith('file://')
          ? imageUrl!.replaceFirst('file://', '')
          : imageUrl!;

      // Skip cache paths
      if (filePath.contains('/cache/') || filePath.startsWith('/data/user/')) {
        print("❌ Skipping cache path: $filePath");
        return _buildDefaultAvatar();
      }

      try {
        if (File(filePath).existsSync()) {
          return CircleAvatar(
            radius: radius,
            backgroundColor: Colors.transparent,
            child: ClipOval(
              child: Image.file(
                File(filePath),
                width: radius * 2,
                height: radius * 2,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  print("❌ Local avatar error: $error");
                  return _buildDefaultAvatar();
                },
              ),
            ),
          );
        }
      } catch (e) {
        print("❌ File avatar error: $e");
      }
    }

    // ✅ Fallback to default
    return _buildDefaultAvatar();
  }

  bool _isValidUrl(String url) {
    try {
      // Skip cache paths immediately
      if (url.contains('/cache/') || url.startsWith('/data/user/')) {
        return false;
      }

      if (url.startsWith('http://') || url.startsWith('https://')) {
        final uri = Uri.parse(url);
        return uri.hasScheme && uri.host.isNotEmpty;
      }

      // Local file paths are valid if they exist and not cache
      if (url.startsWith('/') || url.startsWith('file://')) {
        return !url.contains('/cache/');
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  Widget _buildLoadingAvatar() {
    return CircleAvatar(
      radius: radius,
      backgroundColor: Colors.grey[200],
      child: SizedBox(
        width: radius * 0.6,
        height: radius * 0.6,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          valueColor: AlwaysStoppedAnimation<Color>(Colors.blue),
        ),
      ),
    );
  }

  Widget _buildDefaultAvatar() {
    return CircleAvatar(
      radius: radius,
      backgroundColor: Colors.grey[300],
      child: defaultChild ?? Icon(
        Icons.person,
        size: radius * 0.8,
        color: Colors.grey[600],
      ),
    );
  }
}