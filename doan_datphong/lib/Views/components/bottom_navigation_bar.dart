import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../home_View/home_screen.dart';
import '../seach_View/search_screen.dart';
import '../listBooking_View/listBooking_screen.dart';
import '../profile_View/profile_screen.dart';
import '../login_View/login_screen.dart';
import '../../generated/l10n.dart';

enum BottomNavPages { home, search, booking, profile }

class CustomBottomNavigation extends StatelessWidget {
  final BottomNavPages currentPage;
  final VoidCallback? onUserNotFound; // Callback tùy chỉnh nếu cần

  const CustomBottomNavigation({
    Key? key,
    required this.currentPage,
    this.onUserNotFound,
  }) : super(key: key);

  int get currentIndex {
    switch (currentPage) {
      case BottomNavPages.home:
        return 0;
      case BottomNavPages.search:
        return 1;
      case BottomNavPages.booking:
        return 2;
      case BottomNavPages.profile:
        return 3;
    }
  }

  // ✅ Kiểm tra user có đăng nhập không
  Future<bool> _isUserLoggedIn() async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      String? token = prefs.getString("token");
      String? userJson = prefs.getString("user");
      return token != null && userJson != null;
    } catch (e) {
      return false;
    }
  }

  // ✅ Xử lý khi user chưa đăng nhập
  void _handleUserNotFound(BuildContext context) {
    if (onUserNotFound != null) {
      onUserNotFound!();
      return;
    }

    // Default behavior
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text(
            'Lỗi đăng nhập',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: Color(0xFF1565C0),
            ),
          ),
          content: Text('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text('Hủy', style: TextStyle(color: Colors.grey[600])),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                _clearUserData();
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (context) => LoginScreen()),
                      (route) => false,
                );
              },
              style: ElevatedButton.styleFrom(backgroundColor: Color(0xFF1565C0)),
              child: Text('Đăng nhập', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );
  }

  // ✅ Xóa user data khi logout
  Future<void> _clearUserData() async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      await prefs.clear();
    } catch (e) {
      print('Error clearing user data: $e');
    }
  }

  // ✅ Navigate với animation
  void _navigateToPage(BuildContext context, Widget page) {
    Navigator.pushReplacement(
      context,
      PageRouteBuilder(
        pageBuilder: (context, animation1, animation2) => page,
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(
            opacity: animation,
            child: child,
          );
        },
        transitionDuration: Duration(milliseconds: 300),
      ),
    );
  }

  // ✅ Handle tap navigation
  void _onItemTapped(BuildContext context, int index) async {
    // Kiểm tra user đăng nhập
    bool isLoggedIn = await _isUserLoggedIn();
    if (!isLoggedIn) {
      _handleUserNotFound(context);
      return;
    }

    // Nếu đang ở trang hiện tại thì không navigate
    if (index == currentIndex) return;

    // Navigate đến trang tương ứng
    switch (index) {
      case 0:
        _navigateToPage(context, HomeScreen());
        break;
      case 1:
        _navigateToPage(context, SearchView());
        break;
      case 2:
        _navigateToPage(context, ListBookingScreen());
        break;
      case 3:
        _navigateToPage(context, ProfileScreen());
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      currentIndex: currentIndex,
      onTap: (index) => _onItemTapped(context, index),
      type: BottomNavigationBarType.fixed,
      selectedItemColor: Color(0xFF1565C0),
      unselectedItemColor: Color(0xFF525150),
      items: [
        BottomNavigationBarItem(
          icon: Icon(Icons.home),
          label: S.of(context).home,
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.search),
          label: S.of(context).search,
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.view_list_outlined),
          label: S.of(context).booking,
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.person),
          label: S.of(context).profile,
        ),
      ],
    );
  }
}