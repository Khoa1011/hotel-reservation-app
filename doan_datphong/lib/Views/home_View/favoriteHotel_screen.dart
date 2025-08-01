import 'package:doan_datphong/Views/components/NotificationDialog.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../Blocs/favoriteHotel_Blocs/favoriteHotel_bloc.dart';
import '../../Blocs/favoriteHotel_Blocs/favoriteHotel_event.dart';
import '../../Blocs/favoriteHotel_Blocs/favoriteHotel_state.dart';
import '../../Helper/FormatCurrency.dart';
import '../../Models/FavoriteHotels.dart';
import '../../generated/l10n.dart';

class FavoriteHotelsScreen extends StatefulWidget {
  const FavoriteHotelsScreen({Key? key}) : super(key: key);

  @override
  _FavoriteHotelsScreenState createState() => _FavoriteHotelsScreenState();
}

class _FavoriteHotelsScreenState extends State<FavoriteHotelsScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    context.read<FavoriteHotelsBloc>().add(LoadFavoriteHotels());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xffE3F2FD),
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: Text(
          "Khách sạn đã lưu",
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFF42A5F5),
          ),
        ),
        leading: IconButton(
          icon: Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        // ✅ THÊM: Refresh button để test
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: () {
              context.read<FavoriteHotelsBloc>().add(LoadFavoriteHotels());
            },
          ),
        ],
      ),
      body: BlocListener<FavoriteHotelsBloc, FavoriteHotelsState>(
        listener: (context, state) {
          if (state is FavoriteActionSuccess) {
            if (state.isAdded) {
              NotificationDialog.showSuccess(context, message: state.message);
            } else {
              // Không cần hiển thị thông báo ở đây vì UI đã được cập nhật ngay lập tức
              // Chỉ cần reload để đảm bảo dữ liệu đồng bộ
              context.read<FavoriteHotelsBloc>().add(LoadFavoriteHotels());
            }
          } else if (state is FavoriteHotelsFailure) {
            NotificationDialog.showError(context, message: state.errorMessage);
          }
        },
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: "Tìm kiếm khách sạn...",
                  prefixIcon: Icon(Icons.search),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  filled: true,
                  fillColor: Colors.white,
                ),
                onSubmitted: (value) {
                  context.read<FavoriteHotelsBloc>().add(
                    LoadFavoriteHotels(search: value),
                  );
                },
              ),
            ),
            Expanded(
              child: BlocBuilder<FavoriteHotelsBloc, FavoriteHotelsState>(
                builder: (context, state) {
                  // ✅ THÊM: Debug log
                  print("🎨 Building UI - State: ${state.runtimeType}");

                  if (state is FavoriteHotelsLoading) {
                    return Center(child: CircularProgressIndicator());
                  } else if (state is FavoriteHotelsSuccess) {
                    print("📋 Showing ${state.favorites.length} favorites");

                    if (state.favorites.isEmpty) {
                      return Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.bookmark, size: 64, color: Colors.grey),
                            SizedBox(height: 16),
                            Text(
                              "Chưa có khách sạn nào được lưu",
                              style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                            ),
                          ],
                        ),
                      );
                    }

                    return ListView.builder(
                      padding: EdgeInsets.all(16),
                      itemCount: state.favorites.length,
                      itemBuilder: (context, index) {
                        final favorite = state.favorites[index];
                        return _buildFavoriteHotelCard(favorite);
                      },
                    );
                  } else if (state is FavoriteHotelsFailure) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.error_outline, size: 64, color: Colors.red),
                          SizedBox(height: 16),
                          Text(
                            state.errorMessage,
                            style: TextStyle(fontSize: 16, color: Colors.red),
                            textAlign: TextAlign.center,
                          ),
                          SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () {
                              context.read<FavoriteHotelsBloc>().add(LoadFavoriteHotels());
                            },
                            child: Text("Thử lại"),
                          ),
                        ],
                      ),
                    );
                  }
                  return Container();
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFavoriteHotelCard(FavoriteHotel favorite) {
    return Card(
      margin: EdgeInsets.only(bottom: 16),
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
            child: Image.network(
              favorite.khachSan.hinhAnh,
              height: 180,
              width: double.infinity,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  height: 180,
                  color: Colors.grey[300],
                  child: Icon(Icons.image_not_supported, size: 50),
                );
              },
            ),
          ),
          Padding(
            padding: EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        favorite.khachSan.tenKhachSan,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.highlight_remove, color: Colors.red),
                      onPressed: () {
                        _showDeleteWarningDialog(context, favorite);
                      },
                    ),
                  ],
                ),
                SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.location_on, size: 16, color: Colors.grey[600]),
                    SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        favorite.khachSan.diaChi,
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        ...List.generate(
                          favorite.khachSan.soSao.floor(),
                              (index) => Icon(Icons.star, color: Colors.amber, size: 16),
                        ),
                        if (favorite.khachSan.soSao % 1 != 0)
                          Icon(Icons.star_half, color: Colors.amber, size: 16),
                      ],
                    ),
                    Text(
                      CurrencyHelper.formatVND(favorite.khachSan.giaCa),
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF42A5F5),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showDeleteWarningDialog(BuildContext context, FavoriteHotel favorite) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (BuildContext context) {
        return _DeleteFavoriteBottomSheet(
          favorite: favorite,
          onCancel: () => Navigator.of(context).pop(),
          onConfirm: () {
            Navigator.of(context).pop();
            context.read<FavoriteHotelsBloc>().add(
              RemoveFavoriteHotel(hotelId: favorite.khachSan.id),
            );
          },
        );
      },
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}

class _DeleteFavoriteBottomSheet extends StatelessWidget {
  final FavoriteHotel favorite;
  final VoidCallback onCancel;
  final VoidCallback onConfirm;

  const _DeleteFavoriteBottomSheet({
    required this.favorite,
    required this.onCancel,
    required this.onConfirm,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              "Xóa khỏi danh sách yêu thích",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: Colors.red,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              favorite.khachSan.tenKhachSan,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(0xFF42A5F5),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Text(
              "Bạn có chắc chắn muốn xóa khách sạn này khỏi danh sách yêu thích của mình không?",
              style: TextStyle(
                fontSize: 16,
                color: Colors.black87,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Text(
              "Thao tác này không thể hoàn tác. Bạn có thể thêm lại khách sạn vào danh sách yêu thích bất kỳ lúc nào.",
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
                height: 1.4,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: onCancel,
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: Colors.grey[300]!),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(25),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Text(
                      "Hủy",
                      style: TextStyle(
                        color: Colors.black54,
                        fontWeight: FontWeight.w500,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: onConfirm,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(25),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Text(
                      "Xóa khỏi yêu thích",
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w500,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: MediaQuery.of(context).padding.bottom),
          ],
        ),
      ),
    );
  }
}