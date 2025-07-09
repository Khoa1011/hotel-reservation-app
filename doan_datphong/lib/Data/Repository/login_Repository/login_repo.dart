import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:doan_datphong/Data/Provider/ApiResponse.dart';
import 'package:doan_datphong/Models/NguoiDung.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../../../Helper/ErrorCode.dart';
import '../../Provider/IP_v4_Address.dart';


class LoginRepository{
  static final String ip = IPv4.IP_CURRENT;
  final String baseURL = "$ip/api/users";
//"http://10.0.2.2:3000/api/users";
  Future<ApiResponse> login (String email, String password) async{
    final url = Uri.parse("$baseURL/login");
    
    try{
      final respone = await http.post(
        url,
        body: jsonEncode({"email": email, "matKhau": password}),
        headers: {"Content-Type":"application/json"},
      ).timeout(
          Duration(seconds: 10),
          onTimeout:() {
            print("Lỗi Timeout");
            throw TimeoutException(

                ErrorCodes.connectionTimeout, Duration(seconds: 10));
          });

      if(respone.statusCode == 200){
        final data = jsonDecode(respone.body);
        String token = data["token"]; //Lấy token từ sever

        NguoiDung user = NguoiDung.fromJson(data["user"]);
        //Lưu token
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString("token", token);
        await prefs.setString("_id", user.id);

        print("Token trong login_repo: ${token}");
        await prefs.setString("email", user.email);
        await prefs.setString("user", user.toJsonString());

        //Trả về user nếu đăng nhập thành công
        return ApiResponse(success: true, message: "Đăng nhập thành công",data: user);
      }else if(respone.statusCode == 400) {
        print("Lỗi 400");
        return ApiResponse(success: false, message: ErrorCodes.emailNotExists);
      }else if (respone.statusCode == 401) {
        print("Lỗi 401");
        return ApiResponse(success: false, message: ErrorCodes.passwordIncorrect);
      }
      else{
        print("Lỗi server");
        return ApiResponse(success: false, message: "Lỗi server!");
      }
    }on TimeoutException catch(e){
      return ApiResponse(success: false, message:ErrorCodes.connectionTimeout);
    }on SocketException catch(e) {
      print("SocketException: $e");
      print("Lỗi Mạng");
      return ApiResponse(

          success: false, message: ErrorCodes.networkUnreachable);
    }catch (e) {
      print("Lỗi 500: $e");
      return ApiResponse(success: false, message: "Lỗi kết nối!. Lỗi chi tiết $e");
    }
  }

  Future<ApiResponse> isUserProfileComplete() async {
    final prefs = await SharedPreferences.getInstance();
    String? userJson = prefs.getString("user");

    if (userJson == null) {
      return ApiResponse(success: false, message: "User chưa được lưu trong bộ nhớ.");
    }

    NguoiDung user = NguoiDung.fromJsonString(userJson);
    if (user.tenNguoiDung.isEmpty) {
      return ApiResponse(success: false, message: "");
    }
    return ApiResponse(success: true, message: "");
  }
}