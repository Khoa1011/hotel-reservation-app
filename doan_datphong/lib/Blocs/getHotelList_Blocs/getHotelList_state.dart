import 'package:doan_datphong/Models/KhachSan.dart';

abstract class GetHotelListState{
  @override
  List<Object?> get props => [];
}

class GetHotelListInitial extends GetHotelListState{}
class GetHotelListLoading extends GetHotelListState{}
class GetHotelListSuccess extends GetHotelListState{
  final List<Hotels> hotels;
  GetHotelListSuccess(this.hotels);

  @override
  List<Object?> get props => [hotels];
}
class GetHotelListFailure extends GetHotelListState{
  final String errorMessage;
  GetHotelListFailure(this.errorMessage);

  @override
  List<Object?> get props => [errorMessage];
}