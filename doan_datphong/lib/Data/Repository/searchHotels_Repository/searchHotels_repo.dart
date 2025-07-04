import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../Models/SearchInfo.dart';
import '../../Provider/IP_v4_Address.dart';

class HotelSearchRepository {
  static final String ip = IPv4.IP_CURRENT;
  final String baseURL = "$ip/api/filter";

  // Tìm kiếm khách sạn
  Future<HotelSearchResponse> searchHotels({
    String? keyword,
    String? city,
    String? district,
    double? minPrice,
    double? maxPrice,
    int? minStars,
    int? maxStars,
    List<String>? hotelTypes,
    List<String>? amenities,
    int? guests,
    int? rooms,
    String? checkIn,
    String? checkOut,
    String? bookingType,
    String? sortBy,
    int page = 1,
    int limit = 10,
    bool? hasAvailability,
  }) async {
    try {
      // 🔍 BUILD QUERY PARAMETERS - QUAN TRỌNG: KIỂM TRA KỸ TỪNG PARAM
      Map<String, String> queryParams = {
        'page': page.toString(),
        'limit': limit.toString(),
      };

      // === LỖI THƯỜNG GẶP: KHÔNG KIỂM TRA NULL VÀ EMPTY ===
      if (keyword != null && keyword.trim().isNotEmpty) {
        queryParams['keyword'] = keyword.trim();
        print('🔍 DEBUG: Adding keyword = $keyword');
      }

      if (city != null && city.trim().isNotEmpty) {
        queryParams['city'] = city.trim();
        print('🔍 DEBUG: Adding city = $city');
      }

      if (district != null && district.trim().isNotEmpty) {
        queryParams['district'] = district.trim();
        print('🔍 DEBUG: Adding district = $district');
      }

      // === FIX: KIỂM TRA GIÁ TRỊ HỢP LỆ CHO SỐ ===
      if (minPrice != null && minPrice > 0) {
        queryParams['minPrice'] = minPrice.toString();
        print('🔍 DEBUG: Adding minPrice = $minPrice');
      }

      if (maxPrice != null && maxPrice > 0) {
        queryParams['maxPrice'] = maxPrice.toString();
        print('🔍 DEBUG: Adding maxPrice = $maxPrice');
      }

      // === FIX: XỬ LÝ STAR RATING ===
      if (minStars != null && minStars > 0) {
        queryParams['minStars'] = minStars.toString();
        print('🔍 DEBUG: Adding minStars = $minStars');
      }

      if (maxStars != null && maxStars > 0) {
        queryParams['maxStars'] = maxStars.toString();
        print('🔍 DEBUG: Adding maxStars = $maxStars');
      }

      if (guests != null && guests > 0) {
        queryParams['guests'] = guests.toString();
        print('🔍 DEBUG: Adding guests = $guests');
      }

      if (rooms != null && rooms > 0) {
        queryParams['rooms'] = rooms.toString();
        print('🔍 DEBUG: Adding rooms = $rooms');
      }

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

      if (sortBy != null && sortBy.isNotEmpty) {
        queryParams['sortBy'] = sortBy;
        print('🔍 DEBUG: Adding sortBy = $sortBy');
      }

      if (hasAvailability != null) {
        queryParams['hasAvailability'] = hasAvailability.toString();
        print('🔍 DEBUG: Adding hasAvailability = $hasAvailability');
      }

      // === FIX: XỬ LÝ ARRAYS ĐÚNG CÁCH ===
      String baseUrl = "$baseURL/search";
      Uri uri = Uri.parse(baseUrl).replace(queryParameters: queryParams);
      String finalUrl = uri.toString();

      // Thêm hotel types - QUAN TRỌNG: PHẢI ESCAPE ĐÚNG
      if (hotelTypes != null && hotelTypes.isNotEmpty) {
        final validTypes = hotelTypes.where((type) => type.isNotEmpty).toList();
        if (validTypes.isNotEmpty) {
          print('🔍 DEBUG: Adding hotelTypes = $validTypes');
          for (String type in validTypes) {
            final encodedType = Uri.encodeComponent(type);
            finalUrl += finalUrl.contains('?') ? '&' : '?';
            finalUrl += 'hotelTypes=$encodedType';
          }
        }
      }

      // Thêm amenities
      if (amenities != null && amenities.isNotEmpty) {
        final validAmenities = amenities.where((amenity) => amenity.isNotEmpty).toList();
        if (validAmenities.isNotEmpty) {
          print('🔍 DEBUG: Adding amenities = $validAmenities');
          for (String amenity in validAmenities) {
            final encodedAmenity = Uri.encodeComponent(amenity);
            finalUrl += finalUrl.contains('?') ? '&' : '?';
            finalUrl += 'amenities=$encodedAmenity';
          }
        }
      }

      uri = Uri.parse(finalUrl);
      print('🔍 FINAL SEARCH URL: $uri');

      // === GỬI REQUEST VỚI HEADERS ĐẦY ĐỦ ===
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

        if (data['statistics'] != null) {
          final stats = data['statistics'];
          print('🔍 Statistics hotelTypes: ${stats['hotelTypes']} (${stats['hotelTypes'].runtimeType})');
          print('🔍 Statistics cities: ${stats['cities']} (${stats['cities'].runtimeType})');
          print('🔍 Statistics districts: ${stats['districts']} (${stats['districts'].runtimeType})');
        }

        if (data['hotels'] != null) {
          print('🔍 Hotels Found: ${data['hotels'].length}');
        }

        // ✅ FIX: Sanitize response data trước khi parse
        final sanitizedData = _sanitizeResponseData(data);
        print('🔧 Data sanitized successfully');

        return HotelSearchResponse.fromJson(sanitizedData);
      } else {
        print('❌ HTTP Error: ${response.statusCode} - ${response.body}');
        throw Exception("HTTP ${response.statusCode}: ${response.reasonPhrase}");
      }
    } catch (err) {
      print("❌ Search Repository Error: $err");
      print("❌ Error type: ${err.runtimeType}");
      throw Exception("Lỗi kết nối server: $err");
    }
  }

  // ✅ THÊM: Sanitize response data method
  Map<String, dynamic> _sanitizeResponseData(Map<String, dynamic> data) {
    try {
      final sanitized = Map<String, dynamic>.from(data);

      // Fix statistics field
      if (sanitized['statistics'] != null) {
        final stats = Map<String, dynamic>.from(sanitized['statistics']);

        // Convert string to array for these fields
        _fixArrayField(stats, 'hotelTypes');
        _fixArrayField(stats, 'cities');
        _fixArrayField(stats, 'districts');

        sanitized['statistics'] = stats;
        print('🔧 Fixed statistics arrays');
      }

      // Fix searchInfo filters
      if (sanitized['searchInfo'] != null && sanitized['searchInfo']['filters'] != null) {
        final searchInfo = Map<String, dynamic>.from(sanitized['searchInfo']);
        final filters = Map<String, dynamic>.from(searchInfo['filters']);

        _fixArrayField(filters, 'hotelTypes');
        _fixArrayField(filters, 'amenities');

        searchInfo['filters'] = filters;
        sanitized['searchInfo'] = searchInfo;
        print('🔧 Fixed searchInfo filters');
      }

      // Fix suggestions if present
      if (sanitized['suggestions'] != null && sanitized['suggestions'] is! List) {
        sanitized['suggestions'] = [];
        print('🔧 Fixed suggestions field');
      }

      return sanitized;
    } catch (e) {
      print('❌ Error sanitizing data: $e');
      return data; // Return original if sanitization fails
    }
  }

  // ✅ THÊM: Helper method to fix array fields
  void _fixArrayField(Map<String, dynamic> obj, String fieldName) {
    if (obj[fieldName] == null) {
      obj[fieldName] = [];
      print('🔧 Fixed $fieldName: null → []');
    } else if (obj[fieldName] is String) {
      final stringValue = obj[fieldName] as String;
      if (stringValue.isEmpty) {
        obj[fieldName] = [];
        print('🔧 Fixed $fieldName: empty string → []');
      } else {
        // Try to parse as JSON array first
        try {
          final parsed = jsonDecode(stringValue);
          if (parsed is List) {
            obj[fieldName] = parsed.map((item) => item.toString()).toList();
            print('🔧 Fixed $fieldName: JSON string → List(${parsed.length})');
          } else {
            obj[fieldName] = [stringValue];
            print('🔧 Fixed $fieldName: single string → [string]');
          }
        } catch (e) {
          // If not JSON, treat as single item or comma-separated
          if (stringValue.contains(',')) {
            obj[fieldName] = stringValue.split(',').map((s) => s.trim()).toList();
            print('🔧 Fixed $fieldName: CSV string → List');
          } else {
            obj[fieldName] = [stringValue];
            print('🔧 Fixed $fieldName: single string → [string]');
          }
        }
      }
    } else if (obj[fieldName] is! List) {
      obj[fieldName] = [obj[fieldName].toString()];
      print('🔧 Fixed $fieldName: ${obj[fieldName].runtimeType} → [string]');
    } else {
      print('🔧 Field $fieldName is already List with ${obj[fieldName].length} items');
    }
  }

  // Lấy gợi ý tìm kiếm
  Future<SuggestionsResponse> getSearchSuggestions({
    required String query,
    String type = 'all',
    int limit = 10,
  }) async {
    final uri = Uri.parse("$baseURL/suggestions").replace(queryParameters: {
      'q': query,
      'type': type,
      'limit': limit.toString(),
    });

    try {
      print('🎯 Suggestions URL: $uri');

      final response = await http.get(uri);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return SuggestionsResponse.fromJson(data);
      } else {
        throw Exception("Lỗi khi lấy gợi ý: ${response.statusCode}");
      }
    } catch (err) {
      print("Suggestions error: $err");
      throw Exception("Lỗi kết nối server: $err");
    }
  }

  // Lấy filter options
  Future<FilterOptions> getFilterOptions({
    String? city,
    String? district,
  }) async {
    Map<String, String> queryParams = {};
    if (city != null && city.isNotEmpty) {
      queryParams['city'] = city;
    }
    if (district != null && district.isNotEmpty) {
      queryParams['district'] = district;
    }

    final uri = Uri.parse("$baseURL/filter-options").replace(queryParameters: queryParams);

    try {
      print('⚙️ Filter options URL: $uri');

      final response = await http.get(uri);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return FilterOptions.fromJson(data);
      } else {
        throw Exception("Lỗi khi lấy filter options: ${response.statusCode}");
      }
    } catch (err) {
      print("Filter options error: $err");
      throw Exception("Lỗi kết nối server: $err");
    }
  }
}