import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:doan_datphong/Data/Provider/ApiResponse.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../../../Helper/ErrorCode.dart';
import '../../Provider/IP_v4_Address.dart';

class FavoriteHotelsRepository {
  static final String ip = IPv4.IP_CURRENT;
  final String baseURL = "$ip/api/favorite-hotel/";

  Future<String?> _getToken() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    return prefs.getString("token");
  }

  Future<Map<String, String>> _getHeaders() async {
    String? token = await _getToken();
    return {
      "Content-Type": "application/json",
      if (token != null) "Authorization": "Bearer $token",
    };
  }

  Future<ApiResponse?> getFavoriteHotels({
    int page = 1,
    String search = "",
  }) async {
    final url = Uri.parse("$baseURL/hotels");

    try {
      final response = await http
          .get(url, headers: await _getHeaders())
          .timeout(
            Duration(seconds: 10),
            onTimeout: () {
              throw TimeoutException(
                ErrorCodes.connectionTimeout,
                Duration(seconds: 10),
              );
            },
          );

      final data = jsonDecode(response.body);
      print("API Response getFavoriteHotels: $data");

      if (response.statusCode == 200) {
        return ApiResponse(
          success: true,
          message: data["message"] ?? "Lấy danh sách yêu thích thành công",
          data: data["data"] ?? {},
        );
      } else {
        String errorMessage = _extractErrorMessage(data);
        return ApiResponse(success: false, message: errorMessage);
      }
    } on TimeoutException catch (e) {
      return ApiResponse(success: false, message: ErrorCodes.connectionTimeout);
    } on SocketException catch (e) {
      print("SocketException: $e");
      return ApiResponse(
        success: false,
        message: ErrorCodes.networkUnreachable,
      );
    } catch (e) {
      print("Lỗi lấy danh sách yêu thích: ${e}");
      return ApiResponse(success: false, message: "Lỗi kết nối! Chi tiết: $e");
    }
  }

  Future<ApiResponse?> addFavoriteHotel(
    String hotelId, {
    String ghiChu = "",
  }) async {
    final url = Uri.parse("$baseURL/add-favorite/$hotelId");

    try {
      final response = await http
          .post(
            url,
            body: jsonEncode({"ghiChu": ghiChu}),
            headers: await _getHeaders(),
          )
          .timeout(
            Duration(seconds: 10),
            onTimeout: () {
              throw TimeoutException(
                ErrorCodes.connectionTimeout,
                Duration(seconds: 10),
              );
            },
          );

      final data = jsonDecode(response.body);
      print("API Response addFavoriteHotel: $data");

      if (response.statusCode == 201) {
        return ApiResponse(
          success: true,
          message: data["message"] ?? "Đã thêm vào yêu thích",
          data: data["data"] ?? {},
        );
      } else {
        String errorMessage = _extractErrorMessage(data);
        return ApiResponse(success: false, message: errorMessage);
      }
    } on TimeoutException catch (e) {
      return ApiResponse(success: false, message: ErrorCodes.connectionTimeout);
    } on SocketException catch (e) {
      print("SocketException: $e");
      return ApiResponse(
        success: false,
        message: ErrorCodes.networkUnreachable,
      );
    } catch (e) {
      print("Lỗi thêm yêu thích: ${e}");
      return ApiResponse(success: false, message: "Lỗi kết nối! Chi tiết: $e");
    }
  }

  Future<ApiResponse?> removeFavoriteHotel(String hotelId) async {
    final url = Uri.parse("$baseURL/delete-favorite/$hotelId");

    try {
      final response = await http
          .delete(url, headers: await _getHeaders())
          .timeout(
            Duration(seconds: 10),
            onTimeout: () {
              throw TimeoutException(
                ErrorCodes.connectionTimeout,
                Duration(seconds: 10),
              );
            },
          );
      print("HotelID favorite: $hotelId");
      final data = jsonDecode(response.body);
      print("API Response removeFavoriteHotel: $data");

      if (response.statusCode == 200) {
        return ApiResponse(
          success: true,
          message: data["message"] ?? "Đã xóa khỏi yêu thích",
          data: data["data"] ?? {},
        );
      } else {
        String errorMessage = _extractErrorMessage(data);
        return ApiResponse(success: false, message: errorMessage);
      }
    } on TimeoutException catch (e) {
      return ApiResponse(success: false, message: ErrorCodes.connectionTimeout);
    } on SocketException catch (e) {
      print("SocketException: $e");
      return ApiResponse(
        success: false,
        message: ErrorCodes.networkUnreachable,
      );
    } catch (e) {
      print("Lỗi xóa yêu thích: ${e}");
      return ApiResponse(success: false, message: "Lỗi kết nối! Chi tiết: $e");
    }
  }

  Future<ApiResponse?> checkFavoriteStatus(String hotelId) async {
    final url = Uri.parse("$baseURL/hotels/$hotelId/check");

    try {
      final response = await http
          .get(url, headers: await _getHeaders())
          .timeout(
            Duration(seconds: 10),
            onTimeout: () {
              throw TimeoutException(
                ErrorCodes.connectionTimeout,
                Duration(seconds: 10),
              );
            },
          );

      final data = jsonDecode(response.body);
      print("API Response checkFavoriteStatus: $data");

      if (response.statusCode == 200) {
        return ApiResponse(
          success: true,
          message: "Kiểm tra trạng thái thành công",
          data: data["data"] ?? {},
        );
      } else {
        String errorMessage = _extractErrorMessage(data);
        return ApiResponse(success: false, message: errorMessage);
      }
    } on TimeoutException catch (e) {
      return ApiResponse(success: false, message: ErrorCodes.connectionTimeout);
    } on SocketException catch (e) {
      print("SocketException: $e");
      return ApiResponse(
        success: false,
        message: ErrorCodes.networkUnreachable,
      );
    } catch (e) {
      print("Lỗi kiểm tra yêu thích: ${e}");
      return ApiResponse(success: false, message: "Lỗi kết nối! Chi tiết: $e");
    }
  }
  String _extractErrorMessage(dynamic data) {
    try {
      if (data is Map<String, dynamic>) {
        if (data.containsKey("message")) {
          var message = data["message"];
          if (message is Map<String, dynamic> && message.containsKey("msgBody")) {
            return message["msgBody"] ?? "Lỗi không xác định";
          } else if (message is String) {
            return message;
          } else {
            return message.toString();
          }
        }
        if (data.containsKey("error") && data["error"] is String) {
          return data["error"];
        }
        return "Lỗi: ${data.toString()}";
      }
      if (data is String) {
        return data;
      }
      return "Lỗi không xác định: ${data.toString()}";
    } catch (e) {
      print("Lỗi khi extract error message: $e");
      return "Có lỗi xảy ra!";
    }
  }
}

