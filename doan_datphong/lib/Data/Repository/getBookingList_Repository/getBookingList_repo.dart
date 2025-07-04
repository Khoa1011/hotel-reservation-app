import 'dart:convert';

import 'package:doan_datphong/Models/BookingFull.dart';
import 'package:doan_datphong/Models/DonDatPhong.dart';
import 'package:http/http.dart' as http;

import '../../Provider/IP_v4_Address.dart';

class GetBookingListRepository {
  static final String ip = IPv4.IP_CURRENT;
  final String baseURL = "$ip/api/bookings";

  Future<List<BookingWithHotel>> fetchBookings(String userId) async {
    final url = Uri.parse("$baseURL/getBookingList/$userId");
    try {
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        // Kiểm tra structure của response
        if (data['success'] == true && data['data'] != null) {
          List<dynamic> bookingJson = data['data'];
          return bookingJson.map((json) => BookingWithHotel.fromJson(json)).toList();
        } else {
          throw Exception("Invalid response structure");
        }
      } else {
        throw Exception("Lỗi khi lấy danh sách phòng đã đặt: ${response.statusCode}");
      }
    } catch (err) {
      print(err);
      throw Exception("Lỗi kết nối server: $err");
    }
  }

  // Thêm method để lấy chi tiết booking
  Future<BookingDetail> fetchBookingDetail(String bookingId) async {
    final url = Uri.parse("$baseURL/getBookingDetail/$bookingId");
    try {
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['success'] == true && data['data'] != null) {
          return BookingDetail.fromJson(data['data']);
        } else {
          throw Exception("Invalid response structure");
        }
      } else {
        throw Exception("Lỗi khi lấy chi tiết booking: ${response.statusCode}");
      }
    } catch (err) {
      throw Exception("Lỗi kết nối server: $err");
    }
  }

  // Method để hủy booking
  Future<bool> cancelBooking(String bookingId, String reason) async {
    final url = Uri.parse("$baseURL/cancelBooking/$bookingId");
    try {
      final response = await http.put(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'reason': reason}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['success'] == true;
      } else {
        throw Exception("Lỗi khi hủy booking: ${response.statusCode}");
      }
    } catch (err) {
      throw Exception("Lỗi kết nối server: $err");
    }
  }
}