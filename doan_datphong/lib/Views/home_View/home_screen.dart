import 'dart:io';
import 'package:doan_datphong/Data/Provider/auth_provider.dart';
import 'package:doan_datphong/Views/components/bottom_navigation_bar.dart';
import 'package:doan_datphong/Views/home_View/listHotelView.dart';
import 'package:doan_datphong/Views/home_View/listHotelView_type.dart';
import 'package:doan_datphong/Views/home_View/recentlyBookedHotel_widget.dart';
import 'package:doan_datphong/Views/home_View/reservationTypes_widget.dart';
import 'package:doan_datphong/Views/home_View/searchView.dart';
import 'package:doan_datphong/Views/listBooking_View/listBooking_screen.dart';
import 'package:doan_datphong/Views/profile_View/profile_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../Blocs/favoriteHotel_Blocs/favoriteHotel_bloc.dart';
import '../../Data/Repository/favoriteHotel_Repository/favoriteHotel_repo.dart';
import '../../Models/NguoiDung.dart';
import '../login_View/login_screen.dart';
import '../seach_View/search_screen.dart';
import 'package:doan_datphong/generated/l10n.dart';

import 'favoriteHotel_screen.dart';

class HomeScreen extends StatefulWidget {

  const HomeScreen({super.key,
  });
  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomeScreen> {
  int currentIndex = 0;
  bool recommendedButtonPressed = false;
  bool popularButtonPressed = false;
  bool trendingButtonPressed = false;

  bool iconBookMarkPressed = false;
  bool iconBookMarkRecentlyPressed = false;
  ReservationType? selectedReservationType;

  @override
  void initState() {
    super.initState();
    // _saveUserId();
  }


  // Hàm lưu user_id vào SharedPreferences
  // Future<void> _saveUserId() async {
  //   SharedPreferences prefs = await SharedPreferences.getInstance();
  //   await prefs.setString("user_id", widget.user!.id);
  //   await prefs.setString("user_std", widget.user!.soDienThoai);
  //   print("Token current: ${prefs.getString("token")}");
  //   print("User ID saved: ${widget.user!.id}");
  //   print("User phone number saved: ${widget.user!.soDienThoai}");
  // }

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      backgroundColor: Color(0xffE3F2FD),
      appBar: AppBar(
        backgroundColor: Colors.white,

        leading: Padding(
          padding: const EdgeInsets.only(left: 16.0, top: 10.0, bottom: 8.0),
          child: CircleAvatar(
            radius: 30,
            backgroundImage: AssetImage('assets/images/logoStaytion.png'),
          ),
        ),

        title: const Text(
          "Staytion",
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Color(0xFF42A5F5),

          ),
        ),
        centerTitle: false,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0, top: 8.0),
            child: Row(
              children: [
                Icon(
                  Icons.notifications_none_outlined,
                  color: Color(0xFF525150),
                  size: 30,
                ),
                const SizedBox(width: 15),
                GestureDetector(
                  onTap: () {
                    // Check if user logged in
                    final authProvider = Provider.of<UserAuthProvider>(context, listen: false);
                    if (authProvider.isLoggedIn) {
                      // Navigate to favorite hotels screen
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => FavoriteHotelsScreen(), // ✅ Không wrap BlocProvider
                        ),
                      );
                    } else {
                      // Show login required dialog
                      showDialog(
                        context: context,
                        builder: (BuildContext context) {
                          return AlertDialog(
                            title: Text('Đăng nhập cần thiết'),
                            content: Text('Bạn cần đăng nhập để xem danh sách khách sạn đã lưu.'),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.of(context).pop(),
                                child: Text('Hủy'),
                              ),
                              ElevatedButton(
                                onPressed: () {
                                  Navigator.of(context).pop();
                                  // Navigate to login screen
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (context) => LoginScreen()),
                                  );
                                },
                                child: Text('Đăng nhập'),
                              ),
                            ],
                          );
                        },
                      );
                    }
                  },
                  child: Icon(
                    Icons.bookmark_border_outlined,
                    color: Color(0xFF525150),
                    size: 30,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Container(
            child: Column(
              children: [
                Consumer<UserAuthProvider>(
                    builder: (context, authProvider ,child){
                      print("🏠 HomeScreen - User: ${authProvider.userName}");
                      print("🏠 HomeScreen - IsLoggedIn: ${authProvider.isLoggedIn}");
                      print("🏠 HomeScreen - UserId: ${authProvider.userId}");
                      return Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          "${S.of(context).welcomeToStaytion}, ${authProvider.userName ?? "Người dùng"}",
                          style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1565C0)
                          ),
                        ),
                      );
                    }
                ),
                const SizedBox(height: 15),

                SearchBarWithAnimation(),
                const SizedBox(height: 15),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      AnimatedContainer(
                        duration: Duration(milliseconds: 300),
                        curve: Curves.bounceOut,
                        decoration: BoxDecoration(
                          color:
                              recommendedButtonPressed
                                  ? Color(0xFF1565C0)
                                  : Colors.white,
                          borderRadius: BorderRadius.circular(15),
                          border: Border.all(
                            color: Color(0xFF1565C0),
                            width:
                                recommendedButtonPressed
                                    ? 2
                                    : 2, // Độ dày viền thay đổi khi bấm
                          ),
                        ),
                        child: IntrinsicWidth(
                          // ✅ Tự động điều chỉnh chiều rộng theo nội dung
                          child: TextButton(
                            onPressed: () {
                              setState(() {
                                recommendedButtonPressed =
                                    !recommendedButtonPressed;
                              });
                            },
                            style: ButtonStyle(
                              padding: WidgetStateProperty.all<EdgeInsets>(
                                EdgeInsets.symmetric(
                                  horizontal: 20,
                                  vertical: 10,
                                ), // ✅ Khoảng cách trong nút
                              ),
                            ),
                            child: Text(
                              S.of(context).recommended,
                              style: TextStyle(
                                color:
                                    recommendedButtonPressed
                                        ? Colors.white
                                        : Color(0xFF1565C0),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 15),
                      AnimatedContainer(
                        duration: Duration(milliseconds: 300),
                        curve: Curves.bounceOut,
                        decoration: BoxDecoration(
                          color:
                              popularButtonPressed
                                  ? Color(0xFF1565C0)
                                  : Colors.white,
                          borderRadius: BorderRadius.circular(15),
                          border: Border.all(
                            color: Color(0xFF1565C0),
                            width:
                                popularButtonPressed
                                    ? 2
                                    : 2, // Độ dày viền thay đổi khi bấm
                          ),
                        ),
                        child: IntrinsicWidth(
                          // ✅ Tự động điều chỉnh chiều rộng theo nội dung
                          child: TextButton(
                            onPressed: () {
                              setState(() {
                                popularButtonPressed = !popularButtonPressed;
                              });
                            },
                            style: ButtonStyle(
                              padding: WidgetStateProperty.all<EdgeInsets>(
                                EdgeInsets.symmetric(
                                  horizontal: 20,
                                  vertical: 10,
                                ), // ✅ Khoảng cách trong nút
                              ),
                            ),
                            child: Text(
                              S.of(context).popular,
                              style: TextStyle(
                                color:
                                    popularButtonPressed
                                        ? Colors.white
                                        : Color(0xFF1565C0),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 15),
                      AnimatedContainer(
                        duration: Duration(milliseconds: 300),
                        curve: Curves.bounceOut,
                        decoration: BoxDecoration(
                          color:
                              trendingButtonPressed
                                  ? Color(0xFF1565C0)
                                  : Colors.white,
                          borderRadius: BorderRadius.circular(15),
                          border: Border.all(
                            color: Color(0xFF1565C0),
                            width:
                                trendingButtonPressed
                                    ? 2
                                    : 2, // Độ dày viền thay đổi khi bấm
                          ),
                        ),
                        child: IntrinsicWidth(
                          // ✅ Tự động điều chỉnh chiều rộng theo nội dung
                          child: TextButton(
                            onPressed: () {
                              setState(() {
                                trendingButtonPressed =
                                    !trendingButtonPressed;
                              });
                            },
                            style: ButtonStyle(
                              padding: WidgetStateProperty.all<EdgeInsets>(
                                EdgeInsets.symmetric(
                                  horizontal: 20,
                                  vertical: 10,
                                ),
                              ),
                            ),
                            child: Text(
                              S.of(context).trending,
                              style: TextStyle(
                                color:
                                    trendingButtonPressed
                                        ? Colors.white
                                        : Color(0xFF1565C0),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 15),
                    ],
                  ),
                ),
                HotelViewSwitcher(),
                const SizedBox(height: 15),
                Consumer<UserAuthProvider>(
                  builder: (context, authProvider, child) {
                    if (authProvider.isLoggedIn && authProvider.userId != null) {
                      return RecentBookingsWidget(userId: authProvider.userId!);
                    } else {
                      return Container(
                        height: 200,
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.login, size: 50, color: Colors.grey[400]),
                              SizedBox(height: 10),
                              Text(
                                'Đăng nhập để xem khách sạn đã đặt',
                                style: TextStyle(
                                  color: Colors.grey[600],
                                  fontSize: 16,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }
                  },
                )
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: CustomBottomNavigation(
          currentPage: BottomNavPages.home),
    );
  }

  // ✅ Hàm xử lý khi chọn loại đặt phòng
  void _handleReservationTypeSelected(ReservationType type) {
    print("🏨 Selected reservation type: ${type.displayName}");

    switch (type) {
      case ReservationType.gan_ban:
      // Xử lý tìm khách sạn gần
        _findNearbyHotels();
        break;
      case ReservationType.theo_gio:
      // Xử lý đặt phòng theo giờ
        _navigateToHourlyBooking();
        break;
      case ReservationType.qua_dem:
      // Xử lý đặt phòng qua đêm
        _navigateToOvernightBooking();
        break;
      case ReservationType.dai_ngay:
      // Xử lý đặt phòng dài ngày
        _navigateToLongStayBooking();
        break;
    }
  }

  // ✅ Các hàm xử lý navigation
  void _findNearbyHotels() {
    // TODO: Implement tìm khách sạn gần
    // Có thể navigate đến SearchView với filter location
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => SearchView(
          // initialFilter: FilterType.nearby,
        ),
      ),
    );
  }

  void _navigateToHourlyBooking() {
    // TODO: Implement navigation đến trang đặt phòng theo giờ
    // Navigator.push(
    //   context,
    //   MaterialPageRoute(
    //     builder: (context) => ListHotelViewType(
    //       bookingType: "theo_gio",
    //     ),
    //   ),
    // );
  }

  void _navigateToOvernightBooking() {
    // TODO: Implement navigation đến trang đặt phòng qua đêm
    // Navigator.push(
    //   context,
    //   MaterialPageRoute(
    //     builder: (context) => ListHotelViewType(
    //       bookingType: "qua_dem",
    //     ),
    //   ),
    // );
  }

  void _navigateToLongStayBooking() {
    // TODO: Implement navigation đến trang đặt phòng dài ngày
    // Navigator.push(
    //   context,
    //   MaterialPageRoute(
    //     builder: (context) => ListHotelViewType(
    //       bookingType: "dai_ngay",
    //     ),
    //   ),
    // );
  }


// void _handleUserNotFound() {
  //   showDialog(
  //     context: context,
  //     builder: (BuildContext context) {
  //       return AlertDialog(
  //         title: Text('Lỗi đăng nhập'),
  //         content: Text('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'),
  //         actions: [
  //           TextButton(
  //             onPressed: () => Navigator.of(context).pop(),
  //             child: Text('Hủy'),
  //           ),
  //           ElevatedButton(
  //             onPressed: () {
  //               Navigator.of(context).pop();
  //               context.read<UserAuthProvider>().logout();
  //               Navigator.pushAndRemoveUntil(
  //                 context,
  //                 MaterialPageRoute(builder: (context) => LoginScreen()),
  //                     (route) => false,
  //               );
  //             },
  //             child: Text('Đăng nhập'),
  //           ),
  //         ],
  //       );
  //     },
  //   );
  // }

  // Widget _buildBottomNav() {
  //   return Consumer<UserAuthProvider>(
  //     builder: (context, authProvider, child){
  //       return BottomNavigationBar(
  //         currentIndex: currentIndex,
  //         onTap: (index) {
  //           // ✅ Kiểm tra user có tồn tại không
  //           if (!authProvider.isLoggedIn) {
  //             _handleUserNotFound();
  //             return;
  //           }
  //           setState(() {
  //             currentIndex = index;
  //           });
  //           if (index == 0) {
  //             // Ở lại trang Home
  //           } else if (index == 1) {
  //             Navigator.pushReplacement(
  //               context,
  //               PageRouteBuilder(
  //                 pageBuilder: (context, animation1, animation2) => SearchView(),
  //                 transitionsBuilder: (context, animation, secondaryAnimation, child) {
  //                   return FadeTransition(
  //                     opacity: animation,
  //                     child: child,
  //                   );
  //                 },
  //                 transitionDuration: Duration(milliseconds: 300),
  //               ),
  //             );
  //           } else if (index == 2) {
  //             // Chuyển đến danh sách đặt phòng, bạn có thể tạo BookingScreen() chẳng hạn
  //
  //             Navigator.pushReplacement(
  //               context,
  //               PageRouteBuilder(
  //                 pageBuilder: (context, animation1, animation2) => ListBookingScreen(),
  //                 transitionsBuilder: (context, animation, secondaryAnimation, child) {
  //                   return FadeTransition(
  //                     opacity: animation,
  //                     child: child,
  //                   );
  //                 },
  //                 transitionDuration: Duration(milliseconds: 300),
  //               ),
  //             );
  //           } else if (index == 3) {
  //             Navigator.pushReplacement(
  //               context,
  //               PageRouteBuilder(
  //                 pageBuilder: (context, animation1, animation2) => ProfileScreen(),
  //                 transitionsBuilder: (context, animation, secondaryAnimation, child) {
  //                   return FadeTransition(
  //                     opacity: animation,
  //                     child: child,
  //                   );
  //                 },
  //                 transitionDuration: Duration(milliseconds: 300),
  //               ),
  //             );
  //           }
  //         },
  //
  //         selectedItemColor: Color(0xFF1565C0),
  //         unselectedItemColor: Color(0xFF525150),
  //         items: [
  //           BottomNavigationBarItem(
  //             icon: Icon(Icons.home),
  //             label: S.of(context).home,
  //           ),
  //           BottomNavigationBarItem(
  //             icon: Icon(Icons.search),
  //             label: S.of(context).search,
  //           ),
  //           BottomNavigationBarItem(
  //             icon: Icon(Icons.view_list_outlined),
  //             label: S.of(context).booking,
  //           ),
  //           BottomNavigationBarItem(
  //             icon: Icon(Icons.person),
  //             label: S.of(context).profile,
  //           ),
  //         ],
  //       );
  //     },
  //   );
  // }

}


