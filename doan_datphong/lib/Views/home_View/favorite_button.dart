import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../Blocs/favoriteHotel_Blocs/favoriteHotel_bloc.dart';
import '../../Blocs/favoriteHotel_Blocs/favoriteHotel_event.dart';
import '../../Blocs/favoriteHotel_Blocs/favoriteHotel_state.dart';

class FavoriteButton extends StatefulWidget {
  final String hotelId;
  final double size;
  final Color favoriteColor;
  final Color normalColor;

  const FavoriteButton({
    Key? key,
    required this.hotelId,
    this.size = 35,
    this.favoriteColor = const Color(0xFF1565C0),
    this.normalColor = const Color(0xFF525150),
  }) : super(key: key);

  @override
  _FavoriteButtonState createState() => _FavoriteButtonState();
}

class _FavoriteButtonState extends State<FavoriteButton> {
  bool? _localFavoriteState;

  @override
  void initState() {
    super.initState();
    // ✅ Check status khi widget được tạo
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        final bloc = context.read<FavoriteHotelsBloc>();
        // ✅ Kiểm tra từ cache trước
        if (bloc.isHotelFavorite(widget.hotelId)) {
          setState(() {
            _localFavoriteState = true;
          });
        } else {
          // ✅ Nếu không có trong cache, check từ server
          bloc.add(CheckFavoriteStatus(hotelId: widget.hotelId));
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<FavoriteHotelsBloc, FavoriteHotelsState>(
      listener: (context, state) {
        if (state is FavoriteActionSuccess) {
          // ✅ Update local state ngay lập tức
          setState(() {
            _localFavoriteState = state.isAdded;
          });

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: state.isAdded ? Colors.green : Colors.orange,
              duration: Duration(seconds: 2),
            ),
          );

        } else if (state is FavoriteHotelsFailure) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.errorMessage),
              backgroundColor: Colors.red,
              duration: Duration(seconds: 2),
            ),
          );
        } else if (state is FavoriteStatusChecked) {
          // ✅ Sync local state với server state
          if (_localFavoriteState == null) {
            setState(() {
              _localFavoriteState = state.isFavorite;
            });
          }
        } else if (state is FavoriteHotelsSuccess) {
          // ✅ QUAN TRỌNG: Lắng nghe khi danh sách favorites thay đổi
          final isInFavorites = state.favorites.any((fav) => fav.khachSan.id == widget.hotelId);
          if (_localFavoriteState != isInFavorites) {
            setState(() {
              _localFavoriteState = isInFavorites;
            });
          }
        }
      },
      builder: (context, state) {
        bool isFavorite = false;
        bool isLoading = false;

        // ✅ Ưu tiên local state, fallback về server state
        if (_localFavoriteState != null) {
          isFavorite = _localFavoriteState!;
        } else if (state is FavoriteStatusChecked) {
          isFavorite = state.isFavorite;
        } else if (state is FavoriteHotelsSuccess) {
          // ✅ Kiểm tra từ danh sách favorites hiện tại
          isFavorite = state.favorites.any((fav) => fav.khachSan.id == widget.hotelId);
        }

        if (state is FavoriteActionLoading) {
          isLoading = true;
        } else if (state is FavoriteHotelsLoading) {
          isLoading = true;
        }

        if (isLoading) {
          return SizedBox(
            width: widget.size,
            height: widget.size,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(widget.favoriteColor),
            ),
          );
        }

        return IconButton(
          onPressed: () {
            if (isFavorite) {
              // ✅ Optimistic update - update UI trước khi call API
              setState(() {
                _localFavoriteState = false;
              });

              context.read<FavoriteHotelsBloc>().add(
                RemoveFavoriteHotel(hotelId: widget.hotelId),
              );
            } else {
              // ✅ Optimistic update - update UI trước khi call API
              setState(() {
                _localFavoriteState = true;
              });

              context.read<FavoriteHotelsBloc>().add(
                AddFavoriteHotel(hotelId: widget.hotelId),
              );
            }
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
              key: ValueKey<bool>(isFavorite),
              size: widget.size,
              isFavorite ? Icons.bookmark_added : Icons.bookmark_add_outlined,
              color: isFavorite ? widget.favoriteColor : widget.normalColor,
            ),
          ),
        );
      },
    );
  }
}