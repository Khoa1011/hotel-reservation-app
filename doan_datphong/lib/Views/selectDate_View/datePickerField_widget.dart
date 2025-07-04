// File: lib/Widgets/overnight_time_picker_widget.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:doan_datphong/generated/l10n.dart';

class OvernightTimePickerWidget extends StatelessWidget {
  final TimeOfDay? selectedTime;
  final Function(TimeOfDay) onTimeSelected;
  final String title;

  const OvernightTimePickerWidget({
    Key? key,
    required this.selectedTime,
    required this.onTimeSelected,
    required this.title,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Giờ cho đặt qua đêm: 21h - 1h sáng
    final List<TimeOfDay> overnightTimes = [
      TimeOfDay(hour: 21, minute: 0),  // 9:00 PM
      TimeOfDay(hour: 22, minute: 0),  // 10:00 PM
      TimeOfDay(hour: 23, minute: 0),  // 11:00 PM
      TimeOfDay(hour: 0, minute: 0),   // 12:00 AM (midnight)
      TimeOfDay(hour: 1, minute: 0),   // 1:00 AM
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              title,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            // Bỏ nút datetime picker cho overnight
            Container(
              padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.nightlight_round, size: 16, color: Colors.blue[700]),
                  SizedBox(width: 4),
                  Text(
                    S.of(context).overnight,
                    style: TextStyle(
                      color: Colors.blue[700],
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        SizedBox(height: 16),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: overnightTimes.map((time) {
              final isSelected = _isTimeSelected(time);
              return Padding(
                padding: EdgeInsets.only(right: 12),
                child: GestureDetector(
                  onTap: () {
                    onTimeSelected(time);
                    HapticFeedback.lightImpact();
                  },
                  child: AnimatedContainer(
                    duration: Duration(milliseconds: 200),
                    padding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    decoration: BoxDecoration(
                      gradient: isSelected
                          ? LinearGradient(
                        colors: [Color(0xFF1565C0), Color(0xFF0180CC)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                          : null,
                      color: !isSelected ? Colors.grey[100] : null,
                      borderRadius: BorderRadius.circular(25),
                      border: Border.all(
                        color: isSelected ? Colors.transparent : Colors.grey[300]!,
                        width: 1,
                      ),
                      boxShadow: isSelected ? [
                        BoxShadow(
                          color: Color(0xFF1565C0).withOpacity(0.3),
                          blurRadius: 8,
                          spreadRadius: 2,
                          offset: Offset(0, 4),
                        ),
                      ] : null,
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _formatTime(time),
                          style: TextStyle(
                            color: isSelected ? Colors.white : Colors.grey[700],
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                            fontSize: 14,
                          ),
                        ),
                        if (time.hour >= 21 || time.hour <= 1)
                          Text(
                            _getTimeLabel(context,time),
                            style: TextStyle(
                              color: isSelected
                                  ? Colors.white
                                  : Colors.grey[900],
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        SizedBox(height: 12),
        // Thông tin đã chọn
        if (selectedTime != null)
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.blue.withOpacity(1)),
            ),
            child: Row(
              children: [
                Icon(Icons.check_circle, color: Color(0xFF1565C0), size: 16),
                SizedBox(width: 8),
                Text(
                  '${S.of(context).selectedTime}: ${_formatTime(selectedTime!)} ${_getTimeLabel(context,selectedTime!)}',
                  style: TextStyle(
                    color: Color(0xFF1565C0),
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        SizedBox(height: 8),
        // Thông tin hướng dẫn
        Container(
          padding: EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.blue[50],
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.blue[200]!),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.info_outline, color: Colors.blue[600], size: 16),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  S.of(context).overNightBookingNote,
                  style: TextStyle(
                    color: Colors.blue[700],
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  bool _isTimeSelected(TimeOfDay time) {
    return selectedTime?.hour == time.hour && selectedTime?.minute == time.minute;
  }

  String _formatTime(TimeOfDay time) {
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  String _getTimeLabel(BuildContext context,TimeOfDay time) {
    if (time.hour >= 21 && time.hour <= 23) {
      return S.of(context).night;
    } else if (time.hour >= 0 && time.hour <= 1) {
      return S.of(context).morning;
    }
    return '';
  }
}

// Widget tổng hợp có thể chuyển đổi giữa normal và overnight
class AdaptiveTimePickerWidget extends StatelessWidget {
  final TimeOfDay? selectedTime;
  final Function(TimeOfDay) onTimeSelected;
  final String title;
  final bool isOvernightMode; // true = overnight, false = normal

  const AdaptiveTimePickerWidget({
    Key? key,
    required this.selectedTime,
    required this.onTimeSelected,
    required this.title,
    this.isOvernightMode = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (isOvernightMode) {
      return OvernightTimePickerWidget(
        selectedTime: selectedTime,
        onTimeSelected: onTimeSelected,
        title: title,
      );
    } else {
      return PillTimePickerWidget(
        selectedTime: selectedTime,
        onTimeSelected: onTimeSelected,
        title: title,
      );
    }
  }
}

// Widget chính với PillTimePickerWidget gốc (để tham khảo)
class PillTimePickerWidget extends StatelessWidget {
  final TimeOfDay? selectedTime;
  final Function(TimeOfDay) onTimeSelected;
  final String title;

  const PillTimePickerWidget({
    Key? key,
    required this.selectedTime,
    required this.onTimeSelected,
    required this.title,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final List<TimeOfDay> popularTimes = [
      TimeOfDay(hour: 8, minute: 0),
      TimeOfDay(hour: 10, minute: 0),
      TimeOfDay(hour: 12, minute: 0),
      TimeOfDay(hour: 14, minute: 0),
      TimeOfDay(hour: 16, minute: 0),
      TimeOfDay(hour: 18, minute: 0),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              title,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            GestureDetector(
              onTap: () {
                // Hiển thị ngay lập tức khi tap
                _showNativeTimePicker(context);
              },
              child: Container(
                padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Color(0xFF1565C0).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Color(0xFF1565C0).withOpacity(0.3),
                    width: 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.access_time, size: 16, color: Color(0xFF1565C0)),
                    SizedBox(width: 4),
                    Text(
                      S.of(context).optionSeletedTime,
                      style: TextStyle(
                        color: Color(0xFF1565C0),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: 16),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: popularTimes.map((time) {
              final isSelected = _isTimeSelected(time);
              return Padding(
                padding: EdgeInsets.only(right: 12),
                child: GestureDetector(
                  onTap: () {
                    onTimeSelected(time);
                    HapticFeedback.lightImpact();
                  },
                  child: AnimatedContainer(
                    duration: Duration(milliseconds: 200),
                    padding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    decoration: BoxDecoration(
                      gradient: isSelected
                          ? LinearGradient(
                        colors: [Color(0xFF1565C0), Color(0xFF0180CC)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                          : null,
                      color: !isSelected ? Colors.grey[100] : null,
                      borderRadius: BorderRadius.circular(25),
                      border: Border.all(
                        color: isSelected ? Colors.transparent : Colors.grey[300]!,
                        width: 1,
                      ),
                      boxShadow: isSelected ? [
                        BoxShadow(
                          color: Color(0xFF1565C0).withOpacity(0.3),
                          blurRadius: 8,
                          spreadRadius: 2,
                          offset: Offset(0, 4),
                        ),
                      ] : null,
                    ),
                    child: Text(
                      _formatTime(time),
                      style: TextStyle(
                        color: isSelected ? Colors.white : Colors.grey[700],
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        if (selectedTime != null)
          Padding(
            padding: EdgeInsets.only(top: 12),
            child: Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Color(0xFF1565C0).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Color(0xFF1565C0).withOpacity(1)),
              ),
              child: Row(
                children: [
                  Icon(Icons.check_circle, color: Color(0xFF1565C0), size: 16),
                  SizedBox(width: 8),
                  Text(
                    '${S.of(context).selectedTime}: ${_formatTime(selectedTime!)}',
                    style: TextStyle(
                      color: Color(0xFF1565C0),
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  bool _isTimeSelected(TimeOfDay time) {
    return selectedTime?.hour == time.hour && selectedTime?.minute == time.minute;
  }

  String _formatTime(TimeOfDay time) {
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  void _showNativeTimePicker(BuildContext context) async {
    // Hiển thị ngay lập tức
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: selectedTime ?? TimeOfDay.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: Color(0xFF1565C0),
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: Colors.black,
            ),
            timePickerTheme: TimePickerThemeData(
              backgroundColor: Colors.white,
              hourMinuteTextColor: Color(0xFF1565C0),
              hourMinuteColor: Color(0xFF1565C0).withOpacity(0.1),
              dialHandColor: Color(0xFF1565C0),
              dialBackgroundColor: Colors.grey[100],
              entryModeIconColor: Color(0xFF1565C0),
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      onTimeSelected(picked);
      // Thêm haptic feedback
      HapticFeedback.selectionClick();
    }
  }
}