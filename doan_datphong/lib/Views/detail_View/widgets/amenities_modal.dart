import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:doan_datphong/generated/l10n.dart';
import 'package:doan_datphong/Blocs/getAmenities_Blocs/getAmenities_bloc.dart';
import 'package:doan_datphong/Blocs/getAmenities_Blocs/getAmenities_event.dart';
import 'package:doan_datphong/Blocs/getAmenities_Blocs/getAmenities_state.dart';
import '../../../Models/NhomTienNghi.dart';
import '../../../Models/TienNghi.dart';

class AmenitiesModal extends StatelessWidget {
  const AmenitiesModal({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(20),
      child: Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.8,
        ),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.2),
              blurRadius: 20,
              spreadRadius: 2,
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildHeader(context),
            _buildContent(context),
            _buildFooter(context),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue[800],
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(16),
          topRight: Radius.circular(16),
        ),
      ),
      child: Text(
        S.of(context).allAmenities,
        style: TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }

  Widget _buildContent(BuildContext context) {
    return Flexible(
      child: BlocBuilder<GetAmenitiesBloc, GetAmenitiesState>(
        builder: (context, state) {
          if (state is GetGroupedAmenitiesLoading) {
            return _buildLoadingState(context);
          }

          if (state is GetGroupedAmenitiesSuccess) {
            // CASE 1: Hoàn toàn không có nhóm tiện nghi
            if (state.groupedAmenities.isEmpty) {
              return _buildCompletelyEmptyState(context);
            }

            // CASE 2: Có nhóm nhưng tất cả đều rỗng
            bool allGroupsEmpty = state.groupedAmenities.every(
                    (group) => group.tienNghi.isEmpty
            );
            if (allGroupsEmpty) {
              return _buildEmptyAmenitiesState(context, state.groupedAmenities);
            }

            // CASE 3: Có dữ liệu bình thường
            return _buildSuccessState(context, state);
          }

          return _buildInitialState(context);
        },
      ),
    );
  }

  Widget _buildEmptyAmenitiesState(BuildContext context, List<NhomTienNghi> groups) {
    return Container(
      height: 400,
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          // Icon và thông báo chính
          Expanded(
            flex: 2,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.orange[50]!, Colors.orange[100]!],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      FontAwesomeIcons.boxes,
                      size: 48,
                      color: Colors.orange[700],
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    S.of(context).amenityGroupIsEmpty,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey[800],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    "Đã có ${groups.length} nhóm tiện nghi nhưng chưa có tiện nghi cụ thể nào.",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Hiển thị danh sách nhóm trống
          Expanded(
            flex: 1,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Các nhóm hiện có:",
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey[700],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Expanded(
                    child: SingleChildScrollView(
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: groups.map((group) => Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.blue[200]!),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                _getIconFromString(group.icon),
                                size: 14,
                                color: Colors.blue[600],
                              ),
                              const SizedBox(width: 6),
                              Text(
                                group.tenNhomTienNghi,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.blue[800],
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        )).toList(),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }


  Widget _buildLoadingState(BuildContext context) {
    return Container(
      height: 200,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.blue[800]!),
            ),
            const SizedBox(height: 16),
            Text(
              S.of(context).loadingAmenities,
              style: TextStyle(
                color: Colors.grey[800],
                fontSize: 16,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Container(
      height: 280,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                shape: BoxShape.circle,
              ),
              child: Icon(
                FontAwesomeIcons.hotel,
                size: 48,
                color: Colors.blue[800],
              ),
            ),
            const SizedBox(height: 24),
            Text(
              S.of(context).noAmenitiesAvailable,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.grey[800],
              ),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40),
              child: Text(
                "Khách sạn này chưa thiết lập các tiện nghi. Vui lòng quay lại sau.",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                  height: 1.4,
                ),
              ),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.blue[100],
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.info_outline,
                    size: 16,
                    color: Colors.blue[800],
                  ),
                  const SizedBox(width: 8),
                  Text(
                    S.of(context).loadingAmenities,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.blue[800],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRetryState(BuildContext context, String error) {
    return Container(
      height: 250,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.orange[50],
                shape: BoxShape.circle,
              ),
              child: Icon(
                FontAwesomeIcons.triangleExclamation,
                size: 40,
                color: Colors.orange[600],
              ),
            ),
            const SizedBox(height: 20),
            Text(
              "Không thể tải tiện nghi",
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.grey[800],
              ),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40),
              child: Text(
                "Đã xảy ra lỗi khi tải danh sách tiện nghi. Vui lòng thử lại.",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () {
                context.read<GetAmenitiesBloc>().add(
                    FetchGroupedAmenities("current_hotel_id") // Cần truyền hotel ID
                );
              },
              icon: Icon(Icons.refresh, size: 18),
              label: Text("Thử lại"),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue[800],
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInitialState(BuildContext context) {
    return Container(
      height: 200,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              FontAwesomeIcons.star,
              size: 40,
              color: Colors.blue[300],
            ),
            const SizedBox(height: 16),
            Text(
              S.of(context).hotelNotAmenityYet,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 15,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuccessState(BuildContext context, GetGroupedAmenitiesSuccess state) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Thống kê tổng quan
          Container(
            padding: const EdgeInsets.all(16),
            margin: const EdgeInsets.only(bottom: 20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.blue[50]!, Colors.blue[100]!],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.blue[200]!),
            ),
            child: Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    icon: FontAwesomeIcons.layerGroup,
                    label: S.of(context).categories,
                    value: "${state.categoriesCount}",
                    color: Colors.blue[800]!,
                  ),
                ),
                Container(
                  width: 1,
                  height: 40,
                  color: Colors.blue[300],
                ),
                Expanded(
                  child: _buildStatItem(
                    icon: FontAwesomeIcons.star,
                    label: S.of(context).totalAmenities,
                    value: "${state.totalAmenities}",
                    color: Colors.blue[800]!,
                  ),
                ),
              ],
            ),
          ),

          // Danh sách amenities theo category
          ...state.groupedAmenities.map((category) =>
              _buildAmenityCategory(context,category)
          ).toList(),

          // Footer spacing
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildFooter(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: Colors.grey[200]!)),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(16),
          bottomRight: Radius.circular(16),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          TextButton(
            style: TextButton.styleFrom(
              foregroundColor: Colors.blue[800],
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            onPressed: () => Navigator.pop(context),
            child: Text(
              S.of(context).close,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 15,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: Colors.grey[700],
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildAmenityCategory(BuildContext context,NhomTienNghi category) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[200]!),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Category header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.blue[100],
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    _getIconFromString(category.icon),
                    size: 22,
                    color: Colors.blue[800],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        category.tenNhomTienNghi,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.blue[800],
                        ),
                      ),
                      if (category.moTa.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            category.moTa,
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey[600],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.blue[800],
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: Text(
                    '${category.tienNghi.length}',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Amenities list
          if (category.tienNghi.isEmpty)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Center(
                child: Column(
                  children: [
                    Icon(
                      FontAwesomeIcons.box,
                      size: 32,
                      color: Colors.grey[400],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      S.of(context).noAmenitiesAvailable,
                      style: TextStyle(
                        color: Colors.grey[500],
                        fontSize: 14,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: category.tienNghi.map((amenity) =>
                    _buildAmenityItem(context,amenity)
                ).toList(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildAmenityItem(BuildContext context,TienNghi amenity) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.blue[100]!),
        boxShadow: [
          BoxShadow(
            color: Colors.blue.withOpacity(0.05),
            blurRadius: 4,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: Colors.green[100],
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.check,
              size: 14,
              color: Colors.green[700],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              amenity.tenTienNghi,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: Colors.grey[800],
              ),
            ),
          ),
          if (amenity.icon.isNotEmpty)
            Icon(
              _getIconFromString(amenity.icon),
              size: 16,
              color: Colors.blue[600],
            ),
        ],
      ),
    );
  }

  Widget _buildCompletelyEmptyState(BuildContext context) {
    return Container(
      height: 320,
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.blue[50]!, Colors.blue[100]!],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
              ),
              child: Icon(
                FontAwesomeIcons.hotel,
                size: 56,
                color: Colors.blue[800],
              ),
            ),
            const SizedBox(height: 24),
            Text(
              S.of(context).noAmenitiesAvailable,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Colors.grey[800],
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                S.of(context).hotelNotAmenityYet,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 15,
                  color: Colors.grey[600],
                  height: 1.5,
                ),
              ),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.amber[50],
                borderRadius: BorderRadius.circular(25),
                border: Border.all(color: Colors.amber[200]!),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    FontAwesomeIcons.clock,
                    size: 16,
                    color: Colors.amber[800],
                  ),
                  const SizedBox(width: 8),
                  Text(
                    S.of(context).updatingInProgress,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.amber[800],
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () {
                context.read<GetAmenitiesBloc>().add(
                    FetchGroupedAmenities("current_hotel_id")
                );
              },
              icon: Icon(FontAwesomeIcons.arrowsRotate, size: 16),
              label: Text("Làm mới"),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue[800],
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _getIconFromString(String iconName) {
    switch (iconName.toLowerCase()) {
      case 'wifi':
        return FontAwesomeIcons.wifi;
      case 'tv':
      case 'smart_tv':
        return FontAwesomeIcons.tv;
      case 'ac_unit':
      case 'snowflake':
        return FontAwesomeIcons.snowflake;
      case 'kitchen':
      case 'kitchenset':
        return FontAwesomeIcons.kitchenSet;
      case 'bathtub':
      case 'bath':
        return FontAwesomeIcons.bath;
      case 'lock':
        return FontAwesomeIcons.lock;
      case 'security':
      case 'shield':
        return FontAwesomeIcons.shield;
      case 'computer':
        return FontAwesomeIcons.computer;
      case 'home':
        return FontAwesomeIcons.home;
      case 'park':
        return FontAwesomeIcons.tree;
      case 'sports_esports':
        return FontAwesomeIcons.gamepad;
      case 'room_service':
        return FontAwesomeIcons.bell;
      default:
        return FontAwesomeIcons.star;
    }
  }
}