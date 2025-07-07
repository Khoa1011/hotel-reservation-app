

class ViTri {
  String? soNha;
  String? tenDuong;
  String? phuong;

  String? tinhThanh;
  String? quocGia;

  ViTri({
    this.soNha,
    this.tenDuong,
    this.phuong,
    this.tinhThanh,
    this.quocGia = "Việt Nam",
  });

  factory ViTri.fromJson(Map<String, dynamic> json) {
    return ViTri(
      quocGia: json['quocGia'] ?? '',
      phuong: json['phuong'] ?? '',
      tenDuong: json['tenDuong'] ?? '',
      tinhThanh: json ['tinhThanh'],
      soNha: json['soNha'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'quocGia': quocGia,
      'phuong': phuong,
      'tenDuong': tenDuong,
      'soNha': soNha,
      'tinhThanh':tinhThanh
    };
  }

  String get diaChiDayDu {
    List<String> parts = [];
    if (soNha?.isNotEmpty == true) parts.add(soNha!);
    if (phuong?.isNotEmpty == true) parts.add(phuong!);
    if (tinhThanh?.isEmpty == true) parts.add(tinhThanh!);
    if (quocGia?.isNotEmpty == true) parts.add(quocGia!);
    return parts.join(', ');
  }

  @override
  String toString() => diaChiDayDu;
}
