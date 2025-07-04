import 'package:doan_datphong/Models/PhanTichGia.dart';

class GiaLoaiPhong {
  final double giaCoBan; // Giá cơ bản
  final double giaCuoiCung; // Giá cuối cùng
  final int khoangThoiGian; // Thời gian
  final String donVi; // Đơn vị (đêm, ngày, giờ...)
  final PhanTichGia phanTichGia; // Chi tiết tính giá

  GiaLoaiPhong({
    required this.giaCoBan,
    required this.giaCuoiCung,
    required this.khoangThoiGian,
    required this.donVi,
    required this.phanTichGia,
  });

  factory GiaLoaiPhong.fromJson(Map<String, dynamic> json) {
    return GiaLoaiPhong(
      giaCoBan: (json['basePrice'] ?? 0).toDouble(),
      giaCuoiCung: (json['finalPrice'] ?? 0).toDouble(),
      khoangThoiGian: json['duration'] ?? 0,
      donVi: json['unit'] ?? 'đêm',
      phanTichGia: PhanTichGia.fromJson(json['breakdown'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'basePrice': giaCoBan,
      'finalPrice': giaCuoiCung,
      'duration': khoangThoiGian,
      'unit': donVi,
      'breakdown': phanTichGia.toJson(),
    };
  }
  double getTaxWeekend(){
    return this.giaCuoiCung - this.giaCoBan;
  }
}