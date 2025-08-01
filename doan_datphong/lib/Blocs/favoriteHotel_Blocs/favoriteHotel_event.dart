abstract class FavoriteHotelsEvent {}

class LoadFavoriteHotels extends FavoriteHotelsEvent {
  final int page;
  final String search;

  LoadFavoriteHotels({this.page = 1, this.search = ""});
}

class AddFavoriteHotel extends FavoriteHotelsEvent {
  final String hotelId;
  final String ghiChu;

  AddFavoriteHotel({required this.hotelId, this.ghiChu = ""});
}

class RemoveFavoriteHotel extends FavoriteHotelsEvent {
  final String hotelId;

  RemoveFavoriteHotel({required this.hotelId});
}

class CheckFavoriteStatus extends FavoriteHotelsEvent {
  final String hotelId;

  CheckFavoriteStatus({required this.hotelId});
}