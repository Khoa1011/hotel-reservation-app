import 'package:doan_datphong/Models/DonDatPhong.dart';
import 'package:equatable/equatable.dart';

abstract class PaymentEvent extends Equatable {
  @override
  List<Object> get props => [];
}

// ✅ Tạo booking cơ bản (cash payment)
class PaymentSubmitted extends PaymentEvent {
  final DonDatPhong booking;

  PaymentSubmitted(this.booking);

  @override
  List<Object> get props => [booking];
}

// ✅ Native payment request
class NativePaymentRequested extends PaymentEvent {
  final DonDatPhong booking;
  final String paymentMethod; // 'MoMo', 'VNPay', 'ZaloPay'
  final String orderId;
  final int amount;
  final String orderInfo;

  NativePaymentRequested({
    required this.booking,
    required this.paymentMethod,
    required this.orderId,
    required this.amount,
    required this.orderInfo,
  });

  @override
  List<Object> get props => [booking, paymentMethod, orderId, amount, orderInfo];
}

// ✅ Check payment status
class PaymentStatusChecked extends PaymentEvent {
  final String orderId;

  PaymentStatusChecked(this.orderId);

  @override
  List<Object> get props => [orderId];
}