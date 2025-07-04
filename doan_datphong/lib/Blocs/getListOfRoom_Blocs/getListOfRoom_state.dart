// ✅ States - Giữ nguyên
import 'package:equatable/equatable.dart';
import '../../Models/LoaiPhong.dart';

abstract class GetListOfRoomState extends Equatable {
  @override
  List<Object?> get props => [];
}

class GetListOfRoomInitial extends GetListOfRoomState {}

class GetListOfRoomLoading extends GetListOfRoomState {}

class GetListOfRoomSuccess extends GetListOfRoomState {
  final List<LoaiPhong> roomTypes;
  final String? message;
  final Map<String, dynamic>? searchInfo;
  final Map<String, dynamic>? statistics;

  GetListOfRoomSuccess({
    required this.roomTypes,
    this.message,
    this.searchInfo,
    this.statistics,
  });

  @override
  List<Object?> get props => [roomTypes, message, searchInfo, statistics];
}

class GetListOfRoomFailure extends GetListOfRoomState {
  final String error;

  GetListOfRoomFailure(this.error);

  @override
  List<Object?> get props => [error];
}