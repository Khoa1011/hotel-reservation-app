// File: lib/Widgets/guest_counter_widget.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:doan_datphong/generated/l10n.dart';

class GuestCounterWidget extends StatelessWidget {
  final int adults;
  final int children;
  final int rooms;
  final Function(int adults, int children, int rooms) onGuestChanged;
  final String title;

  const GuestCounterWidget({
    Key? key,
    required this.adults,
    required this.children,
    required this.rooms,
    required this.onGuestChanged,
    required this.title,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
          ),
        ),
        SizedBox(height: 12),
        Container(
          padding: EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[300]!),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 8,
                spreadRadius: 1,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: [
              // Adults
              _buildCounterRow(
                context: context,
                icon: Icons.person,
                title: S.of(context).adults,
                subtitle: S.of(context).agesOrAbove,
                count: adults,
                onIncrement: () {
                  if (adults < 10) {
                    onGuestChanged(adults + 1, children, rooms);
                    HapticFeedback.lightImpact();
                  }
                },
                onDecrement: () {
                  if (adults > 1) {
                    onGuestChanged(adults - 1, children, rooms);
                    HapticFeedback.lightImpact();
                  }
                },
                minValue: 1,
                maxValue: 10,
              ),

              SizedBox(height: 16),
              Divider(color: Colors.grey[200], height: 1),
              SizedBox(height: 16),

              // Children
              _buildCounterRow(
                context: context,
                icon: Icons.child_care,
                title: S.of(context).children,
                subtitle: S.of(context).age2_12,
                count: children,
                onIncrement: () {
                  if (children < 8) {
                    onGuestChanged(adults, children + 1, rooms);
                    HapticFeedback.lightImpact();
                  }
                },
                onDecrement: () {
                  if (children > 0) {
                    onGuestChanged(adults, children - 1, rooms);
                    HapticFeedback.lightImpact();
                  }
                },
                minValue: 0,
                maxValue: 8,
              ),

              SizedBox(height: 16),
              Divider(color: Colors.grey[200], height: 1),
              SizedBox(height: 16),

              // Rooms
              _buildCounterRow(
                context: context,
                icon: Icons.hotel,
                title: S.of(context).rooms,
                subtitle: S.of(context).howManyRoomsNeeded,
                count: rooms,
                onIncrement: () {
                  if (rooms < 5) {
                    onGuestChanged(adults, children, rooms + 1);
                    HapticFeedback.lightImpact();
                  }
                },
                onDecrement: () {
                  if (rooms > 1) {
                    onGuestChanged(adults, children, rooms - 1);
                    HapticFeedback.lightImpact();
                  }
                },
                minValue: 1,
                maxValue: 5,
              ),
            ],
          ),
        ),
        SizedBox(height: 8),
        // Summary
        Container(
          width: double.infinity,
          padding: EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Color(0xFF1565C0).withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Color(0xFF1565C0).withOpacity(0.3)),
          ),
          child: Text(
            _buildSummaryText(context),
            style: TextStyle(
              color: Color(0xFF1565C0),
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
            textAlign: TextAlign.center,
          ),
        ),
      ],
    );
  }

  Widget _buildCounterRow({
    required BuildContext context,
    required IconData icon,
    required String title,
    required String subtitle,
    required int count,
    required VoidCallback onIncrement,
    required VoidCallback onDecrement,
    required int minValue,
    required int maxValue,
  }) {
    return Row(
      children: [
        // Icon và Text
        Container(
          padding: EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Color(0xFF1565C0).withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            icon,
            color: Color(0xFF1565C0),
            size: 20,
          ),
        ),
        SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.black,
                ),
              ),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 12,
                  color: Color(0xFF525150),
                ),
              ),
            ],
          ),
        ),

        // Counter buttons
        Row(
          children: [
            // Decrease button
            GestureDetector(
              onTap: count > minValue ? onDecrement : null,
              child: AnimatedContainer(
                duration: Duration(milliseconds: 150),
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: count > minValue
                      ? Color(0xFF1565C0).withOpacity(0.1)
                      : Colors.grey[100],
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: count > minValue
                        ? Color(0xFF1565C0).withOpacity(0.3)
                        : Colors.grey[300]!,
                  ),
                ),
                child: Icon(
                  Icons.remove,
                  size: 18,
                  color: count > minValue
                      ? Color(0xFF1565C0)
                      : Color(0xFF525150),
                ),
              ),
            ),

            SizedBox(width: 16),

            // Count display
            Container(
              width: 24,
              child: Text(
                count.toString(),
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
                textAlign: TextAlign.center,
              ),
            ),

            SizedBox(width: 16),

            // Increase button
            GestureDetector(
              onTap: count < maxValue ? onIncrement : null,
              child: AnimatedContainer(
                duration: Duration(milliseconds: 150),
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: count < maxValue
                      ? Color(0xFF1565C0).withOpacity(0.1)
                      : Colors.grey[100],
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: count < maxValue
                        ? Color(0xFF1565C0).withOpacity(0.3)
                        : Colors.grey[300]!,
                  ),
                ),
                child: Icon(
                  Icons.add,
                  size: 18,
                  color: count < maxValue
                      ? Color(0xFF1565C0)
                      : Color(0xFF525150),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

// 🔥 HÀM XỬ LÝ SUMMARY TEXT ĐA NGÔN NGỮ
  String _buildSummaryText(BuildContext context) {
    // Lấy ngôn ngữ hiện tại
    final locale = Localizations.localeOf(context);
    final isVietnamese = locale.languageCode == 'vi';

    String guestText;
    String roomText;

    if (isVietnamese) {
      // TIẾNG VIỆT - Không cần thêm 's'
      guestText = '$adults người lớn';
      if (children > 0) {
        guestText += ', $children trẻ em';
      }
      roomText = '$rooms phòng';
    } else {
      // TIẾNG ANH - Cần thêm 's' cho số nhiều
      guestText = '$adults adult${adults > 1 ? 's' : ''}';
      if (children > 0) {
        guestText += ', $children child${children > 1 ? 'ren' : ''}';
      }
      roomText = '$rooms room${rooms > 1 ? 's' : ''}';
    }

    return '$guestText • $roomText';
  }

}