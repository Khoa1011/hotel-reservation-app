
class TienNghi {
  final String id;
  final String tenTienNghi;
  final String icon;
  final String moTa;
  final String tenNhomTienNghi;
  final String iconNhom;
  final int soPhongCoTienNghi;
  final int tongSoPhong;
  // final int phanTramPhong;

  TienNghi({
    required this.id,
    required this.tenTienNghi,
    required this.icon,
    required this.moTa,
    required this.tenNhomTienNghi,
    required this.iconNhom,
    required this.soPhongCoTienNghi,
    required this.tongSoPhong,
    // required this.phanTramPhong,
  });
  factory TienNghi.fromJson(Map<String, dynamic> json) {
    return TienNghi(
      id: json['_id'] ?? '',
      tenTienNghi: json['tenTienNghi'] ?? '',
      icon: json['icon'] ?? '',
      moTa: json['moTa'] ?? '',
      tenNhomTienNghi: json['tenNhomTienNghi'] ?? '',
      iconNhom: json['iconNhom'] ?? '',
      soPhongCoTienNghi: json['soPhongCoTienNghi'] ?? 0,
      tongSoPhong: json['tongSoPhong'] ?? 0,
      // phanTramPhong: json['phanTramPhong'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'tenTienNghi': tenTienNghi,
      'icon': icon,
      'moTa': moTa,
      'tenNhomTienNghi': tenNhomTienNghi,
      'iconNhom': iconNhom,
      'soPhongCoTienNghi': soPhongCoTienNghi,
      'tongSoPhong': tongSoPhong,
      // 'phanTramPhong': phanTramPhong,
    };
  }
}
