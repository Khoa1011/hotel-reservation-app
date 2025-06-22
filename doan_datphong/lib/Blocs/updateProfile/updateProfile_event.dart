import 'package:doan_datphong/Models/NguoiDung.dart';
import 'package:equatable/equatable.dart';

abstract class UpdateProfileEvent extends Equatable{

  @override
  List<Object> get props => [];
}

class UpdateProfileSubmiited extends UpdateProfileEvent{
  final NguoiDung user;

  UpdateProfileSubmiited( this.user);
}