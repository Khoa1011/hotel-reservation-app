import 'dart:ffi';

import 'package:doan_datphong/Data/Provider/FormatCurrency.dart';
import 'package:doan_datphong/Data/Provider/IP_v4_Address.dart';
import 'package:flutter/cupertino.dart';

class Hotels {
  String id;
  String tenKhachSan;
  String diaChi;
  String hinhAnh;
  String thanhPho;
  String moTa;
  double soSao;
  String soDienThoai;
  String email;
  double giaCa;

  Hotels({
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
  });

  // Chuyển từ JSON sang object
  factory Hotels.fromJson(Map<String, dynamic> json) {
    final String baseImageUrl = IPv4.IP_CURRENT;
    return Hotels(
      id: json['_id'] ?? '',
      tenKhachSan: json['tenKhachSan'] ?? '',
      diaChi: json['diaChi'] ?? '',
      hinhAnh: baseImageUrl + (json['hinhAnh']??''),
      thanhPho: json['thanhPho'] ?? '',
      moTa: json['moTa'] ?? '',
      soSao: (json['soSao'] as num).toDouble(),
      soDienThoai: json['soDienThoai'] ?? '',
      email: json['email'] ?? '',
      giaCa: (json['giaCa'] as num).toDouble(),
    );
  }

  // Chuyển object thành JSON (nếu cần gửi dữ liệu lên server)
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'tenKhachSan': tenKhachSan,
      'diaChi': diaChi,
      'hinhAnh': hinhAnh,
      'thanhPho': thanhPho,
      'moTa': moTa,
      'soSao': soSao,
      'soDienThoai': soDienThoai,
      'email': email,
      'giaCa':giaCa,
    };
  }
}
