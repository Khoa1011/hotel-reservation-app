// ✅ Fixed GetListOfRoomBloc
import 'dart:convert';

import 'package:doan_datphong/Blocs/getListOfRoom_Blocs/getListOfRoom_event.dart';
import 'package:doan_datphong/Blocs/getListOfRoom_Blocs/getListOfRoom_state.dart';
import 'package:doan_datphong/Data/Repository/getListOfRoomTypes_Repository/getListOfRoom_repo.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class GetListOfRoomBloc extends Bloc<GetListOfRoomEvent, GetListOfRoomState> {
  final GetListOfRoomTypeRepository repository;

  GetListOfRoomBloc({required this.repository})
      : super(GetListOfRoomInitial()) {
    on<FetchRoomList>(_onFetchRoomList);
    on<FetchSimpleRoomList>(_onFetchSimpleRoomList);
  }

  void _onFetchRoomList(
      FetchRoomList event,
      Emitter<GetListOfRoomState> emit,
      ) async {
    emit(GetListOfRoomLoading());
    try {
      final result = await repository.searchRoomTypes(
        hotelId: event.hotelId,
        bookingType: event.lichPhongTrong.loaiDatPhong,
        checkInDate: event.lichPhongTrong.ngayNhanPhong,
        checkOutDate: event.lichPhongTrong.ngayTraPhong,
        checkInTime: event.lichPhongTrong.gioNhanPhong,
        checkOutTime: event.lichPhongTrong.gioTraPhong,
        guests: {
          'adults': event.lichPhongTrong.soLuongKhach.soNguoiLon,
          'children': event.lichPhongTrong.soLuongKhach.soTreEm ?? 0,
        },
        rooms: event.lichPhongTrong.soLuongPhong,
      );

      // Kiểm tra result structure từ API
      if (result['success'] == true) {
        emit(GetListOfRoomSuccess(
          roomTypes: result['roomTypes'] ?? [],
          message: result['message'],
          searchInfo: result['searchInfo'],
          statistics: result['statistics'],
        ));
      } else {
        emit(GetListOfRoomFailure(
            result['message'] ?? 'Không tìm thấy phòng phù hợp'
        ));
      }
    } catch (err) {
      String errorTitle = "Lỗi không xác định";
      String? suggestion;

      try {
        String errorString = err.toString();

        // Remove "Exception: " prefix
        if (errorString.startsWith('Exception: ')) {
          errorString = errorString.substring(11);
        }

        // Parse JSON error
        final errorData = jsonDecode(errorString);
        errorTitle = errorData['msgBody'] ?? errorData['message'] ?? errorTitle;
        suggestion = errorData['suggestion'];

      } catch (parseError) {
        // If JSON parsing fails, try regex
        String errorString = err.toString();
        RegExp msgBodyRegex = RegExp(r'"msgBody":"([^"]*)"');
        RegExp suggestionRegex = RegExp(r'"suggestion":"([^"]*)"');

        var msgBodyMatch = msgBodyRegex.firstMatch(errorString);
        var suggestionMatch = suggestionRegex.firstMatch(errorString);

        if (msgBodyMatch != null) {
          errorTitle = msgBodyMatch.group(1) ?? errorTitle;
        }
        if (suggestionMatch != null) {
          suggestion = suggestionMatch.group(1);
        }
      }

      emit(GetListOfRoomFailure(errorTitle, suggestion: suggestion));
    }
  }

  // ✅ Fixed: Xử lý lấy danh sách loại phòng đơn giản
  void _onFetchSimpleRoomList(
      FetchSimpleRoomList event,
      Emitter<GetListOfRoomState> emit,
      ) async {
    emit(GetListOfRoomLoading());
    try {
      final roomTypes = await repository.getSimpleRoomTypes(
        hotelId: event.hotelId,
        bookingType: event.bookingType,
        checkInDate: event.checkInDate,
        checkOutDate: event.checkOutDate,
        checkInTime: event.checkInTime,
        checkOutTime: event.checkOutTime,
        guests: event.guests,
        rooms: event.rooms,
      );

      emit(GetListOfRoomSuccess(roomTypes: roomTypes));
    } catch (err) {
      emit(GetListOfRoomFailure(err.toString()));
    }
  }
}


