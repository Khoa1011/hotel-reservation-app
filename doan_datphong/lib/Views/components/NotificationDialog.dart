import 'package:flutter/material.dart';
import 'package:doan_datphong/generated/l10n.dart';


enum NotificationType {
  success,
  error,
  warning,
  info,
}


class NotificationDialog {
  static void show(
      BuildContext context, {
        required NotificationType type,
        required String title,
        required String message,
        String? buttonText,
        VoidCallback? onButtonPressed,
        bool barrierDismissible = true,
      }) {
    showDialog(
      context: context,
      barrierDismissible: barrierDismissible,
      builder: (BuildContext context) {
        return _NotificationDialogWidget(
          type: type,
          title: title,
          message: message,
          buttonText: buttonText,
          onButtonPressed: onButtonPressed,
        );
      },
    );
  }

  // 🆕 Method mới cho booking confirmation
  static void showBookingConfirmation(
      BuildContext context, {
        required String roomTypeName,
        required String price,
        required String dates,
        required String guests,
        required String rooms,
        required VoidCallback onConfirm,
        VoidCallback? onCancel,
      }) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return _BookingConfirmationDialog(
          roomTypeName: roomTypeName,
          price: price,
          dates: dates,
          guests: guests,
          rooms: rooms,
          onConfirm: onConfirm,
          onCancel: onCancel,
        );
      },
    );
  }

  // Shortcut methods for different types
  static void showSuccess(
      BuildContext context, {
        String? title,
        required String message,
        String? buttonText,
        VoidCallback? onButtonPressed,
      }) {
    show(
      context,
      type: NotificationType.success,
      title: title ?? S.of(context).successful,
      message: message,
      buttonText: buttonText ?? 'OK',
      onButtonPressed: onButtonPressed,
    );
  }

  static void showError(
      BuildContext context, {
        String? title,
        required String message,
        String? buttonText,
        VoidCallback? onButtonPressed,
      }) {
    show(
      context,
      type: NotificationType.error,
      title: title ?? S.of(context).error,
      message: message,
      buttonText: buttonText ?? 'OK',
      onButtonPressed: onButtonPressed,
    );
  }

  static void showWarning(
      BuildContext context, {
        String? title,
        required String message,
        String? buttonText,
        VoidCallback? onButtonPressed,
      }) {
    show(
      context,
      type: NotificationType.warning,
      title: title ?? S.of(context).warning,
      message: message,
      buttonText: buttonText ?? 'OK',
      onButtonPressed: onButtonPressed,
    );
  }

  static void showInfo(
      BuildContext context, {
        String? title,
        required String message,
        String? buttonText,
        VoidCallback? onButtonPressed,
      }) {
    show(
      context,
      type: NotificationType.info,
      title: title ?? S.of(context).information,
      message: message,
      buttonText: buttonText ?? 'OK',
      onButtonPressed: onButtonPressed,
    );
  }
}

class _NotificationDialogWidget extends StatefulWidget {
  final NotificationType type;
  final String title;
  final String message;
  final String? buttonText;
  final VoidCallback? onButtonPressed;

  const _NotificationDialogWidget({
    required this.type,
    required this.title,
    required this.message,
    this.buttonText,
    this.onButtonPressed,
  });

  @override
  _NotificationDialogWidgetState createState() => _NotificationDialogWidgetState();
}

class _NotificationDialogWidgetState extends State<_NotificationDialogWidget>
    with TickerProviderStateMixin {
  late AnimationController _scaleController;
  late AnimationController _iconController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _iconAnimation;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      duration: Duration(milliseconds: 300),
      vsync: this,
    );
    _iconController = AnimationController(
      duration: Duration(milliseconds: 500),
      vsync: this,
    );

    _scaleAnimation = CurvedAnimation(
      parent: _scaleController,
      curve: Curves.elasticOut,
    );
    _iconAnimation = CurvedAnimation(
      parent: _iconController,
      curve: Curves.bounceOut,
    );

    _scaleController.forward();
    Future.delayed(Duration(milliseconds: 200), () {
      _iconController.forward();
    });
  }

  @override
  void dispose() {
    _scaleController.dispose();
    _iconController.dispose();
    super.dispose();
  }

  Color _getColor() {
    switch (widget.type) {
      case NotificationType.success:
        return Color(0xFF4CAF50);
      case NotificationType.error:
        return Color(0xFFF44336);
      case NotificationType.warning:
        return Color(0xFFFF9800);
      case NotificationType.info:
        return Color(0xFF2196F3);
    }
  }

  IconData _getIcon() {
    switch (widget.type) {
      case NotificationType.success:
        return Icons.check;
      case NotificationType.error:
        return Icons.close;
      case NotificationType.warning:
        return Icons.warning;
      case NotificationType.info:
        return Icons.info;
    }
  }

  List<Widget> _buildFloatingDots() {
    final color = _getColor().withOpacity(0.3);
    return [
      // Top left
      Positioned(
        top: 20,
        left: 30,
        child: _FloatingDot(color: color, size: 8, delay: 0),
      ),
      // Top right
      Positioned(
        top: 40,
        right: 40,
        child: _FloatingDot(color: color, size: 12, delay: 200),
      ),
      // Middle left
      Positioned(
        top: 100,
        left: 20,
        child: _FloatingDot(color: color, size: 6, delay: 400),
      ),
      // Middle right
      Positioned(
        top: 120,
        right: 30,
        child: _FloatingDot(color: color, size: 10, delay: 600),
      ),
      // Bottom left
      Positioned(
        bottom: 80,
        left: 40,
        child: _FloatingDot(color: color, size: 8, delay: 800),
      ),
      // Bottom right
      Positioned(
        bottom: 100,
        right: 20,
        child: _FloatingDot(color: color, size: 14, delay: 1000),
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          width: 320,
          padding: EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 20,
                offset: Offset(0, 10),
              ),
            ],
          ),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              // Floating dots
              ..._buildFloatingDots(),

              // Main content
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(height: 20),

                  // Animated icon circle
                  ScaleTransition(
                    scale: _iconAnimation,
                    child: Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: _getColor(),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: _getColor().withOpacity(0.3),
                            blurRadius: 20,
                            offset: Offset(0, 5),
                          ),
                        ],
                      ),
                      child: Icon(
                        _getIcon(),
                        color: Colors.white,
                        size: 40,
                      ),
                    ),
                  ),

                  SizedBox(height: 24),

                  // Title
                  Text(
                    widget.title,
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: _getColor(),
                    ),
                    textAlign: TextAlign.center,
                  ),

                  SizedBox(height: 12),

                  // Message
                  Text(
                    widget.message,
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey[600],
                      height: 1.4,
                    ),
                    textAlign: TextAlign.center,
                  ),

                  SizedBox(height: 32),

                  // Button
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).pop();
                        if (widget.onButtonPressed != null) {
                          widget.onButtonPressed!();
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _getColor(),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(25),
                        ),
                      ),
                      child: Text(
                        widget.buttonText ?? 'OK',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FloatingDot extends StatefulWidget {
  final Color color;
  final double size;
  final int delay;

  const _FloatingDot({
    required this.color,
    required this.size,
    required this.delay,
  });

  @override
  _FloatingDotState createState() => _FloatingDotState();
}

class _FloatingDotState extends State<_FloatingDot>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: Duration(milliseconds: 1500),
      vsync: this,
    );
    _animation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) {
        _controller.repeat(reverse: true);
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Transform.scale(
          scale: 0.5 + (_animation.value * 0.5),
          child: Container(
            width: widget.size,
            height: widget.size,
            decoration: BoxDecoration(
              color: widget.color,
              shape: BoxShape.circle,
            ),
          ),
        );
      },
    );
  }
}

// 🆕 Class mới cho booking confirmation - KHÔNG thay đổi UI cũ
class _BookingConfirmationDialog extends StatefulWidget {
  final String roomTypeName;
  final String price;
  final String dates;
  final String guests;
  final String rooms;
  final VoidCallback onConfirm;
  final VoidCallback? onCancel;

  const _BookingConfirmationDialog({
    required this.roomTypeName,
    required this.price,
    required this.dates,
    required this.guests,
    required this.rooms,
    required this.onConfirm,
    this.onCancel,
  });

  @override
  _BookingConfirmationDialogState createState() => _BookingConfirmationDialogState();
}

class _BookingConfirmationDialogState extends State<_BookingConfirmationDialog>
    with TickerProviderStateMixin {
  late AnimationController _scaleController;
  late AnimationController _iconController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _iconAnimation;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      duration: Duration(milliseconds: 300),
      vsync: this,
    );
    _iconController = AnimationController(
      duration: Duration(milliseconds: 500),
      vsync: this,
    );

    _scaleAnimation = CurvedAnimation(
      parent: _scaleController,
      curve: Curves.elasticOut,
    );
    _iconAnimation = CurvedAnimation(
      parent: _iconController,
      curve: Curves.bounceOut,
    );

    _scaleController.forward();
    Future.delayed(Duration(milliseconds: 200), () {
      _iconController.forward();
    });
  }

  @override
  void dispose() {
    _scaleController.dispose();
    _iconController.dispose();
    super.dispose();
  }

  List<Widget> _buildFloatingDots() {
    final color = Color(0xFF2196F3).withOpacity(0.3); // Blue color for booking
    return [
      // Top left
      Positioned(
        top: 20,
        left: 30,
        child: _FloatingDot(color: color, size: 8, delay: 0),
      ),
      // Top right
      Positioned(
        top: 40,
        right: 40,
        child: _FloatingDot(color: color, size: 12, delay: 200),
      ),
      // Middle left
      Positioned(
        top: 120,
        left: 20,
        child: _FloatingDot(color: color, size: 6, delay: 400),
      ),
      // Middle right
      Positioned(
        top: 140,
        right: 30,
        child: _FloatingDot(color: color, size: 10, delay: 600),
      ),
      // Bottom left
      Positioned(
        bottom: 120,
        left: 40,
        child: _FloatingDot(color: color, size: 8, delay: 800),
      ),
      // Bottom right
      Positioned(
        bottom: 140,
        right: 20,
        child: _FloatingDot(color: color, size: 14, delay: 1000),
      ),
    ];
  }

  Widget _buildInfoRow(String label, String value, IconData icon) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Color(0xFF2196F3).withOpacity(0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(
              icon,
              size: 20,
              color: Color(0xFF2196F3),
            ),
          ),
          SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey[700],
                    fontWeight: FontWeight.w500,
                  ),
                ),
                SizedBox(height: 1),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 15,
                    color: Colors.grey[800],
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          width: 360,
          padding: EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 20,
                offset: Offset(0, 10),
              ),
            ],
          ),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              // Floating dots
              ..._buildFloatingDots(),

              // Main content
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(height: 20),

                  // Animated icon circle
                  ScaleTransition(
                    scale: _iconAnimation,
                    child: Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: Color(0xFF2196F3),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Color(0xFF2196F3).withOpacity(0.3),
                            blurRadius: 20,
                            offset: Offset(0, 5),
                          ),
                        ],
                      ),
                      child: Icon(
                        Icons.hotel,
                        color: Colors.white,
                        size: 40,
                      ),
                    ),
                  ),

                  SizedBox(height: 24),

                  // Title
                  Text(
                    S.of(context).bookingConfirm,
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF2196F3),
                    ),
                    textAlign: TextAlign.center,
                  ),

                  SizedBox(height: 6),

                  // Subtitle
                  Text(
                   S.of(context).pleaseCheckYourBookingInfo,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                    textAlign: TextAlign.center,
                  ),

                  SizedBox(height: 20),

                  // Booking details container
                  Container(
                    padding: EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.grey[50],
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.grey[200]!),
                    ),
                    child: Column(
                      children: [
                        _buildInfoRow(S.of(context).roomType, widget.roomTypeName, Icons.bed),
                        _buildInfoRow(S.of(context).price, widget.price, Icons.attach_money),
                        _buildInfoRow(S.of(context).duration, widget.dates, Icons.calendar_today),
                        _buildInfoRow(S.of(context).totalGuests, widget.guests, Icons.people),
                        _buildInfoRow(S.of(context).totalRooms, widget.rooms, Icons.door_front_door),
                      ],
                    ),
                  ),

                  SizedBox(height: 24),

                  // Buttons
                  Row(
                    children: [
                      // Cancel button
                      Expanded(
                        child: SizedBox(
                          height: 44,
                          child: OutlinedButton(
                            onPressed: () {
                              Navigator.of(context).pop();
                              if (widget.onCancel != null) {
                                widget.onCancel!();
                              }
                            },
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.grey[600],
                              side: BorderSide(color: Colors.grey[300]!),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(22),
                              ),
                            ),
                            child: Text(
                              S.of(context).cancel,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ),

                      SizedBox(width: 7),

                      // Confirm button
                      Expanded(
                        flex: 1,
                        child: SizedBox(
                          height: 44,
                          child: ElevatedButton(
                            onPressed: () {
                              Navigator.of(context).pop();
                              widget.onConfirm();
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Color(0xFF2196F3),
                              foregroundColor: Colors.white,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(22),
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.check, size: 20),
                                SizedBox(width: 6),
                                Flexible(
                                  child: Text(
                                    S.of(context).confirm,
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
