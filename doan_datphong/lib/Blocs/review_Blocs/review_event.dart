import 'package:doan_datphong/Models/DanhGia.dart';
import 'package:equatable/equatable.dart';

abstract class ReviewEvent extends Equatable {
  const ReviewEvent();

  @override
  List<Object?> get props => [];
}

// ✅ Event để submit review
class SubmitReviewEvent extends ReviewEvent {
  final DanhGia danhGia;

  const SubmitReviewEvent({
    required this.danhGia,
  });

  @override
  List<Object?> get props => [danhGia];

}

