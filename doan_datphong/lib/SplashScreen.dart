import 'package:doan_datphong/Views/home_View/home_screen.dart';
import 'package:doan_datphong/Views/login_View/login_screen.dart';
import 'package:doan_datphong/Views/register_View/fill_profile_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'Blocs/checkLogin_Blocs/checkLogin_bloc.dart';
import 'Blocs/login_Blocs/login_state.dart';
import 'Blocs/logout_bloc/logout_bloc.dart';
import 'Blocs/logout_bloc/logout_event.dart';

class SplashScreen extends StatefulWidget {
  @override
  _SplashScreenState createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  void _handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString("token");
    await prefs.clear();
    // if (token != null) {
    //   context.read<LogoutBloc>().add(LogoutRequested(token));
    // } else {
    //   // If no token exists, just clear and navigate
    //   await prefs.remove("token");
    //
    // }
  }
  @override
  void initState() {
    super.initState();
    // _handleLogout();
    context.read<CheckLoginBloc>().add(CheckLoginRequested());

  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<CheckLoginBloc, CheckLoginState>(
      builder: (context, state) {
        if (state is CheckLoginLoading) {
          return Scaffold(body: Center(child: CircularProgressIndicator()));
        } else if (state is LoginIncomplete) {
          return FillProfile();
        } else if(state is CheckLoginSuccess){
         return HomeScreen(user: state.user);
        }else {
          return LoginScreen();
        }
      },
    );
  }
}
