import 'package:doan_datphong/Models/NguoiDung.dart';
import 'package:doan_datphong/Views/components/bottom_navigation_bar.dart';
import 'package:doan_datphong/Views/seach_View/filter_modal.dart';
import 'package:doan_datphong/Views/seach_View/widgets/filter_chips_widget.dart';
import 'package:doan_datphong/Views/seach_View/widgets/hotel_list_widget.dart';
import 'package:doan_datphong/Views/seach_View/widgets/recent_searches_widget.dart';
import 'package:doan_datphong/Views/seach_View/widgets/search_bar_widget.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../Blocs/searchHotels_Blocs/searchHotels_bloc.dart';
import '../../Blocs/searchHotels_Blocs/searchHotels_event.dart';
import '../../Blocs/searchHotels_Blocs/searchHotels_state.dart';
import '../detail_View/detail_screen.dart';
import '../selectDate_View/selectDate_screen.dart';

class SearchView extends StatefulWidget {
  final NguoiDung? user;

  const SearchView({super.key, this.user});

  @override
  _SearchViewState createState() => _SearchViewState();
}

class _SearchViewState extends State<SearchView> {
  int _currentIndex = 1;
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  String _selectedFilter = 'All Hotel';
  bool _showResults = false;

  // ✅ Lưu trữ filter parameters hiện tại
  Map<String, dynamic> _currentFilters = {};

  // Recent searches (có thể lưu vào SharedPreferences)
  final List<String> _recentSearches = [
    'Đà Nẵng',
    'Hồ Chí Minh',
    'Hà Nội',
    'Nha Trang',
    'Phú Quốc',
    'Sapa',
  ];


  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    // Load more logic if needed
  }

  // ✅ Xử lý tìm kiếm khi user nhập text hoặc submit
  void _performSearch({
    String? tenKhachSan,
    String? loaiLoc,
    bool useCurrentFilters = true,
  }) {
    context.read<HotelSearchBloc>().add(
      SearchHotels(
        tenKhachSan: tenKhachSan,
        loaiLoc: useCurrentFilters ? _currentFilters['sortBy'] : null,
        tinhThanh: useCurrentFilters ? _currentFilters['tinhThanh'] : null,
        phuongXa: useCurrentFilters ? _currentFilters['phuongXa'] : null,
        minPrice: useCurrentFilters ? _currentFilters['minPrice']?.toDouble() : null,
        maxPrice: useCurrentFilters ? _currentFilters['maxPrice']?.toDouble() : null,
        guests: useCurrentFilters ? _currentFilters['guests'] : null,
        rooms: useCurrentFilters ? _currentFilters['rooms'] : null,
        checkIn: useCurrentFilters ? _currentFilters['checkIn'] : null,
        checkOut: useCurrentFilters ? _currentFilters['checkOut'] : null,
        bookingType: useCurrentFilters ? _currentFilters['bookingType'] : null,

      ),
    );
  }

  void _onSearchChanged(String query) {
    if (query.trim().isNotEmpty) {
      setState(() {
        _showResults = true;
      });

      _performSearch(tenKhachSan: query);
    } else {
      setState(() {
        _showResults = false;
      });
    }
  }

  // ✅ Xử lý submit search (Enter hoặc search button)
  void _onSearchSubmitted(String query) {
    if (query.trim().isNotEmpty) {
      setState(() {
        _showResults = true;
      });
      _performSearch(tenKhachSan: query.trim());
    }
  }

  // Xử lý tap vào recent search
  void _onRecentSearchTap(String search) {
    _searchController.text = search;
    _onSearchSubmitted(search);
  }

  // ✅ Xử lý filter chips đơn giản
  void _onFilterChipTap(String filter) {
    print('🎯 Filter chip tapped: $filter');

    setState(() {
      _selectedFilter = filter;
    });

    // ✅ Map filter names to API filterType
    String? filterType;
    bool shouldSearch = true;

    switch (filter) {
      case 'All Hotel':
        filterType = 'all';
        break;
      case 'Recommended':
        filterType = 'recommend';
        break;
      case 'Popular':
        filterType = 'popular';
        break;
      case 'Trending':
        filterType = 'trending';
        break;
      default:
        shouldSearch = false;
    }

    if (shouldSearch) {
      setState(() {
        _showResults = true;
      });

      // ✅ Gọi API với filterType
      // context.read<HotelSearchBloc>().add(
      //   SearchHotels(
      //     loaiLoc: filterType,
      //     // Giữ lại keyword nếu có
      //     tenKhachSan: _searchController.text.isNotEmpty ? _searchController.text : null,
      //     // Include current filters if any
      //     tinhThanh: _currentFilters['tinhThanh'],
      //     phuongXa: _currentFilters['phuongXa'],
      //     minPrice: _currentFilters['minPrice'],
      //     maxPrice: _currentFilters['maxPrice'],
      //     guests: _currentFilters['guests'],
      //     rooms: _currentFilters['rooms'],
      //     checkIn: _currentFilters['checkIn'],
      //     checkOut: _currentFilters['checkOut'],
      //     bookingType: _currentFilters['bookingType'],
      //   ),
      // );
      _performSearch(
        loaiLoc: filterType,
        tenKhachSan: _searchController.text.isNotEmpty ? _searchController.text : null,
      );
    }
  }

  // ✅ Hiện filter modal
  void _showFilterModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder:
          (context) => FilterModal(
            currentFilters: _currentFilters,
            onFiltersApplied: (filters) {
              print('🔧 Applying filters: $filters');

              // ✅ Lưu filters và gọi BLoC search
              setState(() {
                _currentFilters = filters;
                _showResults = true;
              });

              // ✅ CHỈ GỌI BLOC TẠI ĐÂY - với đầy đủ parameters
              context.read<HotelSearchBloc>().add(
                SearchHotels(
                  tenKhachSan: _searchController.text.isNotEmpty ? _searchController.text : null,
                  loaiLoc: filters['sortBy'],
                  tinhThanh: filters['tinhThanh'],
                  phuongXa: filters['phuongXa'],
                  minPrice: filters['minPrice']?.toDouble(),
                  maxPrice: filters['maxPrice']?.toDouble(),
                  guests: filters['guests'],
                  rooms: filters['rooms'],
                  checkIn: filters['checkIn'],
                  checkOut: filters['checkOut'],
                  bookingType: filters['bookingType'],
                ),
              );
            },
            onReset: () {
              // Reset filters và về initial state
              setState(() {
                _currentFilters = {};
                _showResults = false;
                _searchController.clear();
                _selectedFilter = 'All Hotel';
              });
            },
          ),
    );
  }

  // ✅ Refresh search với filters hiện tại
  void _refreshSearch() {
    if (_searchController.text.isNotEmpty || _currentFilters.isNotEmpty) {
      _performSearch(
        tenKhachSan: _searchController.text.isNotEmpty
            ? _searchController.text : null,);
    }
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

            // ✅ Active Filters Display (hiển thị filter đang áp dụng)
            if (_currentFilters.isNotEmpty) _buildActiveFiltersBar(),

            // ✅ Content với BlocBuilder - CHỈ QUẢN LÝ STATE TẠI ĐÂY
            Expanded(
              child: BlocBuilder<HotelSearchBloc, HotelSearchState>(
                builder: (context, state) {
                  // State: Initial - Hiện recent searches
                  if (state is HotelSearchInitial) {
                    return RecentSearchesWidget(
                      recentSearches: _recentSearches,
                      onSearchTap: _onRecentSearchTap,
                    );
                  }
                  // State: Loading - Hiện loading indicator
                  else if (state is HotelSearchLoading) {
                    return Center(
                      child: Container(
                        padding: EdgeInsets.all(30),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(15),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 10,
                              offset: Offset(0, 5),
                            ),
                          ],
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            CircularProgressIndicator(
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Color(0xFF1565C0),
                              ),
                              strokeWidth: 3,
                            ),
                            SizedBox(height: 20),
                            Text(
                              'Đang tìm kiếm khách sạn...',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                                color: Colors.black87,
                              ),
                            ),
                            if (_currentFilters['sortBy'] != null) ...[
                              SizedBox(height: 8),
                              Text(
                                'Sắp xếp: ${_getSortDisplayText(_currentFilters['sortBy'])}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  }
                  // ✅ State: Success - Hiện kết quả với message
                  else if (state is HotelSearchSuccess) {
                    return Column(
                      children: [
                        // ✅ Hiển thị message từ API
                        if (state.message.isNotEmpty)
                          Container(
                            width: double.infinity,
                            padding: EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 12,
                            ),
                            margin: EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: Color(0xFF1565C0).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: Color(0xFF1565C0).withOpacity(0.3),
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.info_outline,
                                  color: Color(0xFF1565C0),
                                  size: 20,
                                ),
                                SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    state.message,
                                    style: TextStyle(
                                      color: Color(0xFF1565C0),
                                      fontWeight: FontWeight.w500,
                                      fontSize: 14,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                        // ✅ Danh sách khách sạn
                        Expanded(
                          child: RefreshIndicator(
                            onRefresh: () async => _refreshSearch(),
                            child:

                                  state.hotels.isEmpty
                                    ? _buildEmptyResults()
                                    : HotelListWidget(
                                    currentFilter: _currentFilters,
                                      hotels: state.hotels,
                                      totalResults: state.hotels.length,
                                      scrollController: _scrollController,
                                      onHotelTap: (hotel) {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder:
                                                (context) =>
                                                DetailScreen(hotel: hotel),
                                          ),
                                        );
                                      },
                                    ),
                          ),
                        ),
                      ],
                    );
                  }
                  // ✅ State: Failure - Hiện error UI
                  else if (state is HotelSearchFailure) {
                    return Center(
                      child: SingleChildScrollView(
                        child: Padding(
                          padding: const EdgeInsets.all(20.0),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              // Error Icon
                              Container(
                                width: 60,
                                height: 60,
                                decoration: BoxDecoration(
                                  color: Colors.red.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(30),
                                  border: Border.all(
                                    color: Colors.red.withOpacity(0.3),
                                    width: 2,
                                  ),
                                ),
                                child: Icon(
                                  Icons.search_off,
                                  size: 30,
                                  color: Colors.red,
                                ),
                              ),
                              SizedBox(height: 16),

                              // Error Title
                              Text(
                                'Lỗi tìm kiếm',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF1565C0),
                                ),
                                textAlign: TextAlign.center,
                              ),
                              SizedBox(height: 8),

                              // Error Message
                              Text(
                                state.error,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey[600],
                                  height: 1.3,
                                ),
                                textAlign: TextAlign.center,
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis,
                              ),
                              SizedBox(height: 20),

                              // Retry Button
                              SizedBox(
                                width: 140,
                                height: 40,
                                child: ElevatedButton.icon(
                                  onPressed: _refreshSearch,
                                  icon: Icon(
                                    Icons.refresh,
                                    color: Colors.white,
                                    size: 16,
                                  ),
                                  label: Text(
                                    'Thử lại',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Color(0xFF1565C0),
                                    elevation: 2,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(20),
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
                  // Default fallback
                  else {
                    return RecentSearchesWidget(
                      recentSearches: _recentSearches,
                      onSearchTap: _onRecentSearchTap,
                    );
                  }
                },
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: CustomBottomNavigation(
        currentPage: BottomNavPages.search,
      ),
    );
  }

  // ✅ Widget hiển thị các filter đang active
  Widget _buildActiveFiltersBar() {
    final activeFilters = <Widget>[];

    // ✅ Sort filter - hiển thị đầu tiên
    if (_currentFilters['sortBy'] != null) {
      activeFilters.add(
        _buildFilterChip(
          label: _getSortDisplayText(_currentFilters['sortBy']),
          icon: Icons.sort,
          onRemove: () {
            setState(() {
              _currentFilters.remove('sortBy');
            });
            _refreshSearch();
          },
        ),
      );
    }

    // Location filter
    if (_currentFilters['tinhThanh'] != null) {
      String locationText = _currentFilters['tinhThanh'];
      if (_currentFilters['phuongXa'] != null) {
        locationText = '${_currentFilters['phuongXa']}, $locationText';
      }
      activeFilters.add(
        _buildFilterChip(
          label: locationText,
          icon: Icons.location_on,
          onRemove: () {
            setState(() {
              _currentFilters.remove('tinhThanh');
              _currentFilters.remove('phuongXa');
            });
            _refreshSearch();
          },
        ),
      );
    }

    // Date filter
    if (_currentFilters['checkIn'] != null && _currentFilters['checkOut'] != null) {
      activeFilters.add(
        _buildFilterChip(
          label: '${_currentFilters['checkIn']} - ${_currentFilters['checkOut']}',
          icon: Icons.calendar_today,
          onRemove: () {
            setState(() {
              _currentFilters.remove('checkIn');
              _currentFilters.remove('checkOut');
            });
            _refreshSearch();
          },
        ),
      );
    }

    // Guests filter
    if (_currentFilters['guests'] != null && _currentFilters['guests'] > 2) {
      activeFilters.add(
        _buildFilterChip(
          label: '${_currentFilters['guests']} khách',
          icon: Icons.people,
          onRemove: () {
            setState(() {
              _currentFilters.remove('guests');
            });
            _refreshSearch();
          },
        ),
      );
    }

    // Rooms filter
    if (_currentFilters['rooms'] != null && _currentFilters['rooms'] > 1) {
      activeFilters.add(
        _buildFilterChip(
          label: '${_currentFilters['rooms']} phòng',
          icon: Icons.hotel,
          onRemove: () {
            setState(() {
              _currentFilters.remove('rooms');
            });
            _refreshSearch();
          },
        ),
      );
    }

    if (activeFilters.isEmpty) return SizedBox.shrink();

    return Container(
      height: 50,
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: activeFilters,
            ),
          ),
          // Clear all button
          GestureDetector(
            onTap: () {
              setState(() {
                _currentFilters.clear();
              });
              _refreshSearch();
            },
            child: Container(
              margin: EdgeInsets.only(left: 8),
              padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.red[50],
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.red[200]!),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.clear_all, size: 16, color: Colors.red[600]),
                  SizedBox(width: 4),
                  Text(
                    'Xóa tất cả',
                    style: TextStyle(
                      color: Colors.red[600],
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }


  Widget _buildFilterChip({
    required String label,
    required IconData icon,
    required VoidCallback onRemove,
  }) {
    return Container(
      margin: EdgeInsets.only(right: 8),
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Color(0xFF1565C0).withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Color(0xFF1565C0).withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Color(0xFF1565C0)),
          SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              style: TextStyle(
                color: Color(0xFF1565C0),
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          SizedBox(width: 6),
          GestureDetector(
            onTap: onRemove,
            child: Icon(Icons.close, size: 14, color: Color(0xFF1565C0)),
          ),
        ],
      ),
    );
  }

  String _getSortDisplayText(String option) {
    switch (option) {
      case 'Highest Popularity':
        return 'Phổ biến nhất';
      case 'Highest Price':
        return 'Giá cao nhất';
      case 'Lowest Price':
        return 'Giá thấp nhất';
      default:
        return option;
    }
  }

  // ✅ Widget hiển thị khi không có kết quả
  Widget _buildEmptyResults() {
    return Center(
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Empty Icon
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: Colors.grey.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(40),
                  border: Border.all(
                    color: Colors.grey.withOpacity(0.3),
                    width: 2,
                  ),
                ),
                child: Icon(
                  Icons.hotel_outlined,
                  size: 40,
                  color: Colors.grey[600],
                ),
              ),
              SizedBox(height: 20),

              // Empty Title
              Text(
                'Không tìm thấy khách sạn',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[700],
                ),
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 8),

              // Empty Message
              Text(
                'Hãy thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                  height: 1.3,
                ),
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 24),

              // ✅ Gợi ý tìm kiếm
              Text(
                'Gợi ý tìm kiếm:',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[700],
                ),
              ),
              SizedBox(height: 12),

              Wrap(
                spacing: 8,
                runSpacing: 8,
                children:
                    ['Đà Nẵng', 'Hà Nội', 'Hồ Chí Minh'].map((suggestion) {
                      return GestureDetector(
                        onTap: () {
                          _searchController.text = suggestion;
                          _onSearchChanged(suggestion);
                        },
                        child: Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Color(0xFF1565C0).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: Color(0xFF1565C0).withOpacity(0.3),
                            ),
                          ),
                          child: Text(
                            suggestion,
                            style: TextStyle(
                              color: Color(0xFF1565C0),
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
              ),

              // ✅ Clear filters suggestion nếu có filters active
              if (_currentFilters.isNotEmpty) ...[
                SizedBox(height: 20),
                GestureDetector(
                  onTap: () {
                    setState(() {
                      _currentFilters.clear();
                    });
                    if (_searchController.text.isNotEmpty) {
                      _onSearchChanged(_searchController.text);
                    }
                  },
                  child: Container(
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.orange[50],
                      borderRadius: BorderRadius.circular(25),
                      border: Border.all(color: Colors.orange[200]!),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.filter_alt_off,
                          size: 16,
                          color: Colors.orange[600],
                        ),
                        SizedBox(width: 8),
                        Text(
                          'Xóa bộ lọc và thử lại',
                          style: TextStyle(
                            color: Colors.orange[600],
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
