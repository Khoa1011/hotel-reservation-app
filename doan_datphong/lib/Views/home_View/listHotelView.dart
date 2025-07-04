import 'package:doan_datphong/Blocs/getHotelList_Blocs/getHotelList_bloc.dart';
import 'package:doan_datphong/Views/detail_View/detail_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:doan_datphong/Models/KhachSan.dart';
import '../../Blocs/getHotelList_Blocs/getHotelList_event.dart';
import '../../Blocs/getHotelList_Blocs/getHotelList_state.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:doan_datphong/generated/l10n.dart';
import '../../Helper/FormatCurrency.dart';
import '../../Helper/ErrorCode.dart';
import '../components/NotificationDialog.dart';


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

  // Helper method để parse error code từ error string
  String _getErrorCode(String errorString) {
    if (errorString.contains('|')) {
      return errorString.split('|')[0];
    }
    // Check if error string contains error codes directly
    if (errorString.contains(ErrorCodes.connectionTimeout)) {
      return ErrorCodes.connectionTimeout;
    } else if (errorString.contains(ErrorCodes.networkUnreachable)) {
      return ErrorCodes.networkUnreachable;
    } else if (errorString.contains(ErrorCodes.serverRefused)) {
      return ErrorCodes.serverRefused;
    }
    return ErrorCodes.unknownError;
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<GetHotelListBloc, GetHotelListState>(

      listener: (context, state) {
        if (state is GetHotelListFailure) {
          String errorCode = _getErrorCode(state.errorMessage);

          if (errorCode == ErrorCodes.connectionTimeout) {
            NotificationDialog.showError(
              context,
              message: S.of(context).errorConnectionTimeout,
            );
          } else if (errorCode == ErrorCodes.networkUnreachable) {
            NotificationDialog.showError(
              context,
              message: S.of(context).errorNetworkUnreachable,
            );
          } else if (errorCode == ErrorCodes.serverRefused) {
            NotificationDialog.showError(
              context,
              message: S.of(context).errorServerRefused,
            );
          } else {
            NotificationDialog.showError(
              context,
              message: S.of(context).errorUnknown,
            );
          }
        }
      },
      child: BlocBuilder<GetHotelListBloc, GetHotelListState>(
        builder: (context, state) {
          bool isLoading = state is GetHotelListLoading;
          bool hasError = state is GetHotelListFailure;
          return Container(
            height: 500,
            child: Stack(
              children: [
                if (state is GetHotelListSuccess)
                  Column(
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

                // ✅ Error State - Show error UI when not loading
                if (hasError && !isLoading)
                  Center(
                    child: SingleChildScrollView(
                      child: Padding(
                        padding: const EdgeInsets.all(20.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Error Icon with Animation
                            TweenAnimationBuilder(
                              tween: Tween<double>(begin: 0, end: 1),
                              duration: Duration(milliseconds: 600),
                              builder: (context, double value, child) {
                                return Transform.scale(
                                  scale: value,
                                  child: Container(
                                    width: 60,
                                    height: 60,
                                    decoration: BoxDecoration(
                                      color: _getErrorColor(state.errorMessage).withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(30),
                                      border: Border.all(
                                        color: _getErrorColor(state.errorMessage).withOpacity(0.3),
                                        width: 2,
                                      ),
                                    ),
                                    child: Icon(
                                      _getErrorIcon(state.errorMessage),
                                      size: 30,
                                      color: _getErrorColor(state.errorMessage),
                                    ),
                                  ),
                                );
                              },
                            ),
                            const SizedBox(height: 15),

                            // Error Title
                            Text(
                              _getErrorTitle(state.errorMessage),
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1565C0),

                              ),
                              textAlign: TextAlign.center,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 6),

                            // Error Message
                            Text(
                              _getDisplayMessage(state.errorMessage),
                              style: TextStyle(
                                fontSize: 12,
                                color: Color(0xFF525150),
                                height: 1.3,
                              ),
                              textAlign: TextAlign.center,
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 20),

                            // Retry Button
                            SizedBox(
                              width: 140,
                              height: 40,
                              child: ElevatedButton.icon(
                                onPressed: () {
                                  context.read<GetHotelListBloc>().add(FetchHotelList());
                                },
                                icon: Icon(Icons.refresh, color: Colors.white, size: 16), // ✅ Giảm icon size
                                label: Text(
                                  S.of(context).tryAgain,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Color(0xFF1565C0),
                                  elevation: 2,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  padding: EdgeInsets.symmetric(vertical: 8, horizontal: 16), // ✅ Giảm padding
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                if (isLoading)
                  Container(
                    child: Center(
                      child: Container(
                        padding: EdgeInsets.all(30),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(15),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.2),
                              blurRadius: 10,
                              offset: Offset(0, 5),
                            ),
                          ],
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            CircularProgressIndicator(
                              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF1565C0)),
                              strokeWidth: 3,
                            ),
                            SizedBox(height: 20),
                            Text(
                              S.of(context).loadingHotels,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                                color: Colors.black87,

                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                if (state is GetHotelListInitial)
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.hotel,
                          size: 60,
                          color: Colors.grey[400],
                        ),
                        SizedBox(height: 16),
                        Text(
                          S.of(context).noDataHotelYet,
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  // Helper methods cho error handling
  Color _getErrorColor(String errorString) {
    String errorCode = _getErrorCode(errorString);
    switch (errorCode) {
      case ErrorCodes.connectionTimeout:
        return Colors.orange;
      case ErrorCodes.networkUnreachable:
        return Colors.red;
      case ErrorCodes.serverRefused:
        return Colors.deepOrange;
      case ErrorCodes.invalidResponse:
        return Colors.amber;
      default:
        return Colors.grey;
    }
  }

  IconData _getErrorIcon(String errorString) {
    String errorCode = _getErrorCode(errorString);
    switch (errorCode) {
      case ErrorCodes.connectionTimeout:
        return Icons.access_time;
      case ErrorCodes.networkUnreachable:
        return Icons.wifi_off;
      case ErrorCodes.serverRefused:
        return Icons.cloud_off;
      case ErrorCodes.invalidResponse:
        return Icons.error_outline;
      default:
        return Icons.help_outline;
    }
  }

  String _getErrorTitle(String errorString) {
    String errorCode = _getErrorCode(errorString);
    switch (errorCode) {
      case ErrorCodes.connectionTimeout:
        return S.of(context).connectionTimeout;
      case ErrorCodes.networkUnreachable:
        return S.of(context).errorNetworkUnreachable;
      case ErrorCodes.serverRefused:
        return S.of(context).errorServerRefused;
      case ErrorCodes.invalidResponse:
        return S.of(context).errorInvalidResponse;
      default:
        return S.of(context).errorUnknown;
    }
  }

  String _getDisplayMessage(String errorString) {
    String errorCode = _getErrorCode(errorString);
    switch (errorCode) {
      case ErrorCodes.connectionTimeout:
        return S.of(context).connectionTimeoutAgain;
      case ErrorCodes.networkUnreachable:
        return S.of(context).notNetwork;
      case ErrorCodes.serverRefused:
        return S.of(context).pleaseTryAgain;
      case ErrorCodes.invalidResponse:
        return S.of(context).pleaseTryAgain;
      default:
        return S.of(context).pleaseTryAgain;;
    }
  }


  Widget buildHotelCard(KhachSan hotel) {
    return InkWell(
      splashColor: Colors.blue.withOpacity(0.3),
      highlightColor: Colors.blue.withOpacity(0.1),
      borderRadius: BorderRadius.circular(15),
      onTap: () {
        Navigator.push(context, MaterialPageRoute(
            builder: (context) => DetailScreen(hotel: hotel)));
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
                  hotel.hinhAnh,
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
              Positioned(top: 15, right: 20, child: ratingBadge(hotel.soSao)),
              Positioned(bottom: 15, left: 15, child: hotelInfo(hotel)),
              Positioned(bottom: 35, right: 15, child: bookmarkButton()),
            ],
          ),
        ),
      ),
    );
  }

  Widget ratingBadge(double rating) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: const Color(0xFF42A5F5),
        borderRadius: BorderRadius.circular(15),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            FontAwesomeIcons.solidStar,
            color: Colors.amber,
            size: 16,
          ),
          const SizedBox(width: 4),
          Text(
            rating.toStringAsFixed(1),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget hotelInfo(KhachSan hotel) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.transparent,
            Colors.black.withOpacity(0.2),
          ],
        ),
      ),
      padding: const EdgeInsets.all(15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            hotel.tenKhachSan,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 22,
              color: Color(0xFFFF8F00),
              shadows: [
                Shadow(
                  blurRadius: 4.0,
                  color: Colors.black,
                  offset: Offset(1.0, 1.0),
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),
          Text(
            hotel.thanhPho,
            style: const TextStyle(
              fontSize: 16,
              fontStyle: FontStyle.italic,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              shadows: [
                Shadow(
                  blurRadius: 2.0,
                  color: Colors.black,
                  offset: Offset(0.5, 0.5),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(
                CurrencyHelper.formatVND(hotel.giaCa),
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 20,
                  color: Color(0xFFFFD700),
                  shadows: [
                    Shadow(
                      blurRadius: 4.0,
                      color: Colors.black,
                      offset: Offset(1.0, 1.0),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(
                "/ ${S.of(context).perNight}",
                style: const TextStyle(
                  fontSize: 16,
                  fontStyle: FontStyle.italic,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  shadows: [
                    Shadow(
                      blurRadius: 2.0,
                      color: Colors.black,
                      offset: Offset(0.5, 0.5),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
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
          iconBookMarkPressed
              ? Icons.bookmark_added
              : Icons.bookmark_add_outlined,
          color: Colors.white,
        ),
      ),
    );
  }
}