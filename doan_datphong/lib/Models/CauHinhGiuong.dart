class CauHinhGiuong {
  final String loaiGiuong; // "single", "double", "queen", "king"
  final int soLuong;

  const CauHinhGiuong({
    required this.loaiGiuong,
    required this.soLuong,
  });

  factory CauHinhGiuong.fromJson(Map<String, dynamic> json) {
    return CauHinhGiuong(
      loaiGiuong: json['loaiGiuong'] ?? 'double',
      soLuong: json['soLuong'] ?? 1,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'loaiGiuong': loaiGiuong,
      'soLuong': soLuong,
    };
  }

  // Helper methods
  String get tenHienThi {
    switch (loaiGiuong) {
      case 'single':
        return 'Giường đơn';
      case 'double':
        return 'Giường đôi';
      case 'queen':
        return 'Giường Queen';
      case 'king':
        return 'Giường King';
      default:
        return loaiGiuong;
    }
  }

  int get kichThuoc {
    switch (loaiGiuong) {
      case 'single':
        return 1;
      case 'double':
        return 2;
      case 'queen':
        return 3;
      case 'king':
        return 4;
      default:
        return 2;
    }
  }
}
