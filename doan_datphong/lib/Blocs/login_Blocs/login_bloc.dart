import 'package:doan_datphong/Blocs/login_Blocs/login_event.dart';
import 'package:doan_datphong/Blocs/login_Blocs/login_state.dart';
import 'package:doan_datphong/Data/Provider/ApiResponse.dart';
import 'package:doan_datphong/Data/Repository/login_Repository/login_repo.dart';
import 'package:doan_datphong/Models/NguoiDung.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class LoginBloc extends Bloc<LoginEvent,LoginState>{
  late final LoginRepository loginRepository;

  LoginBloc({required this.loginRepository}):super(LoginInitial()){
    on<LoginSubmiited>(_onLoginSubmitted);
  }
  void _onLoginSubmitted(LoginSubmiited event, Emitter<LoginState> emit) async{
    emit (LoginLoading()); // Hiển thị loading khi đăng nhập
    try{
      // Gọi API đăng nhập
      ApiResponse? res = await loginRepository.login(event.email, event.password);
      ApiResponse? resIsUser = await loginRepository.isUserProfileComplete();
      if(!res!.success){
        emit(LoginFailure(res.message));
        return;
      }
      NguoiDung user = res.data;
      if(resIsUser.success){
        emit(LoginSuccess(user));
      }else{
        emit(LoginIncomplete(user: user));
      }

    }catch(e){
      emit(LoginFailure(e.toString()));
    }
  }
}