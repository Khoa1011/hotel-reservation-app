import 'package:intl/intl.dart';

// ===== HELPER CLASS CHO FORMAT TIỀN TỆ =====
class CurrencyHelper {
  // Format VND với dấu phẩy ngăn cách
  static String formatVND(double amount) {
    final formatter = NumberFormat('#,###', 'vi_VN');
    return '${formatter.format(amount)}đ';
  }

  // Format VND rút gọn (1.000.000 → 1M)
  static String formatVNDShort(double amount) {
    if (amount >= 1000000000) {
      return '${(amount / 1000000000).toStringAsFixed(1)}Tỷ';
    } else if (amount >= 1000000) {
      return '${(amount / 1000000).toStringAsFixed(1)}Tr';
    } else if (amount >= 1000) {
      return '${(amount / 1000).toStringAsFixed(0)}K';
    } else {
      return '${amount.toStringAsFixed(0)}đ';
    }
  }

  // Format VND với đơn vị tự động
  static String formatVNDAuto(double amount) {
    if (amount >= 1000000) {
      return '${(amount / 1000000).toStringAsFixed(1)} triệu';
    } else if (amount >= 1000) {
      return '${(amount / 1000).toStringAsFixed(0)}k';
    } else {
      return '${amount.toStringAsFixed(0)}đ';
    }
  }
}