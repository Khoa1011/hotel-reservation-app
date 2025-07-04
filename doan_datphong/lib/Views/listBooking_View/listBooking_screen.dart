import 'package:doan_datphong/Views/home_View/home_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../generated/l10n.dart';
import '../../Blocs/getListBooking_Blocs/getBookingList_bloc.dart';
import '../../Blocs/getListBooking_Blocs/getBookingList_event.dart';
import '../../Blocs/getListBooking_Blocs/getBookingList_state.dart';
import '../../Models/BookingFull.dart';
import '../../Models/NguoiDung.dart';
import '../profile_View/profile_screen.dart';
import '../seach_View/search_screen.dart';
import 'bookingCard_widget.dart';
import 'bookingDetails_screen.dart';
import 'cancelBooking_widget.dart';

// Enum cho booking status filter
enum BookingStatusFilter { ongoing, completed, canceled }

class ListBookingScreen extends StatefulWidget {
  final NguoiDung? user;

  const ListBookingScreen({super.key, required this.user});

  @override
  State<ListBookingScreen> createState() => _ListBookingScreenState();
}

class _ListBookingScreenState extends State<ListBookingScreen> {
  int currentIndex = 2;
  BookingStatusFilter selectedStatus = BookingStatusFilter.ongoing;

  @override
  void initState() {
    super.initState();
    context.read<GetBookingListBloc>().add(FetchBookingList(widget.user!.id));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          S.of(context).myBooking,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Colors.black,
          ),
        ),
        centerTitle: false,
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: Colors.black),
            onPressed: () {
              // Add search functionality
            },
          ),
        ],
      ),
      body: Column(
        children: [
          _buildFilterTabs(),
          Expanded(
            child: BlocBuilder<GetBookingListBloc, GetBookingListState>(
              builder: (context, state) {
                if (state is GetBookingListLoading) {
                  return const Center(child: CircularProgressIndicator());
                } else if (state is GetBookingListSuccess) {
                  final filteredBookings = _getFilteredBookings(state.bookingFulls);

                  if (filteredBookings.isEmpty) {
                    return _buildEmptyState();
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filteredBookings.length,
                    itemBuilder: (context, index) {
                      final booking = filteredBookings[index];
                      return BookingCard(
                        booking: booking,
                        onCancelBooking: () => _showCancelDialog(booking),
                        onViewTicket: () => _navigateToBookingDetail(booking),
                        status: _getBookingStatusFromString(booking.status),
                      );
                    },
                  );
                } else if (state is GetBookingListFailure) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.error_outline, size: 60, color: Colors.red[400]),
                        const SizedBox(height: 16),
                        Text(
                          S.of(context).errorLoadingBookings,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w500,
                            color: Colors.red[700],
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          state.error,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () {
                            context.read<GetBookingListBloc>().add(
                              FetchBookingList(widget.user!.id),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF1565C0),
                          ),
                          child: Text(S.of(context).refresh, style: TextStyle(color: Colors.white)),
                        ),
                      ],
                    ),
                  );
                }
                return const SizedBox();
              },
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildFilterTabs() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          _buildFilterChip(S.of(context).ongoing, BookingStatusFilter.ongoing),
          const SizedBox(width: 12),
          _buildFilterChip(S.of(context).completed, BookingStatusFilter.completed),
          const SizedBox(width: 12),
          _buildFilterChip(S.of(context).canceled, BookingStatusFilter.canceled),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, BookingStatusFilter status) {
    final isSelected = selectedStatus == status;
    return GestureDetector(
      onTap: () {
        setState(() {
          selectedStatus = status;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF1565C0) : Colors.transparent,
          borderRadius: BorderRadius.circular(25),
          border: Border.all(
            color: const Color(0xFF1565C0),
            width: 1,
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? Colors.white : const Color(0xFF1565C0),
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ),
    );
  }
  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.hotel_outlined, size: 80, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'No ${selectedStatus.name} bookings',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w500,
              color: Colors.black54,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Your ${selectedStatus.name} bookings will appear here',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }
  BookingStatusFilter _getBookingStatusFromString(String status) {
    switch (status) {
      case 'ongoing':
        return BookingStatusFilter.ongoing;
      case 'completed':
        return BookingStatusFilter.completed;
      case 'canceled':
        return BookingStatusFilter.canceled;
      default:
        return BookingStatusFilter.ongoing;
    }
  }

  List<BookingWithHotel> _getFilteredBookings(List<BookingWithHotel> bookings) {
    return bookings.where((booking) {
      switch (selectedStatus) {
        case BookingStatusFilter.ongoing:
          return booking.status == 'ongoing';
        case BookingStatusFilter.completed:
          return booking.status == 'completed';
        case BookingStatusFilter.canceled:
          return booking.status == 'canceled';
        default:
          return true;
      }
    }).toList();
  }

  void _showCancelDialog(BookingWithHotel booking) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => BlocListener<GetBookingListBloc, GetBookingListState>(
        listener: (context, state) {
          if (state is CancelBookingSuccess) {
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.green,
                behavior: SnackBarBehavior.floating,
              ),
            );
            // Refresh booking list
            context.read<GetBookingListBloc>().add(
              RefreshBookingList(widget.user!.id),
            );
          } else if (state is CancelBookingFailure) {
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.error),
                backgroundColor: Colors.red,
                behavior: SnackBarBehavior.floating,
              ),
            );
          }
        },
        child: CancelBookingDialog(
          onCancel: () => Navigator.pop(context),
          onConfirm: () {
            context.read<GetBookingListBloc>().add(
              CancelBooking(booking.id, 'Customer requested cancellation'),
            );
          },
        ),
      ),
    );
  }

  void _navigateToBookingDetail(BookingWithHotel booking) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => BookingDetailScreen(booking: booking),
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
                return FadeTransition(opacity: animation, child: child);
              },
              transitionDuration: const Duration(milliseconds: 300),
            ),
          );
        } else if (index == 1) {
          Navigator.pushReplacement(
            context,
            PageRouteBuilder(
              pageBuilder: (context, animation1, animation2) => SearchView(user: widget.user),
              transitionsBuilder: (context, animation, secondaryAnimation, child) {
                return FadeTransition(opacity: animation, child: child);
              },
              transitionDuration: const Duration(milliseconds: 300),
            ),
          );
        } else if (index == 3) {
          Navigator.pushReplacement(
            context,
            PageRouteBuilder(
              pageBuilder: (context, animation1, animation2) => ProfileScreen(user: widget.user),
              transitionsBuilder: (context, animation, secondaryAnimation, child) {
                return FadeTransition(opacity: animation, child: child);
              },
              transitionDuration: const Duration(milliseconds: 300),
            ),
          );
        }
      },
      type: BottomNavigationBarType.fixed,
      selectedItemColor: const Color(0xFF1565C0),
      unselectedItemColor: const Color(0xff9A9EAB),
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
        BottomNavigationBarItem(icon: Icon(Icons.search), label: 'Search'),
        BottomNavigationBarItem(icon: Icon(Icons.view_list_outlined), label: 'Booking'),
        BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
      ],
    );
  }

}