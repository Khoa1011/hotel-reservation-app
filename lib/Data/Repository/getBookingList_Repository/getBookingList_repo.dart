import 'dart:convert';

import 'package:doan_datphong/Models/BookingFull.dart';
import 'package:doan_datphong/Models/Bookings.dart';
import 'package:http/http.dart' as http;

import '../../Provider/IP_v4_Address.dart';

class GetBookingListRepository{
  static final String ip = IPv4.IP_CURRENT;
  final String baseURL = "$ip/api/bookings";

  Future<List<BookingWithHotel>> fetchBookings(String userId)async{
    final url = Uri.parse("$baseURL/getBookingList/$userId");
    try{
      final response = await http.get(url);
      if (response.statusCode == 200){
        final data = jsonDecode(response.body);
        List<dynamic>bookingJson = data['bookings'];
        return bookingJson.map((json) => BookingWithHotel.fromJson(json)).toList();
      }else {
        throw Exception("Lỗi khi lấy danh sách phòng đã đặt: ${response.statusCode}");
      }
    }catch (err){
      throw Exception("Lỗi kết nối server: $err");
      }
  }
}