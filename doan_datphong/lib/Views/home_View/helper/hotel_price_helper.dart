import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../Helper/FormatCurrency.dart';
import '../../../Models/LoaiPhong.dart';
import '../../../generated/l10n.dart';


class HotelPriceHelper {

  /// Lấy giá hiển thị với đơn vị từ LoaiPhong
  static String getPriceWithUnit(BuildContext context, LoaiPhong loaiPhong) {
    // Ưu tiên giaCuoiCung, fallback về giaMoiDonVi, cuối cùng là giaCa
    final price = loaiPhong.giaCuoiCung > 0
        ? loaiPhong.giaCuoiCung
        : (loaiPhong.giaMoiDonVi > 0 ? loaiPhong.giaMoiDonVi : loaiPhong.giaCa);

    final unitText = _getUnitText(context, loaiPhong.donVi);

    return "${S.of(context).from} ${CurrencyHelper.formatVND(price)}/$unitText";
  }

  /// Lấy giá starting từ (chỉ số tiền)
  static String getStartingPrice(BuildContext context, LoaiPhong loaiPhong) {
    final price = loaiPhong.giaCuoiCung > 0
        ? loaiPhong.giaCuoiCung
        : (loaiPhong.giaMoiDonVi > 0 ? loaiPhong.giaMoiDonVi : loaiPhong.giaCa);

    return "${S.of(context).from} ${CurrencyHelper.formatVND(price)}";
  }

  /// Lấy giá gốc nếu có khuyến mãi
  static String? getOriginalPrice(LoaiPhong loaiPhong) {
    // Kiểm tra nếu có giá khuyến mãi (giaCuoiCung < giaMoiDonVi hoặc giaCa)
    if (loaiPhong.giaCuoiCung > 0) {
      final originalPrice = loaiPhong.giaMoiDonVi > 0
          ? loaiPhong.giaMoiDonVi
          : loaiPhong.giaCa;

      if (loaiPhong.giaCuoiCung < originalPrice) {
        return CurrencyHelper.formatVND(originalPrice);
      }
    }
    return null;
  }

  /// Tính % giảm giá
  static String? getDiscountPercentage(LoaiPhong loaiPhong) {
    if (loaiPhong.giaCuoiCung > 0) {
      final originalPrice = loaiPhong.giaMoiDonVi > 0
          ? loaiPhong.giaMoiDonVi
          : loaiPhong.giaCa;

      if (loaiPhong.giaCuoiCung < originalPrice && originalPrice > 0) {
        final discount = ((originalPrice - loaiPhong.giaCuoiCung) / originalPrice) * 100;
        return "-${discount.round()}%";
      }
    }
    return null;
  }

  /// Lấy text đơn vị dựa trên ngôn ngữ
  static String _getUnitText(BuildContext context, String unit) {
    final locale = Localizations.localeOf(context);
    final isVietnamese = locale.languageCode == 'vi';

    switch (unit.toLowerCase()) {
      case 'đêm':
      case 'night':
      case 'dem':
        return isVietnamese ? 'đêm' : 'night';
      case 'giờ':
      case 'hour':
      case 'gio':
        return isVietnamese ? 'giờ' : 'hour';
      case 'ngày':
      case 'day':
      case 'ngay':
        return isVietnamese ? 'ngày' : 'day';
      default:
        return isVietnamese ? 'đêm' : 'night';
    }
  }

  /// Widget hiển thị giá với đơn vị - phiên bản đầy đủ
  static Widget buildFullPriceDisplay(BuildContext context, LoaiPhong loaiPhong, {
    TextStyle? priceStyle,
    TextStyle? unitStyle,
    TextStyle? originalPriceStyle,
    Color? priceColor,
    bool showDiscount = true,
    bool showFromText = true,
  }) {
    final price = loaiPhong.giaCuoiCung > 0
        ? loaiPhong.giaCuoiCung
        : (loaiPhong.giaMoiDonVi > 0 ? loaiPhong.giaMoiDonVi : loaiPhong.giaCa);

    final unitText = _getUnitText(context, loaiPhong.donVi);
    final originalPrice = getOriginalPrice(loaiPhong);
    final discountPercent = getDiscountPercentage(loaiPhong);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        // Giá gốc bị gạch (nếu có khuyến mãi)
        if (showDiscount && originalPrice != null) ...[
          Text(
            originalPrice,
            style: originalPriceStyle ?? const TextStyle(
              fontSize: 12,
              color: Colors.grey,
              decoration: TextDecoration.lineThrough,
            ),
          ),
          const SizedBox(height: 2),
        ],

        // Giá hiện tại với đơn vị
        Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            if (showFromText) ...[
              Text(
                "${S.of(context).from} ",
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.grey,
                ),
              ),
            ],
            Text(
              CurrencyHelper.formatVND(price),
              style: priceStyle ?? TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: priceColor ?? const Color(0xFF1565C0),
              ),
            ),
            Text(
              '/$unitText',
              style: unitStyle ?? const TextStyle(
                fontSize: 14,
                color: Color(0xFF525150),
              ),
            ),
          ],
        ),

        // Badge giảm giá
        if (showDiscount && discountPercent != null) ...[
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.red,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              discountPercent,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ],
    );
  }

  /// Widget giá compact cho danh sách/grid
  static Widget buildCompactPrice(BuildContext context, LoaiPhong loaiPhong, {
    bool showFromText = true,
    double fontSize = 16,
    Color? priceColor,
  }) {
    final price = loaiPhong.giaCuoiCung > 0
        ? loaiPhong.giaCuoiCung
        : (loaiPhong.giaMoiDonVi > 0 ? loaiPhong.giaMoiDonVi : loaiPhong.giaCa);

    final unitText = _getUnitText(context, loaiPhong.donVi);

    return RichText(
      text: TextSpan(
        style: DefaultTextStyle.of(context).style,
        children: [
          if (showFromText)
            TextSpan(
              text: "${S.of(context).from} ",
              style: TextStyle(
                fontSize: fontSize * 0.75,
                color: Colors.grey,
              ),
            ),
          TextSpan(
            text: CurrencyHelper.formatVND(price),
            style: TextStyle(
              fontSize: fontSize,
              fontWeight: FontWeight.bold,
              color: priceColor ?? const Color(0xFF1565C0),
            ),
          ),
          TextSpan(
            text: "/$unitText",
            style: TextStyle(
              fontSize: fontSize * 0.8,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  /// Widget giá với discount badge inline
  static Widget buildPriceWithDiscount(BuildContext context, LoaiPhong loaiPhong, {
    double fontSize = 16,
    bool showFromText = true,
  }) {
    final price = loaiPhong.giaCuoiCung > 0
        ? loaiPhong.giaCuoiCung
        : (loaiPhong.giaMoiDonVi > 0 ? loaiPhong.giaMoiDonVi : loaiPhong.giaCa);

    final unitText = _getUnitText(context, loaiPhong.donVi);
    final originalPrice = getOriginalPrice(loaiPhong);
    final discountPercent = getDiscountPercentage(loaiPhong);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Giá hiện tại
        RichText(
          text: TextSpan(
            style: DefaultTextStyle.of(context).style,
            children: [
              if (showFromText)
                TextSpan(
                  text: "${S.of(context).from} ",
                  style: TextStyle(
                    fontSize: fontSize * 0.75,
                    color: Colors.grey,
                  ),
                ),
              TextSpan(
                text: CurrencyHelper.formatVND(price),
                style: TextStyle(
                  fontSize: fontSize,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF1565C0),
                ),
              ),
              TextSpan(
                text: "/$unitText",
                style: TextStyle(
                  fontSize: fontSize * 0.8,
                  color: Colors.grey,
                ),
              ),
            ],
          ),
        ),

        // Discount badge
        if (discountPercent != null) ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.red,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              discountPercent,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ],
    );
  }

  /// Lấy thông tin giá cho trang chủ
  static Map<String, dynamic> getPriceInfo(BuildContext context, LoaiPhong loaiPhong) {
    final currentPrice = loaiPhong.giaCuoiCung > 0
        ? loaiPhong.giaCuoiCung
        : (loaiPhong.giaMoiDonVi > 0 ? loaiPhong.giaMoiDonVi : loaiPhong.giaCa);

    return {
      'currentPrice': currentPrice,
      'formattedPrice': CurrencyHelper.formatVND(currentPrice),
      'originalPrice': getOriginalPrice(loaiPhong),
      'discountPercent': getDiscountPercentage(loaiPhong),
      'unit': _getUnitText(context, loaiPhong.donVi),
      'fullText': getPriceWithUnit(context, loaiPhong),
      'hasDiscount': getDiscountPercentage(loaiPhong) != null,
    };
  }
}