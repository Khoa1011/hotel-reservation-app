import 'dart:async';
import 'dart:convert';
import 'dart:io';

import '../../../Models/KhachSan.dart';
import 'package:http/http.dart' as http;

import '../../../Helper/ErrorCode.dart';
import '../../Provider/IP_v4_Address.dart';

class GetHotelListRepository{
  static final String ip = IPv4.IP_CURRENT;
  final String baseURL = "$ip/api/hotels";

  Future<List<KhachSan>> fetchHotels() async {
    final url = Uri.parse("$baseURL/getHotelList");
    try {
      final response = await http.get(url).timeout(
          Duration(seconds: 10),
          onTimeout: () {
             throw Exception(ErrorCodes.connectionTimeout);
          }
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['hotels'] == null) {
          throw Exception(ErrorCodes.invalidResponse);
        }
        List<dynamic> hotelsJson = data['hotels'];
        print("Danh sách khách sạn: $hotelsJson");
        return hotelsJson.map((json) => KhachSan.fromJson(json)).toList();
      } else if (response.statusCode >= 500) {
        throw Exception(ErrorCodes.serverRefused);
      } else {
        throw Exception(ErrorCodes.invalidResponse);
      }
    } on SocketException {
      throw Exception(ErrorCodes.networkUnreachable);
    } on TimeoutException {
      throw Exception(ErrorCodes.connectionTimeout);
    } catch (error) {
      throw Exception("${ErrorCodes.unknownError}|Lỗi không xác định: ${error.toString()}");
    }
  }
}