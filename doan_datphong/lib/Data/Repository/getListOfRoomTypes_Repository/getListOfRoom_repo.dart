import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../Models/Room.dart';
import '../../Provider/IP_v4_Address.dart';


class GetListOfRoomRepository {
  static final String ip = IPv4.IP_CURRENT;
  final String baseURL = "$ip/api/hotels";

  Future<List<Room>> getListOfRoom(String idHotel, String checkInDate, String checkOutDate,
  ) async {
    final url = Uri.parse(
      "$baseURL/$idHotel/rooms?checkInDate=$checkInDate&checkOutDate=$checkOutDate",
    );

    try {
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        List<dynamic> roomJson = data['rooms'];
        return roomJson.map((json) => Room.fromJson(json)).toList();
      } else {
        throw Exception("Lỗi khi lấy danh sách phòng: ${response.statusCode}");
      }
    } catch (err) {
      print('Network error: $err');
      throw Exception("Server error when fetching room list: ${err.toString()}");
    }
  }
}