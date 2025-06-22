import 'dart:convert';
import 'package:doan_datphong/Data/Provider/IP_v4_Address.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class CheckLoginRepository {
  static final String ip = IPv4.IP_CURRENT;
  final String baseURL = "${ip}/api/users";

  Future<bool> checkLogin() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String? token = prefs.getString("token");
    if (token == null || token.isEmpty) {
      return false;
    }

    final url = Uri.parse("$baseURL/check-auth");
    try {
      final response = await http.get(
        url,
        headers: {
          "Authorization": "Bearer $token",
          "Content-Type": "application/json",
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data["isAuthenticated"] == true) {
          return true;
        }
      }
    } catch (e) {
      print("Lỗi khi kiểm tra đăng nhập: $e");
    }

    await prefs.remove("token");
    await prefs.remove("email");
    return false;
  }
}
