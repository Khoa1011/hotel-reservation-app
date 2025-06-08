import 'dart:convert';

import 'package:doan_datphong/Data/Provider/ApiResponse.dart';
import 'package:doan_datphong/Models/Bookings.dart';
import 'package:http/http.dart' as http;
import '../../Provider/IP_v4_Address.dart';

class PaymentRepository{
  static final String ip = IPv4.IP_CURRENT;
  final String baseURL = "$ip/api/bookings";

  Future<ApiResponse> payment(Booking booking) async{
    final url = Uri.parse("$baseURL/addbooking");
    try{
      final respone = await http.post(
        url,
        body: jsonEncode({
          "userId":booking.booking_UserId,
          "hotelsId":booking.booking_HotelId,
          "roomId":booking.booking_RoomId,
          "checkInDate":booking.booking_CheckInDate,
          "checkOutDate":booking.booking_CheckOutDate,
          "checkInTime":booking.booking_CheckInTime,
          "checkOutTime":booking.booking_CheckOutTime,
          "totalAmount":booking.booking_totalAmount,
          "status":booking.getStatusString(),
          "paymentMethod":booking.getPaymentMethodString()
        }),
        headers: {"Content-Type":"application/json"},
      );
      if (respone.statusCode == 201){
        final jsonData = jsonDecode(respone.body);
        return ApiResponse(success: true, message: "Successful booking",data: Booking.fromJson(jsonData['booking']));
      }
      return ApiResponse(success: false, message: "Failure booking");
    }catch(err){
      print("$err");
      return ApiResponse(success: false, message: "Lỗi server! $err",);
    }
  }
}