class PhanTichGia{
  final double giaGoc;
  final int khoangThoiGian;
  final double heSoNhan;
  final double tongPhu;
  final double tongTien;
  final double giamGiaTheoNgay; //7 ngay 0.85(15%), 5 ngay 0.90(10%), 3 ngay 0.95(5%)
  final double phuThuCuoiTuan;


  PhanTichGia({
    required this.giaGoc,
    required this.khoangThoiGian,
    required this.heSoNhan,
    required this.tongTien,
    required this.tongPhu,
    required this.giamGiaTheoNgay,
    required this.phuThuCuoiTuan,
});

  factory PhanTichGia.fromJson(Map<String, dynamic> json) {
    return PhanTichGia(
      giaGoc: (json['baseRate'] ?? 0).toDouble(),
      khoangThoiGian: json['duration'] ?? 0,
      heSoNhan: (json['multiplier'] ?? 1.0).toDouble(),
      tongTien: (json['total'] ?? 0).toDouble(),
      tongPhu:  (json ['subtotal'] ?? 0).toDouble(),
      giamGiaTheoNgay: (json['discountAmount'] as num?)?.toDouble() ?? 0.0,
      phuThuCuoiTuan: (json['taxPrice']as num?)?.toDouble() ?? 0.0,
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'baseRate': giaGoc,
      'duration': khoangThoiGian,
      'multiplier': heSoNhan,
      'total': tongTien,
    };
  }
}