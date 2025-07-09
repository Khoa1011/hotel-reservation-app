import 'package:doan_datphong/Helper/FormatDateTime.dart';
import 'package:doan_datphong/Models/DanhGiaRespone.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:doan_datphong/generated/l10n.dart';

import '../../../Blocs/getReviewByHotel_Blocs/getReviewByHotel_bloc.dart';
import '../../../Blocs/getReviewByHotel_Blocs/getReviewByHotel_event.dart';
import '../../../Blocs/getReviewByHotel_Blocs/getReviewByHotel_state.dart';

class ReviewsSection extends StatefulWidget {
  final String hotelId;

  const ReviewsSection({
    Key? key,
    required this.hotelId,
  }) : super(key: key);


  @override
  State<ReviewsSection> createState() => _ReviewsSectionState();
}

class _ReviewsSectionState extends State<ReviewsSection>
    with SingleTickerProviderStateMixin {
  bool _isExpanded = false;
  late AnimationController _animationController;
  late Animation<double> _animation;


  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _animation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut, // Smooth curve (chậm -> nhanh -> chậm)
    );
    context.read<HotelReviewBloc>().add(
      LoadRecentReviewsEvent(hotelId: widget.hotelId, limit: 5),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _toggleExpanded() {
    setState(() {
      _isExpanded = !_isExpanded;
      if (_isExpanded) {
        _animationController.forward(); // Animation từ 0.0 đến 1.0 (mở rộng)
      } else {
        _animationController.reverse(); // Animation từ 1.0 về 0.0 (thu gọn)
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<HotelReviewBloc, HotelReviewState>(
      builder: (context, state) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildReviewHeader(context, state),
            const SizedBox(height: 16),
            _buildReviewsList(context, state),
            const SizedBox(height: 16),
            if (state is HotelReviewSuccess && state.reviews.length > 3)
              _buildMoreButton(context, state.reviews),
          ],
        );
      },
    );
  }

  Widget _buildReviewHeader(BuildContext context, HotelReviewState state) {

    double averageRating = 0.0;
    int totalReviews = 0;

    if (state is HotelReviewSuccess && state.thongKe != null) {
      averageRating = state.thongKe!.trungBinh;
      totalReviews = state.thongKe!.tongDanhGia;
    }
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Text(
              S.of(context).reviews,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(width: 8),
            Icon(
              FontAwesomeIcons.solidStar,
              color: Colors.amber,
              size: 16,
            ),
            const SizedBox(width: 4),
            Text(
              "$averageRating",
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.amber[700],
              ),
            ),
            const SizedBox(width: 4),
            Text(
              "($totalReviews ${S.of(context).reviews})",
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
        TextButton(
          onPressed: () {
            // Navigate to all reviews page
            _showAllReviews(context);
          },
          child: Text(
            S.of(context).seeAll,
            style: TextStyle(
              color: Colors.blue[600],
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildReviewsList(BuildContext context, HotelReviewState state) {
    if (state is HotelReviewLoading) {
      return Center(child: CircularProgressIndicator());
    }

    if (state is HotelReviewFailure) {
      return Center(
        child: Text(
          state.error,
          style: TextStyle(color: Colors.red),
        ),
      );
    }

    if (state is HotelReviewSuccess) {
      final reviews = state.reviews;

      if (reviews.isEmpty) {
        return Center(
          child: Text(
            "Chưa có đánh giá nào",
            style: TextStyle(color: Colors.grey[600]),
          ),
        );
      }

      return Column(
        children: [
          // Luôn hiển thị 3 reviews đầu
          ...reviews.take(3).map((review) =>
              _buildReviewItem(context, review)
          ).toList(),

          // Phần có thể mở rộng (reviews còn lại)
          if (reviews.length > 3)
            AnimatedBuilder(
              animation: _animation,
              builder: (context, child) {
                return SizeTransition(
                  sizeFactor: _animation,
                  child: Column(
                    children: reviews.skip(3).map((review) =>
                        _buildReviewItem(context, review)
                    ).toList(),
                  ),
                );
              },
            ),
        ],
      );
    }

    return const SizedBox.shrink();
  }
  Widget _buildReviewItem(BuildContext context, DanhGiaResponse review) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundImage: review.user.hinhDaiDien.isNotEmpty
                    ? NetworkImage(review.user.hinhDaiDien)
                    : null,
                child: review.user.hinhDaiDien.isEmpty
                    ? Icon(Icons.person, color: Colors.grey[600])
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      review.user.tenNguoiDung,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey[800],
                      ),
                    ),
                    Text(
                      DateTimeHelper.formatDateToString2(review.reviewDate),
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _getRatingColor(review.rating),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      FontAwesomeIcons.solidStar,
                      color: Colors.white,
                      size: 12,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      review.rating.toString(),
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            review.comment,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[700],
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Color _getRatingColor(int rating) {
    switch (rating) {
      case 5:
        return Colors.green;
      case 4:
        return Colors.lightGreen;
      case 3:
        return Colors.orange;
      case 2:
        return Colors.orangeAccent;
      case 1:
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Widget _buildMoreButton(BuildContext context, List<DanhGiaResponse> reviews) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        borderRadius: BorderRadius.circular(25),
        border: Border.all(color: Colors.blue[200]!),
      ),
      child: InkWell(
        onTap: _toggleExpanded,
        borderRadius: BorderRadius.circular(25),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              _isExpanded ? S.of(context).showLess : S.of(context).moreReviews,
              style: TextStyle(
                color: Color(0xFF1565C0),
                fontWeight: FontWeight.w500,
                fontSize: 16,
              ),
            ),
            const SizedBox(width: 8),
            AnimatedRotation(
              turns: _isExpanded ? 0.5 : 0.0,
              duration: const Duration(milliseconds: 300),
              child: Icon(
                Icons.keyboard_arrow_down,
                color: Color(0xFF1565C0),
                size: 20,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAllReviews(BuildContext context) {
    // ✅ Load all reviews với sort theo rating cao nhất
    context.read<HotelReviewBloc>().add(
      LoadAllReviewsEvent(
        hotelId: widget.hotelId,
        sortBy: 'highest_rating',
      ),
    );

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.8,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          ),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
              ),
              child: Row(
                children: [
                  Text(
                    S.of(context).allReviews,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () {
                      Navigator.pop(context);
                      // ✅ Quay lại load recent reviews
                      context.read<HotelReviewBloc>().add(
                        LoadRecentReviewsEvent(hotelId: widget.hotelId),
                      );
                    },
                    icon: Icon(Icons.close),
                  ),
                ],
              ),
            ),
            Expanded(
              child: BlocBuilder<HotelReviewBloc, HotelReviewState>(
                builder: (context, state) {
                  if (state is HotelReviewLoading) {
                    return Center(child: CircularProgressIndicator());
                  }

                  if (state is HotelReviewFailure) {
                    return Center(
                      child: Text(
                        state.error,
                        style: TextStyle(color: Colors.red),
                      ),
                    );
                  }

                  if (state is HotelReviewSuccess) {
                    return ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: state.reviews.length,
                      itemBuilder: (context, index) {
                        final review = state.reviews[index];
                        return _buildReviewItem(context, review);
                      },
                    );
                  }

                  return const SizedBox.shrink();
                },
              ),
            ),
          ],
        ),
      ),
    );
  }



}
