import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class CheckLoginRepository {
  final String baseURL = "http://192.168.100.110:3000/api/users";

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
