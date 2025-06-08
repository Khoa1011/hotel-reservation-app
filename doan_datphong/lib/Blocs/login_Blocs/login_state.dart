import 'package:doan_datphong/Models/User.dart';

abstract class LoginState{}


class LoginInitial extends LoginState{}
class LoginLoading extends LoginState{}
class LoginSuccess extends LoginState{
  final dynamic userData;
  LoginSuccess(this.userData);

  String get userEmail => userData['email'] ?? 'Không có email nào (state)';  // Lấy email từ userData
  String get userToken => userData['token'] ?? 'Không có token nào (state)';  // Lấy token từ userData
}
class LoginFailure extends LoginState{
  final String errorMessage;
  LoginFailure(this.errorMessage);

}

class LoginIncomplete extends LoginState {
  final User user;
  LoginIncomplete({required this.user});
}
