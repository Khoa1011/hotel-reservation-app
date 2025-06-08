import 'package:doan_datphong/Data/Provider/IP_v4_Address.dart';

class Hotels {
  String id;
  String hotelName;
  String address;
  String image;
  String city;
  String description;
  int star;
  String phoneNumber;
  String email;
  int price;

  Hotels({
    required this.id,
    required this.hotelName,
    required this.address,
    required this.image,
    required this.city,
    required this.description,
    required this.star,
    required this.phoneNumber,
    required this.email,
    required this.price,
  });

  // Chuyển từ JSON sang object
  factory Hotels.fromJson(Map<String, dynamic> json) {
    final String baseImageUrl = IPv4.IP_CURRENT;
    return Hotels(
      id: json['_id'] ?? '',
      hotelName: json['hotelName'] ?? '',
      address: json['address'] ?? '',
      image: baseImageUrl + json['image']??'',
      city: json['city'] ?? '',
      description: json['description'] ?? '',
      star: json['star'] ?? 0,
      phoneNumber: json['phoneNumber'] ?? '',
      email: json['email'] ?? '',
      price: json['price'] ?? 0,
    );
  }

  // Chuyển object thành JSON (nếu cần gửi dữ liệu lên server)
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'hotelName': hotelName,
      'address': address,
      'image': image,
      'city': city,
      'description': description,
      'star': star,
      'phoneNumber': phoneNumber,
      'email': email,
      'price':price,
    };
  }
}
