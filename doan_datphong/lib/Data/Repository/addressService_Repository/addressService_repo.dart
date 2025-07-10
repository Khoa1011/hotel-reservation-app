import 'package:http/http.dart' as http;
import 'dart:convert';

// ✅ CẬP NHẬT: Province model theo esgoo.net API
class Province {
  final String id;
  final String name;
  final String nameEn;

  Province({required this.id, required this.name, required this.nameEn});

  factory Province.fromJson(Map<String, dynamic> json) {
    return Province(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      nameEn: json['name_en'] ?? '',
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Province && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}

// ✅ CẬP NHẬT: District model theo esgoo.net API
class District {
  final String id;
  final String name;
  final String nameEn;

  District({required this.id, required this.name, required this.nameEn});

  factory District.fromJson(Map<String, dynamic> json) {
    return District(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      nameEn: json['name_en'] ?? '',
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is District && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}

// ✅ CẬP NHẬT: Ward model theo esgoo.net API
class Ward {
  final String id;
  final String name;
  final String nameEn;

  Ward({required this.id, required this.name, required this.nameEn});

  factory Ward.fromJson(Map<String, dynamic> json) {
    return Ward(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      nameEn: json['name_en'] ?? '',
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Ward && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}

class AddressService {
  // ✅ CẬP NHẬT: Sử dụng esgoo.net API
  static const String baseUrl = 'https://esgoo.net/api-tinhthanh';

  // ✅ Lấy danh sách tỉnh/thành phố
  static Future<List<Province>> getProvinces() async {
    try {
      print('🌐 Đang tải danh sách tỉnh/thành phố từ esgoo.net...');

      final response = await http.get(
        Uri.parse('$baseUrl/1/0.htm'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      ).timeout(Duration(seconds: 15));

      print('📡 Response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final responseBody = utf8.decode(response.bodyBytes);
        Map<String, dynamic> result = json.decode(responseBody);

        if (result['error'] == 0 && result['data'] != null) {
          List<dynamic> data = result['data'];
          print('✅ Tải thành công ${data.length} tỉnh/thành phố');

          List<Province> provinces = data.map((provinceData) {
            return Province.fromJson(provinceData);
          }).toList();

          return provinces;
        } else {
          throw Exception('API trả về lỗi: ${result['error_text'] ?? 'Unknown error'}');
        }
      } else {
        throw Exception('HTTP ${response.statusCode}: ${response.reasonPhrase}');
      }
    } catch (e) {
      print('❌ Lỗi tải từ esgoo.net: $e');
      throw Exception('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.');
    }
  }

  // ✅ Lấy danh sách quận/huyện theo tỉnh/thành phố
  static Future<List<District>> getDistricts(String provinceId) async {
    try {
      print('🌐 Đang tải quận/huyện cho tỉnh ID: $provinceId');

      final response = await http.get(
        Uri.parse('$baseUrl/2/$provinceId.htm'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      ).timeout(Duration(seconds: 15));

      print('📡 Districts response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final responseBody = utf8.decode(response.bodyBytes);
        Map<String, dynamic> result = json.decode(responseBody);

        if (result['error'] == 0 && result['data'] != null) {
          List<dynamic> data = result['data'];
          print('✅ Tải thành công ${data.length} quận/huyện');

          List<District> districts = data.map((districtData) {
            return District.fromJson(districtData);
          }).toList();

          return districts;
        } else {
          throw Exception('API districts trả về lỗi: ${result['error_text'] ?? 'Unknown error'}');
        }
      } else if (response.statusCode == 404) {
        print('⚠️ Không tìm thấy dữ liệu quận/huyện cho tỉnh ID: $provinceId');
        return []; // Return empty list if no districts found
      } else {
        throw Exception('HTTP ${response.statusCode}: ${response.reasonPhrase}');
      }
    } catch (e) {
      print('❌ Lỗi tải quận/huyện: $e');
      throw Exception('Không thể tải danh sách quận/huyện. Vui lòng thử lại.');
    }
  }

  // ✅ Lấy danh sách phường/xã theo quận/huyện (nếu cần)
  static Future<List<Ward>> getWards(String districtId) async {
    try {
      print('🌐 Đang tải phường/xã cho quận/huyện ID: $districtId');

      final response = await http.get(
        Uri.parse('$baseUrl/3/$districtId.htm'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      ).timeout(Duration(seconds: 15));

      print('📡 Wards response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final responseBody = utf8.decode(response.bodyBytes);
        Map<String, dynamic> result = json.decode(responseBody);

        if (result['error'] == 0 && result['data'] != null) {
          List<dynamic> data = result['data'];
          print('✅ Tải thành công ${data.length} phường/xã');

          List<Ward> wards = data.map((wardData) {
            return Ward.fromJson(wardData);
          }).toList();

          return wards;
        } else {
          throw Exception('API wards trả về lỗi: ${result['error_text'] ?? 'Unknown error'}');
        }
      } else if (response.statusCode == 404) {
        print('⚠️ Không tìm thấy dữ liệu phường/xã cho quận/huyện ID: $districtId');
        return []; // Return empty list if no wards found
      } else {
        throw Exception('HTTP ${response.statusCode}: ${response.reasonPhrase}');
      }
    } catch (e) {
      print('❌ Lỗi tải phường/xã: $e');
      throw Exception('Không thể tải danh sách phường/xã. Vui lòng thử lại.');
    }
  }

  // ✅ HELPER: Tìm tỉnh theo tên
  static Future<Province?> findProvinceByName(String provinceName) async {
    try {
      final provinces = await getProvinces();
      for (var province in provinces) {
        if (province.name.toLowerCase().contains(provinceName.toLowerCase()) ||
            province.nameEn.toLowerCase().contains(provinceName.toLowerCase())) {
          return province;
        }
      }
      return null;
    } catch (e) {
      print('❌ Lỗi tìm tỉnh theo tên: $e');
      return null;
    }
  }

  // ✅ HELPER: Tìm quận/huyện theo tên trong tỉnh
  static Future<District?> findDistrictByName(String provinceId, String districtName) async {
    try {
      final districts = await getDistricts(provinceId);
      for (var district in districts) {
        if (district.name.toLowerCase().contains(districtName.toLowerCase()) ||
            district.nameEn.toLowerCase().contains(districtName.toLowerCase())) {
          return district;
        }
      }
      return null;
    } catch (e) {
      print('❌ Lỗi tìm quận/huyện theo tên: $e');
      return null;
    }
  }

  // ✅ HELPER: Lấy địa chỉ đầy đủ
  static Future<String> getFullAddress({
    String? wardName,
    String? districtName,
    String? provinceName,
  }) async {
    List<String> addressParts = [];

    if (wardName != null && wardName.isNotEmpty) {
      addressParts.add(wardName);
    }
    if (districtName != null && districtName.isNotEmpty) {
      addressParts.add(districtName);
    }
    if (provinceName != null && provinceName.isNotEmpty) {
      addressParts.add(provinceName);
    }

    return addressParts.join(', ');
  }
}