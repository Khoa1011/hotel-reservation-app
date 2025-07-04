import 'package:doan_datphong/Blocs/searchHotels_Blocs/searchHotels_event.dart';
import 'package:doan_datphong/Blocs/searchHotels_Blocs/searchHotels_state.dart';
import 'package:doan_datphong/Models/KhachSan.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../Data/Repository/searchHotels_Repository/searchHotels_repo.dart';

class HotelSearchBloc extends Bloc<HotelSearchEvent, HotelSearchState> {
  final HotelSearchRepository repository;

  HotelSearchBloc({required this.repository}) : super(HotelSearchInitial()) {
    on<SearchHotels>(_onSearchHotels);
    on<GetSearchSuggestions>(_onGetSearchSuggestions);
    on<GetFilterOptions>(_onGetFilterOptions);
    on<ClearSearch>(_onClearSearch);
    on<LoadMoreHotels>(_onLoadMoreHotels);
    on<UpdateFilters>(_onUpdateFilters);
    on<RefreshSearch>(_onRefreshSearch);
  }

  void _onSearchHotels(SearchHotels event, Emitter<HotelSearchState> emit) async {
    print('🎯 BLoC SearchHotels Event:');
    print('  - keyword: ${event.keyword}');
    print('  - city: ${event.city}');
    print('  - minPrice: ${event.minPrice}');
    print('  - maxPrice: ${event.maxPrice}');
    print('  - minStars: ${event.minStars}');
    print('  - maxStars: ${event.maxStars}');
    print('  - hotelTypes: ${event.hotelTypes}');
    print('  - sortBy: ${event.sortBy}');

    emit(HotelSearchLoading());

    try {
      final response = await repository.searchHotels(
        keyword: event.keyword,
        city: event.city,
        district: event.district,
        minPrice: event.minPrice,
        maxPrice: event.maxPrice,
        minStars: event.minStars,
        maxStars: event.maxStars,
        hotelTypes: event.hotelTypes,
        amenities: event.amenities,
        guests: event.guests,
        rooms: event.rooms,
        checkIn: event.checkIn,
        checkOut: event.checkOut,
        bookingType: event.bookingType,
        sortBy: event.sortBy,
        page: event.page,
        limit: event.limit,
        hasAvailability: event.hasAvailability,
      );

      // Tạo current filters map để debug
      final currentFilters = <String, dynamic>{};
      if (event.keyword != null) currentFilters['keyword'] = event.keyword;
      if (event.city != null) currentFilters['city'] = event.city;
      if (event.minPrice != null) currentFilters['minPrice'] = event.minPrice;
      if (event.maxPrice != null) currentFilters['maxPrice'] = event.maxPrice;
      if (event.minStars != null) currentFilters['minStars'] = event.minStars;
      if (event.maxStars != null) currentFilters['maxStars'] = event.maxStars;
      if (event.hotelTypes != null) currentFilters['hotelTypes'] = event.hotelTypes;
      if (event.amenities != null) currentFilters['amenities'] = event.amenities;
      if (event.sortBy != null) currentFilters['sortBy'] = event.sortBy;

      print('🎯 BLoC Current Filters: $currentFilters');
      print('🎯 BLoC Hotels Count: ${response.hotels.length}');

      emit(HotelSearchSuccess(
        hotels: response.hotels,
        searchInfo: response.searchInfo,
        pagination: response.pagination,
        statistics: response.statistics,
        suggestions: response.suggestions,
        currentFilters: currentFilters,
      ));
    } catch (err) {
      print('❌ BLoC Error: $err');
      emit(HotelSearchFailure(err.toString()));
    }
  }


  void _onGetSearchSuggestions(GetSearchSuggestions event, Emitter<HotelSearchState> emit) async {
    emit(SuggestionsLoading());

    try {
      final response = await repository.getSearchSuggestions(
        query: event.query,
        type: event.type,
        limit: event.limit,
      );

      emit(SuggestionsSuccess(
        suggestions: response.suggestions,
        query: event.query,
      ));
    } catch (err) {
      emit(SuggestionsFailure(err.toString()));
    }
  }

  void _onGetFilterOptions(GetFilterOptions event, Emitter<HotelSearchState> emit) async {
    emit(FilterOptionsLoading());

    try {
      final filterOptions = await repository.getFilterOptions(
        city: event.city,
        district: event.district,
      );

      emit(FilterOptionsSuccess(filterOptions: filterOptions));
    } catch (err) {
      emit(FilterOptionsFailure(err.toString()));
    }
  }

  void _onClearSearch(ClearSearch event, Emitter<HotelSearchState> emit) {
    emit(HotelSearchInitial());
  }

  void _onLoadMoreHotels(LoadMoreHotels event, Emitter<HotelSearchState> emit) async {
    if (state is HotelSearchSuccess) {
      final currentState = state as HotelSearchSuccess;

      // Emit loading more state
      emit(HotelSearchLoadingMore(
        currentHotels: currentState.hotels,
        searchInfo: currentState.searchInfo,
        pagination: currentState.pagination,
        statistics: currentState.statistics,
        currentFilters: currentState.currentFilters,
      ));

      try {
        // Sử dụng filters hiện tại để load more
        final filters = currentState.currentFilters;
        final response = await repository.searchHotels(
          keyword: filters['keyword'],
          city: filters['city'],
          district: filters['district'],
          minPrice: filters['minPrice'],
          maxPrice: filters['maxPrice'],
          minStars: filters['minStars'],
          maxStars: filters['maxStars'],
          hotelTypes: filters['hotelTypes'],
          amenities: filters['amenities'],
          guests: filters['guests'],
          rooms: filters['rooms'],
          checkIn: filters['checkIn'],
          checkOut: filters['checkOut'],
          bookingType: filters['bookingType'],
          sortBy: filters['sortBy'],
          page: event.page,
          limit: 10,
          hasAvailability: filters['hasAvailability'],
        );

        // Merge hotels
        final allHotels = [...currentState.hotels, ...response.hotels];

        emit(HotelSearchSuccess(
          hotels: allHotels,
          searchInfo: response.searchInfo,
          pagination: response.pagination,
          statistics: response.statistics,
          currentFilters: currentState.currentFilters,
        ));
      } catch (err) {
        emit(HotelSearchFailure(err.toString()));
      }
    }
  }

  void _onUpdateFilters(UpdateFilters event, Emitter<HotelSearchState> emit) async {
    print('🔧 BLoC UpdateFilters Event: ${event.filters}');

    emit(HotelSearchLoading());

    try {
      final filters = event.filters;

      // === FIX: XỬ LÝ CÁC FILTER TỪ UI ===
      String? keyword = filters['keyword'];
      String? city = filters['city'];
      String? district = filters['district'];
      double? minPrice = filters['minPrice']?.toDouble();
      double? maxPrice = filters['maxPrice']?.toDouble();
      int? minStars = filters['minStars']?.toInt();
      int? maxStars = filters['maxStars']?.toInt();

      // === FIX: XỬ LÝ ARRAYS TỪNG LOẠI ===
      List<String>? hotelTypes;
      if (filters['hotelTypes'] != null) {
        if (filters['hotelTypes'] is List) {
          hotelTypes = List<String>.from(filters['hotelTypes']);
        } else if (filters['hotelTypes'] is String && filters['hotelTypes'].isNotEmpty) {
          hotelTypes = [filters['hotelTypes']];
        }
      }

      List<String>? amenities;
      if (filters['amenities'] != null) {
        if (filters['amenities'] is List) {
          amenities = List<String>.from(filters['amenities']);
        } else if (filters['amenities'] is String && filters['amenities'].isNotEmpty) {
          amenities = [filters['amenities']];
        }
      }

      // === FIX: XỬ LÝ PRICE RANGE TỪ FILTER MODAL ===
      if (filters['priceRange'] != null && filters['priceRange'] is Map) {
        final priceRange = filters['priceRange'] as Map<String, dynamic>;
        minPrice ??= priceRange['min']?.toDouble();
        maxPrice ??= priceRange['max']?.toDouble();
      }

      // === FIX: XỬ LÝ STAR RATING TỪ FILTER MODAL ===
      if (filters['starRating'] != null && filters['starRating'] != '') {
        minStars = filters['starRating']?.toInt();
      }

      print('🔧 BLoC Processed Filters:');
      print('  - keyword: $keyword');
      print('  - city: $city');
      print('  - minPrice: $minPrice');
      print('  - maxPrice: $maxPrice');
      print('  - minStars: $minStars');
      print('  - hotelTypes: $hotelTypes');
      print('  - amenities: $amenities');

      final response = await repository.searchHotels(
        keyword: keyword,
        city: city,
        district: district,
        minPrice: minPrice,
        maxPrice: maxPrice,
        minStars: minStars,
        maxStars: maxStars,
        hotelTypes: hotelTypes,
        amenities: amenities,
        guests: filters['guests']?.toInt(),
        rooms: filters['rooms']?.toInt(),
        checkIn: filters['checkIn'],
        checkOut: filters['checkOut'],
        bookingType: filters['bookingType'],
        sortBy: filters['sortBy'],
        page: 1,
        limit: 10,
        hasAvailability: filters['hasAvailability'],
      );

      emit(HotelSearchSuccess(
        hotels: response.hotels,
        searchInfo: response.searchInfo,
        pagination: response.pagination,
        statistics: response.statistics,
        suggestions: response.suggestions,
        currentFilters: filters,
      ));
    } catch (err) {
      print('❌ BLoC UpdateFilters Error: $err');
      emit(HotelSearchFailure(err.toString()));
    }
  }

  void _onRefreshSearch(RefreshSearch event, Emitter<HotelSearchState> emit) async {
    if (state is HotelSearchSuccess) {
      final currentState = state as HotelSearchSuccess;

      try {
        final filters = currentState.currentFilters;
        final response = await repository.searchHotels(
          keyword: filters['keyword'],
          city: filters['city'],
          district: filters['district'],
          minPrice: filters['minPrice'],
          maxPrice: filters['maxPrice'],
          minStars: filters['minStars'],
          maxStars: filters['maxStars'],
          hotelTypes: filters['hotelTypes'],
          amenities: filters['amenities'],
          guests: filters['guests'],
          rooms: filters['rooms'],
          checkIn: filters['checkIn'],
          checkOut: filters['checkOut'],
          bookingType: filters['bookingType'],
          sortBy: filters['sortBy'],
          page: 1,
          limit: 10,
          hasAvailability: filters['hasAvailability'],
        );

        emit(HotelSearchSuccess(
          hotels: response.hotels,
          searchInfo: response.searchInfo,
          pagination: response.pagination,
          statistics: response.statistics,
          suggestions: response.suggestions,
          currentFilters: filters,
        ));
      } catch (err) {
        emit(HotelSearchFailure(err.toString()));
      }
    }
  }

  // Helper method để lấy filtered hotels
  List<KhachSan> getFilteredHotels(Map<String, dynamic> filters) {
    if (state is HotelSearchSuccess) {
      final currentState = state as HotelSearchSuccess;
      return currentState.hotels;
    }
    return [];
  }

  // Helper method để check if has more data
  bool hasMoreData() {
    if (state is HotelSearchSuccess) {
      final currentState = state as HotelSearchSuccess;
      return currentState.pagination.hasNext;
    }
    return false;
  }

  // Helper method để get current page
  int getCurrentPage() {
    if (state is HotelSearchSuccess) {
      final currentState = state as HotelSearchSuccess;
      return currentState.pagination.currentPage;
    }
    return 1;
  }
}