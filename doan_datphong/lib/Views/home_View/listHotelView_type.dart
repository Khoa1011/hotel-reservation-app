import 'package:doan_datphong/Models/LoaiPhong.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:doan_datphong/Models/KhachSan.dart';
import 'package:doan_datphong/Views/detail_View/detail_screen.dart';
import 'package:doan_datphong/generated/l10n.dart';
import '../../Blocs/getHotelList_Blocs/getHotelList_bloc.dart';
import '../../Blocs/getHotelList_Blocs/getHotelList_event.dart';
import '../../Blocs/getHotelList_Blocs/getHotelList_state.dart';
import '../../Helper/FormatCurrency.dart';
import '../../Helper/ErrorCode.dart';
import '../components/NotificationDialog.dart';
import 'favorite_button.dart';

enum ViewType { card, list, grid }

class HotelViewSwitcher extends StatefulWidget {
  @override
  _HotelViewSwitcherState createState() => _HotelViewSwitcherState();
}

class _HotelViewSwitcherState extends State<HotelViewSwitcher> {
  ViewType currentView = ViewType.card; // Default to list view
  late PageController _pageController;


  @override
  void initState() {
    super.initState();
    _pageController = PageController(viewportFraction: 0.85);
    // ✅ Delay the BLoC call to avoid calling during build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<GetHotelListBloc>().add(FetchHotelList());
      }
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onHotelTap(KhachSan hotel) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => DetailScreen(hotel: hotel)),
    );
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
        return S.of(context).pleaseTryAgain;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 500, // Fixed height to match your original
      child: Column(
        children: [
          // View Toggle Buttons
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Text(
                  S.of(context).showList,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w500,
                    color: Colors.grey[700],
                  ),
                ),
                const Spacer(),
                Row(
                  children: [
                    _buildViewButton(
                      icon: Icons.view_carousel,
                      viewType: ViewType.card,
                      label: S.of(context).cardType,
                    ),
                    const SizedBox(width: 10,),
                    _buildViewButton(
                      icon: Icons.view_list,
                      viewType: ViewType.list,
                      label: S.of(context).listType,
                    ),
                    const SizedBox(width: 10,),
                    _buildViewButton(
                      icon: Icons.grid_view,
                      viewType: ViewType.grid,
                      label: S.of(context).gridType,
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Content based on selected view
          Expanded(
            child: BlocListener<GetHotelListBloc, GetHotelListState>(
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
                  if (state is GetHotelListLoading) {
                    return _buildLoadingState();
                  }

                  if (state is GetHotelListFailure) {
                    return _buildErrorState(state.errorMessage);
                  }

                  if (state is GetHotelListSuccess) {
                    return _buildSuccessState(state.hotels);
                  }

                  return _buildInitialState();
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildViewButton({
    required IconData icon,
    required ViewType viewType,
    required String label,
  }) {
    bool isSelected = currentView == viewType;

    return GestureDetector(
      onTap: () {
        setState(() {
          currentView = viewType;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? Colors.blue[600] : Colors.white,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? Colors.white : Colors.grey[600],
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: isSelected ? Colors.white : Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuccessState(List<KhachSan> hotels) {
    if (hotels.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.hotel, size: 60, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              "No hotels available",
              style: TextStyle(fontSize: 16, color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    switch (currentView) {
      case ViewType.card:
        return _buildCardView(hotels);
      case ViewType.list:
        return _buildListView(hotels);
      case ViewType.grid:
        return _buildGridView(hotels);
    }
  }

  Widget _buildCardView(List<KhachSan> hotels) {
    return SizedBox(
      height: double.infinity,
      child: PageView.builder(
        controller: _pageController,
        itemCount: hotels.length,
        itemBuilder: (context, index) {
          final hotel = hotels[index];
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
            child: _buildHotelCard(hotel),
          );
        },
      ),
    );
  }

  Widget _buildListView(List<KhachSan> hotels) {

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: hotels.length,
      itemBuilder: (context, index) {
        final hotel = hotels[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: InkWell(
            onTap: () => _onHotelTap(hotel),
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Hotel Image
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Hero(
                      tag: 'hotel-image-${hotel.id}',
                      child: Image.network(
                        hotel.hinhAnh,
                        width: 80,
                        height: 80,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            width: 80,
                            height: 80,
                            color: Colors.grey[200],
                            child: Icon(Icons.broken_image, color: Colors.grey[400]),
                          );
                        },
                      ),
                    ),
                  ),

                  const SizedBox(width: 12),

                  // Hotel Info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Hotel Name & Rating
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                hotel.tenKhachSan,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black87,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.7),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    FontAwesomeIcons.solidStar,
                                    color: Colors.amber[700],
                                    size: 14,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    hotel.soSao.toStringAsFixed(1),
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 4),

                        // Location
                        Row(
                          children: [
                            Icon(
                              Icons.location_on,
                              size: 14,
                              color: Colors.grey[600],
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                hotel.diaChi,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Colors.grey[600],
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 8),

                        // Price
                        Row(
                          children: [
                            Text(
                              "${S.of(context).from} ${CurrencyHelper.formatVND(hotel.giaCa)}",
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Colors.amber,
                              ),

                            ),
                            Text(
                              " / ${S.of(context).perNight}",
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                            ),
                            const Spacer(),
                            bookmarkButton(hotel)
                            
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildGridView(List<KhachSan> hotels) {
    return GridView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2, //	Số cột = 2
        childAspectRatio: 0.7, //Tỷ lệ chiều rộng/chiều cao của mỗi ô lưới (0.8)
        crossAxisSpacing: 12, //	Khoảng cách giữa các cột
        mainAxisSpacing: 12, //Khoảng cách giữa các hàng
      ),
      itemCount: hotels.length,
      itemBuilder: (context, index) {
        final hotel = hotels[index];
        return Container(
          decoration: BoxDecoration(

            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: InkWell(
            onTap: () => _onHotelTap(hotel),
            borderRadius: BorderRadius.circular(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Hotel Image
                Expanded(
                  flex: 3, //Chiếm 3/5 chiều cao của card
                  child: Stack(
                    children: [
                      ClipRRect(
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(12),
                          topRight: Radius.circular(12),
                        ),
                        child: Hero(
                          tag: 'hotel-image-${hotel.id}',
                          child: Image.network(
                            hotel.hinhAnh,
                            width: double.infinity,
                            height: double.infinity,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return Container(
                                color: Colors.grey[200],
                                child: Icon(Icons.broken_image, color: Colors.grey[400]),
                              );
                            },
                          ),
                        ),
                      ),

                      // Rating Badge
                      Positioned(
                        top: 8,
                        right: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.7),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                FontAwesomeIcons.solidStar,
                                color: Colors.amber,
                                size: 13,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                hotel.soSao.toStringAsFixed(1),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Hotel Info
                Expanded(
                  flex: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Hotel Name
                        Text(
                          hotel.tenKhachSan,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                              color: Colors.black87,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis, //Hiển thị tên, nếu dài thì sẽ bị cắt với ...
                        ),

                        const SizedBox(height: 4),

                        // Location
                        Row(
                          children: [
                            Icon(
                              Icons.location_on,
                              size: 12,
                              color: Color(0xFF525150),
                            ),
                            const SizedBox(width: 2),
                            Expanded(
                              child: Text(
                                hotel.diaChi,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF525150),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),

                        const Spacer(),

                        // Price
                        Row(
                          children: [
                            Text(
                              "${S.of(context).from} ${CurrencyHelper.formatVND(hotel.giaCa)}",
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Colors.amber,

                              ),

                            ),
                            Text(
                              " / ${S.of(context).perNight}",
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey[600],
                              ),
                            ),
                            const Spacer(),
                          ],
                        ),

                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildHotelCard(KhachSan hotel) {
    return InkWell(
      onTap: () => _onHotelTap(hotel),
      child: Container(
        margin: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(15),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.2),
              blurRadius: 10,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(15),
          child: Stack(
            children: [
              // Background Image
              Hero(
                tag: 'hotel-image-${hotel.id}',
                child: Image.network(
                  hotel.hinhAnh,
                  width: double.infinity,
                  height: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      color: Colors.grey[200],
                      child: const Icon(Icons.broken_image),
                    );
                  },
                ),
              ),

              // Rating Badge (Top Right)
              Positioned(
                top: 15,
                right: 20,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.7),
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
                        hotel.soSao.toStringAsFixed(1),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Bookmark Button (Top Left)
              Positioned(
                top: 10,
                left: 10,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.9),
                    borderRadius: BorderRadius.circular(25),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 5,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: bookmarkButton(hotel),
                ),
              ),

              // Hotel Information (Bottom)
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.only(
                      bottomLeft: Radius.circular(15),
                      bottomRight: Radius.circular(15),
                    ),
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.black.withOpacity(0.3),
                        Colors.black.withOpacity(0.7),
                      ],
                    ),
                  ),
                  padding: const EdgeInsets.all(15),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Hotel Name
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
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),

                      const SizedBox(height: 4),

                      // Location
                      Row(
                        children: [
                          const Icon(
                            Icons.location_on,
                            color: Colors.white,
                            size: 16,
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              hotel.diaChi,
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
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 8),

                      // Price
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            "${S.of(context).from} ${CurrencyHelper.formatVND(hotel.giaCa)}",

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
                          const SizedBox(width: 4),
                          Text(
                            "/ ${S.of(context).perNight}",
                            style: const TextStyle(
                              fontSize: 14,
                              fontStyle: FontStyle.italic,
                              fontWeight: FontWeight.w500,
                              color: Colors.white70,
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
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  Widget _buildLoadingState() {
    return Center(
      child: Container(
        padding: const EdgeInsets.all(30),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(15),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.2),
              blurRadius: 10,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF1565C0)),
            ),
            const SizedBox(height: 20),
            Text(
              S.of(context).loadingHotels,
              style: const TextStyle(fontSize: 16),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(String errorMessage) {
    return Center(
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
                        color: _getErrorColor(errorMessage).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(30),
                        border: Border.all(
                          color: _getErrorColor(errorMessage).withOpacity(0.3),
                          width: 2,
                        ),
                      ),
                      child: Icon(
                        _getErrorIcon(errorMessage),
                        size: 30,
                        color: _getErrorColor(errorMessage),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 15),

              // Error Title
              Text(
                _getErrorTitle(errorMessage),
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
                _getDisplayMessage(errorMessage),
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
                  icon: Icon(Icons.refresh, color: Colors.white, size: 16),
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
                    padding: EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget bookmarkButton(KhachSan hotel) {
    return FavoriteButton(
      hotelId: hotel.id,
      size: 35,
      favoriteColor: Color(0xFF1565C0),
      normalColor: Color(0xFF525150),
    );
  }




  Widget _buildInitialState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.hotel, size: 60, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            "No hotels yet",
            style: TextStyle(fontSize: 16, color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }
}