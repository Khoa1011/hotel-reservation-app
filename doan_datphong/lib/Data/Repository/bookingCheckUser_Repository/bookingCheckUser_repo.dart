import 'dart:convert';
import 'package:doan_datphong/Data/Provider/ApiResponse.dart';
import 'package:doan_datphong/Models/DonDatPhong.dart';
import 'package:http/http.dart' as http;
import '../../Provider/IP_v4_Address.dart';

class BookingCheckRepository {
  static final String ip = IPv4.IP_CURRENT;
  final String baseURL = "$ip/api/booking-auto";

  // Kiểm tra user có bị cấm không
  Future<ApiResponse> checkUserBanStatus(String userId) async {
    final url = Uri.parse("$baseURL/check-user-ban/$userId");

    try {
      print('🔍 Checking user ban status: $userId');

      final response = await http.get(
        url,
        headers: {"Content-Type": "application/json"},
      );

      print('📡 User ban check response: ${response.statusCode} - ${response.body}');

      final jsonData = jsonDecode(response.body);

      if (response.statusCode == 200 && jsonData['success'] == true) {
        return ApiResponse(
            success: true,
            message: "Kiểm tra trạng thái user thành công",
            data: jsonData['data']
        );
      }

      return ApiResponse(
          success: false,
          message: jsonData['message'] ?? "Lỗi kiểm tra trạng thái user"
      );
    } catch (err) {
      print("❌ User ban check error: $err");
      return ApiResponse(success: false, message: "Lỗi kết nối: $err");
    }
  }

  // Trigger kiểm tra booking quá hạn
  Future<ApiResponse> triggerOverdueCheck() async {
    final url = Uri.parse("$baseURL/check-overdue-bookings");

    try {
      print('🔄 Triggering overdue booking check...');

      final response = await http.post(
        url,
        headers: {"Content-Type": "application/json"},
      );

      print('📡 Overdue check response: ${response.statusCode} - ${response.body}');

      final jsonData = jsonDecode(response.body);

      if (response.statusCode == 200 && jsonData['success'] == true) {
        return ApiResponse(
            success: true,
            message: jsonData['message'] ?? "Kiểm tra hoàn tất",
            data: jsonData
        );
      }

      return ApiResponse(
          success: false,
          message: jsonData['message'] ?? "Lỗi kiểm tra booking quá hạn"
      );
    } catch (err) {
      print("❌ Overdue check error: $err");
      return ApiResponse(success: false, message: "Lỗi trigger check: $err");
    }
  }

}
