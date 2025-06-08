import 'package:equatable/equatable.dart';

abstract class GetListOfRoomEvent extends Equatable{
  @override
  List<Object?> get props => [];
}
class FetchRoomList extends GetListOfRoomEvent{
  final String idHotel;
  final String checkInDate;
  final String checkOutDate;
  FetchRoomList(this.idHotel, this.checkInDate, this.checkOutDate);
}