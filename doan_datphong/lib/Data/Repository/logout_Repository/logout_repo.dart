import 'package:doan_datphong/Data/Provider/ApiResponse.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../Provider/IP_v4_Address.dart';


class LogoutRepository {
  static final String ip = IPv4.IP_CURRENT;
  final String baseURL = "$ip/api/users";

  Future<ApiResponse> logout(String token) async {

    final url = Uri.parse("$baseURL/logout");

    try {

      SharedPreferences prefs = await SharedPreferences.getInstance();
      String? token = prefs.getString("token");
      print("kiem tra token: ${token}");
      if(token == null){
        return ApiResponse(success: false, message: "Chưa đăng nhập!");
      }
      final response = await http.get(
        url,
        headers: {
          "Authorization": "Bearer $token",
          "Content-Type": "application/json"
        },
      );

      if (response.statusCode == 200) {
        await prefs.remove("token");

        return ApiResponse(success: true, message: "Đăng xuất thành công!");
      } else {
        print("response body ${response.body}");
        print("response message ${response.statusCode}");
        return ApiResponse(success: false, message: "Đăng xuất không thành công! Status: ${response.statusCode}, Body: ${response.body}");
      }
    } catch (e) {
      return ApiResponse(success: false, message: "Lỗi kết nối đến server: $e");
    }
  }
}