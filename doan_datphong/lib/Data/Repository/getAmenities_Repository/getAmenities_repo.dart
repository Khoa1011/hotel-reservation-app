import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:doan_datphong/Data/Provider/ApiResponse.dart';
import 'package:doan_datphong/Data/Provider/IP_v4_Address.dart';
import 'package:doan_datphong/Models/NhomTienNghi.dart';
import 'package:doan_datphong/Models/TienNghi.dart';
import 'package:http/http.dart' as http;

class GetAmenitiesRepository{
  static final String ip = IPv4.IP_CURRENT;
  final String keyAmenitiesURL = "$ip/api/amenities/key-amenities";
  final String groupedAmenitiesURL = "$ip/api/amenities/grouped-amenities";
  
  Future<List<TienNghi>> fetchAmenities(String hotelId) async{
    final url = Uri.parse("$keyAmenitiesURL/$hotelId");
    try{
      final response = await http.get(url);

      if(response.statusCode == 200){
        final data = jsonDecode(response.body);
        List<dynamic>amenitiesJson = data['keyAmenities'];
        return amenitiesJson.map((json)=>TienNghi.fromJson(json)).toList();
      }else{
        final errorData = jsonDecode(response.body);
        throw Exception("Lỗi khi lấy tiện nghi cho khách sạn: "
            "${response.statusCode} "
            "${errorData['msgBody']}");
      }
    }catch (error){
      throw Exception("Lỗi kết nối server: $error");
    }
  }


  Future<List<NhomTienNghi>> fetchAmenityCategory(String hotelId) async {

    final url = Uri.parse("$groupedAmenitiesURL/$hotelId");

    try {
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['groupedAmenities'] == null) {
          throw Exception("Dữ liệu response không đúng format");
        }

        List<dynamic> amenitiesJson = data['groupedAmenities'];
        return amenitiesJson.map((json) => NhomTienNghi.fromJson(json)).toList();

      } else {
        final errorData = jsonDecode(response.body);
        throw Exception("Lỗi API: ${response.statusCode} - ${errorData['msgBody'] ?? 'Unknown error'}");
      }

    } catch (error) {
      throw Exception("Lỗi kết nối server: $error");
    }
  }
}


