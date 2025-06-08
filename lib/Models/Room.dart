import 'package:doan_datphong/Data/Provider/IP_v4_Address.dart';

class Room {
  final String id;
  final String roomTypeId;

  final double price;
  final String image;
  final bool roomState;
  final String description;
  final int bedCount;
  final int capacity;
  final List<String> amenities;
  final int totalRooms;
  final int availableRooms;


  Room({
    required this.id,
    required this.roomTypeId,

    required this.price,
    required this.image,
    required this.roomState,
    required this.description,
    required this.bedCount,
    required this.capacity,
    required this.amenities,
    required this.totalRooms,
    required this.availableRooms,
  });

  factory Room.fromJson(Map<String, dynamic> json) {
    try {
      final String baseImageUrl = IPv4.IP_CURRENT;

      return Room(
        id: json["roomId"] as String? ?? '',
        roomTypeId: json["roomTypeId"] as String? ?? '',
        price: (json["price"] as num?)?.toDouble() ?? 0.0,
        image: baseImageUrl + json['image']??'',
        roomState: json["roomState"] as bool? ?? false,
        description: json["description"] as String? ?? '',
        bedCount: json["bedCount"] as int? ?? 1,
        capacity: json["capacity"] as int? ?? 2,
        amenities: (json["amenities"] as List<dynamic>?)
            ?.map((a) => a.toString())
            .toList() ??
            [],
        totalRooms: json["totalRooms"] as int? ?? 0,
        availableRooms: json["availableRooms"]as int? ?? 0,
      );
    } catch (e) {
      print('Error parsing Room JSON: $e\nJSON: $json');
      throw Exception('Failed to parse Room data: $e');
    }
  }

  Map<String, dynamic> toJson() {
    final String baseImageUrl = IPv4.IP_CURRENT;
    return {
      "_id": id,
      "roomTypeId": roomTypeId,
      "price": price,
      "image": image.replaceAll(baseImageUrl, ""),
      "roomState": roomState,
      "description": description,
      "bedCount": bedCount,
      "capacity": capacity,
      "amenities": amenities,
      "totalRooms": totalRooms,
      "availableRooms": availableRooms,
    };
  }

  String get roomType {
    // Add your room type mapping logic here
    return "Standard Room";
  }

  bool get isAvailable => !roomState;
}