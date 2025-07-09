import 'dart:io';
import 'package:doan_datphong/Data/Provider/auth_provider.dart';
import 'package:doan_datphong/Views/components/bottom_navigation_bar.dart';
import 'package:doan_datphong/Views/home_View/listHotelView.dart';
import 'package:doan_datphong/Views/home_View/listHotelView_type.dart';
import 'package:doan_datphong/Views/home_View/searchView.dart';
import 'package:doan_datphong/Views/listBooking_View/listBooking_screen.dart';
import 'package:doan_datphong/Views/profile_View/profile_screen.dart';
import 'package:flutter/material.dart';

import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../Models/NguoiDung.dart';
import '../login_View/login_screen.dart';
import '../seach_View/search_screen.dart';
import 'package:doan_datphong/generated/l10n.dart';

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
                Icon(
                  Icons.bookmark_border_outlined,
                  color: Color(0xFF525150),
                  size: 30,
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
                      // ✅ Debug để kiểm tra trạng thái auth_provider
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      S.of(context).recentlyBooked,
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,

                      ),
                    ),
                    TextButton(
                      onPressed: () {},
                      child: Text(
                        S.of(context).seeAll,
                        style: TextStyle(
                          fontSize: 18,
                          color: Color(0xFF1565C0),
                          fontWeight: FontWeight.bold,

                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 15),
                SizedBox(
                  height: 160,
                  width: MediaQuery.of(context).size.width * 0.95,
                  child: PageView.builder(
                    itemBuilder: (context, index) {
                      return Padding(
                        padding: EdgeInsets.all(8),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: Card(
                            elevation: 5,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // PHẦN HÌNH ẢNH (BÊN TRÁI)
                                Expanded(
                                  flex: 3, // Chia tỷ lệ
                                  child: Padding(
                                    padding: const EdgeInsets.all(8.0),
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(
                                        10,
                                      ), // Bo góc hình ảnh
                                      child: Image.asset(
                                        'assets/images/hotels/p13.jpg',
                                        width: double.infinity,
                                        height:double.infinity,
                                        fit:
                                            BoxFit.cover, // Căn chỉnh hình ảnh
                                      ),
                                    ),
                                  ),
                                ),

                                // PHẦN THÔNG TIN (BÊN PHẢI)
                                Expanded(
                                  flex: 5,
                                  child: Padding(
                                    padding: const EdgeInsets.fromLTRB(8.0,12.0,12.0,12.0),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,

                                      children: [
                                        Text(
                                          "Milan Hotels",
                                          style: TextStyle(
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        Text(
                                          "7 Distric, Ho Chi Minh city",
                                          style: TextStyle(
                                            fontSize: 15,
                                            fontStyle: FontStyle.italic
                                          ),
                                        ),
                                        Row(

                                          children: [
                                            Icon(FontAwesomeIcons.solidStar,
                                                color: Colors.yellowAccent.shade700,
                                                size: 25
                                            ),
                                            const SizedBox(width: 4,),
                                            Text("4.7",
                                            style: TextStyle(
                                              fontSize: 18,
                                                color: Color(0xFF1565C0),
                                                fontWeight: FontWeight.bold,


                                              ),
                                            ),
                                            const SizedBox(width: 5,),
                                            Text("(8.215)",
                                              style: TextStyle(
                                                fontSize: 16,
                                                fontStyle: FontStyle.italic,

                                              ),
                                            ),
                                          ],
                                        )
                                      ],
                                    ),
                                  ),
                                ),
                                Expanded(
                                  flex: 2,
                                    child: Padding(
                                      padding: const EdgeInsets.only(right: 8.0,top: 12.0),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.center,
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text("\$29",
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,

                                            fontSize: 25,
                                            color: Color(0xFF1565C0)
                                          ),),
                                          Text("/ ${S.of(context).perNight}",
                                          style: TextStyle(
                                            fontSize: 15,
                                            fontStyle: FontStyle.italic
                                          ),),
                                          Padding(
                                            padding: const EdgeInsets.only(bottom: 2.0),
                                            child: IconButton(
                                              onPressed: () {
                                                setState(() {
                                                  iconBookMarkRecentlyPressed = !iconBookMarkRecentlyPressed;
                                                });
                                              },
                                              icon: AnimatedSwitcher(
                                                duration: Duration(milliseconds: 300),
                                                transitionBuilder: (Widget child, Animation<double> animation) {
                                                  return ScaleTransition(scale: animation, child: child);
                                                },
                                                child: Icon(
                                                  iconBookMarkRecentlyPressed
                                                      ? Icons.bookmark_added
                                                      : Icons.bookmark_add_outlined,
                                                  key: ValueKey<bool>(iconBookMarkRecentlyPressed),
                                                  size: 40,
                                                  color: Color(0xFF525150),
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ))
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: CustomBottomNavigation(
          currentPage: BottomNavPages.home),
    );
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


