import 'dart:convert';
import 'dart:math';
import 'dart:async';
import 'dart:io';
import 'package:doan_datphong/Data/Provider/ApiResponse.dart';
import 'package:doan_datphong/Data/Provider/ErrorCode.dart';
import 'package:doan_datphong/generated/l10n.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../../Provider/IP_v4_Address.dart';

class RegisterRepository {
  static final String ip = IPv4.IP_CURRENT;
  final String baseURL = "$ip/api/users";

  Future<ApiResponse?> register(String email, String password) async {
    final url = Uri.parse("$baseURL/register");

    try {
      final response = await http.post(
        url,
        body: jsonEncode({
          "email": email,
          "matKhau": password,
        }),
        headers: {"Content-Type": "application/json"},
      ).timeout(
        Duration(seconds: 10),
        onTimeout:(){
          throw TimeoutException(ErrorCodes.connectionTimeout, Duration(seconds: 10));
        }
      );

      final data = jsonDecode(response.body);
      print("API Response: $data");

      if (response.statusCode == 200) {
        String successMessage = "Đăng ký thành công";
        if (data["message"] is Map<String, dynamic> &&
            data["message"]["msgBody"] is String) {
          successMessage = data["message"]["msgBody"];
        }

        return ApiResponse(
          success: true,
          message: successMessage,
          data: Map<String, dynamic>.from(data["user"] ?? {}),
        );
      } else if (response.statusCode == 400) {
        String errorMessage = _extractErrorMessage(data);
        return ApiResponse(success: false, message: errorMessage);
      } else {
        String errorMessage = _extractErrorMessage(data);
        return ApiResponse(success: false, message: errorMessage);
      }
    }on TimeoutException catch(e){
      return ApiResponse(success: false, message:ErrorCodes.connectionTimeout);
    }on SocketException catch(e) {
      print("SocketException: $e");
      return ApiResponse(success: false, message: ErrorCodes.networkUnreachable);
    }catch (e) {
      print("Lỗi không đăng ký được: ${e}");
      return ApiResponse(success: false, message: "Lỗi kết nối! Chi tiết: $e");
    }
  }

  String _extractErrorMessage(dynamic data) {
    try {
      // Nếu data là Map
      if (data is Map<String, dynamic>) {
        // Kiểm tra field "message" với structure { msgBody: string, msgError: boolean }
        if (data.containsKey("message")) {
          var message = data["message"];

          // Nếu message là Map với msgBody
          if (message is Map<String, dynamic> && message.containsKey("msgBody")) {
            return message["msgBody"] ?? "Lỗi không xác định";
          }
          // Nếu message là String (fallback)
          else if (message is String) {
            return message;
          }
          // Fallback: convert Map thành String
          else {
            return message.toString();
          }
        }

        // Kiểm tra các field khác (fallback)
        if (data.containsKey("error") && data["error"] is String) {
          return data["error"];
        }

        if (data.containsKey("msgBody") && data["msgBody"] is String) {
          return data["msgBody"];
        }

        // Fallback cho Map
        return "Lỗi: ${data.toString()}";
      }

      // Nếu data là String
      if (data is String) {
        return data;
      }

      // Fallback cuối cùng
      return "Lỗi không xác định: ${data.toString()}";

    } catch (e) {
      print("Lỗi khi extract error message: $e");
      return "Email đã tồn tại hoặc có lỗi xảy ra!";
    }
  }
}