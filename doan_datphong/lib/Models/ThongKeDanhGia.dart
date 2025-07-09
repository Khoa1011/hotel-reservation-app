class ThongKeDanhGia {
  final int tongDanhGia;
  final double trungBinh;
  final Map<int, int> xepHang;

  ThongKeDanhGia({
    required this.tongDanhGia,
    required this.trungBinh,
    required this.xepHang,
  });

  factory ThongKeDanhGia.fromJson(Map<String, dynamic> json) {
    // ✅ Convert string keys to int keys
    Map<int, int> breakdown = {};
    if (json['ratingBreakdown'] != null) {
      Map<String, dynamic> rawBreakdown = json['ratingBreakdown'];
      rawBreakdown.forEach((key, value) {
        breakdown[int.parse(key)] = value;
      });
    }

    return ThongKeDanhGia(
      tongDanhGia: json['totalReviews'] ?? 0,
      trungBinh: (json['averageRating'] ?? 0.0).toDouble(),
      xepHang: breakdown,
    );
  }
}