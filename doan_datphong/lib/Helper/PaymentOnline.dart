import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import '../Data/Provider/IP_v4_Address.dart';


class NativePaymentService {
  // ===== MOMO NATIVE APP PAYMENT =====
  static Future<bool> payWithMoMoApp({
    required String orderId,
    required int amount,
    required String orderInfo,
    required BuildContext context,
  }) async {
    try {
      // 1. Gọi backend API để tạo MoMo payment
      final response = await http.post(
        Uri.parse('${IPv4.IP_CURRENT}/api/payment/momo/create'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'orderId': orderId,
          'amount': amount,
          'orderInfo': orderInfo,
        }),
      );

      if (response.statusCode == 200) {
        final momoResponse = json.decode(response.body);

        if (momoResponse['resultCode'] == 0) {
          final payUrl = momoResponse['payUrl']; // MoMo trả về payUrl

          // 2. Thử mở MoMo app
          final momoAppUrl = Uri.parse(payUrl);

          if (await canLaunchUrl(momoAppUrl)) {
            // Mở MoMo app
            await launchUrl(momoAppUrl, mode: LaunchMode.externalApplication);
            return true;
          } else {
            // MoMo app chưa cài, mở web
            await _openMoMoWeb(payUrl);
            return true;
          }
        } else {
          throw Exception(momoResponse['message']);
        }
      } else {
        throw Exception('Backend error: ${response.statusCode}');
      }
    } catch (e) {
      _showError(context, 'Lỗi MoMo: $e');
      return false;
    }
  }

  // ===== VNPAY NATIVE APP PAYMENT =====
  static Future<bool> payWithVNPayApp({
    required String orderId,
    required int amount,
    required String orderInfo,
    required BuildContext context,
  }) async {
    try {
      // 1. Gọi backend API để tạo VNPay payment
      final response = await http.post(
        Uri.parse('${IPv4.IP_CURRENT}/api/payment/vnpay/create'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'orderId': orderId,
          'amount': amount,
          'orderInfo': orderInfo,
        }),
      );

      if (response.statusCode == 200) {
        final vnpayResponse = json.decode(response.body);
        final paymentUrl = vnpayResponse['paymentUrl'];

        // 2. Tạo VNPay app deep link
        final vnpayAppUrl = Uri.parse('vnpay://pay?url=${Uri.encodeComponent(paymentUrl)}');

        if (await canLaunchUrl(vnpayAppUrl)) {
          // VNPay app đã cài
          await launchUrl(vnpayAppUrl, mode: LaunchMode.externalApplication);
          return true;
        } else {
          // VNPay app chưa cài, mở web
          await _openVNPayWeb(paymentUrl);
          return true;
        }
      } else {
        throw Exception('Backend error: ${response.statusCode}');
      }
    } catch (e) {
      _showError(context, 'Lỗi VNPay: $e');
      return false;
    }
  }

  // ===== ZALOPAY NATIVE APP PAYMENT =====
  static Future<bool> payWithZaloPayApp({
    required String orderId,
    required int amount,
    required String description,
    required BuildContext context,
  }) async {
    try {
      // 1. Gọi backend API để tạo ZaloPay payment
      final response = await http.post(
        Uri.parse('${IPv4.IP_CURRENT}/api/payment/zalopay/create'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'orderId': orderId,
          'amount': amount,
          'description': description,
        }),
      );

      if (response.statusCode == 200) {
        final zaloResponse = json.decode(response.body);

        if (zaloResponse['return_code'] == 1) {
          final orderToken = zaloResponse['order_token'];

          // 2. Tạo ZaloPay app deep link
          final zaloAppUrl = Uri.parse('zalopay://pay?order_token=$orderToken');

          if (await canLaunchUrl(zaloAppUrl)) {
            // ZaloPay app đã cài
            await launchUrl(zaloAppUrl, mode: LaunchMode.externalApplication);
            return true;
          } else {
            // ZaloPay app chưa cài, mở web
            await _openZaloPayWeb(zaloResponse['order_url']);
            return true;
          }
        } else {
          throw Exception(zaloResponse['return_message']);
        }
      } else {
        throw Exception('Backend error: ${response.statusCode}');
      }
    } catch (e) {
      _showError(context, 'Lỗi ZaloPay: $e');
      return false;
    }
  }

  // ===== WEB FALLBACK =====
  static Future<void> _openMoMoWeb(String payUrl) async {
    await launchUrl(Uri.parse(payUrl), mode: LaunchMode.externalApplication);
  }

  static Future<void> _openVNPayWeb(String paymentUrl) async {
    await launchUrl(Uri.parse(paymentUrl), mode: LaunchMode.externalApplication);
  }

  static Future<void> _openZaloPayWeb(String orderUrl) async {
    await launchUrl(Uri.parse(orderUrl), mode: LaunchMode.externalApplication);
  }

  // ===== ERROR HANDLING =====
  static void _showError(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }
}

// ===== PAYMENT RESULT LISTENER =====
class PaymentResultListener extends StatefulWidget {
  final Function(bool success, String? transactionId) onResult;
  final String orderId;

  const PaymentResultListener({
    Key? key,
    required this.onResult,
    required this.orderId,
  }) : super(key: key);

  @override
  State<PaymentResultListener> createState() => _PaymentResultListenerState();
}

class _PaymentResultListenerState extends State<PaymentResultListener> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // App quay lại từ MoMo/VNPay/ZaloPay app
      _checkPaymentResult();
    }
  }

  Future<void> _checkPaymentResult() async {
    try {
      // Gọi API kiểm tra trạng thái thanh toán
      final response = await http.get(
        Uri.parse('${IPv4.IP_CURRENT}/api/payment/status/${widget.orderId}'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final result = json.decode(response.body);
        final status = result['status'];
        final transactionId = result['transactionId'];

        if (status == 'Đã thanh toán') {
          widget.onResult(true, transactionId);
        } else {
          widget.onResult(false, null);
        }
      } else {
        widget.onResult(false, null);
      }
    } catch (e) {
      widget.onResult(false, null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(); // Invisible widget
  }
}