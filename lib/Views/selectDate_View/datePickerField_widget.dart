import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
class DatePickerField extends StatefulWidget {
  @override
  _DatePickerFieldState createState() => _DatePickerFieldState();
}

class _DatePickerFieldState extends State<DatePickerField> {
  DateTime? _selectedDate;
  final TextEditingController _dateController = TextEditingController();

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
        _dateController.text = DateFormat('MMM d').format(picked);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: _dateController,
      readOnly: true,
      decoration: InputDecoration(
        labelText: 'Chọn ngày',
        suffixIcon: IconButton(
          icon: Icon(Icons.calendar_today, size: 20),
          onPressed: () => _selectDate(context),
        ),
        border: OutlineInputBorder(),
      ),
      style: TextStyle(
        fontFamily: 'Lato Semibold',
        fontSize: 16,
      ),
      onTap: () => _selectDate(context), // Mở date picker khi nhấn vào field
    );
  }

  @override
  void dispose() {
    _dateController.dispose();
    super.dispose();
  }
}