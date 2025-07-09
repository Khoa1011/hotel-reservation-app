import 'package:equatable/equatable.dart';

abstract class HotelReviewEvent extends Equatable {
  const HotelReviewEvent();

  @override
  List<Object?> get props => [];
}

// Event lấy reviews mới nhất (cho preview)
class LoadRecentReviewsEvent extends HotelReviewEvent {
  final String hotelId;
  final int limit;

  const LoadRecentReviewsEvent({
    required this.hotelId,
    this.limit = 5,
  });

  @override
  List<Object?> get props => [hotelId, limit];
}

// Event lấy tất cả reviews (sắp xếp theo rating cao)
class LoadAllReviewsEvent extends HotelReviewEvent {
  final String hotelId;
  final String sortBy;

  const LoadAllReviewsEvent({
    required this.hotelId,
    this.sortBy = 'highest_rating',
  });

  @override
  List<Object?> get props => [hotelId, sortBy];
}