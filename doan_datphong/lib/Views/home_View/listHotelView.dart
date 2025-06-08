import 'package:doan_datphong/Blocs/getHotelList_Blocs/getHotelList_bloc.dart';
import 'package:doan_datphong/Views/detail_View/detail_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:doan_datphong/Models/Hotels.dart';


import '../../Blocs/getHotelList_Blocs/getHotelList_event.dart';
import '../../Blocs/getHotelList_Blocs/getHotelList_state.dart';

class HotelCardView extends StatefulWidget {
  @override
  _HotelCardState createState() => _HotelCardState();
}

class _HotelCardState extends State<HotelCardView> {
  bool iconBookMarkPressed = false;
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(viewportFraction: 0.85);

    context.read<GetHotelListBloc>().add(FetchHotelList());
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<GetHotelListBloc, GetHotelListState>(
      builder: (context, state) {
        if (state is GetHotelListLoading) {
          return const Center(child: CircularProgressIndicator());
        } else if (state is GetHotelListFailure) {
          return Center(child: Text('Error: ${state.error}'));
        } else if (state is GetHotelListSuccess) {
          return Padding(
            padding: const EdgeInsets.all(8.0),
            child: Column(
              children: [
                const SizedBox(height: 5),
                SizedBox(
                  height: 450,
                  child: PageView.builder(
                    controller: _pageController,
                    itemCount: state.hotels.length,
                    itemBuilder: (context, index) {
                      final hotel = state.hotels[index];
                      return AnimatedBuilder(
                        animation: _pageController,
                        builder: (context, child) {
                          double opacity = 1.0;
                          if (_pageController.position.haveDimensions) {
                            double pageOffset = _pageController.page! - index;
                            opacity = (1 - (pageOffset.abs() * 0.5)).clamp(0.5, 1.0);
                          }
                          return Opacity(opacity: opacity, child: child);
                        },
                        child: buildHotelCard(hotel),
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        }
        return const Center(child: CircularProgressIndicator());
      },
    );
  }

  // Các phương thức buildHotelCard, ratingBadge, hotelInfo, bookmarkButton giữ nguyên
  Widget buildHotelCard(Hotels hotel) {
    return InkWell(
      splashColor: Colors.blue.withOpacity(0.3),
      highlightColor: Colors.blue.withOpacity(0.1),
      borderRadius: BorderRadius.circular(15),
      onTap: () {
        Navigator.push(context, MaterialPageRoute(builder: (context) => DetailScreen(hotel: hotel)));
      },
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(15),
          child: Stack(
            children: [
              Hero(
                tag: 'hotel-image-${hotel.id}',
                child: Image.network(
                  hotel.image,
                  width: 320,
                  height: 430,
                  fit: BoxFit.fill,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      color: Colors.grey[200],
                      child: const Icon(Icons.broken_image),
                    );
                  },
                ),
              ),
              Positioned(top: 15, right: 20, child: ratingBadge(hotel.star)),
              Positioned(bottom: 15, left: 15, child: hotelInfo(hotel)),
              Positioned(bottom: 35, right: 15, child: bookmarkButton()),
            ],
          ),
        ),
      ),
    );
  }

  Widget ratingBadge(int rating) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      width: 65,
      height: 40,
      decoration: BoxDecoration(
        color: const Color(0xFFA1D6E2),
        borderRadius: BorderRadius.circular(15),
      ),
      child: Row(
        children: [
          const Icon(Icons.star, color: Colors.white),
          const SizedBox(width: 5),
          Text(
            rating.toString(),
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget hotelInfo(Hotels hotel) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          hotel.hotelName,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: Color(0xffF1F1F2)),
        ),
        Text(
          hotel.city,
          style: const TextStyle(fontSize: 14, fontStyle: FontStyle.italic, color: Color(0xffF1F1F2)),
        ),
        Row(
          children: [
            Text(
              "\$${hotel.price}",
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: Color(0xffF1F1F2)),
            ),
            const SizedBox(width: 8),
            const Text(
              "/ per night",
              style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: Color(0xffF1F1F2)),
            ),
          ],
        ),
      ],
    );
  }

  Widget bookmarkButton() {
    return IconButton(
      onPressed: () {
        setState(() {
          iconBookMarkPressed = !iconBookMarkPressed;
        });
      },
      icon: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        transitionBuilder: (Widget child, Animation<double> animation) {
          return FadeTransition(
            opacity: animation,
            child: ScaleTransition(scale: animation, child: child),
          );
        },
        child: Icon(
          key: ValueKey<bool>(iconBookMarkPressed),
          size: 35,
          iconBookMarkPressed ? Icons.bookmark_added : Icons.bookmark_add_outlined,
          color: Colors.white,
        ),
      ),
    );
  }
}