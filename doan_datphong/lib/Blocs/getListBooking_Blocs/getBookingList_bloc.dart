import 'package:doan_datphong/Blocs/getListBooking_Blocs/getBookingList_event.dart';
import 'package:doan_datphong/Blocs/getListBooking_Blocs/getBookingList_state.dart';
import 'package:doan_datphong/Data/Repository/getBookingList_Repository/getBookingList_repo.dart';
import 'package:doan_datphong/Models/BookingFull.dart';
import 'package:doan_datphong/Models/Bookings.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class GetBookingListBloc extends Bloc<GetBookingListEvent,GetBookingListState>{
  final GetBookingListRepository fetchList;

  GetBookingListBloc({required this.fetchList}):super(GetBookingListInitial()){
    on<FetchBookingList>(_onFetchBookingList);
  }
  void _onFetchBookingList(FetchBookingList event , Emitter<GetBookingListState>emit)async{
    emit(GetBookingListLoading());

    try{
      List<BookingWithHotel> bookingFulls = await fetchList.fetchBookings(event.userId);
      emit(GetBookingListSuccess(bookingFulls));
    }catch(err){
      emit(GetBookingListFailure(err.toString()));
    }
  }
}