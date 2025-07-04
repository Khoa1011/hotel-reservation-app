import 'package:equatable/equatable.dart';
import 'package:doan_datphong/Data/Repository/getBookingList_Repository/getBookingList_repo.dart';

import '../../Models/BookingFull.dart';

abstract class GetBookingListState extends Equatable {
  @override
  List<Object?> get props => [];
}

class GetBookingListInitial extends GetBookingListState {}

class GetBookingListLoading extends GetBookingListState {}

class GetBookingListSuccess extends GetBookingListState {
  final List<BookingWithHotel> bookingFulls;
  final List<BookingWithHotel> filteredBookings;
  final String currentFilter;

  GetBookingListSuccess(
      this.bookingFulls, {
        List<BookingWithHotel>? filteredBookings,
        this.currentFilter = 'all',
      }) : filteredBookings = filteredBookings ?? bookingFulls;

  @override
  List<Object?> get props => [bookingFulls, filteredBookings, currentFilter];

  GetBookingListSuccess copyWith({
    List<BookingWithHotel>? bookingFulls,
    List<BookingWithHotel>? filteredBookings,
    String? currentFilter,
  }) {
    return GetBookingListSuccess(
      bookingFulls ?? this.bookingFulls,
      filteredBookings: filteredBookings ?? this.filteredBookings,
      currentFilter: currentFilter ?? this.currentFilter,
    );
  }
}

class GetBookingListFailure extends GetBookingListState {
  final String error;

  GetBookingListFailure(this.error);

  @override
  List<Object?> get props => [error];
}

// States for booking detail
class BookingDetailLoading extends GetBookingListState {}

class BookingDetailSuccess extends GetBookingListState {
  final BookingDetail bookingDetail;

  BookingDetailSuccess(this.bookingDetail);

  @override
  List<Object?> get props => [bookingDetail];
}

class BookingDetailFailure extends GetBookingListState {
  final String error;

  BookingDetailFailure(this.error);

  @override
  List<Object?> get props => [error];
}

// States for cancel booking
class CancelBookingLoading extends GetBookingListState {}

class CancelBookingSuccess extends GetBookingListState {
  final String message;

  CancelBookingSuccess(this.message);

  @override
  List<Object?> get props => [message];
}

class CancelBookingFailure extends GetBookingListState {
  final String error;

  CancelBookingFailure(this.error);

  @override
  List<Object?> get props => [error];
}