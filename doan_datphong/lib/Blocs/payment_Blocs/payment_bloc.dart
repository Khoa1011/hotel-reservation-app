import 'package:doan_datphong/Blocs/payment_Blocs/payment_event.dart';
import 'package:doan_datphong/Blocs/payment_Blocs/payment_state.dart';
import 'package:doan_datphong/Data/Provider/ApiResponse.dart';
import 'package:doan_datphong/Data/Repository/payment_Repository/payment_repo.dart';
import 'package:doan_datphong/Models/DonDatPhong.dart';
import 'package:doan_datphong/generated/intl/messages_en.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class PaymentBloc extends Bloc<PaymentEvent, PaymentState> {
  final PaymentRepository paymentRepository;

  PaymentBloc({required this.paymentRepository}) : super(PaymentInitial()) {
    on<PaymentSubmitted>(_onPaymentSubmitted);           // Xử lý cash payment
    on<NativePaymentRequested>(_onNativePaymentRequested); // Xử lý online payment
    on<PaymentStatusChecked>(_onPaymentStatusChecked);   // Kiểm tra trạng thái thanh toán
  }


  // ========== CASH PAYMENT HANDLER ==========
  // Xử lý thanh toán tiền mặt (trả tại khách sạn)
  // ✅ Cash payment
  void _onPaymentSubmitted(PaymentSubmitted event, Emitter<PaymentState> emit) async {
    emit(PaymentLoading());

    try {
      ApiResponse res = await paymentRepository.payment(event.booking);

      if (res.success) {
        DonDatPhong booking = res.data;
        emit(PaymentSuccess(
          message: res.message,
          booking: booking
        ));
      } else {
        emit(PaymentFailure(errorMessage: res.message));
      }
    } catch (e) {
      emit(PaymentFailure(errorMessage: 'Lỗi kết nối: ${e.toString()}'));
    }
  }

  // ========== ONLINE PAYMENT HANDLER ==========
  // Xử lý thanh toán online (MoMo, VNPay, ZaloPay)
  void _onNativePaymentRequested(NativePaymentRequested event, Emitter<PaymentState> emit) async {
    emit(PaymentProcessing(event.paymentMethod));

    try {
      // ===== BƯỚC 1: TẠO BOOKING TRONG DATABASE =====
      ApiResponse bookingRes = await paymentRepository.payment(event.booking);
      if (!bookingRes.success) {
        emit(PaymentFailure(
          errorMessage: 'Không thể tạo booking: ${bookingRes.message}',
          paymentMethod: event.paymentMethod,
        ));
        return;
      }

      // ===== BƯỚC 2: TẠO PAYMENT URL TỪ GATEWAY =====
      ApiResponse paymentRes;

      switch (event.paymentMethod) {
        case 'MoMo':
          paymentRes = await paymentRepository.createMoMoPayment(
            orderId: event.orderId,
            amount: event.amount,
            orderInfo: event.orderInfo,
            userId: event.booking.maNguoiDung,
          );
          break;

        case 'VNPay':
          paymentRes = await paymentRepository.createVNPayPayment(
            orderId: event.orderId,
            amount: event.amount,
            orderInfo: event.orderInfo,
          );
          break;

        case 'ZaloPay':
          paymentRes = await paymentRepository.createZaloPayPayment(
            orderId: event.orderId,
            amount: event.amount,
            description: event.orderInfo,
            userId: event.booking.maNguoiDung
          );
          break;

        default:
          emit(PaymentFailure(
            errorMessage: 'Phương thức thanh toán không được hỗ trợ',
            paymentMethod: event.paymentMethod,
          ));
          return;
      }

      // ===== BƯỚC 3: XỬ LÝ RESPONSE TỪ PAYMENT GATEWAY =====
      if (paymentRes.success) {
        final data = paymentRes.data as Map<String, dynamic>;
        String? deeplink;
        bool isValidPayment = false;

        // Kiểm tra response theo từng phương thức (mỗi gateway có format khác nhau)
        switch (event.paymentMethod) {
          case 'MoMo':
          // MoMo: resultCode = 0 là thành công
            isValidPayment = data['resultCode'] == 0;
            deeplink = data['payUrl'] ?? data['deeplink'];
            if (!isValidPayment) {
              emit(PaymentFailure(
                errorMessage: data['message'] ?? 'MoMo payment failed',
                errorCode: data['resultCode']?.toString(),
                paymentMethod: event.paymentMethod,
              ));
              return;
            }
            break;

          case 'VNPay':
          // VNPay: phải có paymentUrl
            isValidPayment = data.containsKey('paymentUrl') && data['paymentUrl'] != null;
            if (!isValidPayment) {
              emit(PaymentFailure(
                errorMessage: 'VNPay payment URL not generated',
                paymentMethod: event.paymentMethod,
              ));
              return;
            }
            break;

          case 'ZaloPay':
          // ZaloPay: return_code = 1 là thành công
            isValidPayment = data['return_code'] == 1;
            deeplink = data['deeplink'];
            if (!isValidPayment) {
              emit(PaymentFailure(
                errorMessage: data['return_message'] ?? 'ZaloPay payment failed',
                errorCode: data['return_code']?.toString(),
                paymentMethod: event.paymentMethod,
              ));
              return;
            }
            break;
        }

        // 4. Emit redirect success
      //   if (isValidPayment && deeplink != null) {
      //     emit(PaymentRedirectSuccess(
      //       paymentMethod: event.paymentMethod,
      //       orderId: event.orderId,
      //       deeplink: deeplink,
      //     ));
      //   } else {
      //     emit(PaymentSuccess(
      //       message: paymentRes.message,
      //     ));
      //   }
      // } else {
      //   emit(PaymentFailure(
      //     errorMessage: paymentRes.message,
      //     paymentMethod: event.paymentMethod,
      //   ));
      // }

        // ===== BƯỚC 4: EMIT STATE ĐỂ UI MỞ APP THANH TOÁN =====
        if (isValidPayment) {
          print('✅ Payment URL generated, emitting NativePaymentUrlGenerated');

          // Emit state này sẽ trigger UI mở app thanh toán
          emit(NativePaymentUrlGenerated(
            paymentMethod: event.paymentMethod,
            orderId: event.orderId,
            paymentData: data, // Chứa payUrl, order_url, tokens...
          ));
        } else {
          emit(PaymentFailure(
            errorMessage: 'Payment URL generation failed',
            paymentMethod: event.paymentMethod,
          ));
        }
      } else {
        emit(PaymentFailure(
          errorMessage: paymentRes.message,
          paymentMethod: event.paymentMethod,
        ));
      }
    } catch (e) {
      print('❌ Native payment error: $e');
      emit(PaymentFailure(
        errorMessage: 'Lỗi ${event.paymentMethod}: ${e.toString()}',
        paymentMethod: event.paymentMethod,
      ));
    }
  }

  // ========== PAYMENT STATUS CHECKER ==========
  // Kiểm tra trạng thái thanh toán (gọi khi user quay lại từ app thanh toán)
  void _onPaymentStatusChecked(PaymentStatusChecked event, Emitter<PaymentState> emit) async {
    print('🔍 Checking payment status for order: ${event.orderId}');

    try {
      // Gọi API kiểm tra trạng thái
      ApiResponse res = await paymentRepository.checkPaymentStatus(event.orderId);

      if (res.success) {
        final data = res.data as Map<String, dynamic>;
        final status = data['status'] ?? 'unknown';           // Trạng thái: da_thanh_toan, chua_thanh_toan...
        final isVerified = data['isVerified'] ?? false;       // Đã xác thực chưa
        final transactionId = data['transactionId'];          // Mã giao dịch
        final paymentMethod = data['paymentMethod'] ?? 'Unknown';

        print('💳 Payment check result:');
        print('   - Status: $status');
        print('   - Verified: $isVerified');
        print('   - Transaction ID: $transactionId');
        print('   - Method: $paymentMethod');

        // Xử lý kết quả kiểm tra
        if (status == 'da_thanh_toan' && isVerified) {
          // ✅ THANH TOÁN THÀNH CÔNG
          print('🎉 Payment successful!');
          emit(NativePaymentSuccess(
            orderId: event.orderId,
            transactionId: transactionId ?? 'N/A',
            paymentMethod: paymentMethod,
          ));
        } else if (status == 'chua_thanh_toan') {
          // ⏳ THANH TOÁN CHƯA HOÀN TẤT
          print('⏳ Payment still pending, not emitting failure yet...');
          // Không emit state gì cả, để user có thể check lại
        } else {
          // ❌ THANH TOÁN THẤT BẠI
          print('❌ Payment failed or cancelled');
          emit(NativePaymentFailure(
            orderId: event.orderId,
            errorMessage: 'Thanh toán không thành công',
            paymentMethod: paymentMethod,
          ));
        }
      } else {
        print('❌ Payment status check API failed: ${res.message}');
        emit(PaymentFailure(
          errorMessage: 'Không thể kiểm tra trạng thái thanh toán: ${res.message}',
        ));
      }
    } catch (e) {
      print('💥 Payment status check exception: $e');
      emit(PaymentFailure(
        errorMessage: 'Lỗi kiểm tra thanh toán: ${e.toString()}',
      ));
    }
  }


  // ✅ Utility methods
  // Tạo order ID unique
  String generateOrderId(String roomTypeId) {
    return 'ORDER_${DateTime.now().millisecondsSinceEpoch}_$roomTypeId';
  }
// Check xem có đang trong trạng thái loading không
  bool get isLoading => state is PaymentLoading || state is PaymentProcessing;
}