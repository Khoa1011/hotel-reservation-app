import 'dart:convert';

import 'package:doan_datphong/Data/Provider/ApiResponse.dart';
import 'package:doan_datphong/Models/User.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../../Provider/IP_v4_Address.dart';


class LoginRepository{
  static final String ip = IPv4.IP_CURRENT;
  final String baseURL = "$ip/api/users";
//"http://10.0.2.2:3000/api/users";
  Future<ApiResponse?> login (String email, String password) async{
    final url = Uri.parse("$baseURL/login");
    
    try{
      final respone = await http.post(
        url,
        body: jsonEncode({"email": email, "password": password}),
        headers: {"Content-Type":"application/json"},
      ) ;

      if(respone.statusCode == 200){
        final data = jsonDecode(respone.body);
        String token = data["token"]; //Lấy token từ sever
        User user = User.fromJson(data["user"]);
        //Lưu token
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString("token", token);

        await prefs.setString("email", user.email);
        await prefs.setString("user", user.toJsonString()); // Lưu User dạng JSON

        //Trả về user nếu đăng nhập thành công
        return ApiResponse(success: true, message: "Đăng nhập thành công",data: user);
      }else if(respone.statusCode == 400) {
        return ApiResponse(success: false, message: "Email không tồn tại!");
      }else{
        return ApiResponse(success: false, message: "Lỗi server!");
      }
    }catch (e) {
      print(e);
      return ApiResponse(success: false, message: "Lỗi kết nối!. Lỗi chi tiết $e");
    }
  }

  Future<ApiResponse> isUserProfileComplete() async {
    final prefs = await SharedPreferences.getInstance();
    String? userJson = prefs.getString("user");

    if (userJson == null) {
      return ApiResponse(success: false, message: "User chưa được lưu trong bộ nhớ.");
    }

    User user = User.fromJsonString(userJson);
    if (user.userName.isEmpty) {
      return ApiResponse(success: false, message: "");
    }
    return ApiResponse(success: true, message: "");
  }
}