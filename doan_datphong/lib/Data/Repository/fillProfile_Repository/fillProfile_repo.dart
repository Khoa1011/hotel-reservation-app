import 'dart:convert';

import 'package:doan_datphong/Data/Provider/ApiResponse.dart';
import 'package:doan_datphong/Data/Provider/IP_v4_Address.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../../../Models/NguoiDung.dart';

class FillProfileRepository{
  static final String ip = IPv4.IP_CURRENT;
  final String baseURL = "$ip/api/users";
  Future<ApiResponse> fillProfile(NguoiDung user)async{
    final url = Uri.parse("$baseURL/updateUser");
    try{
      final response = await http.post(
          url,
        body: jsonEncode({
          "maNguoiDung": user.id,
          "tenNguoiDung": user.tenNguoiDung,
          "ngaySinh":user.ngaySinh?.toIso8601String(),
          "gioiTinh":user.gioiTinh,
          "soDienThoai": user.soDienThoai,
          "hinhDaiDien":user.hinhDaiDien,
          "viTri":user.viTri?.toJson()
        }),
        headers: {
            "Content-Type":"application/json"},
      );
      if (response.statusCode == 200) {
        final jsonData = jsonDecode(response.body);
        NguoiDung updatedUser = NguoiDung.fromJson(jsonData['user']);
        SharedPreferences prefs = await SharedPreferences.getInstance();
        await prefs.setString("user", updatedUser.toJsonString());
        return ApiResponse(success: true, message: "Cập nhật tài khoản thành công!", data: NguoiDung.fromJson(jsonData['user']));
      }else if(response.statusCode == 400){
        return ApiResponse(success: false, message: "Bắt buộc phải có id");
      }else{
        return ApiResponse(success: false, message: "Không tìm thấy tài khoản");
      }
    }catch(err){
      return ApiResponse(success: false, message: "${err}");
    }
  }

}