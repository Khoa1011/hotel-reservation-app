import 'KhachSan.dart';

class SearchInfo {
  String? tinhThanh;
  String? phuongXa;
  PriceRange? priceRange;
  int? guests;
  int? rooms;
  String? checkIn;
  String? checkOut;
  String? bookingType;

  SearchInfo({
    this.tinhThanh,
    this.phuongXa,
    this.priceRange,
    this.guests,
    this.rooms,
    this.checkIn,
    this.checkOut,
    this.bookingType,
  });

  factory SearchInfo.fromJson(Map<String, dynamic> json) {
    return SearchInfo(
      tinhThanh: json['tinhThanh'],
      phuongXa: json['phuongXa'],
      priceRange: json['priceRange'] != null
          ? PriceRange.fromJson(json['priceRange'])
          : null,
      guests: json['guests'],
      rooms: json['rooms'],
      checkIn: json['checkIn'],
      checkOut: json['checkOut'],
      bookingType: json['bookingType'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'tinhThanh': tinhThanh,
      'phuongXa': phuongXa,
      'priceRange': priceRange?.toJson(),
      'guests': guests,
      'rooms': rooms,
      'checkIn': checkIn,
      'checkOut': checkOut,
      'bookingType': bookingType,
    };
  }
}

// ========== 5. PRICE RANGE MODEL - KHÔNG THAY ĐỔI ==========
class PriceRange {
  double? min;
  double? max;

  PriceRange({this.min, this.max});

  factory PriceRange.fromJson(Map<String, dynamic> json) {
    return PriceRange(
      min: json['min']?.toDouble(),
      max: json['max']?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'min': min,
      'max': max,
    };
  }

  String get displayRange {
    if (min != null && max != null) {
      return '${min!.toInt()} - ${max!.toInt()} VND';
    } else if (min != null) {
      return 'Từ ${min!.toInt()} VND';
    } else if (max != null) {
      return 'Tối đa ${max!.toInt()} VND';
    }
    return 'Không xác định';
  }
}

// ========== 6. SEARCH SUGGESTION MODEL - KHÔNG THAY ĐỔI ==========
class SearchSuggestion {
  String type;
  String title;
  String subtitle;
  String value;
  int? count;

  SearchSuggestion({
    required this.type,
    required this.title,
    required this.subtitle,
    required this.value,
    this.count,
  });

  factory SearchSuggestion.fromJson(Map<String, dynamic> json) {
    return SearchSuggestion(
      type: json['type'] ?? '',
      title: json['title'] ?? '',
      subtitle: json['subtitle'] ?? '',
      value: json['value'] ?? '',
      count: json['count'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'title': title,
      'subtitle': subtitle,
      'value': value,
      'count': count,
    };
  }
}

// ========== 7. SUGGESTIONS RESPONSE MODEL - KHÔNG THAY ĐỔI ==========
class SuggestionsResponse {
  List<SearchSuggestion> suggestions;
  String query;
  int total;

  SuggestionsResponse({
    required this.suggestions,
    required this.query,
    required this.total,
  });

  factory SuggestionsResponse.fromJson(Map<String, dynamic> json) {
    return SuggestionsResponse(
      suggestions: (json['suggestions'] as List?)
          ?.map((s) => SearchSuggestion.fromJson(s))
          .toList() ?? [],
      query: json['query'] ?? '',
      total: json['total'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'suggestions': suggestions.map((s) => s.toJson()).toList(),
      'query': query,
      'total': total,
    };
  }
}

// ========== 8. HOTEL SEARCH RESPONSE MODEL - CẬP NHẬT ==========
class HotelSearchResponse {
  String message;
  SearchInfo searchInfo;
  List<KhachSan> hotels;
  int total;

  HotelSearchResponse({
    required this.message,
    required this.searchInfo,
    required this.hotels,
    required this.total,
  });

  factory HotelSearchResponse.fromJson(Map<String, dynamic> json) {
    return HotelSearchResponse(
      message: json['message'] ?? '',
      searchInfo: SearchInfo.fromJson(json['searchInfo'] ?? {}),
      hotels: (json['hotels'] as List?)
          ?.map((hotel) => KhachSan.fromJson(hotel))
          .toList() ?? [],
      total: json['hotels'] != null
          ? (json['hotels'] as List).length
          : 0, // ✅ Tính total từ length của hotels array
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'message': message,
      'searchInfo': searchInfo.toJson(),
      'hotels': hotels.map((hotel) => hotel.toJson()).toList(),
      'total': total,
    };
  }

  bool get hasResults => hotels.isNotEmpty;


}