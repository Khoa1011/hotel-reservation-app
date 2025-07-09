import 'NguoiDung.dart';

class DanhGiaResponse {
  final String id;
  final int rating;
  final String comment;
  final DateTime reviewDate;
  final NguoiDung user;

  DanhGiaResponse({
    required this.id,
    required this.rating,
    required this.comment,
    required this.reviewDate,
    required this.user,
  });

  factory DanhGiaResponse.fromJson(Map<String, dynamic> json) {
    return DanhGiaResponse(
      id: json['id']?.toString() ?? '',
      rating: json['rating'] ?? 0,
      comment: json['comment']?.toString() ?? '',
      reviewDate: json['reviewDate'] != null
          ? DateTime.parse(json['reviewDate'].toString())
          : DateTime.now(),
      user: NguoiDung.short(
        id: json['user']['id'] ?? '',
        tenNguoiDung: json['user']['name'] ?? 'Khách hàng',
        gioiTinh: true,
        soDienThoai: '',
        hinhDaiDien: json['user']['avatar'] ?? '',
      ),
    );
  }
}
