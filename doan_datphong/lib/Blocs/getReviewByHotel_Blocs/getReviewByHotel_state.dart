import 'package:doan_datphong/Models/DanhGiaRespone.dart';
import 'package:doan_datphong/Models/ThongKeDanhGia.dart';

abstract class HotelReviewState {}

class HotelReviewInitial extends HotelReviewState {}

class HotelReviewLoading extends HotelReviewState {}

class HotelReviewSuccess extends HotelReviewState {
  final List<DanhGiaResponse> reviews;
  final String message;
  final ThongKeDanhGia? thongKe;

  HotelReviewSuccess({
    required this.reviews,
    required this.message,
     this.thongKe
  });
}

class HotelReviewFailure extends HotelReviewState {
  final String error;

  HotelReviewFailure({required this.error});
}