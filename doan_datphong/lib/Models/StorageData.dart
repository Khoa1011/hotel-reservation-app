// Tạo file hotel_provider.dart
import 'package:doan_datphong/Models/NguoiDung.dart';
import 'package:flutter/cupertino.dart';

import 'KhachSan.dart';

class HotelProvider extends ChangeNotifier {
  KhachSan? _currentHotel;

  KhachSan? get currentHotel => _currentHotel;

  void setCurrentHotel(KhachSan hotel) {
    _currentHotel = hotel;
    notifyListeners();
  }

  void clear() {
    _currentHotel = null;
  }
}

class UserProvider extends ChangeNotifier{
  NguoiDung? _currentUser;

  NguoiDung? get currentUser => _currentUser;

  void setcurrentUser(NguoiDung user){
    _currentUser = user;
    notifyListeners();
  }
  void clear(){
    _currentUser = null;
  }
}