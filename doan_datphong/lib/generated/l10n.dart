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

  /// `You are not old enough to register an account!`
  String get notOldEnough {
    return Intl.message(
      'You are not old enough to register an account!',
      name: 'notOldEnough',
      desc: '',
      args: [],
    );
  }

  /// `Invalid age!`
  String get invalidAge {
    return Intl.message('Invalid age!', name: 'invalidAge', desc: '', args: []);
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

  /// `Password is incorrect. Please try again!`
  String get passwordIncorrect {
    return Intl.message(
      'Password is incorrect. Please try again!',
      name: 'passwordIncorrect',
      desc: '',
      args: [],
    );
  }

  /// `Email does not exist. If you do not have one, please register an account!`
  String get emailNotExist {
    return Intl.message(
      'Email does not exist. If you do not have one, please register an account!',
      name: 'emailNotExist',
      desc: '',
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

  /// `Amenity group is empty`
  String get amenityGroupIsEmpty {
    return Intl.message(
      'Amenity group is empty',
      name: 'amenityGroupIsEmpty',
      desc: '',
      args: [],
    );
  }

  /// `This hotel has no facilities yet. Please check back later.`
  String get hotelNotAmenityYet {
    return Intl.message(
      'This hotel has no facilities yet. Please check back later.',
      name: 'hotelNotAmenityYet',
      desc: '',
      args: [],
    );
  }

  /// `Updating in progress`
  String get updatingInProgress {
    return Intl.message(
      'Updating in progress',
      name: 'updatingInProgress',
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

  /// `Check-in and check-out dates must be different`
  String get checkoutDateMustAfterCheckinDate {
    return Intl.message(
      'Check-in and check-out dates must be different',
      name: 'checkoutDateMustAfterCheckinDate',
      desc: '',
      args: [],
    );
  }

  /// `Check-in time not selected!`
  String get checkInTimeNotSelected {
    return Intl.message(
      'Check-in time not selected!',
      name: 'checkInTimeNotSelected',
      desc: '',
      args: [],
    );
  }

  /// `Check-out time not selected!`
  String get checkOutTimeNotSelected {
    return Intl.message(
      'Check-out time not selected!',
      name: 'checkOutTimeNotSelected',
      desc: '',
      args: [],
    );
  }

  /// `Check-in date not selected!`
  String get checkInDateNotSelected {
    return Intl.message(
      'Check-in date not selected!',
      name: 'checkInDateNotSelected',
      desc: '',
      args: [],
    );
  }

  /// `Check-out date not selected!`
  String get checkOutDateNotSelected {
    return Intl.message(
      'Check-out date not selected!',
      name: 'checkOutDateNotSelected',
      desc: '',
      args: [],
    );
  }

  /// `No date selected in the past!`
  String get selectDateInPast {
    return Intl.message(
      'No date selected in the past!',
      name: 'selectDateInPast',
      desc: '',
      args: [],
    );
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

  /// `Check-out time`
  String get checkOutTime {
    return Intl.message(
      'Check-out time',
      name: 'checkOutTime',
      desc: '',
      args: [],
    );
  }

  /// `Please select check-in and check-out times`
  String get messageSelectDateTimeCheckIn {
    return Intl.message(
      'Please select check-in and check-out times',
      name: 'messageSelectDateTimeCheckIn',
      desc: '',
      args: [],
    );
  }

  /// `Please select check-in and check-out dates`
  String get messageSelectDateDateCheckIn {
    return Intl.message(
      'Please select check-in and check-out dates',
      name: 'messageSelectDateDateCheckIn',
      desc: '',
      args: [],
    );
  }

  /// `Hourly rental minimum 1 hour!`
  String get minimumHour {
    return Intl.message(
      'Hourly rental minimum 1 hour!',
      name: 'minimumHour',
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

  /// `Hourly`
  String get hourly {
    return Intl.message('Hourly', name: 'hourly', desc: '', args: []);
  }

  /// `Overnight`
  String get overnight {
    return Intl.message('Overnight', name: 'overnight', desc: '', args: []);
  }

  /// `Long days`
  String get longDays {
    return Intl.message('Long days', name: 'longDays', desc: '', args: []);
  }

  /// `Rent by the hour`
  String get rentByTheHour {
    return Intl.message(
      'Rent by the hour',
      name: 'rentByTheHour',
      desc: '',
      args: [],
    );
  }

  /// `Minimum 1 hour • Flexible during the day`
  String get rentByTheHourNote {
    return Intl.message(
      'Minimum 1 hour • Flexible during the day',
      name: 'rentByTheHourNote',
      desc: '',
      args: [],
    );
  }

  /// `Rent overnight`
  String get rentOvernight {
    return Intl.message(
      'Rent overnight',
      name: 'rentOvernight',
      desc: '',
      args: [],
    );
  }

  /// `Default will be 22:00 PM today to 12:00 PM tomorrow`
  String get rentOvernightNote {
    return Intl.message(
      'Default will be 22:00 PM today to 12:00 PM tomorrow',
      name: 'rentOvernightNote',
      desc: '',
      args: [],
    );
  }

  /// `Long term rental`
  String get rentLongDays {
    return Intl.message(
      'Long term rental',
      name: 'rentLongDays',
      desc: '',
      args: [],
    );
  }

  /// `From 2 days or more • Special price`
  String get rentLongDaysNote {
    return Intl.message(
      'From 2 days or more • Special price',
      name: 'rentLongDaysNote',
      desc: '',
      args: [],
    );
  }

  /// `Date of use`
  String get dateOfUse {
    return Intl.message('Date of use', name: 'dateOfUse', desc: '', args: []);
  }

  /// `Select time`
  String get selecteTime {
    return Intl.message('Select time', name: 'selecteTime', desc: '', args: []);
  }

  /// `Check-in by time`
  String get hourCheckInTime {
    return Intl.message(
      'Check-in by time',
      name: 'hourCheckInTime',
      desc: '',
      args: [],
    );
  }

  /// `Total`
  String get total {
    return Intl.message('Total', name: 'total', desc: '', args: []);
  }

  /// `day`
  String get day {
    return Intl.message('day', name: 'day', desc: '', args: []);
  }

  /// `Check-out date must be after check-in date`
  String get checkoutAfterCheckin {
    return Intl.message(
      'Check-out date must be after check-in date',
      name: 'checkoutAfterCheckin',
      desc: '',
      args: [],
    );
  }

  /// `Hourly booking must be within the same day`
  String get sameDayOnlyHourly {
    return Intl.message(
      'Hourly booking must be within the same day',
      name: 'sameDayOnlyHourly',
      desc: '',
      args: [],
    );
  }

  /// `Overnight stay must be from today to tomorrow`
  String get overnightOnlyOneNight {
    return Intl.message(
      'Overnight stay must be from today to tomorrow',
      name: 'overnightOnlyOneNight',
      desc: '',
      args: [],
    );
  }

  /// `Review`
  String get reviews {
    return Intl.message('Review', name: 'reviews', desc: '', args: []);
  }

  /// `More`
  String get moreReviews {
    return Intl.message('More', name: 'moreReviews', desc: '', args: []);
  }

  /// `All Reviews`
  String get allReviews {
    return Intl.message('All Reviews', name: 'allReviews', desc: '', args: []);
  }

  /// `Write a Review`
  String get writeReview {
    return Intl.message(
      'Write a Review',
      name: 'writeReview',
      desc: '',
      args: [],
    );
  }

  /// `Helpful`
  String get helpful {
    return Intl.message('Helpful', name: 'helpful', desc: '', args: []);
  }

  /// `Rating`
  String get rating {
    return Intl.message('Rating', name: 'rating', desc: '', args: []);
  }

  /// `Show less`
  String get showLess {
    return Intl.message('Show less', name: 'showLess', desc: '', args: []);
  }

  /// `Looking for rooms...`
  String get lookingForRooms {
    return Intl.message(
      'Looking for rooms...',
      name: 'lookingForRooms',
      desc: '',
      args: [],
    );
  }

  /// `rooms available`
  String get roomAvailable {
    return Intl.message(
      'rooms available',
      name: 'roomAvailable',
      desc: '',
      args: [],
    );
  }

  /// `No rooms available!`
  String get notRoomTypesAvailable {
    return Intl.message(
      'No rooms available!',
      name: 'notRoomTypesAvailable',
      desc: '',
      args: [],
    );
  }

  /// `Please try changing the search date!`
  String get pleaseTryChangingTheSearchDate {
    return Intl.message(
      'Please try changing the search date!',
      name: 'pleaseTryChangingTheSearchDate',
      desc: '',
      args: [],
    );
  }

  /// `Almost over`
  String get almostOver {
    return Intl.message('Almost over', name: 'almostOver', desc: '', args: []);
  }

  /// `Available`
  String get available {
    return Intl.message('Available', name: 'available', desc: '', args: []);
  }

  /// `Sold out`
  String get soldOut {
    return Intl.message('Sold out', name: 'soldOut', desc: '', args: []);
  }

  /// `From`
  String get from {
    return Intl.message('From', name: 'from', desc: '', args: []);
  }

  /// `to`
  String get to {
    return Intl.message('to', name: 'to', desc: '', args: []);
  }

  /// `View abridged`
  String get viewAbridged {
    return Intl.message(
      'View abridged',
      name: 'viewAbridged',
      desc: '',
      args: [],
    );
  }

  /// `Select room type`
  String get selectRoomType {
    return Intl.message(
      'Select room type',
      name: 'selectRoomType',
      desc: '',
      args: [],
    );
  }

  /// `Refresh`
  String get refresh {
    return Intl.message('Refresh', name: 'refresh', desc: '', args: []);
  }

  /// `This room is currently unavailable.`
  String get roomIsCurrentlyUnavailable {
    return Intl.message(
      'This room is currently unavailable.',
      name: 'roomIsCurrentlyUnavailable',
      desc: '',
      args: [],
    );
  }

  /// `Single bed`
  String get singleBed {
    return Intl.message('Single bed', name: 'singleBed', desc: '', args: []);
  }

  /// `Double bed`
  String get doubleBed {
    return Intl.message('Double bed', name: 'doubleBed', desc: '', args: []);
  }

  /// `Queen bed`
  String get queenBed {
    return Intl.message('Queen bed', name: 'queenBed', desc: '', args: []);
  }

  /// `King bed`
  String get kingBed {
    return Intl.message('King bed', name: 'kingBed', desc: '', args: []);
  }

  /// `Bed`
  String get bed {
    return Intl.message('Bed', name: 'bed', desc: '', args: []);
  }

  /// `other amenities`
  String get otherAmenities {
    return Intl.message(
      'other amenities',
      name: 'otherAmenities',
      desc: '',
      args: [],
    );
  }

  /// `Bed type unknown`
  String get bedTypeUnknown {
    return Intl.message(
      'Bed type unknown',
      name: 'bedTypeUnknown',
      desc: '',
      args: [],
    );
  }

  /// `Confirm this booking`
  String get bookingConfirm {
    return Intl.message(
      'Confirm this booking',
      name: 'bookingConfirm',
      desc: '',
      args: [],
    );
  }

  /// `Please check your booking information`
  String get pleaseCheckYourBookingInfo {
    return Intl.message(
      'Please check your booking information',
      name: 'pleaseCheckYourBookingInfo',
      desc: '',
      args: [],
    );
  }

  /// `Not yet`
  String get notYet {
    return Intl.message('Not yet', name: 'notYet', desc: '', args: []);
  }

  /// `Overnight reservations can only be made between 9:00 PM and 1:00 AM the following morning.`
  String get overNightBookingNote {
    return Intl.message(
      'Overnight reservations can only be made between 9:00 PM and 1:00 AM the following morning.',
      name: 'overNightBookingNote',
      desc: '',
      args: [],
    );
  }

  /// `Night`
  String get night {
    return Intl.message('Night', name: 'night', desc: '', args: []);
  }

  /// `Morning`
  String get morning {
    return Intl.message('Morning', name: 'morning', desc: '', args: []);
  }

  /// `Hourly Booking`
  String get hourlyBooking {
    return Intl.message(
      'Hourly Booking',
      name: 'hourlyBooking',
      desc: '',
      args: [],
    );
  }

  /// `Overnight Booking`
  String get overnightBooking {
    return Intl.message(
      'Overnight Booking',
      name: 'overnightBooking',
      desc: '',
      args: [],
    );
  }

  /// `Long-Stay Booking`
  String get longStayBooking {
    return Intl.message(
      'Long-Stay Booking',
      name: 'longStayBooking',
      desc: '',
      args: [],
    );
  }

  /// `Booking Details`
  String get bookingDetails {
    return Intl.message(
      'Booking Details',
      name: 'bookingDetails',
      desc: '',
      args: [],
    );
  }

  /// `Rental Time`
  String get rentalTime {
    return Intl.message('Rental Time', name: 'rentalTime', desc: '', args: []);
  }

  /// `Number of Nights`
  String get numberOfNights {
    return Intl.message(
      'Number of Nights',
      name: 'numberOfNights',
      desc: '',
      args: [],
    );
  }

  /// `Number of Days`
  String get numberOfDays {
    return Intl.message(
      'Number of Days',
      name: 'numberOfDays',
      desc: '',
      args: [],
    );
  }

  /// `Price Details`
  String get priceDetails {
    return Intl.message(
      'Price Details',
      name: 'priceDetails',
      desc: '',
      args: [],
    );
  }

  /// `Room Price`
  String get roomPrice {
    return Intl.message('Room Price', name: 'roomPrice', desc: '', args: []);
  }

  /// `Total Duration`
  String get totalDuration {
    return Intl.message(
      'Total Duration',
      name: 'totalDuration',
      desc: '',
      args: [],
    );
  }

  /// `Subtotal (before discount)`
  String get subtotalBeforeDiscount {
    return Intl.message(
      'Subtotal (before discount)',
      name: 'subtotalBeforeDiscount',
      desc: '',
      args: [],
    );
  }

  /// `Weekend Tax & Fee (1.2%)`
  String get weekendSurcharge {
    return Intl.message(
      'Weekend Tax & Fee (1.2%)',
      name: 'weekendSurcharge',
      desc: '',
      args: [],
    );
  }

  /// `Discount`
  String get discount {
    return Intl.message('Discount', name: 'discount', desc: '', args: []);
  }

  /// `Total Amount`
  String get totalAmount {
    return Intl.message(
      'Total Amount',
      name: 'totalAmount',
      desc: '',
      args: [],
    );
  }

  /// `Payment Method`
  String get paymentMethod {
    return Intl.message(
      'Payment Method',
      name: 'paymentMethod',
      desc: '',
      args: [],
    );
  }

  /// `Pay at Hotel`
  String get payAtHotel {
    return Intl.message('Pay at Hotel', name: 'payAtHotel', desc: '', args: []);
  }

  /// `Pay on Check-In`
  String get payOnCheckIn {
    return Intl.message(
      'Pay on Check-In',
      name: 'payOnCheckIn',
      desc: '',
      args: [],
    );
  }

  /// `ZaloPay Wallet`
  String get zaloPayWallet {
    return Intl.message(
      'ZaloPay Wallet',
      name: 'zaloPayWallet',
      desc: '',
      args: [],
    );
  }

  /// `Pay via ZaloPay e-wallet`
  String get zaloPayDescription {
    return Intl.message(
      'Pay via ZaloPay e-wallet',
      name: 'zaloPayDescription',
      desc: '',
      args: [],
    );
  }

  /// `Credit Card`
  String get creditCard {
    return Intl.message('Credit Card', name: 'creditCard', desc: '', args: []);
  }

  /// `Visa, Mastercard`
  String get creditCardDescription {
    return Intl.message(
      'Visa, Mastercard',
      name: 'creditCardDescription',
      desc: '',
      args: [],
    );
  }

  /// `MoMo Wallet`
  String get momoWallet {
    return Intl.message('MoMo Wallet', name: 'momoWallet', desc: '', args: []);
  }

  /// `Pay via MoMo e-wallet`
  String get momoDescription {
    return Intl.message(
      'Pay via MoMo e-wallet',
      name: 'momoDescription',
      desc: '',
      args: [],
    );
  }

  /// `VNPay`
  String get vnPay {
    return Intl.message('VNPay', name: 'vnPay', desc: '', args: []);
  }

  /// `National Payment Gateway`
  String get vnPayDescription {
    return Intl.message(
      'National Payment Gateway',
      name: 'vnPayDescription',
      desc: '',
      args: [],
    );
  }

  /// `Select Payment Method`
  String get selectPaymentMethod {
    return Intl.message(
      'Select Payment Method',
      name: 'selectPaymentMethod',
      desc: '',
      args: [],
    );
  }

  /// `WAITING FOR RESULT...`
  String get waitingForResult {
    return Intl.message(
      'WAITING FOR RESULT...',
      name: 'waitingForResult',
      desc: '',
      args: [],
    );
  }

  /// `PAY`
  String get payAmount {
    return Intl.message('PAY', name: 'payAmount', desc: '', args: []);
  }

  /// `Waiting for Payment`
  String get waitingForPayment {
    return Intl.message(
      'Waiting for Payment',
      name: 'waitingForPayment',
      desc: '',
      args: [],
    );
  }

  /// `Please complete the payment in the app`
  String get completePaymentOn {
    return Intl.message(
      'Please complete the payment in the app',
      name: 'completePaymentOn',
      desc: '',
      args: [],
    );
  }

  /// `After completing payment, please return to this app`
  String get returnToAppAfterPayment {
    return Intl.message(
      'After completing payment, please return to this app',
      name: 'returnToAppAfterPayment',
      desc: '',
      args: [],
    );
  }

  /// `Check Again`
  String get checkAgain {
    return Intl.message('Check Again', name: 'checkAgain', desc: '', args: []);
  }

  /// `Payment Successful!`
  String get paymentSuccessful {
    return Intl.message(
      'Payment Successful!',
      name: 'paymentSuccessful',
      desc: '',
      args: [],
    );
  }

  /// `The transaction was successful. Please check in on time!`
  String get paymentSuccessMessage {
    return Intl.message(
      'The transaction was successful. Please check in on time!',
      name: 'paymentSuccessMessage',
      desc: '',
      args: [],
    );
  }

  /// `Payment Failed`
  String get paymentFailed {
    return Intl.message(
      'Payment Failed',
      name: 'paymentFailed',
      desc: '',
      args: [],
    );
  }

  /// `The transaction failed. Please try again or choose another payment method.`
  String get paymentFailedMessage {
    return Intl.message(
      'The transaction failed. Please try again or choose another payment method.',
      name: 'paymentFailedMessage',
      desc: '',
      args: [],
    );
  }

  /// `Booking Successful!`
  String get bookingSuccessful {
    return Intl.message(
      'Booking Successful!',
      name: 'bookingSuccessful',
      desc: '',
      args: [],
    );
  }

  /// `Booking confirmed! Please pay on check-in`
  String get bookingSuccessMessage {
    return Intl.message(
      'Booking confirmed! Please pay on check-in',
      name: 'bookingSuccessMessage',
      desc: '',
      args: [],
    );
  }

  /// `Booking and Payment Successful!`
  String get bookingAndPaymentSuccessful {
    return Intl.message(
      'Booking and Payment Successful!',
      name: 'bookingAndPaymentSuccessful',
      desc: '',
      args: [],
    );
  }

  /// `Error: `
  String get errorOccurred {
    return Intl.message('Error: ', name: 'errorOccurred', desc: '', args: []);
  }

  /// `Cannot open payment app:`
  String get cannotOpenPaymentApp {
    return Intl.message(
      'Cannot open payment app:',
      name: 'cannotOpenPaymentApp',
      desc: '',
      args: [],
    );
  }

  /// `hours`
  String get hours {
    return Intl.message('hours', name: 'hours', desc: '', args: []);
  }

  /// `Time`
  String get duration {
    return Intl.message('Time', name: 'duration', desc: '', args: []);
  }

  /// `Unknown Hotel`
  String get unknownHotel {
    return Intl.message(
      'Unknown Hotel',
      name: 'unknownHotel',
      desc: '',
      args: [],
    );
  }

  /// `Unknown location`
  String get unknownLocation {
    return Intl.message(
      'Unknown location',
      name: 'unknownLocation',
      desc: '',
      args: [],
    );
  }

  /// `Check-in`
  String get checkIn {
    return Intl.message('Check-in', name: 'checkIn', desc: '', args: []);
  }

  /// `Check-out`
  String get checkOut {
    return Intl.message('Check-out', name: 'checkOut', desc: '', args: []);
  }

  /// `Standard Room`
  String get standardRoom {
    return Intl.message(
      'Standard Room',
      name: 'standardRoom',
      desc: '',
      args: [],
    );
  }

  /// `Ongoing`
  String get ongoing {
    return Intl.message('Ongoing', name: 'ongoing', desc: '', args: []);
  }

  /// `No check-in`
  String get noCheckIn {
    return Intl.message('No check-in', name: 'noCheckIn', desc: '', args: []);
  }

  /// `Completed`
  String get completed {
    return Intl.message('Completed', name: 'completed', desc: '', args: []);
  }

  /// `Canceled`
  String get canceled {
    return Intl.message('Canceled', name: 'canceled', desc: '', args: []);
  }

  /// `Cancel Booking`
  String get cancelBooking {
    return Intl.message(
      'Cancel Booking',
      name: 'cancelBooking',
      desc: '',
      args: [],
    );
  }

  /// `Yeay, you have completed it!`
  String get yeayCompleted {
    return Intl.message(
      'Yeay, you have completed it!',
      name: 'yeayCompleted',
      desc: '',
      args: [],
    );
  }

  /// `You canceled this hotel booking`
  String get youCanceledBooking {
    return Intl.message(
      'You canceled this hotel booking',
      name: 'youCanceledBooking',
      desc: '',
      args: [],
    );
  }

  /// `You do not have this room`
  String get youNoCheckInBooking {
    return Intl.message(
      'You do not have this room',
      name: 'youNoCheckInBooking',
      desc: '',
      args: [],
    );
  }

  /// `Booking Information`
  String get bookingInformation {
    return Intl.message(
      'Booking Information',
      name: 'bookingInformation',
      desc: '',
      args: [],
    );
  }

  /// `Booking ID`
  String get bookingId {
    return Intl.message('Booking ID', name: 'bookingId', desc: '', args: []);
  }

  /// `Room Type`
  String get roomType {
    return Intl.message('Room Type', name: 'roomType', desc: '', args: []);
  }

  /// `Room Quantity`
  String get roomQuantity {
    return Intl.message(
      'Room Quantity',
      name: 'roomQuantity',
      desc: '',
      args: [],
    );
  }

  /// `Payment Information`
  String get paymentInformation {
    return Intl.message(
      'Payment Information',
      name: 'paymentInformation',
      desc: '',
      args: [],
    );
  }

  /// `Payment Status`
  String get paymentStatus {
    return Intl.message(
      'Payment Status',
      name: 'paymentStatus',
      desc: '',
      args: [],
    );
  }

  /// `Contact Number`
  String get contactNumber {
    return Intl.message(
      'Contact Number',
      name: 'contactNumber',
      desc: '',
      args: [],
    );
  }

  /// `Special Requests`
  String get specialRequests {
    return Intl.message(
      'Special Requests',
      name: 'specialRequests',
      desc: '',
      args: [],
    );
  }

  /// `Contact Hotel`
  String get contactHotel {
    return Intl.message(
      'Contact Hotel',
      name: 'contactHotel',
      desc: '',
      args: [],
    );
  }

  /// `Download Ticket`
  String get downloadTicket {
    return Intl.message(
      'Download Ticket',
      name: 'downloadTicket',
      desc: '',
      args: [],
    );
  }

  /// `Call Hotel`
  String get callHotel {
    return Intl.message('Call Hotel', name: 'callHotel', desc: '', args: []);
  }

  /// `Speak directly with hotel staff`
  String get speakDirectly {
    return Intl.message(
      'Speak directly with hotel staff',
      name: 'speakDirectly',
      desc: '',
      args: [],
    );
  }

  /// `Chat with Hotel`
  String get chatWithHotel {
    return Intl.message(
      'Chat with Hotel',
      name: 'chatWithHotel',
      desc: '',
      args: [],
    );
  }

  /// `Send a message to the hotel`
  String get sendMessage {
    return Intl.message(
      'Send a message to the hotel',
      name: 'sendMessage',
      desc: '',
      args: [],
    );
  }

  /// `Downloading ticket...`
  String get downloadingTicket {
    return Intl.message(
      'Downloading ticket...',
      name: 'downloadingTicket',
      desc: '',
      args: [],
    );
  }

  /// `Ticket downloaded successfully!`
  String get ticketDownloadedSuccess {
    return Intl.message(
      'Ticket downloaded successfully!',
      name: 'ticketDownloadedSuccess',
      desc: '',
      args: [],
    );
  }

  /// `Cancel Booking`
  String get cancelBookingTitle {
    return Intl.message(
      'Cancel Booking',
      name: 'cancelBookingTitle',
      desc: '',
      args: [],
    );
  }

  /// `Are you sure you want to cancel your hotel booking?`
  String get cancelBookingMessage {
    return Intl.message(
      'Are you sure you want to cancel your hotel booking?',
      name: 'cancelBookingMessage',
      desc: '',
      args: [],
    );
  }

  /// `Only 80% of the money you can refund from your payment according to our policy`
  String get refundPolicy {
    return Intl.message(
      'Only 80% of the money you can refund from your payment according to our policy',
      name: 'refundPolicy',
      desc: '',
      args: [],
    );
  }

  /// `Yes, Continue`
  String get yesContinue {
    return Intl.message(
      'Yes, Continue',
      name: 'yesContinue',
      desc: '',
      args: [],
    );
  }

  /// `My Booking`
  String get myBooking {
    return Intl.message('My Booking', name: 'myBooking', desc: '', args: []);
  }

  /// `No ongoing bookings`
  String get noOngoingBookings {
    return Intl.message(
      'No ongoing bookings',
      name: 'noOngoingBookings',
      desc: '',
      args: [],
    );
  }

  /// `Your ongoing bookings will appear here`
  String get ongoingBookingsWillAppear {
    return Intl.message(
      'Your ongoing bookings will appear here',
      name: 'ongoingBookingsWillAppear',
      desc: '',
      args: [],
    );
  }

  /// `No completed bookings`
  String get noCompletedBookings {
    return Intl.message(
      'No completed bookings',
      name: 'noCompletedBookings',
      desc: '',
      args: [],
    );
  }

  /// `Your completed bookings will appear here`
  String get completedBookingsWillAppear {
    return Intl.message(
      'Your completed bookings will appear here',
      name: 'completedBookingsWillAppear',
      desc: '',
      args: [],
    );
  }

  /// `No canceled bookings`
  String get noCanceledBookings {
    return Intl.message(
      'No canceled bookings',
      name: 'noCanceledBookings',
      desc: '',
      args: [],
    );
  }

  /// `Your canceled bookings will appear here`
  String get canceledBookingsWillAppear {
    return Intl.message(
      'Your canceled bookings will appear here',
      name: 'canceledBookingsWillAppear',
      desc: '',
      args: [],
    );
  }

  /// `Error loading bookings`
  String get errorLoadingBookings {
    return Intl.message(
      'Error loading bookings',
      name: 'errorLoadingBookings',
      desc: '',
      args: [],
    );
  }

  /// `Retry`
  String get retry {
    return Intl.message('Retry', name: 'retry', desc: '', args: []);
  }

  /// `Paid`
  String get paid {
    return Intl.message('Paid', name: 'paid', desc: '', args: []);
  }

  /// `Unpaid`
  String get unpaid {
    return Intl.message('Unpaid', name: 'unpaid', desc: '', args: []);
  }

  /// `Partially Paid`
  String get partiallyPaid {
    return Intl.message(
      'Partially Paid',
      name: 'partiallyPaid',
      desc: '',
      args: [],
    );
  }

  /// `Partial`
  String get partial {
    return Intl.message('Partial', name: 'partial', desc: '', args: []);
  }

  /// `Refunded`
  String get refunded {
    return Intl.message('Refunded', name: 'refunded', desc: '', args: []);
  }

  /// `N/A`
  String get notAvailable {
    return Intl.message('N/A', name: 'notAvailable', desc: '', args: []);
  }

  /// `VNPay`
  String get vnpay {
    return Intl.message('VNPay', name: 'vnpay', desc: '', args: []);
  }

  /// `MoMo`
  String get momo {
    return Intl.message('MoMo', name: 'momo', desc: '', args: []);
  }

  /// `ZaloPay`
  String get zalopay {
    return Intl.message('ZaloPay', name: 'zalopay', desc: '', args: []);
  }

  /// `Cash`
  String get cash {
    return Intl.message('Cash', name: 'cash', desc: '', args: []);
  }

  /// `No`
  String get no {
    return Intl.message('No', name: 'no', desc: '', args: []);
  }

  /// `Loading...`
  String get loading {
    return Intl.message('Loading...', name: 'loading', desc: '', args: []);
  }

  /// `Success`
  String get success {
    return Intl.message('Success', name: 'success', desc: '', args: []);
  }

  /// `Failed`
  String get failed {
    return Intl.message('Failed', name: 'failed', desc: '', args: []);
  }

  /// `Share`
  String get share {
    return Intl.message('Share', name: 'share', desc: '', args: []);
  }

  /// `Phone`
  String get phone {
    return Intl.message('Phone', name: 'phone', desc: '', args: []);
  }

  /// `Chat`
  String get chat {
    return Intl.message('Chat', name: 'chat', desc: '', args: []);
  }

  /// `Download`
  String get download {
    return Intl.message('Download', name: 'download', desc: '', args: []);
  }

  /// `Price Range`
  String get priceRange {
    return Intl.message('Price Range', name: 'priceRange', desc: '', args: []);
  }

  /// `Highest popularity`
  String get highestPopularity {
    return Intl.message(
      'Highest popularity',
      name: 'highestPopularity',
      desc: '',
      args: [],
    );
  }

  /// `Highest price`
  String get highestPrice {
    return Intl.message(
      'Highest price',
      name: 'highestPrice',
      desc: '',
      args: [],
    );
  }

  /// `Lowest price`
  String get lowestPrice {
    return Intl.message(
      'Lowest price',
      name: 'lowestPrice',
      desc: '',
      args: [],
    );
  }

  /// `Select arrival date`
  String get selectYourArrivalDate {
    return Intl.message(
      'Select arrival date',
      name: 'selectYourArrivalDate',
      desc: '',
      args: [],
    );
  }

  /// `Select travel date`
  String get selectTravelDate {
    return Intl.message(
      'Select travel date',
      name: 'selectTravelDate',
      desc: '',
      args: [],
    );
  }

  /// `Sort Results`
  String get sortResults {
    return Intl.message(
      'Sort Results',
      name: 'sortResults',
      desc: '',
      args: [],
    );
  }

  /// `Filter Hotel`
  String get filterHotel {
    return Intl.message(
      'Filter Hotel',
      name: 'filterHotel',
      desc: '',
      args: [],
    );
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
