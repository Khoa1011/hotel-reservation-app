import 'package:flutter_bloc/flutter_bloc.dart';

import '../../Data/Repository/bookingCheckUser_Repository/bookingCheckUser_repo.dart';
import 'bookingCheckUser_event.dart';
import 'bookingCheckUser_state.dart';

class BookingCheckBloc extends Bloc<BookingCheckEvent, BookingCheckState> {
  final BookingCheckRepository repository;

  BookingCheckBloc({required this.repository}) : super(BookingCheckInitial()) {
    on<CheckUserBanStatus>(_onCheckUserBanStatus);
    on<TriggerOverdueCheck>(_onTriggerOverdueCheck);
  }

  void _onCheckUserBanStatus(CheckUserBanStatus event, Emitter<BookingCheckState> emit) async {
    emit(BookingCheckLoading());

    try {
      final response = await repository.checkUserBanStatus(event.userId);

      if (response.success) {
        final data = response.data as Map<String, dynamic>;

        emit(UserBanStatusLoaded(
          isBannedFromCash: data['isBannedFromCash'] ?? false,
          noShowCount: data['noShowCount'] ?? 0,
          banDate: data['banDate'] != null ? DateTime.parse(data['banDate']) : null,
          canPayCash: data['canPayCash'] ?? true,
          noShowHistory: data['noShowHistory'] ?? [],
        ));
      } else {
        emit(BookingCheckError(response.message));
      }
    } catch (e) {
      emit(BookingCheckError('Lỗi kiểm tra trạng thái user: ${e.toString()}'));
    }
  }

  void _onTriggerOverdueCheck(TriggerOverdueCheck event, Emitter<BookingCheckState> emit) async {
    emit(BookingCheckLoading());

    try {
      final response = await repository.triggerOverdueCheck();

      if (response.success) {
        final data = response.data as Map<String, dynamic>;

        emit(OverdueCheckCompleted(
          message: data['message'] ?? 'Kiểm tra hoàn tất',
          timestamp: data['timestamp'] ?? '',
        ));
      } else {
        emit(BookingCheckError(response.message));
      }
    } catch (e) {
      emit(BookingCheckError('Lỗi kiểm tra booking quá hạn: ${e.toString()}'));
    }
  }

}