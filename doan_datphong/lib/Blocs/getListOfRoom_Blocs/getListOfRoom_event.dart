// ✅ Events - Giữ nguyên
import 'package:doan_datphong/Models/LichPhongTrong.dart';
import 'package:equatable/equatable.dart';

abstract class GetListOfRoomEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class FetchRoomList extends GetListOfRoomEvent {
  final String hotelId;
  final LichPhongTrong lichPhongTrong;

  FetchRoomList({
    required this.hotelId,
    required this.lichPhongTrong
  });

  @override
  List<Object?> get props => [
    hotelId, lichPhongTrong
  ];
}

class FetchSimpleRoomList extends GetListOfRoomEvent {
  final String hotelId;
  final String bookingType;
  final String checkInDate;
  final String? checkOutDate;
  final String checkInTime;
  final String? checkOutTime;
  final Map<String, int> guests;
  final int rooms;

  FetchSimpleRoomList({
    required this.hotelId,
    required this.bookingType,
    required this.checkInDate,
    this.checkOutDate,
    required this.checkInTime,
    this.checkOutTime,
    required this.guests,
    required this.rooms,
  });

  @override
  List<Object?> get props => [
    hotelId, bookingType, checkInDate, checkOutDate,
    checkInTime, checkOutTime, guests, rooms
  ];
}
