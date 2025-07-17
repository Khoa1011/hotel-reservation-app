abstract class RecentBookingsState {}

class RecentBookingsInitial extends RecentBookingsState {}

class RecentBookingsLoading extends RecentBookingsState {}

// ✅ THAY ĐỔI: Recent hotels loaded (nhóm theo khách sạn)
class RecentBookingsLoaded extends RecentBookingsState {
  final List<dynamic> bookings; // Giờ là danh sách hotels, không phải bookings
  final int count;

  RecentBookingsLoaded({
    required this.bookings,
    required this.count,
  });
}

// ✅ MỚI: Hotel booking history loaded
class HotelBookingHistoryLoaded extends RecentBookingsState {
  final Map<String, dynamic> hotelData;
  final List<dynamic> bookings;
  final Map<String, dynamic> stats;

  HotelBookingHistoryLoaded({
    required this.hotelData,
    required this.bookings,
    required this.stats,
  });
}

// ✅ GIỮ NGUYÊN: Booking history cho trang "Xem tất cả"
class BookingHistoryLoaded extends RecentBookingsState {
  final List<dynamic> bookings;
  final int count;
  final String status;

  BookingHistoryLoaded({
    required this.bookings,
    required this.count,
    required this.status,
  });
}

class RecentBookingsError extends RecentBookingsState {
  final String errorMessage;

  RecentBookingsError(this.errorMessage);
}