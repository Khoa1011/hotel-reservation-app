// lib/Views/map_View/hotel_map_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:location/location.dart' as LocationService;
import 'package:geocoding/geocoding.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

// Import theo đường dẫn của bạn
import '../../../Models/KhachSan.dart';
import '../../../generated/l10n.dart';

class HotelMapScreen extends StatefulWidget {
  final KhachSan hotel;

  const HotelMapScreen({Key? key, required this.hotel}) : super(key: key);

  @override
  _HotelMapScreenState createState() => _HotelMapScreenState();
}

class _HotelMapScreenState extends State<HotelMapScreen> {
  final MapController _mapController = MapController();
  LocationService.Location location = LocationService.Location();
  LocationService.LocationData? _currentLocation;
  bool _isLoadingLocation = true;
  bool _isLoadingHotelLocation = true;
  String _locationError = '';

  // Tọa độ khách sạn
  LatLng? _hotelLocation;
  late LatLng _mapCenter;

  @override
  void initState() {
    super.initState();
    _initializeHotelLocation();
    _getCurrentLocation();
  }

  // Khởi tạo vị trí khách sạn từ địa chỉ
  Future<void> _initializeHotelLocation() async {
    try {
      print('🏨 Bắt đầu tìm vị trí khách sạn: ${widget.hotel.diaChi}');

      // Thử geocoding địa chỉ trước
      final coordinates = await _geocodeAddress(widget.hotel.diaChi);

      if (coordinates != null) {
        print('✅ Geocoding thành công: ${coordinates.latitude}, ${coordinates.longitude}');
        setState(() {
          _hotelLocation = coordinates;
          _mapCenter = coordinates; // Set map center là vị trí khách sạn
          _isLoadingHotelLocation = false;
        });
      } else {
        print('⚠️ Geocoding thất bại, sử dụng fallback');
        // Fallback về tọa độ mặc định nếu không geocode được
        final fallbackLocation = _getFallbackCoordinates();
        print('📍 Fallback location: ${fallbackLocation.latitude}, ${fallbackLocation.longitude}');
        setState(() {
          _hotelLocation = fallbackLocation;
          _mapCenter = fallbackLocation;
          _isLoadingHotelLocation = false;
          _locationError = 'Không thể xác định chính xác vị trí từ địa chỉ. Hiển thị vị trí gần đúng.';
        });
      }
    } catch (e) {
      print('❌ Error initializing hotel location: $e');
      final fallbackLocation = _getFallbackCoordinates();
      setState(() {
        _hotelLocation = fallbackLocation;
        _mapCenter = fallbackLocation;
        _isLoadingHotelLocation = false;
        _locationError = 'Lỗi khi xác định vị trí khách sạn';
      });
    }
  }

  // Geocoding địa chỉ thành tọa độ
  Future<LatLng?> _geocodeAddress(String address) async {
    try {
      // Thêm "Vietnam" vào cuối để tăng độ chính xác
      String searchAddress = address;
      if (!address.toLowerCase().contains('vietnam') &&
          !address.toLowerCase().contains('việt nam')) {
        searchAddress = '$address, Vietnam';
      }

      print('Geocoding address: $searchAddress');

      final locations = await locationFromAddress(searchAddress);

      if (locations.isNotEmpty) {
        final geocodingLocation = locations.first;
        print('Geocoded to: ${geocodingLocation.latitude}, ${geocodingLocation.longitude}');
        return LatLng(geocodingLocation.latitude, geocodingLocation.longitude);
      }
    } catch (e) {
      print('Geocoding error: $e');

      // Thử với địa chỉ được làm sạch
      try {
        String cleanAddress = _cleanAddress(address);
        final locations = await locationFromAddress(cleanAddress);
        if (locations.isNotEmpty) {
          final geocodingLocation = locations.first;
          return LatLng(geocodingLocation.latitude, geocodingLocation.longitude);
        }
      } catch (e2) {
        print('Second geocoding attempt failed: $e2');
      }
    }
    return null;
  }

  // Làm sạch địa chỉ để tăng khả năng geocoding thành công
  String _cleanAddress(String address) {
    return address
        .replaceAll(RegExp(r'[^\w\s,.-]'), '') // Loại bỏ ký tự đặc biệt
        .replaceAll(RegExp(r'\s+'), ' ') // Normalize spaces
        .trim() + ', Ho Chi Minh City, Vietnam';
  }

  // Tọa độ fallback dựa trên địa chỉ hoặc tên khách sạn
  LatLng _getFallbackCoordinates() {
    String address = widget.hotel.diaChi.toLowerCase();
    String hotelName = widget.hotel.tenKhachSan.toLowerCase();

    print('🔍 Tìm fallback coordinates cho: $address');

    // Map các thành phố lớn ở Việt Nam
    Map<String, LatLng> cityMap = {
      // Đà Nẵng
      'đà nẵng': LatLng(16.0544, 108.2022),
      'da nang': LatLng(16.0544, 108.2022),
      'ngũ hành sơn': LatLng(16.0021, 108.2533),
      'sơn trà': LatLng(16.0899, 108.2623),
      'hải châu': LatLng(16.0678, 108.2208),
      'thanh khê': LatLng(16.0678, 108.1516),
      'liên chiểu': LatLng(16.0678, 108.1516),
      'cẩm lệ': LatLng(16.0292, 108.2114),
      'hòa vang': LatLng(15.9741, 108.1291),
      'võ nguyên giáp': LatLng(16.0021, 108.2533), // Đường ven biển Đà Nẵng

      // TP.HCM
      'tp.hcm': LatLng(10.7769, 106.7009),
      'hồ chí minh': LatLng(10.7769, 106.7009),
      'ho chi minh': LatLng(10.7769, 106.7009),
      'sài gòn': LatLng(10.7769, 106.7009),
      'saigon': LatLng(10.7769, 106.7009),
      'quận 1': LatLng(10.7769, 106.7009),
      'quận 2': LatLng(10.7879, 106.7316),
      'quận 3': LatLng(10.7756, 106.6854),
      'quận 4': LatLng(10.7574, 106.7032),
      'quận 5': LatLng(10.7593, 106.6741),
      'quận 7': LatLng(10.7379, 106.7191),
      'quận 10': LatLng(10.7726, 106.6696),
      'thủ đức': LatLng(10.8455, 106.7635),
      'bình thạnh': LatLng(10.8017, 106.7009),

      // Hà Nội
      'hà nội': LatLng(21.0285, 105.8542),
      'ha noi': LatLng(21.0285, 105.8542),
      'hanoi': LatLng(21.0285, 105.8542),
      'hoàn kiếm': LatLng(21.0285, 105.8542),
      'ba đình': LatLng(21.0356, 105.8189),
      'cầu giấy': LatLng(21.0374, 105.7980),

      // Hải Phòng
      'hải phòng': LatLng(20.8449, 106.6881),
      'hai phong': LatLng(20.8449, 106.6881),

      // Nha Trang
      'nha trang': LatLng(12.2388, 109.1967),
      'khánh hòa': LatLng(12.2388, 109.1967),

      // Vũng Tàu
      'vũng tàu': LatLng(10.4113, 107.1365),
      'vung tau': LatLng(10.4113, 107.1365),

      // Phú Quốc
      'phú quốc': LatLng(10.2899, 103.9840),
      'phu quoc': LatLng(10.2899, 103.9840),

      // Đường phổ biến ở TP.HCM
      'nguyễn huệ': LatLng(10.7769, 106.7009),
      'đồng khởi': LatLng(10.7756, 106.7019),
      'lê lai': LatLng(10.7698, 106.6953),
      'trần hưng đạo': LatLng(10.7694, 106.6917),
      'pasteur': LatLng(10.7824, 106.6989),
      'hai bà trưng': LatLng(10.7707, 106.7049),

      // Khách sạn nổi tiếng
      'rex': LatLng(10.7769, 106.7009),
      'continental': LatLng(10.7756, 106.7019),
      'sheraton': LatLng(10.7735, 106.7035),
      'pullman': LatLng(10.7694, 106.6917),
      'grand': LatLng(10.7707, 106.7049),
      'renaissance': LatLng(10.7766, 106.7034),
      'park hyatt': LatLng(10.7735, 106.7035),
      'intercontinental': LatLng(16.0544, 108.2022), // Đà Nẵng
      'vinpearl': LatLng(12.2388, 109.1967), // Nha Trang
    };

    // Tìm tọa độ dựa trên địa chỉ (ưu tiên thành phố trước)
    for (String key in cityMap.keys) {
      if (address.contains(key) || hotelName.contains(key)) {
        print('✅ Tìm thấy fallback: $key -> ${cityMap[key]}');
        return cityMap[key]!;
      }
    }

    print('⚠️ Không tìm thấy fallback phù hợp, dùng trung tâm Việt Nam');
    // Default: Trung tâm Việt Nam (Huế)
    return LatLng(16.4637, 107.5909);
  }

  Future<void> _getCurrentLocation() async {
    try {
      print('📱 Bắt đầu lấy vị trí hiện tại của người dùng...');

      bool serviceEnabled = await location.serviceEnabled();
      if (!serviceEnabled) {
        print('⚠️ Location service chưa bật, yêu cầu bật...');
        serviceEnabled = await location.requestService();
        if (!serviceEnabled) {
          print('❌ Người dùng từ chối bật location service');
          setState(() => _isLoadingLocation = false);
          return;
        }
      }

      LocationService.PermissionStatus permissionGranted = await location.hasPermission();
      if (permissionGranted == LocationService.PermissionStatus.denied) {
        print('⚠️ Chưa có permission, yêu cầu permission...');
        permissionGranted = await location.requestPermission();
        if (permissionGranted != LocationService.PermissionStatus.granted) {
          print('❌ Người dùng từ chối cấp permission');
          setState(() => _isLoadingLocation = false);
          return;
        }
      }

      LocationService.LocationData locationData = await location.getLocation();

      // Debug chi tiết về location data
      print('✅ Location data nhận được:');
      print('📍 Latitude: ${locationData.latitude}');
      print('📍 Longitude: ${locationData.longitude}');
      print('📍 Accuracy: ${locationData.accuracy}m');
      print('📍 Altitude: ${locationData.altitude}m');
      print('📍 Speed: ${locationData.speed}m/s');
      print('📍 Timestamp: ${DateTime.now()}');

      // Kiểm tra xem có phải tọa độ mặc định của emulator không
      if (locationData.latitude == 37.4219999 && locationData.longitude == -122.0840575) {
        print('🤖 [EMULATOR DETECTED] Đang dùng tọa độ mặc định của Android Emulator (California)');
        print('💡 [TIP] Hãy set location trên emulator hoặc test trên device thật');
      }

      // Kiểm tra tọa độ có hợp lệ cho Việt Nam không
      if (locationData.latitude != null && locationData.longitude != null) {
        if (locationData.latitude! < 8.0 || locationData.latitude! > 24.0 ||
            locationData.longitude! < 102.0 || locationData.longitude! > 110.0) {
          print('⚠️ [WARNING] Tọa độ không nằm trong Việt Nam');
          print('⚠️ [WARNING] Có thể cần set mock location cho emulator');
        }
      }

      setState(() {
        _currentLocation = locationData;
        _isLoadingLocation = false;
      });
    } catch (e) {
      print('❌ Error getting current location: $e');
      setState(() => _isLoadingLocation = false);
    }
  }

  void _centerOnHotel() {
    if (_hotelLocation != null) {
      _mapController.move(_hotelLocation!, 16.0);
    }
  }

  void _centerOnCurrentLocation() {
    if (_currentLocation != null) {
      _mapController.move(
        LatLng(_currentLocation!.latitude!, _currentLocation!.longitude!),
        16.0,
      );
    }
  }

  double _calculateDistance() {
    if (_currentLocation == null || _hotelLocation == null) return 0;

    final currentLatLng = LatLng(_currentLocation!.latitude!, _currentLocation!.longitude!);
    final hotelLatLng = _hotelLocation!;

    // Debug logs để kiểm tra tọa độ
    print('📍 [DISTANCE DEBUG]');
    print('📍 Vị trí hiện tại: ${currentLatLng.latitude}, ${currentLatLng.longitude}');
    print('📍 Vị trí khách sạn: ${hotelLatLng.latitude}, ${hotelLatLng.longitude}');

    // Kiểm tra tọa độ có hợp lệ cho Việt Nam không
    bool isValidVietnamCoordinate(LatLng coord) {
      // Việt Nam: Latitude 8°-24°N, Longitude 102°-110°E
      return coord.latitude >= 8.0 && coord.latitude <= 24.0 &&
          coord.longitude >= 102.0 && coord.longitude <= 110.0;
    }

    if (!isValidVietnamCoordinate(currentLatLng)) {
      print('⚠️ [WARNING] Vị trí hiện tại không hợp lệ cho Việt Nam: ${currentLatLng.latitude}, ${currentLatLng.longitude}');
      print('⚠️ [WARNING] Có thể đang dùng vị trí mặc định của emulator');
    }

    if (!isValidVietnamCoordinate(hotelLatLng)) {
      print('⚠️ [WARNING] Vị trí khách sạn không hợp lệ cho Việt Nam: ${hotelLatLng.latitude}, ${hotelLatLng.longitude}');
    }

    const Distance distance = Distance();
    final calculatedDistance = distance.as(
      LengthUnit.Kilometer,
      currentLatLng,
      hotelLatLng,
    );

    print('📍 Khoảng cách tính được: ${calculatedDistance.toStringAsFixed(2)} km');

    // Validation: Khoảng cách trong Việt Nam không thể > 2000km
    if (calculatedDistance > 2000) {
      print('❌ [ERROR] Khoảng cách quá lớn (${calculatedDistance.toStringAsFixed(2)} km)');
      print('❌ [ERROR] Có thể một trong hai tọa độ bị sai');
      return 0; // Trả về 0 thay vì số vô lý
    }

    return calculatedDistance;
  }

  // Thêm hàm helper để format khoảng cách
  String _formatDistance(double distanceKm) {
    if (distanceKm == 0) {
      return 'Không xác định được khoảng cách';
    } else if (distanceKm < 1) {
      return '${(distanceKm * 1000).toStringAsFixed(0)} m';
    } else if (distanceKm < 100) {
      return '${distanceKm.toStringAsFixed(1)} km';
    } else {
      return '${distanceKm.toStringAsFixed(0)} km';
    }
  }

  @override
  Widget build(BuildContext context) {
    // Hiển thị loading khi đang tìm vị trí khách sạn
    if (_isLoadingHotelLocation) {
      return Scaffold(
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 1,
          leading: IconButton(
            icon: Icon(Icons.arrow_back, color: Colors.black),
            onPressed: () => Navigator.pop(context),
          ),
          title: Text(
            S.of(context).locationHotel,
            style: TextStyle(
              color: Colors.black,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text(S.of(context).findingLocationHotel),
              SizedBox(height: 8),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  widget.hotel.diaChi,
                  style: TextStyle(color: Colors.grey[600]),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          S.of(context).locationHotel,
          style: TextStyle(
            color: Colors.black,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.my_location, color: Colors.blue),
            onPressed: _centerOnCurrentLocation,
            tooltip: S.of(context).myLocation,
          ),
        ],
      ),
      body: Stack(
        children: [
          // Flutter Map
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _mapCenter,
              initialZoom: 14.0,
              minZoom: 5.0,
              maxZoom: 18.0,
              keepAlive: true,
            ),
            children: [
              // Tile Layer (OpenStreetMap)
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.example.hotel_booking_app',
                tileSize: 256,
              ),

              // Markers Layer
              if (_hotelLocation != null)
                MarkerLayer(
                  markers: [
                    // 🏨 Hotel Marker - MARKER ĐỎ CHO KHÁCH SẠN
                    Marker(
                      point: _hotelLocation!,
                      width: 60,
                      height: 60,
                      child: GestureDetector(
                        onTap: () => _showHotelInfo(),
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.3),
                                blurRadius: 6,
                                offset: Offset(0, 3),
                              ),
                            ],
                          ),
                          child: Icon(
                            FontAwesomeIcons.bed,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                      ),
                    ),

                    // 👤 Current Location Marker - MARKER XANH CHO VỊ TRÍ NGƯỜI DÙNG
                    if (_currentLocation != null)
                      Marker(
                        point: LatLng(
                          _currentLocation!.latitude!,
                          _currentLocation!.longitude!,
                        ),
                        width: 40,
                        height: 40,
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.blue,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 3),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.2),
                                blurRadius: 4,
                                offset: Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Icon(
                            Icons.person,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                      ),
                  ],
                ),
            ],
          ),

          // Error notification
          if (_locationError.isNotEmpty)
            Positioned(
              top: 100,
              left: 20,
              right: 20,
              child: Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange[100],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orange[300]!),
                ),
                child: Row(
                  children: [
                    Icon(Icons.warning, color: Colors.orange[700], size: 20),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _locationError,
                        style: TextStyle(
                          color: Colors.orange[800],
                          fontSize: 12,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.close, size: 16),
                      onPressed: () => setState(() => _locationError = ''),
                      color: Colors.orange[700],
                    ),
                  ],
                ),
              ),
            ),

          // Loading indicator
          if (_isLoadingLocation)
            Positioned(
              top: _locationError.isNotEmpty ? 160 : 100,
              left: 20,
              right: 20,
              child: Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 4,
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    SizedBox(width: 12),
                    Text(S.of(context).findingYourLocation),
                  ],
                ),
              ),
            ),

          // Hotel Info Card - HIỂN THỊ THÔNG TIN KHÁCH SẠN
          Positioned(
            top: 20,
            left: 16,
            right: 16,
            child: Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Icon(
                          FontAwesomeIcons.bed,
                          color: Colors.white,
                          size: 12,
                        ),
                      ),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          widget.hotel.tenKhachSan,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.location_on, size: 16, color: Colors.grey),
                      SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          widget.hotel.diaChi,
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 14,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  if (_currentLocation != null && _hotelLocation != null) ...[
                    SizedBox(height: 8),
                    Row(
                      children: [
                        Container(
                          padding: EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: Colors.blue,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Icon(
                            Icons.person,
                            color: Colors.white,
                            size: 12,
                          ),
                        ),
                        SizedBox(width: 6),
                        Icon(FontAwesomeIcons.route, size: 14, color: Colors.blue),
                        SizedBox(width: 6),
                        Text(
                          '${S.of(context).yourDistance} ${_formatDistance(_calculateDistance())}',
                          style: TextStyle(
                            color: Colors.blue,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),

          // Zoom Controls
          Positioned(
            right: 16,
            bottom: 100,
            child: Column(
              children: [
                FloatingActionButton.small(
                  heroTag: "zoom_in",
                  onPressed: () {
                    final zoom = _mapController.camera.zoom;
                    _mapController.move(_mapController.camera.center, zoom + 1);
                  },
                  backgroundColor: Colors.white,
                  child: Icon(Icons.add, color: Colors.black),
                ),
                SizedBox(height: 8),
                FloatingActionButton.small(
                  heroTag: "zoom_out",
                  onPressed: () {
                    final zoom = _mapController.camera.zoom;
                    _mapController.move(_mapController.camera.center, zoom - 1);
                  },
                  backgroundColor: Colors.white,
                  child: Icon(Icons.remove, color: Colors.black),
                ),
              ],
            ),
          ),

          // Center on Hotel Button
          Positioned(
            left: 16,
            bottom: 30,
            child: FloatingActionButton.extended(
              onPressed: _centerOnHotel,
              backgroundColor: Colors.red,
              icon: Icon(FontAwesomeIcons.bed, color: Colors.white, size: 16),
              label: Text(
                S.of(context).seeHotels,
                style: TextStyle(color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showHotelInfo() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            SizedBox(height: 16),
            Text(
              widget.hotel.tenKhachSan,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.location_on, color: Colors.red, size: 16),
                SizedBox(width: 4),
                Expanded(
                  child: Text(
                    widget.hotel.diaChi,
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ),
              ],
            ),
            if (_currentLocation != null) ...[
              SizedBox(height: 12),
              Row(
                children: [
                  Icon(FontAwesomeIcons.route, size: 14, color: Colors.blue),
                  SizedBox(width: 6),
                  Text(
                    '${S.of(context).distance}: ${_formatDistance(_calculateDistance())}',
                    style: TextStyle(
                      color: Colors.blue,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ],
            SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  Navigator.pop(context); // Return to detail screen
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  padding: EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: Text(
                  S.of(context).backDetailHotel,
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}