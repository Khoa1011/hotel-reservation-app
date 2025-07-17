import 'package:doan_datphong/Blocs/recentlyBookedHotels_Blocs/recentlyBookedHotels_event.dart';
import 'package:doan_datphong/Blocs/recentlyBookedHotels_Blocs/recentlyBookedHotels_state.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../Data/Repository/recentlyBookedHotels_Repository/recentlyBookedHotels_repo.dart';



class RecentBookingsBloc extends Bloc<RecentBookingsEvent, RecentBookingsState> {
  final RecentBookingsRepository repository;

  RecentBookingsBloc({required this.repository}) : super(RecentBookingsInitial()) {
    on<LoadRecentBookings>(_onLoadRecentBookings);
    on<LoadHotelBookingHistory>(_onLoadHotelBookingHistory);
    on<RefreshRecentBookings>(_onRefreshRecentBookings);
  }

  // ✅ THAY ĐỔI: Load recent hotels (nhóm theo khách sạn)
  void _onLoadRecentBookings(LoadRecentBookings event, Emitter<RecentBookingsState> emit) async {
    emit(RecentBookingsLoading());

    try {
      final response = await repository.getRecentBookings(event.userId, limit: event.limit);

      if (response.success) {
        final hotels = response.data as List<dynamic>;

        emit(RecentBookingsLoaded(
          bookings: hotels, // Giờ là danh sách hotels
          count: hotels.length,
        ));
      } else {
        emit(RecentBookingsError(response.message));
      }
    } catch (e) {
      emit(RecentBookingsError('Lỗi tải danh sách khách sạn đã đặt: ${e.toString()}'));
    }
  }

  // ✅ MỚI: Load chi tiết lịch sử của 1 khách sạn
  void _onLoadHotelBookingHistory(LoadHotelBookingHistory event, Emitter<RecentBookingsState> emit) async {
    emit(RecentBookingsLoading());

    try {
      final response = await repository.getHotelBookingHistory(event.userId, event.hotelId);

      if (response.success) {
        final data = response.data as Map<String, dynamic>;

        emit(HotelBookingHistoryLoaded(
          hotelData: data['hotel'] ?? {},
          bookings: data['bookings'] ?? [],
          stats: data['stats'] ?? {},
        ));
      } else {
        emit(RecentBookingsError(response.message));
      }
    } catch (e) {
      emit(RecentBookingsError('Lỗi tải lịch sử khách sạn: ${e.toString()}'));
    }
  }

  void _onRefreshRecentBookings(RefreshRecentBookings event, Emitter<RecentBookingsState> emit) async {
    try {
      final response = await repository.getRecentBookings(event.userId, limit: 10);

      if (response.success) {
        final hotels = response.data as List<dynamic>;

        emit(RecentBookingsLoaded(
          bookings: hotels,
          count: hotels.length,
        ));
      } else {
        emit(RecentBookingsError(response.message));
      }
    } catch (e) {
      emit(RecentBookingsError('Lỗi refresh danh sách khách sạn: ${e.toString()}'));
    }
  }
}