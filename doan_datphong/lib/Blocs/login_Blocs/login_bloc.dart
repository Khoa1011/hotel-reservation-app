import 'package:doan_datphong/Blocs/login_Blocs/login_event.dart';
import 'package:doan_datphong/Blocs/login_Blocs/login_state.dart';
import 'package:doan_datphong/Data/Provider/ApiResponse.dart';
import 'package:doan_datphong/Data/Repository/login_Repository/login_repo.dart';
import 'package:doan_datphong/Models/NguoiDung.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../Data/Provider/auth_provider.dart';

class LoginBloc extends Bloc<LoginEvent,LoginState>{
  late final LoginRepository loginRepository;
  final UserAuthProvider? authProvider;

  LoginBloc({
    required this.loginRepository,
    this.authProvider,
  }):super(LoginInitial()){
    on<LoginSubmiited>(_onLoginSubmitted);

  }
  void _onLoginSubmitted(LoginSubmiited event, Emitter<LoginState> emit) async{
    emit (LoginLoading()); // Hiển thị loading khi đăng nhập
    try{
      // Gọi API đăng nhập
      ApiResponse res = await loginRepository.login(event.email, event.password);
      ApiResponse? resIsUser = await loginRepository.isUserProfileComplete();
      print(res);

      if(!res!.success){
        emit(LoginFailure(res.message));
        return;
      }

      if (authProvider != null) {
        await authProvider!.refreshUserData(); // Refresh từ SharedPreferences
        print("✅ Auth provider đã được cập nhật với user: ${res.data}");
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