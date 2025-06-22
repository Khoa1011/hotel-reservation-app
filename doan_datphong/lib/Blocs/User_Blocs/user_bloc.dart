import 'package:doan_datphong/Models/NguoiDung.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class UserBloc extends Cubit<NguoiDung?>{
  UserBloc():super(null);

  void setCurrentUser (NguoiDung user){
    emit(user);
  }
  void clearUser(){
    emit(null);
  }
}