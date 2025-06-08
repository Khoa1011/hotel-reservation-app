class RoomType {
  final String id;
  final String roomType;
  final double price;

  RoomType({
    required this.id,
    required this.roomType,
    required this.price
  });

  factory RoomType.fromJson(Map<String, dynamic> json) {
    return RoomType(
      id: json["_id"]?.toString() ?? '',
      roomType: json["roomType"]?.toString() ?? '',
      price: json["price"],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      "_id": id,
      "roomType": roomType,
      "price" : price,
    };
  }
}
