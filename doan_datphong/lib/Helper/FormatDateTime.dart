import 'package:intl/intl.dart';


class DateTimeHelper{
  // ===== FORMAT NGÀY THÁNG =====
  static String formatDate(String date) {
    final parsedDate = DateTime.parse(date);
    // Sau đó format
    return DateFormat("dd/MM/yyyy").format(parsedDate);
  }
}