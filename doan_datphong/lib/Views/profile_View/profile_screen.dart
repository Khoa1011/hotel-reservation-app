import 'dart:io';
import 'package:doan_datphong/Data/Provider/auth_provider.dart';
import 'package:doan_datphong/Views/components/bottom_navigation_bar.dart';
import 'package:doan_datphong/Views/login_View/login_screen.dart';
import 'package:flutter/material.dart';
import 'package:doan_datphong/Models/NguoiDung.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:provider/provider.dart';
import 'package:doan_datphong/generated/l10n.dart'; // Sử dụng file generated
import '../../Blocs/logout_bloc/logout_bloc.dart';
import '../../Blocs/logout_bloc/logout_event.dart';
import '../../Blocs/logout_bloc/logout_state.dart';
import '../home_View/home_screen.dart';
import '../home_View/searchView.dart';
import '../listBooking_View/listBooking_screen.dart';
import '../seach_View/search_screen.dart';
import 'editProfile_screen.dart';
import '../../LanguageProvider.dart';

class ProfileScreen extends StatefulWidget {


  const ProfileScreen({super.key});

  @override
  _ProfileScreenState createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> with SingleTickerProviderStateMixin {
  int currentIndex = 3;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  bool _darkTheme = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: 500),
    );
    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeInOut,
      ),
    );
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    Navigator.pushReplacementNamed(context, '/login');
  }

  void _handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString("token");

    if (token != null) {
      context.read<LogoutBloc>().add(LogoutRequested(token));
    } else {
      await prefs.clear();
      _navigateToLogin();
    }
  }

  void _navigateToLogin() {
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => LoginScreen()),
          (Route<dynamic> route) => false,
    );
  }

  // Hiển thị dialog chọn ngôn ngữ với đa ngôn ngữ
  void _showLanguageDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text(S.of(context).language),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Consumer<LanguageProvider>(
                builder: (context, languageProvider, child) {
                  return Column(
                    children: [
                      ListTile(
                        leading: Text('🇻🇳', style: TextStyle(fontSize: 24)),
                        title: Text(S.of(context).vietnamese),
                        trailing: languageProvider.isVietnamese()
                            ? Icon(Icons.check, color: Color(0xFF14D9E1))
                            : null,
                        onTap: () {
                          languageProvider.changeLanguage('vi');
                          Navigator.of(context).pop();
                        },
                      ),
                      ListTile(
                        leading: Text('🇺🇸', style: TextStyle(fontSize: 24)),
                        title: Text(S.of(context).english),
                        trailing: languageProvider.isEnglish()
                            ? Icon(Icons.check, color: Color(0xFF14D9E1))
                            : null,
                        onTap: () {
                          languageProvider.changeLanguage('en');
                          Navigator.of(context).pop();
                        },
                      ),
                    ],
                  );
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text(S.of(context).cancel),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<LogoutBloc, LogoutState>(
      listener: (context, state) {
        if (state is LogoutSuccess) {
          _navigateToLogin();
        } else if (state is LogoutFailure) {
          _showErrorDialog(context, state.error);
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: AnimatedSwitcher(
            duration: Duration(milliseconds: 300),
            child: Text(
              S.of(context).profile, // Sử dụng đa ngôn ngữ
              key: ValueKey(S.of(context).profile),
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          centerTitle: true,
        ),
        body: FadeTransition(
          opacity: _fadeAnimation,
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Consumer<UserAuthProvider>(
                  builder: (context, authProvider, child){
                    if(!authProvider.isLoggedIn || authProvider.user == null){
                      return Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.person_off, size: 80, color: Colors.grey,),
                            SizedBox(height: 16),
                            Text(
                              'Chưa đăng nhập',
                              style: TextStyle(fontSize: 18, color: Colors.grey),
                            ),
                            SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: _navigateToLogin,
                              child: Text('Đăng nhập'),
                            ),
                          ],
                        ),
                      );
                    }
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Profile header
                        Center(
                          child: Column(
                            children: [
                              CircleAvatar(
                                radius: 70,
                                backgroundColor: Colors.transparent,
                                child: _buildAvatarImage(),
                              ),
                              SizedBox(height: 16),
                              Text(
                                authProvider.userName ?? "Nguoi Dung",
                                style: TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                authProvider.userEmail ?? "example@gmail.com",
                                style: TextStyle(
                                  fontSize: 16,
                                  color: Colors.grey,
                                ),
                              ),
                            ],
                          ),
                        ),
                        SizedBox(height: 24),
                        Divider(thickness: 1),
                        SizedBox(height: 16),

                        // Edit Profile button
                        _buildProfileButton(
                          icon: Icons.edit,
                          text: S.of(context).editProfile, // Sử dụng đa ngôn ngữ
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => EditProfileScreen(),
                              ),
                            );
                          },
                        ),
                        SizedBox(height: 16),

                        // Settings section
                        Text(
                          S.of(context).settings, // Sử dụng đa ngôn ngữ
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey[600],
                          ),
                        ),
                        SizedBox(height: 16),

                        // Settings options với đa ngôn ngữ
                        _buildSettingOption(
                          icon: Icons.payment,
                          text: S.of(context).payment,
                          onTap: () {
                            // Handle payment
                          },
                        ),
                        _buildSettingOption(
                          icon: Icons.notifications,
                          text: S.of(context).notifications,
                          onTap: () {
                            // Handle notifications
                          },
                        ),
                        _buildSettingOption(
                          icon: Icons.security,
                          text: S.of(context).security,
                          onTap: () {
                            // Handle security
                          },
                        ),
                        _buildSettingOption(
                          icon: Icons.help,
                          text: S.of(context).help,
                          onTap: () {
                            // Handle help
                          },
                        ),
                        _buildSettingOption(
                          icon: Icons.dark_mode,
                          text: S.of(context).darkTheme,
                          trailing: Switch(
                            value: _darkTheme,
                            onChanged: (value) {
                              setState(() {
                                _darkTheme = value;
                              });
                              // Handle theme change
                            },
                            activeColor: Color(0xFF14D9E1),
                          ),
                        ),

                        // Tùy chọn đổi ngôn ngữ đã cập nhật
                        _buildSettingOption(
                          icon: Icons.language,
                          text: S.of(context).language,
                          trailing: Consumer<LanguageProvider>(
                            builder: (context, languageProvider, child) {
                              return Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Color(0xFF14D9E1).withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: Color(0xFF14D9E1).withOpacity(0.3)),
                                    ),
                                    child: Text(
                                      languageProvider.isVietnamese() ? '🇻🇳 VI' : '🇺🇸 EN',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF14D9E1),
                                      ),
                                    ),
                                  ),
                                  SizedBox(width: 8),
                                  Icon(Icons.chevron_right, color: Colors.grey),
                                ],
                              );
                            },
                          ),
                          onTap: _showLanguageDialog,
                        ),

                        SizedBox(height: 16),
                        _buildSettingOption(
                          icon: Icons.logout,
                          text: S.of(context).logout, // Sử dụng đa ngôn ngữ
                          textColor: Colors.red,
                          onTap: () {
                            _showLogoutDialog();
                          },
                        ),
                      ],
                    );
                  }
                  )

            ),
          ),
        ),
        bottomNavigationBar: CustomBottomNavigation(currentPage: BottomNavPages.profile)
      ),
    );
  }

  // Separate widget for better error handling
  Widget _buildAvatarImage() {
    final authProvider = context.read<UserAuthProvider>();

    // Kiểm tra user có tồn tại không
    if (!authProvider.isLoggedIn || authProvider.user == null) {
      return _buildDefaultAvatar();
    }
    final avatar = authProvider.user?.hinhDaiDien;

    try {
      // Handle network images
      if (avatar!.startsWith('http')) {
        return Image.network(
          avatar,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return _buildDefaultAvatar();
          },
        );
      }
      // Handle local files
      else {
        final filePath = avatar.startsWith('file://')
            ? avatar.replaceFirst('file://', '')
            : avatar;

        if (File(filePath).existsSync()) {
          return Image.file(
            File(filePath),
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              return _buildDefaultAvatar();
            },
          );
        }
      }
    } catch (e) {
      debugPrint('Avatar loading error: $e');
    }

    return _buildDefaultAvatar();
  }

  Widget _buildDefaultAvatar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey[300],
        shape: BoxShape.circle,
      ),
      child: Icon(Icons.person, size: 50, color: Colors.grey[600]),
    );
  }

  Widget _buildProfileButton({
    required IconData icon,
    required String text,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Color(0xFF14D9E1).withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(icon, color: Color(0xFF14D9E1)),
            SizedBox(width: 16),
            Text(
              text,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF14D9E1),
              ),
            ),
            Spacer(),
            Icon(Icons.chevron_right, color: Color(0xFF14D9E1)),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingOption({
    required IconData icon,
    required String text,
    VoidCallback? onTap,
    Widget? trailing,
    Color? textColor,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            Icon(icon, color: textColor ?? Colors.grey[700]),
            SizedBox(width: 16),
            Text(
              text,
              style: TextStyle(
                fontSize: 16,
                color: textColor ?? Colors.grey[700],
              ),
            ),
            Spacer(),
            trailing ?? Icon(Icons.chevron_right, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text(S.of(context).logoutConfirmation), // Sử dụng đa ngôn ngữ
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: Text(S.of(context).cancel), // Sử dụng đa ngôn ngữ
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                _handleLogout();
              },
              child: Text(
                S.of(context).logout, // Sử dụng đa ngôn ngữ
                style: TextStyle(color: Colors.red),
              ),
            ),
          ],
        );
      },
    );
  }

  void _showErrorDialog(BuildContext context, String error) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text(S.of(context).error), // Sử dụng đa ngôn ngữ
          content: Text(error),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: Text(S.of(context).ok), // Sử dụng đa ngôn ngữ
            ),
          ],
        );
      },
    );
  }
}