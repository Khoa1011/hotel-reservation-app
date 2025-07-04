enum LoaiDatPhong { theo_gio, qua_dem, dai_ngay }
enum TrangThai { dang_cho, da_xac_nhan, da_nhan_phong, dang_su_dung, qua_gio, da_tra_phong, da_huy }
enum PhuongThucThanhToan { the_tin_dung, VNPay, Momo, tien_mat, ZaloPay }
enum TrangThaiThanhToan { chua_thanh_toan, da_thanh_toan, thanh_toan_mot_phan, da_hoan_tien }

class DonDatPhong {
  String maDonDat;
  String? maPhong;
  String? maKhachSan;
  String maNguoiDung;
  String? maLoaiPhong;
  String? cccd;
  LoaiDatPhong loaiDatPhong;
  int soLuongPhong;
  String ngayNhanPhong;
  String ngayTraPhong;
  String gioNhanPhong;
  String gioTraPhong;
  TrangThai trangThai;
  PhuongThucThanhToan phuongThucThanhToan;
  TrangThaiThanhToan trangThaiThanhToan;
  DateTime thoiGianTaoDon;
  String ghiChu;
  String soDienThoai;

  // Thông tin giá
  double donGia;
  int soLuongDonVi;
  String donVi; // "gio", "dem", "ngay"
  double tongTienPhong;
  double phiDichVu;
  double thue;
  double giamGia;
  double phuPhiGio;
  double phuPhiCuoiTuan;
  double tongDonDat;

  DonDatPhong({
    required this.maDonDat,
    this.maPhong,
    this.maKhachSan,
    required this.maNguoiDung,
    this.maLoaiPhong,
    this.cccd,
    required this.loaiDatPhong,
    this.soLuongPhong = 1,
    required this.ngayNhanPhong,
    required this.ngayTraPhong,
    required this.gioNhanPhong,
    required this.gioTraPhong,
    this.trangThai = TrangThai.dang_cho,
    this.phuongThucThanhToan = PhuongThucThanhToan.VNPay,
    this.trangThaiThanhToan = TrangThaiThanhToan.chua_thanh_toan,
    DateTime? thoiGianTaoDon,
    this.ghiChu = '',
    this.soDienThoai = '',
    required this.donGia,
    required this.soLuongDonVi,
    required this.donVi,
    required this.tongTienPhong,
    this.phiDichVu = 0,
    this.thue = 0,
    this.giamGia = 0,
    this.phuPhiGio = 0,
    this.phuPhiCuoiTuan = 0,
    required this.tongDonDat,
  }) : thoiGianTaoDon = thoiGianTaoDon ?? DateTime.now();


  DonDatPhong.empty()
      : maDonDat = '',
        maLoaiPhong = '',
        maKhachSan = '',
        maNguoiDung = '',
        ngayNhanPhong = DateTime.now().toIso8601String(),
        ngayTraPhong = DateTime.now().add(Duration(days: 1)).toIso8601String(),
        gioNhanPhong = '14:00',
        gioTraPhong = '12:00',
        tongDonDat = 0.0,
        trangThaiThanhToan = TrangThaiThanhToan.chua_thanh_toan,
        phuongThucThanhToan = PhuongThucThanhToan.tien_mat,
        loaiDatPhong = LoaiDatPhong.qua_dem,
        donGia = 0.0,
        donVi = 'dem',
        soLuongDonVi = 1,
        tongTienPhong = 0.0,
  // ✅ Initialize all non-nullable fields
        ghiChu = '',
        giamGia = 0.0,
        phiDichVu = 0.0,
        phuPhiCuoiTuan = 0.0,
        phuPhiGio = 0.0,
        soDienThoai = '',
        soLuongPhong = 1,
        thoiGianTaoDon = DateTime.now(),
        thue = 0.0,
        trangThai = TrangThai.dang_cho;

  DonDatPhong.short({
    this.maPhong,
    required this.maKhachSan,
    required this.maNguoiDung,
    required this.maLoaiPhong,
    required this.soDienThoai,
    required this.loaiDatPhong,
    required this.ngayNhanPhong,
    required this.ngayTraPhong,
    required this.gioNhanPhong,
    required this.gioTraPhong,
    required this.donGia,
    required this.soLuongDonVi,
    required this.phuPhiCuoiTuan,
    required this.donVi,
    required this.tongTienPhong,
    required this.tongDonDat,
    this.trangThai = TrangThai.dang_cho,
    required this.soLuongPhong,
    this.trangThaiThanhToan = TrangThaiThanhToan.da_thanh_toan,
    this.phuongThucThanhToan = PhuongThucThanhToan.the_tin_dung,
  }) : maDonDat = '',
        cccd = '',
        thoiGianTaoDon = DateTime.now(),
        ghiChu = '',
        phiDichVu = 0,
        thue = 0,
        giamGia = 0,
        phuPhiGio = 0;

  String getTrangThaiString() {
    return trangThai.toString().split('.').last;
  }

  String getLoaiDatPhongString() {
    return loaiDatPhong.toString().split('.').last;
  }

  String getPhuongThucThanhToanString() {
    return phuongThucThanhToan.toString().split('.').last;
  }

  String getTrangThaiThanhToanString() {
    return trangThaiThanhToan.toString().split('.').last;
  }

  static LoaiDatPhong parseLoaiDatPhong(String loai) {
    return LoaiDatPhong.values.firstWhere(
          (e) => e.toString().split('.').last == loai,
      orElse: () => LoaiDatPhong.qua_dem,
    );
  }

  static TrangThai parseTrangThai(String trangThai) {
    return TrangThai.values.firstWhere(
          (e) => e.toString().split('.').last == trangThai,
      orElse: () => TrangThai.dang_cho,
    );
  }

  static PhuongThucThanhToan parsePhuongThucThanhToan(String phuongThuc) {
    return PhuongThucThanhToan.values.firstWhere(
          (e) => e.toString().split('.').last == phuongThuc,
      orElse: () => PhuongThucThanhToan.VNPay,
    );
  }

  static TrangThaiThanhToan parseTrangThaiThanhToan(String trangThai) {
    return TrangThaiThanhToan.values.firstWhere(
          (e) => e.toString().split('.').last == trangThai,
      orElse: () => TrangThaiThanhToan.chua_thanh_toan,
    );
  }

  factory DonDatPhong.fromJson(Map<String, dynamic> json) {
    return DonDatPhong(
      maDonDat: json["_id"] ?? '',
      maPhong: json["maPhong"],
      maKhachSan: json["maKhachSan"],
      maNguoiDung: json["maNguoiDung"],
      maLoaiPhong: json["maLoaiPhong"],
      cccd: json["cccd"],
      loaiDatPhong: parseLoaiDatPhong(json["loaiDatPhong"]),
      soLuongPhong: json["soLuongPhong"] ?? 1,
      ngayNhanPhong: json["ngayNhanPhong"],
      ngayTraPhong: json["ngayTraPhong"],
      gioNhanPhong: json["gioNhanPhong"],
      gioTraPhong: json["gioTraPhong"],
      trangThai: parseTrangThai(json["trangThai"]),
      phuongThucThanhToan: parsePhuongThucThanhToan(json["phuongThucThanhToan"]),
      trangThaiThanhToan: parseTrangThaiThanhToan(json["trangThaiThanhToan"]),
      thoiGianTaoDon: DateTime.parse(json["thoiGianTaoDon"]),
      ghiChu: json["ghiChu"] ?? '',
      soDienThoai: json["soDienThoai"] ?? '',
      donGia: (json['thongTinGia']['donGia'] as num).toDouble(),
      soLuongDonVi: json['thongTinGia']['soLuongDonVi'],
      donVi: json['thongTinGia']['donVi'],
      tongTienPhong: (json['thongTinGia']['tongTienPhong'] as num).toDouble(),
      phiDichVu: (json['thongTinGia']['phiDichVu'] as num?)?.toDouble() ?? 0,
      thue: (json['thongTinGia']['thue'] as num?)?.toDouble() ?? 0,
      giamGia: (json['thongTinGia']['giamGia'] as num?)?.toDouble() ?? 0,
      phuPhiGio: (json['thongTinGia']['phuPhiGio'] as num?)?.toDouble() ?? 0,
      phuPhiCuoiTuan: (json['thongTinGia']['phuPhiCuoiTuan'] as num?)?.toDouble() ?? 0,
      tongDonDat: (json['thongTinGia']['tongDonDat'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      "maPhong": maPhong,
      "maKhachSan": maKhachSan,
      "maNguoiDung": maNguoiDung,
      "maLoaiPhong": maLoaiPhong,
      "cccd": cccd,
      "loaiDatPhong": getLoaiDatPhongString(),
      "soLuongPhong": soLuongPhong,
      "ngayNhanPhong": ngayNhanPhong,
      "ngayTraPhong": ngayTraPhong,
      "gioNhanPhong": gioNhanPhong,
      "gioTraPhong": gioTraPhong,
      "trangThai": getTrangThaiString(),
      "phuongThucThanhToan": getPhuongThucThanhToanString(),
      "trangThaiThanhToan": getTrangThaiThanhToanString(),
      "ghiChu": ghiChu,
      "soDienThoai": soDienThoai,
      "thongTinGia": {
        "donGia": donGia,
        "soLuongDonVi": soLuongDonVi,
        "donVi": donVi,
        "tongTienPhong": tongTienPhong,
        "phiDichVu": phiDichVu,
        "thue": thue,
        "giamGia": giamGia,
        "phuPhiGio": phuPhiGio,
        "phuPhiCuoiTuan": phuPhiCuoiTuan,
        "tongDonDat": tongDonDat,
      }
    };
  }
}