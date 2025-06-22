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
    _filters['priceRange'] ??= {'min': 18.0, 'max': 50.0};
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
                      side: const BorderSide(color: Color(0xFF14D9E1)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: const Text(
                      'Reset',
                      style: TextStyle(
                        color: Color(0xFF14D9E1),
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
                      backgroundColor: const Color(0xFF14D9E1),
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
                  color: isSelected ? Colors.white : const Color(0xFF14D9E1),
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
              selectedColor: const Color(0xFF14D9E1),
              checkmarkColor: Colors.white,
              side: BorderSide(
                color: const Color(0xFF14D9E1),
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
                  color: isSelected ? Colors.white : const Color(0xFF14D9E1),
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
              selectedColor: const Color(0xFF14D9E1),
              checkmarkColor: Colors.white,
              side: const BorderSide(
                color: Color(0xFF14D9E1),
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
          'Price Range Per Night',
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
                color: const Color(0xFF14D9E1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '\$${priceRange['min']!.round()}',
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
                color: const Color(0xFF14D9E1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '\$${priceRange['max']!.round()}',
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
          min: 10,
          max: 100,
          divisions: 18,
          activeColor: const Color(0xFF14D9E1),
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
                    color: isSelected ? Colors.white : const Color(0xFF14D9E1),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    starCount.toString(),
                    style: TextStyle(
                      color: isSelected ? Colors.white : const Color(0xFF14D9E1),
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
              selectedColor: const Color(0xFF14D9E1),

              // checkmarkColor: Colors.red,
              side: BorderSide(
                color: isSelected ? const Color(0xFF14D9E1) : Colors.grey[300]!,
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
                    color: isSelected ? Colors.white : const Color(0xFF14D9E1),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    facility,
                    style: TextStyle(
                      color: isSelected ? Colors.white : const Color(0xFF14D9E1),
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
              selectedColor: const Color(0xFF14D9E1),
              checkmarkColor: Colors.white,
              side: BorderSide(
                color: const Color(0xFF14D9E1),
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
                    color: isSelected ? Colors.white : const Color(0xFF14D9E1),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    type,
                    style: TextStyle(
                      color: isSelected ? Colors.white : const Color(0xFF14D9E1),
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
              selectedColor: const Color(0xFF14D9E1),
              checkmarkColor: Colors.white,
              side: BorderSide(
                color: const Color(0xFF14D9E1),
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
        'priceRange': {'min': 18.0, 'max': 50.0},
        'starRating': 5,
        'facilities': <String>[],
        'accommodationTypes': <String>[],
      };
    });

    // Call the reset callback if provided
    if (widget.onReset != null) {
      widget.onReset!();
      Navigator.pop(context);
    }
  }

  void _applyFilters() {
    widget.onFiltersApplied(_filters);
    Navigator.pop(context);
  }
}