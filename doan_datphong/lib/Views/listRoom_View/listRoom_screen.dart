import 'package:doan_datphong/Helper/FormatDateTime.dart';
import 'package:doan_datphong/Models/KhachSan.dart';
import 'package:doan_datphong/Models/LichPhongTrong.dart';
import 'package:doan_datphong/Models/LoaiPhong.dart';
import 'package:doan_datphong/Models/NguoiDung.dart';
import 'package:doan_datphong/Views/components/NotificationDialog.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../Blocs/getListOfRoom_Blocs/getListOfRoom_bloc.dart';
import '../../Blocs/getListOfRoom_Blocs/getListOfRoom_event.dart';
import '../../Blocs/getListOfRoom_Blocs/getListOfRoom_state.dart';
import '../../Helper/FormatCurrency.dart';
import '../../Models/Khach.dart';
import '../payment_screen/payment_screen.dart';
import 'roomCard_widget.dart'; // Import RoomTypeCard widget hiện có
import 'package:doan_datphong/generated/l10n.dart';
import 'package:intl/intl.dart';

class ListRoomScreen extends StatefulWidget {
  final LichPhongTrong lichPhongTrong;

  final String idHotel; // Nhận idHotel từ màn hình trước

  const ListRoomScreen({
    super.key,
    required this.idHotel,

    required this.lichPhongTrong,
  });

  @override
  _ListRoomState createState() => _ListRoomState();
}

class _ListRoomState extends State<ListRoomScreen> {
  bool isSimpleView = false;


  @override
  void initState() {
    super.initState();
    _fetchRoomList();
  }

  void _fetchRoomList() {
    // Sử dụng event mới với đầy đủ parameters
    BlocProvider.of<GetListOfRoomBloc>(context).add(
      FetchRoomList(
        hotelId: widget.idHotel,
        lichPhongTrong: widget.lichPhongTrong,
      ),
    );
  }


  void _toggleView() {
    setState(() {
      isSimpleView = !isSimpleView;
    });

    if (isSimpleView) {
      // Fetch simple view
      BlocProvider.of<GetListOfRoomBloc>(context).add(
        FetchSimpleRoomList(
          hotelId: widget.idHotel,
          bookingType: widget.lichPhongTrong.loaiDatPhong,
          checkInDate: widget.lichPhongTrong.ngayNhanPhong,
          checkOutDate: widget.lichPhongTrong.ngayTraPhong,
          checkInTime: widget.lichPhongTrong.gioNhanPhong ?? '14:00',
          checkOutTime: widget.lichPhongTrong.gioTraPhong ?? '12:00',
          guests: {
            'adults': widget.lichPhongTrong.soLuongKhach.soNguoiLon,
            'children': widget.lichPhongTrong.soLuongKhach.soTreEm ?? 0,
          },
          rooms: widget.lichPhongTrong.soLuongPhong,
        ),
      );
    } else {
      _fetchRoomList();
    }
  }

  Widget _kiemTraLoaiDatPhongHienThiText() {
    String loaiDatPhong = widget.lichPhongTrong.loaiDatPhong;
    String text;

    if (loaiDatPhong == "theo_gio") {
      text = "${S.of(context).from} ${widget.lichPhongTrong.gioNhanPhong} "
          "${S.of(context).to} ${widget.lichPhongTrong.gioTraPhong}";
    } else {
      text = '${S.of(context).from} ${DateTimeHelper.formatDate(widget.lichPhongTrong.ngayNhanPhong)} '
          '${S.of(context).to} ${DateTimeHelper.formatDate(widget.lichPhongTrong.ngayTraPhong ?? widget.lichPhongTrong.ngayNhanPhong)}';
    }
    print(loaiDatPhong);

    return Text(
      text,
      style: TextStyle(
        color: Colors.blue.shade700,
        fontWeight: FontWeight.w500,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title:  Text(
          S.of(context).selectRoomType,
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          // Toggle button cho view đơn giản/đầy đủ
          IconButton(
            icon: Icon(isSimpleView ? Icons.view_list : Icons.view_compact),
            onPressed: _toggleView,
            tooltip: isSimpleView ? S.of(context).seeAll : S.of(context).viewAbridged,
          ),
          // Refresh button
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchRoomList,
            tooltip: S.of(context).refresh,
          ),
        ],
      ),
      body: Column(
        children: [
          // Thông tin tìm kiếm
          _buildSearchInfo(),

          // Danh sách phòng
          Expanded(
            child: BlocBuilder<GetListOfRoomBloc, GetListOfRoomState>(
              builder: (context, state) {
                if (state is GetListOfRoomLoading) {
                  return  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: 16),
                        Text(S.of(context).lookingForRooms),
                      ],
                    ),
                  );
                } else if (state is GetListOfRoomSuccess) {
                  // ✅ Sử dụng roomTypes thay vì rooms
                  if (state.roomTypes.isEmpty) {
                    return _buildEmptyState();
                  }

                  return RefreshIndicator(
                    onRefresh: () async => _fetchRoomList(),
                    child: ListView.builder(
                      itemCount: state.roomTypes.length,
                      itemBuilder: (context, index) {
                        final roomType = state.roomTypes[index];

                        // ✅ Sử dụng RoomTypeCard widget hiện có
                        return RoomCard(
                          lichPhongTrong:widget.lichPhongTrong,
                          loaiPhong: roomType,
                          onBookPressed: () => _onBookPressed(roomType),
                        );
                      },
                    ),
                  );
                } else if (state is GetListOfRoomFailure) {
                  return _buildErrorState(state.error);
                }
                return _buildEmptyState();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchInfo() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline, color: Colors.blue.shade700, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: _kiemTraLoaiDatPhongHienThiText()
          ),
          if (widget.lichPhongTrong.soLuongKhach != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.blue.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                // '${widget.lichPhongTrong.soLuongKhach.soNguoiLon} người lớn'
                //     '${widget.lichPhongTrong.soLuongKhach.soTreEm != null && widget.lichPhongTrong.soLuongKhach.soTreEm! > 0 ? ', ${widget.lichPhongTrong.soLuongKhach.soTreEm} trẻ em' : ''}'
                _buildSummaryTextAdult(context,widget.lichPhongTrong.soLuongKhach),
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.blue.shade700,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            const SizedBox(width: 8),
          ],
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.green.shade100,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              _buildSummaryTextRoom(context, widget.lichPhongTrong.soLuongPhong.toString()),
              style: TextStyle(
                fontSize: 12,
                color: Colors.green.shade700,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.hotel_outlined,
            size: 80,
            color: Colors.grey.shade400,
          ),
          const SizedBox(height: 16),
          Text(
            S.of(context).notRoomTypesAvailable,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            S.of(context).pleaseTryChangingTheSearchDate,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade500,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _fetchRoomList,
            icon: const Icon(Icons.refresh),
            label: Text(S.of(context).tryAgain),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 80,
            color: Colors.red.shade300,
          ),
          const SizedBox(height: 16),
          Text(
            S.of(context).errorUnknown,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.red.shade600,
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              error,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.red.shade500,
              ),
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _fetchRoomList,
            icon: const Icon(Icons.refresh),
            label: Text(S.of(context).tryAgain),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade400,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
  String _buildSummaryTextTotalGuese(BuildContext context) {
    // Lấy ngôn ngữ hiện tại
    final locale = Localizations.localeOf(context);
    final isVietnamese = locale.languageCode == 'vi';

    String guestText;


    if (isVietnamese) {
      // TIẾNG VIỆT - Không cần thêm 's'
      guestText = '${widget.lichPhongTrong.soLuongKhach.soNguoiLon} người lớn';
      if (widget.lichPhongTrong.soLuongKhach.soTreEm! > 0) {
        guestText += ' • ${widget.lichPhongTrong.soLuongKhach.soTreEm} trẻ em';
      }
    } else {
      // TIẾNG ANH - Cần thêm 's' cho số nhiều
      guestText = '${widget.lichPhongTrong.soLuongKhach.soNguoiLon} '
          'adult${widget.lichPhongTrong.soLuongKhach.soNguoiLon > 1 ? 's' : ''}';
      if (widget.lichPhongTrong.soLuongKhach.soTreEm! > 0) {
        guestText += ' • ${widget.lichPhongTrong.soLuongKhach.soTreEm} '
            'child${widget.lichPhongTrong.soLuongKhach.soTreEm! > 1 ? 'ren' : ''}';
      }
    }

    return guestText;
  }
  String _buildSummaryTextToTalRooms(BuildContext context) {
    // Lấy ngôn ngữ hiện tại
    final locale = Localizations.localeOf(context);
    final isVietnamese = locale.languageCode == 'vi';

    String roomText;

    if (isVietnamese) {
      // TIẾNG VIỆT - Không cần thêm 's'

      roomText = '${widget.lichPhongTrong.soLuongPhong} phòng';
    } else {
      roomText = '${widget.lichPhongTrong.soLuongPhong} '
          'room${widget.lichPhongTrong.soLuongPhong > 1 ? 's' : ''}';
    }

    return roomText;
  }



  void _onBookPressed(LoaiPhong roomType) {
    // Xử lý khi người dùng nhấn nút đặt phòng
    if (roomType.phongCoSan < 0) {
      NotificationDialog.showWarning(context, message: S.of(context).roomIsCurrentlyUnavailable);
      return;
    }
    NotificationDialog.showBookingConfirmation(
      context,
      roomTypeName: roomType.tenLoaiPhong,
      price: CurrencyHelper.formatVND(roomType.giaCuoiCung),
      dates: '${DateTimeHelper.formatDate(widget.lichPhongTrong.ngayNhanPhong)} • ${DateTimeHelper.formatDate(widget.lichPhongTrong.ngayTraPhong ?? S.of(context).notYet)}',
      guests: _buildSummaryTextTotalGuese(context),
      rooms: _buildSummaryTextToTalRooms(context),
      onConfirm: () => _navigateToPayment(roomType),
    );
  }

  void _navigateToPayment(LoaiPhong loaiPhong) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PaymentScreen(
          loaiPhong: loaiPhong,
          lichPhongTrong: widget.lichPhongTrong,
          checkInDate: widget.lichPhongTrong.ngayNhanPhong,
          checkOutDate: widget.lichPhongTrong.ngayTraPhong,

        ),
      ),
    );
  }

  String _buildSummaryTextAdult(BuildContext context, Khach khach) {
    final locale = Localizations.localeOf(context);
    final isVietnamese = locale.languageCode == 'vi';

    final int adults = khach.soNguoiLon;
    final int children = khach.soTreEm ?? 0;

    if (isVietnamese) {
      return '$adults người lớn' +
          (children > 0 ? ', $children trẻ em' : '');
    } else {
      final adultText = '$adults adult${adults > 1 ? 's' : ''}';
      final childText = children > 0
          ? ', $children child${children > 1 ? 'ren' : ''}'
          : '';
      return adultText + childText;
    }
  }


  String _buildSummaryTextRoom(BuildContext context, String data) {
    // Lấy ngôn ngữ hiện tại
    final locale = Localizations.localeOf(context);
    final isVietnamese = locale.languageCode == 'vi';

    String data;

    if (isVietnamese) {
      // TIẾNG VIỆT - Không cần thêm 's'
      data = '${widget.lichPhongTrong.soLuongPhong} phòng';
    } else {
      // TIẾNG ANH - Cần thêm 's' cho số nhiều
      data = '${widget.lichPhongTrong.soLuongPhong} room${widget.lichPhongTrong.soLuongPhong > 1 ? 's' : ''}';
    }

    return data;
  }
}