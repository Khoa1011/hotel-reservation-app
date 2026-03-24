import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:doan_datphong/Models/LoaiPhong.dart';
import '../../Provider/IP_v4_Address.dart';

class GetListOfRoomTypeRepository {
  static final String ip = IPv4.IP_CURRENT;
  final String baseURL = "$ip/api/hotels";

  // ✅ API chính - Enhanced search với đầy đủ thông tin
  Future<Map<String, dynamic>> searchRoomTypes({
    required String hotelId,
    required String bookingType,
    required String checkInDate,
    String? checkOutDate,
    required String checkInTime,
    String? checkOutTime,
    required Map<String, int> guests,
    required int rooms,
  }) async {
    final url = Uri.parse("$baseURL/$hotelId/search-roomtypes");

    final body = {
      "bookingType": bookingType,
      "checkInDate": checkInDate,
      "checkOutDate": checkOutDate,
      "checkInTime": checkInTime,
      "checkOutTime": checkOutTime,
      "guests": guests,
      "rooms": rooms,
    };

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 30));

      print('🔍 Search Request: ${body.toString()}');
      print('📡 Response Status: ${response.statusCode}');
      print('📄 Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        // ✅ Parse room types với error handling
        List<LoaiPhong> roomTypes = [];
        if (data['roomTypes'] != null) {
          roomTypes = (data['roomTypes'] as List)
              .map((json) {
            try {
              return LoaiPhong.fromJson(json);
            } catch (e) {
              print('❌ Error parsing room type: $e');
              return null;
            }
          })
              .where((room) => room != null)
              .cast<LoaiPhong>()
              .toList();
        }

        return {
          'success': true,
          'message': data['message'] ?? 'Tìm kiếm thành công',
          'searchInfo': data['searchInfo'] ?? {},
          'statistics': data['statistics'] ?? {},
          'roomTypes': roomTypes,
          'suggestions': data['suggestions'], // Đề xuất khi không có phòng
        };
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(jsonEncode(errorData));
      }
    } on http.ClientException catch (e) {
      throw Exception("Lỗi kết nối mạng: ${e.message}");
    } on FormatException catch (e) {
      throw Exception("Lỗi định dạng dữ liệu: ${e.message}");
    } catch (err) {
      print('❌ Repository error: $err');
      throw Exception("Lỗi không xác định: ${err.toString()}");
    }
  }

  // ✅ API đơn giản - Chỉ lấy thông tin cơ bản loại phòng
  Future<List<LoaiPhong>> getSimpleRoomTypes({
    required String hotelId,
    required String bookingType,
    required String checkInDate,
    String? checkOutDate,
    required String checkInTime,
    String? checkOutTime,
    required Map<String, int> guests,
    required int rooms,
  }) async {
    // ✅ Sử dụng lại searchRoomTypes và trả về chỉ roomTypes
    try {
      final result = await searchRoomTypes(
        hotelId: hotelId,
        bookingType: bookingType,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        checkInTime: checkInTime,
        checkOutTime: checkOutTime,
        guests: guests,
        rooms: rooms,
      );

      return result['roomTypes'] as List<LoaiPhong>;
    } catch (e) {
      print('❌ Simple room types error: $e');
      throw e; // Re-throw để BLoC xử lý
    }
  }

  // ✅ API kiểm tra nhanh availability
  Future<bool> checkRoomAvailability({
    required String hotelId,
    required String bookingType,
    required String checkInDate,
    String? checkOutDate,
    required String checkInTime,
    String? checkOutTime,
    required Map<String, int> guests,
    required int rooms,
  }) async {
    try {
      final result = await searchRoomTypes(
        hotelId: hotelId,
        bookingType: bookingType,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        checkInTime: checkInTime,
        checkOutTime: checkOutTime,
        guests: guests,
        rooms: rooms,
      );

      final roomTypes = result['roomTypes'] as List<LoaiPhong>;
      return roomTypes.isNotEmpty;
    } catch (e) {
      print('❌ Availability check error: $e');
      return false;
    }
  }

  // ✅ API lấy đề xuất khi không có phòng
  Future<Map<String, dynamic>> getRoomSuggestions({
    required String hotelId,
    required Map<String, int> guests,
    required String bookingType,
    required String checkInDate,
    String? checkOutDate,
    required String checkInTime,
    String? checkOutTime,
  }) async {
    final url = Uri.parse("$baseURL/$hotelId/room-suggestions");

    final body = {
      "guests": guests,
      "bookingType": bookingType,
      "checkInDate": checkInDate,
      "checkOutDate": checkOutDate,
      "checkInTime": checkInTime,
      "checkOutTime": checkOutTime,
    };

    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'message': data['message'],
          'totalGuests': data['totalGuests'],
          'suggestions': data['suggestions'] ?? [],
        };
      } else {
        throw Exception("Không thể lấy đề xuất");
      }
    } catch (e) {
      print('❌ Suggestions error: $e');
      return {
        'success': false,
        'message': 'Lỗi lấy đề xuất',
        'suggestions': [],
      };
    }
  }

  // ✅ API lấy chi tiết loại phòng
  Future<Map<String, dynamic>> getRoomTypeDetails({
    required String hotelId,
    required String roomTypeId,
  }) async {
    final url = Uri.parse("$baseURL/$hotelId/room-type/$roomTypeId/details");

    try {
      final response = await http.get(url).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'roomType': data['roomType'],
        };
      } else {
        throw Exception("Không thể lấy chi tiết phòng");
      }
    } catch (e) {
      print('❌ Room details error: $e');
      return {'success': false};
    }
  }
}