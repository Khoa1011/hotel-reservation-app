// GENERATED CODE - DO NOT MODIFY BY HAND
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'intl/messages_all.dart';

// **************************************************************************
// Generator: Flutter Intl IDE plugin
// Made by Localizely
// **************************************************************************

// ignore_for_file: non_constant_identifier_names, lines_longer_than_80_chars
// ignore_for_file: join_return_with_assignment, prefer_final_in_for_each
// ignore_for_file: avoid_redundant_argument_values, avoid_escaping_inner_quotes

class S {
  S();

  static S? _current;

  static S get current {
    assert(
      _current != null,
      'No instance of S was loaded. Try to initialize the S delegate before accessing S.current.',
    );
    return _current!;
  }

  static const AppLocalizationDelegate delegate = AppLocalizationDelegate();

  static Future<S> load(Locale locale) {
    final name = (locale.countryCode?.isEmpty ?? false)
        ? locale.languageCode
        : locale.toString();
    final localeName = Intl.canonicalizedLocale(name);
    return initializeMessages(localeName).then((_) {
      Intl.defaultLocale = localeName;
      final instance = S();
      S._current = instance;

      return instance;
    });
  }

  static S of(BuildContext context) {
    final instance = S.maybeOf(context);
    assert(
      instance != null,
      'No instance of S present in the widget tree. Did you add S.delegate in localizationsDelegates?',
    );
    return instance!;
  }

  static S? maybeOf(BuildContext context) {
    return Localizations.of<S>(context, S);
  }

  /// `Welcome to Staytion`
  String get welcomeToStaytion {
    return Intl.message(
      'Welcome to Staytion',
      name: 'welcomeToStaytion',
      desc: 'Welcome message on login screen',
      args: [],
    );
  }

  /// `E-mails`
  String get emails {
    return Intl.message(
      'E-mails',
      name: 'emails',
      desc: 'Email input field hint',
      args: [],
    );
  }

  /// `Password`
  String get password {
    return Intl.message(
      'Password',
      name: 'password',
      desc: 'Password input field hint',
      args: [],
    );
  }

  /// `Remember me`
  String get rememberMe {
    return Intl.message(
      'Remember me',
      name: 'rememberMe',
      desc: 'Remember me checkbox label',
      args: [],
    );
  }

  /// `Sign in`
  String get signIn {
    return Intl.message(
      'Sign in',
      name: 'signIn',
      desc: 'Sign in button text',
      args: [],
    );
  }

  /// `Forgot the password?`
  String get forgotPassword {
    return Intl.message(
      'Forgot the password?',
      name: 'forgotPassword',
      desc: 'Forgot password link text',
      args: [],
    );
  }

  /// `or continue with`
  String get orContinueWith {
    return Intl.message(
      'or continue with',
      name: 'orContinueWith',
      desc: 'Alternative login options separator',
      args: [],
    );
  }

  /// `Create your Account`
  String get createYourAccount {
    return Intl.message(
      'Create your Account',
      name: 'createYourAccount',
      desc: 'Register screen title',
      args: [],
    );
  }

  /// `Confirm Password`
  String get confirmPassword {
    return Intl.message(
      'Confirm Password',
      name: 'confirmPassword',
      desc: 'Confirm password input field hint',
      args: [],
    );
  }

  /// `Passwords do not match!`
  String get passwordsDoNotMatch {
    return Intl.message(
      'Passwords do not match!',
      name: 'passwordsDoNotMatch',
      desc: 'Password confirmation error message',
      args: [],
    );
  }

  /// `Successful!`
  String get successful {
    return Intl.message(
      'Successful!',
      name: 'successful',
      desc: 'Success dialog title',
      args: [],
    );
  }

  /// `Registration successful!`
  String get registrationSuccessful {
    return Intl.message(
      'Registration successful!',
      name: 'registrationSuccessful',
      desc: 'Registration success message',
      args: [],
    );
  }

  /// `Don't have an account?`
  String get dontHaveAccount {
    return Intl.message(
      'Don\'t have an account?',
      name: 'dontHaveAccount',
      desc: 'Sign up prompt text',
      args: [],
    );
  }

  /// `Sign up`
  String get signUp {
    return Intl.message(
      'Sign up',
      name: 'signUp',
      desc: 'Sign up button text',
      args: [],
    );
  }

  /// `Email cannot be empty!`
  String get emailCannotBeEmpty {
    return Intl.message(
      'Email cannot be empty!',
      name: 'emailCannotBeEmpty',
      desc: 'Email validation error when empty',
      args: [],
    );
  }

  /// `Enter a valid email!`
  String get enterValidEmail {
    return Intl.message(
      'Enter a valid email!',
      name: 'enterValidEmail',
      desc: 'Email validation error for invalid format',
      args: [],
    );
  }

  /// `Password must be at least 6 characters!`
  String get passwordMinLength {
    return Intl.message(
      'Password must be at least 6 characters!',
      name: 'passwordMinLength',
      desc: 'Password validation error for minimum length',
      args: [],
    );
  }

  /// `Fill Your Profile`
  String get fillYourProfile {
    return Intl.message(
      'Fill Your Profile',
      name: 'fillYourProfile',
      desc: 'Fill profile screen title',
      args: [],
    );
  }

  /// `Full Name`
  String get fullName {
    return Intl.message(
      'Full Name',
      name: 'fullName',
      desc: 'Full name input field hint',
      args: [],
    );
  }

  /// `Select Gender`
  String get selectGender {
    return Intl.message(
      'Select Gender',
      name: 'selectGender',
      desc: 'Gender dropdown hint',
      args: [],
    );
  }

  /// `Male`
  String get male {
    return Intl.message(
      'Male',
      name: 'male',
      desc: 'Male gender option',
      args: [],
    );
  }

  /// `Female`
  String get female {
    return Intl.message(
      'Female',
      name: 'female',
      desc: 'Female gender option',
      args: [],
    );
  }

  /// `Date of Birth`
  String get dateOfBirth {
    return Intl.message(
      'Date of Birth',
      name: 'dateOfBirth',
      desc: 'Date of birth input field hint',
      args: [],
    );
  }

  /// `Phone Number`
  String get phoneNumber {
    return Intl.message(
      'Phone Number',
      name: 'phoneNumber',
      desc: 'Phone number input field hint',
      args: [],
    );
  }

  /// `Take Photo`
  String get takePhoto {
    return Intl.message(
      'Take Photo',
      name: 'takePhoto',
      desc: 'Take photo option in image picker',
      args: [],
    );
  }

  /// `Choose from Gallery`
  String get chooseFromGallery {
    return Intl.message(
      'Choose from Gallery',
      name: 'chooseFromGallery',
      desc: 'Choose from gallery option in image picker',
      args: [],
    );
  }

  /// `Continue`
  String get continueText {
    return Intl.message(
      'Continue',
      name: 'continueText',
      desc: 'Continue button text',
      args: [],
    );
  }

  /// `Please select your gender`
  String get pleaseSelectGender {
    return Intl.message(
      'Please select your gender',
      name: 'pleaseSelectGender',
      desc: 'Gender selection error message',
      args: [],
    );
  }

  /// `Please select your date of birth`
  String get pleaseSelectDateOfBirth {
    return Intl.message(
      'Please select your date of birth',
      name: 'pleaseSelectDateOfBirth',
      desc: 'Date of birth selection error message',
      args: [],
    );
  }

  /// `Please enter your full name`
  String get pleaseEnterFullName {
    return Intl.message(
      'Please enter your full name',
      name: 'pleaseEnterFullName',
      desc: 'Full name validation error when empty',
      args: [],
    );
  }

  /// `The name cannot contain special characters`
  String get nameCannotContainSpecialCharacters {
    return Intl.message(
      'The name cannot contain special characters',
      name: 'nameCannotContainSpecialCharacters',
      desc: 'Full name validation error for special characters',
      args: [],
    );
  }

  /// `Please enter your phone number`
  String get pleaseEnterPhoneNumber {
    return Intl.message(
      'Please enter your phone number',
      name: 'pleaseEnterPhoneNumber',
      desc: 'Phone number validation error when empty',
      args: [],
    );
  }

  /// `Invalid phone number`
  String get invalidPhoneNumber {
    return Intl.message(
      'Invalid phone number',
      name: 'invalidPhoneNumber',
      desc: 'Phone number validation error for invalid format',
      args: [],
    );
  }

  /// `Profile`
  String get profile {
    return Intl.message(
      'Profile',
      name: 'profile',
      desc: 'Profile screen title',
      args: [],
    );
  }

  /// `Edit Profile`
  String get editProfile {
    return Intl.message(
      'Edit Profile',
      name: 'editProfile',
      desc: 'Edit profile button text',
      args: [],
    );
  }

  /// `Settings`
  String get settings {
    return Intl.message(
      'Settings',
      name: 'settings',
      desc: 'Settings section title',
      args: [],
    );
  }

  /// `Payment`
  String get payment {
    return Intl.message(
      'Payment',
      name: 'payment',
      desc: 'Payment settings option',
      args: [],
    );
  }

  /// `Notifications`
  String get notifications {
    return Intl.message(
      'Notifications',
      name: 'notifications',
      desc: 'Notifications settings option',
      args: [],
    );
  }

  /// `Security`
  String get security {
    return Intl.message(
      'Security',
      name: 'security',
      desc: 'Security settings option',
      args: [],
    );
  }

  /// `Help`
  String get help {
    return Intl.message(
      'Help',
      name: 'help',
      desc: 'Help settings option',
      args: [],
    );
  }

  /// `Dark Theme`
  String get darkTheme {
    return Intl.message(
      'Dark Theme',
      name: 'darkTheme',
      desc: 'Dark theme toggle option',
      args: [],
    );
  }

  /// `Language`
  String get language {
    return Intl.message(
      'Language',
      name: 'language',
      desc: 'Language settings option',
      args: [],
    );
  }

  /// `Logout`
  String get logout {
    return Intl.message(
      'Logout',
      name: 'logout',
      desc: 'Logout option',
      args: [],
    );
  }

  /// `Home`
  String get home {
    return Intl.message('Home', name: 'home', desc: 'Home tab label', args: []);
  }

  /// `Search`
  String get search {
    return Intl.message(
      'Search',
      name: 'search',
      desc: 'Search tab label',
      args: [],
    );
  }

  /// `Booking`
  String get booking {
    return Intl.message(
      'Booking',
      name: 'booking',
      desc: 'Booking tab label',
      args: [],
    );
  }

  /// `Are you sure you want to log out?`
  String get logoutConfirmation {
    return Intl.message(
      'Are you sure you want to log out?',
      name: 'logoutConfirmation',
      desc: 'Logout confirmation dialog message',
      args: [],
    );
  }

  /// `Cancel`
  String get cancel {
    return Intl.message(
      'Cancel',
      name: 'cancel',
      desc: 'Cancel button text',
      args: [],
    );
  }

  /// `Error`
  String get error {
    return Intl.message(
      'Error',
      name: 'error',
      desc: 'Error dialog title',
      args: [],
    );
  }

  /// `OK`
  String get ok {
    return Intl.message('OK', name: 'ok', desc: 'OK button text', args: []);
  }

  /// `Tiếng Việt`
  String get vietnamese {
    return Intl.message(
      'Tiếng Việt',
      name: 'vietnamese',
      desc: 'Vietnamese language option',
      args: [],
    );
  }

  /// `English`
  String get english {
    return Intl.message(
      'English',
      name: 'english',
      desc: 'English language option',
      args: [],
    );
  }

  /// `Save`
  String get save {
    return Intl.message(
      'Save',
      name: 'save',
      desc: 'Save button text',
      args: [],
    );
  }

  /// `Edit`
  String get edit {
    return Intl.message(
      'Edit',
      name: 'edit',
      desc: 'Edit button text',
      args: [],
    );
  }

  /// `Delete`
  String get delete {
    return Intl.message(
      'Delete',
      name: 'delete',
      desc: 'Delete button text',
      args: [],
    );
  }

  /// `Confirm`
  String get confirm {
    return Intl.message(
      'Confirm',
      name: 'confirm',
      desc: 'Confirm button text',
      args: [],
    );
  }

  /// `Back`
  String get back {
    return Intl.message(
      'Back',
      name: 'back',
      desc: 'Back button text',
      args: [],
    );
  }

  /// `Next`
  String get next {
    return Intl.message(
      'Next',
      name: 'next',
      desc: 'Next button text',
      args: [],
    );
  }

  /// `Done`
  String get done {
    return Intl.message(
      'Done',
      name: 'done',
      desc: 'Done button text',
      args: [],
    );
  }

  /// `Close`
  String get close {
    return Intl.message(
      'Close',
      name: 'close',
      desc: 'Close button text',
      args: [],
    );
  }

  /// `Please try again!`
  String get pleaseTryAgain {
    return Intl.message(
      'Please try again!',
      name: 'pleaseTryAgain',
      desc: '',
      args: [],
    );
  }

  /// `Try Again`
  String get tryAgain {
    return Intl.message(
      'Try Again',
      name: 'tryAgain',
      desc: 'Try again button text',
      args: [],
    );
  }

  /// `Warning!`
  String get warning {
    return Intl.message(
      'Warning!',
      name: 'warning',
      desc: 'Warning dialog title',
      args: [],
    );
  }

  /// `Information`
  String get information {
    return Intl.message(
      'Information',
      name: 'information',
      desc: 'Information dialog title',
      args: [],
    );
  }

  /// `Please enter all fields!`
  String get pleaseEnterAllFields {
    return Intl.message(
      'Please enter all fields!',
      name: 'pleaseEnterAllFields',
      desc: 'Message dialog when register',
      args: [],
    );
  }

  /// `Please fix validation errors!`
  String get pleaseFixValidationErrors {
    return Intl.message(
      'Please fix validation errors!',
      name: 'pleaseFixValidationErrors',
      desc: 'Message dialog when register',
      args: [],
    );
  }

  /// `Connection Timeout. Please try again later!`
  String get connectionTimeout {
    return Intl.message(
      'Connection Timeout. Please try again later!',
      name: 'connectionTimeout',
      desc: '',
      args: [],
    );
  }

  /// `Connection timeout. Server may be busy or not responding!`
  String get errorConnectionTimeout {
    return Intl.message(
      'Connection timeout. Server may be busy or not responding!',
      name: 'errorConnectionTimeout',
      desc: 'Connection timeout error message',
      args: [],
    );
  }

  /// `Please check your network and try again.`
  String get connectionTimeoutAgain {
    return Intl.message(
      'Please check your network and try again.',
      name: 'connectionTimeoutAgain',
      desc: '',
      args: [],
    );
  }

  /// `Server refused connection. Server may be down!`
  String get errorServerRefused {
    return Intl.message(
      'Server refused connection. Server may be down!',
      name: 'errorServerRefused',
      desc: 'Server refused connection error message',
      args: [],
    );
  }

  /// `Maintenance server`
  String get maintenanceServer {
    return Intl.message(
      'Maintenance server',
      name: 'maintenanceServer',
      desc: '',
      args: [],
    );
  }

  /// `Network unreachable. Please check your WiFi/Mobile data!`
  String get errorNetworkUnreachable {
    return Intl.message(
      'Network unreachable. Please check your WiFi/Mobile data!',
      name: 'errorNetworkUnreachable',
      desc: 'Network unreachable error message',
      args: [],
    );
  }

  /// `No internet connection`
  String get notNetwork {
    return Intl.message(
      'No internet connection',
      name: 'notNetwork',
      desc: '',
      args: [],
    );
  }

  /// `Server returned invalid data!`
  String get errorInvalidResponse {
    return Intl.message(
      'Server returned invalid data!',
      name: 'errorInvalidResponse',
      desc: 'Invalid response error message',
      args: [],
    );
  }

  /// `Cannot find server. Please check IP address!`
  String get errorHostLookupFailed {
    return Intl.message(
      'Cannot find server. Please check IP address!',
      name: 'errorHostLookupFailed',
      desc: 'Host lookup failed error message',
      args: [],
    );
  }

  /// `Email already exists!`
  String get errorEmailExists {
    return Intl.message(
      'Email already exists!',
      name: 'errorEmailExists',
      desc: 'Email exists error message',
      args: [],
    );
  }

  /// `Invalid email format!`
  String get errorInvalidEmail {
    return Intl.message(
      'Invalid email format!',
      name: 'errorInvalidEmail',
      desc: 'Invalid email error message',
      args: [],
    );
  }

  /// `Password is too weak!`
  String get errorWeakPassword {
    return Intl.message(
      'Password is too weak!',
      name: 'errorWeakPassword',
      desc: 'Weak password error message',
      args: [],
    );
  }

  /// `An unknown error occurred!`
  String get errorUnknown {
    return Intl.message(
      'An unknown error occurred!',
      name: 'errorUnknown',
      desc: 'Unknown error message',
      args: [],
    );
  }

  /// `Processing...`
  String get processing {
    return Intl.message(
      'Processing...',
      name: 'processing',
      desc: 'Processing button text',
      args: [],
    );
  }

  /// `Processing registration...`
  String get processingRegistration {
    return Intl.message(
      'Processing registration...',
      name: 'processingRegistration',
      desc: 'Processing registration message',
      args: [],
    );
  }

  /// `Search...`
  String get searchPlaceholder {
    return Intl.message(
      'Search...',
      name: 'searchPlaceholder',
      desc: 'Search bar placeholder text',
      args: [],
    );
  }

  /// `Welcome`
  String get welcome {
    return Intl.message(
      'Welcome',
      name: 'welcome',
      desc: 'Welcome greeting text',
      args: [],
    );
  }

  /// `Recommended`
  String get recommended {
    return Intl.message(
      'Recommended',
      name: 'recommended',
      desc: 'Recommended filter button',
      args: [],
    );
  }

  /// `Popular`
  String get popular {
    return Intl.message(
      'Popular',
      name: 'popular',
      desc: 'Popular filter button',
      args: [],
    );
  }

  /// `Trending`
  String get trending {
    return Intl.message(
      'Trending',
      name: 'trending',
      desc: 'Trending filter button',
      args: [],
    );
  }

  /// `Recently Booked`
  String get recentlyBooked {
    return Intl.message(
      'Recently Booked',
      name: 'recentlyBooked',
      desc: 'Recently booked section title',
      args: [],
    );
  }

  /// `See all`
  String get seeAll {
    return Intl.message(
      'See all',
      name: 'seeAll',
      desc: 'See all button text',
      args: [],
    );
  }

  /// `per night`
  String get perNight {
    return Intl.message(
      'per night',
      name: 'perNight',
      desc: 'Per night pricing text',
      args: [],
    );
  }

  /// `/ night`
  String get night {
    return Intl.message(
      '/ night',
      name: 'night',
      desc: 'Night pricing text',
      args: [],
    );
  }

  /// `reviews`
  String get reviews {
    return Intl.message(
      'reviews',
      name: 'reviews',
      desc: 'Reviews text',
      args: [],
    );
  }

  /// `Loading hotel list...`
  String get loadingHotels {
    return Intl.message(
      'Loading hotel list...',
      name: 'loadingHotels',
      desc: '',
      args: [],
    );
  }

  /// `Loading data...`
  String get loadingData {
    return Intl.message(
      'Loading data...',
      name: 'loadingData',
      desc: '',
      args: [],
    );
  }

  /// `Please wait...`
  String get pleaseWait {
    return Intl.message(
      'Please wait...',
      name: 'pleaseWait',
      desc: '',
      args: [],
    );
  }

  /// `No hotel data yet`
  String get noDataHotelYet {
    return Intl.message(
      'No hotel data yet',
      name: 'noDataHotelYet',
      desc: '',
      args: [],
    );
  }

  /// `Empty list`
  String get emptyList {
    return Intl.message('Empty list', name: 'emptyList', desc: '', args: []);
  }

  /// `Book Now`
  String get bookNow {
    return Intl.message('Book Now', name: 'bookNow', desc: '', args: []);
  }

  /// `Check Availability`
  String get checkAvailability {
    return Intl.message(
      'Check Availability',
      name: 'checkAvailability',
      desc: '',
      args: [],
    );
  }

  /// `View Details`
  String get viewDetails {
    return Intl.message(
      'View Details',
      name: 'viewDetails',
      desc: '',
      args: [],
    );
  }

  /// `Amenities`
  String get amenities {
    return Intl.message('Amenities', name: 'amenities', desc: '', args: []);
  }

  /// `View all amenities`
  String get viewAllAmenities {
    return Intl.message(
      'View all amenities',
      name: 'viewAllAmenities',
      desc: '',
      args: [],
    );
  }

  /// `All Amenities`
  String get allAmenities {
    return Intl.message(
      'All Amenities',
      name: 'allAmenities',
      desc: '',
      args: [],
    );
  }

  /// `Loading amenities...`
  String get loadingAmenities {
    return Intl.message(
      'Loading amenities...',
      name: 'loadingAmenities',
      desc: '',
      args: [],
    );
  }

  /// `No amenities available`
  String get noAmenitiesAvailable {
    return Intl.message(
      'No amenities available',
      name: 'noAmenitiesAvailable',
      desc: '',
      args: [],
    );
  }

  /// `Categories`
  String get categories {
    return Intl.message('Categories', name: 'categories', desc: '', args: []);
  }

  /// `Total Amenities`
  String get totalAmenities {
    return Intl.message(
      'Total Amenities',
      name: 'totalAmenities',
      desc: '',
      args: [],
    );
  }

  /// `Description`
  String get description {
    return Intl.message('Description', name: 'description', desc: '', args: []);
  }

  /// `Location of the hotel`
  String get locationHotel {
    return Intl.message(
      'Location of the hotel',
      name: 'locationHotel',
      desc: '',
      args: [],
    );
  }

  /// `Select check-in date`
  String get selectDatesAndTimeCheckIn {
    return Intl.message(
      'Select check-in date',
      name: 'selectDatesAndTimeCheckIn',
      desc: '',
      args: [],
    );
  }

  /// `Mon`
  String get thu2_Monday {
    return Intl.message('Mon', name: 'thu2_Monday', desc: '', args: []);
  }

  /// `Tue`
  String get thu3_Tuesday {
    return Intl.message('Tue', name: 'thu3_Tuesday', desc: '', args: []);
  }

  /// `Wed`
  String get thu4_Wednesday {
    return Intl.message('Wed', name: 'thu4_Wednesday', desc: '', args: []);
  }

  /// `Thur`
  String get thu5_Thursday {
    return Intl.message('Thur', name: 'thu5_Thursday', desc: '', args: []);
  }

  /// `Fri`
  String get thu6_Friday {
    return Intl.message('Fri', name: 'thu6_Friday', desc: '', args: []);
  }

  /// `Sat`
  String get thu7_Saturday {
    return Intl.message('Sat', name: 'thu7_Saturday', desc: '', args: []);
  }

  /// `Su`
  String get cn_Sunday {
    return Intl.message('Su', name: 'cn_Sunday', desc: '', args: []);
  }

  /// `Check-in date`
  String get checkInDate {
    return Intl.message(
      'Check-in date',
      name: 'checkInDate',
      desc: '',
      args: [],
    );
  }

  /// `Check-Out date`
  String get checkOutDate {
    return Intl.message(
      'Check-Out date',
      name: 'checkOutDate',
      desc: '',
      args: [],
    );
  }

  /// `Check-in time`
  String get checkInTime {
    return Intl.message(
      'Check-in time',
      name: 'checkInTime',
      desc: '',
      args: [],
    );
  }

  /// `Please select check-in and check-out dates`
  String get messageSelectDateTimeCheckIn {
    return Intl.message(
      'Please select check-in and check-out dates',
      name: 'messageSelectDateTimeCheckIn',
      desc: '',
      args: [],
    );
  }

  /// `Option`
  String get optionSeletedTime {
    return Intl.message(
      'Option',
      name: 'optionSeletedTime',
      desc: '',
      args: [],
    );
  }

  /// `Guests & Rooms`
  String get guestsRooms {
    return Intl.message(
      'Guests & Rooms',
      name: 'guestsRooms',
      desc: '',
      args: [],
    );
  }

  /// `Selected time`
  String get selectedTime {
    return Intl.message(
      'Selected time',
      name: 'selectedTime',
      desc: '',
      args: [],
    );
  }

  /// `Adults`
  String get adults {
    return Intl.message('Adults', name: 'adults', desc: '', args: []);
  }

  /// `Children`
  String get children {
    return Intl.message('Children', name: 'children', desc: '', args: []);
  }

  /// `Rooms`
  String get rooms {
    return Intl.message('Rooms', name: 'rooms', desc: '', args: []);
  }

  /// `Ages 13 or above`
  String get agesOrAbove {
    return Intl.message(
      'Ages 13 or above',
      name: 'agesOrAbove',
      desc: '',
      args: [],
    );
  }

  /// `Ages 2-12`
  String get age2_12 {
    return Intl.message('Ages 2-12', name: 'age2_12', desc: '', args: []);
  }

  /// `How many rooms needed ?`
  String get howManyRoomsNeeded {
    return Intl.message(
      'How many rooms needed ?',
      name: 'howManyRoomsNeeded',
      desc: '',
      args: [],
    );
  }

  /// `Apply`
  String get apply {
    return Intl.message('Apply', name: 'apply', desc: '', args: []);
  }
}

class AppLocalizationDelegate extends LocalizationsDelegate<S> {
  const AppLocalizationDelegate();

  List<Locale> get supportedLocales {
    return const <Locale>[
      Locale.fromSubtags(languageCode: 'en'),
      Locale.fromSubtags(languageCode: 'vi'),
    ];
  }

  @override
  bool isSupported(Locale locale) => _isSupported(locale);
  @override
  Future<S> load(Locale locale) => S.load(locale);
  @override
  bool shouldReload(AppLocalizationDelegate old) => false;

  bool _isSupported(Locale locale) {
    for (var supportedLocale in supportedLocales) {
      if (supportedLocale.languageCode == locale.languageCode) {
        return true;
      }
    }
    return false;
  }
}
