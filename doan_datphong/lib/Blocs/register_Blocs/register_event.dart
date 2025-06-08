abstract class RegisterEvent {}


class RegisterSubmitted extends RegisterEvent {
  final String email;
  final String password;
  RegisterSubmitted(this.email, this.password);


}
class RegisterCompleted extends RegisterEvent {
  final String email;

  RegisterCompleted({required this.email});
}
