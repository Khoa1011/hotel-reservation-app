import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:doan_datphong/generated/l10n.dart';

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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildReviewHeader(context),
        const SizedBox(height: 16),
        _buildReviewsList(context),
        const SizedBox(height: 16),
        _buildMoreButton(context),
      ],
    );
  }

  Widget _buildReviewHeader(BuildContext context) {
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
              "4.8",
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.amber[700],
              ),
            ),
            const SizedBox(width: 4),
            Text(
              "(498 ${S.of(context).reviews})",
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

  Widget _buildReviewsList(BuildContext context) {
    final reviews = _getSampleReviews();

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

  Widget _buildReviewItem(BuildContext context, ReviewModel review) {
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
                backgroundImage: NetworkImage(review.userAvatar),
                onBackgroundImageError: (_, __) {},
                child: review.userAvatar.isEmpty
                    ? Icon(Icons.person, color: Colors.grey[600])
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      review.userName,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey[800],
                      ),
                    ),
                    Text(
                      review.date,
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
                  color: Colors.green,
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

  Widget _buildMoreButton(BuildContext context) {
    final reviews = _getSampleReviews();

    // Don't show button if there are 3 or fewer reviews
    if (reviews.length <= 3) {
      return const SizedBox.expand();
    }

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
    // Navigate to all reviews page or show bottom sheet
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
                    onPressed: () => Navigator.pop(context),
                    icon: Icon(Icons.close),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _getSampleReviews().length,
                itemBuilder: (context, index) {
                  final review = _getSampleReviews()[index];
                  return _buildReviewItem(context, review);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<ReviewModel> _getSampleReviews() {
    return [
      ReviewModel(
        userName: "Jenny Wilson",
        userAvatar: "https://i.pravatar.cc/150?img=1",
        date: "Dec 10, 2024",
        rating: 5,
        comment: "Very nice and comfortable hotel, thank you for accompanying my vacation!",
      ),
      ReviewModel(
        userName: "Guy Hawkins",
        userAvatar: "https://i.pravatar.cc/150?img=2",
        date: "Dec 10, 2024",
        rating: 4,
        comment: "Very beautiful hotel, my family and I are very satisfied with the service!",
      ),
      ReviewModel(
        userName: "Kristin Watson",
        userAvatar: "https://i.pravatar.cc/150?img=3",
        date: "Dec 09, 2024",
        rating: 5,
        comment: "The rooms are very comfortable and the natural views are amazing, can't wait to come back again!",
      ),
      ReviewModel(
        userName: "Robert Fox",
        userAvatar: "https://i.pravatar.cc/150?img=4",
        date: "Dec 08, 2024",
        rating: 4,
        comment: "Great location and excellent amenities. Staff was very helpful throughout our stay.",
      ),
      ReviewModel(
        userName: "Savannah Nguyen",
        userAvatar: "https://i.pravatar.cc/150?img=5",
        date: "Dec 07, 2024",
        rating: 5,
        comment: "Absolutely loved this place! Perfect for a romantic getaway. Will definitely recommend to friends.",
      ),
    ];
  }
}

class ReviewModel {
  final String userName;
  final String userAvatar;
  final String date;
  final int rating;
  final String comment;

  ReviewModel({
    required this.userName,
    required this.userAvatar,
    required this.date,
    required this.rating,
    required this.comment,
  });
}