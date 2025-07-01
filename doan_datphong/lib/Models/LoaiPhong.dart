class RoomType {
  final String id;
  final String tenLoaiPhong;
  final double giaCa;
  final String moTa;
  final int soLuongKhach;
  final 

  RoomType({
    required this.id,
    required this.tenLoaiPhong,
    required this.giaCa
  });

  factory RoomType.fromJson(Map<String, dynamic> json) {
    return RoomType(
      id: json["_id"]?.toString() ?? '',
      tenLoaiPhong: json["roomType"]?.toString() ?? '',
      giaCa: json["price"],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      "_id": id,
      "roomType": tenLoaiPhong,
      "price" : giaCa,
    };
  }
}
