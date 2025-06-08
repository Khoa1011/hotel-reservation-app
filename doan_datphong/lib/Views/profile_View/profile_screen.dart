import 'dart:io';

import 'package:doan_datphong/Views/login_View/login_screen.dart';
import 'package:flutter/material.dart';
import 'package:doan_datphong/Models/User.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../Blocs/logout_bloc/logout_bloc.dart';
import '../../Blocs/logout_bloc/logout_event.dart';
import '../../Blocs/logout_bloc/logout_state.dart';
import '../home_View/home_screen.dart';
import '../home_View/searchView.dart';
import '../listBooking_View/listBooking_screen.dart';
import '../seach_View/search_screen.dart';
import 'editProfile_screen.dart';

class ProfileScreen extends StatefulWidget {
  final User? user;

  const ProfileScreen({super.key, required this.user});

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
    await prefs.clear(); // Clear all data in SharedPreferences

    // Navigate to the login screen
    Navigator.pushReplacementNamed(context, '/login');
  }

  void _handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString("token");

    if (token != null) {
      context.read<LogoutBloc>().add(LogoutRequested(token));
    } else {
      // If no token exists, just clear and navigate
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
              'Profile',
              key: ValueKey('Profile'),
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
              child: Column(
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
                          widget.user!.userName,
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          widget.user!.email,
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
                    text: 'Edit Profile',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => EditProfileScreen(user: widget.user),
                        ),
                      );
                    },
                  ),
                  SizedBox(height: 16),

                  // Settings section
                  Text(
                    'Settings',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey[600],
                    ),
                  ),
                  SizedBox(height: 16),

                  // Settings options
                  _buildSettingOption(
                    icon: Icons.payment,
                    text: 'Payment',
                    onTap: () {
                      // Handle payment
                    },
                  ),
                  _buildSettingOption(
                    icon: Icons.notifications,
                    text: 'Notifications',
                    onTap: () {
                      // Handle notifications
                    },
                  ),
                  _buildSettingOption(
                    icon: Icons.security,
                    text: 'Security',
                    onTap: () {
                      // Handle security
                    },
                  ),
                  _buildSettingOption(
                    icon: Icons.help,
                    text: 'Help',
                    onTap: () {
                      // Handle help
                    },
                  ),
                  _buildSettingOption(
                    icon: Icons.dark_mode,
                    text: 'Dark Theme',
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
                  SizedBox(height: 16),
                  _buildSettingOption(
                    icon: Icons.logout,
                    text: 'Logout',
                    textColor: Colors.red,
                    onTap: () {

                      _showLogoutDialog();
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: currentIndex,
          onTap: (index) {
            if (index == currentIndex) return;

            setState(() {
              currentIndex = index;
            });

            if (index == 0) {
              Navigator.pushReplacement(
                context,
                PageRouteBuilder(
                  pageBuilder: (context, animation1, animation2) => HomeScreen(user: widget.user),
                  transitionsBuilder: (context, animation, secondaryAnimation, child) {
                    return FadeTransition(
                      opacity: animation,
                      child: child,
                    );
                  },
                  transitionDuration: Duration(milliseconds: 300),
                ),
              );
            } else if (index == 1) {
              Navigator.pushReplacement(
                context,
                PageRouteBuilder(
                  pageBuilder: (context, animation1, animation2) => SearchView(user: widget.user),
                  transitionsBuilder: (context, animation, secondaryAnimation, child) {
                    return FadeTransition(
                      opacity: animation,
                      child: child,
                    );
                  },
                  transitionDuration: Duration(milliseconds: 300),
                ),
              );
            } else if (index == 2) {
              Navigator.pushReplacement(
                context,
                PageRouteBuilder(
                  pageBuilder: (context, animation1, animation2) => ListBookingScreen(user: widget.user),
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
          },
          selectedItemColor: Color(0xFF14D9E1),
          unselectedItemColor: Color(0xff9A9EAB),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.search),
              label: 'Search',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.view_list_outlined),
              label: 'Booking',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }

  // Separate widget for better error handling
  Widget _buildAvatarImage() {
    final avatar = widget.user!.avatar;

    try {
      // Handle network images
      if (avatar.startsWith('http')) {
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
          title: Text('Are you sure you want to log out?'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop(); // Close the dialog
                _handleLogout(); // Initiate logout process
              },
              child: Text('Logout',
              style: TextStyle(
                color: Colors.red
              ),),
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
          title: Text('Error'),
          content: Text(error),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: Text('OK'),
            ),
          ],
        );
      },
    );
  }
}
