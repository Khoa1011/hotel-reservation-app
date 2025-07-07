abstract class BookingCheckState {}

class BookingCheckInitial extends BookingCheckState {}

class BookingCheckLoading extends BookingCheckState {}

// User ban status result
class UserBanStatusLoaded extends BookingCheckState {
  final bool isBannedFromCash;
  final int noShowCount;
  final DateTime? banDate;
  final bool canPayCash;
  final List<dynamic> noShowHistory;

  UserBanStatusLoaded({
    required this.isBannedFromCash,
    required this.noShowCount,
    this.banDate,
    required this.canPayCash,
    required this.noShowHistory,
  });
}

// Overdue check completed
class OverdueCheckCompleted extends BookingCheckState {
  final String message;
  final String timestamp;

  OverdueCheckCompleted({
    required this.message,
    required this.timestamp,
  });
}

class BookingCheckError extends BookingCheckState {
  final String errorMessage;

  BookingCheckError(this.errorMessage);
}