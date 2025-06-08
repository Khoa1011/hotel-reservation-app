import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class User {
  String id;
  String userName;
  bool gender;
  String email;
  String password;
  String phoneNumber;
  String role;
  String avatar;
  String Dob;
  DateTime createAt;

  User({
    required this.id,
    required this.userName,
    required this.gender,
    required this.email,
    required this.password,
    required this.phoneNumber,
    required this.role,
    required this.avatar,
    required this.Dob,
    required this.createAt,
  });


  User.short({
    required this.id,
    required this.userName,
    required this.gender,
    required this.phoneNumber,
    required this.Dob,
    required this.avatar,
  })  : email = '',
        password = '',
        role = 'user',
        createAt = DateTime.now();

  User.shortUpdateProfile({
    required this.id,
    required this.userName,
    required this.phoneNumber,
    required this.Dob,
    required this.avatar,
    required this.password,
}): email = '',
        role = 'user',
        createAt = DateTime.now(),
  gender= true;

  // Chuyển từ JSON sang Object
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json["_id"],
      userName: json["userName"],
      gender: json["gender"],
      email: json["email"],
      password: json["password"],
      phoneNumber: json["phoneNumber"],
      role: json["role"],
      avatar: json["avatar"],
      Dob: json["DoB"],
      createAt: DateTime.parse(json["createAt"]),
    );
  }

  // Chuyển từ Object sang JSON
  Map<String, dynamic> toMap() {
    return {
      "_id": id,
      "userName": userName,
      "gender": gender,
      "email": email,
      "password": password,
      "phoneNumber": phoneNumber,
      "role": role,
      "avatar": avatar,
      "DoB": Dob,
      "createAt": createAt.toIso8601String(),
    };
  }

  // Chuyển đối tượng User thành chuỗi JSON
  String toJsonString() => jsonEncode(toMap());

  // Chuyển từ chuỗi JSON thành đối tượng User
  factory User.fromJsonString(String? source) {
    if (source == null || source.isEmpty) {
      throw Exception("Dữ liệu người dùng không hợp lệ!"); // Hoặc return null nếu muốn
    }
    return User.fromJson(jsonDecode(source));
  }

  Future<void> saveUserToPrefs(User user) async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String userJson = user.toJsonString(); // Chuyển user thành JSON
    await prefs.setString("user", userJson);
  }
  Future<User?> getUserFromPrefs() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String? userJson = prefs.getString("user");

    if (userJson == null || userJson.isEmpty) {
      return null; // Trả về null nếu chưa có dữ liệu
    }

    try {
      return User.fromJsonString(userJson);
    } catch (e) {
      print("Lỗi khi chuyển đổi User: $e");
      return null; // Tránh crash nếu dữ liệu bị lỗi
    }
  }
}
