import 'package:flutter/material.dart';
import 'package:doan_datphong/generated/l10n.dart';

enum ReservationType { gan_ban, theo_gio, qua_dem, dai_ngay }

class ReservationTypeWidget extends StatefulWidget {
  final Function(ReservationType)? onTypeSelected;

  const ReservationTypeWidget({
    super.key,
    this.onTypeSelected,
  });

  @override
  _ReservationTypeWidgetState createState() => _ReservationTypeWidgetState();
}

class _ReservationTypeWidgetState extends State<ReservationTypeWidget> {
  ReservationType? _selectedType;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 5),
            child: Text(
              "Chọn loại đặt phòng",
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1565C0),
              ),
            ),
          ),
          const SizedBox(height: 12),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            childAspectRatio: 1.3,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            padding: const EdgeInsets.symmetric(horizontal: 5),
            children: [
              _buildReservationCard(
                type: ReservationType.gan_ban,
                title: "Gần bạn",
                description: "Khách sạn gần vị trí hiện tại",
                icon: Icons.location_on,
                color: const Color(0xFF4CAF50), // Green cho location
              ),
              _buildReservationCard(
                type: ReservationType.theo_gio,
                title: S.of(context).rentByTheHour ?? "Theo giờ",
                description: S.of(context).rentByTheHourNote ?? "Thuê theo giờ",
                emoji: "⏰",
                color: Colors.orange,
              ),
              _buildReservationCard(
                type: ReservationType.qua_dem,
                title: S.of(context).rentOvernight ?? "Qua đêm",
                description: S.of(context).rentOvernightNote ?? "Thuê qua đêm",
                emoji: "🌙",
                color: Colors.blue,
              ),
              _buildReservationCard(
                type: ReservationType.dai_ngay,
                title: S.of(context).rentLongDays ?? "Dài ngày",
                description: S.of(context).rentLongDaysNote ?? "Thuê nhiều ngày",
                emoji: "📅",
                color: Colors.green,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildReservationCard({
    required ReservationType type,
    required String title,
    required String description,
    required Color color,
    IconData? icon,
    String? emoji,
  }) {
    final bool isSelected = _selectedType == type;

    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedType = type;
        });
        if (widget.onTypeSelected != null) {
          widget.onTypeSelected!(type);
        }
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.1) : Colors.white,
          borderRadius: BorderRadius.circular(15),
          border: Border.all(
            color: isSelected ? color : const Color(0xFFE0E0E0),
            width: isSelected ? 2.5 : 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: isSelected
                  ? color.withOpacity(0.3)
                  : Colors.grey.withOpacity(0.1),
              blurRadius: isSelected ? 8 : 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Icon/Emoji container
              Container(
                width: 45,
                height: 45,
                decoration: BoxDecoration(
                  color: isSelected ? color : color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: icon != null
                      ? Icon(
                    icon,
                    color: isSelected ? Colors.white : color,
                    size: 24,
                  )
                      : Text(
                    emoji ?? "🏨",
                    style: const TextStyle(fontSize: 22),
                  ),
                ),
              ),
              const SizedBox(height: 8),

              // Title
              Text(
                title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: isSelected ? color : const Color(0xFF1565C0),
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),

              const SizedBox(height: 4),

              // Description
              Text(
                description,
                style: TextStyle(
                  fontSize: 12,
                  color: isSelected
                      ? color.withOpacity(0.8)
                      : const Color(0xFF525150),
                  fontStyle: FontStyle.italic,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Extension để dễ dàng sử dụng trong HomeScreen
extension ReservationTypeExtension on ReservationType {
  String get displayName {
    switch (this) {
      case ReservationType.gan_ban:
        return "Gần bạn";
      case ReservationType.theo_gio:
        return "Theo giờ";
      case ReservationType.qua_dem:
        return "Qua đêm";
      case ReservationType.dai_ngay:
        return "Dài ngày";
    }
  }

  String get description {
    switch (this) {
      case ReservationType.gan_ban:
        return "Khách sạn gần vị trí hiện tại";
      case ReservationType.theo_gio:
        return "Thuê theo giờ, linh hoạt";
      case ReservationType.qua_dem:
        return "Thuê qua đêm tiêu chuẩn";
      case ReservationType.dai_ngay:
        return "Thuê nhiều ngày, ưu đãi";
    }
  }

  Color get color {
    switch (this) {
      case ReservationType.gan_ban:
        return const Color(0xFF4CAF50);
      case ReservationType.theo_gio:
        return Colors.orange;
      case ReservationType.qua_dem:
        return Colors.blue;
      case ReservationType.dai_ngay:
        return Colors.green;
    }
  }

  String get emoji {
    switch (this) {
      case ReservationType.gan_ban:
        return "📍";
      case ReservationType.theo_gio:
        return "⏰";
      case ReservationType.qua_dem:
        return "🌙";
      case ReservationType.dai_ngay:
        return "📅";
    }
  }
}