import 'package:flutter/material.dart';
import 'package:doan_datphong/Models/NguoiDung.dart';
import 'package:doan_datphong/Models/KhachSan.dart'; // Updated import
import 'package:doan_datphong/Views/home_View/home_screen.dart';
import '../../generated/l10n.dart';
import '../listBooking_View/listBooking_screen.dart';
import '../profile_View/profile_screen.dart';
import 'package:doan_datphong/Views/seach_View/widgets/search_bar_widget.dart';
import 'package:doan_datphong/Views/seach_View/widgets/filter_chips_widget.dart';
import 'package:doan_datphong/Views/seach_View/widgets/recent_searches_widget.dart';
import 'package:doan_datphong/Views/seach_View/widgets/hotel_list_widget.dart';
import 'package:doan_datphong/Views/seach_View/filter_modal.dart';

class SearchView extends StatefulWidget {
  final NguoiDung? user;

  const SearchView({super.key, required this.user});

  @override
  _SearchViewState createState() => _SearchViewState();
}

class _SearchViewState extends State<SearchView> {
  int _currentIndex = 1;
  final TextEditingController _searchController = TextEditingController();

  // Sample data
  final List<String> _recentSearches = [
    'Palazzo Hotel',
    'Bulgari Hotel',
    'Amsterdam, Netherlands',
    'Martinez Cannes Hotel',
    'London, United Kingdom',
    'Palms Casino Hotel',
  ];

  final List<Hotels> _allHotels = [
    Hotels(
      id: '1',
      tenKhachSan: 'Royale President',
      diaChi: 'Central Paris',
      thanhPho: 'Paris, France',
      soSao: 5,
      giaCa: 29,
      hinhAnh: 'assets/images/hotel1.jpg',
      moTa: 'Luxury hotel in the heart of Paris',
      soDienThoai: '+33 1 23 45 67 89',
      email: 'info@royalepresident.com',
    ),
    Hotels(
      id: '2',
      tenKhachSan: 'Laluna De Hotel',
      diaChi: 'Historic District',
      thanhPho: 'Istanbul, Turkiye',
      soSao: 2,
      giaCa: 33,
      hinhAnh: 'assets/images/hotel2.jpg',
      moTa: 'Beautiful hotel with Bosphorus view',
      soDienThoai: '+90 212 123 45 67',
      email: 'info@lalunade.com',
    ),
    Hotels(
      id: '3',
      tenKhachSan: 'Le De Merische',
      diaChi: 'Westminster',
      thanhPho: 'London, United Kingdom',
      soSao: 4,
      giaCa: 31,
      hinhAnh: 'assets/images/hotel3.jpg',
      moTa: 'Elegant hotel near Big Ben',
      soDienThoai: '+44 20 7123 4567',
      email: 'info@ledemerische.co.uk',
    ),
    Hotels(
      id: '4',
      tenKhachSan: 'Carnia Merina',
      diaChi: 'Historic Center',
      thanhPho: 'Rome, Italia',
      soSao: 3,
      giaCa: 34,
      hinhAnh: 'assets/images/hotel4.jpg',
      moTa: 'Classic Roman hospitality',
      soDienThoai: '+39 06 123 456 789',
      email: 'info@carniamerina.it',
    ),
  ];

  List<Hotels> _filteredHotels = [];
  bool _showResults = false;
  String _selectedFilter = 'All Hotel';
  Map<String, dynamic> _appliedFilters = {};

  @override
  void initState() {
    super.initState();
    _filteredHotels = List.from(_allHotels);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    setState(() {
      _showResults = query.isNotEmpty;
      if (query.isEmpty) {
        _filteredHotels = List.from(_allHotels);
      } else {
        _filteredHotels = _allHotels.where((hotel) {
          final nameLower = hotel.tenKhachSan.toLowerCase();
          final cityLower = hotel.thanhPho.toLowerCase();
          final addressLower = hotel.diaChi.toLowerCase();
          final searchLower = query.toLowerCase();
          return nameLower.contains(searchLower) ||
              cityLower.contains(searchLower) ||
              addressLower.contains(searchLower);
        }).toList();
      }
    });
  }

  void _onRecentSearchTap(String search) {
    _searchController.text = search;
    _onSearchChanged(search);
  }

  void _onFilterChipTap(String filter) {
    setState(() {
      _selectedFilter = filter;
      // Apply filter logic here based on selected chip
      _applyChipFilter(filter);
    });
  }

  void _applyChipFilter(String filter) {
    List<Hotels> filtered = List.from(_allHotels);

    // Apply search filter first if exists
    if (_searchController.text.isNotEmpty) {
      filtered = filtered.where((hotel) {
        final nameLower = hotel.tenKhachSan.toLowerCase();
        final cityLower = hotel.thanhPho.toLowerCase();
        final addressLower = hotel.diaChi.toLowerCase();
        final searchLower = _searchController.text.toLowerCase();
        return nameLower.contains(searchLower) ||
            cityLower.contains(searchLower) ||
            addressLower.contains(searchLower);
      }).toList();
    }

    // Apply chip-specific filters
    switch (filter) {
      case 'Recommended':
        filtered.sort((a, b) => b.soSao.compareTo(a.soSao));
        break;
      case 'Popular':
      // Sort by star rating as proxy for popularity
        filtered.sort((a, b) => b.soSao.compareTo(a.soSao));
        break;
      case 'Trending':
      // Sort by a combination of star rating and price (lower price + higher star = more trending)
        filtered.sort((a, b) {
          double aScore = a.soSao.toDouble() - (a.giaCa / 100);
          double bScore = b.soSao.toDouble() - (b.giaCa / 100);
          return bScore.compareTo(aScore);
        });
        break;
      case 'All Hotel':
      default:
      // Keep original order or sort by name
        filtered.sort((a, b) => a.tenKhachSan.compareTo(b.tenKhachSan));
        break;
    }

    // Apply any existing filters from the filter modal
    if (_appliedFilters.isNotEmpty) {
      filtered = _applyModalFilters(filtered);
    }

    setState(() {
      _filteredHotels = filtered;
      if (filter != 'All Hotel' || _searchController.text.isNotEmpty) {
        _showResults = true;
      }
    });
  }

  List<Hotels> _applyModalFilters(List<Hotels> hotels) {
    List<Hotels> filtered = List.from(hotels);

    // Apply country filters
    if (_appliedFilters.containsKey('countries') && (_appliedFilters['countries'] as List).isNotEmpty) {
      filtered = filtered.where((hotel) {
        return (_appliedFilters['countries'] as List).any((country) =>
            hotel.thanhPho.toLowerCase().contains(country.toLowerCase()));
      }).toList();
    }

    // Apply price range filter
    if (_appliedFilters.containsKey('priceRange')) {
      final range = _appliedFilters['priceRange'] as Map<String, double>;
      filtered = filtered.where((hotel) =>
      hotel.giaCa >= range['min']! && hotel.giaCa <= range['max']!).toList();
    }

    // Apply star rating filter
    if (_appliedFilters.containsKey('starRating') && _appliedFilters['starRating'] > 0) {
      filtered = filtered.where((hotel) =>
      hotel.soSao >= (_appliedFilters['starRating'] as int)).toList();
    }

    return filtered;
  }

  void _showFilterModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => FilterModal(
        currentFilters: _appliedFilters,
        onFiltersApplied: (filters) {
          setState(() {
            _appliedFilters = filters;
            _applyFilters(); // This will automatically show results
          });
        },
        onReset: () {
          setState(() {
            _appliedFilters = {};
            _filteredHotels = List.from(_allHotels);
            // Keep showing results if search text exists, otherwise show recent searches
            _showResults = _searchController.text.isNotEmpty;
          });
        },
      ),
    );
  }

  void _applyFilters() {
    List<Hotels> filtered = List.from(_allHotels);

    // Apply search filter
    if (_searchController.text.isNotEmpty) {
      filtered = filtered.where((hotel) {
        final nameLower = hotel.tenKhachSan.toLowerCase();
        final cityLower = hotel.thanhPho.toLowerCase();
        final addressLower = hotel.diaChi.toLowerCase();
        final searchLower = _searchController.text.toLowerCase();
        return nameLower.contains(searchLower) ||
            cityLower.contains(searchLower) ||
            addressLower.contains(searchLower);
      }).toList();
    }

    // Apply country filters
    if (_appliedFilters.containsKey('countries') && (_appliedFilters['countries'] as List).isNotEmpty) {
      filtered = filtered.where((hotel) {
        return (_appliedFilters['countries'] as List).any((country) =>
            hotel.thanhPho.toLowerCase().contains(country.toLowerCase()));
      }).toList();
    }

    // Apply price range filter
    if (_appliedFilters.containsKey('priceRange')) {
      final range = _appliedFilters['priceRange'] as Map<String, double>;
      filtered = filtered.where((hotel) =>
      hotel.giaCa >= range['min']! && hotel.giaCa <= range['max']!).toList();
    }

    // Apply star rating filter
    if (_appliedFilters.containsKey('starRating') && _appliedFilters['starRating'] > 0) {
      filtered = filtered.where((hotel) =>
      hotel.soSao >= (_appliedFilters['starRating'] as int)).toList();
    }

    // Apply facilities filter
    if (_appliedFilters.containsKey('facilities') && (_appliedFilters['facilities'] as List).isNotEmpty) {
      filtered = filtered.where((hotel) {
        // Since Hotels model doesn't have facilities list, we'll simulate it
        // You can modify this based on your actual Hotels model or add facilities field
        return true; // For now, keep all hotels
      }).toList();
    }

    // Apply accommodation type filter
    if (_appliedFilters.containsKey('accommodationTypes') && (_appliedFilters['accommodationTypes'] as List).isNotEmpty) {
      // Similar to facilities, simulate accommodation type filtering
      filtered = filtered.where((hotel) {
        return true; // For now, keep all hotels
      }).toList();
    }

    // Apply sorting
    if (_appliedFilters.containsKey('sortBy')) {
      final sortBy = _appliedFilters['sortBy'] as String;
      switch (sortBy) {
        case 'Highest Price':
          filtered.sort((a, b) => b.giaCa.compareTo(a.giaCa));
          break;
        case 'Lowest Price':
          filtered.sort((a, b) => a.giaCa.compareTo(b.giaCa));
          break;
        case 'Highest Popularity':
        default:
          filtered.sort((a, b) => b.soSao.compareTo(a.soSao));
          break;
      }
    }

    setState(() {
      _filteredHotels = filtered;
      // Automatically show results when filters are applied
      _showResults = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: Column(
          children: [
            // Search Bar
            SearchBarWidget(
              controller: _searchController,
              onChanged: _onSearchChanged,
              onFilterTap: _showFilterModal,
            ),

            // Filter Chips
            FilterChipsWidget(
              selectedFilter: _selectedFilter,
              onFilterTap: _onFilterChipTap,
            ),

            // Content
            Expanded(
              child: _showResults
                  ? HotelListWidget(
                hotels: _filteredHotels,
                totalResults: _filteredHotels.length,
              )
                  : RecentSearchesWidget(
                recentSearches: _recentSearches,
                onSearchTap: _onRecentSearchTap,
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _currentIndex,
        onTap: (index) {
          if (_currentIndex == index) return;

          setState(() {
            _currentIndex = index;
          });

          switch (index) {
            case 0:
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => HomeScreen(user: widget.user)),
              );
              break;
            case 1:
            // Already on Search page
              break;
            case 2:
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => ListBookingScreen(user: widget.user)),
              );
              break;
            case 3:
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => ProfileScreen(user: widget.user)),
              );
              break;
          }
        },
        selectedItemColor: const Color(0xFF1565C0),
        unselectedItemColor: const Color(0xff9A9EAB),
        items: [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: S.of(context).home,
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.search),
            label: S.of(context).search,
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.view_list_outlined),
            label: S.of(context).booking,
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: S.of(context).profile,
          ),
        ],
      ),
    );
  }
}