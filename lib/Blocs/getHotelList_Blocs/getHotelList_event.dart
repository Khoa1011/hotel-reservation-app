import 'package:equatable/equatable.dart';

abstract class GetHotelListEvent extends Equatable{

  @override
  List<Object> get props => [];
}
class FetchHotelList extends GetHotelListEvent{}