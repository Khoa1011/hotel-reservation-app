import 'package:doan_datphong/Blocs/getListBooking_Blocs/getBookingList_event.dart';
import 'package:doan_datphong/Blocs/getListBooking_Blocs/getBookingList_state.dart';
import 'package:doan_datphong/Data/Repository/getBookingList_Repository/getBookingList_repo.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../Models/BookingFull.dart';

class GetBookingListBloc extends Bloc<GetBookingListEvent, GetBookingListState> {
  final GetBookingListRepository fetchList;

  GetBookingListBloc({required this.fetchList}) : super(GetBookingListInitial()) {
    on<FetchBookingList>(_onFetchBookingList);
    on<FetchBookingDetail>(_onFetchBookingDetail);
    on<CancelBooking>(_onCancelBooking);
    on<FilterBookingsByStatus>(_onFilterBookingsByStatus);
    on<RefreshBookingList>(_onRefreshBookingList);
  }

  void _onFetchBookingList(FetchBookingList event, Emitter<GetBookingListState> emit) async {
    emit(GetBookingListLoading());

    try {
      List<BookingWithHotel> bookingFulls = await fetchList.fetchBookings(event.userId);
      emit(GetBookingListSuccess(bookingFulls));
    } catch (err) {
      emit(GetBookingListFailure(err.toString()));
    }
  }

  void _onFetchBookingDetail(FetchBookingDetail event, Emitter<GetBookingListState> emit) async {
    emit(BookingDetailLoading());

    try {
      BookingDetail bookingDetail = await fetchList.fetchBookingDetail(event.bookingId);
      emit(BookingDetailSuccess(bookingDetail));
    } catch (err) {
      emit(BookingDetailFailure(err.toString()));
    }
  }

  void _onCancelBooking(CancelBooking event, Emitter<GetBookingListState> emit) async {
    emit(CancelBookingLoading());

    try {
      bool success = await fetchList.cancelBooking(event.bookingId, event.reason);
      if (success) {
        emit(CancelBookingSuccess("Booking đã được hủy thành công"));
      } else {
        emit(CancelBookingFailure("Không thể hủy booking"));
      }
    } catch (err) {
      emit(CancelBookingFailure(err.toString()));
    }
  }

  void _onFilterBookingsByStatus(FilterBookingsByStatus event, Emitter<GetBookingListState> emit) {
    if (state is GetBookingListSuccess) {
      final currentState = state as GetBookingListSuccess;

      List<BookingWithHotel> filteredBookings;

      if (event.status == 'all') {
        filteredBookings = currentState.bookingFulls;
      } else {
        filteredBookings = currentState.bookingFulls
            .where((booking) => booking.status == event.status)
            .toList();
      }

      emit(currentState.copyWith(
        filteredBookings: filteredBookings,
        currentFilter: event.status,
      ));
    }
  }

  void _onRefreshBookingList(RefreshBookingList event, Emitter<GetBookingListState> emit) async {
    // Không emit loading state để tránh làm gián đoạn UI
    try {
      List<BookingWithHotel> bookingFulls = await fetchList.fetchBookings(event.userId);

      if (state is GetBookingListSuccess) {
        final currentState = state as GetBookingListSuccess;

        // Áp dụng lại filter hiện tại
        List<BookingWithHotel> filteredBookings;
        if (currentState.currentFilter == 'all') {
          filteredBookings = bookingFulls;
        } else {
          filteredBookings = bookingFulls
              .where((booking) => booking.status == currentState.currentFilter)
              .toList();
        }

        emit(GetBookingListSuccess(
          bookingFulls,
          filteredBookings: filteredBookings,
          currentFilter: currentState.currentFilter,
        ));
      } else {
        emit(GetBookingListSuccess(bookingFulls));
      }
    } catch (err) {
      emit(GetBookingListFailure(err.toString()));
    }
  }

  // Helper method để lấy bookings theo filter
  List<BookingWithHotel> getFilteredBookings(String filter) {
    if (state is GetBookingListSuccess) {
      final currentState = state as GetBookingListSuccess;

      if (filter == 'all') {
        return currentState.bookingFulls;
      } else {
        return currentState.bookingFulls
            .where((booking) => booking.status == filter)
            .toList();
      }
    }
    return [];
  }
}