// ===== 1. HOTEL SEARCH RESPONSE MODEL =====
// File: lib/Models/HotelSearchResponse.dart

import 'package:doan_datphong/Data/Provider/IP_v4_Address.dart';
import 'package:doan_datphong/Models/KhachSan.dart';

import 'ViTri.dart';

class HotelSearchResponse {
  String message;
  SearchInfo searchInfo;
  Pagination pagination;
  SearchStatistics statistics;
  List<KhachSan> hotels;
  List<SearchSuggestion>? suggestions;

  HotelSearchResponse({
    required this.message,
    required this.searchInfo,
    required this.pagination,
    required this.statistics,
    required this.hotels,
    this.suggestions,
  });

  // Chuyển từ JSON sang object
  factory HotelSearchResponse.fromJson(Map<String, dynamic> json) {
    return HotelSearchResponse(
      message: json['message'] ?? '',
      searchInfo: SearchInfo.fromJson(json['searchInfo'] ?? {}),
      pagination: Pagination.fromJson(json['pagination'] ?? {}),
      statistics: SearchStatistics.fromJson(json['statistics'] ?? {}),
      hotels: (json['hotels'] as List?)
          ?.map((hotel) => KhachSan.fromJson(hotel))
          .toList() ?? [],
      suggestions: json['suggestions'] != null
          ? (json['suggestions'] as List)
          .map((suggestion) => SearchSuggestion.fromJson(suggestion))
          .toList()
          : null,
    );
  }

  // Chuyển object thành JSON
  Map<String, dynamic> toJson() {
    return {
      'message': message,
      'searchInfo': searchInfo.toJson(),
      'pagination': pagination.toJson(),
      'statistics': statistics.toJson(),
      'hotels': hotels.map((hotel) => hotel.toJson()).toList(),
      'suggestions': suggestions?.map((s) => s.toJson()).toList(),
    };
  }
}

// ===== 2. SEARCH INFO MODEL =====
// File: lib/Models/SearchInfo.dart

class SearchInfo {
  String? keyword;
  String? city;
  String? district;
  PriceRange? priceRange;
  StarRange? starRange;
  SearchFilters filters;
  String sorting;
  String searchTime;

  SearchInfo({
    this.keyword,
    this.city,
    this.district,
    this.priceRange,
    this.starRange,
    required this.filters,
    required this.sorting,
    required this.searchTime,
  });

  // Chuyển từ JSON sang object
  factory SearchInfo.fromJson(Map<String, dynamic> json) {
    return SearchInfo(
      keyword: json['keyword'],
      city: json['city'],
      district: json['district'],
      priceRange: json['priceRange'] != null
          ? PriceRange.fromJson(json['priceRange'])
          : null,
      starRange: json['starRange'] != null
          ? StarRange.fromJson(json['starRange'])
          : null,
      filters: SearchFilters.fromJson(json['filters'] ?? {}),
      sorting: json['sorting'] ?? 'rating_desc',
      searchTime: json['searchTime'] ?? '',
    );
  }

  // Chuyển object thành JSON
  Map<String, dynamic> toJson() {
    return {
      'keyword': keyword,
      'city': city,
      'district': district,
      'priceRange': priceRange?.toJson(),
      'starRange': starRange?.toJson(),
      'filters': filters.toJson(),
      'sorting': sorting,
      'searchTime': searchTime,
    };
  }
}

// ===== 3. PRICE RANGE MODEL =====
// File: lib/Models/PriceRange.dart

class PriceRange {
  double? min;
  double? max;
  double? avg;

  PriceRange({
    this.min,
    this.max,
    this.avg,
  });

  // Chuyển từ JSON sang object
  factory PriceRange.fromJson(Map<String, dynamic> json) {
    return PriceRange(
      min: json['min']?.toDouble(),
      max: json['max']?.toDouble(),
      avg: json['avg']?.toDouble(),
    );
  }

  // Chuyển object thành JSON
  Map<String, dynamic> toJson() {
    return {
      'min': min,
      'max': max,
      'avg': avg,
    };
  }
}

// ===== 4. STAR RANGE MODEL =====
// File: lib/Models/StarRange.dart

class StarRange {
  int? min;
  int? max;
  double? avg;

  StarRange({
    this.min,
    this.max,
    this.avg,
  });

  // Chuyển từ JSON sang object
  factory StarRange.fromJson(Map<String, dynamic> json) {
    return StarRange(
      min: json['min']?.toInt(),
      max: json['max']?.toInt(),
      avg: json['avg']?.toDouble(),
    );
  }

  // Chuyển object thành JSON
  Map<String, dynamic> toJson() {
    return {
      'min': min,
      'max': max,
      'avg': avg,
    };
  }
}

// ===== 5. SEARCH FILTERS MODEL =====
// File: lib/Models/SearchFilters.dart

class SearchFilters {
  List<String> hotelTypes;
  List<String> amenities;
  int? guests;
  int? rooms;
  bool hasAvailability;

  SearchFilters({
    required this.hotelTypes,
    required this.amenities,
    this.guests,
    this.rooms,
    required this.hasAvailability,
  });

  // Chuyển từ JSON sang object
  factory SearchFilters.fromJson(Map<String, dynamic> json) {
    return SearchFilters(
      hotelTypes: List<String>.from(json['hotelTypes'] ?? []),
      amenities: List<String>.from(json['amenities'] ?? []),
      guests: json['guests'],
      rooms: json['rooms'],
      hasAvailability: json['hasAvailability'] ?? false,
    );
  }

  // Chuyển object thành JSON
  Map<String, dynamic> toJson() {
    return {
      'hotelTypes': hotelTypes,
      'amenities': amenities,
      'guests': guests,
      'rooms': rooms,
      'hasAvailability': hasAvailability,
    };
  }
}

// ===== 6. PAGINATION MODEL =====
// File: lib/Models/Pagination.dart

class Pagination {
  int currentPage;
  int totalPages;
  int totalItems;
  int itemsPerPage;
  bool hasNext;
  bool hasPrev;
  int? nextPage;
  int? prevPage;

  Pagination({
    required this.currentPage,
    required this.totalPages,
    required this.totalItems,
    required this.itemsPerPage,
    required this.hasNext,
    required this.hasPrev,
    this.nextPage,
    this.prevPage,
  });

  // Chuyển từ JSON sang object
  factory Pagination.fromJson(Map<String, dynamic> json) {
    return Pagination(
      currentPage: json['currentPage'] ?? 1,
      totalPages: json['totalPages'] ?? 1,
      totalItems: json['totalItems'] ?? 0,
      itemsPerPage: json['itemsPerPage'] ?? 10,
      hasNext: json['hasNext'] ?? false,
      hasPrev: json['hasPrev'] ?? false,
      nextPage: json['nextPage'],
      prevPage: json['prevPage'],
    );
  }

  // Chuyển object thành JSON
  Map<String, dynamic> toJson() {
    return {
      'currentPage': currentPage,
      'totalPages': totalPages,
      'totalItems': totalItems,
      'itemsPerPage': itemsPerPage,
      'hasNext': hasNext,
      'hasPrev': hasPrev,
      'nextPage': nextPage,
      'prevPage': prevPage,
    };
  }
}

// ===== 7. SEARCH STATISTICS MODEL =====
// File: lib/Models/SearchStatistics.dart

class SearchStatistics {
  int totalHotels;
  PriceRange? priceRange;
  StarRange? starRange;
  List<String> hotelTypes;
  List<String> cities;
  List<String> districts;

  SearchStatistics({
    required this.totalHotels,
    this.priceRange,
    this.starRange,
    required this.hotelTypes,
    required this.cities,
    required this.districts,
  });

  // Chuyển từ JSON sang object
  factory SearchStatistics.fromJson(Map<String, dynamic> json) {
    return SearchStatistics(
      totalHotels: json['totalHotels'] ?? 0,
      priceRange: json['priceRange'] != null
          ? PriceRange.fromJson(json['priceRange'])
          : null,
      starRange: json['starRange'] != null
          ? StarRange.fromJson(json['starRange'])
          : null,
      hotelTypes: List<String>.from(json['hotelTypes'] ?? []),
      cities: List<String>.from(json['cities'] ?? []),
      districts: List<String>.from(json['districts'] ?? []),
    );
  }

  // Chuyển object thành JSON
  Map<String, dynamic> toJson() {
    return {
      'totalHotels': totalHotels,
      'priceRange': priceRange?.toJson(),
      'starRange': starRange?.toJson(),
      'hotelTypes': hotelTypes,
      'cities': cities,
      'districts': districts,
    };
  }
}

// ===== 8. SEARCH SUGGESTION MODEL =====
// File: lib/Models/SearchSuggestion.dart

class SearchSuggestion {
  String type;
  String title;
  String subtitle;
  double? stars;
  String value;
  String? id;
  int? count;

  SearchSuggestion({
    required this.type,
    required this.title,
    required this.subtitle,
    this.stars,
    required this.value,
    this.id,
    this.count,
  });

  // Chuyển từ JSON sang object
  factory SearchSuggestion.fromJson(Map<String, dynamic> json) {
    return SearchSuggestion(
      type: json['type'] ?? '',
      title: json['title'] ?? '',
      subtitle: json['subtitle'] ?? '',
      stars: json['stars']?.toDouble(),
      value: json['value'] ?? '',
      id: json['id'],
      count: json['count'],
    );
  }

  // Chuyển object thành JSON
  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'title': title,
      'subtitle': subtitle,
      'stars': stars,
      'value': value,
      'id': id,
      'count': count,
    };
  }
}

// ===== 9. SUGGESTIONS RESPONSE MODEL =====
// File: lib/Models/SuggestionsResponse.dart

class SuggestionsResponse {
  List<SearchSuggestion> suggestions;
  String query;
  int total;

  SuggestionsResponse({
    required this.suggestions,
    required this.query,
    required this.total,
  });

  // Chuyển từ JSON sang object
  factory SuggestionsResponse.fromJson(Map<String, dynamic> json) {
    return SuggestionsResponse(
      suggestions: (json['suggestions'] as List?)
          ?.map((s) => SearchSuggestion.fromJson(s))
          .toList() ?? [],
      query: json['query'] ?? '',
      total: json['total'] ?? 0,
    );
  }

  // Chuyển object thành JSON
  Map<String, dynamic> toJson() {
    return {
      'suggestions': suggestions.map((s) => s.toJson()).toList(),
      'query': query,
      'total': total,
    };
  }
}

// ===== 10. FILTER OPTIONS MODEL =====
// File: lib/Models/FilterOptions.dart

class FilterOptions {
  PriceRange priceRange;
  StarRange starRange;
  List<FilterCity> cities;
  List<FilterDistrict> districts;
  List<FilterHotelType> hotelTypes;
  List<FilterAmenity> amenities;

  FilterOptions({
    required this.priceRange,
    required this.starRange,
    required this.cities,
    required this.districts,
    required this.hotelTypes,
    required this.amenities,
  });

  // Chuyển từ JSON sang object
  factory FilterOptions.fromJson(Map<String, dynamic> json) {
    return FilterOptions(
      priceRange: PriceRange.fromJson(json['priceRange'] ?? {}),
      starRange: StarRange.fromJson(json['starRange'] ?? {}),
      cities: (json['cities'] as List?)
          ?.map((c) => FilterCity.fromJson(c))
          .toList() ?? [],
      districts: (json['districts'] as List?)
          ?.map((d) => FilterDistrict.fromJson(d))
          .toList() ?? [],
      hotelTypes: (json['hotelTypes'] as List?)
          ?.map((h) => FilterHotelType.fromJson(h))
          .toList() ?? [],
      amenities: (json['amenities'] as List?)
          ?.map((a) => FilterAmenity.fromJson(a))
          .toList() ?? [],
    );
  }

  // Chuyển object thành JSON
  Map<String, dynamic> toJson() {
    return {
      'priceRange': priceRange.toJson(),
      'starRange': starRange.toJson(),
      'cities': cities.map((c) => c.toJson()).toList(),
      'districts': districts.map((d) => d.toJson()).toList(),
      'hotelTypes': hotelTypes.map((h) => h.toJson()).toList(),
      'amenities': amenities.map((a) => a.toJson()).toList(),
    };
  }
}

// ===== 11. FILTER CITY MODEL =====
// File: lib/Models/FilterCity.dart

class FilterCity {
  String name;
  int count;

  FilterCity({
    required this.name,
    required this.count,
  });

  // Chuyển từ JSON sang object
  factory FilterCity.fromJson(Map<String, dynamic> json) {
    return FilterCity(
      name: json['name'] ?? '',
      count: json['count'] ?? 0,
    );
  }

  // Chuyển object thành JSON
  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'count': count,
    };
  }
}

// ===== 12. FILTER DISTRICT MODEL =====
// File: lib/Models/FilterDistrict.dart

class FilterDistrict {
  String name;
  String city;
  int count;

  FilterDistrict({
    required this.name,
    required this.city,
    required this.count,
  });

  // Chuyển từ JSON sang object
  factory FilterDistrict.fromJson(Map<String, dynamic> json) {
    return FilterDistrict(
      name: json['name'] ?? '',
      city: json['city'] ?? '',
      count: json['count'] ?? 0,
    );
  }

  // Chuyển object thành JSON
  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'city': city,
      'count': count,
    };
  }
}

// ===== 13. FILTER HOTEL TYPE MODEL =====
// File: lib/Models/FilterHotelType.dart

class FilterHotelType {
  String type;
  int count;

  FilterHotelType({
    required this.type,
    required this.count,
  });

  // Chuyển từ JSON sang object
  factory FilterHotelType.fromJson(Map<String, dynamic> json) {
    return FilterHotelType(
      type: json['type'] ?? '',
      count: json['count'] ?? 0,
    );
  }

  // Chuyển object thành JSON
  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'count': count,
    };
  }
}

// ===== 14. FILTER AMENITY MODEL =====
// File: lib/Models/FilterAmenity.dart

class FilterAmenity {
  String id;
  String name;
  String icon;
  String category;

  FilterAmenity({
    required this.id,
    required this.name,
    required this.icon,
    required this.category,
  });

  // Chuyển từ JSON sang object
  factory FilterAmenity.fromJson(Map<String, dynamic> json) {
    return FilterAmenity(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      icon: json['icon'] ?? '',
      category: json['category'] ?? '',
    );
  }

  // Chuyển object thành JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'icon': icon,
      'category': category,
    };
  }
}

// ===== 15. UPDATED HOTELS MODEL =====
// File: lib/Models/KhachSan.dart - Cập nhật để support search response


class Hotels {
  String id;
  String tenKhachSan;
  String diaChi;
  String hinhAnh;
  String thanhPho;
  String moTa;
  double soSao;
  String soDienThoai;
  String? loaiMoHinh;
  String? trangThai;
  String email;
  double giaCa;
  ViTri? viTri;

  // === CÁC FIELD MỚI CHO SEARCH ===
  double? minRoomPrice;
  double? maxRoomPrice;
  double? avgRoomPrice;
  int? totalRoomTypes;
  int? totalRooms;
  int? maxCapacity;
  PriceRange? priceRange;
  bool? hasImage;
  bool? isVerified;
  double? giaTheoNgay;
  int? searchScore;
  double? distanceFromCenter;
  int? popularityScore;
  String? priceLevel;
  String? availabilityStatus;

  Hotels({
    required this.id,
    required this.tenKhachSan,
    required this.diaChi,
    required this.hinhAnh,
    required this.thanhPho,
    required this.moTa,
    required this.soSao,
    required this.soDienThoai,
    required this.email,
    required this.giaCa,
    this.viTri,
    this.loaiMoHinh,
    this.trangThai,
    // New fields
    this.minRoomPrice,
    this.maxRoomPrice,
    this.avgRoomPrice,
    this.totalRoomTypes,
    this.totalRooms,
    this.maxCapacity,
    this.priceRange,
    this.hasImage,
    this.isVerified,
    this.giaTheoNgay,
    this.searchScore,
    this.distanceFromCenter,
    this.popularityScore,
    this.priceLevel,
    this.availabilityStatus,
  });

  // Chuyển từ JSON sang object
  factory Hotels.fromJson(Map<String, dynamic> json) {
    final String baseImageUrl = IPv4.IP_CURRENT;
    return Hotels(
      id: json['_id'] ?? '',
      tenKhachSan: json['tenKhachSan'] ?? '',
      diaChi: json['diaChiDayDu'] ?? json['location']?['fullAddress'] ?? '',
      hinhAnh: baseImageUrl + (json['hinhAnh'] ?? ''),
      thanhPho: json['thanhPho'] ?? json['location']?['city'] ?? '',
      moTa: json['moTa'] ?? '',
      soSao: (json['soSao'] as num).toDouble(),
      soDienThoai: json['soDienThoai'] ?? '',
      email: json['email'] ?? '',
      giaCa: (json['giaTheoNgay'] ?? json['minRoomPrice'] ?? 0).toDouble(),
      viTri: json["diaChi"] != null
          ? ViTri.fromJson(json["diaChi"])
          : null,
      loaiMoHinh: json['loaiKhachSan'],
      trangThai: json['trangThai'],

      // New fields from search API
      minRoomPrice: json['minRoomPrice']?.toDouble(),
      maxRoomPrice: json['maxRoomPrice']?.toDouble(),
      avgRoomPrice: json['avgRoomPrice']?.toDouble(),
      totalRoomTypes: json['totalRoomTypes'],
      totalRooms: json['totalRooms'],
      maxCapacity: json['maxCapacity'],
      priceRange: json['priceRange'] != null
          ? PriceRange.fromJson(json['priceRange'])
          : null,
      hasImage: json['hasImage'],
      isVerified: json['isVerified'],
      giaTheoNgay: json['giaTheoNgay']?.toDouble(),
      searchScore: json['searchScore'],
      distanceFromCenter: json['distanceFromCenter']?.toDouble(),
      popularityScore: json['popularityScore'],
      priceLevel: json['priceLevel'],
      availabilityStatus: json['availabilityStatus'],
    );
  }

  // Chuyển object thành JSON
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'tenKhachSan': tenKhachSan,
      'diaChiDayDu': diaChi,
      'hinhAnh': hinhAnh,
      'thanhPho': thanhPho,
      'moTa': moTa,
      'soSao': soSao,
      'soDienThoai': soDienThoai,
      'email': email,
      'giaCa': giaCa,
      'loaiKhachSan': loaiMoHinh,
      'trangThai': trangThai,
      'minRoomPrice': minRoomPrice,
      'maxRoomPrice': maxRoomPrice,
      'avgRoomPrice': avgRoomPrice,
      'totalRoomTypes': totalRoomTypes,
      'totalRooms': totalRooms,
      'maxCapacity': maxCapacity,
      'priceRange': priceRange?.toJson(),
      'hasImage': hasImage,
      'isVerified': isVerified,
      'giaTheoNgay': giaTheoNgay,
      'searchScore': searchScore,
      'distanceFromCenter': distanceFromCenter,
      'popularityScore': popularityScore,
      'priceLevel': priceLevel,
      'availabilityStatus': availabilityStatus,
    };
  }
}