import 'dart:io';
import 'package:doan_datphong/Blocs/fillProfile_Blocs/fillProfile_bloc.dart';
import 'package:doan_datphong/Blocs/fillProfile_Blocs/fillProfile_event.dart';
import 'package:doan_datphong/Blocs/fillProfile_Blocs/fillProfile_state.dart';
import 'package:doan_datphong/Models/NguoiDung.dart';
import 'package:doan_datphong/Views/home_View/home_screen.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:doan_datphong/generated/l10n.dart'; // ✅ Thêm import

enum Gender { male, female }

class FillProfile extends StatefulWidget {
  const FillProfile({super.key});

  @override
  State<FillProfile> createState() => _FillProfileState();
}

class _FillProfileState extends State<FillProfile> {
  final _formKey = GlobalKey<FormState>();
  File? _image;
  final picker = ImagePicker();

  // ✅ Sẽ được dynamic từ S.of(context)
  List<String> get genders => [S.of(context).male, S.of(context).female];

  String? errorPhoneNumber;
  String? errorFullName;
  String? errorGender;
  String? errorDoB;

  String? _selectedGender;

  TextEditingController fullNameController = TextEditingController();
  TextEditingController phoneNumberController = TextEditingController();
  TextEditingController calendarController = TextEditingController();

  Future<String?> getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    String? userJson = prefs.getString("user");

    if (userJson != null) {
      NguoiDung user = NguoiDung.fromJsonString(userJson);
      return user.id;
    }
    return null;
  }

  void updateUser() async{
    validFullNameCheck(fullNameController.text);
    validPhoneNumberCheck(phoneNumberController.text);
    validGenderCheck(_selectedGender ?? "");
    validDateOfBirthCheck(calendarController.text);

    String? user_id= await getUserId();
    if (_formKey.currentState!.validate() &&
        errorFullName == null &&
        errorPhoneNumber == null &&
        errorGender == null &&
        errorDoB == null) {
      NguoiDung user = NguoiDung.short(
        id: user_id ?? "",
        tenNguoiDung: fullNameController.text,
        soDienThoai: phoneNumberController.text,
        gioiTinh: (_selectedGender == genders[0] ? true : false),
        ngaySinh: calendarController.text,
        hinhDaiDien: _image!.path,
      );
      context.read<FillProfileBloc>().add(
        FillProfileSubmiited(user),
      );
    }
  }

  void validGenderCheck(String value){
    if(value.isEmpty){
      setState(() {
        errorGender = _selectedGender == null ? S.of(context).pleaseSelectGender : null; // ✅
      });
    }else{
      setState(() {
        errorGender = null;
      });
    }
  }

  void validDateOfBirthCheck(String value){
    if(value.isEmpty){
      setState(() {
        errorDoB = calendarController.text.isEmpty ? S.of(context).pleaseSelectDateOfBirth : null; // ✅
      });
    }else{
      setState(() {
        errorDoB = null;
      });
    }
  }

  void validFullNameCheck(String value){
    if(value.isEmpty){
      setState(() {
        errorFullName = S.of(context).pleaseEnterFullName; // ✅
      });
    }else if (!RegExp(r"^[a-zA-ZÀ-ỹ\s]+$").hasMatch(value)){
      setState(() {
        errorFullName = S.of(context).nameCannotContainSpecialCharacters; // ✅
      });
    }else {
      setState(() {
        errorFullName = null;
      });
    }
  }

  void validPhoneNumberCheck(String value) {
    final phoneRegex = RegExp(r"^0[0-9]{9}$");
    if (value.isEmpty) {
      setState(() {
        errorPhoneNumber = S.of(context).pleaseEnterPhoneNumber; // ✅
      });
    } else if (!phoneRegex.hasMatch(value)) {
      setState(() {
        errorPhoneNumber = S.of(context).invalidPhoneNumber; // ✅
      });
    } else {
      setState(() {
        errorPhoneNumber = null;
      });
    }
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picker = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (picker != null) {
      setState(() {
        calendarController.text = DateFormat('dd/MM/yyyy').format(picker);
      });
    }
  }

  Future<void> pickImage() async {
    showModalBottomSheet(
      context: context,
      builder: (context) => Wrap(
        children: [
          ListTile(
            leading: Icon(Icons.camera),
            title: Text(S.of(context).takePhoto), // ✅
            onTap: () async {
              Navigator.pop(context);
              await getImage(ImageSource.camera);
            },
          ),
          ListTile(
            leading: Icon(Icons.photo_library),
            title: Text(S.of(context).chooseFromGallery), // ✅
            onTap: () async {
              Navigator.pop(context);
              await getImage(ImageSource.gallery);
            },
          ),
        ],
      ),
    );
  }

  Future<void> getImage(ImageSource source) async {
    final pickedFile = await picker.pickImage(source: source);
    if (pickedFile != null) {
      setState(() {
        _image = File(pickedFile.path);
      });
    }else {
      setState(() {
        _image =null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<FillProfileBloc,FillProfileState>(
      listener: (context,state){
        if(state is FillProfileSuccess){
          Navigator.pushReplacement(context,
              MaterialPageRoute(builder: (context) => HomeScreen(user: state.user)));
        }else if (state is FillProfileFailure){
          ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.errorMessage??""))
          );
        }
      },
      child: SafeArea(
        child: Scaffold(
          appBar: AppBar(
            leading: IconButton(
              icon: Icon(Icons.arrow_back),
              onPressed: () {
                Navigator.pop(context);
              },
            ),
            title: Text(
              S.of(context).fillYourProfile, // ✅
              style: TextStyle(
                fontFamily: 'Lato Semibold',
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          body: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Center(
                      child: GestureDetector(
                        onTap: pickImage,
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            CircleAvatar(
                              radius: 70,
                              backgroundColor: Colors.transparent,
                              backgroundImage:
                              _image != null
                                  ? FileImage(_image!)
                                  : AssetImage('assets/images/default_user.jpg'),
                            ),
                            Positioned(
                              bottom: 0,
                              right: 10,
                              child: Container(
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Color(0xFF14D9E1),
                                ),
                                padding: EdgeInsets.all(5),
                                child: Icon(
                                  Icons.edit,
                                  color: Colors.white,
                                  size: 20,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 60),
                    TextFormField(
                      controller: fullNameController,
                      style: TextStyle(fontFamily: 'Lato Semibold'),
                      onChanged: validFullNameCheck,
                      decoration: InputDecoration(
                        errorText: errorFullName,
                        filled: true,
                        fillColor: Color(0xFFF1F1F1),
                        hintText: S.of(context).fullName, // ✅
                        hintStyle: TextStyle(
                          fontWeight: FontWeight.w400,
                          fontStyle: FontStyle.italic,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide(
                            color: Color(0xFF16F1FA),
                            width: 2,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 15),

                    DropdownButtonFormField<String>(
                      value: _selectedGender,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Color(0xFFF1F1F1),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide(
                            color: Color(0xFF16F1FA),
                            width: 2,
                          ),
                        ),
                      ),
                      hint: Text(S.of(context).selectGender, // ✅
                          style: TextStyle(
                              fontStyle: FontStyle.italic,
                              fontWeight: FontWeight.w500
                          )),
                      items: genders.map((String gender) {
                        return DropdownMenuItem<String>(
                          value: gender,
                          child: Text(gender,
                              style: TextStyle(fontWeight: FontWeight.normal)),
                        );
                      }).toList(),
                      onChanged: (String? newValue){
                        setState(() {
                          _selectedGender = newValue;
                        });
                      },
                    ),

                    const SizedBox(height: 15),

                    TextFormField(
                      controller: calendarController,
                      onChanged: validDateOfBirthCheck,
                      style: TextStyle(fontFamily: 'Lato Semibold'),
                      readOnly: true,
                      decoration: InputDecoration(
                        errorText: errorDoB,
                        filled: true,
                        fillColor: Color(0xFFF1F1F1),
                        hintText: S.of(context).dateOfBirth, // ✅
                        hintStyle: TextStyle(
                          fontWeight: FontWeight.w400,
                          fontStyle: FontStyle.italic,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide(
                            color: Color(0xFF16F1FA),
                            width: 2,
                          ),
                        ),
                        suffixIcon: IconButton(
                          onPressed: () {
                            _selectDate(context);
                          },
                          icon: Icon(Icons.calendar_month),
                        ),
                      ),
                    ),
                    const SizedBox(height: 15),
                    TextFormField(
                      controller: phoneNumberController,
                      onChanged: validPhoneNumberCheck,
                      decoration: InputDecoration(
                        counterText: "",
                        errorText: errorPhoneNumber,
                        filled: true,
                        fillColor: Color(0xFFF1F1F1),
                        hintText: S.of(context).phoneNumber, // ✅
                        hintStyle: TextStyle(
                          fontWeight: FontWeight.w400,
                          fontStyle: FontStyle.italic,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide.none,
                        ),
                        suffixIcon: Icon(Icons.phone),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide(
                            color: Color(0xFF16F1FA),
                            width: 2,
                          ),
                        ),
                      ),
                      inputFormatters: [
                        LengthLimitingTextInputFormatter(10),
                        FilteringTextInputFormatter.digitsOnly,
                      ],
                      keyboardType: TextInputType.number,
                    ),

                    const SizedBox(height: 150),

                    SizedBox(
                      width: MediaQuery.of(context).size.width * 0.8,
                      child: ElevatedButton(
                        onPressed: () {
                          updateUser();
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Color(0xFF16F1FA),
                          foregroundColor: Colors.white,
                          padding: EdgeInsets.symmetric(vertical: 10),
                        ),
                        child: Text(S.of(context).continueText, // ✅
                            style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 17
                            )),
                      ),
                    )
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}