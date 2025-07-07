import 'package:http/http.dart' as http;
import 'dart:convert';

class Province {
  final String code;
  final String name;

  Province({required this.code, required this.name});

  factory Province.fromJson(Map<String, dynamic> json) {
    return Province(
      code: json['code']?.toString() ?? '',
      name: json['province'] ?? json['name'] ?? '',
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Province && other.code == code;
  }

  @override
  int get hashCode => code.hashCode;
}

class Ward {
  final String code;
  final String name;

  Ward({required this.code, required this.name});

  factory Ward.fromJson(Map<String, dynamic> json) {
    return Ward(
      code: json['code']?.toString() ?? '',
      name: json['name'] ?? '',
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Ward && other.code == code;
  }

  @override
  int get hashCode => code.hashCode;
}

class AddressService {
  static const String baseUrl = 'https://vietnamlabs.com/api/vietnamprovince';

  static Future<List<Province>> getProvinces() async {
    try {
      print('🌐 Đang tải danh sách tỉnh/thành phố từ vietnamlabs.com...');

      final response = await http.get(
        Uri.parse(baseUrl),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      ).timeout(Duration(seconds: 15));

      print('📡 Response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final responseBody = utf8.decode(response.bodyBytes);
        Map<String, dynamic> result = json.decode(responseBody);

        if (result['success'] == true && result['data'] != null) {
          List<dynamic> data = result['data'];
          print('✅ Tải thành công ${data.length} tỉnh/thành phố');

          List<Province> provinces = [];
          for (int i = 0; i < data.length; i++) {
            final provinceData = data[i];
            provinces.add(Province(
              code: (i + 1).toString().padLeft(2, '0'),
              name: provinceData['province'] ?? '',
            ));
          }

          return provinces;
        } else {
          throw Exception('API trả về lỗi: ${result['message'] ?? 'Unknown error'}');
        }
      } else {
        throw Exception('HTTP ${response.statusCode}: ${response.reasonPhrase}');
      }
    } catch (e) {
      print('❌ Lỗi tải từ vietnamlabs: $e');
      throw Exception('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.');
    }
  }

  static Future<List<Ward>> getWards(String provinceCode) async {
    try {
      print('🌐 Đang tải phường/xã cho tỉnh code: $provinceCode');

      // First, get all provinces to find the province name by code
      final provinces = await getProvinces();

      // Find province by code
      Province? targetProvince;
      for (var province in provinces) {
        if (province.code == provinceCode) {
          targetProvince = province;
          break;
        }
      }

      if (targetProvince == null) {
        throw Exception('Không tìm thấy tỉnh với code: $provinceCode');
      }

      print('🌐 Đang tải phường/xã cho tỉnh: ${targetProvince.name}');

      // ✅ Call API with province name as parameter
      final response = await http.get(
        Uri.parse('$baseUrl?province=${Uri.encodeComponent(targetProvince.name)}'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      ).timeout(Duration(seconds: 15));

      print('📡 Wards response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final responseBody = utf8.decode(response.bodyBytes);
        Map<String, dynamic> result = json.decode(responseBody);

        if (result['success'] == true && result['data'] != null) {
          Map<String, dynamic> data = result['data'];

          if (data['wards'] != null) {
            List<dynamic> wardsData = data['wards'];
            List<Ward> wards = [];

            for (int i = 0; i < wardsData.length; i++) {
              final wardData = wardsData[i];
              wards.add(Ward(
                code: i.toString().padLeft(3, '0'),
                name: wardData['name'] ?? '',
              ));
            }

            print('✅ Tải thành công ${wards.length} phường/xã cho ${targetProvince.name}');
            return wards;
          } else {
            print('⚠️ Không có dữ liệu wards trong response cho ${targetProvince.name}');
            return [];
          }
        } else {
          throw Exception('API wards trả về lỗi: ${result['message'] ?? 'Unknown error'}');
        }
      } else if (response.statusCode == 404) {
        print('⚠️ Không tìm thấy dữ liệu phường/xã cho tỉnh: ${targetProvince.name}');
        return []; // Return empty list if no wards found
      } else {
        throw Exception('HTTP ${response.statusCode}: ${response.reasonPhrase}');
      }

    } catch (e) {
      print('❌ Lỗi tải phường/xã: $e');
      throw Exception('Không thể tải danh sách phường/xã. Vui lòng thử lại.');
    }
  }

  @deprecated
  static Future<List<dynamic>> getDistricts(String provinceCode) async {
    throw UnsupportedError(
        'Districts (Quận/Huyện) không còn tồn tại trong cấu trúc hành chính mới của Việt Nam từ 1/7/2025. '
            'Hãy sử dụng getWards() để lấy danh sách xã/phường trực tiếp từ tỉnh.'
    );
  }
}