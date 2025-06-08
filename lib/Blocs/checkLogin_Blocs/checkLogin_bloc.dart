import 'package:doan_datphong/Models/User.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Sự kiện kiểm tra đăng nhập
abstract class CheckLoginEvent {}
class CheckLoginRequested extends CheckLoginEvent {}

// Trạng thái của việc kiểm tra đăng nhập
abstract class CheckLoginState {}
class CheckLoginInitial extends CheckLoginState {}
class CheckLoginLoading extends CheckLoginState {}
class CheckLoginSuccess extends CheckLoginState {
  final User user;
  CheckLoginSuccess({required this.user});
}
class CheckLoginFailure extends CheckLoginState {}

class CheckLoginBloc extends Bloc<CheckLoginEvent, CheckLoginState> {
  CheckLoginBloc() : super(CheckLoginInitial()) {
    on<CheckLoginRequested>(_onCheckLoginRequested);
  }

  Future<void> _onCheckLoginRequested(
      CheckLoginRequested event, Emitter<CheckLoginState> emit) async {
    emit(CheckLoginLoading());

    await Future.delayed(Duration(seconds: 2));
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String? token = prefs.getString("token");
    String? userJson = prefs.getString("user"); // Lấy thông tin User từ SharedPreferences

    if (token != null && token.isNotEmpty && userJson != null) {
      User user = User.fromJsonString(userJson); // Chuyển đổi JSON thành User
      emit(CheckLoginSuccess(user: user)); // Truyền User vào state
    } else {
      emit(CheckLoginFailure());
    }
  }

}
