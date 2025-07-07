import 'package:doan_datphong/Blocs/searchHotels_Blocs/searchHotels_event.dart';
import 'package:doan_datphong/Blocs/searchHotels_Blocs/searchHotels_state.dart';
import 'package:doan_datphong/Data/Provider/ApiResponse.dart';
import 'package:doan_datphong/Models/KhachSan.dart';
import 'package:doan_datphong/Models/SearchInfo.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../Data/Repository/searchHotels_Repository/searchHotels_repo.dart';

class HotelSearchBloc extends Bloc<HotelSearchEvent, HotelSearchState> {
  final HotelSearchRepository repository;

  HotelSearchBloc({required this.repository}) : super(HotelSearchInitial()) {
    on<SearchHotels>(_onSearchHotels);

  }

  void _onSearchHotels(SearchHotels event, Emitter<HotelSearchState> emit) async {
    emit(HotelSearchLoading());

    try {
      ApiResponse response = await repository.searchHotels(

        tenKhachSan: event.tenKhachSan,
        tinhThanh: event.tinhThanh,
        phuongXa: event.phuongXa,
        minPrice: event.minPrice,
        maxPrice: event.maxPrice,
        guests: event.guests,
        rooms: event.rooms,
        checkIn: event.checkIn,
        checkOut: event.checkOut,
        bookingType: event.bookingType,

      );

      emit(HotelSearchSuccess(
        hotels: response.data,
        message: response.message
      ));
    } catch (err) {
      emit(HotelSearchFailure(err.toString()));
    }
  }

  List<KhachSan> getFilteredHotels() {
    if (state is HotelSearchSuccess) {
      return (state as HotelSearchSuccess).hotels;
    }
    return [];
  }
}
