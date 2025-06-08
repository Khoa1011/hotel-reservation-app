import '../Data/Provider/IP_v4_Address.dart';

class BookingWithHotel {
  final String id;
  final String hotelName;
  final String hotelAddress;
  final String roomType;
  final String checkInDate;
  final String checkOutDate;
  final String checkInTime;
  final String checkOutTime;
  final String paymentMethod;
  final String status;
  final int totalAmount;
  final String? image;

  BookingWithHotel({
    required this.id,
    required this.hotelName,
    required this.hotelAddress,
    required this.roomType,
    required this.checkInDate,
    required this.checkOutDate,
    required this.checkInTime,
    required this.checkOutTime,
    required this.paymentMethod,
    required this.status,
    required this.totalAmount,
    required this.image,
  });

  factory BookingWithHotel.fromJson(Map<String, dynamic> json) {
    final String baseImageUrl = IPv4.IP_CURRENT;
    return BookingWithHotel(
      id: json['id'] as String? ?? '',
      hotelName: json['hotelName'] as String? ?? '',
      hotelAddress: json['hotelAddress'] as String? ?? '',
      roomType: json['roomType'] as String? ?? '',
      checkInDate: json['checkInDate'] as String? ?? '',
      checkOutDate: json['checkOutDate'] as String? ?? '',
      checkInTime: json['checkInTime']as String? ?? '',
        checkOutTime: json['checkOutTime']as String? ?? '',
      paymentMethod: json['paymentMethod']as String? ?? '',
      status: json['status']as String? ?? '',
      totalAmount: json['totalAmount'],
      image: baseImageUrl+ json['image'] as  String ? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'hotelName': hotelName,
      'hotelAddress': hotelAddress,
      'roomType': roomType,
      'checkInDate': checkInDate,
      'checkOutDate': checkOutDate,
      'checkInTime': checkInTime,
      'checkOutTime': checkOutTime,
      'paymentMethod': paymentMethod,
      'status': status,
      'totalAmount': totalAmount,
      'image': image,
    };
  }
}
