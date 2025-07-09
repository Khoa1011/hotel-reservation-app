import 'package:doan_datphong/Models/DanhGia.dart';

abstract class ReviewState {}

// Trạng thái khởi tạo
class SubmitReviewInitial extends ReviewState {}

// Trạng thái đang loading
class SubmitReviewLoading extends ReviewState {}

// ✅ Event để submit review
class SubmitReviewSuccess extends ReviewState {
  final DanhGia? danhGia;
  final String message;

  SubmitReviewSuccess({
    this.danhGia,
    required this.message,
  });


}
class SubmitReviewFailure extends ReviewState {
  final String error;
 SubmitReviewFailure({required this.error});
}

