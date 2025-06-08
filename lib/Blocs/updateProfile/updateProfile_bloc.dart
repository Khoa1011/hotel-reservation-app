import 'package:doan_datphong/Blocs/updateProfile/updateProfile_event.dart';
import 'package:doan_datphong/Blocs/updateProfile/updateProfile_state.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../Data/Provider/ApiResponse.dart';
import '../../Data/Repository/updateProfile_Repository/updateProfile_repo.dart';
import '../../Models/User.dart';

class UpdateProfileBloc extends Bloc<UpdateProfileEvent,UpdateProfileState> {
  late final UpdateProfileRepository fpr;

  UpdateProfileBloc({required this.fpr}) :super(UpdateProfileInitial()) {
    on<UpdateProfileSubmiited>(_onFillProfileSumiited);
  }

  void _onFillProfileSumiited(UpdateProfileSubmiited event,
      Emitter<UpdateProfileState> emit) async {
    emit(UpdateProfileLoading());
    try {
      ApiResponse res = await fpr.UpdateProfile(event.user);

      if (!res.success) {
        emit(UpdateProfileFailure(res.message));
        return;
      } else {
        User user = res.data;
        emit(UpdateProfileSuccess(user));
      }
    } catch (err) {
      emit(UpdateProfileFailure(err.toString()));
    }
  }
}