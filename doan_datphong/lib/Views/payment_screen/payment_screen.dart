import 'package:doan_datphong/Blocs/payment_Blocs/payment_bloc.dart';
import 'package:doan_datphong/Blocs/payment_Blocs/payment_event.dart';
import 'package:doan_datphong/Blocs/payment_Blocs/payment_state.dart';
import 'package:doan_datphong/Models/Bookings.dart';
import 'package:doan_datphong/Models/Room.dart';
import 'package:doan_datphong/Views/home_View/home_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PaymentScreen extends StatefulWidget {
  final Room room;
  const PaymentScreen({super.key, required this.room});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  bool _isProcessingPayment = false;
  bool _paymentSuccess = false;
  Booking_PaymentMethod selectedPaymentMethod = Booking_PaymentMethod.VNPay;
  double totalAmount = 0.0;

  final _priceFormat = NumberFormat.currency(locale: 'en_US', symbol: '\$');
  final _taxRate = 0.10;
  DateTime? checkInDate = DateTime.now(), checkOutDate = DateTime.now();
  TimeOfDay? checkInTime, checkOutTime= TimeOfDay(hour: 12,minute: 00);

  // Định dạng thời gian thành HH:mm
  late String formattedCheckInTime;
  late String formattedCheckOutTime ;

  // Thêm danh sách phương thức thanh toán
  final List<Map<String, dynamic>> _paymentMethods = [
    {'id': Booking_PaymentMethod.CreditCard, 'name': 'Credit Card', 'icon': Image.asset("assets/icons/master_card.png")},
    {'id': Booking_PaymentMethod.Momo, 'name': 'Momo', 'icon': Image.asset("assets/icons/logo_momo2.jpg")},
    {'id': Booking_PaymentMethod.VNPay, 'name': 'VNPay', 'icon': Image.asset("assets/icons/Icon-VNPAY-QR.jpg")},
  ];

  double get _basePrice => widget.room.price;
  double get _taxAmount => _basePrice * _taxRate;
  double get _totalPrice => _basePrice + _taxAmount;
  String address = '';

  Future<void> getValueDataTime() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    setState(() {
      checkInDate = DateTime.parse(prefs.getString("checkInDate") ?? DateTime.now().toString());
      checkOutDate = DateTime.parse(prefs.getString("checkOutDate") ?? DateTime.now().toString());

      // Lấy giờ check-in và check-out từ SharedPreferences, nếu có
      String? checkInTimeString = prefs.getString("checkInTime");
      String? checkOutTimeString = prefs.getString("checkOutTime");

      // Chuyển đổi chuỗi giờ thành đối tượng TimeOfDay
      if (checkInTimeString != null) {
        final parts = checkInTimeString.split(":");
        checkInTime = TimeOfDay(
          hour: int.parse(parts[0]),
          minute: int.parse(parts[1]),
        );
      }
      checkOutTime = TimeOfDay(
        hour: 12,
        minute: 00,
      );
    });
  }

  //Thanh toán đơn đặt phòng
  void eventPaymentBooking()async{
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String? userID = prefs.getString("user_id");
    String? hotelID =prefs.getString("hotel_id");
    String? roomID = widget.room.id;
    Booking booking = Booking.short(
        booking_RoomId: roomID,
        booking_HotelId: hotelID,
        booking_UserId: userID,
        booking_CheckInDate: DateFormat('dd/MM/yyyy').format(checkInDate!).toString(),
        booking_CheckOutDate: DateFormat('dd/MM/yyyy').format(checkOutDate!).toString(),
        booking_CheckInTime: formattedCheckInTime,
        booking_CheckOutTime: formattedCheckOutTime,
        booking_totalAmount: totalAmount,
        booking_Status: BookingStatus.confirmed,
        booking_PaymentMethod: selectedPaymentMethod,
    );
    print("$booking");
    context.read<PaymentBloc>().add(
      PaymentSubmitted(booking)
    );

  }

  @override
  void initState() {
    super.initState();
    getValueSharedPre();
    getValueDataTime();
  }

  Future<void> getValueSharedPre() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    setState(() {
      address = prefs.getString("hotel_address")!;
    });
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'en_US', symbol: '\$');
    return BlocListener<PaymentBloc,PaymentState>(
      listener: (context,state){
        if(state is PaymentSuccess){
          showDialog(
              context: context,
              builder: (context)=> AlertDialog(
                title: Text("Successful",style:
                  TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 20,
                      color: Color(0xFF14D9E1)
                  ),),
                content: Text("Successful booking!",
                style: TextStyle(
                  fontStyle: FontStyle.italic,
                  fontSize: 15,
                ),),
                actions: [
                  TextButton(
                      onPressed: () {
                        Navigator.pop(context); // Đóng dialog
                        Navigator.popUntil(context, ModalRoute.withName('/'));
                      }, child: Text("Ok"))
                ],
              ));

        }else if (state is PaymentFailure){
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.errorMessage)),
          );
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text(
            'Payment',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          centerTitle: true,
          elevation: 0,
        ),
        body: Stack(
          children: [
            Padding(
                padding: const EdgeInsets.only(bottom:180),
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Hotel Info Card (giữ nguyên)
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeInOut,
                      padding: EdgeInsets.all(16),
                      margin: const EdgeInsets.only(bottom: 24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.grey.withOpacity(0.2),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Room image on left
                          Hero(
                            tag: 'room-${widget.room.id}',
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(
                                widget.room.image,
                                width: 100,
                                height: 90,
                                fit: BoxFit.cover,
                                loadingBuilder: (context, child, loadingProgress) {
                                  if (loadingProgress == null) return child;
                                  return Container(
                                    width: 100,
                                    height: 100,
                                    color: Colors.grey.shade200,
                                    child: Center(
                                      child: CircularProgressIndicator(
                                        value:
                                        loadingProgress.expectedTotalBytes != null
                                            ? loadingProgress
                                            .cumulativeBytesLoaded /
                                            loadingProgress.expectedTotalBytes!
                                            : null,
                                      ),
                                    ),
                                  );
                                },
                                errorBuilder: (context, error, stackTrace) {
                                  return Container(
                                    width: 100,
                                    height: 100,
                                    color: Colors.grey.shade200,
                                    child: const Icon(Icons.hotel, size: 40),
                                  );
                                },
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),

                          // Room information
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  widget.room.roomType,
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  address,
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.grey.shade600,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const SizedBox(width: 4),
                                    Text(
                                      currencyFormat.format(widget.room.price),
                                      style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: Colors.cyanAccent.shade400,
                                          fontSize: 20
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Rest of payment form
                    const Divider(thickness: 1),
                    const SizedBox(height: 16),

                    const Text(
                      'Booking Details',
                      style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 16),

                    // Payment information table (thêm giờ check-in/out)
                    _buildPaymentDetailsTable(),
                    const SizedBox(height: 24),

                    // Thêm phần chọn phương thức thanh toán
                  ],
                ),
              ),
            ),
            // PHẦN GHIM DƯỚI CÙNG MÀN HÌNH
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                decoration: BoxDecoration(
                  color: Colors.white,
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
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Payment Method',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    _buildPaymentMethod(),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: eventPaymentBooking,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Theme.of(context).primaryColor,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: _isProcessingPayment
                            ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                            : const Text(
                          'CONFIRM PAYMENT',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
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

  Widget _buildPaymentDetailsTable() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Table(
          columnWidths: const {0: FlexColumnWidth(2), 1: FlexColumnWidth(3)},
          children: [
            _buildTableRow(
              'Check-in Date',
              DateFormat('dd/MM/yyyy').format(checkInDate!),
            ),
            _buildTableRow(
              'Check-in Time',
              formattedCheckInTime ='${checkInTime?.hour.toString().padLeft(2, '0')}:${checkInTime?.minute.toString().padLeft(2, '0')}',
            ),
            _buildTableRow(
              'Check-out Date',
              DateFormat('dd/MM/yyyy').format(checkOutDate!),
            ),
            _buildTableRow(
              'Check-out Time',
              formattedCheckOutTime = '${checkOutTime?.hour.toString().padLeft(2, '0')}:${checkOutTime?.minute.toString().padLeft(2, '0')}',
            ),
            _buildTableRow(
              'Nights',
              '${checkOutDate?.difference(checkInDate!).inDays} nights',
            ),
          ],
        ),

        const SizedBox(height: 8),
        const Divider(thickness: 1), // 🔸 Gạch sau Nights
        const SizedBox(height: 8),

        Table(
          columnWidths: const {0: FlexColumnWidth(2), 1: FlexColumnWidth(3)},
          children: [
            _buildTableRow('Room Price', _priceFormat.format(_basePrice)),
            _buildTableRow('Tax & Fees (10%)', _priceFormat.format(_taxAmount)),
          ],
        ),

        const SizedBox(height: 8),
        const Divider(thickness: 1), // 🔸 Gạch sau Tax & Fees
        const SizedBox(height: 8),

        Table(
          columnWidths: const {0: FlexColumnWidth(2), 1: FlexColumnWidth(3)},
          children: [
            _buildTableRow(
              'Total',
              _priceFormat.format(
                totalAmount = _totalPrice * checkOutDate!.difference(checkInDate!).inDays,
              ),
              isBold: true,
              isTotal: true,
            ),
          ],
        ),
      ],
    );
  }


  // Hàm hiển thị dialog chọn phương thức thanh toán
  Future<void> _showPaymentMethodDialog() async {
    await showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: '',
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (context, anim1, anim2) {
        return ScaleTransition(
          scale: CurvedAnimation(parent: anim1, curve: Curves.easeOut),
          child: AlertDialog(
            titlePadding: const EdgeInsets.fromLTRB(24, 20, 24, 4),
            title: Text(
              'Select Payment Method',
              style: TextStyle(fontWeight: FontWeight.bold,
              fontSize: 20),
            ),
            content: SizedBox(
              width: double.maxFinite,
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: _paymentMethods.length,
                itemBuilder: (context, index) {
                  final method = _paymentMethods[index];
                  return ListTile(
                    leading: _buildPaymentMethodIcon(method['id']),
                    title: Text(method['name']),
                    onTap: () {
                      setState(() {
                        selectedPaymentMethod = method['id'] as Booking_PaymentMethod;
                      });
                      Navigator.pop(context);
                    },
                  );
                },
              ),
            ),
          ),
        );
      },
      transitionBuilder: (context, anim1, anim2, child) {
        return ScaleTransition(
          scale: CurvedAnimation(parent: anim1, curve: Curves.fastOutSlowIn),
          child: child,
        );
      },
    );
  }


// Widget hiển thị icon phương thức thanh toán
  Widget _buildPaymentMethodIcon(Booking_PaymentMethod methodId) {
    switch (methodId) {
      case Booking_PaymentMethod.CreditCard:
        return Image.asset(
          "assets/icons/master_card.png",
          width: 50,
          height: 50,
          errorBuilder: (context, error, stackTrace) => Icon(Icons.credit_card),
        );
      case Booking_PaymentMethod.Momo:
        return Image.asset(
          "assets/icons/logo_momo2.jpg",
          width: 50,
          height: 50,
          errorBuilder: (context, error, stackTrace) => Icon(Icons.payment),
        );
      case Booking_PaymentMethod.VNPay:
        return Image.asset(
          "assets/icons/Icon-VNPAY-QR.jpg",
          width: 50,
          height: 50,
          errorBuilder: (context, error, stackTrace) => Icon(Icons.account_balance_wallet),
        );
      default:
        return Icon(Icons.payment);
    }
  }

  Widget _buildPaymentMethod() {
    final selectedMethod = _paymentMethods.firstWhere(
          (method) => method['id'] == selectedPaymentMethod,
      orElse: () => {'id': 'unknown', 'name': 'Unknown', 'icon': 'credit_card'},
    );

    return Card(
      color: Color(0xFFB4B4B4),
      margin: const EdgeInsets.only(bottom: 4),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 2.0),
        child: ListTile(
          leading: _buildPaymentMethodIcon(selectedMethod['id']),
          title: Text(selectedMethod['name']),
          trailing: const Icon(Icons.arrow_drop_down),
          onTap: _showPaymentMethodDialog,
        ),
      ),
    );
  }



  TableRow _buildTableRow(String label, String value, {bool isBold = false, bool isTotal = false}) {
    return TableRow(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Text(
            label,
            style: TextStyle(
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              fontSize: isTotal ? 16 : 14,
              color: isTotal ? Colors.black : Colors.grey[800],
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: isTotal ? 18 : 14,
              color: isTotal ? Colors.teal.shade700 : Colors.black,
            ),
          ),
        ),
      ],
    );
  }

}