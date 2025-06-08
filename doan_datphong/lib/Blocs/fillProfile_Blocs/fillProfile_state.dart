import 'package:doan_datphong/Models/User.dart';

abstract class FillProfileState {}

class FillProfileInitial extends FillProfileState{}
class FillProfileLoading extends FillProfileState{}
class FillProfileSuccess extends FillProfileState{
  late final User user;

  FillProfileSuccess(this.user);
}
class FillProfileFailure extends FillProfileState{
  final String? errorMessage;

  FillProfileFailure(this.errorMessage);
}