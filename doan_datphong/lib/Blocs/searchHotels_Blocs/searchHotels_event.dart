import 'package:equatable/equatable.dart';

abstract class HotelSearchEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

// Event tìm kiếm khách sạn
class SearchHotels extends HotelSearchEvent {
  final String? keyword;
  final String? city;
  final String? district;
  final double? minPrice;
  final double? maxPrice;
  final int? minStars;
  final int? maxStars;
  final List<String>? hotelTypes;
  final List<String>? amenities;
  final int? guests;
  final int? rooms;
  final String? checkIn;
  final String? checkOut;
  final String? bookingType;
  final String? sortBy;
  final int page;
  final int limit;
  final bool? hasAvailability;

  SearchHotels({
    this.keyword,
    this.city,
    this.district,
    this.minPrice,
    this.maxPrice,
    this.minStars,
    this.maxStars,
    this.hotelTypes,
    this.amenities,
    this.guests,
    this.rooms,
    this.checkIn,
    this.checkOut,
    this.bookingType,
    this.sortBy,
    this.page = 1,
    this.limit = 10,
    this.hasAvailability,
  });

  @override
  List<Object?> get props => [
    keyword, city, district, minPrice, maxPrice, minStars, maxStars,
    hotelTypes, amenities, guests, rooms, checkIn, checkOut, bookingType,
    sortBy, page, limit, hasAvailability
  ];
}

// Event lấy gợi ý tìm kiếm
class GetSearchSuggestions extends HotelSearchEvent {
  final String query;
  final String type;
  final int limit;

  GetSearchSuggestions({
    required this.query,
    this.type = 'all',
    this.limit = 10,
  });

  @override
  List<Object?> get props => [query, type, limit];
}

// Event lấy filter options
class GetFilterOptions extends HotelSearchEvent {
  final String? city;
  final String? district;

  GetFilterOptions({
    this.city,
    this.district,
  });

  @override
  List<Object?> get props => [city, district];
}

// Event clear search
class ClearSearch extends HotelSearchEvent {}

// Event load more hotels (pagination)
class LoadMoreHotels extends HotelSearchEvent {
  final int page;

  LoadMoreHotels({required this.page});

  @override
  List<Object?> get props => [page];
}

// Event thay đổi filter
class UpdateFilters extends HotelSearchEvent {
  final Map<String, dynamic> filters;

  UpdateFilters({required this.filters});

  @override
  List<Object?> get props => [filters];
}

// Event refresh search
class RefreshSearch extends HotelSearchEvent {}