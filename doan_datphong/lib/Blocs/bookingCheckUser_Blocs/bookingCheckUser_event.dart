import 'package:equatable/equatable.dart';

abstract class BookingCheckEvent extends Equatable {
  @override
  List<Object> get props => [];
}

// Kiểm tra user có bị cấm không
class CheckUserBanStatus extends BookingCheckEvent {
  final String userId;

  CheckUserBanStatus(this.userId);

  @override
  List<Object> get props => [userId];
}

// Trigger kiểm tra booking quá hạn thủ công
class TriggerOverdueCheck extends BookingCheckEvent {}