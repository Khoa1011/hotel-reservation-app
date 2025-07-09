class DanhGia{
  final String maDonDat;
  final int soSao;
  final String binhLuan;

  DanhGia({
    required this.maDonDat,
    required this.soSao,
    required this.binhLuan
  });
  // factory DanhGia.fromJson(Map<String, dynamic> json) {
  //   return DanhGia(
  //     id: json['id']?.toString() ?? '',
  //     bookingId: json['bookingId']?.toString() ?? '',
  //     roomId: json['roomId']?.toString(),
  //     rating: json['rating'] ?? 0,
  //     comment: json['comment']?.toString() ?? '',
  //     reviewDate: json['reviewDate'] != null
  //         ? DateTime.parse(json['reviewDate'].toString())
  //         : DateTime.now(),
  //     hotel: json['hotel'] != null
  //         ? ReviewHotel.fromJson(json['hotel'])
  //         : null,
  //     booking: json['booking'] != null
  //         ? ReviewBooking.fromJson(json['booking'])
  //         : null,
  //   );
  // }

  Map<String, dynamic> toJson() {
    return {
      'bookingId': maDonDat,
      'rating': soSao,
      'comment': binhLuan,
    };
  }
}
