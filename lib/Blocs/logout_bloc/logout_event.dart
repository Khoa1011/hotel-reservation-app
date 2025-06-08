abstract class LogoutEvent {}

class LogoutRequested extends LogoutEvent {
  final String token;

  LogoutRequested(this.token);
}