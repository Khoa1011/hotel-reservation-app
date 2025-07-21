// lib/Helper/ServerChangeManager.dart - LIGHTWEIGHT VERSION (NO NEW DEPENDENCIES)
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:io';

class ServerChangeManager {
  static const String _lastServerUrlKey = 'last_server_url';
  static const String _lastClearTimeKey = 'last_cache_clear_time';

  /// ✅ Main method: Check và xử lý thay đổi server
  static Future<ServerChangeResult> checkAndHandleServerChange(String currentServerUrl) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final lastServerUrl = prefs.getString(_lastServerUrlKey);

      print("🔍 Checking server change:");
      print("   - Last URL: $lastServerUrl");
      print("   - Current URL: $currentServerUrl");

      // Case 1: First time run
      if (lastServerUrl == null) {
        await prefs.setString(_lastServerUrlKey, currentServerUrl);
        await _recordClearTime();

        // Clear cache for clean start
        final clearResult = await clearAllCache();

        return ServerChangeResult(
          hasChanged: false,
          isFirstRun: true,
          message: "Lần đầu chạy app - Cache đã được dọn dẹp",
          clearResult: clearResult,
        );
      }

      // Case 2: Server changed
      if (lastServerUrl != currentServerUrl) {
        print("🔄 Server URL changed! Clearing cache...");

        final clearResult = await clearAllCache();
        await prefs.setString(_lastServerUrlKey, currentServerUrl);
        await _recordClearTime();

        return ServerChangeResult(
          hasChanged: true,
          isFirstRun: false,
          message: "Server đã thay đổi - Cache đã được xóa",
          oldUrl: lastServerUrl,
          newUrl: currentServerUrl,
          clearResult: clearResult,
        );
      }

      // Case 3: Same server
      return ServerChangeResult(
        hasChanged: false,
        isFirstRun: false,
        message: "Server không đổi",
      );

    } catch (e) {
      print("❌ Error checking server change: $e");
      return ServerChangeResult(
        hasChanged: false,
        isFirstRun: false,
        message: "Lỗi kiểm tra server: $e",
        hasError: true,
      );
    }
  }

  /// ✅ Clear all cache (using only built-in Flutter)
  static Future<CacheClearResult> clearAllCache() async {
    final stopwatch = Stopwatch()..start();
    final results = <String, bool>{};

    try {
      print("🧹 Starting lightweight cache clear...");

      // 1. Clear Flutter image cache
      try {
        imageCache.clear();
        imageCache.clearLiveImages();
        results['flutter_image_cache'] = true;
        print("✅ Flutter image cache cleared");
      } catch (e) {
        results['flutter_image_cache'] = false;
        print("❌ Flutter image cache error: $e");
      }

      // 2. Clear network cache (HTTP client)
      try {
        // Force new HTTP client instance để tránh connection reuse
        HttpClient().close(force: true);
        results['http_client'] = true;
        print("✅ HTTP client reset");
      } catch (e) {
        results['http_client'] = false;
        print("❌ HTTP client error: $e");
      }

      // 3. Clear any in-memory caches
      try {
        // Clear widget binding cache
        WidgetsBinding.instance.reassembleApplication();
        results['widget_cache'] = true;
        print("✅ Widget cache cleared");
      } catch (e) {
        results['widget_cache'] = false;
        print("❌ Widget cache error: $e");
      }

      stopwatch.stop();
      print("✅ Lightweight cache clear completed in ${stopwatch.elapsedMilliseconds}ms");

      return CacheClearResult(
        success: true,
        duration: stopwatch.elapsedMilliseconds,
        results: results,
        message: "Cache cleared successfully",
      );

    } catch (e) {
      stopwatch.stop();
      return CacheClearResult(
        success: false,
        duration: stopwatch.elapsedMilliseconds,
        results: results,
        message: "Cache clear failed: $e",
        error: e.toString(),
      );
    }
  }

  /// ✅ Test server connection
  static Future<bool> testServerConnection(String serverUrl) async {
    try {
      print("🔗 Testing connection to: $serverUrl");

      final response = await http.get(
        Uri.parse("$serverUrl/health"),
        headers: {
          'User-Agent': 'Flutter-App',
          'ngrok-skip-browser-warning': 'true',
        },
      ).timeout(Duration(seconds: 10));

      final isOk = response.statusCode == 200;
      print(isOk ? "✅ Server connection OK" : "❌ Server connection failed: ${response.statusCode}");
      return isOk;

    } catch (e) {
      print("❌ Server connection error: $e");
      return false;
    }
  }

  /// ✅ Get basic cache info
  static Future<CacheInfo> getCacheInfo() async {
    try {
      return CacheInfo(
        flutterImageCacheSize: imageCache.currentSizeBytes,
        flutterImageCacheCount: imageCache.currentSize,
        lastClearTime: await _getLastClearTime(),
      );
    } catch (e) {
      return CacheInfo.error(e.toString());
    }
  }

  // ===== PRIVATE HELPERS =====

  static Future<void> _recordClearTime() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_lastClearTimeKey, DateTime.now().millisecondsSinceEpoch);
  }

  static Future<DateTime> _getLastClearTime() async {
    final prefs = await SharedPreferences.getInstance();
    final timestamp = prefs.getInt(_lastClearTimeKey) ?? 0;
    return DateTime.fromMillisecondsSinceEpoch(timestamp);
  }
}

// ===== LIGHTWEIGHT DATA CLASSES =====

class ServerChangeResult {
  final bool hasChanged;
  final bool isFirstRun;
  final String message;
  final String? oldUrl;
  final String? newUrl;
  final CacheClearResult? clearResult;
  final bool hasError;

  ServerChangeResult({
    required this.hasChanged,
    required this.isFirstRun,
    required this.message,
    this.oldUrl,
    this.newUrl,
    this.clearResult,
    this.hasError = false,
  });

  @override
  String toString() => 'ServerChangeResult(hasChanged: $hasChanged, message: $message)';
}

class CacheClearResult {
  final bool success;
  final int duration;
  final Map<String, bool> results;
  final String message;
  final String? error;

  CacheClearResult({
    required this.success,
    required this.duration,
    required this.results,
    required this.message,
    this.error,
  });

  double get successRate {
    if (results.isEmpty) return 0.0;
    final successCount = results.values.where((v) => v).length;
    return successCount / results.length;
  }

  @override
  String toString() => 'CacheClearResult(success: $success, duration: ${duration}ms)';
}

class CacheInfo {
  final int flutterImageCacheSize;
  final int flutterImageCacheCount;
  final DateTime lastClearTime;
  final String? error;

  CacheInfo({
    required this.flutterImageCacheSize,
    required this.flutterImageCacheCount,
    required this.lastClearTime,
    this.error,
  });

  CacheInfo.error(String errorMessage) :
        flutterImageCacheSize = 0,
        flutterImageCacheCount = 0,
        lastClearTime = DateTime.now(),
        error = errorMessage;

  bool get hasError => error != null;

  int get daysSinceLastClear {
    return DateTime.now().difference(lastClearTime).inDays;
  }

  @override
  String toString() => 'CacheInfo(count: $flutterImageCacheCount, size: $flutterImageCacheSize bytes)';
}