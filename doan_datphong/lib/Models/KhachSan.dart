import 'dart:ffi';

import 'package:doan_datphong/Helper/FormatCurrency.dart';
import 'package:doan_datphong/Data/Provider/IP_v4_Address.dart';
import 'package:doan_datphong/Models/ViTri.dart';
import 'package:flutter/cupertino.dart';

class KhachSan {
  String id;
  String tenKhachSan;
  String diaChi;
  String hinhAnh;
  String thanhPho;
  String moTa;
  double soSao;
  String soDienThoai;
  String? loaiMoHinh; //
  String? trangThai; // co hoat dong khong?
  String email;
  double giaCa;
  ViTri? viTri;

  KhachSan({
    required this.id,
    required this.tenKhachSan,
    required this.diaChi,
    required this.hinhAnh,
    required this.thanhPho,
    required this.moTa,
    required this.soSao,
    required this.soDienThoai,
    required this.email,
    required this.giaCa,
    this.viTri,
    this.loaiMoHinh,
    this.trangThai,

  });

  // Chuyển từ JSON sang object
  factory KhachSan.fromJson(Map<String, dynamic> json) {
    final String baseImageUrl = IPv4.IP_CURRENT;
    return KhachSan(
      id: json['_id'] ?? '',
      tenKhachSan: json['tenKhachSan'] ?? '',
      diaChi: json['diaChiDayDu'] ?? '',
      hinhAnh: baseImageUrl + (json['hinhAnh']??''),
      thanhPho: json['thanhPho'] ?? '',
      moTa: json['moTa'] ?? '',
      soSao: (json['soSao'] as num).toDouble(),
      soDienThoai: json['soDienThoai'] ?? '',
      email: json['email'] ?? '',
      giaCa: (json['giaTheoNgay'] as num).toDouble(),
      viTri: json["diaChi"] != null
          ? ViTri.fromJson(json["diaChi"])
          : null,
      loaiMoHinh: json['loaiKhachSan'],
      trangThai: json['trangThai'],
    );
  }

  // Chuyển object thành JSON (nếu cần gửi dữ liệu lên server)
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'tenKhachSan': tenKhachSan,
      'diaChiDayDu': diaChi,
      'hinhAnh': hinhAnh,
      'thanhPho': thanhPho,
      'moTa': moTa,
      'soSao': soSao,
      'soDienThoai': soDienThoai,
      'email': email,
      'giaCa':giaCa,
      'loaiKhachSan': loaiMoHinh,
      'trangThai': trangThai,
    };
  }
}
