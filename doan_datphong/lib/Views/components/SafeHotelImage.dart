// lib/Views/components/SafeHotelImage.dart - NO NEW DEPENDENCIES
import 'package:flutter/material.dart';

class SafeHotelImage extends StatelessWidget {
  final String imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;

  const SafeHotelImage({
    Key? key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    print("🖼️ SafeHotelImage loading: $imageUrl");

    // ✅ Kiểm tra URL có hợp lệ không
    if (imageUrl.isEmpty || !_isValidUrl(imageUrl)) {
      print("❌ Invalid URL: $imageUrl");
      return _buildErrorWidget();
    }

    // ✅ Sử dụng Image.network với cache busting và proper headers
    Widget imageWidget = Image.network(
      _addCacheBuster(imageUrl), // ✅ Add timestamp để force reload
      width: width,
      height: height,
      fit: fit,
      headers: {
        'User-Agent': 'Flutter-App/1.0',
        'ngrok-skip-browser-warning': 'true', // ✅ Quan trọng cho ngrok
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      loadingBuilder: (context, child, loadingProgress) {
        if (loadingProgress == null) {
          print("✅ Image loaded: $imageUrl");
          return child;
        }

        return _buildLoadingWidget(loadingProgress);
      },
      errorBuilder: (context, error, stackTrace) {
        print("❌ Image load failed: $imageUrl");
        print("❌ Error: $error");
        return _buildErrorWidget();
      },
    );

    // ✅ Apply border radius if specified
    if (borderRadius != null) {
      return ClipRRect(
        borderRadius: borderRadius!,
        child: imageWidget,
      );
    }

    return imageWidget;
  }

  // ✅ Add cache buster to URL
  String _addCacheBuster(String url) {
    final separator = url.contains('?') ? '&' : '?';
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    return '$url${separator}v=$timestamp';
  }

  // ✅ Validate URL format
  bool _isValidUrl(String url) {
    try {
      final uri = Uri.parse(url);
      return uri.hasScheme &&
          (uri.scheme == 'http' || uri.scheme == 'https') &&
          uri.host.isNotEmpty;
    } catch (e) {
      return false;
    }
  }

  // ✅ Loading widget
  Widget _buildLoadingWidget(ImageChunkEvent loadingProgress) {
    final progress = loadingProgress.cumulativeBytesLoaded /
        (loadingProgress.expectedTotalBytes ?? 1);

    return Container(
      width: width,
      height: height,
      color: Colors.grey[100],
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                value: progress.isFinite ? progress : null,
                strokeWidth: 2,
                backgroundColor: Colors.grey[300],
                valueColor: AlwaysStoppedAnimation<Color>(Colors.blue),
              ),
            ),
            if (height == null || height! > 60) ...[
              SizedBox(height: 8),
              Text(
                'Đang tải...',
                style: TextStyle(
                  fontSize: 8,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // ✅ Error widget
  Widget _buildErrorWidget() {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: borderRadius,
        border: Border.all(color: Colors.grey[300]!, width: 1),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.broken_image,
            size: (height != null && height! < 100) ? 20 : 40,
            color: Colors.grey[400],
          ),
          if (height == null || height! > 60) ...[
            SizedBox(height: 4),
            Text(
              'Không thể tải hình',
              style: TextStyle(
                fontSize: 8,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }
}

// ✅ BONUS: Fallback Image Widget with retry
class FallbackSafeImage extends StatefulWidget {
  final String imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;

  const FallbackSafeImage({
    Key? key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
  }) : super(key: key);

  @override
  _FallbackSafeImageState createState() => _FallbackSafeImageState();
}

class _FallbackSafeImageState extends State<FallbackSafeImage> {
  int _retryCount = 0;
  final int _maxRetries = 2;
  late String _currentUrl;

  @override
  void initState() {
    super.initState();
    _currentUrl = widget.imageUrl;
  }

  void _retry() {
    if (_retryCount < _maxRetries) {
      setState(() {
        _retryCount++;
        // Add different cache buster for retry
        final separator = widget.imageUrl.contains('?') ? '&' : '?';
        _currentUrl = '${widget.imageUrl}${separator}retry=$_retryCount&t=${DateTime.now().millisecondsSinceEpoch}';
      });
      print("🔄 Retry attempt $_retryCount for image: $_currentUrl");
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.imageUrl.isEmpty) {
      return _buildErrorWidget();
    }

    return Image.network(
      _currentUrl,
      width: widget.width,
      height: widget.height,
      fit: widget.fit,
      headers: {
        'User-Agent': 'Flutter-App/1.0',
        'ngrok-skip-browser-warning': 'true',
        'Cache-Control': 'no-cache',
      },
      loadingBuilder: (context, child, loadingProgress) {
        if (loadingProgress == null) return child;

        return Container(
          width: widget.width,
          height: widget.height,
          color: Colors.grey[100],
          child: Center(
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        );
      },
      errorBuilder: (context, error, stackTrace) {
        print("❌ Image error (attempt ${_retryCount + 1}): $error");

        if (_retryCount < _maxRetries) {
          // Auto retry after short delay
          Future.delayed(Duration(milliseconds: 500), () {
            if (mounted) _retry();
          });

          return Container(
            width: widget.width,
            height: widget.height,
            color: Colors.grey[100],
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Thử lại ${_retryCount + 1}/$_maxRetries',
                    style: TextStyle(fontSize: 8, color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
          );
        }

        return _buildErrorWidget();
      },
    );
  }

  Widget _buildErrorWidget() {
    return Container(
      width: widget.width,
      height: widget.height,
      color: Colors.grey[200],
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error, color: Colors.red[300], size: 20),
          SizedBox(height: 4),
          Text(
            'Lỗi tải hình',
            style: TextStyle(fontSize: 8, color: Colors.red[400]),
          ),
        ],
      ),
    );
  }
}