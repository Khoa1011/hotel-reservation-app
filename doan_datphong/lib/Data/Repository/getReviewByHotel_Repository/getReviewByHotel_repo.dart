import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../../../Helper/ErrorCode.dart';
import '../../Provider/ApiResponse.dart';
import '../../Provider/IP_v4_Address.dart';

class HotelReviewRepository {
  static final String ip = IPv4.IP_CURRENT;
  final String baseURL = "$ip/api/hotels";

  // ✅ Lấy reviews mới nhất
  Future<ApiResponse> getRecentReviews(String hotelId, {int limit = 5}) async {
    final url = Uri.parse("$baseURL/$hotelId/reviews/recent?limit=$limit");

    try {
      print("🔍 Getting recent reviews for hotel: $hotelId");

      final response = await http.get(
        url,
        headers: {"Content-Type": "application/json"},
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
      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return ApiResponse(
          success: true,
          message: data['message'] ?? "Lấy reviews thành công",
          data: data['data'],
        );
      } else {
        return ApiResponse(
          success: false,
          message: data['message'] ?? "Lỗi lấy reviews",
        );
      }
    } catch (e) {
      print("❌ Get recent reviews error: $e");
      return ApiResponse(
        success: false,
        message: "Lỗi kết nối: $e",
      );
    }
  }

  // ✅ Lấy tất cả reviews
  Future<ApiResponse> getAllReviews(String hotelId, {String sortBy = 'highest_rating'}) async {
    final url = Uri.parse("$baseURL/$hotelId/reviews?sortBy=$sortBy");

    try {
      print("🔍 Getting all reviews for hotel: $hotelId, sortBy: $sortBy");

      final response = await http.get(
        url,
        headers: {"Content-Type": "application/json"},
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
      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return ApiResponse(
          success: true,
          message: data['message'] ?? "Lấy reviews thành công",
          data: data['data'],
        );
      } else {
        return ApiResponse(
          success: false,
          message: data['message'] ?? "Lỗi lấy reviews",
        );
      }
    } catch (e) {
      print("❌ Get all reviews error: $e");
      return ApiResponse(
        success: false,
        message: "Lỗi kết nối: $e",
      );
    }
  }
}