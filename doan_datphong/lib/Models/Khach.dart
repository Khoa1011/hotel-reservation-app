class Khach {
  final int soNguoiLon;
  final int? soTreEm;

  Khach({
    required this.soNguoiLon,
    this.soTreEm,
  });

  factory Khach.fromJson(Map<String, dynamic> json) {
    return Khach(
      soNguoiLon: json['adults'] ?? 0,
      soTreEm: json['children'] ?? 0,

    );
  }

  Map<String, dynamic> toJson() {
    return {
      'adults': soNguoiLon,
      'children': soTreEm,
    };
  }

  int get tongSoKhach => soNguoiLon + (soTreEm ?? 0);
}
