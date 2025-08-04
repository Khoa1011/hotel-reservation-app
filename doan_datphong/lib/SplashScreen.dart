import 'dart:async';
import 'package:doan_datphong/Data/Provider/auth_provider.dart';
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

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();

    // Tạo animation
    _controller = AnimationController(
      duration: Duration(seconds: 2),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));

    _scaleAnimation = Tween<double>(
      begin: 0.5,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.elasticOut,
    ));

    // Bắt đầu animation
    _controller.forward();

    // Delay 3 giây trước khi load user và navigate
    Timer(Duration(seconds: 5), () {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        context.read<UserAuthProvider>().loadUser().then((_) {
          _navigateBasedOnAuthState();
        });
      });
      context.read<CheckLoginBloc>().add(CheckLoginRequested());
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _navigateBasedOnAuthState() {
    final authProvider = context.read<UserAuthProvider>();

    if (authProvider.isLoggedIn) {
      // ✅ Đã đăng nhập, kiểm tra profile complete
      if (authProvider.user!.tenNguoiDung.isNotEmpty) {
        // Profile đầy đủ → HomeScreen
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => HomeScreen()),
        );
      } else {
        // Profile chưa đầy đủ → FillProfile
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => FillProfile()),
        );
      }
    } else {
      // ✅ Chưa đăng nhập → LoginScreen
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFF14D9E1),
      body: Center(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: ScaleTransition(
            scale: _scaleAnimation,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(60),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 10,
                        offset: Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      'S',
                      style: TextStyle(
                        fontSize: 60,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF14D9E1),
                      ),
                    ),
                  ),
                ),
                SizedBox(height: 30),

                // App name
                Text(
                  'Staytion',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 10),

                Text(
                  'Your Perfect Stay Awaits',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white.withOpacity(0.8),
                  ),
                ),
                SizedBox(height: 50),

                // Loading indicator
                CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  strokeWidth: 3,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}