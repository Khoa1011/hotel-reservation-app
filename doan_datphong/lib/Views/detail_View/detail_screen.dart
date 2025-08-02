import 'package:doan_datphong/Models/KhachSan.dart';
import 'package:doan_datphong/Models/LichPhongTrong.dart';
import 'package:doan_datphong/Views/components/NotificationDialog.dart';
import 'package:doan_datphong/Views/detail_View/widgets/hotelMap_screen.dart';
import 'package:doan_datphong/Views/detail_View/widgets/reviews_section.dart';
import 'package:doan_datphong/Views/listRoom_View/listRoom_screen.dart';
import 'package:doan_datphong/Views/selectDate_View/selectDate_screen.dart';
import 'package:doan_datphong/generated/l10n.dart';
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../Data/Repository/getListOfRoomTypes_Repository/getListOfRoom_repo.dart';
import '../../Helper/FormatCurrency.dart';
import '../../Models/Khach.dart';
import 'widgets/amenities_section.dart';

class DetailScreen extends StatefulWidget {
  final KhachSan hotel;
  final Map<String, dynamic>? result;


  const DetailScreen({Key? key, required this.hotel,
  this.result}) : super(key: key);

  @override
  _DetailState createState() => _DetailState();
}

class _DetailState extends State<DetailScreen> {



  String _selecteDateCheckInShowText = "";
  String _selecteDateCheckOutShowText = "";
  bool _isCheckingAvailability = false;

  //parametter post api
  String _bookingType = "";
  late String checkInDateRouter = "";
  late String checkOutDateRouter = "";
  late String checkInTimeRouter = "";
  late String checkOutTimeRouter = "";
  late Map<String,int> guest;
  late String rooms="";
  late LichPhongTrong lichPhongTrong;


  // Thêm vào class _DetailState
  bool get isNightTime {
    final now = DateTime.now();
    final hour = now.hour;
    return hour < 6 || hour >= 18;
  }

  @override
  void initState() {
    super.initState();
    _saveHotelId();

  }

  // ✅ Sử dụng didChangeDependencies
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    // ✅ Chỉ set một lần khi chưa có text
    if (_selecteDateCheckInShowText.isEmpty) {
      _selecteDateCheckInShowText = S.of(context).selectDatesAndTimeCheckIn;
    }

    if (widget.result != null) {
      _loadResultData(widget.result!);
    }
  }


  void _loadResultData(Map<String, dynamic> result) {
    setState(() {
      _selecteDateCheckInShowText = result["dateCheckIn"] as String? ?? '';
      _selecteDateCheckOutShowText = result["dateCheckOut"] as String? ?? '';
      checkInDateRouter = result["checkInDateRouter"] as String? ?? '';
      checkOutDateRouter = result["checkOutDateRouter"] as String? ?? '';

      if(result["bookingType"]=="theo_gio"){
        _bookingType = S.of(context).hourly;
      }else if(result["bookingType"]=="qua_dem"){
        _bookingType = S.of(context).overnight;
      }else{
        _bookingType = S.of(context).longDays;
      }

      _sendDataToListRoomType(result);
    });
  }



  Future<void> _saveHotelId() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setString("hotel_id", widget.hotel.id);
    await prefs.setString("hotel_address", widget.hotel.diaChi);
    print("Hotels ID saved: ${widget.hotel.id}");
  }

  Future<void> _sendDataToListRoomType(Map<String, dynamic> fechtData) async {
    final khach = Khach(
      soNguoiLon: int.tryParse(fechtData["adults"].toString()) ?? 0,
      soTreEm: int.tryParse(fechtData["children"].toString()) ?? 0,
    );

    lichPhongTrong = LichPhongTrong(
      loaiDatPhong: fechtData["bookingType"] ?? '',
      ngayNhanPhong: fechtData["checkInDateRouter"] ?? '',
      ngayTraPhong: fechtData["checkOutDateRouter"] ?? fechtData["checkInDateRouter"] ?? '',
      gioNhanPhong: fechtData["timeCheckInRouter"] ?? '',
      gioTraPhong: fechtData["timeCheckOutRouter"],
      soLuongKhach: khach,
      soLuongPhong: int.tryParse(fechtData["rooms"].toString()) ?? 1,
    );
    print("thong tin lich phong trong: ${lichPhongTrong.gioNhanPhong}:${lichPhongTrong.gioTraPhong}");
  }

  Future<void> _showSelectedDateTime() async {
    final selectedDateTimeToNextScreen = await Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => SelectDateScreen(selectedHotel: widget.hotel,)),
    );
    print("Thong tin dat phong $selectedDateTimeToNextScreen");
    if (selectedDateTimeToNextScreen != null &&
        selectedDateTimeToNextScreen is Map<String, dynamic>) {

      // ✅ SỬA: Dùng method _loadResultData thay vì setState trực tiếp
      _loadResultData(selectedDateTimeToNextScreen);
    }
  }

  // Future<void> _showSelectedDateTime() async {
  //   final selectedDateTimeToNextScreen = await Navigator.push(
  //     context,
  //     MaterialPageRoute(builder: (context) => SelectDateScreen(selectedHotel: widget.hotel,)),
  //   );
  //   print("Thong tin dat phong $selectedDateTimeToNextScreen");
  //   if (selectedDateTimeToNextScreen != null &&
  //       selectedDateTimeToNextScreen is Map<String, dynamic>) {
  //     setState(() {
  //       _selecteDateCheckInShowText =
  //           selectedDateTimeToNextScreen["dateCheckIn"] as String? ?? '';
  //       _selecteDateCheckOutShowText =
  //           selectedDateTimeToNextScreen["dateCheckOut"] as String? ?? '';
  //       checkInDateRouter =
  //           selectedDateTimeToNextScreen["checkInDateRouter"] as String? ?? '';
  //       checkOutDateRouter =
  //           selectedDateTimeToNextScreen["checkOutDateRouter"] as String? ?? '';
  //
  //       if(selectedDateTimeToNextScreen["bookingType"]=="theo_gio"){
  //         _bookingType =S.of(context).hourly;
  //
  //       }else if(selectedDateTimeToNextScreen["bookingType"]=="qua_dem"){
  //         _bookingType =S.of(context).overnight;
  //       }else{
  //         _bookingType =S.of(context).longDays;
  //       }
  //
  //       //
  //       _sendDataToListRoomType(selectedDateTimeToNextScreen);
  //       print(_sendDataToListRoomType(selectedDateTimeToNextScreen));
  //     });
  //   }
  // }


  // Future<bool> _validateRoomAvailability() async {
  //   setState(() {
  //     _isCheckingAvailability = true;
  //   });
  //
  //   try {
  //     // Gọi API check availability trước khi chuyển màn hình
  //     final repository = GetListOfRoomTypeRepository();
  //     final result = await repository.searchRoomTypes(
  //       hotelId: widget.hotel.id,
  //       bookingType: lichPhongTrong.loaiDatPhong,
  //       checkInDate: lichPhongTrong.ngayNhanPhong,
  //       checkOutDate: lichPhongTrong.ngayTraPhong,
  //       checkInTime: lichPhongTrong.gioNhanPhong,
  //       checkOutTime: lichPhongTrong.gioTraPhong,
  //       guests: {
  //         'adults': lichPhongTrong.soLuongKhach.soNguoiLon,
  //         'children': lichPhongTrong.soLuongKhach.soTreEm ?? 0,
  //       },
  //       rooms: lichPhongTrong.soLuongPhong,
  //     );
  //
  //     setState(() {
  //       _isCheckingAvailability = false;
  //     });
  //
  //     // Kiểm tra có phòng trống không
  //     if (result['roomTypes'] != null && result['roomTypes'].isNotEmpty) {
  //       return true;
  //     } else {
  //       // Hiển thị thông báo không có phòng
  //       NotificationDialog.showError(
  //         context,
  //         title: S.of(context).notRoomTypesAvailable,
  //         message: result['message'] ?? "S.of(context).noRoomsForSelectedDates",
  //       );
  //       return false;
  //     }
  //
  //   } catch (error) {
  //     setState(() {
  //       _isCheckingAvailability = false;
  //     });
  //
  //     // Hiển thị lỗi kết nối/server
  //     NotificationDialog.showError(
  //       context,
  //       title: S.of(context).error,
  //       message: S.of(context).errorConnectionTimeout,
  //     );
  //     return false;
  //   }
  // }



  void _showDescriptionDialog(BuildContext context, String fullDescription) {
    showDialog(
      context: context,
      builder:
          (context) => Dialog(
            backgroundColor: Colors.transparent,
            insetPadding: const EdgeInsets.all(20),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                ],
              ),

              //Mô tả chi tiết
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.blue[600],
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(16),
                        topRight: Radius.circular(16),
                      ),
                    ),

                    child: Text(
                      S.of(context).description,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: SingleChildScrollView(
                      child: Text(
                        fullDescription,
                        style: const TextStyle(
                          fontSize: 14,
                          height: 1.5,
                          color: Colors.grey,
                        ),
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      border: Border(top: BorderSide(color: Colors.grey[200]!)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.blue[600],
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 8,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          onPressed: () => Navigator.pop(context),
                          child: Text(
                            S.of(context).close,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1000,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back,
            color: Colors.black,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(
              Icons.favorite_border,
              size: 28,
              color: Color(0xFF525150),
            ),
            onPressed: () {
              // TODO: Thêm logic yêu thích
            },
          ),
          IconButton(
            icon: const Icon(
              Icons.bookmark_border_outlined,
              size: 28,
              color: Color(0xFF525150),
            ),
            onPressed: () {
              // TODO: Thêm logic bookmark
            },
          ),
        ],
      ),

      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              // ✅ HÌNH ẢNH HEADER: Không cần AppBar, chỉ là hình
              SliverToBoxAdapter(
                child: Hero(
                  tag: 'hotel-image-${widget.hotel.id}',
                  child: Container(
                    height: 270,
                    child: ClipRRect(
                      borderRadius: BorderRadius.only(
                        bottomLeft: Radius.circular(16),
                        bottomRight: Radius.circular(16),
                      ),
                      child: Image.network(
                        widget.hotel.hinhAnh,
                        height: 270,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            color: Colors.grey[300],
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.image_not_supported,
                                  size: 50,
                                  color: Colors.grey[500],
                                ),
                                SizedBox(height: 8),
                                Text(
                                  'Không thể tải hình ảnh',
                                  style: TextStyle(
                                    color: Colors.grey[600],
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                ),
              ),

              // ✅ NỘI DUNG CHÍNH
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.only(
                    left: 16,
                    right: 16,
                    bottom: 100,
                    top: 16,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ✅ TÊN KHÁCH SẠN
                      Text(
                        widget.hotel.tenKhachSan,
                        style: const TextStyle(
                          fontSize: 25,
                          fontWeight: FontWeight.bold,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                      const SizedBox(height: 8),

                      // ✅ ĐỊA CHỈ
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.location_on,
                            size: 20,
                            color: Color(0xFF525150),
                          ),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              widget.hotel.diaChi,
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: Color(0xFF525150)),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // ✅ RATING VÀ GIÁ
                      Row(
                        children: [
                          _buildRatingStars(widget.hotel.soSao),
                          const Spacer(),
                          Padding(
                            padding: const EdgeInsets.only(right: 8.0),
                            child: Text(
                              CurrencyHelper.formatVND(widget.hotel.giaCa),
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1565C0),
                              ),
                            ),
                          ),
                          Text(
                            "/ ${S.of(context).perNight}",
                            style: TextStyle(
                              color: Color(0xFF525150),
                              fontSize: 18,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // ✅ TIỆN ÍCH
                      AmenitiesSection(hotelId: widget.hotel.id),
                      const SizedBox(height: 24),

                      // ✅ MÔ TẢ
                      Text(
                        S.of(context).description,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      InkWell(
                        onTap: () => _showDescriptionDialog(
                          context,
                          widget.hotel.moTa,
                        ),
                        child: Text(
                          widget.hotel.moTa,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(height: 1.5, fontSize: 16),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // ✅ VỊ TRÍ
                      Text(
                        S.of(context).locationHotel,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      InkWell(
                        onTap: () {
                          // Navigate to map screen
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => HotelMapScreen(hotel: widget.hotel),
                            ),
                          );
                        },
                        child: Container(
                          height: 200,
                          decoration: BoxDecoration(
                            color: Colors.grey[200],
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.blue.withOpacity(0.3)),
                          ),
                          child: Stack(
                            children: [
                              Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.map,
                                      size: 50,
                                      color: Colors.blue,
                                    ),
                                    SizedBox(height: 8),
                                    Text(
                                      S.of(context).clickToViewMap,
                                      style: TextStyle(
                                        color: Colors.blue,
                                        fontSize: 16,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    SizedBox(height: 4),
                                    Text(
                                      widget.hotel.diaChi,
                                      style: TextStyle(
                                        color: Colors.grey[600],
                                        fontSize: 12,
                                      ),
                                      textAlign: TextAlign.center,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                              // Overlay để làm rõ là có thể click
                              Positioned(
                                top: 8,
                                right: 8,
                                child: Container(
                                  padding: EdgeInsets.all(4),
                                  decoration: BoxDecoration(
                                    color: Colors.blue,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Icon(
                                    Icons.open_in_new,
                                    color: Colors.white,
                                    size: 16,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      // ✅ ĐÁNH GIÁ
                      ReviewsSection(hotelId: widget.hotel.id),
                      const SizedBox(height: 80),
                    ],
                  ),
                ),
              ),
            ],
          ),

          Positioned(
            left: 16,
            right: 16,
            bottom: 10,
            child: Container(
              padding: const EdgeInsets.all(8.0),
              decoration: BoxDecoration(
                color: const Color(0xFF92AAC7), // Màu nền chung
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                    spreadRadius: 2,
                  ),
                ],
              ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Nút "Chọn ngày giờ check in" - Compact version
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          _showSelectedDateTime();
                        },
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            vertical: 12,
                            horizontal: 16,
                          ),
                          backgroundColor: Colors.grey[200],
                          foregroundColor: Colors.black,
                          elevation: 1,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(30),
                          ),
                        ),
                        child: Row(
                          children: [
                            // Icon
                            AnimatedSwitcher(
                              duration: const Duration(milliseconds: 300),
                              child: Icon(
                                key: ValueKey<bool>(isNightTime),
                                isNightTime ? FontAwesomeIcons.cloudMoon : FontAwesomeIcons.cloudSun,
                                size: 18,
                                color: isNightTime ? Color(0xFF010535) : Color(0xFFF93243),
                              ),
                            ),

                            const SizedBox(width: 10),

                            // ✅ Compact text layout
                            Expanded(
                              child: Row(
                                children: [
                                  // Check-in date
                                  Flexible(
                                    flex: 2,
                                    child: Text(
                                      _selecteDateCheckInShowText,
                                      style: TextStyle(
                                        color: Colors.black,
                                        fontSize: 15,
                                        fontWeight: FontWeight.w500,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),

                                  if (_selecteDateCheckOutShowText.isNotEmpty) ...[
                                    const SizedBox(width: 4),
                                    Icon(Icons.arrow_forward_rounded, color: Color(0xFF525150), size: 16),
                                    const SizedBox(width: 4),

                                    // Check-out date
                                    Flexible(
                                      flex: 2,
                                      child: Text(
                                        _selecteDateCheckOutShowText,
                                        style: TextStyle(color: Colors.black, fontSize: 15),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),

                                    const SizedBox(width: 6),

                                    // Booking type - Shortened
                                    Container(
                                      padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: Color(0xFF1565C0).withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Text(
                                        _bookingType,
                                        style: TextStyle(
                                          color: Color(0xFF1565C0),
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 8),

                    // Book now button giữ nguyên
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          backgroundColor: const Color(0xFF1565C0),
                          elevation: 4,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: () {
                          if (_selecteDateCheckInShowText == S.of(context).selectDatesAndTimeCheckIn ||
                              _selecteDateCheckOutShowText.isEmpty) {
                            NotificationDialog.showInfo(
                              context,
                              message: S.of(context).messageSelectDateTimeCheckIn,
                            );
                          } else {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (builder) => ListRoomScreen(
                                  idHotel: widget.hotel.id,
                                  lichPhongTrong: lichPhongTrong,
                                ),
                              ),
                            );
                          }
                        },
                        child: Text(
                          S.of(context).bookNow,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ],
                )
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRatingStars(double rating) {
    // Đổi từ int sang double
    return Row(
      children: List.generate(5, (index) {
        if (index < rating.floor()) {
          return Icon(
            FontAwesomeIcons.solidStar,
            color: Colors.amber,
            size: 20,
          );
        } else if (index < rating) {
          return Icon(
            FontAwesomeIcons.starHalfStroke,
            color: Colors.amber,
            size: 20,
          );
        } else {
          // Star rỗng
          return Icon(FontAwesomeIcons.star, color: Colors.grey[400], size: 20);
        }
      }),
    );
  }

  Widget _buildAmenitiesRow() {
    return Wrap(
      spacing: 10,
      runSpacing: 12,
      children: [
        _buildAmenityItem(FontAwesomeIcons.swimmingPool, "Swimming"),
        _buildAmenityItem(FontAwesomeIcons.bed, "Double bed"),
        _buildAmenityItem(FontAwesomeIcons.tv, "Smart TV"),
        _buildAmenityItem(FontAwesomeIcons.wifi, "Free Wifi"),
        _buildAmenityItem(FontAwesomeIcons.utensils, "Restaurant"),
        _buildAmenityItem(FontAwesomeIcons.bath, "Bath"),
      ],
    );
  }

  Widget _buildAmenityItem(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: Colors.blue),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(fontSize: 12)),
        ],
      ),
    );
  }
}
