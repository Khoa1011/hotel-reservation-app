abstract class UpdateProfileState{}


class UpdateProfileInitial extends UpdateProfileState{}
class UpdateProfileLoading extends UpdateProfileState{}
class UpdateProfileSuccess extends UpdateProfileState{
  final dynamic userData;
  UpdateProfileSuccess(this.userData);
}
class UpdateProfileFailure extends UpdateProfileState{
  final String errorMessage;
  UpdateProfileFailure(this.errorMessage);

}
