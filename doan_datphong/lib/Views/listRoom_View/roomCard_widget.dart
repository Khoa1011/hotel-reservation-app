import 'package:doan_datphong/Models/LichPhongTrong.dart';
import 'package:doan_datphong/Models/NguoiDung.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../Models/CauHinhGiuong.dart';
import '../../Models/LoaiPhong.dart';
import '../../Models/TienNghi.dart';
import '../../Models/HinhAnhPhong.dart';
import '../payment_screen/payment_screen.dart';
import '../../generated/l10n.dart';
import 'amenity_icon.dart'; // Import file mới

class RoomCard extends StatefulWidget {
  final LoaiPhong loaiPhong;
  final VoidCallback? onBookPressed;
  final LichPhongTrong lichPhongTrong;

  const RoomCard({
    super.key,
    required this.lichPhongTrong,
    required this.loaiPhong,
    this.onBookPressed,
  });

  @override
  State<RoomCard> createState() => _RoomCardState();
}

class _RoomCardState extends State<RoomCard> {
  final PageController _pageController = PageController();
  int _currentImageIndex = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'vi_VN', symbol: '₫');
    final theme = Theme.of(context);
    final isAvailable = widget.loaiPhong.coSan;

    return Card(
      elevation: 4,
      margin: const EdgeInsets.all(8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: isAvailable ? () {
          _showRoomDetails(context);
        } : null,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildImageSection(context),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Room name and price
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          widget.loaiPhong.tenLoaiPhong,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            currencyFormat.format(widget.loaiPhong.giaLoaiPhong?.giaCoBan),
                            style: const TextStyle(
                              fontSize: 18,
                              color: Color(0xFF1565C0),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            '/${widget.loaiPhong.donVi}',
                            style: const TextStyle(
                              fontSize: 15,
                              color: Color(0xFF525150),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: 8),

                  // Description
                  if (widget.loaiPhong.moTa.isNotEmpty) ...[
                    Text(
                      widget.loaiPhong.moTa,
                      style: const TextStyle(
                        color: Color(0xFF525150),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                  ],

                  // Availability info
                  _buildAvailabilityInfo(context),

                  const SizedBox(height: 12),

                  // Room basic info
                  _buildRoomInfo(context),

                  const SizedBox(height: 16),

                  // Amenities từ JSON
                  _buildDynamicAmenitiesSection(context),

                  const SizedBox(height: 16),

                  // Book button
                  _buildBookButton(context),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageSection(BuildContext context) {
    final hasImages = widget.loaiPhong.hinhAnhPhong != null &&
        widget.loaiPhong.hinhAnhPhong!.isNotEmpty;

    return Stack(
      children: [
        Container(
          height: 200,
          width: double.infinity,
          decoration: const BoxDecoration(
            borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
          ),
          child: ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: hasImages
                ? _buildImageCarousel()
                : _buildPlaceholderImage(context),
          ),
        ),

        // Availability badge
        Positioned(
          top: 12,
          right: 12,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.9),
              borderRadius: BorderRadius.circular(8),
              boxShadow: const [
                BoxShadow(
                  color: Colors.black12,
                  blurRadius: 4,
                  offset: Offset(0, 2),
                )
              ],
            ),
            child: Text(
              widget.loaiPhong.coSan
                  ? S.of(context).available.toUpperCase()
                  : S.of(context).soldOut.toUpperCase(),
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: widget.loaiPhong.coSan ? Colors.green : Colors.red,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),

        // Low stock warning
        if (widget.loaiPhong.isLowStock)
          Positioned(
            top: 12,
            left: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.orange,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                S.of(context).almostOver.toUpperCase(),
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),

        // Image count indicator và navigation
        if (hasImages && widget.loaiPhong.hinhAnhPhong!.length > 1) ...[
          // Navigation arrows
          Positioned(
            left: 8,
            top: 0,
            bottom: 0,
            child: Center(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.5),
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: const Icon(Icons.chevron_left, color: Colors.white),
                  onPressed: _previousImage,
                ),
              ),
            ),
          ),
          Positioned(
            right: 8,
            top: 0,
            bottom: 0,
            child: Center(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.5),
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: const Icon(Icons.chevron_right, color: Colors.white),
                  onPressed: _nextImage,
                ),
              ),
            ),
          ),

          // Page indicator
          Positioned(
            bottom: 12,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                widget.loaiPhong.hinhAnhPhong!.length,
                    (index) => Container(
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _currentImageIndex == index
                        ? Colors.white
                        : Colors.white.withOpacity(0.5),
                  ),
                ),
              ),
            ),
          ),

          // Image counter
          Positioned(
            bottom: 12,
            right: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.7),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.photo_library, size: 14, color: Colors.white),
                  const SizedBox(width: 4),
                  Text(
                    '${_currentImageIndex + 1}/${widget.loaiPhong.hinhAnhPhong!.length}',
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildImageCarousel() {
    return PageView.builder(
      controller: _pageController,
      onPageChanged: (index) {
        setState(() {
          _currentImageIndex = index;
        });
      },
      itemCount: widget.loaiPhong.hinhAnhPhong!.length,
      itemBuilder: (context, index) {
        final image = widget.loaiPhong.hinhAnhPhong![index];
        return Image.network(
          image.url_anh,
          fit: BoxFit.cover,
          loadingBuilder: (context, child, loadingProgress) {
            if (loadingProgress == null) return child;
            return Container(
              color: Colors.grey.shade200,
              child: Center(
                child: CircularProgressIndicator(
                  value: loadingProgress.expectedTotalBytes != null
                      ? loadingProgress.cumulativeBytesLoaded /
                      loadingProgress.expectedTotalBytes!
                      : null,
                ),
              ),
            );
          },
          errorBuilder: (context, error, stackTrace) {
            return _buildPlaceholderImage(context);
          },
        );
      },
    );
  }

  Widget _buildPlaceholderImage(BuildContext context) {
    return Container(
      color: Colors.grey[200],
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.hotel, size: 50, color: Color(0xFF525150)),
          const SizedBox(height: 8),
          Text(
            widget.loaiPhong.tenLoaiPhong,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildAvailabilityInfo(BuildContext context) {
    // ✅ Sử dụng logic availability từ model hiện tại
    Color bgColor = widget.loaiPhong.coSan ? Colors.green.shade50 : Colors.red.shade50;
    Color borderColor = widget.loaiPhong.coSan ? Colors.green.shade300 : Colors.red.shade300;
    Color textColor = widget.loaiPhong.coSan ? Colors.green : Colors.red;
    IconData icon = widget.loaiPhong.coSan ? Icons.check_circle_outline : Icons.error_outline;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: borderColor, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: textColor),
          const SizedBox(width: 8),
          Text(
            widget.loaiPhong.availabilityText,
            style: TextStyle(
              fontSize: 14,
              color: textColor,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  String _buildSummaryTextRoom(BuildContext context) {
    final locale = Localizations.localeOf(context);
    final isVietnamese = locale.languageCode == 'vi';

    final soPhong = widget.loaiPhong.soLuongKhach;

    if (isVietnamese) {
      return '$soPhong khách';
    } else {
      return '$soPhong guest${soPhong > 1 ? 's' : ''}';
    }
  }

  String getBedConfigurationText(List<CauHinhGiuong> cauHinhGiuong) {
    if (cauHinhGiuong.isEmpty) return S.of(context).bedTypeUnknown;

    List<String> configs = [];

    for (var bed in cauHinhGiuong) {
      final loai = bed.loaiGiuong;
      final soLuong = bed.soLuong;
      if (soLuong != null && soLuong > 0) {
        configs.add('$soLuong ${_translateBedType(loai)}');
      }
    }

    return configs.join(', ');
  }


  IconData _getBedIconData(List<CauHinhGiuong> cauHinhGiuong) {
    if (cauHinhGiuong.isEmpty) return Icons.bed;

    String largestBedType = 'double'; // default
    int maxSize = 0;

    for (var bed in cauHinhGiuong) {
      final bedType = bed.loaiGiuong ?? 'double';
      final size = _getBedSize(bedType);
      if (size > maxSize) {
        maxSize = size;
        largestBedType = bedType;
      }
    }

    return _getBedIcon(largestBedType);
  }
  IconData _getBedIcon(String bedType) {
    switch (bedType) {
      case 'single':
        return Icons.single_bed;
      case 'king':
        return Icons.bed;
      case 'queen':
        return Icons.king_bed;
      case 'double':
      default:
        return Icons.bed;
    }
  }
  String _translateBedType(String? bedType) {
    switch (bedType) {
      case 'single':
        return S.of(context).singleBed;
      case 'double':
        return S.of(context).doubleBed;
      case 'queen':
        return S.of(context).queenBed;
      case 'king':
        return S.of(context).kingBed;
      default:
        return S.of(context).bed;
    }
  }

  int _getBedSize(String bedType) {
    switch (bedType) {
      case 'single':
        return 1;
      case 'double':
        return 2;
      case 'queen':
        return 3;
      case 'king':
        return 4;
      default:
        return 2;
    }
  }
  Widget _buildRoomInfo(BuildContext context) {
    return LayoutBuilder(
      // Sử dụng LayoutBuilder để lấy kích thước hiện có của widget cha
      builder: (context, constraints) {
        // Tính toán chiều rộng tối đa cho mỗi item, bằng nửa chiều rộng màn hình trừ đi khoảng cách
        final maxItemWidth = constraints.maxWidth / 2 - 8; // Half width minus spacing

        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween, // Căn đều 2 item sang 2 bên
          children: [
            // Item thông tin giường
            SizedBox(
              width: maxItemWidth, // Giới hạn chiều rộng tối đa
              child: _buildInfoItem(
                context,
                icon: _getBedIconData(widget.loaiPhong.cauHinhGiuong??[]),
                text: getBedConfigurationText(widget.loaiPhong.cauHinhGiuong??[]),
              ),
            ),
            // Item thông tin số người
            SizedBox(
              width: maxItemWidth, // Giới hạn chiều rộng tối đa
              child: _buildInfoItem(
                context,
                icon: Icons.person,
                text: _buildSummaryTextRoom(context),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildInfoItem(
      BuildContext context, {
        required IconData icon,
        required String text,
        bool isCompact = false, // Chế độ thu gọn
        bool isSecondary = false, // Kiểu hiển thị phụ
      }) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isCompact ? 6 : 8, // Padding ngang thay đổi theo chế độ
        vertical: isCompact ? 4 : 6, // Padding dọc thay đổi theo chế độ
      ),
      decoration: BoxDecoration(
        // Màu nền thay đổi theo kiểu hiển thị
        color: isSecondary
            ? Colors.grey.shade50
            : Colors.blue.shade50,
        borderRadius: BorderRadius.circular(8), // Bo góc 8px
        border: Border.all(
          // Màu viền thay đổi theo kiểu hiển thị
          color: isSecondary
              ? Colors.grey.shade200
              : Colors.blue.shade200,
          width: 1, // Độ dày viền
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min, // Chiều rộng co lại vừa đủ nội dung
        crossAxisAlignment: CrossAxisAlignment.center, // Căn giữa theo chiều dọc
        children: [
          // Icon hiển thị
          Icon(
            icon,
            size: isCompact ? 18 : 20, // Kích thước thay đổi theo chế độ
            color: isSecondary
                ? Colors.grey.shade600
                : Color(0xFF525150), // Màu thay đổi theo kiểu hiển thị
          ),
          SizedBox(width: isCompact ? 3 : 4), // Khoảng cách thay đổi theo chế độ
          Flexible(
            // Cho phép text co giãn và xuống dòng khi cần
            child: Text(
              text,
              style: TextStyle(

                fontWeight: FontWeight.bold, // Độ đậm vừa phải
                fontSize: isCompact ? 12 : 13, // Cỡ chữ thay đổi theo chế độ
                color: isSecondary ? Colors.grey.shade700 : null, // Màu chữ
              ),
              overflow: TextOverflow.visible, // Hiển thị đầy đủ nội dung
              softWrap: true, // Cho phép xuống dòng khi cần
              maxLines: 2, // Giới hạn tối đa 2 dòng (tránh chiếm quá nhiều không gian)
            ),
          ),
        ],
      ),
    );
  }



  Widget _buildDynamicAmenitiesSection(BuildContext context) {
    // Lấy tiện nghi từ cả 2 nguồn: tienNghiDacBiet và tienNghi
    final List<Map<String, String>> allAmenities = [];

    // Thêm tiện nghi đặc biệt (dạng String)
    for (final amenity in widget.loaiPhong.tienNghiDacBiet) {
      allAmenities.add({
        'name': amenity,
        'icon': '', // Không có icon field
      });
    }

    // Thêm tiện nghi từ JSON (dạng TienNghi objects)
    if (widget.loaiPhong.tienNghi != null) {
      for (final tienNghi in widget.loaiPhong.tienNghi!) {
        allAmenities.add({
          'name': tienNghi.tenTienNghi,
          'icon': tienNghi.icon ?? '', // Lấy icon field nếu có
        });
      }
    }

    if (allAmenities.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '${S.of(context).amenities}:',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            if (allAmenities.length > 6)
              TextButton(
                onPressed: () => _showAllAmenities(context, allAmenities),
                child: Text(
                  '${S.of(context).seeAll} (${allAmenities.length})',
                  style: const TextStyle(fontSize: 12),
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),

        // Hiển thị 6 tiện nghi đầu tiên
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: allAmenities.take(6).map((amenity) {
            return _buildAmenityChip(context, amenity);
          }).toList(),
        ),

        if (allAmenities.length > 6) ...[
          const SizedBox(height: 8),
          Text(
            '+${allAmenities.length - 6} ${S.of(context).otherAmenities}',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: Colors.blue,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildAmenityChip(BuildContext context, Map<String, String> amenity) {
    // Sử dụng AmenityIconMapper để lấy icon
    final iconData = AmenityIconMapper.getAmenityIcon(
      amenity['icon'], // icon field từ database
      amenity['name'], // tên tiện nghi
    );

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            iconData,
            size: 14,
            color: Colors.blue.shade700,
          ),
          const SizedBox(width: 4),
          Text(
            amenity['name']!,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: Colors.blue.shade700,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBookButton(BuildContext context) {
    final isAvailable = widget.loaiPhong.phongCoSan;

    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: isAvailable > 0 ? () {
          if (widget.onBookPressed != null) {
            widget.onBookPressed!();
          } else {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (builder) => PaymentScreen(
                    loaiPhong: widget.loaiPhong,
                        lichPhongTrong: widget.lichPhongTrong,

                ),
              ),
            );
          }
        } : null,
        style: ElevatedButton.styleFrom(
          elevation: 1,
          overlayColor: Colors.black.withOpacity(0.05),
          splashFactory: InkRipple.splashFactory,
          backgroundColor: isAvailable > 0 ? const Color(0xFF1565C0) : Colors.grey,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(vertical: 14),
        ),
        child: Text(
          isAvailable > 0
              ? S.of(context).bookNow.toUpperCase()
              : S.of(context).soldOut.toUpperCase(),
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
      ),
    );
  }

  void _previousImage() {
    if (_currentImageIndex > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _nextImage() {
    if (_currentImageIndex < widget.loaiPhong.hinhAnhPhong!.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _showRoomDetails(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        expand: false,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              Text(
                widget.loaiPhong.tenLoaiPhong,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 10),

              Expanded(
                child: ListView(
                  controller: scrollController,
                  children: [
                    // Mô tả chi tiết
                    if (widget.loaiPhong.moTa.isNotEmpty) ...[
                      Text(
                        S.of(context).description,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(widget.loaiPhong.moTa),
                      const SizedBox(height: 20),
                    ],

                    // Tất cả tiện nghi
                     Text(
                      S.of(context).allAmenities,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    _buildFullAmenitiesList(context),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFullAmenitiesList(BuildContext context) {
    final List<Map<String, String>> allAmenities = [];

    // Thêm tiện nghi đặc biệt (dạng String)
    for (final amenity in widget.loaiPhong.tienNghiDacBiet) {
      allAmenities.add({
        'name': amenity,
        'icon': '', // Không có icon field
      });
    }

    // Thêm tiện nghi từ JSON (dạng TienNghi objects)
    if (widget.loaiPhong.tienNghi != null) {
      for (final tienNghi in widget.loaiPhong.tienNghi!) {
        allAmenities.add({
          'name': tienNghi.tenTienNghi,
          'icon': tienNghi.icon ?? '', // Lấy icon field nếu có
        });
      }
    }

    return Column(
      children: allAmenities.map((amenity) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            Icon(
              AmenityIconMapper.getAmenityIcon(
                amenity['icon'], // icon field từ database
                amenity['name'], // tên tiện nghi
              ),
              size: 20,
              color: Colors.blue.shade700,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                amenity['name']!,
                style: const TextStyle(fontSize: 16),
              ),
            ),
          ],
        ),
      )).toList(),
    );
  }

  void _showAllAmenities(BuildContext context, List<Map<String, String>> amenities) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(S.of(context).allAmenities),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: amenities.length,
            itemBuilder: (context, index) => ListTile(
              leading: Icon(
                AmenityIconMapper.getAmenityIcon(
                  amenities[index]['icon'],
                  amenities[index]['name'],
                ),
              ),
              title: Text(amenities[index]['name']!),
              dense: true,
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(S.of(context).close),
          ),
        ],
      ),
    );
  }
}