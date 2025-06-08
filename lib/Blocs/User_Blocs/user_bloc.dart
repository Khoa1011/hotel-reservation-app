import 'package:doan_datphong/Models/User.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class UserBloc extends Cubit<User?>{
  UserBloc():super(null);

  void setCurrentUser (User user){
    emit(user);
  }
  void clearUser(){
    emit(null);
  }
}