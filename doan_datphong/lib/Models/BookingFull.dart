import '../Data/Provider/IP_v4_Address.dart';

class BookingWithHotel {
  final String id;
  final String hotelName;
  final String hotelAddress;
  final String roomType;
  final String? image;
  final String checkInDate;
  final String checkOutDate;
  final String checkInTime;
  final String checkOutTime;
  final double totalAmount;
  final int roomQuantity;
  final String paymentMethod;
  final String paymentStatus;
  final String status;
  final String originalStatus;
  final String bookingType;
  final String note;
  final String phoneNumber;
  final List<dynamic> assignedRooms;
  final Map<String, dynamic> priceDetails;

  BookingWithHotel({
    required this.id,
    required this.hotelName,
    required this.hotelAddress,
    required this.roomType,
    this.image,
    required this.checkInDate,
    required this.checkOutDate,
    required this.checkInTime,
    required this.checkOutTime,
    required this.totalAmount,
    required this.roomQuantity,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.status,
    required this.originalStatus,
    required this.bookingType,
    required this.note,
    required this.phoneNumber,
    required this.assignedRooms,
    required this.priceDetails,
  });

  factory BookingWithHotel.fromJson(Map<String, dynamic> json) {
    final String baseImageUrl = IPv4.IP_CURRENT;
    return BookingWithHotel(
      id: json['id']?.toString() ?? '',
      hotelName: json['hotelName']?.toString() ?? 'Unknown Hotel',
      hotelAddress: json['hotelAddress']?.toString() ?? 'Unknown Address',
      roomType: json['roomType']?.toString() ?? 'Unknown Room Type',
      image: baseImageUrl + (json['image'] ?? ''),
      checkInDate: json['checkInDate']?.toString() ?? '',
      checkOutDate: json['checkOutDate']?.toString() ?? '',
      checkInTime: json['checkInTime']?.toString() ?? '14:00',
      checkOutTime: json['checkOutTime']?.toString() ?? '12:00',
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0.0,
      roomQuantity: json['roomQuantity'] as int? ?? 1,
      paymentMethod: json['paymentMethod']?.toString() ?? 'tien_mat',
      paymentStatus: json['paymentStatus']?.toString() ?? 'chua_thanh_toan',
      status: json['status']?.toString() ?? 'ongoing',
      originalStatus: json['originalStatus']?.toString() ?? 'dang_cho',
      bookingType: json['bookingType']?.toString() ?? 'qua_dem',
      note: json['note']?.toString() ?? '',
      phoneNumber: json['phoneNumber']?.toString() ?? '',
      assignedRooms: json['assignedRooms'] as List<dynamic>? ?? [],
      priceDetails: json['priceDetails'] as Map<String, dynamic>? ?? {},
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'hotelName': hotelName,
      'hotelAddress': hotelAddress,
      'roomType': roomType,
      'image': image,
      'checkInDate': checkInDate,
      'checkOutDate': checkOutDate,
      'checkInTime': checkInTime,
      'checkOutTime': checkOutTime,
      'totalAmount': totalAmount,
      'roomQuantity': roomQuantity,
      'paymentMethod': paymentMethod,
      'paymentStatus': paymentStatus,
      'status': status,
      'originalStatus': originalStatus,
      'bookingType': bookingType,
      'note': note,
      'phoneNumber': phoneNumber,
      'assignedRooms': assignedRooms,
      'priceDetails': priceDetails,
    };
  }
}

// Model cho BookingDetail từ API response
class BookingDetail {
  final String id;
  final Map<String, dynamic> hotel;
  final Map<String, dynamic> room;
  final Map<String, dynamic> guest;
  final Map<String, dynamic> booking;
  final Map<String, dynamic> payment;
  final Map<String, dynamic> pricing;
  final List<dynamic> assignedRooms;

  BookingDetail({
    required this.id,
    required this.hotel,
    required this.room,
    required this.guest,
    required this.booking,
    required this.payment,
    required this.pricing,
    required this.assignedRooms,
  });

  factory BookingDetail.fromJson(Map<String, dynamic> json) {
    return BookingDetail(
      id: json['id']?.toString() ?? '',
      hotel: json['hotel'] as Map<String, dynamic>? ?? {},
      room: json['room'] as Map<String, dynamic>? ?? {},
      guest: json['guest'] as Map<String, dynamic>? ?? {},
      booking: json['booking'] as Map<String, dynamic>? ?? {},
      payment: json['payment'] as Map<String, dynamic>? ?? {},
      pricing: json['pricing'] as Map<String, dynamic>? ?? {},
      assignedRooms: json['assignedRooms'] as List<dynamic>? ?? [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'hotel': hotel,
      'room': room,
      'guest': guest,
      'booking': booking,
      'payment': payment,
      'pricing': pricing,
      'assignedRooms': assignedRooms,
    };
  }
}