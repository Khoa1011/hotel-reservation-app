import 'Khach.dart';

class LichPhongTrong {
  final String loaiDatPhong;
  final String ngayNhanPhong;
  final String? ngayTraPhong;
  final String gioNhanPhong;
  final String? gioTraPhong;
  final Khach soLuongKhach;
  final int soLuongPhong;

  LichPhongTrong({
    required this.loaiDatPhong,
    required this.ngayNhanPhong,
    this.ngayTraPhong,
    required this.gioNhanPhong,
    this.gioTraPhong,
    required this.soLuongKhach,
    required this.soLuongPhong,
  });

  factory LichPhongTrong.fromJson(Map<String, dynamic> json) {
    return LichPhongTrong(
      loaiDatPhong: json['bookingType'] ?? '',
      ngayNhanPhong: json['checkInDate'] ?? '',
      ngayTraPhong: json['checkOutDate'],
      gioNhanPhong: json['checkInTime'] ?? '',
      gioTraPhong: json['checkOutTime'],
      soLuongKhach: Khach.fromJson(json['guests'] ?? {}),
      soLuongPhong: json['rooms'] ?? 1,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'bookingType': loaiDatPhong,
      'checkInDate': ngayNhanPhong,
      'checkOutDate': ngayTraPhong,
      'checkInTime': gioNhanPhong,
      'checkOutTime': gioTraPhong,
      'guests': soLuongKhach.toJson(),
      'rooms': soLuongPhong,
    };
  }

}
