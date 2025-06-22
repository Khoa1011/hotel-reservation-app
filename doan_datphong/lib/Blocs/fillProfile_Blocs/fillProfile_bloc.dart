import 'package:doan_datphong/Blocs/fillProfile_Blocs/fillProfile_event.dart';
import 'package:doan_datphong/Blocs/fillProfile_Blocs/fillProfile_state.dart';
import 'package:doan_datphong/Data/Provider/ApiResponse.dart';
import 'package:doan_datphong/Data/Repository/fillProfile_Repository/fillProfile_repo.dart';
import 'package:doan_datphong/Models/NguoiDung.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class FillProfileBloc extends Bloc<FillProfileEvent,FillProfileState>{
  late final FillProfileRepository fpr;
  FillProfileBloc({required this.fpr}):super(FillProfileInitial()){
    on<FillProfileSubmiited>(_onFillProfileSumiited);
  }
  void _onFillProfileSumiited(FillProfileSubmiited event, Emitter<FillProfileState> emit) async {
    emit(FillProfileLoading());
    try {
      ApiResponse res = await fpr.fillProfile(event.user);

      if (!res.success) {
        emit(FillProfileFailure(res.message));
        return;
      } else {
        NguoiDung user = res.data;
        emit(FillProfileSuccess(user));
      }
    } catch (err) {
      emit(FillProfileFailure(err.toString()));
    }
  }

}

