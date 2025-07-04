import 'package:equatable/equatable.dart';

abstract class GetBookingListEvent extends Equatable {
  @override
  List<Object> get props => [];
}

class FetchBookingList extends GetBookingListEvent {
  final String userId;

  FetchBookingList(this.userId);

  @override
  List<Object> get props => [userId];
}

class FetchBookingDetail extends GetBookingListEvent {
  final String bookingId;

  FetchBookingDetail(this.bookingId);

  @override
  List<Object> get props => [bookingId];
}

class CancelBooking extends GetBookingListEvent {
  final String bookingId;
  final String reason;

  CancelBooking(this.bookingId, this.reason);

  @override
  List<Object> get props => [bookingId, reason];
}

class FilterBookingsByStatus extends GetBookingListEvent {
  final String status; // 'ongoing', 'completed', 'canceled'

  FilterBookingsByStatus(this.status);

  @override
  List<Object> get props => [status];
}

class RefreshBookingList extends GetBookingListEvent {
  final String userId;

  RefreshBookingList(this.userId);

  @override
  List<Object> get props => [userId];
}