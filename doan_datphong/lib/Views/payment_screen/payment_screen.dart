import 'package:doan_datphong/Blocs/payment_Blocs/payment_bloc.dart';
import 'package:doan_datphong/Blocs/payment_Blocs/payment_event.dart';
import 'package:doan_datphong/Blocs/payment_Blocs/payment_state.dart';
import 'package:doan_datphong/Helper/FormatCurrency.dart';
import 'package:doan_datphong/Models/DonDatPhong.dart';
import 'package:doan_datphong/Models/LichPhongTrong.dart';
import 'package:doan_datphong/Models/LoaiPhong.dart';
import 'package:doan_datphong/Models/NguoiDung.dart';
import 'package:doan_datphong/Views/home_View/home_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../Blocs/bookingCheckUser_Blocs/bookingCheckUser_bloc.dart';
import '../../Blocs/bookingCheckUser_Blocs/bookingCheckUser_event.dart';
import '../../Blocs/bookingCheckUser_Blocs/bookingCheckUser_state.dart';
import '../../generated/l10n.dart';
import '../../Helper/FormatDateTime.dart';
import '../components/NotificationDialog.dart';
import 'package:url_launcher/url_launcher.dart';


class PaymentScreen extends StatefulWidget {
  final LoaiPhong loaiPhong;
  final LichPhongTrong lichPhongTrong;
  final NguoiDung? nguoiDung;

  // ✅ Thêm các parameters để lưu search info
  final String? bookingType;
  final String? checkInDate;
  final String? checkOutDate;
  final String? checkInTime;
  final String? checkOutTime;
  final int? duration;

  const PaymentScreen({
    super.key,
    this.nguoiDung,
    required this.lichPhongTrong,
    required this.loaiPhong,
    this.bookingType,
    this.checkInDate,
    this.checkOutDate,
    this.checkInTime,
    this.checkOutTime,
    this.duration,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  bool _isProcessingPayment = false;
  bool _paymentSuccess = false;
  bool _isWaitingForPaymentResult = false;
  String? _currentOrderId;
  PhuongThucThanhToan selectedPaymentMethod = PhuongThucThanhToan.tien_mat;


  late String checkInDate = widget.lichPhongTrong.ngayNhanPhong;
  late String? checkOutDate = widget.lichPhongTrong.ngayTraPhong;
  late String formattedCheckInTime = widget.lichPhongTrong.gioNhanPhong;
  late String formattedCheckOutTime;

  bool _isCheckingUserBan = true;
  bool _isUserBannedFromCash = false;
  int _userNoShowCount = 0;


  String getDatetime() {
    if (widget.lichPhongTrong.loaiDatPhong == "qua_dem") {
      formattedCheckOutTime = "12:00";
    } else if (widget.lichPhongTrong.loaiDatPhong == "theo_gio") {
      formattedCheckOutTime = widget.lichPhongTrong.gioTraPhong ?? "00:00";
    } else {
      formattedCheckOutTime = "";
    }
    return formattedCheckOutTime;
  }

  // ✅ HÀM MỚI - Kiểm tra user có bị cấm tiền mặt không
  Future<void> _checkUserBanStatus() async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      String userID = prefs.getString("_id") ?? '';

      print("Id của user $userID");

      if (userID.isNotEmpty) {
        context.read<BookingCheckBloc>().add(CheckUserBanStatus(userID));
      } else {
        setState(() {
          _isCheckingUserBan = false;
          _isUserBannedFromCash = false;
        });
      }
    } catch (e) {
      print('❌ Error checking user ban status: $e');
      setState(() {
        _isCheckingUserBan = false;
        _isUserBannedFromCash = false;
      });
    }
  }

  List<Map<String, dynamic>> getPaymentMethods(BuildContext context) {
    List<Map<String, dynamic>> methods = [
      {
        'id': PhuongThucThanhToan.ZaloPay,
        'name': S
            .of(context)
            .zaloPayWallet,
        'image': 'assets/icons/logo_zalopay.png',
        'color': Colors.teal,
        'description': S
            .of(context)
            .zaloPayDescription,
      },
      {
        'id': PhuongThucThanhToan.the_tin_dung,
        'name': S
            .of(context)
            .creditCard,
        'image': 'assets/icons/logo_mastercard.png',
        'color': Colors.blue,
        'description': S
            .of(context)
            .creditCardDescription,
      },
      {
        'id': PhuongThucThanhToan.Momo,
        'name': S
            .of(context)
            .momoWallet,
        'image': 'assets/icons/logo_momo2.jpg',
        'color': Colors.pink,
        'description': S
            .of(context)
            .momoDescription,
      },
      {
        'id': PhuongThucThanhToan.VNPay,
        'name': 'VNPay',
        'image': 'assets/icons/Icon-VNPAY-QR.jpg',
        'color': Colors.orange,
        'description': S
            .of(context)
            .vnPayDescription,
      },
    ];

    // ✅ Chỉ thêm tiền mặt nếu user KHÔNG bị cấm
    if (!_isUserBannedFromCash) {
      methods.insert(0, {
        'id': PhuongThucThanhToan.tien_mat,
        'name': S
            .of(context)
            .payAtHotel,
        'icon': Icons.hotel_outlined,
        'color': Colors.teal,
        'description': S
            .of(context)
            .payOnCheckIn,
      });
    }

    return methods;
  }


  String address = '';


  // ✅ MAIN PAYMENT HANDLER - Updated với native payment
  void eventPaymentBooking() async {
    try {
      // ✅ Kiểm tra lại lần cuối trước khi thanh toán
      if (selectedPaymentMethod == PhuongThucThanhToan.tien_mat && _isUserBannedFromCash) {
        NotificationDialog.showError(
          context,
          title: 'Không thể thanh toán tiền mặt',
          message: 'Tài khoản của bạn đã bị hạn chế thanh toán tiền mặt do không nhận phòng $_userNoShowCount lần.',
        );
        return;
      }

      SharedPreferences prefs = await SharedPreferences.getInstance();
      String userID = prefs.getString("_id") ?? '';
      String? hotelID = prefs.getString("hotel_id");
      String? userStd = prefs.getString("user_std") ?? '';

      // ✅ Tạo booking object
      DonDatPhong booking = DonDatPhong.short(
          maLoaiPhong: widget.loaiPhong.id,
          maKhachSan: hotelID,
          maNguoiDung: userID,
          ngayNhanPhong: widget.lichPhongTrong.ngayNhanPhong,
          ngayTraPhong: widget.lichPhongTrong.ngayTraPhong ?? "",
          gioNhanPhong: formattedCheckInTime,
          gioTraPhong: formattedCheckOutTime,
          tongDonDat: widget.loaiPhong.giaCuoiCung,
          trangThaiThanhToan: TrangThaiThanhToan.chua_thanh_toan,
          phuongThucThanhToan: selectedPaymentMethod,
          loaiDatPhong: _getLoaiDatPhongFromString(
              widget.lichPhongTrong.loaiDatPhong),
          donGia: widget.loaiPhong.giaLoaiPhong?.giaCoBan ?? 0.0,
          donVi: _getDonViFromBookingType(widget.lichPhongTrong.loaiDatPhong),
          soLuongDonVi: widget.loaiPhong.giaLoaiPhong?.khoangThoiGian ?? 1,
          tongTienPhong: widget.loaiPhong.giaCuoiCung,
          soLuongPhong: widget.lichPhongTrong.soLuongPhong,
          phuPhiCuoiTuan: widget.loaiPhong.giaLoaiPhong!.phanTichGia
              .phuThuCuoiTuan,
          soDienThoai: userStd
      );

      // ✅ Dispatch event theo payment method
      if (selectedPaymentMethod == PhuongThucThanhToan.tien_mat) {
        // Cash payment
        context.read<PaymentBloc>().add(PaymentSubmitted(booking));
      } else {
        // Native payment
        final bloc = context.read<PaymentBloc>();
        _currentOrderId = bloc.generateOrderId(widget.loaiPhong.id);
        final amount = widget.loaiPhong.giaCuoiCung.toInt();
        final orderInfo = "Thanh toan phong ${widget.loaiPhong.tenLoaiPhong}";

        String paymentMethod;
        switch (selectedPaymentMethod) {
          case PhuongThucThanhToan.Momo:
            paymentMethod = 'MoMo';
            break;
          case PhuongThucThanhToan.VNPay:
            paymentMethod = 'VNPay';
            break;
          case PhuongThucThanhToan.ZaloPay:
            paymentMethod = 'ZaloPay';
            break;
          default:
            paymentMethod = 'Unknown';
        }

        context.read<PaymentBloc>().add(
          NativePaymentRequested(
            booking: booking,
            paymentMethod: paymentMethod,
            orderId: _currentOrderId!,
            amount: amount,
            orderInfo: orderInfo,
          ),
        );
      }
    } catch (e) {
      NotificationDialog.showError(
        context,
        message: 'Lỗi: ${e.toString()}',
      );
    }
  }

  // ✅ HOTEL PAYMENT
  // Future<void> _processHotelPayment(DonDatPhong booking) async {
  //   context.read<PaymentBloc>().add(PaymentSubmitted(booking));
  //
  //   setState(() {
  //     _isProcessingPayment = false;
  //   });
  //
  //   NotificationDialog.showSuccess(
  //     context,
  //     title: S.of(context).bookingSuccessful,
  //     message: S.of(context).bookingSuccessMessage,
  //     onButtonPressed: () {
  //       Navigator.popUntil(context, ModalRoute.withName('/'));
  //     },
  //   );
  // }

  // ========== XỬ LÝ MỞ APP THANH TOÁN ==========
// Method này được gọi khi nhận state NativePaymentUrlGenerated
  Future<void> _handlePaymentUrl(Map<String, dynamic> paymentData,
      String paymentMethod) async {
    try {
      print('🚀 Opening payment app for: $paymentMethod');
      print('📊 Available payment data: ${paymentData.keys.toList()}');

      // Route đến method xử lý tương ứng
      switch (paymentMethod.toLowerCase()) {
        case 'momo':
          await _openMoMoPayment(paymentData);
          break;
        case 'vnpay':
          await _openVNPayPayment(paymentData);
          break;
        case 'zalopay':
          await _openZaloPayPayment(paymentData);
          break;
        default:
          throw Exception('Unsupported payment method: $paymentMethod');
      }

      // Hiển thị dialog chờ kết quả thanh toán
      _showPaymentWaitingDialog(paymentMethod);
    } catch (e) {
      print('💥 Error opening payment app: $e');
      setState(() {
        _isWaitingForPaymentResult = false;
      });
      NotificationDialog.showError(
        context,
        message: '${S
            .of(context)
            .cannotOpenPaymentApp} $e',
      );
    }
  }

// ========== MỞ MOMO PAYMENT ==========
  Future<void> _openMoMoPayment(Map<String, dynamic> momoData) async {
    final payUrl = momoData['payUrl'];

    print('💖 Opening MoMo payment...');
    print('🌐 Pay URL: $payUrl');

    if (payUrl != null && payUrl.isNotEmpty) {
      final payUri = Uri.parse(payUrl);

      // ✅ Chỉ thử 1 cách: external application
      final launched = await launchUrl(
          payUri,
          mode: LaunchMode.externalApplication
      );

      if (launched) {
        print('✅ Opened MoMo payment successfully');
      } else {
        print('❌ Failed to launch MoMo URL');
        throw 'Could not launch MoMo payment URL';
      }
    } else {
      throw 'No payment URL found in MoMo response';
    }
  }

// ========== MỞ VNPAY PAYMENT ==========
  Future<void> _openVNPayPayment(Map<String, dynamic> vnpayData) async {
    final paymentUrl = vnpayData['paymentUrl']; // VNPay payment URL

    print('🏦 Opening VNPay payment...');
    print('🌐 Payment URL: $paymentUrl');

    if (paymentUrl != null && paymentUrl.isNotEmpty) {
      // ===== STRATEGY 1: THỬ MỞ APP VNPAY =====
      // Tạo VNPay app deeplink
      final vnpayAppUrl = Uri.parse(
          'vnpay://pay?url=${Uri.encodeComponent(paymentUrl)}');

      if (await canLaunchUrl(vnpayAppUrl)) {
        await launchUrl(vnpayAppUrl, mode: LaunchMode.externalApplication);
        print('✅ Opened VNPay app');
      } else {
        print('⚠️ VNPay app not installed, opening web...');

        // ===== STRATEGY 2: FALLBACK VỀ WEB =====
        final payUri = Uri.parse(paymentUrl);
        if (await canLaunchUrl(payUri)) {
          await launchUrl(payUri, mode: LaunchMode.externalApplication);
          print('✅ Opened VNPay web payment');
        } else {
          throw 'Could not launch VNPay payment URL';
        }
      }
    } else {
      throw 'No payment URL found in VNPay response';
    }
  }

// ========== MỞ ZALOPAY PAYMENT ==========
  Future<void> _openZaloPayPayment(Map<String, dynamic> zaloData) async {
    // ZaloPay có nhiều loại URL/token
    final orderUrl = zaloData['order_url']; // URL thanh toán web
    final zpTransToken = zaloData['zp_trans_token']; // Token cho app

    print('💙 Opening ZaloPay payment...');
    print('🌐 Order URL: $orderUrl');
    print('🎫 ZP Trans Token: ${zpTransToken ?? 'Not available'}');

    // ===== STRATEGY 1: THỬ APP ZALOPAY VỚI TOKEN =====
    if (zpTransToken != null && zpTransToken.isNotEmpty) {
      final zaloTokenUrl = Uri.parse(
          'zalopay://pay?zp_trans_token=$zpTransToken');

      if (await canLaunchUrl(zaloTokenUrl)) {
        await launchUrl(zaloTokenUrl, mode: LaunchMode.externalApplication);
        print('✅ Opened ZaloPay app with token');
        return; // Thành công, thoát method
      } else {
        print('⚠️ Cannot open ZaloPay with token, trying order URL...');
      }
    }

    // ===== STRATEGY 2: THỬ APP ZALOPAY VỚI ORDER URL =====
    if (orderUrl != null && orderUrl.isNotEmpty) {
      final zaloOrderUrl = Uri.parse(
          'zalopay://app?order_url=${Uri.encodeComponent(orderUrl)}');

      if (await canLaunchUrl(zaloOrderUrl)) {
        await launchUrl(zaloOrderUrl, mode: LaunchMode.externalApplication);
        print('✅ Opened ZaloPay app with order URL');
        return; // Thành công, thoát method
      } else {
        print('⚠️ ZaloPay app not installed, opening web...');
      }

      // ===== STRATEGY 3: FALLBACK VỀ WEB =====
      final orderUri = Uri.parse(orderUrl);
      if (await canLaunchUrl(orderUri)) {
        await launchUrl(orderUri, mode: LaunchMode.externalApplication);
        print('✅ Opened ZaloPay web payment');
      } else {
        throw 'Could not launch ZaloPay payment URL';
      }
    } else {
      throw 'No order URL found in ZaloPay response';
    }
  }

// ========== DIALOG CHỜ KẾT QUẢ THANH TOÁN ==========
// Hiển thị sau khi mở app thanh toán
  void _showPaymentWaitingDialog(String paymentMethod) {
    showDialog(
      context: context,
      barrierDismissible: false, // User không thể đóng bằng cách tap outside
      builder: (BuildContext dialogContext) =>
          AlertDialog(
            title: Text(S
                .of(context)
                .waitingForPayment),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(), // Loading indicator
                SizedBox(height: 16),
                Text('${S
                    .of(context)
                    .completePaymentOn} $paymentMethod'),
                SizedBox(height: 8),
                Text(
                  S
                      .of(context)
                      .returnToAppAfterPayment,
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),

                // ✅ Widget lắng nghe app lifecycle và check payment status
                _PaymentStatusListener(
                  orderId: _currentOrderId!, // Order ID để track
                  onResult: (success, transactionId) {
                    Navigator.of(dialogContext).pop(); // Đóng dialog

                    // Xử lý kết quả
                    if (success) {
                      _handlePaymentSuccess(transactionId!);
                    } else {
                      _handlePaymentFailure();
                    }
                  },
                ),
              ],
            ),
            actions: [
              // Button kiểm tra thủ công
              TextButton(
                onPressed: () {
                  print('🔄 Manual payment status check requested');
                  if (_currentOrderId != null) {
                    // Dispatch event kiểm tra status
                    context.read<PaymentBloc>().add(
                        PaymentStatusChecked(_currentOrderId!));
                  }
                },
                child: Text(S
                    .of(context)
                    .checkAgain),
              ),
              // Button hủy
              TextButton(
                onPressed: () {
                  print('❌ User cancelled payment wait');
                  Navigator.of(dialogContext).pop();
                  setState(() {
                    _isWaitingForPaymentResult = false;
                  });
                },
                child: Text(S
                    .of(context)
                    .cancel),
              ),
            ],
          ),
    );
  }


  // ✅ PAYMENT SUCCESS HANDLER
  // void _handlePaymentSuccess(String transactionId) {
  //   NotificationDialog.showSuccess(
  //     context,
  //     title: S
  //         .of(context)
  //         .paymentSuccessful,
  //     message: S
  //         .of(context)
  //         .paymentSuccessMessage,
  //     onButtonPressed: () {
  //       Navigator.popUntil(context, ModalRoute.withName('/home_screen'));
  //     },
  //   );
  // }
  void _handlePaymentSuccess(String transactionId) {
    NotificationDialog.showSuccess(
      context,
      title: S.of(context).paymentSuccessful,
      message: S.of(context).paymentSuccessMessage,
      onButtonPressed: () {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(
            builder: (context) => HomeScreen(),
          ),
              (route) => false,
        );
      },
    );
  }
  // ✅ PAYMENT FAILURE HANDLER
  void _handlePaymentFailure() {
    NotificationDialog.showError(
      context,
      title: 'Thanh toán thất bại',
      message: 'Giao dịch không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.',
    );
  }

  // ✅ UTILITY METHODS
  String _generateOrderId() {
    return 'ORDER_${DateTime
        .now()
        .millisecondsSinceEpoch}_${widget.loaiPhong.id}';
  }

  LoaiDatPhong _getLoaiDatPhongFromString(String? type) {
    switch (type) {
      case 'theo_gio':
        return LoaiDatPhong.theo_gio;
      case 'qua_dem':
        return LoaiDatPhong.qua_dem;
      case 'dai_ngay':
        return LoaiDatPhong.dai_ngay;
      default:
        return LoaiDatPhong.qua_dem;
    }
  }

  String _getDonViFromBookingType(String? type) {
    switch (type) {
      case 'theo_gio':
        return 'gio';
      case 'qua_dem':
        return 'dem';
      case 'dai_ngay':
        return 'ngay';
      default:
        return 'dem';
    }
  }

  @override
  void initState() {
    super.initState();
    getValueSharedPre();
    _checkUserBanStatus();
  }

  Future<void> getValueSharedPre() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    setState(() {
      address = prefs.getString("hotel_address") ?? "Địa chỉ khách sạn";
    });
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocListener(
      listeners: [
        BlocListener<PaymentBloc, PaymentState>(
            listener: (context, state) {
              print('🔄 PaymentBloc state changed: ${state.runtimeType}');

              // ===== XỬ LÝ CASH PAYMENT THÀNH CÔNG =====
              if (state is PaymentSuccess) {
                setState(() {
                  _isProcessingPayment = false; // Tắt loading button
                  _isWaitingForPaymentResult = false; // Tắt waiting state
                });

                // Hiển thị thông báo thành công và quay về home
                NotificationDialog.showSuccess(
                  context,
                  message: S.of(context).bookingSuccessMessage,
                  onButtonPressed: () {
                    Navigator.pushAndRemoveUntil(
                      context,
                      MaterialPageRoute(builder: (context) => HomeScreen()),
                          (Route<dynamic> route) => false,
                    );
                  },
                );

                // ===== XỬ LÝ PAYMENT REDIRECT (LEGACY) =====
              } else if (state is PaymentRedirectSuccess) {
                setState(() {
                  _isProcessingPayment = false;
                  _isWaitingForPaymentResult = false;
                });
                NotificationDialog.showSuccess(
                  context,
                  message: S.of(context).bookingAndPaymentSuccessful,
                  onButtonPressed: () {
                    Navigator.pushAndRemoveUntil(
                      context,
                      MaterialPageRoute(builder: (context) => HomeScreen()),
                          (Route<dynamic> route) => false,
                    );
                  },
                );

                // ===== XỬ LÝ LỖI CHUNG =====
              } else if (state is PaymentFailure) {
                setState(() {
                  _isProcessingPayment = false;
                  _isWaitingForPaymentResult = false;
                });
                NotificationDialog.showError(
                  context,
                  message: state.errorMessage,
                );
              }
              // ===== XỬ LÝ PAYMENT URL ĐƯỢC TẠO =====
              // State này được emit khi backend tạo thành công payment URL
              else if (state is NativePaymentUrlGenerated) {
                print('📱 Payment URL generated for: ${state.paymentMethod}');
                print(
                    '🔗 Payment data keys: ${state.paymentData.keys.toList()}');

                setState(() {
                  _isProcessingPayment = false; // Tắt loading tạo payment
                  _isWaitingForPaymentResult = true; // Bật waiting cho result
                });

                // Mở app thanh toán tương ứng
                _handlePaymentUrl(state.paymentData, state.paymentMethod);
              }
              // ===== XỬ LÝ THANH TOÁN ONLINE THÀNH CÔNG =====
              else if (state is NativePaymentSuccess) {
                print('🎉 Native payment successful: ${state.transactionId}');
                setState(() {
                  _isWaitingForPaymentResult = false;
                });
                _handlePaymentSuccess(state.transactionId);
              }
              // ===== XỬ LÝ THANH TOÁN ONLINE THẤT BẠI =====
              else if (state is NativePaymentFailure) {
                print('💔 Native payment failed: ${state.errorMessage}');
                setState(() {
                  _isWaitingForPaymentResult = false;
                });
                _handlePaymentFailure();
              }
            }),
        BlocListener<BookingCheckBloc, BookingCheckState>(
          listener: (context, state) {
            print('🔄 BookingCheckBloc state changed: ${state.runtimeType}');

            // ✅ SỬA: Cast state về đúng kiểu UserBanStatusLoaded
            if (state is UserBanStatusLoaded) {
              setState(() {
                _isCheckingUserBan = false;
                _isUserBannedFromCash = state.isBannedFromCash; // ✅ Đã cast sang UserBanStatusLoaded
                _userNoShowCount = state.noShowCount; // ✅ Đã cast sang UserBanStatusLoaded
              });

              // ✅ Nếu user bị cấm và đang chọn tiền mặt → chuyển sang phương thức khác
              if (_isUserBannedFromCash && selectedPaymentMethod == PhuongThucThanhToan.tien_mat) {
                setState(() {
                  selectedPaymentMethod = PhuongThucThanhToan.ZaloPay; // Default sang ZaloPay
                });

                // // Hiển thị thông báo
                // NotificationDialog.showError(
                //   context,
                //   title: 'Tài khoản bị hạn chế',
                //   message: 'Bạn đã không nhận phòng $_userNoShowCount lần. Vui lòng thanh toán online.',
                // );
              }
            }
            // ✅ SỬA: Xử lý lỗi check user ban
            else if (state is BookingCheckError) {
              setState(() {
                _isCheckingUserBan = false;
                _isUserBannedFromCash = false; // Default cho phép thanh toán tiền mặt nếu lỗi
              });
              print('❌ Booking check error: ${state.errorMessage}');
            }
            // ✅ SỬA: Xử lý trigger overdue check completed (nếu cần)
            else if (state is OverdueCheckCompleted) {
              // Handle overdue check completed if needed
              print('✅ Overdue check completed: ${state.message}');
            }
          },
        ),
      ],
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            S
                .of(context)
                .payment,
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          centerTitle: true,
          elevation: 0,
          backgroundColor: Colors.transparent,
        ),
        body: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.only(bottom: 200),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildBookingTypeHeader(),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildRoomTypeCard(),
                          const SizedBox(height: 24),
                          const Divider(thickness: 1),
                          const SizedBox(height: 16),


                          if (_isUserBannedFromCash) _buildBanNotification(),

                          Row(
                            children: [
                              Icon(Icons.receipt_long, color: Colors.blue),
                              SizedBox(width: 8),
                              Text(
                                S
                                    .of(context)
                                    .bookingDetails,
                                style: TextStyle(
                                    fontSize: 20, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          _buildBookingDetailsCard(),
                          const SizedBox(height: 24),
                          _buildPriceBreakdownCard(),
                          const SizedBox(height: 24),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            _buildBottomPaymentSection(),
          ],
        ),
      ),



    );
  }

  // ✅ THÊM Widget hiển thị thông báo user bị cấm
  Widget _buildBanNotification() {
    return Container(
      margin: EdgeInsets.only(bottom: 16),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.orange.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange.shade200),
      ),
      child: Row(
        children: [
          Icon(Icons.warning_amber, color: Colors.orange.shade600, size: 24),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Tài khoản bị hạn chế',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.orange.shade800,
                    fontSize: 16,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Bạn đã không nhận phòng $_userNoShowCount lần. Vui lòng thanh toán online để tiếp tục đặt phòng.',
                  style: TextStyle(
                    color: Colors.orange.shade700,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }


  // ✅ Existing UI building methods remain the same...
  Widget _buildBookingTypeHeader() {
    return Padding(
      padding: EdgeInsets.all(16),
      child: Row(
        children: [
          Icon(
            _getBookingTypeIcon(),
            color: _getBookingTypeColor(),
            size: 24,
          ),
          SizedBox(width: 12),
          Text(
            _getBookingTypeTitle(),
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
        ],
      ),
    );
  }

  Color _getBookingTypeColor() {
    switch (widget.lichPhongTrong.loaiDatPhong) {
      case 'theo_gio':
        return Colors.orange[600]!;
      case 'qua_dem':
        return Colors.indigo[600]!;
      case 'dai_ngay':
        return Colors.green[600]!;
      default:
        return Colors.blue[600]!;
    }
  }

  IconData _getBookingTypeIcon() {
    switch (widget.lichPhongTrong.loaiDatPhong) {
      case 'theo_gio':
        return Icons.access_time;
      case 'qua_dem':
        return Icons.nights_stay;
      case 'dai_ngay':
        return Icons.calendar_month;
      default:
        return Icons.hotel;
    }
  }

  String _getBookingTypeTitle() {
    switch (widget.lichPhongTrong.loaiDatPhong) {
      case 'theo_gio':
        return S
            .of(context)
            .hourlyBooking;
      case 'qua_dem':
        return S
            .of(context)
            .overnightBooking;
      case 'dai_ngay':
        return S
            .of(context)
            .longStayBooking;
      default:
        return S
            .of(context)
            .booking;
    }
  }

  // ✅ Room Type Card
  Widget _buildRoomTypeCard() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Hero(
              tag: 'room-${widget.loaiPhong.id}',
              child: Container(
                width: 100,
                height: 90,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 8,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: widget.loaiPhong.layAnhDauTien() != null &&
                      widget.loaiPhong.layAnhDauTien()!.isNotEmpty
                      ? Image.network(
                    widget.loaiPhong.layAnhDauTien() ?? '',
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) =>
                        _buildFallbackContainer(),
                  )
                      : _buildFallbackContainer(),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.loaiPhong.tenLoaiPhong,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    address,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade900,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _buildGuestAndRoomInfo(),
                  const SizedBox(height: 8),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.blue.shade200),
                    ),
                    child: Text(
                      CurrencyHelper.formatVND(widget.loaiPhong.giaCa),
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.blue.shade700,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGuestAndRoomInfo() {
    return Wrap(
      spacing: 16,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.person, size: 20, color: Color(0xFF525150)),
            SizedBox(width: 4),
            Text(
              _buildSummaryTextTotalGuest(context),
              style: TextStyle(
                  fontSize: 17,
                  color: Color(0xFF525150),
                  fontWeight: FontWeight.bold
              ),
            ),
          ],
        ),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.door_front_door, size: 20, color: Color(0xFF525150)),
            SizedBox(width: 4),
            Text(
              _buildSummaryTextTotalRooms(context),
              style: TextStyle(fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF525150)),
            ),
          ],
        ),
      ],
    );
  }

  String _buildSummaryTextTotalGuest(BuildContext context) {
    final locale = Localizations.localeOf(context);
    final isVietnamese = locale.languageCode == 'vi';

    String guestText;
    if (isVietnamese) {
      guestText = '${widget.lichPhongTrong.soLuongKhach.soNguoiLon} người lớn';
      if (widget.lichPhongTrong.soLuongKhach.soTreEm! > 0) {
        guestText += ' • ${widget.lichPhongTrong.soLuongKhach.soTreEm} trẻ em';
      }
    } else {
      guestText = '${widget.lichPhongTrong.soLuongKhach.soNguoiLon} '
          'adult${widget.lichPhongTrong.soLuongKhach.soNguoiLon > 1
          ? 's'
          : ''}';
      if (widget.lichPhongTrong.soLuongKhach.soTreEm! > 0) {
        guestText += ' • ${widget.lichPhongTrong.soLuongKhach.soTreEm} '
            'child${widget.lichPhongTrong.soLuongKhach.soTreEm! > 1
            ? 'ren'
            : ''}';
      }
    }
    return guestText;
  }

  String _buildSummaryTextTotalRooms(BuildContext context) {
    final locale = Localizations.localeOf(context);
    final isVietnamese = locale.languageCode == 'vi';

    String roomText;
    if (isVietnamese) {
      roomText = '${widget.lichPhongTrong.soLuongPhong} phòng';
    } else {
      roomText = '${widget.lichPhongTrong.soLuongPhong} '
          'room${widget.lichPhongTrong.soLuongPhong > 1 ? 's' : ''}';
    }
    return roomText;
  }

  Widget _buildBookingDetailsCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            _buildDetailRow(Icons.login, S
                .of(context)
                .checkInDate, DateTimeHelper.formatDate(checkInDate)),
            _buildDetailRow(Icons.access_time, S
                .of(context)
                .checkInTime, formattedCheckInTime),
            _buildDetailRow(Icons.logout, S
                .of(context)
                .checkOutDate, DateTimeHelper.formatDate(checkOutDate!)),
            _buildDetailRow(Icons.schedule, S
                .of(context)
                .checkOutTime, getDatetime()),
            Divider(height: 24),
            _buildDetailRow(
              _getBookingTypeIcon(),
              _getBookingTypeText(),
              '${widget.loaiPhong.giaLoaiPhong?.khoangThoiGian} ${widget
                  .loaiPhong.giaLoaiPhong?.donVi}',
              isHighlight: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPriceBreakdownCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.receipt, color: Colors.green),
                SizedBox(width: 8),
                Text(
                  S
                      .of(context)
                      .priceDetails,
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            SizedBox(height: 12),
            _buildPriceRow("${S
                .of(context)
                .roomPrice} (${_buildSummaryTextTotalRooms(context)})", CurrencyHelper.formatVND(
                widget.loaiPhong.giaLoaiPhong?.giaChoTatCaPhong  ?? 0.0)),
            _buildPriceRow(S
                .of(context)
                .totalDuration,
                '${widget.loaiPhong.giaLoaiPhong?.khoangThoiGian} ${widget
                    .loaiPhong.giaLoaiPhong?.donVi}'),
            _buildPriceRow(S
                .of(context)
                .subtotalBeforeDiscount, CurrencyHelper.formatVND(
                widget.loaiPhong.giaLoaiPhong!.giaChoTatCaPhong)),
            _buildPriceRow(S
                .of(context)
                .weekendSurcharge, CurrencyHelper.formatVND(
                widget.loaiPhong.giaLoaiPhong!.giaThueChoTatCaPhong)),
            _buildPriceRow("${S
                .of(context)
                .discount} (${widget.loaiPhong.giaLoaiPhong?.phanTichGia.phanTramGiamGia}%)", CurrencyHelper.formatVND(
                widget.loaiPhong.giaLoaiPhong!.phanTichGia.giamGiaTheoNgay)),
            Divider(height: 24),
            _buildPriceRow(
              S
                  .of(context)
                  .totalAmount,
              CurrencyHelper.formatVND(widget.loaiPhong.giaLoaiPhong!.giaCuoiCung ),
              isTotal: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomPaymentSection() {
    return Positioned(
      left: 0,
      right: 0,
      bottom: 0,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          boxShadow: [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 10,
              offset: Offset(0, -2),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Icon(Icons.payment, color: Colors.orange),
                SizedBox(width: 8),
                Text(
                  S
                      .of(context)
                      .paymentMethod,
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _buildPaymentMethodSelector(),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: (_isProcessingPayment || _isWaitingForPaymentResult)
                    ? null
                    : eventPaymentBooking,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue.shade600,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 3,
                ),
                child: (_isProcessingPayment || _isWaitingForPaymentResult)
                    ? Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    ),
                    SizedBox(width: 12),
                    Text(_isWaitingForPaymentResult ? S
                        .of(context)
                        .waitingForResult : S
                        .of(context)
                        .processing
                        .toUpperCase()),
                  ],
                )
                    : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.lock, size: 20),
                    SizedBox(width: 8),
                    Text(
                      '${S
                          .of(context)
                          .payAmount} ${CurrencyHelper.formatVND(
                          widget.loaiPhong.giaCuoiCung)}',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ✅ Helper UI methods
  Widget _buildDetailRow(IconData icon, String label, String value,
      {bool isHighlight = false}) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: isHighlight ? Colors.blue : Colors.grey),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[700],
                fontWeight: isHighlight ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: isHighlight ? Colors.blue : Colors.black,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPriceRow(String label, String value, {bool isTotal = false}) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isTotal ? 16 : 14,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              color: isTotal ? Colors.black : Colors.grey[700],
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: isTotal ? 18 : 14,
              fontWeight: FontWeight.bold,
              color: isTotal ? Colors.green.shade700 : Colors.black,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentMethodSelector() {
    final selectedMethod = getPaymentMethods(context).firstWhere(
          (method) => method['id'] == selectedPaymentMethod,
      orElse: () => getPaymentMethods(context).first,
    );

    return GestureDetector(
      onTap: _showPaymentMethodDialog,
      child: Container(
        padding: EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(12),
          color: Colors.grey.shade50,
        ),
        child: Row(
          children: [
            selectedMethod['image'] != null
                ? Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(6),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: Image.asset(
                  selectedMethod['image'],
                  width: 36,
                  height: 36,
                  fit: BoxFit.contain,
                ),
              ),
            )
                : Container(
              padding: EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: selectedMethod['color'],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                selectedMethod['icon'],
                color: Colors.white,
                size: 20,
              ),
            ),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    selectedMethod['name'],
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                  Text(
                    selectedMethod['description'],
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
            Icon(Icons.keyboard_arrow_down, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  Future<void> _showPaymentMethodDialog() async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) =>
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            padding: EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                SizedBox(height: 20),
                Text(
                  S
                      .of(context)
                      .selectPaymentMethod,
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 20),
                ...(getPaymentMethods(context).map((method) =>
                    Container(
                      margin: EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: method['image'] != null
                            ? Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.asset(
                              method['image'],
                              width: 40,
                              height: 40,
                              fit: BoxFit.contain,
                            ),
                          ),
                        )
                            : Container(
                          padding: EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: method['color'],
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            method['icon'],
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                        title: Text(method['name']),
                        subtitle: Text(method['description']),
                        trailing: selectedPaymentMethod == method['id']
                            ? Icon(Icons.check_circle, color: Colors.green)
                            : null,
                        onTap: () {
                          setState(() {
                            selectedPaymentMethod =
                            method['id'] as PhuongThucThanhToan;
                          });
                          Navigator.pop(context);
                        },
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        tileColor: selectedPaymentMethod == method['id']
                            ? Colors.green.shade50
                            : Colors.grey.shade50,
                      ),
                    )).toList()),
                SizedBox(height: 20),
              ],
            ),
          ),
    );
  }

  Widget _buildFallbackContainer() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.blue.shade200, Colors.blue.shade400],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.hotel, size: 32, color: Colors.white),
          SizedBox(height: 4),
          Text(
            'Room',
            style: TextStyle(color: Colors.white, fontSize: 12),
          ),
        ],
      ),
    );
  }

  String _getBookingTypeText() {
    switch (widget.lichPhongTrong.loaiDatPhong) {
      case 'theo_gio':
        return S
            .of(context)
            .rentalTime;
      case 'qua_dem':
        return S
            .of(context)
            .numberOfNights;
      case 'dai_ngay':
        return S
            .of(context)
            .numberOfDays;
      default:
        return S
            .of(context)
            .duration;
    }
  }
}
// ✅ ADD THIS WIDGET INSIDE PaymentScreen class

class _PaymentStatusListener extends StatefulWidget {
  final String orderId;
  final Function(bool success, String? transactionId) onResult;

  const _PaymentStatusListener({
    required this.orderId,
    required this.onResult,
  });

  @override
  State<_PaymentStatusListener> createState() => _PaymentStatusListenerState();
}

class _PaymentStatusListenerState extends State<_PaymentStatusListener>
    with WidgetsBindingObserver {

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
      // App resumed from payment app - check status
      print('📱 App resumed, checking payment status...');
      context.read<PaymentBloc>().add(PaymentStatusChecked(widget.orderId));
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<PaymentBloc, PaymentState>(
      listener: (context, state) {
        if (state is NativePaymentSuccess) {
          widget.onResult(true, state.transactionId);
        } else if (state is NativePaymentFailure) {
          widget.onResult(false, null);
        }
      },
      child: Container(), // Invisible widget
    );
  }
}