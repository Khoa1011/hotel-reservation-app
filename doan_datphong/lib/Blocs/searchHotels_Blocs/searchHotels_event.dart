abstract class HotelSearchEvent {}

class SearchHotels extends HotelSearchEvent {
  final String? loaiLoc;
  final String? tenKhachSan;

  final String? thanhPho;
  final String? quan;

  final double? minPrice;
  final double? maxPrice;
  final int? guests;
  final int? rooms;
  final String? checkIn;
  final String? checkOut;
  final DateTime? checkInParam;
  final DateTime? checkOutParam;
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
    this.checkInParam,
    this.checkOutParam
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
    checkInParam,
    checkOutParam,
    bookingType
  ];
}