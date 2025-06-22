import 'package:doan_datphong/Models/TienNghi.dart';

class NhomTienNghi {
  final String id;
  final String tenNhomTienNghi;
  final String icon;
  final int thuTuNhom;
  final String moTa;
  final List<TienNghi> tienNghi;

  NhomTienNghi({
    required this.id,
    required this.tenNhomTienNghi,
    required this.icon,
    required this.thuTuNhom,
    required this.tienNghi,
    required this.moTa
  });

  factory NhomTienNghi.fromJson(Map<String, dynamic> json) {
    var amenitiesList = json['tienNghi'] as List? ?? [];

    return NhomTienNghi(
      id: json['_id'] ?? '',
      tenNhomTienNghi: json['tenNhomTienNghi'] ?? '',
      icon: json['icon'] ?? '',
      thuTuNhom: json['thuTuNhom'] ?? 0,
      moTa: json['moTa'] ?? '',
      tienNghi: amenitiesList
          .map((amenity) => TienNghi.fromJson(amenity))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'tenNhomTienNghi': tenNhomTienNghi,
      'icon': icon,
      'thuTuNhom': thuTuNhom,
      'moTa':moTa,
      'tienNghi': tienNghi.map((amenity) => amenity.toJson()).toList(),
    };
  }
}