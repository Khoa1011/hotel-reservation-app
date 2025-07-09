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

  static String formatDateToString (DateTime date){
    return DateFormat("yyyy/MM/dd").format(date);
  }
  static String formatDateToString2 (DateTime date){
    return DateFormat("dd/MM/yyyy").format(date);
  }

  static DateTime? formatStringToDateTime(String date) {
    try {
      return DateTime.parse(date);
    } catch (e) {
      return null;
    }
  }

}