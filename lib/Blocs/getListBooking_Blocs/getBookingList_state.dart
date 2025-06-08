import 'package:doan_datphong/Models/BookingFull.dart';
import 'package:doan_datphong/Models/Bookings.dart';

abstract class GetBookingListState{
  @override
  List<Object?> get props => [];
}

class GetBookingListInitial extends GetBookingListState{}
class GetBookingListLoading extends GetBookingListState{}
class GetBookingListSuccess extends GetBookingListState{
  final List<BookingWithHotel> bookingFulls;
  GetBookingListSuccess(this.bookingFulls);

  @override
  List<Object?> get props => [bookingFulls];
}
class GetBookingListFailure extends GetBookingListState{
  final String error;
  GetBookingListFailure(this.error);

  @override
  List<Object?> get props => [error];
}