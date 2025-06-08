enum BookingStatus {pending, confirmed, canceled}
enum Booking_PaymentMethod {CreditCard,VNPay,Momo}
class Booking{
  String booking_Id;
  String? booking_RoomId;
  String? booking_HotelId;
  String? booking_UserId;
  String booking_CheckInDate;
  String booking_CheckOutDate;
  String booking_CheckInTime;
  String booking_CheckOutTime;
  double booking_totalAmount;
  BookingStatus booking_Status;
  Booking_PaymentMethod booking_PaymentMethod;

  Booking({required this.booking_Id,
    required this.booking_RoomId,
    required this.booking_HotelId,
    required this.booking_UserId,
    required this.booking_CheckInDate,
    required this.booking_CheckOutDate,
    required this.booking_CheckInTime,
    required this.booking_CheckOutTime,
    required this.booking_totalAmount,
    this.booking_Status = BookingStatus.pending,
    this.booking_PaymentMethod = Booking_PaymentMethod.VNPay});

  Booking.short({
    required this.booking_RoomId,
    required this.booking_HotelId,
    required this.booking_UserId,
    required this.booking_CheckInDate,
    required this.booking_CheckOutDate,
    required this.booking_CheckInTime,
    required this.booking_CheckOutTime,
    required this.booking_totalAmount,
    this.booking_Status = BookingStatus.confirmed,
    this.booking_PaymentMethod = Booking_PaymentMethod.CreditCard
}): booking_Id ='';


//   User.short({
//   required this.id,
//   required this.userName,
//   required this.gender,
//   required this.phoneNumber,
//   required this.Dob,
//   required this.avatar,
// })  : email = '',
// password = '',
// role = 'user',
// createAt = DateTime.now();

  String getStatusString(){
    return booking_Status.toString().split('.').last;
  }
  static BookingStatus parseStatus(String status) {
    return BookingStatus.values.firstWhere(
          (e) =>
      e
          .toString()
          .split('.')
          .last == status,
      orElse: () => BookingStatus.confirmed,
    );
  }

  // Chuyển enum thành chuỗi để lưu vào database
  String getPaymentMethodString() {
    return booking_PaymentMethod.toString().split('.').last;
  }

  // Chuyển từ chuỗi thành enum khi lấy từ database
  static Booking_PaymentMethod parsePaymentMethod(String method) {
    return Booking_PaymentMethod.values.firstWhere(
          (e) => e.toString().split('.').last == method,
      orElse: () => Booking_PaymentMethod.VNPay, // Mặc định VNPay nếu lỗi
    );
  }

  factory Booking.fromJson(Map<String,dynamic>json){
    return Booking(
        booking_Id: json["_id"]??'',
        booking_RoomId: json["roomId"],
        booking_HotelId: json["hotelsId"],
        booking_UserId: json["userId"],
        booking_CheckInDate: json["checkInDate"],
        booking_CheckOutDate: json["checkOutDate"],
        booking_CheckInTime: json["checkInTime"],
        booking_CheckOutTime: json["checkOutTime"],
      booking_totalAmount: (json['totalAmount'] as num).toDouble(),
      booking_Status: parseStatus(json["status"]),
      booking_PaymentMethod: parsePaymentMethod(json["paymentMethod"]),
    );
  }
  Map<String,dynamic> toMap(){
    return {
      "roomId":booking_RoomId,
      "hotelsId":booking_HotelId,
      "userId":booking_UserId,
      "checkInDate":booking_CheckInDate,
      "checkOutDate":booking_CheckOutDate,
      "checkInTime":booking_CheckInTime,
      "checkOutTime":booking_CheckOutTime,
      "totalAmount":booking_totalAmount,
      "status": getStatusString(),
      "paymentMethod": getPaymentMethodString(),

    };
  }

}