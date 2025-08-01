import 'package:flutter_bloc/flutter_bloc.dart';

import '../../Data/Provider/ApiResponse.dart';
import '../../Data/Repository/favoriteHotel_Repository/favoriteHotel_repo.dart';
import '../../Models/FavoriteHotels.dart';
import 'favoriteHotel_event.dart';
import 'favoriteHotel_state.dart';

class FavoriteHotelsBloc extends Bloc<FavoriteHotelsEvent, FavoriteHotelsState> {
  final FavoriteHotelsRepository favoriteRepository;

  // ✅ Cache danh sách hiện tại
  List<FavoriteHotel> _currentFavorites = [];

  FavoriteHotelsBloc({required this.favoriteRepository}) : super(FavoriteHotelsInitial()) {
    on<LoadFavoriteHotels>(_onLoadFavoriteHotels);
    on<AddFavoriteHotel>(_onAddFavoriteHotel);
    on<RemoveFavoriteHotel>(_onRemoveFavoriteHotel);
    on<CheckFavoriteStatus>(_onCheckFavoriteStatus);
  }

  void _onLoadFavoriteHotels(LoadFavoriteHotels event, Emitter<FavoriteHotelsState> emit) async {
    emit(FavoriteHotelsLoading());
    try {
      ApiResponse? res = await favoriteRepository.getFavoriteHotels(
        page: event.page,
        search: event.search,
      );

      if (res!.success) {
        final data = res.data;
        final favoritesData = data['favorites'] as List<dynamic>? ?? [];

        final favorites = favoritesData.map((json) => FavoriteHotel.fromJson(json)).toList();

        // ✅ Cache danh sách
        _currentFavorites = favorites;

        emit(FavoriteHotelsSuccess(
          favorites: favorites,
          currentPage: 1,
          totalPages: 1,
          totalFavorites: favorites.length,
        ));
      } else {
        emit(FavoriteHotelsFailure(errorMessage: res.message));
      }
    } catch (e) {
      print("FavoriteHotelsBloc loadFavoriteHotels error: $e");
      emit(FavoriteHotelsFailure(errorMessage: "Có lỗi không mong muốn xảy ra: ${e.toString()}"));
    }
  }

  void _onRemoveFavoriteHotel(RemoveFavoriteHotel event, Emitter<FavoriteHotelsState> emit) async {
    // Optimistic update: Xóa ngay khỏi danh sách hiện tại trước khi gọi API
    final updatedFavorites = _currentFavorites.where((fav) => fav.khachSan.id != event.hotelId).toList();
    _currentFavorites = updatedFavorites;

    // Emit state mới ngay lập tức
    emit(FavoriteHotelsSuccess(
      favorites: updatedFavorites,
      currentPage: 1,
      totalPages: 1,
      totalFavorites: updatedFavorites.length,
    ));

    try {
      ApiResponse? res = await favoriteRepository.removeFavoriteHotel(event.hotelId);

      if (res!.success) {
        // Gọi lại LoadFavoriteHotels để đồng bộ dữ liệu từ server
        add(LoadFavoriteHotels());
      } else {
        // Nếu API fail, rollback lại state trước đó
        emit(FavoriteHotelsFailure(errorMessage: res.message));
        add(LoadFavoriteHotels()); // Reload để đồng bộ lại dữ liệu
      }
    } catch (e) {
      emit(FavoriteHotelsFailure(errorMessage: "Xóa thất bại: ${e.toString()}"));
      add(LoadFavoriteHotels()); // Reload để đồng bộ lại dữ liệu
    }
  }

  void _onAddFavoriteHotel(AddFavoriteHotel event, Emitter<FavoriteHotelsState> emit) async {
    emit(FavoriteActionLoading());
    try {
      ApiResponse? res = await favoriteRepository.addFavoriteHotel(
        event.hotelId,
        ghiChu: event.ghiChu,
      );

      if (res!.success) {
        emit(FavoriteActionSuccess(message: res.message, isAdded: true));

        // ✅ Reload danh sách sau khi thêm
        add(LoadFavoriteHotels());

      } else {
        emit(FavoriteHotelsFailure(errorMessage: res.message));
      }
    } catch (e) {
      print("FavoriteHotelsBloc addFavoriteHotel error: $e");
      emit(FavoriteHotelsFailure(errorMessage: "Có lỗi không mong muốn xảy ra: ${e.toString()}"));
    }
  }

  void _onCheckFavoriteStatus(CheckFavoriteStatus event, Emitter<FavoriteHotelsState> emit) async {
    try {
      ApiResponse? res = await favoriteRepository.checkFavoriteStatus(event.hotelId);

      if (res!.success) {
        final data = res.data;
        emit(FavoriteStatusChecked(
          isFavorite: data['isFavorite'] ?? false,
          favoriteId: data['favoriteId'] ?? '',
        ));
      } else {
        emit(FavoriteHotelsFailure(errorMessage: res.message));
      }
    } catch (e) {
      print("FavoriteHotelsBloc checkFavoriteStatus error: $e");
      emit(FavoriteHotelsFailure(errorMessage: "Có lỗi không mong muốn xảy ra: ${e.toString()}"));
    }
  }

  // ✅ Helper methods
  bool isHotelFavorite(String hotelId) {
    return _currentFavorites.any((fav) => fav.khachSan.id == hotelId);
  }

  int get favoriteCount => _currentFavorites.length;
}