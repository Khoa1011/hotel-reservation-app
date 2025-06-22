import 'package:doan_datphong/Blocs/register_Blocs/register_event.dart';
import 'package:doan_datphong/Blocs/register_Blocs/register_state.dart';
import 'package:doan_datphong/Data/Provider/ApiResponse.dart';
import 'package:doan_datphong/Data/Repository/register_Repository/register_repo.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';

class RegisterBlocs extends Bloc<RegisterEvent, RegisterState> {
  final RegisterRepository registerRepository;

  RegisterBlocs({required this.registerRepository}) : super(RegisterInitial()) {
    on<RegisterSubmitted>(_onRegisterSubmitted);
  }

  void _onRegisterSubmitted(RegisterSubmitted event, Emitter<RegisterState> emit) async {
    emit(RegisterLoading());
    try {
      ApiResponse? res = await registerRepository.register(event.email, event.password);

      if (res!.success) {

        SharedPreferences prefs = await SharedPreferences.getInstance();
        await prefs.setString("email", event.email);

        emit(RegisterSuccess(res.data)); // Trạng thái thành công

      } else {
        emit(RegisterFailure(res.message));
      }
    } catch (e) {
      print("RegisterBloc unexpected error: $e");
      emit(RegisterFailure("Có lỗi không mong muốn xảy ra: ${e.toString()}"));
    }
  }
}
