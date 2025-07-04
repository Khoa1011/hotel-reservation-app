import 'package:flutter/material.dart';

/// Class để map icon cho các tiện nghi phòng
class AmenityIconMapper {
  // Map dựa trên icon field từ database
  static final Map<String, IconData> _iconMap = {
    // Technology & Entertainment
    'smart_tv': Icons.live_tv,
    'tv': Icons.tv,
    'wifi': Icons.wifi,
    'bluetooth': Icons.bluetooth,
    'usb': Icons.usb,
    'mic': Icons.mic,
    'battery_charging_full': Icons.battery_charging_full,
    'lightbulb': Icons.lightbulb,

    // Kitchen & Appliances
    'kitchen': Icons.kitchen,
    'microwave': Icons.microwave,
    'coffee': Icons.coffee,
    'local_dining': Icons.local_dining,
    'wine_bar': Icons.wine_bar,
    'water_drop': Icons.water_drop,

    // Comfort & Climate
    'ac_unit': Icons.ac_unit,
    'thermostat': Icons.thermostat,
    'air': Icons.air,
    'heating': Icons.local_fire_department,

    // Bathroom & Hygiene
    'bathtub': Icons.bathtub,
    'shower': Icons.shower,
    'soap': Icons.soap,
    'dry_cleaning': Icons.dry_cleaning,
    'iron': Icons.iron,

    // Bedroom & Storage
    'bed': Icons.bed,
    'chair': Icons.chair,
    'table_restaurant': Icons.table_restaurant,
    'closet': Icons.checkroom,
    'safe': Icons.security,
    'lock': Icons.lock,

    // Outdoor & Views
    'balcony': Icons.balcony,
    'pool': Icons.pool,
    'fitness_center': Icons.fitness_center,
    'spa': Icons.spa,
    'garden': Icons.local_florist,
    'beach_access': Icons.beach_access,
    'mountain': Icons.landscape,
    'city': Icons.location_city,

    // Services
    'room_service': Icons.room_service,
    'concierge_service': Icons.support_agent,
    'elevator': Icons.elevator,
    'parking': Icons.local_parking,
    'pets': Icons.pets,
    'business_center': Icons.business_center,
    'local_laundry': Icons.local_laundry_service,

    // Safety & Security
    'security': Icons.security,
    'fire_extinguisher': Icons.fire_extinguisher,
    'medical_services': Icons.medical_services,
    'emergency': Icons.emergency,
  };

  /// Lấy icon dựa trên icon field từ database
  static IconData getIconByField(String? iconField) {
    if (iconField == null || iconField.isEmpty) {
      return Icons.check_circle_outline;
    }
    return _iconMap[iconField.toLowerCase()] ?? Icons.check_circle_outline;
  }

  /// Lấy icon dựa trên tên tiện nghi (fallback method)
  static IconData getIconByName(String amenityName) {
    final nameLower = amenityName.toLowerCase();

    // Technology & Entertainment
    if (nameLower.contains('smart tv') || nameLower.contains('tv thông minh')) {
      return Icons.live_tv;
    } else if (nameLower.contains('tv') || nameLower.contains('television')) {
      return Icons.tv;
    } else if (nameLower.contains('wifi') || nameLower.contains('internet')) {
      return Icons.wifi;
    } else if (nameLower.contains('bluetooth') || nameLower.contains('loa bluetooth')) {
      return Icons.bluetooth;
    } else if (nameLower.contains('usb') || nameLower.contains('cổng usb')) {
      return Icons.usb;
    } else if (nameLower.contains('điều khiển giọng nói') || nameLower.contains('voice control')) {
      return Icons.mic;
    } else if (nameLower.contains('sạc không dây') || nameLower.contains('wireless charging')) {
      return Icons.battery_charging_full;
    } else if (nameLower.contains('smart lighting') || nameLower.contains('đèn thông minh')) {
      return Icons.lightbulb;
    }

    // Kitchen & Appliances
    else if (nameLower.contains('tủ lạnh') || nameLower.contains('fridge') || nameLower.contains('kitchen')) {
      return Icons.kitchen;
    } else if (nameLower.contains('lò vi sóng') || nameLower.contains('microwave')) {
      return Icons.microwave;
    } else if (nameLower.contains('máy pha cà phê') || nameLower.contains('coffee')) {
      return Icons.coffee;
    } else if (nameLower.contains('bếp') || nameLower.contains('stove')) {
      return Icons.local_dining;
    } else if (nameLower.contains('minibar') || nameLower.contains('wine')) {
      return Icons.wine_bar;
    } else if (nameLower.contains('nước uống') || nameLower.contains('water')) {
      return Icons.water_drop;
    }

    // Comfort & Climate
    else if (nameLower.contains('điều hòa') || nameLower.contains('air conditioning') || nameLower.contains('ac')) {
      return Icons.ac_unit;
    } else if (nameLower.contains('sưởi') || nameLower.contains('heating')) {
      return Icons.local_fire_department;
    } else if (nameLower.contains('quạt') || nameLower.contains('fan')) {
      return Icons.air;
    }

    // Bathroom & Hygiene
    else if (nameLower.contains('bồn tắm') || nameLower.contains('bathtub') || nameLower.contains('bath')) {
      return Icons.bathtub;
    } else if (nameLower.contains('vòi hoa sen') || nameLower.contains('shower')) {
      return Icons.shower;
    } else if (nameLower.contains('đồ tắm') || nameLower.contains('toiletries')) {
      return Icons.soap;
    } else if (nameLower.contains('máy sấy') || nameLower.contains('hair dryer')) {
      return Icons.dry_cleaning;
    } else if (nameLower.contains('bàn ủi') || nameLower.contains('iron')) {
      return Icons.iron;
    }

    // Bedroom & Storage
    else if (nameLower.contains('giường') || nameLower.contains('bed')) {
      return Icons.bed;
    } else if (nameLower.contains('ghế') || nameLower.contains('chair')) {
      return Icons.chair;
    } else if (nameLower.contains('bàn') || nameLower.contains('table')) {
      return Icons.table_restaurant;
    } else if (nameLower.contains('tủ quần áo') || nameLower.contains('wardrobe') || nameLower.contains('closet')) {
      return Icons.checkroom;
    } else if (nameLower.contains('két sắt') || nameLower.contains('safe')) {
      return Icons.security;
    }

    // Outdoor & Views
    else if (nameLower.contains('ban công') || nameLower.contains('balcony')) {
      return Icons.balcony;
    } else if (nameLower.contains('hồ bơi') || nameLower.contains('pool')) {
      return Icons.pool;
    } else if (nameLower.contains('gym') || nameLower.contains('fitness')) {
      return Icons.fitness_center;
    } else if (nameLower.contains('spa') || nameLower.contains('massage')) {
      return Icons.spa;
    } else if (nameLower.contains('vườn') || nameLower.contains('garden')) {
      return Icons.local_florist;
    } else if (nameLower.contains('view biển') || nameLower.contains('beach')) {
      return Icons.beach_access;
    } else if (nameLower.contains('view núi') || nameLower.contains('mountain')) {
      return Icons.landscape;
    } else if (nameLower.contains('view thành phố') || nameLower.contains('city')) {
      return Icons.location_city;
    }

    // Services
    else if (nameLower.contains('room service') || nameLower.contains('phục vụ phòng')) {
      return Icons.room_service;
    } else if (nameLower.contains('lễ tân') || nameLower.contains('concierge')) {
      return Icons.support_agent;
    } else if (nameLower.contains('thang máy') || nameLower.contains('elevator')) {
      return Icons.elevator;
    } else if (nameLower.contains('chỗ đậu xe') || nameLower.contains('parking')) {
      return Icons.local_parking;
    } else if (nameLower.contains('thú cưng') || nameLower.contains('pets')) {
      return Icons.pets;
    } else if (nameLower.contains('trung tâm kinh doanh') || nameLower.contains('business')) {
      return Icons.business_center;
    } else if (nameLower.contains('giặt ủi') || nameLower.contains('laundry')) {
      return Icons.local_laundry_service;
    }

    // Safety & Security
    else if (nameLower.contains('an ninh') || nameLower.contains('security')) {
      return Icons.security;
    } else if (nameLower.contains('bình chữa cháy') || nameLower.contains('fire extinguisher')) {
      return Icons.fire_extinguisher;
    } else if (nameLower.contains('y tế') || nameLower.contains('medical')) {
      return Icons.medical_services;
    }

    // Default icon
    else {
      return Icons.check_circle_outline;
    }
  }

  /// Method chính để lấy icon - ưu tiên icon field, fallback về name
  static IconData getAmenityIcon(String? iconField, String? amenityName) {
    // Thử lấy icon từ field trước
    if (iconField != null && iconField.isNotEmpty) {
      final iconFromField = getIconByField(iconField);
      if (iconFromField != Icons.check_circle_outline) {
        return iconFromField;
      }
    }

    // Nếu không có hoặc không tìm thấy, dùng name
    if (amenityName != null && amenityName.isNotEmpty) {
      return getIconByName(amenityName);
    }

    return Icons.check_circle_outline;
  }

  /// Method helper để lấy icon chỉ từ tên (để backward compatibility)
  static IconData getIconFromName(String amenityName) {
    return getIconByName(amenityName);
  }
}