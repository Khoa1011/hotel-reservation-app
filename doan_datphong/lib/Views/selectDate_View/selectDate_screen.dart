import 'package:doan_datphong/Views/components/NotificationDialog.dart';
import 'package:doan_datphong/Views/listRoom_View/listRoom_screen.dart';
import 'package:doan_datphong/Views/selectDate_View/datePickerField_widget.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:doan_datphong/generated/l10n.dart';

import 'guest_counter_widget.dart';

enum BookingType {
  theo_gio,    // Theo giờ
  qua_dem,     // Qua đêm
  dai_ngay     // Dài ngày
}

class SelectDateScreen extends StatefulWidget {
  @override
  _SelectDateState createState() => _SelectDateState();
}

class _SelectDateState extends State<SelectDateScreen> with TickerProviderStateMixin {
  DateTime? _checkInDate;
  DateTime? _checkOutDate;
  DateTime _currentMonth = DateTime.now();
  final double _dayCellSize = 47.0;
  TimeOfDay? _selectedCheckInTime;
  TimeOfDay? _selectedCheckOutTime;
  int _adults = 2;
  int _children = 0;
  int _rooms = 1;

  // Booking type management
  BookingType _selectedBookingType = BookingType.qua_dem;
  late TabController _tabController;

  // Hourly booking specific
  int _selectedHours = 1; // Minimum 3 hours for hourly booking

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this, initialIndex: 1); // Start with qua_dem
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() {
          _selectedBookingType = BookingType.values[_tabController.index];
          _resetDateTimeForBookingType();
        });
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _resetDateTimeForBookingType() {
    switch (_selectedBookingType) {
      case BookingType.theo_gio:
      // For hourly: same date for check-in and check-out
        _checkOutDate = _checkInDate;
        _selectedCheckInTime = null;
        _selectedCheckOutTime = null;
        break;
      case BookingType.qua_dem:
      // For overnight: check-out next day
        if (_checkInDate != null) {
          _checkOutDate = _checkInDate!.add(Duration(days: 1));
        }
        _selectedCheckInTime = TimeOfDay(hour: 22, minute: 0); // Default 22 PM
        _selectedCheckOutTime = TimeOfDay(hour: 12, minute: 0); // Default 12 PM
        break;
      case BookingType.dai_ngay:
      // For long stay: keep existing dates or set default
        _selectedCheckInTime = TimeOfDay(hour: 14, minute: 0);
        _selectedCheckOutTime = TimeOfDay(hour: 12, minute: 0);
        break;
    }
  }

  void _changeMonth(int delta) {
    final newMonth = DateTime(_currentMonth.year, _currentMonth.month + delta);
    final now = DateTime.now();
    final currentMonthStart = DateTime(now.year, now.month, 1);

    if (newMonth.isBefore(currentMonthStart)) {
      return;
    }

    setState(() {
      _currentMonth = newMonth;
    });
  }

  void eventClickButtonAplly() {
    if (_checkInDate == null) {
      NotificationDialog.showInfo(context, message: S.of(context).checkInDateNotSelected);
      return;
    }

    // Validation based on booking type
    if (_selectedBookingType == BookingType.theo_gio) {
      if (_selectedCheckInTime == null || _selectedCheckOutTime == null) {
        NotificationDialog.showInfo(context, message: S.of(context).messageSelectDateTimeCheckIn);
        return;
      }

      // Check minimum hours
      final checkInMinutes = _selectedCheckInTime!.hour * 60 + _selectedCheckInTime!.minute;
      final checkOutMinutes = _selectedCheckOutTime!.hour * 60 + _selectedCheckOutTime!.minute;
      var hoursDiff = (checkOutMinutes - checkInMinutes) / 60;

      if (hoursDiff <= 0) {
        hoursDiff += 24; // Next day checkout
      }

      if (hoursDiff < 1) {
        NotificationDialog.showInfo(context, message: S.of(context).minimumHour);
        return;
      }
    } else {
      if (_checkOutDate == null) {
        NotificationDialog.showInfo(context, message: S.of(context).checkOutDateNotSelected);
        return;
      }

      if (_selectedCheckInTime == null) {
        NotificationDialog.showInfo(context, message: S.of(context).checkInTimeNotSelected);
        return;
      }
    }

    final result = _buildBookingResult();
    _saveDateTime();
    Navigator.pop(context, result);
  }

  Map<String, dynamic> _buildBookingResult() {
    final formattedDateCheckIn = DateFormat('dd/MM').format(_checkInDate!);
    final timeCheckInPicked = _formatTime(_selectedCheckInTime!);
    final formattedCheckInDateRouter = DateFormat('yyyy-MM-dd').format(_checkInDate!);

    Map<String, dynamic> result = {
      "bookingType": _selectedBookingType.toString().split('.').last,
      "checkInDateRouter": formattedCheckInDateRouter,
      "adults": _adults.toString(),
      "children": _children.toString(),
      "rooms": _rooms.toString(),
      "totalGuests": (_adults + _children).toString(),
    };


    switch (_selectedBookingType) {
      case BookingType.theo_gio:
        final timeCheckOutPicked = _formatTime(_selectedCheckOutTime!);
        result.addAll({
          "timeCheckInRouter":timeCheckInPicked,
          "timeCheckOutRouter":timeCheckOutPicked,
          "dateCheckIn": "$timeCheckInPicked, $formattedDateCheckIn",
          "dateCheckOut": "$timeCheckOutPicked, $formattedDateCheckIn", // Same day
          "checkOutDateRouter": formattedCheckInDateRouter, // Same day
          "selectedHours": _selectedHours.toString(),
          "unit": "gio"
        });
        break;

      case BookingType.qua_dem:
        final formattedDateCheckOut = DateFormat('dd/MM').format(_checkOutDate!);
        final formattedCheckoutDateRouter = DateFormat('yyyy-MM-dd').format(_checkOutDate!);
        final timeCheckOutPicked = _selectedCheckOutTime != null ? _formatTime(_selectedCheckOutTime!) : "12:00";

        result.addAll({
          "timeCheckInRouter":timeCheckInPicked,

          "dateCheckIn": "$timeCheckInPicked, $formattedDateCheckIn",
          "dateCheckOut": "$timeCheckOutPicked, $formattedDateCheckOut",
          "checkOutDateRouter": formattedCheckoutDateRouter,
          "nights": _checkOutDate!.difference(_checkInDate!).inDays.toString(),
          "unit": "dem"
        });
        break;

      case BookingType.dai_ngay:
        final formattedDateCheckOut = DateFormat('dd/MM').format(_checkOutDate!);
        final formattedCheckoutDateRouter = DateFormat('yyyy-MM-dd').format(_checkOutDate!);
        final timeCheckOutPicked = _selectedCheckOutTime != null ? _formatTime(_selectedCheckOutTime!) : "12:00";

        result.addAll({
          "timeCheckInRouter":timeCheckInPicked,
          "timeCheckOutRouter":timeCheckOutPicked,
          "dateCheckIn": "$timeCheckInPicked, $formattedDateCheckIn",
          "dateCheckOut": "$timeCheckOutPicked, $formattedDateCheckOut",
          "checkOutDateRouter": formattedCheckoutDateRouter,
          "days": _checkOutDate!.difference(_checkInDate!).inDays.toString(),
          "unit": "ngay"
        });
        break;
    }
print("ket qua da chon: ${result}");
    return result;
  }

  Future<void> _saveDateTime() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setString("bookingType", _selectedBookingType.toString().split('.').last);
    await prefs.setString("checkInDate", _checkInDate.toString());
    await prefs.setString("checkOutDate", (_checkOutDate ?? _checkInDate).toString());
    await prefs.setString("checkInTime", '${_selectedCheckInTime?.hour.toString().padLeft(2, '0')}:${_selectedCheckInTime?.minute.toString().padLeft(2, '0')}');
    if (_selectedCheckOutTime != null) {
      await prefs.setString("checkOutTime", '${_selectedCheckOutTime?.hour.toString().padLeft(2, '0')}:${_selectedCheckOutTime?.minute.toString().padLeft(2, '0')}');
    }
    await prefs.setInt("adults", _adults);
    await prefs.setInt("children", _children);
    await prefs.setInt("rooms", _rooms);
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final currentMonthStart = DateTime(now.year, now.month, 1);
    final canGoPrevious = _currentMonth.isAfter(currentMonthStart);

    return SafeArea(
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            S.of(context).selectDatesAndTimeCheckIn,
            style: TextStyle(
              fontFamily: 'Lato',
              fontSize: 25,
              fontWeight: FontWeight.bold,
            ),
          ),
          centerTitle: true,
          elevation: 0,
          bottom: PreferredSize(
            preferredSize: Size.fromHeight(50),
            child: Container(
              color: Colors.white,
              child: TabBar(
                controller: _tabController,
                indicatorColor: Color(0xFF1565C0),
                indicatorWeight: 3,
                labelColor: Color(0xFF1565C0),
                unselectedLabelColor: Colors.grey[600],
                labelStyle: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
                unselectedLabelStyle: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.normal,
                ),
                tabs: [
                  Tab(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.access_time, size: 20),
                        SizedBox(height: 2),
                        Text(S.of(context).hourly),
                      ],
                    ),
                  ),
                  Tab(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.nights_stay, size: 20),
                        SizedBox(height: 2),
                        Text(S.of(context).overnight),
                      ],
                    ),
                  ),
                  Tab(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.calendar_month, size: 20),
                        SizedBox(height: 2),
                        Text(S.of(context).longDays),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        body: Stack(
          children: [
            SingleChildScrollView(
              padding: const EdgeInsets.only(
                left: 8.0,
                right: 8.0,
                top: 8.0,
                bottom: 80.0,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Booking type info banner
                  _buildBookingTypeInfo(),

                  SizedBox(height: 16),

                  // Month Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        onPressed: canGoPrevious ? () => _changeMonth(-1) : null,
                        icon: Icon(
                          Icons.chevron_left,
                          color: canGoPrevious ? null : Colors.grey[400],
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4.0),
                        child: Text(
                          DateFormat('MM / yyyy').format(_currentMonth),
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: () => _changeMonth(1),
                        icon: Icon(Icons.chevron_right),
                      ),
                    ],
                  ),

                  // Weekday Headers
                  Row(
                    children: [
                      S.of(context).thu2_Monday,
                      S.of(context).thu3_Tuesday,
                      S.of(context).thu4_Wednesday,
                      S.of(context).thu5_Thursday,
                      S.of(context).thu6_Friday,
                      S.of(context).thu7_Saturday,
                      S.of(context).cn_Sunday
                    ].map((day) => Expanded(
                      child: Container(
                        margin: EdgeInsets.symmetric(horizontal: 1.0),
                        child: Center(
                          child: Text(
                            day,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: Colors.black,
                            ),
                          ),
                        ),
                      ),
                    )).toList(),
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

                  // Date selection based on booking type
                  _buildDateTimeSelection(),

                  SizedBox(height: 10),

                  // Guest counter
                  Container(
                    padding: const EdgeInsets.all(16.0),
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: GuestCounterWidget(
                      adults: _adults,
                      children: _children,
                      rooms: _rooms,
                      onGuestChanged: (adults, children, rooms) {
                        setState(() {
                          _adults = adults;
                          _children = children;
                          _rooms = rooms;
                        });
                      },
                      title: S.of(context).guestsRooms,
                    ),
                  ),
                ],
              ),
            ),

            // Apply button
            Positioned(
              left: 16,
              right: 16,
              bottom: 16,
              child: Container(
                decoration: BoxDecoration(
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 10,
                      spreadRadius: 2,
                      offset: Offset(0, -2),
                    ),
                  ],
                ),
                child: ElevatedButton(
                  onPressed: eventClickButtonAplly,
                  style: ElevatedButton.styleFrom(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: Color(0xFF1565C0),
                    elevation: 4,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    S.of(context).apply,
                    style: TextStyle(

                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBookingTypeInfo() {
    String title, description, icon;
    Color color;

    switch (_selectedBookingType) {
      case BookingType.theo_gio:
        title = S.of(context).rentByTheHour;
        description = S.of(context).rentByTheHourNote;
        icon = "⏰";
        color = Colors.orange;
        break;
      case BookingType.qua_dem:
        title = S.of(context).rentOvernight;
        description = S.of(context).rentOvernightNote;
        icon = "🌙";
        color = Colors.blue;
        break;
      case BookingType.dai_ngay:
        title = S.of(context).rentLongDays;
        description = S.of(context).rentLongDaysNote;
        icon = "📅";
        color = Colors.green;
        break;
    }

    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.2),
              borderRadius: BorderRadius.circular(50),
            ),
            child: Text(
              icon,
              style: TextStyle(fontSize: 24),
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
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[700],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDateTimeSelection() {
    switch (_selectedBookingType) {
      case BookingType.theo_gio:
        return _buildHourlySelection();
      case BookingType.qua_dem:
        return _buildOvernightSelection();
      case BookingType.dai_ngay:
        return _buildLongStaySelection();
    }
  }

  Widget _buildHourlySelection() {
    return Column(
      children: [
        // Date selection
        Container(
          padding: EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey[300],
            borderRadius: BorderRadius.circular(8),
          ),
          child: _buildDateInfo(S.of(context).dateOfUse, _checkInDate),
        ),

        SizedBox(height: 10),

        // Time selection
        Container(
          padding: const EdgeInsets.all(16.0),
          decoration: BoxDecoration(
            color: Colors.grey[300],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                S.of(context).selecteTime,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildTimeSelector(S.of(context).checkInTime, _selectedCheckInTime, (time) {
                      setState(() {
                        _selectedCheckInTime = time;
                        _calculateHourlyCheckOut();
                      });
                    }),
                  ),
                  SizedBox(width: 12),
                  Expanded(
                    child: _buildTimeSelector(S.of(context).checkOutTime, _selectedCheckOutTime, (time) {
                      setState(() {
                        _selectedCheckOutTime = time;
                      });
                    }),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildOvernightSelection() {
    return Column(
      children: [
        // Check-in/Check-out dates
        Container(
          padding: EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey[300],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildDateInfo(S.of(context).checkInDate, _checkInDate),
              _buildDateInfo(S.of(context).checkOutDate, _checkOutDate),
            ],
          ),
        ),

        SizedBox(height: 10),

        // Time selection
        Container(
          padding: const EdgeInsets.all(16.0),
          decoration: BoxDecoration(
            color: Colors.grey[300],
            borderRadius: BorderRadius.circular(8),
          ),
          // child: PillTimePickerWidget(
          //   title: S.of(context).hourCheckInTime,
          //   selectedTime: _selectedCheckInTime,
          //   onTimeSelected: (time) {
          //     setState(() {
          //       _selectedCheckInTime = time;
          //     });
          //   },
          // ),
          child: OvernightTimePickerWidget(
            selectedTime: _selectedCheckInTime,
            onTimeSelected: (time) {
              setState(() {
                _selectedCheckInTime = time;
              });
            },
            title: 'Chọn giờ qua đêm',
          )
        ),
      ],
    );
  }

  Widget _buildLongStaySelection() {
    return Column(
      children: [
        // Check-in/Check-out dates
        Container(
          padding: EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey[300],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildDateInfo(S.of(context).checkInDate, _checkInDate),
              _buildDateInfo(S.of(context).checkOutDate, _checkOutDate),
            ],
          ),
        ),

        SizedBox(height: 10),

        // Time selection
        Container(
          padding: const EdgeInsets.all(16.0),
          decoration: BoxDecoration(
            color: Colors.grey[300],
            borderRadius: BorderRadius.circular(8),
          ),
          child: PillTimePickerWidget(
            title: S.of(context).hourCheckInTime,
            selectedTime: _selectedCheckInTime,
            onTimeSelected: (time) {
              setState(() {
                _selectedCheckInTime = time;
              });
            },
          ),
        ),

        // Duration info
        if (_checkInDate != null && _checkOutDate != null)
          Container(
            margin: EdgeInsets.only(top: 10),
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.blue[200]!),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.info_outline, color: Colors.blue[800], size: 20),
                SizedBox(width: 8),
                Text(
                  "${S.of(context).total} ${_buildSummaryText(context)}",
                  style: TextStyle(
                    color: Colors.blue[800],
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  String _buildSummaryText(BuildContext context) {
    final locale = Localizations.localeOf(context);
    final isVietnamese = locale.languageCode == 'vi';

    final totalDays = _checkOutDate!.difference(_checkInDate!).inDays;

    if (isVietnamese) {
      return '$totalDays ngày';
    } else {
      return '$totalDays day${totalDays > 1 ? 's' : ''}';
    }
  }

  Widget _buildTimeSelector(String label, TimeOfDay? selectedTime, Function(TimeOfDay) onTimeSelected) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.grey[700],
          ),
        ),
        SizedBox(height: 8),
        GestureDetector(
          onTap: () async {
            final time = await showTimePicker(
              context: context,
              initialTime: selectedTime ?? TimeOfDay.now(),
            );
            if (time != null) {
              onTimeSelected(time);
            }
          },
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey[400]!),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  selectedTime != null ? _formatTime(selectedTime) : "--:--",
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: selectedTime != null ? Colors.blue[800] : Colors.grey[500],
                  ),
                ),
                Icon(
                  Icons.access_time,
                  color: Colors.grey[600],
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _calculateHourlyCheckOut() {
    if (_selectedCheckInTime != null) {
      final checkInMinutes = _selectedCheckInTime!.hour * 60 + _selectedCheckInTime!.minute;
      final checkOutMinutes = checkInMinutes + (_selectedHours * 60);

      setState(() {
        _selectedCheckOutTime = TimeOfDay(
          hour: (checkOutMinutes ~/ 60) % 24,
          minute: checkOutMinutes % 60,
        );
      });
    }
  }

  Widget _buildCalendarGrid() {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final firstDayOfMonth = DateTime(_currentMonth.year, _currentMonth.month, 1);
    final daysInMonth = DateTime(_currentMonth.year, _currentMonth.month + 1, 0).day;
    final startingWeekday = firstDayOfMonth.weekday - 1;

    List<Widget> dayWidgets = [];

    for (int i = 0; i < startingWeekday; i++) {
      dayWidgets.add(Container(width: _dayCellSize + 6.3, height: _dayCellSize));
    }

    for (int day = 1; day <= daysInMonth; day++) {
      final currentDay = DateTime(_currentMonth.year, _currentMonth.month, day);
      final isPastDate = currentDay.isBefore(today);
      final isCheckIn = _checkInDate != null && _isSameDay(currentDay, _checkInDate!);
      final isCheckOut = _checkOutDate != null && _isSameDay(currentDay, _checkOutDate!);
      final isInRange = _checkInDate != null &&
          _checkOutDate != null &&
          currentDay.isAfter(_checkInDate!) &&
          currentDay.isBefore(_checkOutDate!);

      dayWidgets.add(
        GestureDetector(
          onTap: isPastDate ? null : () => _handleDaySelected(currentDay),
          child: Container(
            width: _dayCellSize,
            height: _dayCellSize,
            margin: EdgeInsets.all(3.1),
            decoration: BoxDecoration(
              color: isPastDate
                  ? Colors.grey[300]
                  : isCheckIn || isCheckOut
                  ? Color(0xFF1565C0)
                  : isInRange
                  ? Color(0xFFBCBABE)
                  : null,
              borderRadius: BorderRadius.circular(_dayCellSize / 2),
            ),
            child: Center(
              child: Text(
                day.toString(),
                style: TextStyle(

                  color: isPastDate
                      ? Colors.grey[500]
                      : isCheckIn || isCheckOut
                      ? Colors.white
                      : Colors.black,
                  fontWeight: isCheckIn || isCheckOut ? FontWeight.bold : FontWeight.normal,

                ),
              ),
            ),
          ),
        ),
      );
    }

    List<Widget> rows = [];
    for (int i = 0; i < dayWidgets.length; i += 7) {
      int end = i + 7;
      if (end > dayWidgets.length) end = dayWidgets.length;
      rows.add(Row(children: dayWidgets.sublist(i, end)));
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
              fontWeight: FontWeight.bold,
              fontSize: 16,
              color: Color(0xFF525150),
            ),
          ),
          SizedBox(height: 8),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                onPressed: () => _showDatePicker(context, label.contains("nhận")),
                icon: Icon(Icons.calendar_month),
              ),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 5, vertical: 6),
                decoration: BoxDecoration(
                  color: date != null ? Colors.blue[50] : null,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  date != null ? DateFormat('d / MM').format(date) : '--/--',
                  style: TextStyle(
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
    final DateTime today = DateTime(now.year, now.month, now.day);
    final DateTime initialDate = isCheckIn
        ? (_checkInDate ?? today)
        : (_checkOutDate ?? _checkInDate ?? today);

    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: initialDate.isBefore(today) ? today : initialDate,
      firstDate: isCheckIn ? today : (_checkInDate ?? today),
      lastDate: today.add(Duration(days: 365)),
    );

    if (picked != null) {
      if (picked.isBefore(today)) {
        NotificationDialog.showWarning(context, message: S.of(context).selectDateInPast);
        return;
      }

      if (!isCheckIn && picked.isBefore(_checkInDate!)) {
        NotificationDialog.showWarning(context, message: S.of(context).checkoutAfterCheckin);
        return;
      }

      // For hourly booking, check-out date must be same as check-in
      if (_selectedBookingType == BookingType.theo_gio && !isCheckIn) {
        NotificationDialog.showWarning(context, message: S.of(context).sameDayOnlyHourly);
        return;
      }

      // For overnight booking, check-out must be next day
      if (_selectedBookingType == BookingType.qua_dem && !isCheckIn && picked.difference(_checkInDate!).inDays != 1) {
        NotificationDialog.showWarning(context, message: S.of(context).overnightOnlyOneNight);
        return;
      }

      setState(() {
        if (isCheckIn) {
          _checkInDate = picked;
          _updateCheckOutBasedOnBookingType();
        } else {
          _checkOutDate = picked;
        }
      });
    }
  }

  void _updateCheckOutBasedOnBookingType() {
    switch (_selectedBookingType) {
      case BookingType.theo_gio:
        _checkOutDate = _checkInDate; // Same day
        break;
      case BookingType.qua_dem:
        _checkOutDate = _checkInDate!.add(Duration(days: 1)); // Next day
        break;
      case BookingType.dai_ngay:
      // Keep existing check-out or clear it
        if (_checkOutDate != null && _checkOutDate!.isBefore(_checkInDate!)) {
          _checkOutDate = null;
        }
        break;
    }
  }

  void _handleDaySelected(DateTime selectedDay) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    if (selectedDay.isBefore(today)) {
      NotificationDialog.showWarning(context, message: S.of(context).selectDateInPast);
      return;
    }

    setState(() {
      if (_selectedBookingType == BookingType.theo_gio) {
        // For hourly: both check-in and check-out on same day
        _checkInDate = selectedDay;
        _checkOutDate = selectedDay;
      } else if (_selectedBookingType == BookingType.qua_dem) {
        // For overnight: auto set check-out to next day
        _checkInDate = selectedDay;
        _checkOutDate = selectedDay.add(Duration(days: 1));
      } else {
        // For long stay: standard logic
        if (_checkInDate == null || (_checkInDate != null && _checkOutDate != null)) {
          _checkInDate = selectedDay;
          _checkOutDate = null;
        } else if (selectedDay.isAfter(_checkInDate!)) {
          _checkOutDate = selectedDay;
        } else if (_isSameDay(selectedDay, _checkInDate!)) {
          NotificationDialog.showWarning(context, message: S.of(context).checkoutDateMustAfterCheckinDate);
        } else {
          _checkInDate = selectedDay;
          _checkOutDate = null;
        }
      }
    });
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  String _formatTime(TimeOfDay time) {
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  // Hàm xây dựng danh sách giờ (giữ nguyên từ code cũ)
  Widget _buildTimePickerHorizontal({
    required TimeOfDay? selectedTime,
    required Function(TimeOfDay) onTimeSelected,
  }) {
    final times = List.generate(48, (index) {
      final hour = index ~/ 2;
      final minute = (index % 2) * 30;
      return TimeOfDay(hour: hour, minute: minute);
    });

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
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
                  color: isSelected ? const Color(0xFF1565C0) : const Color(0xFFE6FBFA),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isSelected ? const Color(0xFF1565C0) : const Color(0xFF0180CC),
                    width: isSelected ? 2 : 1,
                  ),
                  boxShadow: isSelected
                      ? [
                    BoxShadow(
                      color: const Color(0xFF1565C0).withOpacity(0.4),
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
}

extension TimeOfDayExtension on TimeOfDay {
  String format(BuildContext context) {
    return MaterialLocalizations.of(context).formatTimeOfDay(this);
  }
}