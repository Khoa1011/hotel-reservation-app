// File: lib/Widgets/time_picker_widget.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:doan_datphong/generated/l10n.dart';


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
              onTap: () => _showNativeTimePicker(context),
              child: Container(
                padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Color(0xFF1565C0).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.add, size: 16, color: Color(0xFF1565C0)),
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
        if (selectedTime != null && !popularTimes.any((t) => _isTimeSelected(t)))
          Padding(
            padding: EdgeInsets.only(top: 12),
            child: Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Color(0xFF1565C0).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Color(0xFF1565C0).withOpacity(0.3)),
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

  Future<void> _showNativeTimePicker(BuildContext context) async {
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
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      onTimeSelected(picked);
    }
  }
}