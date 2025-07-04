import 'package:http/http.dart' as http;
import 'dart:convert';

class Province {
  final String code;
  final String name;

  Province({required this.code, required this.name});

  factory Province.fromJson(Map<String, dynamic> json) {
    return Province(
      code: json['code'],
      name: json['name'],
    );
  }
}

class District {
  final String code;
  final String name;

  District({required this.code, required this.name});

  factory District.fromJson(Map<String, dynamic> json) {
    return District(
      code: json['code'],
      name: json['name'],
    );
  }
}

class Ward {
  final String code;
  final String name;

  Ward({required this.code, required this.name});

  factory Ward.fromJson(Map<String, dynamic> json) {
    return Ward(
      code: json['code'],
      name: json['name'],
    );
  }
}

// Service
class AddressService {
  // Sử dụng API khác ổn định hơn
  static const String baseUrl = 'https://esgoo.net/api-tinhthanh';

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
          return data.map((json) => Province(
            code: json['id'].toString(),
            name: json['name'] ?? json['full_name'] ?? '',
          )).toList();
        } else {
          throw Exception('API trả về lỗi: ${result['error_text'] ?? 'Unknown error'}');
        }
      } else {
        throw Exception('HTTP ${response.statusCode}: ${response.reasonPhrase}');
      }
    } catch (e) {
      print('❌ Lỗi tải tỉnh/thành phố từ esgoo: $e');

      // Thử API backup khác
      try {
        return await _getProvincesFromVietnamData();
      } catch (backupError) {
        print('❌ Lỗi API backup: $backupError');
        throw Exception('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.');
      }
    }
  }

  // API backup từ GitHub
  static Future<List<Province>> _getProvincesFromVietnamData() async {
    print('🔄 Thử API backup từ GitHub...');

    final response = await http.get(
      Uri.parse('https://raw.githubusercontent.com/madnh/hanhchinhvn/master/dist/tinh_tp.json'),
    ).timeout(Duration(seconds: 15));

    if (response.statusCode == 200) {
      final responseBody = utf8.decode(response.bodyBytes);
      Map<String, dynamic> data = json.decode(responseBody);

      List<Province> provinces = [];
      data.forEach((key, value) {
        provinces.add(Province(
          code: key,
          name: value['name'] ?? value['name_with_type'] ?? '',
        ));
      });

      print('✅ Backup API: Tải thành công ${provinces.length} tỉnh/thành phố');
      return provinces;
    }
    throw Exception('Backup API failed with status: ${response.statusCode}');
  }

  static Future<List<District>> getDistricts(String provinceCode) async {
    try {
      print('🌐 Đang tải quận/huyện cho tỉnh: $provinceCode');

      final response = await http.get(
        Uri.parse('$baseUrl/2/$provinceCode.htm'),
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
          return data.map((json) => District(
            code: json['id'].toString(),
            name: json['name'] ?? json['full_name'] ?? '',
          )).toList();
        } else {
          throw Exception('API trả về lỗi: ${result['error_text'] ?? 'Unknown error'}');
        }
      } else {
        throw Exception('HTTP ${response.statusCode}: ${response.reasonPhrase}');
      }
    } catch (e) {
      print('❌ Lỗi tải quận/huyện: $e');
      throw Exception('Không thể tải danh sách quận/huyện. Vui lòng thử lại.');
    }
  }

  static Future<List<Ward>> getWards(String districtCode) async {
    try {
      print('🌐 Đang tải phường/xã cho quận: $districtCode');

      final response = await http.get(
        Uri.parse('$baseUrl/3/$districtCode.htm'),
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
          return data.map((json) => Ward(
            code: json['id'].toString(),
            name: json['name'] ?? json['full_name'] ?? '',
          )).toList();
        } else {
          throw Exception('API trả về lỗi: ${result['error_text'] ?? 'Unknown error'}');
        }
      } else {
        throw Exception('HTTP ${response.statusCode}: ${response.reasonPhrase}');
      }
    } catch (e) {
      print('❌ Lỗi tải phường/xã: $e');
      throw Exception('Không thể tải danh sách phường/xã. Vui lòng thử lại.');
    }
  }
}