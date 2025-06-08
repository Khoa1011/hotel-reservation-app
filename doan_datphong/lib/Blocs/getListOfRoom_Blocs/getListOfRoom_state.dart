
import '../../Models/Room.dart';

abstract class GetListOfRoomState{
  @override
  List<Object?> get props => [];
}

class GetListOfRoomInitial extends GetListOfRoomState{}
class GetListOfRoomLoading extends GetListOfRoomState{}
class GetListOfRoomSuccess extends GetListOfRoomState{
  final List<Room> rooms;
  GetListOfRoomSuccess({required this.rooms});

  @override
  List<Object?> get props => [rooms];
}
class GetListOfRoomFailure extends GetListOfRoomState{
  final String error;

  GetListOfRoomFailure(this.error);

  @override
  List<Object?> get props => [error];
}