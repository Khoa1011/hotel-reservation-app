import 'dart:convert';

import 'package:doan_datphong/Data/Provider/ApiResponse.dart';
import 'package:http/http.dart' as http;
import '../../../Models/User.dart';
import '../../Provider/IP_v4_Address.dart';

class UpdateProfileRepository{
  static final String ip = IPv4.IP_CURRENT;
  final String baseURL = "$ip/api/users";

  Future<ApiResponse>UpdateProfile(User user) async{
    final url = Uri.parse("$baseURL/updateProfile");

    try{
      final response = await http.post(
          url,
        body: jsonEncode({
          "userId":user.id,
          "userName": user.userName,
          "phoneNumber": user.phoneNumber,
          "avatar":user.avatar,
          "password":user.password,
          "Dob":user.Dob,
        }),
        headers: {"Content-Type":"application/json"},
      );
      if(response.statusCode == 200){
        final jsonData = jsonDecode(response.body);
        return ApiResponse(success: true, message: "Cập nhật thông tin thành công!", data: User.fromJson(jsonData['user']));
      }else if(response.statusCode == 400){
        return ApiResponse(success: false, message: "Bắt buộc phải có id");
      }else{
        return ApiResponse(success: false, message: "Không tìm thấy tài khoản");
      }

    }catch (err){
      return ApiResponse(success: false, message: "${err}");
    }
  }

}