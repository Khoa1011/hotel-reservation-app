import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:doan_datphong/Models/DanhGia.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../../Helper/ErrorCode.dart';
import '../../Provider/ApiResponse.dart';
import '../../Provider/IP_v4_Address.dart';

class ReviewRepository {
  static final String ip = IPv4.IP_CURRENT;
  final String baseURL = "$ip/api/review";

  // ✅ Submit review
  Future<ApiResponse> submitReview(DanhGia danhGia) async {
    final url = Uri.parse("$baseURL/submit");

    try {
      // Get token for authentication
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString("token");

      if (token == null) {
        return ApiResponse(
            success: false,
            message: "Vui lòng đăng nhập lại"
        );
      }

      print("🔍 Submitting review:");
      print("   - Booking ID: ${danhGia.maDonDat}");
      print("   - Rating: ${danhGia.soSao}");
      print("   - Comment: ${danhGia.binhLuan}");

      final response = await http.post(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer $token",
        },
        body: jsonEncode({
          "bookingId": danhGia.maDonDat,
          "rating": danhGia.soSao,
          "comment": danhGia.binhLuan,
        }),
      ).timeout(
        Duration(seconds: 15),
        onTimeout: () {
          throw TimeoutException(
            ErrorCodes.connectionTimeout,
            Duration(seconds: 15),
          );
        },
      );

      print("🔍 Response status: ${response.statusCode}");
      print("🔍 Response body: ${response.body}");

      final data = jsonDecode(response.body);

      if (response.statusCode == 201) {


        return ApiResponse(
          success: true,
          message: data['message'] ?? "Đánh giá thành công",
        );
      } else if (response.statusCode == 400){
        // Bad request - handle specific cases
        final message = data['message'] ?? "Yêu cầu không hợp lệ";
        return ApiResponse(
          success: false,
          message: message,
        );
      }else{
        final message = data['message'] ?? "Yêu cầu không hợp lệ";
        return ApiResponse(
          success: false,
          message: message,
        );
    }
    } catch (e) {
      print("❌ Submit review error: $e");
      return ApiResponse(
          success: false,
          message: "Lỗi kết nối: $e"
      );
    }
  }
}