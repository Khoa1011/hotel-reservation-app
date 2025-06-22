// File: lib/LanguageProvider.dart
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LanguageProvider extends ChangeNotifier {
  Locale _currentLocale = const Locale('vi'); // Mặc định tiếng Việt
  bool _isInitialized = false;

  Locale get currentLocale => _currentLocale;
  bool get isInitialized => _isInitialized;

  // Constructor
  LanguageProvider() {
    _initLanguage();
  }

  // Khởi tạo ngôn ngữ (private method)
  _initLanguage() async {
    if (!_isInitialized) {
      await _loadSavedLanguage();
      _isInitialized = true;
    }
  }

  // Public method để khởi tạo (để tương thích với code cũ)
  Future<void> initLanguage() async {
    await _initLanguage();
  }

  // Load ngôn ngữ đã lưu từ SharedPreferences
  _loadSavedLanguage() async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      String? languageCode = prefs.getString('language_code');

      if (languageCode != null && (languageCode == 'vi' || languageCode == 'en')) {
        _currentLocale = Locale(languageCode);
        debugPrint('Loaded saved language: $languageCode');
      } else {
        // Nếu chưa có hoặc không hợp lệ, set mặc định là tiếng Việt
        _currentLocale = const Locale('vi');
        await prefs.setString('language_code', 'vi');
        debugPrint('Set default language: vi');
      }

      notifyListeners();
    } catch (e) {
      debugPrint('Error loading language: $e');
      _currentLocale = const Locale('vi');
    }
  }

  // Thay đổi ngôn ngữ
  Future<void> changeLanguage(String languageCode) async {
    if (languageCode != 'vi' && languageCode != 'en') {
      debugPrint('Unsupported language code: $languageCode');
      return;
    }

    try {
      _currentLocale = Locale(languageCode);
      SharedPreferences prefs = await SharedPreferences.getInstance();
      await prefs.setString('language_code', languageCode);
      debugPrint('Language changed to: $languageCode');
      notifyListeners();
    } catch (e) {
      debugPrint('Error changing language: $e');
    }
  }

  // Toggle giữa tiếng Việt và tiếng Anh
  void toggleLanguage() {
    if (_currentLocale.languageCode == 'vi') {
      changeLanguage('en');
    } else {
      changeLanguage('vi');
    }
  }

  // Kiểm tra có phải tiếng Việt không
  bool isVietnamese() {
    return _currentLocale.languageCode == 'vi';
  }

  // Kiểm tra có phải tiếng Anh không
  bool isEnglish() {
    return _currentLocale.languageCode == 'en';
  }

  // Get current language name
  String getCurrentLanguageName() {
    switch (_currentLocale.languageCode) {
      case 'vi':
        return 'Tiếng Việt';
      case 'en':
        return 'English';
      default:
        return 'Unknown';
    }
  }

  // Get flag emoji
  String getCurrentFlag() {
    switch (_currentLocale.languageCode) {
      case 'vi':
        return '🇻🇳';
      case 'en':
        return '🇺🇸';
      default:
        return '🏳️';
    }
  }

  // Get language code display
  String getLanguageCode() {
    return _currentLocale.languageCode.toUpperCase();
  }

  // Get display text for current language
  String getDisplayText() {
    return '${getCurrentFlag()} ${getLanguageCode()}';
  }

  // Reset to default language
  Future<void> resetToDefault() async {
    await changeLanguage('vi');
  }

  // Get all supported languages
  List<Map<String, String>> getSupportedLanguages() {
    return [
      {
        'code': 'vi',
        'name': 'Tiếng Việt',
        'flag': '🇻🇳',
      },
      {
        'code': 'en',
        'name': 'English',
        'flag': '🇺🇸',
      },
    ];
  }
}