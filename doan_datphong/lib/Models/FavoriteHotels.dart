import 'package:doan_datphong/Models/KhachSan.dart';

class FavoriteHotel {
  final String favoriteId;
  final String ngayThem;
  final String ghiChu;
  final KhachSan khachSan;

  FavoriteHotel({
    required this.favoriteId,
    required this.ngayThem,
    required this.ghiChu,
    required this.khachSan,
  });

  factory FavoriteHotel.fromJson(Map<String, dynamic> json) {
    return FavoriteHotel(
      favoriteId: json['favoriteId'] ?? '',
      ngayThem: json['ngayThem'] ?? '',
      ghiChu: json['ghiChu'] ?? '',
      khachSan: KhachSan.fromJson(json['khachSan'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'favoriteId': favoriteId,
      'ngayThem': ngayThem,
      'ghiChu': ghiChu,
      'hotel': khachSan.toJson(),
    };
  }
}
