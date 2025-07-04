import 'package:flutter/material.dart';
import 'package:doan_datphong/Models/NguoiDung.dart';
import 'package:doan_datphong/Models/KhachSan.dart'; // Updated import
import 'package:doan_datphong/Views/home_View/home_screen.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../Blocs/searchHotels_Blocs/searchHotels_bloc.dart';
import '../../Blocs/searchHotels_Blocs/searchHotels_event.dart';
import '../../Blocs/searchHotels_Blocs/searchHotels_state.dart';
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
  final ScrollController _scrollController = ScrollController();

  String _selectedFilter = 'All Hotel';
  bool _showResults = false;

  // Recent searches (có thể lưu vào SharedPreferences)
  final List<String> _recentSearches = [
    'Palazzo Hotel',
    'Bulgari Hotel',
    'Amsterdam, Netherlands',
    'Martinez Cannes Hotel',
    'London, United Kingdom',
    'Palms Casino Hotel',
  ];

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);

    // Load filter options khi khởi tạo
    context.read<HotelSearchBloc>().add(GetFilterOptions());
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  // Xử lý scroll để load more
  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent * 0.8) {
      final state = context.read<HotelSearchBloc>().state;
      if (state is HotelSearchSuccess &&
          state.pagination.hasNext &&
          state is! HotelSearchLoadingMore) {
        context.read<HotelSearchBloc>().add(
            LoadMoreHotels(page: state.pagination.nextPage!)
        );
      }
    }
  }

  // Xử lý thay đổi từ khóa tìm kiếm
  void _onSearchChanged(String query) {
    setState(() {
      _showResults = query.isNotEmpty;
    });

    if (query.isNotEmpty) {
      // Gọi API search thông qua BLoC
      context.read<HotelSearchBloc>().add(
          SearchHotels(
            keyword: query,
            page: 1,
            limit: 10,
            sortBy: _getSortByFromFilter(_selectedFilter),
          )
      );
    } else {
      context.read<HotelSearchBloc>().add(ClearSearch());
    }
  }

  // Xử lý tap vào recent search
  void _onRecentSearchTap(String search) {
    _searchController.text = search;
    _onSearchChanged(search);
  }

  // Xử lý tap vào filter chip
  void _onFilterChipTap(String filter) {
    print('🎯 Filter chip tapped: $filter');

    setState(() {
      _selectedFilter = filter;
    });

    Map<String, dynamic> filters = {};
    if (_searchController.text.isNotEmpty) {
      filters['keyword'] = _searchController.text;
    }

    // ✅ FIX: Thêm minStars cho từng filter
    switch (filter) {
      case 'Recommended':
        filters['sortBy'] = 'rating_desc';
        filters['minStars'] = 4;  // ← THÊM DÒNG NÀY
        break;
      case 'Popular':
        filters['sortBy'] = 'rating_desc';
        filters['minStars'] = 3;  // ← THÊM DÒNG NÀY
        break;
      case 'Trending':
        filters['sortBy'] = 'price_asc';
        // Không cần minStars cho trending
        break;
      case 'All Hotel':
      default:
        filters['sortBy'] = 'rating_desc';
        break;
    }

    print('🎯 Filters being sent: $filters');

    context.read<HotelSearchBloc>().add(UpdateFilters(filters: filters));
    setState(() {
      _showResults = true;
    });
  }

  // Helper method để convert filter chip thành sortBy
  String _getSortByFromFilter(String filter) {
    switch (filter) {
      case 'Recommended':
        return 'rating_desc';
      case 'Popular':
        return 'rating_desc';
      case 'Trending':
        return 'price_asc';
      case 'All Hotel':
      default:
        return 'rating_desc';
    }
  }

  // Hiện filter modal
  void _showFilterModal() {
    // Lấy current filters từ BLoC state
    Map<String, dynamic> currentFilters = {};
    final state = context.read<HotelSearchBloc>().state;
    if (state is HotelSearchSuccess) {
      currentFilters = state.currentFilters;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => FilterModal(
        currentFilters: currentFilters,
        onFiltersApplied: (filters) {
          // Thêm keyword hiện tại vào filters
          if (_searchController.text.isNotEmpty) {
            filters['keyword'] = _searchController.text;
          }

          // Apply filters thông qua BLoC
          context.read<HotelSearchBloc>().add(UpdateFilters(filters: filters));

          setState(() {
            _showResults = true;
          });
        },
        onReset: () {
          // Reset search
          context.read<HotelSearchBloc>().add(ClearSearch());
          setState(() {
            _showResults = _searchController.text.isNotEmpty;
          });
        },
      ),
    );
  }

  // Refresh search
  void _refreshSearch() {
    context.read<HotelSearchBloc>().add(RefreshSearch());
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

            // Content với BlocBuilder
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
                              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF1565C0)),
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
                          ],
                        ),
                      ),
                    );
                  }

                  // State: Success - Hiện kết quả
                  else if (state is HotelSearchSuccess) {
                    return RefreshIndicator(
                      onRefresh: () async => _refreshSearch(),
                      child: HotelListWidget(
                        hotels: state.hotels,
                        totalResults: state.statistics.totalHotels,
                        scrollController: _scrollController,
                      ),
                    );
                  }

                  // State: LoadingMore - Hiện current hotels + loading indicator
                  else if (state is HotelSearchLoadingMore) {
                    return Column(
                      children: [
                        Expanded(
                          child: HotelListWidget(
                            hotels: state.currentHotels,
                            totalResults: state.statistics.totalHotels,
                            scrollController: _scrollController,
                          ),
                        ),
                        Container(
                          padding: EdgeInsets.all(16),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF1565C0)),
                                ),
                              ),
                              SizedBox(width: 12),
                              Text(
                                'Đang tải thêm...',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    );
                  }

                  // State: Failure - Hiện error UI
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
                                  icon: Icon(Icons.refresh, color: Colors.white, size: 16),
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
// class _SearchViewState extends State<SearchView> {
//   int _currentIndex = 1;
//   final TextEditingController _searchController = TextEditingController();
//
//   // Sample data
//   final List<String> _recentSearches = [
//     'Palazzo Hotel',
//     'Bulgari Hotel',
//     'Amsterdam, Netherlands',
//     'Martinez Cannes Hotel',
//     'London, United Kingdom',
//     'Palms Casino Hotel',
//   ];
//
//   final List<KhachSan> _allHotels = [
//     KhachSan(
//       id: '1',
//       tenKhachSan: 'Royale President',
//       diaChi: 'Central Paris',
//       thanhPho: 'Paris, France',
//       soSao: 5,
//       giaCa: 29,
//       hinhAnh: 'assets/images/hotel1.jpg',
//       moTa: 'Luxury hotel in the heart of Paris',
//       soDienThoai: '+33 1 23 45 67 89',
//       email: 'info@royalepresident.com',
//
//     ),
//     KhachSan(
//       id: '2',
//       tenKhachSan: 'Laluna De Hotel',
//       diaChi: 'Historic District',
//       thanhPho: 'Istanbul, Turkiye',
//       soSao: 2,
//       giaCa: 33,
//       hinhAnh: 'assets/images/hotel2.jpg',
//       moTa: 'Beautiful hotel with Bosphorus view',
//       soDienThoai: '+90 212 123 45 67',
//       email: 'info@lalunade.com',
//     ),
//     KhachSan(
//       id: '3',
//       tenKhachSan: 'Le De Merische',
//       diaChi: 'Westminster',
//       thanhPho: 'London, United Kingdom',
//       soSao: 4,
//       giaCa: 31,
//       hinhAnh: 'assets/images/hotel3.jpg',
//       moTa: 'Elegant hotel near Big Ben',
//       soDienThoai: '+44 20 7123 4567',
//       email: 'info@ledemerische.co.uk',
//     ),
//     KhachSan(
//       id: '4',
//       tenKhachSan: 'Carnia Merina',
//       diaChi: 'Historic Center',
//       thanhPho: 'Rome, Italia',
//       soSao: 3,
//       giaCa: 34,
//       hinhAnh: 'assets/images/hotel4.jpg',
//       moTa: 'Classic Roman hospitality',
//       soDienThoai: '+39 06 123 456 789',
//       email: 'info@carniamerina.it',
//     ),
//   ];
//
//   List<KhachSan> _filteredHotels = [];
//   bool _showResults = false;
//   String _selectedFilter = 'All Hotel';
//   Map<String, dynamic> _appliedFilters = {};
//
//   @override
//   void initState() {
//     super.initState();
//     _filteredHotels = List.from(_allHotels);
//   }
//
//   @override
//   void dispose() {
//     _searchController.dispose();
//     super.dispose();
//   }
//
//   void _onSearchChanged(String query) {
//     setState(() {
//       _showResults = query.isNotEmpty;
//       if (query.isEmpty) {
//         _filteredHotels = List.from(_allHotels);
//       } else {
//         _filteredHotels = _allHotels.where((hotel) {
//           final nameLower = hotel.tenKhachSan.toLowerCase();
//           final cityLower = hotel.thanhPho.toLowerCase();
//           final addressLower = hotel.diaChi.toLowerCase();
//           final searchLower = query.toLowerCase();
//           return nameLower.contains(searchLower) ||
//               cityLower.contains(searchLower) ||
//               addressLower.contains(searchLower);
//         }).toList();
//       }
//     });
//   }
//
//   void _onRecentSearchTap(String search) {
//     _searchController.text = search;
//     _onSearchChanged(search);
//   }
//
//   void _onFilterChipTap(String filter) {
//     setState(() {
//       _selectedFilter = filter;
//       // Apply filter logic here based on selected chip
//       _applyChipFilter(filter);
//     });
//   }
//
//   void _applyChipFilter(String filter) {
//     List<KhachSan> filtered = List.from(_allHotels);
//
//     // Apply search filter first if exists
//     if (_searchController.text.isNotEmpty) {
//       filtered = filtered.where((hotel) {
//         final nameLower = hotel.tenKhachSan.toLowerCase();
//         final cityLower = hotel.thanhPho.toLowerCase();
//         final addressLower = hotel.diaChi.toLowerCase();
//         final searchLower = _searchController.text.toLowerCase();
//         return nameLower.contains(searchLower) ||
//             cityLower.contains(searchLower) ||
//             addressLower.contains(searchLower);
//       }).toList();
//     }
//
//     // Apply chip-specific filters
//     switch (filter) {
//       case 'Recommended':
//         filtered.sort((a, b) => b.soSao.compareTo(a.soSao));
//         break;
//       case 'Popular':
//       // Sort by star rating as proxy for popularity
//         filtered.sort((a, b) => b.soSao.compareTo(a.soSao));
//         break;
//       case 'Trending':
//       // Sort by a combination of star rating and price (lower price + higher star = more trending)
//         filtered.sort((a, b) {
//           double aScore = a.soSao.toDouble() - (a.giaCa / 100);
//           double bScore = b.soSao.toDouble() - (b.giaCa / 100);
//           return bScore.compareTo(aScore);
//         });
//         break;
//       case 'All Hotel':
//       default:
//       // Keep original order or sort by name
//         filtered.sort((a, b) => a.tenKhachSan.compareTo(b.tenKhachSan));
//         break;
//     }
//
//     // Apply any existing filters from the filter modal
//     if (_appliedFilters.isNotEmpty) {
//       filtered = _applyModalFilters(filtered);
//     }
//
//     setState(() {
//       _filteredHotels = filtered;
//       if (filter != 'All Hotel' || _searchController.text.isNotEmpty) {
//         _showResults = true;
//       }
//     });
//   }
//
//   List<KhachSan> _applyModalFilters(List<KhachSan> hotels) {
//     List<KhachSan> filtered = List.from(hotels);
//
//     // Apply country filters
//     if (_appliedFilters.containsKey('countries') && (_appliedFilters['countries'] as List).isNotEmpty) {
//       filtered = filtered.where((hotel) {
//         return (_appliedFilters['countries'] as List).any((country) =>
//             hotel.thanhPho.toLowerCase().contains(country.toLowerCase()));
//       }).toList();
//     }
//
//     // Apply price range filter
//     if (_appliedFilters.containsKey('priceRange')) {
//       final range = _appliedFilters['priceRange'] as Map<String, double>;
//       filtered = filtered.where((hotel) =>
//       hotel.giaCa >= range['min']! && hotel.giaCa <= range['max']!).toList();
//     }
//
//     // Apply star rating filter
//     if (_appliedFilters.containsKey('starRating') && _appliedFilters['starRating'] > 0) {
//       filtered = filtered.where((hotel) =>
//       hotel.soSao >= (_appliedFilters['starRating'] as int)).toList();
//     }
//
//     return filtered;
//   }
//
//   void _showFilterModal() {
//     showModalBottomSheet(
//       context: context,
//       isScrollControlled: true,
//       backgroundColor: Colors.transparent,
//       builder: (context) => FilterModal(
//         currentFilters: _appliedFilters,
//         onFiltersApplied: (filters) {
//           setState(() {
//             _appliedFilters = filters;
//             _applyFilters(); // This will automatically show results
//           });
//         },
//         onReset: () {
//           setState(() {
//             _appliedFilters = {};
//             _filteredHotels = List.from(_allHotels);
//             // Keep showing results if search text exists, otherwise show recent searches
//             _showResults = _searchController.text.isNotEmpty;
//           });
//         },
//       ),
//     );
//   }
//
//   void _applyFilters() {
//     List<KhachSan> filtered = List.from(_allHotels);
//
//     // Apply search filter
//     if (_searchController.text.isNotEmpty) {
//       filtered = filtered.where((hotel) {
//         final nameLower = hotel.tenKhachSan.toLowerCase();
//         final cityLower = hotel.thanhPho.toLowerCase();
//         final addressLower = hotel.diaChi.toLowerCase();
//         final searchLower = _searchController.text.toLowerCase();
//         return nameLower.contains(searchLower) ||
//             cityLower.contains(searchLower) ||
//             addressLower.contains(searchLower);
//       }).toList();
//     }
//
//     // Apply country filters
//     if (_appliedFilters.containsKey('countries') && (_appliedFilters['countries'] as List).isNotEmpty) {
//       filtered = filtered.where((hotel) {
//         return (_appliedFilters['countries'] as List).any((country) =>
//             hotel.thanhPho.toLowerCase().contains(country.toLowerCase()));
//       }).toList();
//     }
//
//     // Apply price range filter
//     if (_appliedFilters.containsKey('priceRange')) {
//       final range = _appliedFilters['priceRange'] as Map<String, double>;
//       filtered = filtered.where((hotel) =>
//       hotel.giaCa >= range['min']! && hotel.giaCa <= range['max']!).toList();
//     }
//
//     // Apply star rating filter
//     if (_appliedFilters.containsKey('starRating') && _appliedFilters['starRating'] > 0) {
//       filtered = filtered.where((hotel) =>
//       hotel.soSao >= (_appliedFilters['starRating'] as int)).toList();
//     }
//
//     // Apply facilities filter
//     if (_appliedFilters.containsKey('facilities') && (_appliedFilters['facilities'] as List).isNotEmpty) {
//       filtered = filtered.where((hotel) {
//         // Since Hotels model doesn't have facilities list, we'll simulate it
//         // You can modify this based on your actual Hotels model or add facilities field
//         return true; // For now, keep all hotels
//       }).toList();
//     }
//
//     // Apply accommodation type filter
//     if (_appliedFilters.containsKey('accommodationTypes') && (_appliedFilters['accommodationTypes'] as List).isNotEmpty) {
//       // Similar to facilities, simulate accommodation type filtering
//       filtered = filtered.where((hotel) {
//         return true; // For now, keep all hotels
//       }).toList();
//     }
//
//     // Apply sorting
//     if (_appliedFilters.containsKey('sortBy')) {
//       final sortBy = _appliedFilters['sortBy'] as String;
//       switch (sortBy) {
//         case 'Highest Price':
//           filtered.sort((a, b) => b.giaCa.compareTo(a.giaCa));
//           break;
//         case 'Lowest Price':
//           filtered.sort((a, b) => a.giaCa.compareTo(b.giaCa));
//           break;
//         case 'Highest Popularity':
//         default:
//           filtered.sort((a, b) => b.soSao.compareTo(a.soSao));
//           break;
//       }
//     }
//
//     setState(() {
//       _filteredHotels = filtered;
//       // Automatically show results when filters are applied
//       _showResults = true;
//     });
//   }
//
//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       backgroundColor: Colors.grey[50],
//       body: SafeArea(
//         child: Column(
//           children: [
//             // Search Bar
//             SearchBarWidget(
//               controller: _searchController,
//               onChanged: _onSearchChanged,
//               onFilterTap: _showFilterModal,
//             ),
//
//             // Filter Chips
//             FilterChipsWidget(
//               selectedFilter: _selectedFilter,
//               onFilterTap: _onFilterChipTap,
//             ),
//
//             // Content
//             Expanded(
//               child: _showResults
//                   ? HotelListWidget(
//                 hotels: _filteredHotels,
//                 totalResults: _filteredHotels.length,
//               )
//                   : RecentSearchesWidget(
//                 recentSearches: _recentSearches,
//                 onSearchTap: _onRecentSearchTap,
//               ),
//             ),
//           ],
//         ),
//       ),
//       bottomNavigationBar: BottomNavigationBar(
//         type: BottomNavigationBarType.fixed,
//         currentIndex: _currentIndex,
//         onTap: (index) {
//           if (_currentIndex == index) return;
//
//           setState(() {
//             _currentIndex = index;
//           });
//
//           switch (index) {
//             case 0:
//               Navigator.push(
//                 context,
//                 MaterialPageRoute(builder: (context) => HomeScreen(user: widget.user)),
//               );
//               break;
//             case 1:
//             // Already on Search page
//               break;
//             case 2:
//               Navigator.push(
//                 context,
//                 MaterialPageRoute(builder: (context) => ListBookingScreen(user: widget.user)),
//               );
//               break;
//             case 3:
//               Navigator.push(
//                 context,
//                 MaterialPageRoute(builder: (context) => ProfileScreen(user: widget.user)),
//               );
//               break;
//           }
//         },
//         selectedItemColor: const Color(0xFF1565C0),
//         unselectedItemColor: const Color(0xff9A9EAB),
//         items: [
//           BottomNavigationBarItem(
//             icon: Icon(Icons.home),
//             label: S.of(context).home,
//           ),
//           BottomNavigationBarItem(
//             icon: Icon(Icons.search),
//             label: S.of(context).search,
//           ),
//           BottomNavigationBarItem(
//             icon: Icon(Icons.view_list_outlined),
//             label: S.of(context).booking,
//           ),
//           BottomNavigationBarItem(
//             icon: Icon(Icons.person),
//             label: S.of(context).profile,
//           ),
//         ],
//       ),
//     );
//   }
// }
