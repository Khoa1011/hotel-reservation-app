import 'package:doan_datphong/Blocs/User_Blocs/user_bloc.dart';
import 'package:doan_datphong/Blocs/bookingCheckUser_Blocs/bookingCheckUser_bloc.dart';
import 'package:doan_datphong/Blocs/fillProfile_Blocs/fillProfile_bloc.dart';
import 'package:doan_datphong/Blocs/getHotelList_Blocs/getHotelList_bloc.dart';
import 'package:doan_datphong/Blocs/getListBooking_Blocs/getBookingList_bloc.dart';
import 'package:doan_datphong/Blocs/getListOfRoom_Blocs/getListOfRoom_bloc.dart';
import 'package:doan_datphong/Blocs/login_Blocs/login_bloc.dart';
import 'package:doan_datphong/Blocs/logout_bloc/logout_bloc.dart';
import 'package:doan_datphong/Blocs/payment_Blocs/payment_bloc.dart';
import 'package:doan_datphong/Blocs/register_Blocs/register_bloc.dart';
import 'package:doan_datphong/Blocs/review_Blocs/review_bloc.dart';
import 'package:doan_datphong/Blocs/updateProfile/updateProfile_bloc.dart';
import 'package:doan_datphong/Data/Repository/bookingCheckUser_Repository/bookingCheckUser_repo.dart';
import 'package:doan_datphong/Data/Repository/getBookingList_Repository/getBookingList_repo.dart';
import 'package:doan_datphong/Data/Repository/getHotelList_Repository/getHotelList_repo.dart';
import 'package:doan_datphong/Data/Repository/getListOfRoomTypes_Repository/getListOfRoom_repo.dart';
import 'package:doan_datphong/Data/Repository/login_Repository/login_repo.dart';
import 'package:doan_datphong/Data/Repository/logout_Repository/logout_repo.dart';
import 'package:doan_datphong/Data/Repository/payment_Repository/payment_repo.dart';
import 'package:doan_datphong/Data/Repository/register_Repository/register_repo.dart';
import 'package:doan_datphong/Data/Repository/updateProfile_Repository/updateProfile_repo.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'Blocs/Hotel_Blocs/hotel_bloc.dart';
import 'Blocs/checkLogin_Blocs/checkLogin_bloc.dart';
import 'Blocs/getAmenities_Blocs/getAmenities_bloc.dart';
import 'Blocs/getReviewByHotel_Blocs/getReviewByHotel_bloc.dart';
import 'Blocs/logout_bloc/logout_event.dart';
import 'Blocs/searchHotels_Blocs/searchHotels_bloc.dart';
import 'Data/Provider/auth_provider.dart';
import 'Data/Repository/fillProfile_Repository/fillProfile_repo.dart';
import 'Data/Repository/getAmenities_Repository/getAmenities_repo.dart';
import 'Data/Repository/getReviewByHotel_Repository/getReviewByHotel_repo.dart';
import 'Data/Repository/review_Repository/review_repo.dart';
import 'Data/Repository/searchHotels_Repository/searchHotels_repo.dart';
import 'LanguageProvider.dart';
import 'SplashScreen.dart';
import 'firebase_options.dart';
import 'generated/l10n.dart';
import 'package:firebase_core/firebase_core.dart';
import 'notification_service.dart';



final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print("📱 Background message: ${message.notification?.title}");
}
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // ✅ THÊM: Initialize Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // ✅ THÊM: Set background message handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  // ✅ Initialize Notification Service
  await NotificationService.initialize();
  NotificationService.setNavigatorKey(navigatorKey);

  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();

}

class _MyAppState extends State<MyApp> {

  @override
  void initState() {
    super.initState();
    // ✅ Setup Firebase Messaging khi app khởi động
    NotificationService.setupFirebaseMessaging();
  }

  void _handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString("token");
    prefs.remove(token.toString());
    await prefs.clear();
  }

  // // ✅ THÊM METHOD SETUP FIREBASE MESSAGING
  // void _setupFirebaseMessaging() {
  //   FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  //     print('📱 Foreground message: ${message.notification?.title}');
  //     // TODO: Show local notification hoặc in-app notification
  //   });
  //
  //   FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
  //     print('📱 App opened from notification: ${message.notification?.title}');
  //     // TODO: Navigate to specific screen
  //   });
  // }


  @override
  Widget build(BuildContext context) {

    // _setupFirebaseMessaging();
    return MultiProvider(

      providers: [
        ChangeNotifierProvider<UserAuthProvider>(
          create: (context) => UserAuthProvider(),
        ),

        ChangeNotifierProvider<LanguageProvider>(
          create: (context) => LanguageProvider(),
        ),

        // Các BLoC providers
        BlocProvider(create: (context) => LoginBloc(
          loginRepository: LoginRepository(),
          authProvider: context.read<UserAuthProvider>(),

        )),
        BlocProvider(create: (context) => RegisterBlocs(registerRepository: RegisterRepository())),
        BlocProvider(create: (context) => LogoutBloc(logoutRepository: LogoutRepository())),
        BlocProvider(create: (context) => CheckLoginBloc()),
        BlocProvider(create: (context) => FillProfileBloc(fpr: FillProfileRepository())),
        BlocProvider(create: (context) => GetHotelListBloc(fetchList: GetHotelListRepository())),
        BlocProvider(create: (context) => GetListOfRoomBloc(repository: GetListOfRoomTypeRepository())),
        BlocProvider(create: (context) => HotelBloc()),
        BlocProvider(create: (context) => UserBloc()),
        BlocProvider(create: (context) => PaymentBloc(paymentRepository: PaymentRepository())),
        BlocProvider(create: (context) => GetBookingListBloc(fetchList: GetBookingListRepository())),
        BlocProvider(create: (context) => UpdateProfileBloc(fpr: UpdateProfileRepository())),
        BlocProvider(create: (context) => GetAmenitiesBloc(getAmenitiesRepo: GetAmenitiesRepository())),
        BlocProvider(create: (context) => HotelSearchBloc(repository: HotelSearchRepository())),
        BlocProvider(create: (context) => BookingCheckBloc(repository: BookingCheckRepository())),
        BlocProvider(create: (context) => ReviewBloc(reviewRepository: ReviewRepository())),
        BlocProvider(create: (context) => HotelReviewBloc(hotelReviewRepository: HotelReviewRepository())),
      ],
      child: Consumer<LanguageProvider>(
        builder: (context, languageProvider, child) {
          return MaterialApp(
            navigatorKey: navigatorKey,
            title: 'Staytion',

            // Cấu hình theme
            theme: ThemeData(
              colorScheme: ColorScheme.fromSeed(seedColor: Colors.lightBlueAccent),
              primaryColor: Color(0xFF14D9E1),


              appBarTheme: AppBarTheme(

                backgroundColor: Colors.white,
                foregroundColor: Colors.black,
                elevation: 0,
              ),
              elevatedButtonTheme: ElevatedButtonThemeData(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Color(0xFF14D9E1),
                  foregroundColor: Colors.white,
                ),
              ),
            ),
            debugShowCheckedModeBanner: false,
            locale: languageProvider.currentLocale,
            localizationsDelegates: const [
              S.delegate, //
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: S.delegate.supportedLocales,
            localeResolutionCallback: (locale, supportedLocales) {

              if (locale != null) {
                for (var supportedLocale in supportedLocales) {
                  if (supportedLocale.languageCode == locale.languageCode) {
                    return supportedLocale;
                  }
                }
              }
              return const Locale('vi');
            },


            home: SplashScreen(),
          );
        },
      ),
    );
  }
}





class LanguageTestWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(S.of(context).profile),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(S.of(context).welcomeToStaytion),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                context.read<LanguageProvider>().toggleLanguage();
              },
              child: Text('Toggle Language'),
            ),
            SizedBox(height: 10),
            Consumer<LanguageProvider>(
              builder: (context, languageProvider, child) {
                return Text(
                  'Current: ${languageProvider.getCurrentLanguageName()} ${languageProvider.getCurrentFlag()}',
                  style: TextStyle(fontSize: 16),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}