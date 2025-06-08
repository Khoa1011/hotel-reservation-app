import 'package:doan_datphong/Models/User.dart';
import 'package:equatable/equatable.dart';

abstract class FillProfileEvent extends Equatable{

  @override
  List<Object> get props => [];
}

class FillProfileSubmiited extends FillProfileEvent{
  final User user;

  FillProfileSubmiited( this.user);
}