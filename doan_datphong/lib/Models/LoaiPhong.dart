import 'package:doan_datphong/Models/CauHinhGiuong.dart';
import 'package:doan_datphong/Models/GiaLoaiPhong.dart';
import 'package:doan_datphong/Models/HinhAnhPhong.dart';
import 'package:doan_datphong/Models/TienNghi.dart';

class LoaiPhong {
  final String id;
  final String tenLoaiPhong;
  final double giaCa;
  final String moTa;
  final int soLuongKhach;
  final List<String> tienNghiDacBiet;
  final int tongSoPhong;

  final bool coSan;
  final int phongCoSan;
  final int phongCoNguoiO;
  final bool coTheDatPhong;
  // Pricing info
  final double giaCuoiCung;
  final int khoangThoiGian;
  final String donVi;
  final double giaMoiDonVi;
  //Tiện nghi của của các phòng có trong loại phòng
  final List<TienNghi>? tienNghi;
  final List<HinhAnhPhong>? hinhAnhPhong;
  final List<CauHinhGiuong>? cauHinhGiuong;
  //Phan tich gia
  final GiaLoaiPhong? giaLoaiPhong;

  LoaiPhong({
    required this.id,
    required this.tenLoaiPhong,
    required this.giaCa,
    required this.moTa,
    required this.soLuongKhach,
    required this.tienNghiDacBiet,
    required this.tongSoPhong,

    this.coSan = false,
    this.phongCoSan = 0,        // 🎯 Field này sẽ hiển thị số phòng còn lại
    this.phongCoNguoiO = 0,
    this.coTheDatPhong = false,

    // Pricing fields
    this.giaCuoiCung = 0.0,
    this.khoangThoiGian = 1,
    this.donVi = 'đêm',
    this.giaMoiDonVi = 0.0,

    //Tiện nghi của phòng
    this.tienNghi,
    this.hinhAnhPhong,
    this.cauHinhGiuong,

    //Phan tich gia loai phong
    this.giaLoaiPhong,
  });

  factory LoaiPhong.fromJson(Map<String, dynamic> json) {
    // Parse availability data
    final availability = json["availability"] ?? {};
    final pricing = json["pricing"] ?? {};
    final displayInfo = json["displayInfo"] ?? {};

    return LoaiPhong(
      id: json["roomTypeId"]?.toString() ?? '',
      tenLoaiPhong: json["tenLoaiPhong"]?.toString() ?? '',
      giaCa: (json["giaCa"] is int)
          ? (json["giaCa"] as int).toDouble()
          : (json["giaCa"] ?? 0.0),
      moTa: json["moTa"]?.toString() ?? '',
      soLuongKhach: json["soLuongKhach"] ?? 1,
      tienNghiDacBiet: List<String>.from(json["tienNghiDacBiet"] ?? []),
      tongSoPhong: json["tongSoPhong"] ?? 0,

      // ✅ Parse availability data
      coSan: availability["isAvailable"] ?? false,
      phongCoSan: (availability["availableRooms"] as num?)?.toInt() ?? 0, // 🎯 Số phòng còn lại
      phongCoNguoiO: availability["bookedRooms"] ?? 0,
      coTheDatPhong: availability["canBook"] ?? false,

      // ✅ Parse pricing data
      giaCuoiCung: (pricing["finalPrice"] is int)
          ? (pricing["finalPrice"] as int).toDouble()
          : (pricing["finalPrice"] ?? 0.0),
      khoangThoiGian: pricing["duration"] ?? 1,
      donVi: pricing["unit"]?.toString() ?? 'đêm',

      // ✅ Parse display info
      giaMoiDonVi: (displayInfo["pricePerUnit"] is int)
          ? (displayInfo["pricePerUnit"] as int).toDouble()
          : (displayInfo["pricePerUnit"] ?? 0.0),

      // ✅ Tiện nghi và hình ảnh
      tienNghi: (json['amenities'] as List<dynamic>? ?? [])
          .map((item) => TienNghi.fromJson(item))
          .toList(),
      hinhAnhPhong: (json['images'] as List<dynamic>? ?? [])
          .map((item) => HinhAnhPhong.fromJson(item))
          .toList(),
      cauHinhGiuong: (json['cauHinhGiuong'] as List<dynamic>? ?? [])
          .map((item) => CauHinhGiuong.fromJson(item))
          .toList(),
      giaLoaiPhong: GiaLoaiPhong.fromJson(json['pricing'] ?? {}),
    );
  }


  Map<String, dynamic> toJson() {
    return {
      "_id": id,
      "tenLoaiPhong": tenLoaiPhong,
      "giaCa": giaCa,
      "moTa": moTa,
      "soLuongKhach": soLuongKhach,
      "tienNghiDacBiet": tienNghiDacBiet,
      "tongSoPhong": tongSoPhong,
      "availableRooms": phongCoSan,  // 🎯 Include trong JSON
      "isAvailable": coSan,
      "finalPrice": giaCuoiCung,
      "unit": donVi,
      "duration": khoangThoiGian,
      "pricing" : giaLoaiPhong?.toJson(),
    };
  }

  // ✅ Helper methods để hiển thị
  String get availabilityText {
    if (!coSan) return "Hết phòng";
    if (phongCoSan <= 5) return "Chỉ còn $phongCoSan phòng";
    return "$phongCoSan phòng có sẵn";
  }


  String? layAnhDauTien() {
    try {
      // Kiểm tra hinhAnhPhong có null hoặc rỗng không
      if (hinhAnhPhong == null || hinhAnhPhong!.isEmpty) {
        return null;
      }

      // Tìm ảnh đầu tiên có url_anh không rỗng
      for (var anh in hinhAnhPhong!) {
        if (anh.url_anh.isNotEmpty) {
          return anh.url_anh;
        }
      }

      return null;
    } catch (e) {
      print('Error in layAnhDauTien: $e');
      return null;
    }
  }


  bool get isLowStock => coSan && phongCoSan <= 5;
}