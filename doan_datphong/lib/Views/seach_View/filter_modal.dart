import 'package:doan_datphong/Helper/FormatCurrency.dart';
import 'package:flutter/material.dart';

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

  final List<String> _countries = ['France', 'Italia', 'Turkiye', 'Germany'];
  final List<String> _sortOptions = ['Highest Popularity', 'Highest Price', 'Lowest Price'];
  final List<String> _facilities = ['WiFi', 'Swimming Pool', 'Parking', 'Restaurant'];
  final List<String> _accommodationTypes = ['Hotels', 'Resorts', 'Villas', 'Apartments'];

  @override
  void initState() {
    super.initState();
    _filters = Map.from(widget.currentFilters);

    // Initialize default values if not present
    _filters['countries'] ??= <String>[];
    _filters['sortBy'] ??= 'Highest Popularity';
    _filters['priceRange'] ??= {'min': 100000.0, 'max': 2000000.0};
    _filters['starRating'] ??= 5;
    _filters['facilities'] ??= <String>[];
    _filters['accommodationTypes'] ??= <String>[];
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
            'Filter Hotel',
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
                  // _buildCountrySection(),
                  // const SizedBox(height: 24),
                  _buildSortSection(),
                  const SizedBox(height: 24),
                  _buildPriceRangeSection(),
                  const SizedBox(height: 24),
                  _buildStarRatingSection(),
                  const SizedBox(height: 24),
                  _buildFacilitiesSection(),
                  const SizedBox(height: 24),
                  _buildAccommodationTypeSection(),
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
                      'Reset',
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
                      'Apply Filter',
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

  Widget _buildCountrySection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Country',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              'See All',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _countries.map((country) {
            final isSelected = (_filters['countries'] as List).contains(country);
            return FilterChip(
              label: Text(
                country,
                style: TextStyle(
                  color: isSelected ? Colors.white : const Color(0xFF1565C0),
                  fontWeight: FontWeight.w500,
                ),
              ),
              selected: isSelected,
              onSelected: (selected) {
                setState(() {
                  if (selected) {
                    (_filters['countries'] as List).add(country);
                  } else {
                    (_filters['countries'] as List).remove(country);
                  }
                });
              },
              backgroundColor: Colors.white,
              selectedColor: const Color(0xFF1565C0),
              checkmarkColor: Colors.white,
              side: BorderSide(
                color: const Color(0xFF1565C0),
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

  Widget _buildSortSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Sort Results',
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

  Widget _buildPriceRangeSection() {
    final priceRange = _filters['priceRange'] as Map<String, double>;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Khoảng giá mỗi đêm (VND)', // ← Thay đổi tiêu đề
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
                CurrencyHelper.formatVND(priceRange['min']!), // ← Dùng VND formatter
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
                CurrencyHelper.formatVND(priceRange['max']!), // ← Dùng VND formatter
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
          min: 50000,      // ← 50k VND
          max: 5000000,    // ← 5M VND
          divisions: 99,   // ← 99 khoảng chia
          activeColor: const Color(0xFF1565C0),
          inactiveColor: Colors.grey[300],
          onChanged: (values) {
            setState(() {
              _filters['priceRange'] = {
                'min': values.start,
                'max': values.end,
              };
              print('🔧 Price range changed: ${CurrencyHelper.formatVND(values.start)} - ${CurrencyHelper.formatVND(values.end)}');
            });
          },
        ),

        // ✅ THÊM: Hiển thị khoảng giá dưới slider
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '50k',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
              Text(
                '5M',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
  Widget _buildStarRatingSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Star Rating',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        // Sử dụng Wrap thay vì Row để tránh overflow
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: List.generate(5, (index) {
            final starCount = index + 1;
            final isSelected = _filters['starRating'] == starCount;

            return FilterChip(
              showCheckmark: false,
              label: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.star,
                    size: 16,
                    color: isSelected ? Colors.white : const Color(0xFF1565C0),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    starCount.toString(),
                    style: TextStyle(
                      color: isSelected ? Colors.white : const Color(0xFF1565C0),
                      fontWeight: FontWeight.w500,

                    ),
                  ),
                ],
              ),
              selected: isSelected,
              onSelected: (selected) {
                setState(() {
                  if(selected){
                    _filters['starRating'] = starCount;
                  }else{
                    _filters['starRating'] = "";
                  }
                });
              },
              backgroundColor: Colors.white,
              selectedColor: const Color(0xFF1565C0),

              // checkmarkColor: Colors.red,
              side: BorderSide(
                color: isSelected ? const Color(0xFF1565C0) : Colors.grey[300]!,
                width: 1,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
            );
          }),
        ),
      ],
    );
  }

  Widget _buildFacilitiesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Facilities',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              'See All',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _facilities.map((facility) {
            final isSelected = (_filters['facilities'] as List).contains(facility);
            return FilterChip(
              label: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _getFacilityIcon(facility),
                    size: 16,
                    color: isSelected ? Colors.white : const Color(0xFF1565C0),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    facility,
                    style: TextStyle(
                      color: isSelected ? Colors.white : const Color(0xFF1565C0),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
              selected: isSelected,
              onSelected: (selected) {
                setState(() {
                  if (selected) {
                    (_filters['facilities'] as List).add(facility);
                  } else {
                    (_filters['facilities'] as List).remove(facility);
                  }
                });
              },
              backgroundColor: Colors.white,
              selectedColor: const Color(0xFF1565C0),
              checkmarkColor: Colors.white,
              side: BorderSide(
                color: const Color(0xFF1565C0),
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

  Widget _buildAccommodationTypeSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Accommodation Type',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              'See All',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _accommodationTypes.map((type) {
            final isSelected = (_filters['accommodationTypes'] as List).contains(type);
            return FilterChip(
              label: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _getAccommodationIcon(type),
                    size: 16,
                    color: isSelected ? Colors.white : const Color(0xFF1565C0),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    type,
                    style: TextStyle(
                      color: isSelected ? Colors.white : const Color(0xFF1565C0),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
              selected: isSelected,
              onSelected: (selected) {
                setState(() {
                  if (selected) {
                    (_filters['accommodationTypes'] as List).add(type);
                  } else {
                    (_filters['accommodationTypes'] as List).remove(type);
                  }
                });
              },
              backgroundColor: Colors.white,
              selectedColor: const Color(0xFF1565C0),
              checkmarkColor: Colors.white,
              side: BorderSide(
                color: const Color(0xFF1565C0),
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

  IconData _getFacilityIcon(String facility) {
    switch (facility) {
      case 'WiFi':
        return Icons.wifi;
      case 'Swimming Pool':
        return Icons.pool;
      case 'Parking':
        return Icons.local_parking;
      case 'Restaurant':
        return Icons.restaurant;
      default:
        return Icons.check;
    }
  }

  IconData _getAccommodationIcon(String type) {
    switch (type) {
      case 'Hotels':
        return Icons.hotel;
      case 'Resorts':
        return Icons.beach_access;
      case 'Villas':
        return Icons.villa;
      case 'Apartments':
        return Icons.apartment;
      default:
        return Icons.home;
    }
  }

  void _resetFilters() {
    setState(() {
      _filters = {
        'countries': <String>[],
        'sortBy': 'Highest Popularity',
        'priceRange': {'min': 100000.0, 'max': 2000000.0}, // ← VND default
        'starRating': 5,
        'facilities': <String>[],
        'accommodationTypes': <String>[],
      };
    });

    print('🔧 Filters reset to VND defaults: ${_filters['priceRange']}');

    if (widget.onReset != null) {
      widget.onReset!();
      Navigator.pop(context);
    }
  }



  void _applyFilters() {
    print('🔧 FilterModal applying filters: $_filters');

    // ✅ FIX: Convert UI terms to API terms
    final apiFilters = <String, dynamic>{};

    // Convert sortBy
    if (_filters['sortBy'] != null) {
      switch (_filters['sortBy']) {
        case 'Highest Popularity':
          apiFilters['sortBy'] = 'rating_desc';
          break;
        case 'Highest Price':
          apiFilters['sortBy'] = 'price_desc';
          break;
        case 'Lowest Price':
          apiFilters['sortBy'] = 'price_asc';
          break;
        default:
          apiFilters['sortBy'] = 'rating_desc';
      }
    }

    // Convert price range (USD to VND)
    if (_filters['priceRange'] != null) {
      final priceRange = _filters['priceRange'] as Map<String, double>;
      apiFilters['minPrice'] = priceRange['min']!.toInt(); // Convert $18 → 450k VND
      apiFilters['maxPrice'] = priceRange['max']!.toInt(); // Convert $50 → 1.25M VND
    }

    // Convert star rating
    if (_filters['starRating'] != null && _filters['starRating'] != '') {
      apiFilters['minStars'] = _filters['starRating'];
    }

    // Convert accommodation types
    if (_filters['accommodationTypes'] != null &&
        (_filters['accommodationTypes'] as List).isNotEmpty) {
      final types = (_filters['accommodationTypes'] as List<String>).map((type) {
        switch (type) {
          case 'Hotels': return 'khachSan';
          case 'Resorts': return 'khuNghiDuong';
          case 'Villas': return 'villa';
          case 'Apartments': return 'nhaNghi';
          default: return type.toLowerCase();
        }
      }).toList();
      apiFilters['hotelTypes'] = types;
    }

    print('🔧 API filters being sent: $apiFilters');

    widget.onFiltersApplied(apiFilters);
    Navigator.pop(context);
  }
}