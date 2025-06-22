import 'package:flutter_bloc/flutter_bloc.dart';

import '../../Data/Repository/getAmenities_Repository/getAmenities_repo.dart';
import '../../Models/NhomTienNghi.dart';
import '../../Models/TienNghi.dart';
import 'getAmenities_event.dart';
import 'getAmenities_state.dart';

class GetAmenitiesBloc extends Bloc<GetAmenitiesEvent, GetAmenitiesState> {
  late final GetAmenitiesRepository getAmenitiesRepo;

  GetAmenitiesBloc({required this.getAmenitiesRepo})
      : super(GetAmenitiesInitial()) {
    on<FetchKeyAmenities>(_onFetchKeyAmenities);
    on<FetchGroupedAmenities>(_onFetchGroupedAmenities);
  }

  // 🔥 HANDLER CHO KEY AMENITIES
  void _onFetchKeyAmenities(FetchKeyAmenities event,
      Emitter<GetAmenitiesState> emit) async {
    emit(GetKeyAmenitiesLoading());

    try {
      List<TienNghi> keyAmenities = await getAmenitiesRepo.fetchAmenities(
          event.hotelId);
      emit(GetKeyAmenitiesSuccess(keyAmenities: keyAmenities));
    } catch (err) {
      emit(GetKeyAmenitiesFailure(err.toString()));
    }
  }

  // 🔥 HANDLER CHO GROUPED AMENITIES
  void _onFetchGroupedAmenities(FetchGroupedAmenities event,
      Emitter<GetAmenitiesState> emit) async {
    emit(GetGroupedAmenitiesLoading());

    try {
      List<NhomTienNghi> groupedAmenities = await getAmenitiesRepo
          .fetchAmenityCategory(event.hotelId);

      // Tính toán metadata
      int categoriesCount = groupedAmenities.length;
      int totalAmenities = groupedAmenities.fold(
          0,
              (total, category) => total + category.tienNghi.length
      );

      emit(GetGroupedAmenitiesSuccess(
        groupedAmenities: groupedAmenities,
        categoriesCount: categoriesCount,
        totalAmenities: totalAmenities,
      ));
    } catch (err) {
      emit(GetGroupedAmenitiesFailure(err.toString()));
    }
  }
}