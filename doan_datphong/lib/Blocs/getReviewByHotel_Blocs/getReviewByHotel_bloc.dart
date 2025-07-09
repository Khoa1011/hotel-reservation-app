import 'package:doan_datphong/Models/DanhGiaRespone.dart';
import 'package:doan_datphong/Models/ThongKeDanhGia.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../Data/Provider/ApiResponse.dart';
import '../../Data/Repository/getReviewByHotel_Repository/getReviewByHotel_repo.dart';
import 'getReviewByHotel_event.dart';
import 'getReviewByHotel_state.dart';

class HotelReviewBloc extends Bloc<HotelReviewEvent, HotelReviewState> {
  final HotelReviewRepository hotelReviewRepository;

  HotelReviewBloc({required this.hotelReviewRepository}) : super(HotelReviewInitial()) {
    on<LoadRecentReviewsEvent>(_onLoadRecentReviews);
    on<LoadAllReviewsEvent>(_onLoadAllReviews);
  }

  // ✅ Load recent reviews
  Future<void> _onLoadRecentReviews(
      LoadRecentReviewsEvent event,
      Emitter<HotelReviewState> emit,
      ) async {
    emit(HotelReviewLoading());

    try {
      ApiResponse response = await hotelReviewRepository.getRecentReviews(
        event.hotelId,
        limit: event.limit,
      );

      if (response.success) {
        final reviewsData = response.data['reviews'] as List;
        final reviews = reviewsData
            .map((reviewJson) => DanhGiaResponse.fromJson(reviewJson))
            .toList();

        emit(HotelReviewSuccess(
          reviews: reviews,
          message: response.message,
          thongKe: response.data['statistics'] != null
              ? ThongKeDanhGia.fromJson(response.data['statistics'])
              : null,
        ));
      } else {
        emit(HotelReviewFailure(error: response.message));
      }
    } catch (e) {
      print("❌ HotelReviewBloc: Exception in recent reviews - $e");
      emit(HotelReviewFailure(error: e.toString()));
    }
  }

  // ✅ Load all reviews
  Future<void> _onLoadAllReviews(
      LoadAllReviewsEvent event,
      Emitter<HotelReviewState> emit,
      ) async {
    emit(HotelReviewLoading());

    try {
      ApiResponse response = await hotelReviewRepository.getAllReviews(
        event.hotelId,
        sortBy: event.sortBy,
      );

      if (response.success) {
        final reviewsData = response.data['reviews'] as List;
        final reviews = reviewsData
            .map((reviewJson) => DanhGiaResponse.fromJson(reviewJson))
            .toList();
        print("Trong bloc, reviewsData: ${reviewsData}");
        print("Trong bloc, reviews: ${reviews}");
        print("Trong bloc, response: ${response.data['reviews']}");
        emit(HotelReviewSuccess(
          reviews: reviews,
          message: response.message,
          thongKe: response.data['statistics'] != null
              ? ThongKeDanhGia.fromJson(response.data['statistics'])
              : null,
        ));
      } else {
        emit(HotelReviewFailure(error: response.message));
      }
    } catch (e) {
      print("❌ HotelReviewBloc: Exception in all reviews - $e");
      emit(HotelReviewFailure(error: e.toString()));
    }
  }
}
