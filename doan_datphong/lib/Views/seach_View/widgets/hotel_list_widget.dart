import 'package:flutter/material.dart';
import 'package:doan_datphong/Models/KhachSan.dart';

import 'package:flutter/material.dart';
import 'package:doan_datphong/Models/KhachSan.dart';
import 'package:doan_datphong/Helper/FormatCurrency.dart';

class HotelListWidget extends StatelessWidget {
  final List<KhachSan> hotels;
  final int totalResults;
  final ScrollController? scrollController;

  const HotelListWidget({
    super.key,
    required this.hotels,
    required this.totalResults,
    this.scrollController,
  });

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
                return _buildHotelCard(hotels[index]);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHotelCard(KhachSan hotel) {
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
          Padding(
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
                        hotel.thanhPho,
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

                // Address (if different from city)
                if (hotel.diaChi.isNotEmpty && hotel.diaChi != hotel.thanhPho) ...[
                  const SizedBox(height: 6),
                  Text(
                    hotel.diaChi,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[500],
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],

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
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1565C0).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        'Xem chi tiết',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1565C0),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
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