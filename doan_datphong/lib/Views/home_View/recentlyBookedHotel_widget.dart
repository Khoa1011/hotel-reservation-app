// ===== FLUTTER WIDGET - LƯỚT DỌC =====
// recent_bookings_widget.dart

import 'package:doan_datphong/Helper/FormatCurrency.dart';
import 'package:doan_datphong/Views/detail_View/detail_screen.dart';
import 'package:doan_datphong/Views/listBooking_View/listBooking_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:intl/intl.dart';
import '../../../generated/l10n.dart';
import '../../Blocs/recentlyBookedHotels_Blocs/recentlyBookedHotels_bloc.dart';
import '../../Blocs/recentlyBookedHotels_Blocs/recentlyBookedHotels_event.dart';
import '../../Blocs/recentlyBookedHotels_Blocs/recentlyBookedHotels_state.dart';
import '../../Models/KhachSan.dart';


class RecentBookingsWidget extends StatefulWidget {
  final String userId;

  const RecentBookingsWidget({Key? key, required this.userId}) : super(key: key);

  @override
  _RecentBookingsWidgetState createState() => _RecentBookingsWidgetState();
}

class _RecentBookingsWidgetState extends State<RecentBookingsWidget> {
  @override
  void initState() {
    super.initState();
    // Load recent hotels khi widget init
    context.read<RecentBookingsBloc>().add(LoadRecentBookings(widget.userId));
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header Row
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                S.of(context).recentlyBooked,
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              TextButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ListBookingScreen(),
                    ),
                  );
                },
                child: Text(
                  S.of(context).seeAll,
                  style: TextStyle(
                    fontSize: 16,
                    color: Color(0xFF1565C0),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 12),

        // BLoC Consumer - Lướt dọc
        BlocBuilder<RecentBookingsBloc, RecentBookingsState>(
          builder: (context, state) {
            if (state is RecentBookingsLoading) {
              return _buildLoadingState();
            } else if (state is RecentBookingsLoaded) {
              if (state.bookings.isEmpty) {
                return _buildEmptyState();
              }
              return _buildHotelsList(state.bookings);
            } else if (state is RecentBookingsError) {
              return _buildErrorState(state.errorMessage);
            }

            return _buildEmptyState();
          },
        ),
      ],
    );
  }

  Widget _buildLoadingState() {
    return Container(
      height: 300,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF1565C0)),
            ),
            SizedBox(height: 16),
            Text(
              'Đang tải khách sạn đã đặt...',
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHotelsList(List<dynamic> hotels) {
    return Container(
      height: 400, // Fixed height cho scroll dọc
      child: ListView.builder(
        padding: EdgeInsets.symmetric(horizontal: 16),
        itemCount: hotels.length,
        itemBuilder: (context, index) {
          final hotel = hotels[index];
          return _buildHotelCard(hotel, index);
        },
      ),
    );
  }

  Widget _buildHotelCard(dynamic hotel, int index) {
    final hotelModel = KhachSan.fromJson(hotel['hotel']);
    final pricing = hotel['pricing'] as Map<String, dynamic>;
    final stats = hotel['stats'] as Map<String, dynamic>;
    final booking = hotel['booking'] as Map<String, dynamic>;

    return Container(
      margin: EdgeInsets.only(bottom: 16),
      child: Card(
        elevation: 3,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        child: InkWell(
          onTap: () {
            _showHotelDetails(hotel);
          },
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Hotel Image
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: _buildHotelImage(hotelModel.hinhAnh ?? ''),
                ),

                SizedBox(width: 12),

                // Hotel Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Hotel Name
                      Text(
                        hotelModel.tenKhachSan ?? "Unknown Hotel",
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),

                      SizedBox(height: 4),

                      // Address
                      Text(
                        hotelModel.diaChi ?? "Unknown Address",
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey[600],
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),

                      SizedBox(height: 8),

                      // Rating
                      Row(
                        children: [
                          Icon(
                            FontAwesomeIcons.solidStar,
                            color: Colors.amber,
                            size: 14,
                          ),
                          SizedBox(width: 4),
                          Text(
                            (hotelModel.soSao ?? 4.0).toString(),
                            style: TextStyle(
                              fontSize: 14,
                              color: Color(0xFF1565C0),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          SizedBox(width: 4),
                          Text(
                            '(${hotel['hotel']['totalReviews'] ?? 0})',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),

                      SizedBox(height: 8),

                      // Booking stats - Sử dụng Wrap để tránh overflow
                      Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        children: [
                          _buildStatChip(
                            icon: Icons.bookmark_outline,
                            text: '${stats['totalBookings'] ?? 1} lần',
                            color: Colors.blue,
                          ),
                          _buildStatChip(
                            icon: Icons.access_time,
                            text: _formatLastBookingDate(stats['lastBookingDate']),
                            color: Colors.green,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Price & Actions
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    // Price
                    Text(
                      pricing['displayPrice'] ?? "0k",
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1565C0),
                      ),
                    ),
                    Text(
                      "/ ${S.of(context).perNight}",
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),

                    SizedBox(height: 8),

                    // Total spent
                    Text(
                      'Tổng: ${CurrencyHelper.formatVND((stats['totalSpent'] ?? 0).toDouble())}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w500,
                      ),
                    ),

                    SizedBox(height: 12),

                    // Action buttons
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Bookmark button
                        GestureDetector(
                          onTap: () {
                            _toggleBookmark(hotel['bookingId']);
                          },
                          child: Container(
                            padding: EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.grey[100],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              Icons.bookmark_outline,
                              color: Color(0xFF1565C0),
                              size: 16,
                            ),
                          ),
                        ),

                        SizedBox(width: 8),

                        // Book again button
                        GestureDetector(
                          onTap: () {
                            _bookAgain(hotel);
                          },
                          child: Container(
                            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: Color(0xFF1565C0),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'Đặt lại',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatChip({
    required IconData icon,
    required String text,
    required Color color,
  }) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: color),
          SizedBox(width: 3),
          Text(
            text,
            style: TextStyle(
              fontSize: 10,
              color: color,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHotelImage(String imageUrl) {
    return Container(
      width: 80,
      height: 80,
      child: imageUrl.isNotEmpty
          ? Image.network(
        imageUrl,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return _buildImagePlaceholder();
        },
      )
          : _buildImagePlaceholder(),
    );
  }

  Widget _buildImagePlaceholder() {
    return Container(
      width: 80,
      height: 80,
      color: Colors.grey[300],
      child: Icon(
        Icons.hotel,
        color: Colors.grey[600],
        size: 30,
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      height: 200,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.hotel_outlined,
              size: 60,
              color: Colors.grey[400],
            ),
            SizedBox(height: 16),
            Text(
              'Chưa có khách sạn nào được đặt',
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Khám phá và đặt khách sạn đầu tiên!',
              style: TextStyle(
                color: Colors.grey[500],
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Container(
      height: 200,
      child: Center(
        child: SingleChildScrollView(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 60,
                color: Colors.red[400],
              ),
              SizedBox(height: 16),
              Text(
                'Lỗi tải dữ liệu',
                style: TextStyle(
                  color: Colors.red[600],
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(height: 8),
              Text(
                error,
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 12,
                ),
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  context.read<RecentBookingsBloc>().add(
                      RefreshRecentBookings(widget.userId)
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Color(0xFF1565C0),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: Text(
                  'Thử lại',
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatLastBookingDate(dynamic date) {
    if (date == null) return 'Gần đây';

    try {
      final bookingDate = DateTime.parse(date.toString());
      final now = DateTime.now();
      final difference = now.difference(bookingDate);

      if (difference.inDays == 0) {
        return 'Hôm nay';
      } else if (difference.inDays == 1) {
        return 'Hôm qua';
      } else if (difference.inDays < 7) {
        return '${difference.inDays} ngày trước';
      } else if (difference.inDays < 30) {
        return '${(difference.inDays / 7).floor()} tuần trước';
      } else {
        return DateFormat('dd/MM/yyyy').format(bookingDate);
      }
    } catch (e) {
      return 'Gần đây';
    }
  }


  void _toggleBookmark(String bookingId) {
    // TODO: Implement bookmark functionality
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Đã thêm vào bookmark!'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _bookAgain(dynamic hotel) {
    // TODO: Navigate to booking screen với thông tin hotel
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Chuyển đến trang đặt phòng...'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _showHotelDetails(dynamic hotel) {
    // TODO: Show hotel details modal or navigate to hotel detail screen
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _buildHotelDetailsModal(hotel),
    );
  }

  Widget _buildHotelDetailsModal(dynamic hotel) {
    final hotelModel = KhachSan.fromJson(hotel['hotel']);
    final stats = hotel['stats'] as Map<String, dynamic>;
    final booking = hotel['booking'] as Map<String, dynamic>;

    return Container(
      height: MediaQuery.of(context).size.height * 0.6,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: EdgeInsets.all(20),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: _buildHotelImage(hotelModel.hinhAnh ?? ''),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        hotelModel.tenKhachSan ?? 'Unknown Hotel',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        hotelModel.diaChi ?? 'Unknown Address',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                      ),
                      SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.star, color: Colors.amber, size: 16),
                          SizedBox(width: 4),
                          Text(
                            (hotelModel.soSao ?? 4.0).toString(),
                            style: TextStyle(
                              fontSize: 14,
                              color: Color(0xFF1565C0),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Stats
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatItem('Số lần đặt', (stats['totalBookings'] ?? 0).toString()),
                _buildStatItem('Tổng chi tiêu', CurrencyHelper.formatVND((stats['totalSpent'] ?? 0).toDouble())),
                _buildStatItem('Lần cuối', _formatLastBookingDate(stats['lastBookingDate'])),
              ],
            ),
          ),

          Spacer(),

          // Action buttons
          Padding(
            padding: EdgeInsets.all(20),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.push(context, MaterialPageRoute(
                          builder: (builder) => DetailScreen(hotel: hotelModel)
                      ));
                      
                    },
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: Color(0xFF1565C0)),
                      padding: EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: Text(
                      'Xem khách sạn',
                      style: TextStyle(color: Color(0xFF1565C0)),
                    ),
                  ),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      _bookAgain(hotel);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Color(0xFF1565C0),
                      padding: EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: Text(
                      'Đặt lại',
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1565C0),
          ),
        ),
        SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }
}