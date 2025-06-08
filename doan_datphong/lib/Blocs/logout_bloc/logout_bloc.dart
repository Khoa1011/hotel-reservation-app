import 'package:flutter_bloc/flutter_bloc.dart';

import '../../Data/Repository/logout_Repository/logout_repo.dart';
import 'logout_event.dart';
import 'logout_state.dart';


class LogoutBloc extends Bloc<LogoutEvent, LogoutState> {
  final LogoutRepository logoutRepository;

  LogoutBloc({required this.logoutRepository}) : super(LogoutInitial()) {
    on<LogoutRequested>(_onLogoutRequested);
  }

  Future<void> _onLogoutRequested(
      LogoutRequested event, Emitter<LogoutState> emit) async {
    emit(LogoutLoading());

    try {
      final response = await logoutRepository.logout(event.token);

      if (response.success) {
        emit(LogoutSuccess());
      } else {
        emit(LogoutFailure(response.message ?? "Đăng xuất thất bại"));
      }
    } catch (e) {
      emit(LogoutFailure("Lỗi hệ thống: $e"));
    }
  }
}
