import 'package:doan_datphong/Blocs/User_Blocs/user_bloc.dart';
import 'package:doan_datphong/Blocs/fillProfile_Blocs/fillProfile_bloc.dart';
import 'package:doan_datphong/Blocs/getHotelList_Blocs/getHotelList_bloc.dart';
import 'package:doan_datphong/Blocs/getListBooking_Blocs/getBookingList_bloc.dart';
import 'package:doan_datphong/Blocs/getListOfRoom_Blocs/getListOfRoom_bloc.dart';
import 'package:doan_datphong/Blocs/login_Blocs/login_bloc.dart';
import 'package:doan_datphong/Blocs/logout_bloc/logout_bloc.dart';
import 'package:doan_datphong/Blocs/payment_Blocs/payment_bloc.dart';
import 'package:doan_datphong/Blocs/register_Blocs/register_bloc.dart';
import 'package:doan_datphong/Blocs/updateProfile/updateProfile_bloc.dart';
import 'package:doan_datphong/Data/Repository/getBookingList_Repository/getBookingList_repo.dart';
import 'package:doan_datphong/Data/Repository/getHotelList_Repository/getHotelList_repo.dart';
import 'package:doan_datphong/Data/Repository/getListOfRoom_Repository/getListOfRoom_repo.dart';
import 'package:doan_datphong/Data/Repository/login_Repository/login_repo.dart';
import 'package:doan_datphong/Data/Repository/logout_Repository/logout_repo.dart';
import 'package:doan_datphong/Data/Repository/payment_Repository/payment_repo.dart';
import 'package:doan_datphong/Data/Repository/register_Repository/register_repo.dart';
import 'package:doan_datphong/Data/Repository/updateProfile_Repository/updateProfile_repo.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'Blocs/Hotel_Blocs/hotel_bloc.dart';
import 'Blocs/checkLogin_Blocs/checkLogin_bloc.dart';
import 'Data/Repository/fillProfile_Repository/fillProfile_repo.dart';
import 'SplashScreen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (context) => LoginBloc(loginRepository: LoginRepository())),
        BlocProvider(create: (context) => RegisterBlocs(registerRepository: RegisterRepository())),
        BlocProvider(create: (context) => LogoutBloc(logoutRepository: LogoutRepository())),
        BlocProvider(create: (context) => CheckLoginBloc()), // Thêm BLoC kiểm tra login
        BlocProvider(create: (context) => FillProfileBloc(fpr : FillProfileRepository())),
        BlocProvider(create: (context) => GetHotelListBloc(fetchList: GetHotelListRepository())),
        BlocProvider(create: (context)=> GetListOfRoomBloc(getListRoomRepo: GetListOfRoomRepository())),
        BlocProvider(create: (context) => HotelBloc()),
        BlocProvider(create: (context) => UserBloc()),
        BlocProvider(create: (context) => PaymentBloc(paymentRepository: PaymentRepository())),
        BlocProvider(create: (context) => GetBookingListBloc(fetchList: GetBookingListRepository())),
        BlocProvider(create: (context) => UpdateProfileBloc(fpr: UpdateProfileRepository())),
      ],
      child: MaterialApp(
        title: 'Staytion',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.lightBlueAccent),
        ),
        debugShowCheckedModeBanner: false,
        home: SplashScreen(),
      ),
    );
  }
}
