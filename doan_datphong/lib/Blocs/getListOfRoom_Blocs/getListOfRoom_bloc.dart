import 'package:doan_datphong/Blocs/getListOfRoom_Blocs/getListOfRoom_event.dart';
import 'package:doan_datphong/Blocs/getListOfRoom_Blocs/getListOfRoom_state.dart';
import 'package:doan_datphong/Data/Repository/getListOfRoom_Repository/getListOfRoom_repo.dart';
import 'package:doan_datphong/Models/Room.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class GetListOfRoomBloc extends Bloc<GetListOfRoomEvent,GetListOfRoomState> {
  late final GetListOfRoomRepository getListRoomRepo;

  GetListOfRoomBloc({required this.getListRoomRepo})
      :super(GetListOfRoomInitial()) {
    on<FetchRoomList>(_onFetchRoomList);
  }
  void _onFetchRoomList(FetchRoomList event, Emitter<GetListOfRoomState> emit) async {
    emit(GetListOfRoomLoading());
    try {
      List<Room> rooms = await getListRoomRepo.getListOfRoom(
        event.idHotel,
        event.checkInDate,
        event.checkOutDate,
      );
      emit(GetListOfRoomSuccess(rooms: rooms));
    } catch (err) {
      emit(GetListOfRoomFailure(err.toString()));
    }
  }
}