import 'dart:convert';

import 'package:doan_datphong/Models/ViTri.dart';
import 'package:shared_preferences/shared_preferences.dart';

class NguoiDung {
  String id;
  String tenNguoiDung;
  bool gioiTinh;
  String email;
  String matKhau;
  String soDienThoai;
  String vaiTro;
  String hinhDaiDien;
  DateTime? ngaySinh;
  DateTime ngayTao;
  String? cccd;
  ViTri? viTri;
  String trangThaiTaiKhoan;


  NguoiDung({
    required this.id,
    required this.tenNguoiDung,
    required this.gioiTinh,
    required this.email,
    required this.matKhau,
    required this.soDienThoai,
    required this.vaiTro,
    required this.hinhDaiDien,
    required this.ngaySinh,
    required this.ngayTao,
    this.cccd,
    this.viTri,
    this.trangThaiTaiKhoan = "hoatDong",
  });


  NguoiDung.short({
    required this.id,
    required this.tenNguoiDung,
    required this.gioiTinh,
    required this.soDienThoai,
    this.ngaySinh,
    required this.hinhDaiDien,
  })  : email = '',
        matKhau = '',
        vaiTro = 'nguoiDung',
        ngayTao = DateTime.now(),
        cccd = null,
        trangThaiTaiKhoan = 'hoatDong',
        viTri = null;


  NguoiDung.shortUpdateProfile({
    required this.id,
    required this.tenNguoiDung,
    required this.soDienThoai,
    required this.ngaySinh,
    required this.hinhDaiDien,
    required this.matKhau,
}): email = '',
        vaiTro = 'nguoiDung',
        ngayTao = DateTime.now(),
        gioiTinh = true,
        cccd = null,
        trangThaiTaiKhoan = 'hoatDong',
        viTri = null;

  // Chuyển từ JSON sang Object
  // factory NguoiDung.fromJson(Map<String, dynamic> json) {
  //   return NguoiDung(
  //     id: json["_id"],
  //     tenNguoiDung: json["tenNguoiDung"],
  //     gioiTinh: json["gioiTinh"],
  //     email: json["email"],
  //     matKhau: json["matKhau"],
  //     soDienThoai: json["soDienThoai"],
  //     vaiTro: json["vaiTro"],
  //     hinhDaiDien: json["hinhDaiDien"],
  //     ngayTao: DateTime.parse(json["ngayTao"]),
  //     ngaySinh: json["ngaySinh"] != null ? DateTime.parse(json["ngaySinh"]) : null,
  //     cccd: json["cccd"],
  //     trangThaiTaiKhoan: json["trangThaiTaiKhoan"] ?? 'hoatDong',
  //     viTri: json["viTri"] != null ? ViTri.fromJson(json["viTri"]) : null,
  //   );
  // }

  factory NguoiDung.fromJson(Map<String, dynamic> json) {
    try {
      return NguoiDung(
        // ✅ Tất cả String fields phải có null check
        id: json["_id"]?.toString() ?? '',
        tenNguoiDung: json["tenNguoiDung"]?.toString() ?? '',
        gioiTinh: json["gioiTinh"] == true,
        email: json["email"]?.toString() ?? '',
        matKhau: json["matKhau"]?.toString() ?? '',
        soDienThoai: json["soDienThoai"]?.toString() ?? '',
        vaiTro: json["vaiTro"]?.toString() ?? 'nguoiDung',
        hinhDaiDien: json["hinhDaiDien"]?.toString() ?? '',
        trangThaiTaiKhoan: json["trangThaiTaiKhoan"]?.toString() ?? 'hoatDong',

        // ✅ Parse DateTime an toàn
        ngayTao: json["ngayTao"] != null
            ? DateTime.parse(json["ngayTao"])
            : DateTime.now(),

        ngaySinh: json["ngaySinh"] != null
            ? DateTime.parse(json["ngaySinh"])
            : null,

        // ✅ Optional fields
        cccd: json["cccd"]?.toString(),

        viTri: json["viTri"] != null
            ? ViTri.fromJson(json["viTri"])
            : null,
      );
    } catch (e) {
      print("❌ Error in NguoiDung.fromJson(): $e");
      print("❌ JSON data: $json");
      rethrow;
    }
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
      "ngaySinh": ngaySinh?.toIso8601String(),
      "ngayTao": ngayTao.toIso8601String(),
      "cccd": cccd,
      "trangThaiTaiKhoan": trangThaiTaiKhoan,
      "viTri": viTri?.toJson(),
    };
  }

  // Chuyển đối tượng User thành chuỗi JSON
  String toJsonString() => jsonEncode(toMap());

  // Chuyển từ chuỗi JSON thành đối tượng User
  factory NguoiDung.fromJsonString(String? source) {
    if (source == null || source.isEmpty) {
      throw Exception("Dữ liệu người dùng không hợp lệ!"); // Hoặc return null nếu muốn
    }
    return NguoiDung.fromJson(jsonDecode(source));
  }

  Future<void> saveUserToPrefs(NguoiDung user) async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String userJson = user.toJsonString(); // Chuyển user thành JSON
    await prefs.setString("user", userJson);
  }
  Future<NguoiDung?> getUserFromPrefs() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String? userJson = prefs.getString("user");

    if (userJson == null || userJson.isEmpty) {
      return null; // Trả về null nếu chưa có dữ liệu
    }

    try {
      return NguoiDung.fromJsonString(userJson);
    } catch (e) {
      print("Lỗi khi chuyển đổi User: $e");
      return null; // Tránh crash nếu dữ liệu bị lỗi
    }
  }
}
