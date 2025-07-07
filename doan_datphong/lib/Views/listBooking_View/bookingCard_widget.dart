import 'package:doan_datphong/Helper/FormatCurrency.dart';
import 'package:doan_datphong/Helper/FormatDateTime.dart';
import 'package:doan_datphong/Models/BookingFull.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../generated/l10n.dart';
import 'listBooking_screen.dart';

class BookingCard extends StatelessWidget {
  final BookingWithHotel booking;
  final BookingStatusFilter status;
  final VoidCallback onCancelBooking;
  final VoidCallback onViewTicket;

  const BookingCard({
    super.key,
    required this.booking,
    required this.status,
    required this.onCancelBooking,
    required this.onViewTicket,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildHotelInfo(context),
          _buildBookingDetails(context),
          if (status == BookingStatusFilter.ongoing) _buildOngoingActions(context),
          if (status == BookingStatusFilter.completed) _buildCompletedStatus(context),
          if (status == BookingStatusFilter.canceled) _buildCanceledStatus(context),
          if (status == BookingStatusFilter.noCheckIn) _buildNoCheckInStatus(context),
        ],
      ),
    );
  }

  Widget _buildHotelInfo(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Container(
              width: 85,
              height: 85,
              color: Colors.grey.shade200,
              child: booking.image != null
                  ? Image.network(
                booking.image ?? "",
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Center(
                  child: Icon(Icons.hotel, size: 32, color: Colors.grey.shade500),
                ),
              )
                  : Center(
                child: Icon(Icons.hotel, size: 32, color: Colors.grey.shade500),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  booking.hotelName ?? S.of(context).unknownHotel,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: Colors.black,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(
                      Icons.location_on,
                      size: 14,
                      color: const Color(0xFF525150),
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        booking.hotelAddress ?? S.of(context).unknownLocation,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _buildStatusBadge(context),
                    const Spacer(),
                    Text(
                      CurrencyHelper.formatVND(booking.totalAmount),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1565C0),
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

  Widget _buildBookingDetails(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F9FA),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          Row(
            children: [
              // Check-in info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.login,
                          size: 16,
                          color: const Color(0xFF525150),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          S.of(context).checkInDate,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      DateTimeHelper.formatDate(booking.checkInDate),
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: Colors.black,
                      ),
                    ),
                    Text(
                      booking.checkInTime ?? '14:00',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              // Separator
              Container(
                width: 1,
                height: 35,
                color: Colors.grey[300],
                margin: const EdgeInsets.symmetric(horizontal: 12),
              ),
              // Check-out info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.logout,
                          size: 16,
                          color: const Color(0xFF525150),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          S.of(context).checkOutDate,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      DateTimeHelper.formatDate(booking.checkOutDate),
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: Colors.black,
                      ),
                    ),
                    Text(
                      booking.checkOutTime ?? '12:00',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Additional booking info
          Row(
            children: [
              Icon(
                Icons.bed,
                size: 16,
                color: const Color(0xFF525150),
              ),
              const SizedBox(width: 6),
              Text(
                _buildRoomText(context),
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey[700],
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(width: 16),
              Icon(
                Icons.category,
                size: 16,
                color: const Color(0xFF525150),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  booking.roomType ?? 'Standard Room',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey[700],
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(
                Icons.schedule,
                size: 16,
                color: const Color(0xFF525150),
              ),
              const SizedBox(width: 6),
              Text(
                _buildNightText(context),
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey[700],
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(width: 16),
              Icon(
                Icons.payment,
                size: 16,
                color: const Color(0xFF525150),
              ),
              const SizedBox(width: 6),
              Text(
                _getPaymentStatusText(context,booking.paymentStatus),
                style: TextStyle(
                  fontSize: 13,
                  color: _getPaymentStatusColor(booking.paymentStatus),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(BuildContext context) {
    Color bgColor;
    Color textColor;
    String statusText;

    switch (status) {
      case BookingStatusFilter.ongoing:
        bgColor = const Color(0xFF1565C0).withOpacity(0.1);
        textColor = const Color(0xFF1565C0);
        statusText = S.of(context).ongoing;
        break;
      case BookingStatusFilter.completed:
        bgColor = const Color(0xFF10B981).withOpacity(0.1);
        textColor = const Color(0xFF10B981);
        statusText = S.of(context).completed;
        break;
      case BookingStatusFilter.canceled:
        bgColor = const Color(0xFFEF4444).withOpacity(0.1);
        textColor = const Color(0xFFEF4444);
        statusText = S.of(context).canceled;
        break;
      case BookingStatusFilter.noCheckIn:
        bgColor = const Color(0xFF292828).withOpacity(0.1);
        textColor = const Color(0xFF292828);
        statusText = S.of(context).noCheckIn;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        statusText,
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildOngoingActions(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: onCancelBooking,
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFF1565C0), width: 1.5),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(25),
                ),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: Text(
                S.of(context).cancelBooking,
                style: TextStyle(
                  color: Color(0xFF1565C0),
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton(
              onPressed: onViewTicket,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1565C0),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(25),
                ),
                padding: const EdgeInsets.symmetric(vertical: 12),
                elevation: 0,
              ),
              child: Text(
                S.of(context).viewDetails,
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompletedStatus(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF10B981).withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(
            Icons.check_circle,
            color: const Color(0xFF10B981),
            size: 20,
          ),
          const SizedBox(width: 8),
           Text(
            S.of(context).yeayCompleted,
            style: TextStyle(
              color: Color(0xFF10B981),
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCanceledStatus(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFEF4444).withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(
            Icons.cancel,
            color: const Color(0xFFEF4444),
            size: 20,
          ),
          const SizedBox(width: 8),
           Text(
            S.of(context).youCanceledBooking,
            style: TextStyle(
              color: Color(0xFFEF4444),
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNoCheckInStatus(BuildContext context){
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF292828).withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(
            Icons.cancel,
            color: const Color(0xFF292828),
            size: 20,
          ),
          const SizedBox(width: 8),
          Text(
            S.of(context).youNoCheckInBooking,
            style: TextStyle(
              color: Color(0xFF292828),
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }





  String _getPaymentStatusText(BuildContext context,String? status) {
    if (status == null) return 'N/A';
    switch (status) {
      case 'da_thanh_toan':
        return S.of(context).paid;
      case 'chua_thanh_toan':
        return S.of(context).unpaid;
      case 'thanh_toan_mot_phan':
        return S.of(context).partiallyPaid;
      case 'da_hoan_tien':
        return S.of(context).refunded;
      default:
        return status;
    }
  }

  Color _getPaymentStatusColor(String? status) {
    if (status == null) return Colors.grey;
    switch (status) {
      case 'da_thanh_toan':
        return const Color(0xFF10B981);
      case 'da_hoan_tien':
        return const Color(0xFF3B82F6);
      case 'thanh_toan_mot_phan':
        return const Color(0xFFF59E0B);
      case 'chua_thanh_toan':
        return const Color(0xFFEF4444);
      default:
        return Colors.grey;
    }
  }

  String _buildRoomText(BuildContext context) {
    // Lấy ngôn ngữ hiện tại
    final locale = Localizations.localeOf(context);
    final isVietnamese = locale.languageCode == 'vi';
    final roomCount = booking.roomQuantity ?? 1;

    if (isVietnamese) {
      // TIẾNG VIỆT - Không cần thêm 's'
      return '$roomCount phòng';
    } else {
      // TIẾNG ANH - Cần thêm 's' cho số nhiều
      return '$roomCount room${roomCount > 1 ? 's' : ''}';
    }
  }

  String _buildNightText(BuildContext context) {
    // Lấy ngôn ngữ hiện tại
    final locale = Localizations.localeOf(context);
    final isVietnamese = locale.languageCode == 'vi';
    Map<String, dynamic> getPriceDetails = booking.priceDetails;
    print("Danh sach PriceDetails${getPriceDetails}");
    String unit = getPriceDetails["unit"];
    int quantity = getPriceDetails["quantity"];


    print("Danh sach PriceDetails${unit}");


    if(unit =="dem"){
      if (isVietnamese) {
        return '$quantity đêm';
      } else {
        return '$quantity night${quantity > 1 ? 's' : ''}';
      }
    }else if (unit =="gio"){
      if (isVietnamese) {
        return '$quantity giờ';
      } else {
        return '$quantity hour${quantity > 1 ? 's' : ''}';
      }
    }else {
      if (isVietnamese) {
        return '$quantity ngày';
      } else {
        return '$quantity day${quantity > 1 ? 's' : ''}';
      }
    }
  }
}