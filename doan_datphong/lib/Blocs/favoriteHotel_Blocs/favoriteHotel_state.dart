import '../../Models/FavoriteHotels.dart';

abstract class FavoriteHotelsState {}

class FavoriteHotelsInitial extends FavoriteHotelsState {}

class FavoriteHotelsLoading extends FavoriteHotelsState {}

class FavoriteHotelsSuccess extends FavoriteHotelsState {
  final List<FavoriteHotel> favorites;
  final int currentPage;
  final int totalPages;
  final int totalFavorites;

  FavoriteHotelsSuccess({
    required this.favorites,
    required this.currentPage,
    required this.totalPages,
    required this.totalFavorites,
  });
}

class FavoriteHotelsFailure extends FavoriteHotelsState {
  final String errorMessage;

  FavoriteHotelsFailure({required this.errorMessage});
}

class FavoriteActionLoading extends FavoriteHotelsState {}

class FavoriteActionSuccess extends FavoriteHotelsState {
  final String message;
  final bool isAdded;

  FavoriteActionSuccess({required this.message, required this.isAdded});
}

class FavoriteStatusChecked extends FavoriteHotelsState {
  final bool isFavorite;
  final String favoriteId;

  FavoriteStatusChecked({required this.isFavorite, required this.favoriteId});
}