// Tạo file hotel_provider.dart
import 'package:doan_datphong/Models/User.dart';
import 'package:flutter/cupertino.dart';

import 'Hotels.dart';

class HotelProvider extends ChangeNotifier {
  Hotels? _currentHotel;

  Hotels? get currentHotel => _currentHotel;

  void setCurrentHotel(Hotels hotel) {
    _currentHotel = hotel;
    notifyListeners();
  }

  void clear() {
    _currentHotel = null;
  }
}

class UserProvider extends ChangeNotifier{
  User? _currentUser;

  User? get currentUser => _currentUser;

  void setcurrentUser(User user){
    _currentUser = user;
    notifyListeners();
  }
  void clear(){
    _currentUser = null;
  }
}