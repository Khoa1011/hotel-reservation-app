import 'package:doan_datphong/Models/NguoiDung.dart';
import 'package:equatable/equatable.dart';

abstract class FillProfileEvent extends Equatable{

  @override
  List<Object> get props => [];
}

class FillProfileSubmiited extends FillProfileEvent{
  final NguoiDung user;

  FillProfileSubmiited( this.user);
}