import 'package:doan_datphong/Models/Bookings.dart';
import 'package:equatable/equatable.dart';

abstract class PaymentEvent extends Equatable{

  @override
  List<Object> get props => [];
}
class PaymentSubmitted extends PaymentEvent{
  final Booking booking;

  PaymentSubmitted(this.booking);
}