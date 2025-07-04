import 'package:flutter/cupertino.dart';

import '../Data/Provider/IP_v4_Address.dart';

class HinhAnhPhong {
  final String? id;
  final String url_anh;
  final int thuTuAnh;
  final String moTa;


  HinhAnhPhong({
    this.id,
    required this.url_anh,
    required this.thuTuAnh,
    required this.moTa
  });

  factory HinhAnhPhong.fromJson(Map<String, dynamic> json) {
    final String baseImageUrl = IPv4.IP_CURRENT;
    return HinhAnhPhong(
      id: json["imageId"]?.toString() ?? '',
      url_anh:baseImageUrl +(json["url"]?.toString() ??''),
      thuTuAnh: json["order"],
      moTa: json["description"]?.toString() ?? ''
    );
  }





}