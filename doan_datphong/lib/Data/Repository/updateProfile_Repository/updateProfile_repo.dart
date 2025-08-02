import 'dart:convert';
import 'package:doan_datphong/Data/Provider/ApiResponse.dart';
import 'package:http/http.dart' as http;
import '../../../Models/NguoiDung.dart';
import '../../Provider/IP_v4_Address.dart';

class UpdateProfileRepository {
  static final String ip = IPv4.IP_CURRENT;
  final String baseURL = "$ip/api/users";

  Future<ApiResponse> UpdateProfile(NguoiDung user) async {
    final url = Uri.parse("$baseURL/updateProfile");

    try {
      // ✅ SỬA: Đổi tên fields cho khớp với backend
      final requestBody = {
        "maNguoiDung": user.id, // ✅ Backend expect "maNguoiDung" not "userId"
        "tenNguoiDung": user.tenNguoiDung, // ✅ Backend expect "tenNguoiDung" not "userName"
        "soDienThoai": user.soDienThoai, // ✅ Backend expect "soDienThoai" not "phoneNumber"
        "hinhDaiDien": user.hinhDaiDien, // ✅ Backend expect "hinhDaiDien" not "avatar"
        "ngaySinh": user.ngaySinh?.toIso8601String(), // ✅ Backend expect "ngaySinh" not "Dob"
        "gioiTinh": user.gioiTinh, // ✅ THÊM: Backend cần field này
      };

      // ✅ THÊM: Chỉ gửi password nếu có
      if (user.matKhau != null && user.matKhau!.isNotEmpty) {
        requestBody["matKhau"] = user.matKhau!;
      }

      // ✅ THÊM: Gửi thông tin địa chỉ nếu có
      if (user.viTri != null) {
        requestBody["viTri"] = {
          "thanhPho": user.viTri!.thanhPho,
          "quan": user.viTri!.quan,
          "phuong": user.viTri!.phuong,
          "soNha": user.viTri!.soNha,
          "quocGia": "Việt Nam",
        };
      }

      print('🔍 DEBUG UpdateProfile request:');
      print('URL: $url');
      print('Body: ${jsonEncode(requestBody)}');

      final response = await http.post(
        url,
        body: jsonEncode(requestBody),
        headers: {"Content-Type": "application/json"},
      );

      print('🔍 DEBUG UpdateProfile response:');
      print('Status: ${response.statusCode}');
      print('Body: ${response.body}');

      if (response.statusCode == 200) {
        final jsonData = jsonDecode(response.body);

        // ✅ Kiểm tra response format
        if (jsonData['message'] != null && !jsonData['message']['msgError']) {
          return ApiResponse(
              success: true,
              message: jsonData['message']['msgBody'] ?? "Cập nhật thông tin thành công!",
              data: NguoiDung.fromJson(jsonData['user'])
          );
        } else {
          return ApiResponse(
              success: false,
              message: jsonData['message']['msgBody'] ?? "Cập nhật thất bại"
          );
        }
      } else if (response.statusCode == 400) {
        final jsonData = jsonDecode(response.body);
        return ApiResponse(
            success: false,
            message: jsonData['message']['msgBody'] ?? "Dữ liệu không hợp lệ"
        );
      } else if (response.statusCode == 404) {
        return ApiResponse(
            success: false,
            message: "Không tìm thấy tài khoản"
        );
      } else {
        final jsonData = jsonDecode(response.body);
        return ApiResponse(
            success: false,
            message: jsonData['message']['msgBody'] ?? "Có lỗi xảy ra"
        );
      }

    } catch (err) {
      print('❌ UpdateProfile error: $err');
      return ApiResponse(
          success: false,
          message: "Lỗi kết nối: ${err.toString()}"
      );
    }
  }
}