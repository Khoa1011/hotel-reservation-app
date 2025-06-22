import 'package:doan_datphong/Models/TienNghi.dart';
import 'package:doan_datphong/Models/NhomTienNghi.dart';

abstract class GetAmenitiesState {
  @override
  List<Object?> get props => [];
}

class GetAmenitiesInitial extends GetAmenitiesState {}

// 🔥 STATES CHO KEY AMENITIES
class GetKeyAmenitiesLoading extends GetAmenitiesState {}

class GetKeyAmenitiesSuccess extends GetAmenitiesState {
  final List<TienNghi> keyAmenities;

  GetKeyAmenitiesSuccess({required this.keyAmenities});

  @override
  List<Object?> get props => [keyAmenities];
}

class GetKeyAmenitiesFailure extends GetAmenitiesState {
  final String error;

  GetKeyAmenitiesFailure(this.error);

  @override
  List<Object?> get props => [error];
}

// 🔥 STATES CHO GROUPED AMENITIES
class GetGroupedAmenitiesLoading extends GetAmenitiesState {}

class GetGroupedAmenitiesSuccess extends GetAmenitiesState {
  final List<NhomTienNghi> groupedAmenities;
  final int categoriesCount;
  final int totalAmenities;

  GetGroupedAmenitiesSuccess({
    required this.groupedAmenities,
    required this.categoriesCount,
    required this.totalAmenities,
  });

  @override
  List<Object?> get props => [groupedAmenities, categoriesCount, totalAmenities];
}

class GetGroupedAmenitiesFailure extends GetAmenitiesState {
  final String error;

  GetGroupedAmenitiesFailure(this.error);

  @override
  List<Object?> get props => [error];
}