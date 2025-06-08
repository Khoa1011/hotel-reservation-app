import 'package:doan_datphong/Blocs/payment_Blocs/payment_event.dart';
import 'package:doan_datphong/Blocs/payment_Blocs/payment_state.dart';
import 'package:doan_datphong/Data/Provider/ApiResponse.dart';
import 'package:doan_datphong/Data/Repository/payment_Repository/payment_repo.dart';
import 'package:doan_datphong/Models/Bookings.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class PaymentBloc extends Bloc<PaymentEvent, PaymentState>{
  late final PaymentRepository paymentRepository;
  PaymentBloc({required this.paymentRepository}):super(PaymentInitial()){
    on<PaymentSubmitted>(_onPayment);
  }

  void _onPayment (PaymentSubmitted event, Emitter<PaymentState> emit)async{
    emit(PaymentLoading());

    try{
      ApiResponse res = await paymentRepository.payment(event.booking);
      if(!res.success){
        emit(PaymentFailure(res.message));
        return;
      }else{
        Booking booking = res.data;
        emit(PaymentSuccess(booking));
      }
    }catch(err){
      emit(PaymentFailure(err.toString()));
    }
  }
}