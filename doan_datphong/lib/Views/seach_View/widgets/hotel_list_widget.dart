import 'package:doan_datphong/Views/detail_View/detail_screen.dart';
import 'package:flutter/material.dart';
import 'package:doan_datphong/Models/KhachSan.dart';

import 'package:flutter/material.dart';
import 'package:doan_datphong/Models/KhachSan.dart';
import 'package:doan_datphong/Helper/FormatCurrency.dart';

import '../../selectDate_View/selectDate_screen.dart';

class HotelListWidget extends StatelessWidget {
  final List<KhachSan> hotels;
  final int totalResults;
  final ScrollController? scrollController;
  final Function(KhachSan)? onHotelTap;
  final Map<String, dynamic>? currentFilter;
  const HotelListWidget({
    super.key,
    required this.hotels,
    required this.totalResults,
    this.scrollController,
    this.onHotelTap,
    this.currentFilter
  });

  // Map<String,dynamic> _initDateSendToSelectDateScreen(){
  //   Map<String,dynamic> result =({
  //     "initialCheckIn": currentFilter?['checkIn'], // String date
  //     "initialCheckOut": currentFilter?['checkOut'], // String date
  //     "initialAdults": currentFilter?['guests1'] ?? 2,
  //     "initialChildren": currentFilter?['children'] ?? 0,
  //     "initialRooms": currentFilter?['rooms'] ?? 1,
  //     "bookingType": currentFilter?['bookingType'], // String
  //   });
  //
  //   print("Kiem tra dữ liệu lọc trong hotelListWidget: $result");
  //   return result;
  // }
  Map<String,dynamic> _initDateSendToSelectDateScreen(){
    Map<String,dynamic> result =({
      "initialCheckIn": currentFilter?['checkIn'], // String date
      "initialCheckOut": currentFilter?['checkOut'], // String date
      "initialAdults": currentFilter?['guests1'] ?? 2,
      "initialChildren": currentFilter?['children'] ?? 0,
      "initialRooms": currentFilter?['rooms'] ?? 1,
      "bookingType": currentFilter?['bookingType'], // String
    });

    print("Kiem tra dữ liệu lọc trong hotelListWidget: $result");
    return result;
  }

  Future<void> _onTapAHotelHasData(BuildContext context, KhachSan hotel) async {
    // Kiểm tra có filters không
    bool hasFilters = currentFilter != null &&
        currentFilter!['checkIn'] != null &&
        currentFilter!['checkOut'] != null;

    print("Kiem tra dữ liệu lọc trong hotelListWidget: : ${_initDateSendToSelectDateScreen()}");


    if (hasFilters) {
      // ✅ Có filters → Đi thẳng SelectDateScreen
      await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => SelectDateScreen(
            data: _initDateSendToSelectDateScreen(),
            selectedHotel: hotel, // ✅ Truyền hotel đã chọn
          ),
        ),
      );
    } else {
      // ✅ Không có filters → Đi DetailScreen như bình thường
      if (onHotelTap != null) {
        onHotelTap!(hotel);
      } else {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => DetailScreen(hotel: hotel),
          ),
        );
      }
    }
  }

  // ✅ Sửa method navigate
  void _navigateToHotelDetail(BuildContext context, KhachSan hotel) {
    _onTapAHotelHasData(context, hotel);
  }



  @override
  Widget build(BuildContext context) {
    if (hotels.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.hotel_outlined,
              size: 80,
              color: Colors.grey[400],
            ),
            SizedBox(height: 16),
            Text(
              'Không tìm thấy khách sạn',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w500,
                color: Colors.black54,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Hãy thử tìm kiếm với từ khóa khác',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          // Results header
          Container(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Tìm thấy ($totalResults)',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                Row(
                  children: [
                    Icon(
                      Icons.view_list,
                      size: 20,
                      color: Colors.grey[600],
                    ),
                    const SizedBox(width: 8),
                    Icon(
                      Icons.grid_view,
                      size: 20,
                      color: Colors.grey[600],
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Hotel list
          Expanded(
            child: ListView.builder(
              controller: scrollController,
              itemCount: hotels.length,
              itemBuilder: (context, index) {
                return _buildHotelCard(context,hotels[index]);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHotelCard(BuildContext context,KhachSan hotel) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Hotel image
          Container(
            height: 180,
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
              color: Colors.grey[200],
            ),
            child: Stack(
              children: [
                Container(
                  width: double.infinity,
                  height: double.infinity,
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Colors.grey[300]!,
                        Colors.grey[100]!,
                      ],
                    ),
                  ),
                  child: hotel.hinhAnh.isNotEmpty
                      ? ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                    child: Image.network(
                      hotel.hinhAnh,
                      width: double.infinity,
                      height: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return const Center(
                          child: Icon(
                            Icons.hotel,
                            size: 48,
                            color: Colors.grey,
                          ),
                        );
                      },
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return const Center(
                          child: CircularProgressIndicator(
                            color: Color(0xFF1565C0),
                          ),
                        );
                      },
                    ),
                  )
                      : const Center(
                    child: Icon(
                      Icons.hotel,
                      size: 48,
                      color: Colors.grey,
                    ),
                  ),
                ),
                // Bookmark icon
                const Positioned(
                  top: 12,
                  right: 12,
                  child: Icon(
                    Icons.bookmark_border,
                    color: Colors.white,
                    size: 24,
                    shadows: [
                      Shadow(
                        color: Colors.black26,
                        offset: Offset(0, 1),
                        blurRadius: 2,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Hotel info
          GestureDetector(
            onTap: () => {
              _navigateToHotelDetail(context,hotel),
              print("Khách sạn đã chọn: ${hotel.tenKhachSan}"),
            },
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Hotel name
                  Text(
                    hotel.tenKhachSan,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),

                  // Location with icon
                  Row(
                    children: [
                      Icon(
                        Icons.location_on_outlined,
                        size: 16,
                        color: Colors.grey[600],
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          hotel.diaChi,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Star rating and reviews
                  Row(
                    children: [
                      // Star rating display
                      Row(
                        children: List.generate(5, (index) {
                          return Icon(
                            index < hotel.soSao ? Icons.star : Icons.star_border,
                            color: index < hotel.soSao ? Colors.amber : Colors.grey[300],
                            size: 16,
                          );
                        }),
                      ),
                      const SizedBox(width: 8),

                      // Rating number
                      Text(
                        '${hotel.soSao}.0',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(width: 4),

                      // Reviews count (simulated)
                      Text(
                        '(${_getRandomReviews(hotel.id)} reviews)',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 8),
                  if (hotel.availableRoomsCount != null && hotel.availableRoomsCount! > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.green[50],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.green[200]!),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.check_circle,
                            size: 14,
                            color: Colors.green[600],
                          ),
                          SizedBox(width: 4),
                          Text(
                            'Còn ${hotel.availableRoomsCount} phòng trống',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: Colors.green[700],
                            ),
                          ),
                        ],
                      ),
                    ),

                  const SizedBox(height: 12),


                  const SizedBox(height: 12),

                  // Price and book button
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Price
                      RichText(
                        text: TextSpan(
                          children: [
                            TextSpan(
                              text: CurrencyHelper.formatVND(hotel.giaCa),
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1565C0),
                              ),
                            ),
                            TextSpan(
                              text: ' / đêm',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),

                      // View details button
                      GestureDetector(
                        onTap:() => {
                          _navigateToHotelDetail(context, hotel),
                          print("Khách sạn đã chọn: ${hotel.tenKhachSan}"),
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1565C0).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'Đặt phòng',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF1565C0),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Generate consistent random review count based on hotel ID
  String _getRandomReviews(String hotelId) {
    final reviewCounts = ['1.2k', '2.1k', '3.5k', '4.2k', '1.8k', '5.1k', '2.8k', '3.1k'];
    final index = hotelId.hashCode % reviewCounts.length;
    return reviewCounts[index];
  }
}