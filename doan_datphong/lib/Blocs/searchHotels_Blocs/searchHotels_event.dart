abstract class HotelSearchEvent {}

class SearchHotels extends HotelSearchEvent {
  final String? loaiLoc;
  final String? tenKhachSan;

  // ✅ CHỈ SỬA: Đổi tên theo API mới
  final String? thanhPho;      // Trước đây là tinhThanh
  final String? quan;          // Trước đây là phuongXa

  final double? minPrice;
  final double? maxPrice;
  final int? guests;
  final int? rooms;
  final String? checkIn;
  final String? checkOut;
  final String? bookingType;

  SearchHotels({
    this.loaiLoc,
    this.tenKhachSan,
    this.thanhPho,
    this.quan,
    this.minPrice,
    this.maxPrice,
    this.guests,
    this.rooms,
    this.checkIn,
    this.checkOut,
    this.bookingType,
  });

  @override
  List<Object?> get props => [
    loaiLoc,
    tenKhachSan,
    thanhPho,
    quan,
    minPrice,
    maxPrice,
    guests,
    rooms,
    checkIn,
    checkOut,
    bookingType
  ];
}