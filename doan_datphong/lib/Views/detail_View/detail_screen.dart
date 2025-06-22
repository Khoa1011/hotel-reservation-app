import 'package:doan_datphong/Models/KhachSan.dart';
import 'package:doan_datphong/Views/components/NotificationDialog.dart';

import 'package:doan_datphong/Views/listRoom_View/listRoom_screen.dart';
import 'package:doan_datphong/Views/selectDate_View/selectDate_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:doan_datphong/generated/l10n.dart';
import 'widgets/amenities_section.dart';
import '../../Data/Provider/FormatCurrency.dart';


class DetailScreen extends StatefulWidget {
  final Hotels hotel;

  const DetailScreen({Key? key, required this.hotel}) : super(key: key);

  @override
  _DetailState createState() => _DetailState();
}

class _DetailState extends State<DetailScreen> {
  String _selecteDateCheckInShowText = "";
  String _selecteDateCheckOutShowText ="";
  late String checkInDateRouter = "";
  late String checkOutDateRouter = "";

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
  }

  Future<void> _saveHotelId() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setString("hotel_id", widget.hotel.id);
    await prefs.setString("hotel_address", widget.hotel.diaChi);
    print("Hotels ID saved: ${widget.hotel.id}");
  }


  Future<void> _showSelectedDateTime () async {
    final selectedDateTimeToNextScreen = await Navigator.push(
      context,
    MaterialPageRoute(builder: (context)=> SelectDateScreen()));

    if(selectedDateTimeToNextScreen != null
        && selectedDateTimeToNextScreen is Map<String,String>){
      setState(() {
        _selecteDateCheckInShowText = selectedDateTimeToNextScreen["dateCheckIn"]!;
        _selecteDateCheckOutShowText = selectedDateTimeToNextScreen["dateCheckOut"]!;
        checkInDateRouter = selectedDateTimeToNextScreen["checkInDateRouter"]!;
        checkOutDateRouter = selectedDateTimeToNextScreen["checkOutDateRouter"]!;
      });
    }
  }

  void _showDescriptionDialog(BuildContext context, String fullDescription) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
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
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  border: Border(top: BorderSide(color: Colors.grey[200]!)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.blue[600],
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
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
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 270,
                pinned: true,
                flexibleSpace: Hero(
                  tag: 'hotel-image-${widget.hotel.id}',
                  child: Image.network(
                    widget.hotel.hinhAnh,
                    height: 300,
                    fit: BoxFit.fill,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(color: Colors.grey);
                    },
                  ),
                ),
                actions: [
                  IconButton(
                    icon: const Icon(Icons.favorite_border, size: 30, color: Color(0xff9A9EAB)),
                    onPressed: () {},
                  ),
                  IconButton(
                    icon: const Icon(Icons.bookmark_border_outlined, size: 30, color: Color(0xff9A9EAB)),
                    onPressed: () {},
                  ),
                ],
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.only(left: 16, right: 16, bottom: 100),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.hotel.tenKhachSan,
                        style: const TextStyle(
                          fontSize: 25,
                          fontWeight: FontWeight.bold,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          const Icon(Icons.location_on, size: 20, color: Color(0xFF525150)),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(widget.hotel.diaChi,
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(color: Color(0xFF525150))),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
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
                          Text("/ ${S.of(context).perNight}",

                              style: TextStyle(
                                  color: Color(0xFF525150),
                                fontSize: 18,
                              )),
                        ],
                      ),
                      const SizedBox(height: 24),

                      AmenitiesSection(hotelId: widget.hotel.id),

                      const SizedBox(height: 24),

                      Text(
                        S.of(context).description,
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      InkWell(
                        onTap: () => _showDescriptionDialog(context, widget.hotel.moTa),
                        child: Text(
                          widget.hotel.moTa,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              height: 1.5,
                          fontSize: 16),
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        S.of(context).locationHotel,
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        height: 200,
                        decoration: BoxDecoration(
                          color: Colors.grey[200],
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Center(
                          child: Icon(Icons.map, size: 50, color: Colors.blue),
                        ),
                      ),
                      const SizedBox(height: 80), // Thêm khoảng trống cho nút
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
                  // Nút "Chọn ngày giờ check in"
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        _showSelectedDateTime();
                      },
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
                        backgroundColor: Colors.grey[200],
                        foregroundColor: Colors.black,
                        elevation: 1,
                        overlayColor: Colors.black.withOpacity(0.05),
                        splashFactory: InkRipple.splashFactory,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                        alignment: Alignment.centerLeft,
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          AnimatedSwitcher(
                            duration: const Duration(milliseconds: 300),
                            child: Icon(
                              key: ValueKey<bool>(isNightTime),
                              isNightTime
                                  ? FontAwesomeIcons.cloudMoon
                                  : FontAwesomeIcons.cloudSun,
                              size: 20,
                              color: isNightTime
                                  ? Color(0xFF010535)  // Màu cho icon ban đêm
                                  : Color(0xFFF93243),
                            ),
                            transitionBuilder: (child, animation) {
                              return ScaleTransition(
                                scale: animation,
                                child: FadeTransition(
                                  opacity: animation,
                                  child: child,
                                ),
                              );
                            },
                          ),
                          const SizedBox(width: 12),

                          SizedBox(width: 10,),
                          Row(
                            children: [
                              Text(
                                _selecteDateCheckInShowText,
                                style: TextStyle(color: Colors.black, fontSize: 14),
                              ),
                              if (_selecteDateCheckOutShowText.isNotEmpty) ...[
                                const SizedBox(width: 8),
                                const Icon(
                                  Icons.arrow_forward_rounded,
                                  color: Color(0xff9A9EAB),
                                  size: 16,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  _selecteDateCheckOutShowText,
                                  style: TextStyle(color: Colors.black, fontSize: 14),
                                ),
                              ]
                            ],
                          )
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 5),

                  // Nút "Book now!"
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        overlayColor: Colors.black.withOpacity(0.05),
                        splashFactory: InkRipple.splashFactory,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        backgroundColor: const Color(0xFF1565C0),
                        elevation: 4,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: () {
                        if(_selecteDateCheckInShowText == S.of(context).selectDatesAndTimeCheckIn ||
                            _selecteDateCheckOutShowText.isEmpty){
                          NotificationDialog.showInfo(
                              context, 
                              message: S.of(context).messageSelectDateTimeCheckIn);

                         }else{
                          Navigator.push(context, MaterialPageRoute(
                              builder: (builder)=>
                                  ListRoomScreen(
                                    idHotel: widget.hotel.id,
                                    checkInDate: checkInDateRouter,
                                    checkOutDate: checkOutDateRouter,)));
                        }
                      },
                      child:  Text(
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
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildRatingStars(double rating) { // Đổi từ int sang double
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
          return Icon(
            FontAwesomeIcons.star,
            color: Colors.grey[400],
            size: 20,
          );
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