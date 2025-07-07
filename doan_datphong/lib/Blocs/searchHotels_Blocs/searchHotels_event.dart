abstract class HotelSearchEvent {}
class SearchHotels extends HotelSearchEvent {
  final String? loaiLoc;
  final String? tenKhachSan;
  final String? tinhThanh;
  final String? phuongXa;
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
    this.tinhThanh,
    this.phuongXa,
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
    loaiLoc ,tenKhachSan, tinhThanh, phuongXa, minPrice, maxPrice, guests, rooms, checkIn, checkOut, bookingType
  ];
}
