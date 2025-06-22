import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:doan_datphong/generated/l10n.dart';

import 'package:doan_datphong/Blocs/getAmenities_Blocs/getAmenities_bloc.dart';
import 'package:doan_datphong/Blocs/getAmenities_Blocs/getAmenities_event.dart';
import 'package:doan_datphong/Blocs/getAmenities_Blocs/getAmenities_state.dart';
import '../../../Models/TienNghi.dart';
import '../../../Models/NhomTienNghi.dart';
import 'amenities_modal.dart';

class AmenitiesSection extends StatefulWidget {
  final String hotelId;

  const AmenitiesSection({
    Key? key,
    required this.hotelId,
  }) : super(key: key);

  @override
  State<AmenitiesSection> createState() => _AmenitiesSectionState();
}

class _AmenitiesSectionState extends State<AmenitiesSection> {
  List<TienNghi> keyAmenities = [];
  bool isLoadingAmenities = false;

  @override
  void initState() {
    super.initState();
    _fetchKeyAmenities();
  }

  void _fetchKeyAmenities() {
    context.read<GetAmenitiesBloc>().add(FetchKeyAmenities(widget.hotelId));
  }

  void _fetchGroupedAmenities() {
    context.read<GetAmenitiesBloc>().add(FetchGroupedAmenities(widget.hotelId));
  }

  void _showAllAmenitiesModal() {
    _fetchGroupedAmenities();
    showDialog(
      context: context,
      builder: (context) => AmenitiesModal(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<GetAmenitiesBloc, GetAmenitiesState>(
      listener: (context, state) {
        if (state is GetKeyAmenitiesSuccess) {
          setState(() {
            keyAmenities = state.keyAmenities;
            isLoadingAmenities = false;
          });
        } else if (state is GetKeyAmenitiesFailure) {
          setState(() {
            isLoadingAmenities = false;
          });
        } else if (state is GetKeyAmenitiesLoading) {
          setState(() {
            isLoadingAmenities = true;
          });
        }
      },
      builder: (context, state) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              S.of(context).amenities,
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),

            if (isLoadingAmenities)
              Container(
                height: 80,
                child: Center(
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              )
            else if (keyAmenities.isEmpty)
              _buildStaticAmenities()
            else
              _buildDynamicAmenities(),
          ],
        );
      },
    );
  }

  Widget _buildDynamicAmenities() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Hiển thị key amenities (limit 6 items)
        Wrap(
          spacing: 10,
          runSpacing: 12,
          children: keyAmenities.take(6).map((amenity) =>
              _buildAmenityItem(
                  _getIconFromString(amenity.icon),
                  amenity.tenTienNghi
              )
          ).toList(),
        ),

        const SizedBox(height: 16),

        // Button "View all amenities"
        InkWell(
          onTap: _showAllAmenitiesModal,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.blue, width: 1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.visibility, color: Colors.blue, size: 16),
                const SizedBox(width: 8),
                Text(
                  S.of(context).viewAllAmenities,
                  style: TextStyle(
                    color: Colors.blue,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(width: 4),
                Icon(Icons.arrow_forward_ios, color: Colors.blue, size: 12),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStaticAmenities() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 10,
          runSpacing: 12,
          children: [
            _buildAmenityItem(FontAwesomeIcons.swimmingPool, "Swimming"),
            _buildAmenityItem(FontAwesomeIcons.bed, "Double bed"),
            _buildAmenityItem(FontAwesomeIcons.tv, "Smart TV"),
            _buildAmenityItem(FontAwesomeIcons.wifi, "Free Wifi"),
            _buildAmenityItem(FontAwesomeIcons.utensils, "Restaurant"),
            _buildAmenityItem(FontAwesomeIcons.bath, "Bath"),
          ],
        ),

        const SizedBox(height: 16),

        InkWell(
          onTap: _showAllAmenitiesModal,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.blue, width: 1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.visibility, color: Colors.blue, size: 16),
                const SizedBox(width: 8),
                Text(
                  "View all amenities",
                  style: TextStyle(
                    color: Colors.blue,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(width: 4),
                Icon(Icons.arrow_forward_ios, color: Colors.blue, size: 12),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAmenityItem(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: Colors.blue),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(fontSize: 12),
            textAlign: TextAlign.center,
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