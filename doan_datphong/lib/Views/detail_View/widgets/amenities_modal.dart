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
            return Container(
              height: 200,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(),
                    const SizedBox(height: 16),
                    Text(
                      "Loading amenities...",
                      style: TextStyle(color: Colors.grey[800]),
                    ),
                  ],
                ),
              ),
            );
          }

          if (state is GetGroupedAmenitiesSuccess) {
            if (state.groupedAmenities.isEmpty) {
              return Container(
                height: 200,
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.hotel_outlined, size: 48, color: Colors.grey),
                      const SizedBox(height: 16),
                      Text(
                        'No amenities available',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              );
            }

            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Thống kê tổng quan
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(
                      color: Colors.blue[50],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildStatItem(
                          icon: Icons.category,
                          label: S.of(context).categories,
                          value: "${state.categoriesCount}",
                        ),
                        _buildStatItem(
                          icon: Icons.star,
                          label: S.of(context).totalAmenities,
                          value: "${state.totalAmenities}",
                        ),
                      ],
                    ),
                  ),

                  // Danh sách amenities theo category
                  ...state.groupedAmenities.map((category) =>
                      _buildAmenityCategory(category)
                  ).toList(),
                ],
              ),
            );
          }

          if (state is GetGroupedAmenitiesFailure) {
            return Container(
              height: 200,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.error_outline, size: 48, color: Colors.red[300]),
                    const SizedBox(height: 16),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Text(
                        state.error,
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.grey[800]),
                      ),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () {
                        // Re-fetch data
                        context.read<GetAmenitiesBloc>().add(
                            FetchGroupedAmenities("current_hotel_id") // Cần truyền hotel ID
                        );
                      },
                      icon: Icon(Icons.refresh),
                      label: Text(S.of(context).tryAgain),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          return Container(
            height: 200,
            child: Center(
              child: Text(
                S.of(context).loadingData,
                style: TextStyle(color: Colors.grey),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildFooter(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: Colors.grey[200]!)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          TextButton(
            style: TextButton.styleFrom(
              foregroundColor: Colors.blue[800],
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            onPressed: () => Navigator.pop(context),
            child: Text(
              S.of(context).close,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
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
  }) {
    return Column(
      children: [
        Icon(icon, color: Colors.blue[800], size: 20),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.blue[800],
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 15,
            color: Colors.grey[800],
          ),
        ),
      ],
    );
  }

  Widget _buildAmenityCategory(NhomTienNghi category) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[200]!),
        borderRadius: BorderRadius.circular(12),
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
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.blue[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    _getIconFromString(category.icon),
                    size: 20,
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
                        Text(
                          category.moTa,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[800],
                          ),
                        ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.blue[800],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${category.tienNghi.length}',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Amenities list
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: category.tienNghi.map((amenity) =>
                  _buildAmenityItem(amenity)
              ).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAmenityItem(TienNghi amenity) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.blue[25],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.blue[100]!),
      ),
      child: Row(
        children: [
          Icon(
            Icons.check_circle,
            size: 16,
            color: Colors.blue[800],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              amenity.tenTienNghi,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: Colors.grey[800],
              ),
            ),
          ),
        ],
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
        return FontAwesomeIcons.snowflake;
      case 'kitchen':
        return FontAwesomeIcons.kitchenSet;
      case 'bathtub':
        return FontAwesomeIcons.bath;
      case 'lock':
        return FontAwesomeIcons.lock;
      case 'security':
        return FontAwesomeIcons.shield;
      case 'computer':
        return FontAwesomeIcons.computer;
      case 'home':
        return FontAwesomeIcons.home;
      default:
        return FontAwesomeIcons.star;
    }
  }
}