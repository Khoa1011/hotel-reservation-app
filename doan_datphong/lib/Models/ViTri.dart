

class ViTri {
  String? soNha;
  String? tenDuong;
  String? phuong;
  String? quan;
  String? thanhPho;
  String? tinhThanh;
  String? quocGia;

  ViTri({
    this.soNha,
    this.tenDuong,
    this.phuong,
    this.quan,
    this.tinhThanh,
    this.thanhPho,
    this.quocGia = "Việt Nam",
  });

  factory ViTri.fromJson(Map<String, dynamic> json) {
    return ViTri(
      quocGia: json['quocGia'] ?? '',
      thanhPho: json['thanhPho'] ?? '',
      quan: json['quan'] ?? '',
      phuong: json['phuong'] ?? '',
      tenDuong: json['tenDuong'] ?? '',
      tinhThanh: json ['tinhThanh'],
      soNha: json['soNha'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'quocGia': quocGia,
      'thanhPho': thanhPho,
      'quan': quan,
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
    if (quan?.isNotEmpty == true) parts.add(quan!);
    if (thanhPho?.isNotEmpty == true) parts.add(thanhPho!);
    if (tinhThanh?.isEmpty == true) parts.add(tinhThanh!);
    if (quocGia?.isNotEmpty == true) parts.add(quocGia!);
    return parts.join(', ');
  }

  @override
  String toString() => diaChiDayDu;
}
