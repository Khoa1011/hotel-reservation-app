import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class User {
  String id;
  String tenNguoiDung;
  bool gioiTinh;
  String email;
  String matKhau;
  String soDienThoai;
  String vaiTro;
  String hinhDaiDien;
  String ngaySinh;
  DateTime createAt;

  User({
    required this.id,
    required this.tenNguoiDung,
    required this.gioiTinh,
    required this.email,
    required this.matKhau,
    required this.soDienThoai,
    required this.vaiTro,
    required this.hinhDaiDien,
    required this.ngaySinh,
    required this.createAt,
  });


  User.short({
    required this.id,
    required this.tenNguoiDung,
    required this.gioiTinh,
    required this.soDienThoai,
    required this.ngaySinh,
    required this.hinhDaiDien,
  })  : email = '',
        matKhau = '',
        vaiTro = 'user',
        createAt = DateTime.now();

  User.shortUpdateProfile({
    required this.id,
    required this.tenNguoiDung,
    required this.soDienThoai,
    required this.ngaySinh,
    required this.hinhDaiDien,
    required this.matKhau,
}): email = '',
        vaiTro = 'user',
        createAt = DateTime.now(),
  gioiTinh= true;

  // Chuyển từ JSON sang Object
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json["_id"],
      tenNguoiDung: json["tenNguoiDung"],
      gioiTinh: json["gioiTinh"],
      email: json["email"],
      matKhau: json["matKhau"],
      soDienThoai: json["soDienThoai"],
      vaiTro: json["vaiTro"],
      hinhDaiDien: json["hinhDaiDien"],
      ngaySinh: json["ngaySinh"],
      createAt: DateTime.parse(json["ngayTao"]),
    );
  }

  // Chuyển từ Object sang JSON
  Map<String, dynamic> toMap() {
    return {
      "_id": id,
      "tenNguoiDung": tenNguoiDung,
      "gioiTinh": gioiTinh,
      "email": email,
      "matKhau": matKhau,
      "soDienThoai": soDienThoai,
      "vaiTro": vaiTro,
      "hinhDaiDien": hinhDaiDien,
      "ngaySinh": ngaySinh,
      "ngayTao": createAt.toIso8601String(),
    };
  }

  // Chuyển đối tượng User thành chuỗi JSON
  String toJsonString() => jsonEncode(toMap());

  // Chuyển từ chuỗi JSON thành đối tượng User
  factory User.fromJsonString(String? source) {
    if (source == null || source.isEmpty) {
      throw Exception("Dữ liệu người dùng không hợp lệ!"); // Hoặc return null nếu muốn
    }
    return User.fromJson(jsonDecode(source));
  }

  Future<void> saveUserToPrefs(User user) async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String userJson = user.toJsonString(); // Chuyển user thành JSON
    await prefs.setString("user", userJson);
  }
  Future<User?> getUserFromPrefs() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String? userJson = prefs.getString("user");

    if (userJson == null || userJson.isEmpty) {
      return null; // Trả về null nếu chưa có dữ liệu
    }

    try {
      return User.fromJsonString(userJson);
    } catch (e) {
      print("Lỗi khi chuyển đổi User: $e");
      return null; // Tránh crash nếu dữ liệu bị lỗi
    }
  }
}
