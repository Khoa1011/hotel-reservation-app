class ViTri {
  // ✅ CẤU TRÚC MỚI: theo database và API mới
  String? thanhPho;     // Thành phố (Hồ Chí Minh, Hà Nội, Đà Nẵng...)
  String? quan;         // Quận/Huyện (Quận 1, Quận 2, Huyện Củ Chi...)
  String? phuong;       // Phường/Xã (Phường Bến Nghé, Xã Tân An...)
  String? soNha;        // Số nhà, tên đường
  String? quocGia;      // Quốc gia

  // ✅ BACKWARD COMPATIBILITY: Giữ lại để không break code cũ
  String? tinhThanh;    // Deprecated - map to thanhPho
  String? tenDuong;     // Deprecated - merge vào soNha

  ViTri({
    this.thanhPho,
    this.quan,
    this.phuong,
    this.soNha,
    this.quocGia = "Việt Nam",

    // Deprecated fields
    this.tinhThanh,
    this.tenDuong,
  }) {
    // ✅ AUTO MIGRATION: Nếu có data cũ, tự động chuyển đổi
    if (thanhPho == null && tinhThanh != null && tinhThanh!.isNotEmpty) {
      thanhPho = tinhThanh;
    }

    // ✅ Merge tenDuong vào soNha nếu cần
    if (tenDuong != null && tenDuong!.isNotEmpty) {
      if (soNha != null && soNha!.isNotEmpty) {
        soNha = '$soNha, $tenDuong';
      } else {
        soNha = tenDuong;
      }
    }
  }

  // ✅ CONSTRUCTOR từ JSON với auto migration
  factory ViTri.fromJson(Map<String, dynamic> json) {
    return ViTri(
      // ✅ Ưu tiên cấu trúc mới
      thanhPho: json['thanhPho'] ?? json['tinhThanh'],
      quan: json['quan'],
      phuong: json['phuong'],
      soNha: json['soNha'],
      quocGia: json['quocGia'] ?? "Việt Nam",

      // ✅ Backward compatibility
      tinhThanh: json['tinhThanh'],
      tenDuong: json['tenDuong'],
    );
  }

  // ✅ TO JSON - xuất cấu trúc mới
  Map<String, dynamic> toJson() {
    return {
      'thanhPho': thanhPho,
      'quan': quan,
      'phuong': phuong,
      'soNha': soNha,
      'quocGia': quocGia,

      // ✅ Cũng xuất tinhThanh để backward compatibility
      'tinhThanh': thanhPho ?? tinhThanh,
    };
  }

  // ✅ FIX: Địa chỉ đầy đủ với logic đúng
  String get diaChiDayDu {
    List<String> parts = [];

    if (soNha?.isNotEmpty == true) parts.add(soNha!);
    if (phuong?.isNotEmpty == true) parts.add(phuong!);
    if (quan?.isNotEmpty == true) parts.add(quan!);
    if (thanhPho?.isNotEmpty == true) parts.add(thanhPho!);
    // ✅ FIX: Chỉ thêm quốc gia nếu không phải Việt Nam
    if (quocGia?.isNotEmpty == true && quocGia != "Việt Nam") {
      parts.add(quocGia!);
    }

    return parts.join(', ');
  }

  // ✅ HELPER: Địa chỉ ngắn gọn
  String get diaChiNganGon {
    List<String> parts = [];
    if (quan?.isNotEmpty == true) parts.add(quan!);
    if (thanhPho?.isNotEmpty == true) parts.add(thanhPho!);
    return parts.join(', ');
  }

  // ✅ HELPER: Check completeness
  bool get isComplete {
    return thanhPho?.isNotEmpty == true && quan?.isNotEmpty == true;
  }

  @override
  String toString() => diaChiDayDu;
}