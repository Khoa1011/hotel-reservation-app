import 'package:doan_datphong/Views/listRoom_View/listRoom_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SelectDateScreen extends StatefulWidget {
  @override
  _SelectDateState createState() => _SelectDateState();
}

class _SelectDateState extends State<SelectDateScreen> {
  DateTime? _checkInDate;
  DateTime? _checkOutDate;
  DateTime _currentMonth = DateTime.now();
  final double _dayCellSize = 47.0;
  TimeOfDay? _selectedCheckInTime;


  void _changeMonth(int delta) {
    setState(() {
      _currentMonth = DateTime(_currentMonth.year, _currentMonth.month + delta);
    });
  }

  void eventClickButtonAplly (){
    final formattedDateCheckIn = DateFormat('dd/MM').format(_checkInDate!);
    final formattedDateCheckOut =DateFormat('dd/MM').format(_checkOutDate!);
    final timeCheckInPicked = _formatTime(_selectedCheckInTime!);
    final formattedCheckInDateRouter = DateFormat('yyyy-MM-dd').format(_checkInDate!);
    final formattedCheckoutDateRouter = DateFormat('yyyy-MM-dd').format(_checkOutDate!);
    final resultPickedDateTime ={
      "dateCheckIn":"$timeCheckInPicked, $formattedDateCheckIn",
      "dateCheckOut":"12:00, $formattedDateCheckOut",
      "checkInDateRouter":formattedCheckInDateRouter,
      "checkOutDateRouter":formattedCheckoutDateRouter,
    };
    _saveDateTime();
    Navigator.pop(context,resultPickedDateTime);

  }
  Future<void>_saveDateTime()async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setString("checkInDate", _checkInDate.toString());
    await prefs.setString("checkOutDate", _checkOutDate.toString());
    await prefs.setString("checkInTime", '${_selectedCheckInTime?.hour.toString().padLeft(2, '0')}:${_selectedCheckInTime?.minute.toString().padLeft(2, '0')}');
  }


  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            'Select Date',
            style: TextStyle(
              fontFamily: 'Lato',
              fontSize: 25,
              fontWeight: FontWeight.bold,
            ),
          ),
          centerTitle: true,
          elevation: 0,
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(8.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Month Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                      onPressed: () => _changeMonth(-1),
                      icon: Icon(Icons.chevron_left)
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4.0),
                    child: Text(
                      DateFormat('MMMM yyyy').format(_currentMonth),
                      style: TextStyle(
                        fontFamily: 'Lato Semibold',
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  IconButton(
                      onPressed: () => _changeMonth(1),
                      icon: Icon(Icons.chevron_right)
                  ),
                ],
              ),

              // Weekday Headers
              Row(
                children: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
                    .map((day) => Expanded(
                  child: Container(
                    margin: EdgeInsets.symmetric(horizontal: 1.0),
                    child: Center(
                      child: Text(
                        day,
                        style: TextStyle(
                          fontFamily: 'Lato Semibold',
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Colors.black,
                        ),
                      ),
                    ),
                  ),
                ))
                    .toList(),
              ),

              // Calendar Grid
              Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.blue),
                  borderRadius: BorderRadius.circular(8.0),
                  gradient: LinearGradient(
                    colors: [Color(0xFFA1D6E2), Color(0xFFF1F1F2)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: _buildCalendarGrid(),
              ),

              SizedBox(height: 15),

              // Check-in/Check-out Section
              Container(
                padding: EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildDateInfo('Check-in date', _checkInDate),
                    _buildDateInfo('Check-out date', _checkOutDate),
                  ],
                ),
              ),

              SizedBox(height: 10),

              // Time Selection Section
              Container(
                padding: const EdgeInsets.all(16.0),
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(8),
                ),

                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Check-in time',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        fontFamily: 'Lato Semibold'
                      ),
                    ),
                    SizedBox(height: 10,),
                    _buildTimePickerHorizontal(
                        selectedTime: _selectedCheckInTime,
                        onTimeSelected: (time) {
                          setState(() {
                            _selectedCheckInTime = time;
                          });
                        },)
                  ],
                ),
              ),

              SizedBox(height: 15),

              // Continue Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    // if (_checkInDate == null || _checkOutDate == null) {
                    //   ScaffoldMessenger.of(context).showSnackBar(
                    //     SnackBar(content: Text('Please select check-in and check-out dates')),
                    //   );
                    // } else {
                    //   // Handle booking with all information
                    //   print('Booking confirmed!');
                    // }

                    // Navigator.push(context, MaterialPageRoute(builder: (builder)=> ListRoomScreen()));

                    eventClickButtonAplly();
                  },
                  style: ElevatedButton.styleFrom(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: Color(0xFF16F1FA),
                    elevation: 1,
                    overlayColor: Colors.black.withOpacity(0.05),
                    splashFactory: InkRipple.splashFactory,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    'Apply',
                    style: TextStyle(
                      fontFamily: 'Lato',
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
// Hàm xây dựng danh sách giờ
  Widget _buildTimePickerHorizontal({
    required TimeOfDay? selectedTime,
    required Function(TimeOfDay) onTimeSelected,
  }) {
    // Tạo danh sách giờ từ 0:00 đến 23:30, cách nhau 30 phút
    final times = List.generate(48, (index) {
      final hour = index ~/ 2;
      final minute = (index % 2) * 30;
      return TimeOfDay(hour: hour, minute: minute);
    });

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(), // Hiệu ứng cuộn mượt
      child: Row(
        children: times.map((time) {
          final isSelected = selectedTime?.hour == time.hour &&
              selectedTime?.minute == time.minute;

          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () {
                onTimeSelected(time);

                HapticFeedback.selectionClick();
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeInOut,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFF16F1FA) : const Color(0xFFE6FBFA),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isSelected ? const Color(0xFF16F1FA) : const Color(0xFF0180CC),
                    width: isSelected ? 2 : 1,
                  ),
                  boxShadow: isSelected
                      ? [
                    BoxShadow(
                      color: const Color(0xFF16F1FA).withOpacity(0.4),
                      spreadRadius: 2,
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ]
                      : null,
                ),
                child: AnimatedDefaultTextStyle(
                  duration: const Duration(milliseconds: 150),
                  style: TextStyle(
                    color: isSelected ? Colors.white : Colors.black,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    fontSize: isSelected ? 15 : 14,
                  ),
                  child: Text(_formatTime(time)),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  String _formatTime(TimeOfDay time) {
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute'; // Định dạng 24h
  }

  Widget _buildCalendarGrid() {
    final firstDayOfMonth = DateTime(_currentMonth.year, _currentMonth.month, 1);
    final daysInMonth = DateTime(_currentMonth.year, _currentMonth.month + 1, 0).day;
    final startingWeekday = firstDayOfMonth.weekday - 1;

    List<Widget> dayWidgets = [];

    // Add empty cells for days before the first of the month
    for (int i = 0; i < startingWeekday; i++) {
      dayWidgets.add(Container(width: _dayCellSize + 6.3, height: _dayCellSize));
    }

    // Add day cells
    for (int day = 1; day <= daysInMonth; day++) {
      final currentDay = DateTime(_currentMonth.year, _currentMonth.month, day);
      final isCheckIn = _checkInDate != null && _isSameDay(currentDay, _checkInDate!);
      final isCheckOut = _checkOutDate != null && _isSameDay(currentDay, _checkOutDate!);
      final isInRange = _checkInDate != null &&
          _checkOutDate != null &&
          currentDay.isAfter(_checkInDate!) &&
          currentDay.isBefore(_checkOutDate!);

      dayWidgets.add(
        GestureDetector(
          onTap: () => _handleDaySelected(currentDay),
          child: Container(
            width: _dayCellSize,
            height: _dayCellSize,
            margin: EdgeInsets.all(3.1),
            decoration: BoxDecoration(
              color: isCheckIn || isCheckOut
                  ? Color(0xFF16F1FA)
                  : isInRange
                  ? Color(0xFFBCBABE)
                  : null,
              borderRadius: BorderRadius.circular(_dayCellSize / 2),
            ),
            child: Center(
              child: Text(
                day.toString(),
                style: TextStyle(
                  fontFamily: 'Lato Semibold',
                  color: isCheckIn || isCheckOut ? Colors.white : Colors.black,
                  fontWeight: isCheckIn || isCheckOut ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ),
          ),
        ),
      );
    }

    // Create rows of 7 days each
    List<Widget> rows = [];
    for (int i = 0; i < dayWidgets.length; i += 7) {
      int end = i + 7;
      if (end > dayWidgets.length) end = dayWidgets.length;
      rows.add(
        Row(
          children: dayWidgets.sublist(i, end),
        ),
      );
    }

    return Column(children: rows);
  }

  Widget _buildDateInfo(String label, DateTime? date) {
    return Container(
      width: 170,
      height: 120,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: Color(0xFFBCBABE),
          width: 1,
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: TextStyle(
              fontFamily: 'Lato',
              fontWeight: FontWeight.bold,
              fontSize: 16,
              color: Colors.grey[600],
            ),
          ),
          SizedBox(height: 8),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                onPressed: () => _showDatePicker(context, label == 'Check-in date'),
                icon: Icon(Icons.calendar_month),
              ),
              SizedBox(width: 8),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: date != null ? Colors.blue[50] : null,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  date != null ? DateFormat('MMM d').format(date) : '--/--',
                  style: TextStyle(
                    fontFamily: 'Lato Semibold',
                    fontSize: 16,
                    color: date != null ? Colors.blue[800] : Colors.grey[500],
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showDatePicker(BuildContext context, bool isCheckIn) async {
    final DateTime now = DateTime.now();
    final DateTime initialDate = isCheckIn
        ? (_checkInDate ?? now)
        : (_checkOutDate ?? _checkInDate ?? now);

    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: isCheckIn ? now : (_checkInDate ?? now),
      lastDate: now.add(Duration(days: 365)),
    );

    if (picked != null) {
      if (!isCheckIn && picked.isBefore(_checkInDate!)) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Check-out date must be after check-in date'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      setState(() {
        if (isCheckIn) {
          _checkInDate = picked;
          if (_checkOutDate != null && _checkOutDate!.isBefore(picked)) {
            _checkOutDate = null;
          }
        } else {
          _checkOutDate = picked;
        }
      });
    }
  }

  void _handleDaySelected(DateTime selectedDay) {
    if (_checkInDate == null || (_checkInDate != null && _checkOutDate != null)) {
      setState(() {
        _checkInDate = selectedDay;
        _checkOutDate = null;
      });
    } else if (selectedDay.isAfter(_checkInDate!)) {
      setState(() {
        _checkOutDate = selectedDay;
      });
    } else {
      setState(() {
        _checkInDate = selectedDay;
        _checkOutDate = null;
      });
    }
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }
}

extension TimeOfDayExtension on TimeOfDay {
  String format(BuildContext context) {
    return MaterialLocalizations.of(context).formatTimeOfDay(this);
  }
}