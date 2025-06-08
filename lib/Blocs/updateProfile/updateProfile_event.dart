import 'package:doan_datphong/Models/User.dart';
import 'package:equatable/equatable.dart';

abstract class UpdateProfileEvent extends Equatable{

  @override
  List<Object> get props => [];
}

class UpdateProfileSubmiited extends UpdateProfileEvent{
  final User user;

  UpdateProfileSubmiited( this.user);
}