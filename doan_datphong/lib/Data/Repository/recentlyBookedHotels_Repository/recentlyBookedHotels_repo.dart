import 'dart:convert';
import 'package:doan_datphong/Data/Provider/ApiResponse.dart';
import 'package:http/http.dart' as http;
import '../../Provider/IP_v4_Address.dart';

class RecentBookingsRepository {
  static final String ip = IPv4.IP_CURRENT;
  final String baseURL = "$ip/api/bookings";

  Future<ApiResponse> getRecentBookings(String userId, {int limit = 10}) async {
    final url = Uri.parse("$baseURL/recent-hotels/$userId?limit=$limit");

    try {
      print('🔍 Fetching recent hotels for user: $userId');

      final response = await http.get(
        url,
        headers: {"Content-Type": "application/json"},
      );

      print('📡 Recent hotels response: ${response.statusCode} - ${response.body}');

      final jsonData = jsonDecode(response.body);

      if (response.statusCode == 200 && jsonData['success'] == true) {
        return ApiResponse(
            success: true,
            message: jsonData['message'] ?? "Lấy danh sách khách sạn thành công",
            data: jsonData['data'] // Trả về List<dynamic> khách sạn
        );
      }

      return ApiResponse(
          success: false,
          message: jsonData['message'] ?? "Lỗi lấy danh sách khách sạn đã đặt"
      );
    } catch (err) {
      print("❌ Recent hotels error: $err");
      return ApiResponse(success: false, message: "Lỗi kết nối: $err");
    }
  }

  // ✅ MỚI: API lấy chi tiết lịch sử đặt phòng của 1 khách sạn
  Future<ApiResponse> getHotelBookingHistory(String userId, String hotelId) async {
    final url = Uri.parse("$baseURL/hotel-booking-history/$userId/$hotelId");

    try {
      print('🔍 Fetching hotel booking history: $userId - $hotelId');

      final response = await http.get(
        url,
        headers: {"Content-Type": "application/json"},
      );

      print('📡 Hotel booking history response: ${response.statusCode}');

      final jsonData = jsonDecode(response.body);

      if (response.statusCode == 200 && jsonData['success'] == true) {
        return ApiResponse(
            success: true,
            message: jsonData['message'] ?? "Lấy lịch sử thành công",
            data: jsonData['data']
        );
      }

      return ApiResponse(
          success: false,
          message: jsonData['message'] ?? "Lỗi lấy lịch sử đặt phòng"
      );
    } catch (err) {
      print("❌ Hotel booking history error: $err");
      return ApiResponse(success: false, message: "Lỗi kết nối: $err");
    }
  }
}