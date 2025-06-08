import 'package:equatable/equatable.dart';

abstract class GetBookingListEvent extends Equatable{

  @override
  List<Object> get props => [];
}
class FetchBookingList extends GetBookingListEvent{
  final String userId;

  FetchBookingList(this.userId);
}