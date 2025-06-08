import 'dart:convert';
import 'package:doan_datphong/Data/Provider/ApiResponse.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../../Provider/IP_v4_Address.dart';

class RegisterRepository {
  static final String ip = IPv4.IP_CURRENT;
  final String baseURL = "$ip/api/users";
  //"http://10.0.2.2:3000/api/users"; // Dùng khi test trên emulator

  Future<ApiResponse?> register(String email, String password) async {
    final url = Uri.parse("$baseURL/register");

    try {
      final response = await http.post(
        url,
        body: jsonEncode({
          "email": email,
          "password": password,
        }),
        headers: {"Content-Type": "application/json"},
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
          return ApiResponse(
            success: true,
            message: "Đăng ký thành công",
            data: Map<String, dynamic>.from(data["user"]),
          );
      } else if (response.statusCode == 400) {
        return ApiResponse(success: false, message: data["message"] ?? "Email đã tồn tại!");
      } else {
        return ApiResponse(success: false, message: data["message"] ?? "Lỗi server!");
      }
    } catch (e) {
      return ApiResponse(success: false, message: "Lỗi kết nối! Chi tiết: $e");
    }
  }
}
