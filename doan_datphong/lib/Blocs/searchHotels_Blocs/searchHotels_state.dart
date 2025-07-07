import 'package:equatable/equatable.dart';
import '../../Models/KhachSan.dart';
import '../../Models/SearchInfo.dart';

abstract class HotelSearchState extends Equatable {
  @override
  List<Object?> get props => [];
}

// Trạng thái khởi tạo
class HotelSearchInitial extends HotelSearchState {}

// Trạng thái đang loading
class HotelSearchLoading extends HotelSearchState {}

// Trạng thái thành công
class HotelSearchSuccess extends HotelSearchState {
  final List<KhachSan> hotels;
  final String message;


  HotelSearchSuccess({
    required this.hotels,
  required this.message
  });

  @override
  List<Object?> get props => [hotels, message];
}

// Trạng thái thất bại
class HotelSearchFailure extends HotelSearchState {
  final String error;

  HotelSearchFailure(this.error);

  @override
  List<Object?> get props => [error];
}
