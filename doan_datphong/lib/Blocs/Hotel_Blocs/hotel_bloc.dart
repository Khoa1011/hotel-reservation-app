// lib/Blocs/hotel_bloc/hotel_bloc.dart
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:doan_datphong/Models/KhachSan.dart';

class HotelBloc extends Cubit<Hotels?> {
  HotelBloc() : super(null);

  void setCurrentHotel(Hotels hotel) {
    emit(hotel);
  }

  void clearHotel() {
    emit(null);
  }
}