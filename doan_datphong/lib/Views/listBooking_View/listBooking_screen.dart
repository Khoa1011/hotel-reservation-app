import 'package:doan_datphong/Views/home_View/home_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../Blocs/getListBooking_Blocs/getBookingList_bloc.dart';
import '../../Blocs/getListBooking_Blocs/getBookingList_event.dart';
import '../../Blocs/getListBooking_Blocs/getBookingList_state.dart';
import '../../Models/NguoiDung.dart';
import '../profile_View/profile_screen.dart';
import '../seach_View/search_screen.dart';

class ListBookingScreen extends StatefulWidget {
  final NguoiDung? user;

  const ListBookingScreen({super.key, required this.user});

  @override
  State<ListBookingScreen> createState() => _ListBookingScreenState();
}

class _ListBookingScreenState extends State<ListBookingScreen> {
  int currentIndex = 2;

  @override
  void initState() {
    super.initState();
    context.read<GetBookingListBloc>().add(FetchBookingList(widget.user!.id));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Recently Booked',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.black,
          ),
        ),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: BlocBuilder<GetBookingListBloc, GetBookingListState>(
        builder: (context, state) {
          if (state is GetBookingListLoading) {
            return const Center(child: CircularProgressIndicator());
          } else if (state is GetBookingListSuccess) {
            if (state.bookingFulls.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.hotel, size: 60, color: Colors.grey[400]),
                    const SizedBox(height: 16),
                    const Text(
                      'No bookings yet',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Your bookings will appear here',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: state.bookingFulls.length,
              itemBuilder: (context, index) {
                final booking = state.bookingFulls[index];
                return _buildHotelCard(
                  name: booking.hotelName,
                  location: booking.hotelAddress ?? 'Unknown location',
                  price: booking.totalAmount,
                  image: booking.image!,
                  rating: 4.5, // Replace with actual rating from your model
                  reviews: 100, // Replace with actual review count
                  checkInDate: booking.checkInDate,
                  checkOutDate: booking.checkOutDate,
                );
              },
            );
          } else if (state is GetBookingListFailure) {
            return Center(child: Text('Error: ${state.error}'));
          }
          return const SizedBox();
        },
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildHotelCard({
    required String name,
    required String image,
    required String location,
    required int price,
    required double rating,
    required int reviews,
    required String checkInDate,
    required String checkOutDate,
  }) {
    final formattedPrice = NumberFormat.currency(symbol: '\$', decimalDigits: 0).format(price);
    final formattedReviews = NumberFormat('#,###').format(reviews);

    // Date parsing helper with improved error handling
    String _formatDisplayDate(String dateString) {
      try {
        final parts = dateString.split('-');
        if (parts.length == 3) {
          final date = parts[0].length == 4
              ? DateTime.parse(dateString)
              : DateTime.parse('${parts[2]}-${parts[1]}-${parts[0]}');
          return DateFormat('dd - MM - yyyy').format(date);
        }
        return dateString;
      } catch (e) {
        return dateString;
      }
    }

    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Hotel image with better loading and error handling
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Container(
                width: 80,
                height: 80,
                color: Colors.grey.shade200,
                child: Image.network(
                  image,
                  fit: BoxFit.cover,
                  loadingBuilder: (context, child, loadingProgress) {
                    if (loadingProgress == null) return child;
                    return Center(
                      child: CircularProgressIndicator(
                        value: loadingProgress.expectedTotalBytes != null
                            ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                            : null,
                      ),
                    );
                  },
                  errorBuilder: (context, error, stackTrace) => Center(
                    child: Icon(Icons.hotel, size: 30, color: Colors.grey.shade500),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    location,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade900,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.star, size: 16, color: Colors.amber),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '$rating ($formattedReviews reviews)',
                          style: const TextStyle(fontSize: 12),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [

                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text.rich(
                              TextSpan(
                                children: [
                                  const TextSpan(
                                    text: 'Check-in: ',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey,
                                    ),
                                  ),
                                  TextSpan(
                                    text: _formatDisplayDate(checkInDate),
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Color(0xFF444444),
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text.rich(
                              TextSpan(
                                children: [
                                  const TextSpan(
                                    text: 'Check-out: ',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey,
                                    ),
                                  ),
                                  TextSpan(
                                    text: _formatDisplayDate(checkOutDate),
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Color(0xFF444444),
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  formattedPrice,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  '/ night',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomNav() {
    return BottomNavigationBar(
      currentIndex: currentIndex,
      onTap: (index) {
        setState(() {
          currentIndex = index;
        });
        if (index == 0) {
          Navigator.pushReplacement(
            context,
            PageRouteBuilder(
              pageBuilder: (context, animation1, animation2) => HomeScreen(user: widget.user),
              transitionsBuilder: (context, animation, secondaryAnimation, child) {
                return FadeTransition(
                  opacity: animation,
                  child: child,
                );
              },
              transitionDuration: Duration(milliseconds: 300),
            ),
          );
        } else if (index == 1) {
          Navigator.pushReplacement(
            context,
            PageRouteBuilder(
              pageBuilder: (context, animation1, animation2) => SearchView(user: widget.user),
              transitionsBuilder: (context, animation, secondaryAnimation, child) {
                return FadeTransition(
                  opacity: animation,
                  child: child,
                );
              },
              transitionDuration: Duration(milliseconds: 300),
            ),
          );
        } else if (index == 2) {

        } else if (index == 3) {
          Navigator.pushReplacement(
            context,
            PageRouteBuilder(
              pageBuilder: (context, animation1, animation2) => ProfileScreen(user: widget.user),
              transitionsBuilder: (context, animation, secondaryAnimation, child) {
                return FadeTransition(
                  opacity: animation,
                  child: child,
                );
              },
              transitionDuration: Duration(milliseconds: 300),
            ),
          );
        }
      },

      selectedItemColor: Color(0xFF14D9E1),
      unselectedItemColor: Color(0xff9A9EAB),
      items: const [
        BottomNavigationBarItem(
          icon: Icon(Icons.home),
          label: 'Home',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.search),
          label: 'Search',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.view_list_outlined),
          label: 'Booking',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.person),
          label: 'Profile',
        ),
      ],
    );
  }
}