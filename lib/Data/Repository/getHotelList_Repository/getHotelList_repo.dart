import 'dart:convert';

import '../../../Models/Hotels.dart';
import 'package:http/http.dart' as http;

import '../../Provider/IP_v4_Address.dart';

class GetHotelListRepository{
  static final String ip = IPv4.IP_CURRENT;
  final String baseURL = "$ip/api/hotels";

  Future<List<Hotels>> fetchHotels() async {
    final url = Uri.parse("$baseURL/getHotelList");
    try {
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        List<dynamic> hotelsJson = data['hotels'];
        return hotelsJson.map((json) => Hotels.fromJson(json)).toList();
      } else {
        throw Exception("Lỗi khi lấy danh sách khách sạn: ${response.statusCode}");
      }
    } catch (error) {
      throw Exception("Lỗi kết nối server: $error");
    }
  }
}