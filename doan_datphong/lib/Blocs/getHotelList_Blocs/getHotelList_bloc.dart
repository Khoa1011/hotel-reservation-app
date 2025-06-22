import 'package:doan_datphong/Blocs/getHotelList_Blocs/getHotelList_event.dart';
import 'package:doan_datphong/Blocs/getHotelList_Blocs/getHotelList_state.dart';
import 'package:doan_datphong/Data/Repository/getHotelList_Repository/getHotelList_repo.dart';
import 'package:doan_datphong/Models/KhachSan.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class GetHotelListBloc extends Bloc<GetHotelListEvent,GetHotelListState>{
  late final GetHotelListRepository fetchList;

  GetHotelListBloc({required this.fetchList}):super(GetHotelListInitial()){
    on<FetchHotelList>(_onFetchHotelList);
  }
  void _onFetchHotelList(FetchHotelList event, Emitter<GetHotelListState> emit) async{
    emit(GetHotelListLoading());
    try {
      List<Hotels> hotels = await fetchList.fetchHotels();
      emit(GetHotelListSuccess(hotels));
    } catch (error) {
      emit(GetHotelListFailure(error.toString()));
    }
  }
}

