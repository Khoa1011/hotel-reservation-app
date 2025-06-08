abstract class RegisterState{}


class RegisterInitial extends RegisterState{}
class RegisterLoading extends RegisterState{}
class RegisterSuccess extends RegisterState{
  final dynamic userData;
  RegisterSuccess(this.userData);
}
class RegisterFailure extends RegisterState{
  final String errorMessage;
  RegisterFailure(this.errorMessage);

}
