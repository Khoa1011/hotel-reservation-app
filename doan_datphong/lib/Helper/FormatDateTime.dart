import 'package:intl/intl.dart';


class DateTimeHelper{
  // ===== FORMAT NGÀY THÁNG =====
  static String formatDate(String date) {
    final parsedDate = DateTime.parse(date);
    // Sau đó format
    return DateFormat("dd/MM/yyyy").format(parsedDate);
  }
  static String formatDate2(String date) {
    final parsedDate = DateTime.parse(date);
    // Sau đó format
    return DateFormat("yyyy/MM/dd").format(parsedDate);
  }

  static String formatDate3(String date) {
    final parsedDate = DateTime.parse(date);
    // Sau đó format
    return DateFormat("yyyy-MM-dd").format(parsedDate);
  }

  static String formatDateToString (DateTime date){
    return DateFormat("yyyy/MM/dd").format(date);
  }
  static String formatDateToString2 (DateTime date){
    return DateFormat("dd/MM/yyyy").format(date);
  }

  static String formatDateToString3 (DateTime date){
    return DateFormat("yyyy-MM-dd").format(date);
  }

  static DateTime? formatStringToDateTime(String date) {
      return DateTime.parse(date);
  }
  static DateTime? smartParse(String dateString) {
    if (dateString.isEmpty) return null;

    // Thử ISO format trước
    try {
      return DateTime.parse(dateString);
    } catch (e) {
      // Detect format và parse
      final detectedFormat = detectDateFormat(dateString);
      if (detectedFormat != null) {
        return parseWithFormat(dateString, detectedFormat);
      }

      // Fallback to multiple formats
      return _parseWithMultipleFormats(dateString);
    }
  }
  // ✅ UTILITY: Detect format tự động
  static String? detectDateFormat(String dateString) {
    final formatPatterns = {
      r'^\d{2}/\d{2}/\d{4}$': 'dd/MM/yyyy',        // 10/07/2025
      r'^\d{2}-\d{2}-\d{4}$': 'dd-MM-yyyy',        // 10-07-2025
      r'^\d{4}-\d{2}-\d{2}$': 'yyyy-MM-dd',        // 2025-07-10
      r'^\d{4}/\d{2}/\d{2}$': 'yyyy/MM/dd',        // 2025/07/10
      r'^\d{2}/\d{2}/\d{2}$': 'dd/MM/yy',          // 10/07/25
      r'^\d{2}-\d{2}-\d{2}$': 'dd-MM-yy',          // 10-07-25
    };

    for (final pattern in formatPatterns.entries) {
      if (RegExp(pattern.key).hasMatch(dateString)) {
        return pattern.value;
      }
    }

    return null;
  }

  static DateTime? parseWithFormat(String dateString, String format) {
    try {
      return DateFormat(format).parse(dateString);
    } catch (e) {
      print("❌ Failed to parse '$dateString' with format '$format': $e");
      return null;
    }
  }

  static DateTime? _parseWithMultipleFormats(String dateString) {
    final formats = [
      'dd/MM/yyyy',           // 10/07/2025
      'dd-MM-yyyy',           // 10-07-2025
      'MM/dd/yyyy',           // 07/10/2025 (US format)
      'yyyy/MM/dd',           // 2025/07/10
      'dd/MM/yyyy HH:mm',     // 10/07/2025 14:30
      'dd-MM-yyyy HH:mm',     // 10-07-2025 14:30
      'yyyy-MM-dd HH:mm:ss',  // 2025-07-10 14:30:00
      'dd/MM/yy',             // 10/07/25
      'dd-MM-yy',             // 10-07-25
    ];

    for (final format in formats) {
      try {
        final parsedDate = DateFormat(format).parse(dateString);
        print("✅ Successfully parsed '$dateString' with format '$format' -> $parsedDate");
        return parsedDate;
      } catch (e) {
        // Tiếp tục thử format tiếp theo
        continue;
      }
    }

    print("❌ Failed to parse date: '$dateString' with any format");
    return null;
  }

}