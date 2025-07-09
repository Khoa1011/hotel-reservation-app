import 'package:doan_datphong/Helper/FormatCurrency.dart';
import 'package:doan_datphong/Views/selectDate_View/guest_counter_widget.dart';
import 'package:flutter/material.dart';

import '../../Data/Repository/addressService_Repository/addressService_repo.dart';
import '../../Helper/FormatDateTime.dart';
import '../../generated/l10n.dart';

class FilterModal extends StatefulWidget {
  final Map<String, dynamic> currentFilters;
  final Function(Map<String, dynamic>) onFiltersApplied;
  final VoidCallback? onReset;

  const FilterModal({
    super.key,
    required this.currentFilters,
    required this.onFiltersApplied,
    this.onReset,
  });

  @override
  _FilterModalState createState() => _FilterModalState();
}

class _FilterModalState extends State<FilterModal> {
  late Map<String, dynamic> _filters;

  final List<String> _sortOptions = ['Highest Popularity', 'Highest Price', 'Lowest Price'];
  // Filter values
  int _adults = 2;
  int _children = 0;
  int _rooms = 1;
  DateTime? checkInDate;
  DateTime? checkOutDate;
  String? _bookingType;

  // Location
  Province? _selectedProvince;
  Ward? _selectedWard;
  List<Province> provinces = [];
  List<Ward> wards = [];

  // Loading states
  bool isLoadingProvinces = true;
  bool isLoadingWards = false;
  String? errorProvince;
  String? errorWard;

  @override
  void initState() {
    super.initState();
    loadProvinces();
    _filters = Map.from(widget.currentFilters);

    // Initialize price range
    _filters['priceRange'] ??= {'min': 50000.0, 'max': 2000000.0};

    // Initialize from currentFilters
    _adults = _filters['guests'] ?? 2;
    _rooms = _filters['rooms'] ?? 1;
    if (_filters['checkIn'] != null && _filters['checkIn'] is String) {
      checkInDate = DateTimeHelper.formatStringToDateTime(_filters['checkIn']);
    }

    if (_filters['checkOut'] != null && _filters['checkOut'] is String) {
      checkOutDate = DateTimeHelper.formatStringToDateTime(_filters['checkOut']);
    }
    _bookingType = _filters['bookingType'];
  }

  Future<void> loadProvinces() async {
    try {
      setState(() {
        isLoadingProvinces = true;
        errorProvince = null;
      });

      final loadedProvinces = await AddressService.getProvinces();
      setState(() {
        provinces = loadedProvinces;
        isLoadingProvinces = false;
      });
    } catch (e) {
      setState(() {
        isLoadingProvinces = false;
        errorProvince = 'Không thể tải danh sách tỉnh/thành phố';
      });
    }
  }

  Future<void> loadWards(String districtCode) async {
    try {
      setState(() {
        isLoadingWards = true;
        wards = [];
        _selectedWard = null;
        errorWard = null;
      });

      final loadedWards = await AddressService.getWards(districtCode);
      setState(() {
        wards = loadedWards;
        isLoadingWards = false;
      });
    } catch (e) {
      setState(() {
        isLoadingWards = false;
        errorWard = 'Không thể tải danh sách phường/xã';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ],
            ),
          ),

          const Text(
            'Bộ lọc tìm kiếm',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),

          const SizedBox(height: 20),

          // Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // _buildSortSection(),
                  const SizedBox(height: 24),
                  _buildLocationSection(),
                  const SizedBox(height: 24),
                  _buildPriceRangeSection(),
                  const SizedBox(height: 24),
                  _buildSelectDateIn_Out(context),
                  const SizedBox(height: 24),
                  _buildGuestCounter(context),
                  const SizedBox(height: 24),

                  // ✅ Preview section (không gọi API)
                  _buildFilterPreview(),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),

          // Bottom buttons
          Container(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _resetFilters,
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFF1565C0)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: const Text(
                      'Đặt lại',
                      style: TextStyle(
                        color: Color(0xFF1565C0),
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: _applyFilters,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1565C0),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: const Text(
                      'Áp dụng bộ lọc',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
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


  Widget _buildSortSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          S.of(context).sortResults,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _sortOptions.map((option) {
            final isSelected = _filters['sortBy'] == option;
            return FilterChip(
              label: Text(
                option,
                style: TextStyle(
                  color: isSelected ? Colors.white : const Color(0xFF1565C0),
                  fontWeight: FontWeight.w500,
                ),
              ),
              selected: isSelected,
              onSelected: (selected) {
                setState(() {
                  if(selected){
                    _filters['sortBy'] = option;
                  }else{
                    _filters['sortBy'] = "";
                  }
                });
              },
              backgroundColor: Colors.white,
              selectedColor: const Color(0xFF1565C0),
              checkmarkColor: Colors.white,
              side: const BorderSide(
                color: Color(0xFF1565C0),
                width: 1,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  // ✅ Widget preview filter parameters (không gọi API)
  Widget _buildFilterPreview() {
    final hasFilters = _selectedProvince != null ||
        checkInDate != null ||
        checkOutDate != null ||
        _adults + _children > 2 ||
        _rooms > 1;

    if (!hasFilters) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: Row(
          children: [
            Icon(
              Icons.tune,
              color: Colors.grey[600],
              size: 20,
            ),
            SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Xem trước bộ lọc',
                    style: TextStyle(
                      color: Colors.grey[700],
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Thiết lập các tiêu chí tìm kiếm ở trên',
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.preview,
                color: Color(0xFF1565C0),
                size: 20,
              ),
              SizedBox(width: 8),
              Text(
                'Bộ lọc đã chọn',
                style: TextStyle(
                  color: Color(0xFF1565C0),
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          SizedBox(height: 12),

          // Location preview
          if (_selectedProvince != null)
            _buildPreviewItem(
              icon: Icons.location_on,
              label: 'Khu vực',
              value: _buildLocationSummary(),
            ),

          // Date preview
          if (checkInDate != null && checkOutDate != null)
            _buildPreviewItem(
              icon: Icons.calendar_today,
              label: 'Thời gian',
              value: '${DateTimeHelper.formatDateToString2(checkInDate?? DateTime.now())} - ${DateTimeHelper.formatDateToString2(checkOutDate?? DateTime.now())}',
            ),

          // Guests preview
          if (_adults + _children > 2 || _rooms > 1)
            _buildPreviewItem(
              icon: Icons.people,
              label: 'Khách & phòng',
              value: '${_adults + _children} khách, $_rooms phòng',
            ),

          // Price preview
          _buildPreviewItem(
            icon: Icons.attach_money,
            label: 'Giá',
            value: _buildPriceRangeSummary(),
          ),
        ],
      ),
    );
  }

  Widget _buildPreviewItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Color(0xFF1565C0)),
          SizedBox(width: 8),
          Text(
            '$label: ',
            style: TextStyle(
              color: Color(0xFF1565C0),
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                color: Color(0xFF1565C0),
                fontSize: 12,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  String _buildPriceRangeSummary() {
    final priceRange = _filters['priceRange'] as Map<String, double>;
    return '${CurrencyHelper.formatVND(priceRange['min']!)} - ${CurrencyHelper.formatVND(priceRange['max']!)}';
  }

  Widget _buildGuestCounter(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(8.0),
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
    );
  }

  Widget _buildPriceRangeSection() {
    final priceRange = _filters['priceRange'] as Map<String, double>;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          S.of(context).priceRange,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF1565C0),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                CurrencyHelper.formatVND(priceRange['min']!),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF1565C0),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                CurrencyHelper.formatVND(priceRange['max']!),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        RangeSlider(
          values: RangeValues(priceRange['min']!, priceRange['max']!),
          min: 50000,
          max: 5000000,
          divisions: 99,
          activeColor: const Color(0xFF1565C0),
          inactiveColor: Colors.grey[300],
          onChanged: (values) {
            setState(() {
              _filters['priceRange'] = {
                'min': values.start,
                'max': values.end,
              };
            });
          },
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('50k', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
              Text('5M', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildLocationSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.location_on, color: Color(0xFF1565C0), size: 20),
            SizedBox(width: 8),
            Text(
              'Khu vực',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Province Dropdown
        _buildDropdown<Province>(
          hint: 'Chọn Tỉnh/Thành phố',
          value: _selectedProvince,
          items: provinces,
          getLabel: (province) => province.name,
          onChanged: (province) {
            setState(() {
              _selectedProvince = province;
              _selectedWard = null;
              wards = [];
            });

            if (province != null) {
              loadWards(province.code);
            }
          },
          isLoading: isLoadingProvinces,
          errorText: errorProvince,
        ),

        const SizedBox(height: 12),

        // Ward Dropdown
        _buildDropdown<Ward>(
          hint: 'Chọn Phường/Xã',
          value: _selectedWard,
          items: wards,
          getLabel: (ward) => ward.name,
          onChanged: (ward) {
            setState(() {
              _selectedWard = ward;
            });
          },
          isLoading: isLoadingWards,
          errorText: errorWard,
          enabled: _selectedProvince != null,
        ),

        // Location Summary
        if (_selectedProvince != null || _selectedWard != null)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Color(0xFF1565C0).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Color(0xFF1565C0).withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Icon(Icons.location_on_outlined, color: Color(0xFF1565C0), size: 16),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _buildLocationSummary(),
                      style: TextStyle(
                        color: Color(0xFF1565C0),
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: _clearLocationSelection,
                    child: Icon(Icons.clear, color: Color(0xFF1565C0), size: 18),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  String _buildLocationSummary() {
    List<String> parts = [];
    if (_selectedWard != null) parts.add(_selectedWard!.name);
    if (_selectedProvince != null) parts.add(_selectedProvince!.name);
    return parts.isNotEmpty ? parts.join(', ') : '';
  }

  void _clearLocationSelection() {
    setState(() {
      _selectedProvince = null;
      _selectedWard = null;
      wards = [];
    });
  }

  Widget _buildDropdown<T>({
    required String hint,
    required T? value,
    required List<T> items,
    required String Function(T) getLabel,
    required void Function(T?) onChanged,
    required bool isLoading,
    String? errorText,
    bool enabled = true,
  }) {
    return DropdownButtonFormField<T>(
      value: value,
      hint: Text(hint, style: TextStyle(fontStyle: FontStyle.italic, fontWeight: FontWeight.w500)),
      decoration: InputDecoration(
        filled: true,
        fillColor: enabled ? Color(0xFFF1F1F1) : Colors.grey[200],
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Color(0xFF1565C0), width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.red),
        ),
        errorText: errorText,
        suffixIcon: isLoading
            ? SizedBox(
          width: 20,
          height: 20,
          child: Padding(
            padding: EdgeInsets.all(12),
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        )
            : null,
      ),
      items: enabled && !isLoading
          ? items.map((item) {
        return DropdownMenuItem<T>(
          value: item,
          child: Text(getLabel(item), style: TextStyle(fontWeight: FontWeight.normal)),
        );
      }).toList()
          : [],
      onChanged: enabled && !isLoading ? onChanged : null,
    );
  }

  //------------------------------------
  Widget _buildSelectDateIn_Out(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Check-In Section
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              S.of(context).checkInDate,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        SizedBox(height: 8),
        GestureDetector(
          onTap: () => _selectCheckInDate(context),
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  checkInDate != null
                      ? DateTimeHelper.formatDateToString2(checkInDate!)
                      : S.of(context).selectYourArrivalDate,
                  style: TextStyle(
                    fontSize: 14,
                    color: checkInDate != null ? Colors.black : Colors.grey,
                  ),
                ),
                Icon(
                  Icons.calendar_today,
                  size: 20,
                  color: Colors.grey.shade600,
                ),
              ],
            ),
          ),
        ),

        SizedBox(height: 20),

        // Check-Out Section
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              S.of(context).checkOutDate,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        SizedBox(height: 8),
        GestureDetector(
          onTap: () => _selectCheckOutDate(context),
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  checkOutDate != null
                      ? DateTimeHelper.formatDateToString2(checkOutDate!)
                      : S.of(context).selectTravelDate,
                  style: TextStyle(
                    fontSize: 14,
                    color: checkOutDate != null ? Colors.black : Colors.grey,
                  ),
                ),
                Icon(
                  Icons.calendar_today,
                  size: 20,
                  color: Colors.grey.shade600,
                ),
              ],
            ),
          ),
        ),

        // Hiển thị số đêm nếu có đủ ngày
        if (checkInDate != null && checkOutDate != null)
          Container(
            width: double.infinity,
            margin: EdgeInsets.only(top: 10,left: 20,right: 20),
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Color(0xFF1565C0).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Color(0xFF1565C0).withOpacity(0.3)),
            ),
            child: Text(
              "${S.of(context).numberOfDays}: ${_buildDayText(context)}",
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF1565C0),
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
          ),
      ],
    );
  }


  Future<void> _selectCheckInDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: checkInDate ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(Duration(days: 365)),
      helpText: S.of(context).selectYourArrivalDate,
      cancelText: S.of(context).cancel,
      confirmText: S.of(context).confirm,
    );

    if (picked != null && picked != checkInDate) {
      setState(() {
        checkInDate = picked;
        // Nếu ngày đi đã chọn và nhỏ hơn ngày đến, reset ngày đi
        if (checkOutDate != null && checkOutDate!.isBefore(picked)) {
          checkOutDate = null;
        }
      });
    }
  }


  Future<void> _selectCheckOutDate(BuildContext context) async {
    DateTime firstDate = checkInDate != null
        ? checkInDate!.add(Duration(days: 1))
        : DateTime.now().add(Duration(days: 1));

    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: checkOutDate ?? firstDate,
      firstDate: firstDate,
      lastDate: DateTime.now().add(Duration(days: 365)),
      helpText: "Chọn ngày đi",
      cancelText: "Hủy",
      confirmText: "Xác nhận",
    );

    if (picked != null && picked != checkOutDate) {
      setState(() {
        checkOutDate = picked;
      });
    }
  }


  int _calculateNights() {
    if (checkInDate != null && checkOutDate != null) {
      return checkOutDate!.difference(checkInDate!).inDays;
    }
    return 0;
  }

  String _buildDayText(BuildContext context) {
    // Lấy ngôn ngữ hiện tại
    final locale = Localizations.localeOf(context);
    final isVietnamese = locale.languageCode == 'vi';
    final nightCount = _calculateNights();

    if (isVietnamese) {
      // TIẾNG VIỆT - Không cần thêm 's'
      return '$nightCount ngày';
    } else {
      // TIẾNG ANH - Cần thêm 's' cho số nhiều
      return '$nightCount day${nightCount > 1 ? 's' : ''}';
    }
  }


  //--------------------------------------------

  // ✅ Build search parameters từ current filters
  Map<String, dynamic> _buildSearchParams() {
    final params = <String, dynamic>{};

    // Location
    if (_selectedProvince != null) {
      params['tinhThanh'] = _selectedProvince!.name;
    }
    if (_selectedWard != null) {
      params['phuongXa'] = _selectedWard!.name;
    }

    // Price range
    if (_filters['priceRange'] != null) {
      final priceRange = _filters['priceRange'] as Map<String, double>;
      params['minPrice'] = priceRange['min']!.toDouble();
      params['maxPrice'] = priceRange['max']!.toDouble();
    }

    // Guests and rooms
    params['guests'] = _adults + _children;
    params['rooms'] = _rooms;

    // Dates
    if (checkInDate != null) {
      String formatedCheckInDate = DateTimeHelper.formatDateToString2(checkInDate!);
      params['checkIn'] = formatedCheckInDate;
    }
    if (checkOutDate != null) {
      String formatedCheckOutDate = DateTimeHelper.formatDateToString2(checkOutDate!);
      params['checkOut'] = formatedCheckOutDate;
    }
    if (_bookingType != null) params['bookingType'] = _bookingType;
    if (_filters['sortBy'] != null) {
      params['sortBy'] = _filters['sortBy'];
    }

    return params;
  }

  void _resetFilters() {
    setState(() {
      _filters = {
        'priceRange': {'min': 100000.0, 'max': 2000000.0},
      };
      _selectedProvince = null;
      _selectedWard = null;
      wards = [];
      _adults = 2;
      _children = 0;
      _rooms = 1;

      checkInDate = null;
      checkOutDate = null;
      _bookingType = null;

    });

    if (widget.onReset != null) {
      widget.onReset!();
    }
  }

  void _applyFilters() {
    final apiFilters = _buildSearchParams();
    print('🔧 API filters being sent: $apiFilters');
    widget.onFiltersApplied(apiFilters);
    Navigator.pop(context);
  }
}