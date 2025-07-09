import 'package:doan_datphong/Blocs/review_Blocs/review_event.dart';
import 'package:doan_datphong/Blocs/review_Blocs/review_state.dart';
import 'package:doan_datphong/Data/Provider/ApiResponse.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';

import '../../Data/Repository/review_Repository/review_repo.dart';

class ReviewBloc extends Bloc<ReviewEvent, ReviewState> {
  final ReviewRepository reviewRepository;

  ReviewBloc({required this.reviewRepository}) : super(SubmitReviewInitial()) {
    on<SubmitReviewEvent>(_onSubmitReview);
  }

  // ✅ Submit review
  Future<void> _onSubmitReview(SubmitReviewEvent event, Emitter<ReviewState> emit,) async {
    emit(SubmitReviewLoading());

    try {


      ApiResponse response = await reviewRepository.submitReview(event.danhGia);

      if (response.success) {
        emit(SubmitReviewSuccess(
          message: response.message,
        ));
      } else {
        emit(SubmitReviewFailure(error: response.message));
      }
    } catch (e) {
      print("❌ ReviewBloc: Exception in submit review - $e");
      emit(SubmitReviewFailure(error: e.toString()));
    }
  }


}