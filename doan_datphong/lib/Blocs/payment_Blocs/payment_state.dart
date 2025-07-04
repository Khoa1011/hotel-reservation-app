import 'package:doan_datphong/Models/DonDatPhong.dart';

abstract class PaymentState {}
// ========== INITIAL & LOADING STATES ==========
// Trạng thái ban đầu khi chưa có action nào
class PaymentInitial extends PaymentState {}

// Trạng thái loading chung (cho cash payment)
class PaymentLoading extends PaymentState {}

// Trạng thái đang xử lý payment online (hiển thị loading với tên method)
class PaymentProcessing extends PaymentState {
  final String paymentMethod; // "MoMo", "VNPay", "ZaloPay"
  PaymentProcessing(this.paymentMethod);
}

// ========== SUCCESS STATES ==========

// Thành công cho cash payment (thanh toán tại khách sạn)
class PaymentSuccess extends PaymentState {
  final DonDatPhong? booking; // Thông tin booking đã tạo
  final String message; // Thông báo thành công
  PaymentSuccess({
    required this.message,
    this.booking
});
}

// ✅ STATE MỚI: Khi tạo payment URL thành công
// → Trigger việc mở app/browser thanh toán
class NativePaymentUrlGenerated extends PaymentState {
  final String paymentMethod;              // Phương thức: "MoMo", "VNPay", "ZaloPay"
  final String orderId;                    // Mã đơn hàng để track
  final Map<String, dynamic> paymentData;  // Data từ payment gateway (chứa URLs, tokens...)

  NativePaymentUrlGenerated({
    required this.paymentMethod,
    required this.orderId,
    required this.paymentData,
  });
}

class PaymentRedirectSuccess extends PaymentState {
  final String paymentMethod;
  final String orderId;
  final String deeplink;

  PaymentRedirectSuccess({
    required this.paymentMethod,
    required this.orderId,
    required this.deeplink,
  });
}

// ✅ STATE MỚI: Khi user hoàn tất thanh toán thành công
class NativePaymentSuccess extends PaymentState {
  final String orderId;        // Mã đơn hàng
  final String transactionId;  // Mã giao dịch từ payment gateway
  final String paymentMethod;  // Phương thức đã dùng

  NativePaymentSuccess({
    required this.orderId,
    required this.transactionId,
    required this.paymentMethod,
  });
}

// ✅ STATE MỚI: Khi thanh toán thất bại hoặc bị hủy
class NativePaymentFailure extends PaymentState {
  final String orderId;        // Mã đơn hàng
  final String errorMessage;   // Lý do thất bại
  final String paymentMethod;  // Phương thức đã dùng

  NativePaymentFailure({
    required this.orderId,
    required this.errorMessage,
    required this.paymentMethod,
  });
}

// State cho việc hoàn tất thanh toán (có thể dùng thay cho NativePaymentSuccess)
class PaymentCompleted extends PaymentState {
  final String orderId;
  final String? transactionId;
  final String paymentMethod;

  PaymentCompleted({
    required this.orderId,
    required this.paymentMethod,
    this.transactionId,
  });
}


// ========== FAILURE STATES ==========
// ✅ Failure state - chỉ 1 state cho tất cả lỗi
class PaymentFailure extends PaymentState {
  final String errorMessage;
  final String? errorCode;
  final String? paymentMethod;

  PaymentFailure({
    required this.errorMessage,
    this.errorCode,
    this.paymentMethod,
  });
}