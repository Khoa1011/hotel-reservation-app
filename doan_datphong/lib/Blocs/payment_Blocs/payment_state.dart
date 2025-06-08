import 'package:doan_datphong/Models/Bookings.dart';

abstract class PaymentState{}

class PaymentInitial extends PaymentState{}
class PaymentLoading extends PaymentState{}
class PaymentSuccess extends PaymentState{
  late final Booking booking;
  PaymentSuccess(this.booking);
}
class PaymentFailure extends PaymentState{
  final String errorMessage;

  PaymentFailure(this.errorMessage);
}