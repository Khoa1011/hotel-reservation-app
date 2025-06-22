import 'package:doan_datphong/Models/KhachSan.dart';
import 'package:doan_datphong/Models/NguoiDung.dart';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../Models/Room.dart';
import '../payment_screen/payment_screen.dart';

class RoomCard extends StatelessWidget {
  final Room room;

  final VoidCallback? onBookPressed;


  const RoomCard({
    super.key,
    required this.room,
    this.onBookPressed,
  });

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'en_US', symbol: '\$');
    final theme = Theme.of(context);
    final isAvailable = room.availableRooms > 0;

    return Card(
      elevation: 4,
      margin: const EdgeInsets.all(8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: isAvailable ? () {
          // Handle room tap if needed
        } : null,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildImageSection(context),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Room name and price
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          room.roomType,
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        currencyFormat.format(room.price),
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: theme.primaryColor,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 8),

                  // Availability info
                  _buildAvailabilityInfo(context),

                  const SizedBox(height: 12),

                  // Room basic info
                  _buildRoomInfo(context),

                  const SizedBox(height: 16),

                  // Amenities
                  _buildAmenitiesSection(context),

                  const SizedBox(height: 16),

                  // Book button
                  _buildBookButton(context),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageSection(BuildContext context) {
    return Stack(
      children: [
        Container(
          height: 180,
          width: double.infinity,
          decoration: BoxDecoration(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            color: Colors.grey.shade200,
          ),
          child: ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: Image.network(
              room.image,
              fit: BoxFit.cover,
              loadingBuilder: (context, child, loadingProgress) {
                if (loadingProgress == null) return child;
                return Center(
                  child: CircularProgressIndicator(
                    value: loadingProgress.expectedTotalBytes != null
                        ? loadingProgress.cumulativeBytesLoaded /
                        loadingProgress.expectedTotalBytes!
                        : null,
                  ),
                );
              },
              errorBuilder: (context, error, stackTrace) {
                return Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.image_not_supported, size: 50, color: Colors.grey),
                    const SizedBox(height: 8),
                    Text(
                      'Unable to load image',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey,
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ),

        // Availability badge
        Positioned(
          top: 12,
          right: 12,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.9),
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
              BoxShadow(
              color: Colors.black12,
              blurRadius: 4,
              offset: Offset(0, 2),
              )],
            ),
            child: Text(
              room.availableRooms > 0 ? 'AVAILABLE' : 'SOLD OUT',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: room.availableRooms > 0 ? Colors.green : Colors.red,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAvailabilityInfo(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: room.availableRooms > 0 ? Colors.green.shade50 : Colors.red.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: room.availableRooms > 0 ? Colors.green.shade100 : Colors.red.shade100,
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            room.availableRooms > 0 ? Icons.check_circle_outline : Icons.error_outline,
            size: 18,
            color: room.availableRooms > 0 ? Colors.green : Colors.red,
          ),
          const SizedBox(width: 8),
          Text(
            room.availableRooms > 0
                ? '${room.availableRooms} ${room.availableRooms > 1 ? 'rooms' : 'room'} available'
                : 'Fully booked',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: room.availableRooms > 0 ? Colors.green : Colors.red,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRoomInfo(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        _buildInfoItem(
          context,
          icon: Icons.king_bed,
          text: '${room.bedCount} ${room.bedCount > 1 ? 'beds' : 'bed'}',
        ),
        _buildInfoItem(
          context,
          icon: Icons.person,
          text: '${room.capacity} ${room.capacity > 1 ? 'people' : 'person'}',
        ),
        _buildInfoItem(
          context,
          icon: Icons.aspect_ratio,
          text: '25m²', // Replace with actual size if available
        ),
      ],
    );
  }

  Widget _buildInfoItem(BuildContext context, {required IconData icon, required String text}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: Theme.of(context).primaryColor),
          const SizedBox(width: 4),
          Text(
            text,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAmenitiesSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Room Amenities:',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: room.amenities.take(3).map((amenity) {
            return Chip(
              label: Text(amenity),
              labelStyle: Theme.of(context).textTheme.labelSmall,
              backgroundColor: Colors.blue.shade50,
              visualDensity: VisualDensity.compact,
              side: BorderSide.none,
            );
          }).toList(),
        ),
        if (room.amenities.length > 3) ...[
          const SizedBox(height: 8),
          Text(
            '+${room.amenities.length - 3} more amenities',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: Colors.blue,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildBookButton(BuildContext context) {
    final isAvailable = room.availableRooms > 0;

    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: isAvailable ? () {
          // if (onBookPressed != null) {
          //   onBookPressed!(); // Only call if callback is provided
          // }
          Navigator.push(context, MaterialPageRoute(builder: (builder)=> PaymentScreen(room: room)));
        } : null,
        style: ElevatedButton.styleFrom(
          elevation: 1,
          overlayColor: Colors.black.withOpacity(0.05),
          splashFactory: InkRipple.splashFactory,
          backgroundColor: isAvailable
              ? Color(0xFF16F1FA)
              : Colors.grey,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(vertical: 14),
        ),
        child: Text(
          isAvailable ? 'BOOK NOW' : 'SOLD OUT',
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            
            fontSize: 16,
          ),
        ),
      ),
    );
  }


}