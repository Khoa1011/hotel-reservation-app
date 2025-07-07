import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../Models/NguoiDung.dart';


class UserAuthProvider extends ChangeNotifier {
  NguoiDung? _user;
  bool _isLoading = false;

  // ✅ Getters cơ bản
  NguoiDung? get user => _user;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _user != null;

  // ✅ Getters cho các field quan trọng
  String? get userId => _user?.id;
  String? get userName => _user?.tenNguoiDung;
  String? get userPhone => _user?.soDienThoai;
  String? get userEmail => _user?.email;


  UserAuthProvider() {
    loadUser();
  }

  // ✅ Load user từ SharedPreferences hoặc API
  Future<void> loadUser() async {
    _isLoading = true;
    notifyListeners();

    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      String? token = prefs.getString("token");
      String? userId = prefs.getString("user_id");


      if (token != null && userId != null) {
        // ✅ Option 1: Load từ saved JSON string (nếu có)
        String? userJson = prefs.getString("user");
        print("Kiem tra du lieu user tu json ${userJson}");
        if (userJson != null) {
          _user = NguoiDung.fromJsonString(userJson);
        } else {
          // ✅ Option 2: Tạo user từ các field riêng lẻ (fallback)
          _user = NguoiDung(
            id: userId,
            tenNguoiDung: prefs.getString("user_name") ?? "User",
            gioiTinh: prefs.getBool("user_gender") ?? true,
            email: prefs.getString("user_email") ?? "",
            matKhau: "", // Không lưu password
            soDienThoai: prefs.getString("user_std") ?? "",
            vaiTro: prefs.getString("user_role") ?? "nguoiDung",
            hinhDaiDien: prefs.getString("user_avatar") ?? "",
            ngaySinh: null, // Sẽ load sau nếu cần
            ngayTao: DateTime.now(),
            trangThaiTaiKhoan: "hoatDong",
          );
        }
      }
    } catch (e) {
      print('❌ Load user error: $e');
      _user = null;
    }

    _isLoading = false;
    notifyListeners();
  }

  // ✅ Save user (sau login/update profile)
  Future<void> saveUser(NguoiDung user) async {
    _user = user;
    SharedPreferences prefs = await SharedPreferences.getInstance();

    try {
      // ✅ Lưu cả user object và các field quan trọng
      await prefs.setString("user_object", user.toJsonString());

      // ✅ Lưu riêng các field quan trọng để dễ truy cập
      await prefs.setString("user_id", user.id);
      await prefs.setString("user_name", user.tenNguoiDung);
      await prefs.setString("user_std", user.soDienThoai);
      await prefs.setString("user_email", user.email);
      await prefs.setString("user_role", user.vaiTro);
      await prefs.setBool("user_gender", user.gioiTinh);

      if (user.hinhDaiDien.isNotEmpty) {
        await prefs.setString("user_avatar", user.hinhDaiDien);
      }

    } catch (e) {
      print("❌ Save user error: $e");
    }

    notifyListeners();
  }

  // ✅ Update user (không cần reload từ API)
  void updateUser(NguoiDung updatedUser) {
    _user = updatedUser;
    saveUser(updatedUser); // Lưu vào storage
  }

  // ✅ Logout
  Future<void> logout() async {
    _user = null;
    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    notifyListeners();
    print("✅ User logged out");
  }

  // ✅ Check permissions
  bool canBookRoom() {
    return _user != null && _user!.trangThaiTaiKhoan == "hoatDong";
  }

  bool isAdmin() {
    return _user?.vaiTro == "admin";
  }

  bool isHotelOwner() {
    return _user?.vaiTro == "chuKhachSan";
  }

  // ✅ Get user info for debugging
  String getUserInfo() {
    if (_user == null) return "No user";
    return "User: ${_user!.tenNguoiDung} (${_user!.id})";
  }
}