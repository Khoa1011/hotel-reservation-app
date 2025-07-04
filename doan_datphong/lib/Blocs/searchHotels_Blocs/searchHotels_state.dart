import 'package:equatable/equatable.dart';
import '../../Models/KhachSan.dart';
import '../../Models/SearchInfo.dart';


abstract class HotelSearchState extends Equatable {
  @override
  List<Object?> get props => [];
}

class HotelSearchInitial extends HotelSearchState {}

class HotelSearchLoading extends HotelSearchState {}

class HotelSearchSuccess extends HotelSearchState {
  final List<KhachSan> hotels;
  final SearchInfo searchInfo;
  final Pagination pagination;
  final SearchStatistics statistics;
  final List<SearchSuggestion>? suggestions;
  final Map<String, dynamic> currentFilters;

  HotelSearchSuccess({
    required this.hotels,
    required this.searchInfo,
    required this.pagination,
    required this.statistics,
    this.suggestions,
    this.currentFilters = const {},
  });

  @override
  List<Object?> get props => [
    hotels, searchInfo, pagination, statistics, suggestions, currentFilters
  ];

  HotelSearchSuccess copyWith({
    List<KhachSan>? hotels,
    SearchInfo? searchInfo,
    Pagination? pagination,
    SearchStatistics? statistics,
    List<SearchSuggestion>? suggestions,
    Map<String, dynamic>? currentFilters,
  }) {
    return HotelSearchSuccess(
      hotels: hotels ?? this.hotels,
      searchInfo: searchInfo ?? this.searchInfo,
      pagination: pagination ?? this.pagination,
      statistics: statistics ?? this.statistics,
      suggestions: suggestions ?? this.suggestions,
      currentFilters: currentFilters ?? this.currentFilters,
    );
  }
}

class HotelSearchFailure extends HotelSearchState {
  final String error;

  HotelSearchFailure(this.error);

  @override
  List<Object?> get props => [error];
}

// State cho load more
class HotelSearchLoadingMore extends HotelSearchState {
  final List<KhachSan> currentHotels;
  final SearchInfo searchInfo;
  final Pagination pagination;
  final SearchStatistics statistics;
  final Map<String, dynamic> currentFilters;

  HotelSearchLoadingMore({
    required this.currentHotels,
    required this.searchInfo,
    required this.pagination,
    required this.statistics,
    required this.currentFilters,
  });

  @override
  List<Object?> get props => [currentHotels, searchInfo, pagination, statistics, currentFilters];
}

// States cho suggestions
class SuggestionsLoading extends HotelSearchState {}

class SuggestionsSuccess extends HotelSearchState {
  final List<SearchSuggestion> suggestions;
  final String query;

  SuggestionsSuccess({
    required this.suggestions,
    required this.query,
  });

  @override
  List<Object?> get props => [suggestions, query];
}

class SuggestionsFailure extends HotelSearchState {
  final String error;

  SuggestionsFailure(this.error);

  @override
  List<Object?> get props => [error];
}

// States cho filter options
class FilterOptionsLoading extends HotelSearchState {}

class FilterOptionsSuccess extends HotelSearchState {
  final FilterOptions filterOptions;

  FilterOptionsSuccess({required this.filterOptions});

  @override
  List<Object?> get props => [filterOptions];
}

class FilterOptionsFailure extends HotelSearchState {
  final String error;

  FilterOptionsFailure(this.error);

  @override
  List<Object?> get props => [error];
}