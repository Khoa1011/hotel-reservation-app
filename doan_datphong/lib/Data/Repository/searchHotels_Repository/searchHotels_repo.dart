import 'dart:convert';
import 'package:doan_datphong/Data/Provider/ApiResponse.dart';
import 'package:doan_datphong/Models/KhachSan.dart';
import 'package:http/http.dart' as http;
import '../../../Models/SearchInfo.dart';
import '../../Provider/IP_v4_Address.dart';

class HotelSearchRepository {
  static final String ip = IPv4.IP_CURRENT;
  final String baseURL = "$ip/api/filter";

  // Tìm kiếm khách sạn
  Future<ApiResponse> searchHotels({
    String? loaiLoc, // Lọc All hotel, Recommended, Popular, Trending
    String? tenKhachSan,

    // ===== ĐỊA ĐIỂM (CHỈ SỬA TÊN THEO API MỚI) =====
    String? thanhPho,     // API: thanhPho (trước đây là tinhThanh)
    String? quan,         // API: quan (trước đây là phuongXa)

    // ===== GIÁ CẢ =====
    double? minPrice,     // API: minPrice (VND)
    double? maxPrice,     // API: maxPrice (VND)

    // ===== SỨC CHỨA =====
    int? guests,          // API: guests
    int? rooms,           // API: rooms

    // ===== NGÀY & LOẠI ĐẶT PHÒNG =====
    String? checkIn,      // API: checkIn (YYYY-MM-DD)
    String? checkOut,     // API: checkOut (YYYY-MM-DD)
    String? bookingType,  // API: bookingType ('theo_gio', 'qua_dem', 'dai_ngay')
  }) async {
    try {
      // ✅ BUILD QUERY PARAMETERS - CHỈ SỬA TÊN PARAMETER
      Map<String, String> queryParams = {};

      if (tenKhachSan != null && tenKhachSan.isNotEmpty) {
        queryParams['keyword'] = tenKhachSan;
        print('🔍 DEBUG: Adding tenKhachSan = $tenKhachSan');
      }

      // ✅ CHỈ SỬA: Đổi tên parameter theo API mới
      if (thanhPho != null && thanhPho.trim().isNotEmpty) {
        queryParams['thanhPho'] = thanhPho.trim();
        print('🔍 DEBUG: Adding thanhPho = $thanhPho');
      }

      if (quan != null && quan.trim().isNotEmpty) {
        queryParams['quan'] = quan.trim();
        print('🔍 DEBUG: Adding quan = $quan');
      }

      // Giá cả (VND)
      if (minPrice != null && minPrice > 0) {
        queryParams['minPrice'] = minPrice.toInt().toString();
        print('🔍 DEBUG: Adding minPrice = ${minPrice.toInt()}');
      }

      if (maxPrice != null && maxPrice > 0) {
        queryParams['maxPrice'] = maxPrice.toInt().toString();
        print('🔍 DEBUG: Adding maxPrice = ${maxPrice.toInt()}');
      }

      // Sức chứa
      if (guests != null && guests > 0) {
        queryParams['guests'] = guests.toString();
        print('🔍 DEBUG: Adding guests = $guests');
      }

      if (rooms != null && rooms > 0) {
        queryParams['rooms'] = rooms.toString();
        print('🔍 DEBUG: Adding rooms = $rooms');
      }

      // Ngày và loại đặt phòng
      if (checkIn != null && checkIn.isNotEmpty) {
        queryParams['checkIn'] = checkIn;
        print('🔍 DEBUG: Adding checkIn = $checkIn');
      }

      if (checkOut != null && checkOut.isNotEmpty) {
        queryParams['checkOut'] = checkOut;
        print('🔍 DEBUG: Adding checkOut = $checkOut');
      }

      if (bookingType != null && bookingType.isNotEmpty) {
        queryParams['bookingType'] = bookingType;
        print('🔍 DEBUG: Adding bookingType = $bookingType');
      }

      // ✅ TẠO URL
      String baseUrl = "$baseURL/search";
      Uri uri = Uri.parse(baseUrl).replace(queryParameters: queryParams);
      print('🔍 FINAL SEARCH URL: $uri');

      // ✅ GỬI REQUEST
      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ).timeout(Duration(seconds: 30));

      print('🔍 Response Status: ${response.statusCode}');
      print('🔍 Response Body Length: ${response.body.length}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('🔍 Response Data Keys: ${data.keys.toList()}');

        if (data['hotels'] != null) {
          print('🔍 Hotels Found: ${data['hotels'].length}');
        }

        List<dynamic> hotelJson = data['hotels'];
        print("Danh sách khách sạn khi tìm kiếm: $hotelJson");
        return ApiResponse(
            success: true,
            message: data["message"],
            data: hotelJson.map((json) => KhachSan.fromJson(json)).toList()
        );
      } else {
        print('❌ HTTP Error: ${response.statusCode} - ${response.body}');
        final data = jsonDecode(response.body);
        return ApiResponse(success: false, message: data["message"]);
      }
    } catch (err) {
      print("❌ Search Repository Error: $err");
      throw Exception("Lỗi kết nối server: $err");
    }
  }

  // ✅ Lấy gợi ý địa điểm - GIỮ NGUYÊN
  Future<SuggestionsResponse> getSearchSuggestions({
    required String query,
    String type = 'all',
    int limit = 10,
  }) async {
    final uri = Uri.parse("$ip/api/search/locations").replace(queryParameters: {
      'q': query,
      'type': type,
    });

    try {
      print('🎯 Suggestions URL: $uri');

      final response = await http.get(uri);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        // ✅ Convert API response to expected format
        final suggestions = (data['suggestions'] as List?)?.map((item) {
          return SearchSuggestion(
            type: item['type'] ?? 'location',
            title: item['name'] ?? '',
            subtitle: item['province'] ?? item['name'] ?? '',
            value: item['name'] ?? '',
            count: item['count'],
          );
        }).toList() ?? [];

        return SuggestionsResponse(
          suggestions: suggestions,
          query: query,
          total: suggestions.length,
        );
      } else {
        throw Exception("Lỗi khi lấy gợi ý: ${response.statusCode}");
      }
    } catch (err) {
      print("Suggestions error: $err");
      throw Exception("Lỗi kết nối server: $err");
    }
  }
}