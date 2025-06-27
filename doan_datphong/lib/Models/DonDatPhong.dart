enum TrangThai {pending, confirmed, canceled}
enum PhuongThucThanhToan {CreditCard,VNPay,Momo}
class DonDatPhong{
  String booking_Id;
  String? booking_RoomId;
  String? booking_HotelId;
  String? booking_UserId;
  String booking_CheckInDate;
  String booking_CheckOutDate;
  String booking_CheckInTime;
  String booking_CheckOutTime;
  double booking_totalAmount;
  TrangThai booking_Status;
  PhuongThucThanhToan booking_PaymentMethod;

  DonDatPhong({required this.booking_Id,
    required this.booking_RoomId,
    required this.booking_HotelId,
    required this.booking_UserId,
    required this.booking_CheckInDate,
    required this.booking_CheckOutDate,
    required this.booking_CheckInTime,
    required this.booking_CheckOutTime,
    required this.booking_totalAmount,
    this.booking_Status = TrangThai.pending,
    this.booking_PaymentMethod = PhuongThucThanhToan.VNPay});

  DonDatPhong.short({
    required this.booking_RoomId,
    required this.booking_HotelId,
    required this.booking_UserId,
    required this.booking_CheckInDate,
    required this.booking_CheckOutDate,
    required this.booking_CheckInTime,
    required this.booking_CheckOutTime,
    required this.booking_totalAmount,
    this.booking_Status = TrangThai.confirmed,
    this.booking_PaymentMethod = PhuongThucThanhToan.CreditCard
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
  static TrangThai parseStatus(String status) {
    return TrangThai.values.firstWhere(
          (e) =>
      e
          .toString()
          .split('.')
          .last == status,
      orElse: () => TrangThai.confirmed,
    );
  }

  // Chuyển enum thành chuỗi để lưu vào database
  String getPaymentMethodString() {
    return booking_PaymentMethod.toString().split('.').last;
  }

  // Chuyển từ chuỗi thành enum khi lấy từ database
  static PhuongThucThanhToan parsePaymentMethod(String method) {
    return PhuongThucThanhToan.values.firstWhere(
          (e) => e.toString().split('.').last == method,
      orElse: () => PhuongThucThanhToan.VNPay, // Mặc định VNPay nếu lỗi
    );
  }

  factory DonDatPhong.fromJson(Map<String,dynamic>json){
    return DonDatPhong(
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