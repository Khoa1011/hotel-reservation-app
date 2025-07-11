import 'package:doan_datphong/Blocs/login_Blocs/login_event.dart';
import 'package:doan_datphong/Blocs/login_Blocs/login_state.dart';
import 'package:doan_datphong/Data/Provider/ApiResponse.dart';
import 'package:doan_datphong/Data/Repository/login_Repository/login_repo.dart';
import 'package:doan_datphong/Models/NguoiDung.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../Data/Provider/IP_v4_Address.dart';
import '../../Data/Provider/auth_provider.dart';
import '../../notification_service.dart';

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
      await _registerFCMToken(user.id);
      if(resIsUser.success){

        emit(LoginSuccess(user));
      }else{
        emit(LoginIncomplete(user: user));
      }

    }catch(e){
      emit(LoginFailure(e.toString()));
    }
  }

  Future<void> _registerFCMToken(String userId) async {
    try {
      final fcmToken = await FirebaseMessaging.instance.getToken();
      bool hasPermission = await NotificationService.requestPermission();
      print("FCM Token: $fcmToken");
      if (fcmToken != null) {
        final response = await http.post(
          Uri.parse('${IPv4.IP_CURRENT}/api/notification/register-token'),
          headers: {'Content-Type': 'application/json'},
          body: json.encode({
            'userId': userId,
            'fcmToken': fcmToken,
            'deviceInfo': {
              'deviceType': 'android',
              'appVersion': '1.0.0'
            }
          }),
        );
        print('✅ FCM token registered: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Error registering FCM token: $e');
    }
  }
}