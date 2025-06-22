import 'package:equatable/equatable.dart';

abstract class GetAmenitiesEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class FetchKeyAmenities extends GetAmenitiesEvent {
  final String hotelId;

  FetchKeyAmenities(this.hotelId);

  @override
  List<Object?> get props => [hotelId];
}

class FetchGroupedAmenities extends GetAmenitiesEvent {
  final String hotelId;

  FetchGroupedAmenities(this.hotelId);

  @override
  List<Object?> get props => [hotelId];
}

