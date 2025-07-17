import 'package:equatable/equatable.dart';

abstract class RecentBookingsEvent extends Equatable {
  @override
  List<Object> get props => [];
}

class LoadRecentBookings extends RecentBookingsEvent {
  final String userId;
  final int limit;

  LoadRecentBookings(this.userId, {this.limit = 10}); // ✅ Tăng limit mặc định

  @override
  List<Object> get props => [userId, limit];
}

// ✅ MỚI: Event load chi tiết lịch sử của 1 khách sạn
class LoadHotelBookingHistory extends RecentBookingsEvent {
  final String userId;
  final String hotelId;

  LoadHotelBookingHistory(this.userId, this.hotelId);

  @override
  List<Object> get props => [userId, hotelId];
}

class LoadBookingHistory extends RecentBookingsEvent {
  final String userId;
  final String status;

  LoadBookingHistory(this.userId, {this.status = 'all'});

  @override
  List<Object> get props => [userId, status];
}

class RefreshRecentBookings extends RecentBookingsEvent {
  final String userId;

  RefreshRecentBookings(this.userId);

  @override
  List<Object> get props => [userId];
}