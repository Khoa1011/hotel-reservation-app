import 'package:doan_datphong/Models/NguoiDung.dart';

abstract class FillProfileState {}

class FillProfileInitial extends FillProfileState{}
class FillProfileLoading extends FillProfileState{}
class FillProfileSuccess extends FillProfileState{
  late final NguoiDung user;

  FillProfileSuccess(this.user);
}
class FillProfileFailure extends FillProfileState{
  final String? errorMessage;

  FillProfileFailure(this.errorMessage);
}