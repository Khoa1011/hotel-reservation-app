import 'dart:convert';
import 'package:doan_datphong/Data/Provider/ApiResponse.dart';
import 'package:doan_datphong/Models/DonDatPhong.dart';
import 'package:http/http.dart' as http;
import '../../Provider/IP_v4_Address.dart';

class PaymentRepository {
  static final String ip = IPv4.IP_CURRENT;
  final String bookingURL = "$ip/api/bookings"; // ✅ FIXED: Đúng endpoint
  final String paymentURL = "$ip/api/payment";

  // ✅ FIXED: Booking creation method
  Future<ApiResponse> payment(DonDatPhong booking) async {
    final url = Uri.parse("$bookingURL/addbooking"); // ✅ Sử dụng đúng endpoint

    try {
      print('🔄 Creating booking at: $url');
      print('📝 Booking data: ${booking.toMap()}');

      final response = await http.post(
        url,
        body: jsonEncode(booking.toMap()),
        headers: {"Content-Type": "application/json"},
      );

      print('📡 Response status: ${response.statusCode}');
      print('📡 Response body: ${response.body}');

      if (response.statusCode == 201) {
        final jsonData = jsonDecode(response.body);

        if (jsonData['success'] == true) {
          return ApiResponse(
              success: true,
              message: jsonData['message'] ?? "Successful booking",
              data: DonDatPhong.fromJson(jsonData['booking'])
          );
        } else {
          return ApiResponse(
              success: false,
              message: jsonData['message'] ?? "Booking failed"
          );
        }
      } else {
        final errorData = jsonDecode(response.body);
        return ApiResponse(
            success: false,
            message: errorData['message'] ?? "HTTP ${response.statusCode} error"
        );
      }
    } catch (err) {
      print("❌ Booking creation error: $err");
      return ApiResponse(
          success: false,
          message: "Lỗi kết nối server: $err"
      );
    }
  }

  // ✅ NEW: Tạo MoMo payment
  Future<ApiResponse> createMoMoPayment({
    required String orderId,
    required int amount,
    required String orderInfo,
    required String userId,
  }) async {
    final url = Uri.parse("$paymentURL/momo/create");

    try {
      print('🔄 Creating MoMo payment: $orderId, Amount: $amount');

      final response = await http.post(
        url,
        body: jsonEncode({
          'orderId': orderId,
          'amount': amount,
          'orderInfo': orderInfo,
          'userId': userId,
        }),
        headers: {"Content-Type": "application/json"},
      );

      print('📡 MoMo response: ${response.statusCode} - ${response.body}');

      final jsonData = jsonDecode(response.body);

      if (response.statusCode == 200 && jsonData['success'] == true) {
        return ApiResponse(
            success: true,
            message: "MoMo payment created successfully",
            data: jsonData['data']
        );
      }

      return ApiResponse(
          success: false,
          message: jsonData['message'] ?? "Failed to create MoMo payment"
      );
    } catch (err) {
      print("❌ MoMo payment error: $err");
      return ApiResponse(success: false, message: "Lỗi MoMo: $err");
    }
  }

  // ✅ NEW: Tạo VNPay payment
  Future<ApiResponse> createVNPayPayment({
    required String orderId,
    required int amount,
    required String orderInfo,
  }) async {
    final url = Uri.parse("$paymentURL/vnpay/create");

    try {
      print('🔄 Creating VNPay payment: $orderId, Amount: $amount');

      final response = await http.post(
        url,
        body: jsonEncode({
          'orderId': orderId,
          'amount': amount,
          'orderInfo': orderInfo,
        }),
        headers: {"Content-Type": "application/json"},
      );

      print('📡 VNPay response: ${response.statusCode} - ${response.body}');

      final jsonData = jsonDecode(response.body);

      if (response.statusCode == 200 && jsonData['success'] == true) {
        return ApiResponse(
            success: true,
            message: "VNPay payment created successfully",
            data: jsonData['data']
        );
      }

      return ApiResponse(
          success: false,
          message: jsonData['message'] ?? "Failed to create VNPay payment"
      );
    } catch (err) {
      print("❌ VNPay payment error: $err");
      return ApiResponse(success: false, message: "Lỗi VNPay: $err");
    }
  }

  // ✅ NEW: Tạo ZaloPay payment
  Future<ApiResponse> createZaloPayPayment({
    required String orderId,
    required int amount,
    required String description,
    required String userId,
  }) async {
    final url = Uri.parse("$paymentURL/zalopay/create");

    try {
      print('🔄 Creating ZaloPay payment: $orderId, Amount: $amount');

      final response = await http.post(
        url,
        body: jsonEncode({
          'orderId': orderId,
          'amount': amount,
          'description': description,
          'userId': userId,
        }),
        headers: {"Content-Type": "application/json"},
      );

      print('📡 ZaloPay response: ${response.statusCode} - ${response.body}');

      final jsonData = jsonDecode(response.body);

      if (response.statusCode == 200 && jsonData['success'] == true) {
        return ApiResponse(
            success: true,
            message: "ZaloPay payment created successfully",
            data: jsonData['data']
        );
      }

      return ApiResponse(
          success: false,
          message: jsonData['message'] ?? "Failed to create ZaloPay payment"
      );
    } catch (err) {
      print("❌ ZaloPay payment error: $err");
      return ApiResponse(success: false, message: "Lỗi ZaloPay: $err");
    }
  }

  // ✅ NEW: Kiểm tra trạng thái thanh toán

  Future<ApiResponse> checkPaymentStatus(String orderId) async {
    final url = Uri.parse("$paymentURL/status/$orderId");

    try {
      print('🔍 Checking payment status for: $orderId');

      final response = await http.get(
        url,
        headers: {"Content-Type": "application/json"},
      );

      print('📡 Payment status response: ${response.statusCode} - ${response.body}');

      final jsonData = jsonDecode(response.body);

      if (response.statusCode == 200 && jsonData['success'] == true) {
        return ApiResponse(
            success: true,
            message: "Payment status retrieved successfully",
            data: jsonData['data']
        );
      }

      return ApiResponse(
          success: false,
          message: jsonData['message'] ?? "Failed to check payment status"
      );
    } catch (err) {
      print("❌ Payment status check error: $err");
      return ApiResponse(success: false, message: "Lỗi kiểm tra thanh toán: $err");
    }
  }

  // ✅ NEW: Bulk check payment status (cho polling multiple orders)
  Future<ApiResponse> checkBulkPaymentStatus(List<String> orderIds) async {
    final url = Uri.parse("$paymentURL/status/bulk");

    try {
      print('🔍 Bulk checking payment status for: $orderIds');

      final response = await http.post(
        url,
        body: jsonEncode({
          'orderIds': orderIds,
        }),
        headers: {"Content-Type": "application/json"},
      );

      final jsonData = jsonDecode(response.body);

      if (response.statusCode == 200 && jsonData['success'] == true) {
        return ApiResponse(
            success: true,
            message: "Bulk payment status retrieved successfully",
            data: jsonData['data']
        );
      }

      return ApiResponse(
          success: false,
          message: jsonData['message'] ?? "Failed to check bulk payment status"
      );
    } catch (err) {
      print("❌ Bulk payment status check error: $err");
      return ApiResponse(success: false, message: "Lỗi kiểm tra bulk thanh toán: $err");
    }
  }

  // ✅ NEW: Update booking với payment info
  Future<ApiResponse> updateBookingPayment({
    required String bookingId,
    required String orderId,
    required String paymentMethod,
    Map<String, dynamic>? paymentData,
  }) async {
    final url = Uri.parse("$bookingURL/update-payment/$bookingId");

    try {
      print('🔄 Updating booking payment: $bookingId with order: $orderId');

      final response = await http.put(
        url,
        body: jsonEncode({
          'orderId': orderId,
          'paymentMethod': paymentMethod,
          'paymentData': paymentData,
        }),
        headers: {"Content-Type": "application/json"},
      );

      final jsonData = jsonDecode(response.body);

      if (response.statusCode == 200 && jsonData['success'] == true) {
        return ApiResponse(
            success: true,
            message: "Booking payment updated successfully",
            data: jsonData['booking']
        );
      }

      return ApiResponse(
          success: false,
          message: jsonData['message'] ?? "Failed to update booking payment"
      );
    } catch (err) {
      print("❌ Update booking payment error: $err");
      return ApiResponse(success: false, message: "Lỗi cập nhật thanh toán: $err");
    }
  }

  // ✅ NEW: Get booking by ID
  Future<ApiResponse> getBookingById(String bookingId) async {
    final url = Uri.parse("$bookingURL/$bookingId");

    try {
      print('🔍 Getting booking: $bookingId');

      final response = await http.get(
        url,
        headers: {"Content-Type": "application/json"},
      );

      final jsonData = jsonDecode(response.body);

      if (response.statusCode == 200 && jsonData['success'] == true) {
        return ApiResponse(
            success: true,
            message: "Booking retrieved successfully",
            data: DonDatPhong.fromJson(jsonData['data'])
        );
      }

      return ApiResponse(
          success: false,
          message: jsonData['message'] ?? "Failed to get booking"
      );
    } catch (err) {
      print("❌ Get booking error: $err");
      return ApiResponse(success: false, message: "Lỗi lấy thông tin booking: $err");
    }
  }

  // ✅ NEW: Get user bookings
  Future<ApiResponse> getUserBookings({
    required String userId,
    String? status,
    String? paymentStatus,
    int page = 1,
    int limit = 10,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };

    if (status != null) queryParams['status'] = status;
    if (paymentStatus != null) queryParams['paymentStatus'] = paymentStatus;

    final uri = Uri.parse("$bookingURL/user/$userId").replace(queryParameters: queryParams);

    try {
      print('🔍 Getting user bookings: $userId');

      final response = await http.get(
        uri,
        headers: {"Content-Type": "application/json"},
      );

      final jsonData = jsonDecode(response.body);

      if (response.statusCode == 200 && jsonData['success'] == true) {
        final bookings = (jsonData['data'] as List)
            .map((item) => DonDatPhong.fromJson(item))
            .toList();

        return ApiResponse(
            success: true,
            message: "User bookings retrieved successfully",
            data: {
              'bookings': bookings,
              'pagination': jsonData['pagination']
            }
        );
      }

      return ApiResponse(
          success: false,
          message: jsonData['message'] ?? "Failed to get user bookings"
      );
    } catch (err) {
      print("❌ Get user bookings error: $err");
      return ApiResponse(success: false, message: "Lỗi lấy booking của user: $err");
    }
  }

  // ✅ NEW: Update booking status
  Future<ApiResponse> updateBookingStatus({
    required String bookingId,
    String? status,
    String? paymentStatus,
    String? note,
  }) async {
    final url = Uri.parse("$bookingURL/$bookingId/status");

    try {
      print('🔄 Updating booking status: $bookingId');

      final body = <String, dynamic>{};
      if (status != null) body['status'] = status;
      if (paymentStatus != null) body['paymentStatus'] = paymentStatus;
      if (note != null) body['note'] = note;

      final response = await http.patch(
        url,
        body: jsonEncode(body),
        headers: {"Content-Type": "application/json"},
      );

      final jsonData = jsonDecode(response.body);

      if (response.statusCode == 200 && jsonData['success'] == true) {
        return ApiResponse(
            success: true,
            message: "Booking status updated successfully",
            data: DonDatPhong.fromJson(jsonData['booking'])
        );
      }

      return ApiResponse(
          success: false,
          message: jsonData['message'] ?? "Failed to update booking status"
      );
    } catch (err) {
      print("❌ Update booking status error: $err");
      return ApiResponse(success: false, message: "Lỗi cập nhật trạng thái: $err");
    }
  }

  // ✅ NEW: Check room availability
  Future<ApiResponse> checkRoomAvailability({
    required String roomTypeId,
    required String checkInDate,
    required String checkOutDate,
    String? excludeBookingId,
  }) async {
    final url = Uri.parse("$bookingURL/check-availability");

    try {
      print('🔍 Checking room availability: $roomTypeId from $checkInDate to $checkOutDate');

      final body = {
        'maLoaiPhong': roomTypeId,
        'ngayNhanPhong': checkInDate,
        'ngayTraPhong': checkOutDate,
      };

      if (excludeBookingId != null) {
        body['excludeBookingId'] = excludeBookingId;
      }

      final response = await http.post(
        url,
        body: jsonEncode(body),
        headers: {"Content-Type": "application/json"},
      );

      final jsonData = jsonDecode(response.body);

      if (response.statusCode == 200 && jsonData['success'] == true) {
        return ApiResponse(
            success: true,
            message: "Room availability checked successfully",
            data: {
              'available': jsonData['available'],
              'conflictingBookings': jsonData['conflictingBookings'],
              'conflicts': jsonData['data']
            }
        );
      }

      return ApiResponse(
          success: false,
          message: jsonData['message'] ?? "Failed to check room availability"
      );
    } catch (err) {
      print("❌ Check room availability error: $err");
      return ApiResponse(success: false, message: "Lỗi kiểm tra tình trạng phòng: $err");
    }
  }

  Future<ApiResponse> testMoMoIPN() async {
    final url = Uri.parse("$paymentURL/test/momo-ipn");

    try {
      print('🧪 Testing MoMo IPN manually...');

      final response = await http.post(
        url,
        headers: {"Content-Type": "application/json"},
      ).timeout(Duration(seconds: 15));

      print('📡 MoMo IPN test response: ${response.statusCode} - ${response.body}');

      final jsonData = jsonDecode(response.body);

      if (response.statusCode == 200 && jsonData['success'] == true) {
        return ApiResponse(
            success: true,
            message: "MoMo IPN test completed successfully",
            data: jsonData
        );
      }

      return ApiResponse(
          success: false,
          message: jsonData['message'] ?? "MoMo IPN test failed"
      );
    } catch (err) {
      print("❌ MoMo IPN test error: $err");
      return ApiResponse(success: false, message: "Lỗi test MoMo IPN: $err");
    }
  }

  // ✅ NEW: Test hello endpoint (for connectivity testing)
  Future<ApiResponse> testHello() async {
    final url = Uri.parse("$paymentURL/test/hello");

    try {
      print('🔄 Testing connectivity...');

      final response = await http.get(
        url,
        headers: {"Content-Type": "application/json"},
      ).timeout(Duration(seconds: 10));

      print('📡 Hello test response: ${response.statusCode} - ${response.body}');

      final jsonData = jsonDecode(response.body);

      if (response.statusCode == 200 && jsonData['success'] == true) {
        return ApiResponse(
            success: true,
            message: "Connectivity test successful",
            data: jsonData
        );
      }

      return ApiResponse(
          success: false,
          message: jsonData['message'] ?? "Connectivity test failed"
      );
    } catch (err) {
      print("❌ Connectivity test error: $err");
      return ApiResponse(success: false, message: "Lỗi test connectivity: $err");
    }
  }
}