import 'dart:io';
import 'package:doan_datphong/Blocs/fillProfile_Blocs/fillProfile_bloc.dart';
import 'package:doan_datphong/Blocs/fillProfile_Blocs/fillProfile_event.dart';
import 'package:doan_datphong/Blocs/fillProfile_Blocs/fillProfile_state.dart';
import 'package:doan_datphong/Models/NguoiDung.dart';
import 'package:doan_datphong/Models/ViTri.dart';
import 'package:doan_datphong/Views/home_View/home_screen.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:doan_datphong/generated/l10n.dart';
import '../../Data/Repository/addressService_Repository/addressService_repo.dart';

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

  // Danh sách từ API
  List<Province> provinces = [];
  List<District> districts = [];
  List<Ward> wards = [];

  // Loading states
  bool isLoadingProvinces = true;
  bool isLoadingDistricts = false;
  bool isLoadingWards = false;

  List<String> get genders => [S.of(context).male, S.of(context).female];

  String? errorPhoneNumber;
  String? errorFullName;
  String? errorGender;
  String? errorDoB;
  String? errorProvince;
  String? errorDistrict;
  String? errorWard;
  String? errorAddress;

  String? _selectedGender;
  Province? _selectedProvince;
  District? _selectedDistrict;
  Ward? _selectedWard;

  TextEditingController fullNameController = TextEditingController();
  TextEditingController phoneNumberController = TextEditingController();
  TextEditingController calendarController = TextEditingController();
  TextEditingController addressController = TextEditingController();

  @override
  void initState() {
    super.initState();
    loadProvinces();
  }

  @override
  void dispose() {
    fullNameController.dispose();
    phoneNumberController.dispose();
    calendarController.dispose();
    addressController.dispose();
    super.dispose();
  }

  // Load provinces from API
  Future<void> loadProvinces() async {
    try {
      setState(() {
        isLoadingProvinces = true;
        errorProvince = null;
      });

      final loadedProvinces = await AddressService.getProvinces();
      setState(() {
        provinces = loadedProvinces;
        isLoadingProvinces = false;
      });
    } catch (e) {
      setState(() {
        isLoadingProvinces = false;
        errorProvince = 'Không thể tải danh sách tỉnh/thành phố';
      });
    }
  }

  // Load districts when province selected
  Future<void> loadDistricts(String provinceCode) async {
    try {
      setState(() {
        isLoadingDistricts = true;
        districts = [];
        wards = [];
        _selectedDistrict = null;
        _selectedWard = null;
        errorDistrict = null;
        errorWard = null;
      });

      final loadedDistricts = await AddressService.getDistricts(provinceCode);
      setState(() {
        districts = loadedDistricts;
        isLoadingDistricts = false;
      });
    } catch (e) {
      setState(() {
        isLoadingDistricts = false;
        errorDistrict = 'Không thể tải danh sách quận/huyện';
      });
    }
  }

  // Load wards when district selected
  Future<void> loadWards(String districtCode) async {
    try {
      setState(() {
        isLoadingWards = true;
        wards = [];
        _selectedWard = null;
        errorWard = null;
      });

      final loadedWards = await AddressService.getWards(districtCode);
      setState(() {
        wards = loadedWards;
        isLoadingWards = false;
      });
    } catch (e) {
      setState(() {
        isLoadingWards = false;
        errorWard = 'Không thể tải danh sách phường/xã';
      });
    }
  }
  DateTime? _parseDate(String? dateString) {
    print("=== PARSE DATE DEBUG ===");
    print("Input dateString: '$dateString'");
    print("dateString != null: ${dateString != null}");
    print("dateString.isNotEmpty: ${dateString?.isNotEmpty}");

    if (dateString == null || dateString.isEmpty) {
      print("❌ dateString is null or empty");
      return null;
    }

    try {
      String cleanedDate = dateString.trim();
      print("Cleaned date: '$cleanedDate'");

      // ✅ Kiểm tra format trước khi parse
      RegExp dateRegex = RegExp(r'^\d{2}/\d{2}/\d{4}$');
      if (!dateRegex.hasMatch(cleanedDate)) {
        print("❌ Date format invalid. Expected: dd/MM/yyyy");
        return null;
      }

      DateTime parsed = DateFormat('dd/MM/yyyy').parse(cleanedDate);
      print("✅ Parsed successfully: $parsed");
      print("✅ ISO string: ${parsed.toIso8601String()}");

      return parsed;
    } catch (e) {
      print('❌ Lỗi parse date "$dateString": $e');
      return null;
    }
  }
  // DateTime? _parseDate(String dateString) {
  //   if (dateString.isEmpty) return null;
  //   try {
  //     return DateFormat('dd/MM/yyyy').parse(dateString);
  //   } catch (e) {
  //     return null;
  //   }
  // }

  Future<String?> getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    String? userToken = prefs.getString("user");

    if (userToken != null) {
      NguoiDung user = NguoiDung.fromJsonString(userToken);
      return user.id;
    }
    return null;
  }

  void updateUser() async {
    validFullNameCheck(fullNameController.text);
    validPhoneNumberCheck(phoneNumberController.text);
    validGenderCheck(_selectedGender ?? "");
    validDateOfBirthCheck(calendarController.text);
    validProvinceCheck(_selectedProvince?.name ?? "");
    validDistrictCheck(_selectedDistrict?.name ?? "");
    validWardCheck(_selectedWard?.name ?? "");
    validAddressCheck(addressController.text);

    String? user_id = await getUserId();
    print("Id của user: ${user_id}");

    if (_formKey.currentState!.validate() &&
        errorFullName == null &&
        errorPhoneNumber == null &&
        errorGender == null &&
        errorDoB == null &&
        errorProvince == null &&
        errorDistrict == null &&
        errorWard == null &&
        errorAddress == null) {

      try {
        // ✅ Debug ngày sinh chi tiết
        print("=== NGAY SINH DEBUG ===");
        print("calendarController.text: '${calendarController.text}'");

        DateTime? parsedDate = _parseDate(calendarController.text);
        print("Parsed date: $parsedDate");

        if (parsedDate != null) {
          print("Parsed date ISO: ${parsedDate.toIso8601String()}");
        } else {
          print("❌ PARSED DATE IS NULL!");
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text("Vui lòng chọn ngày sinh hợp lệ")),
          );
          return;
        }

        // Tạo object ViTri
        ViTri viTri = ViTri(
          thanhPho: _selectedProvince?.name,
          quan: _selectedDistrict?.name,
          phuong: _selectedWard?.name,
          soNha: addressController.text,
        );

        // ✅ Tạo user với ngày sinh đã được validate
        NguoiDung user = NguoiDung.short(
          id: user_id ?? "",
          tenNguoiDung: fullNameController.text,
          soDienThoai: phoneNumberController.text,
          gioiTinh: (_selectedGender == genders[0] ? true : false),
          ngaySinh: parsedDate, // ✅ Sử dụng parsedDate đã kiểm tra
          hinhDaiDien: _image?.path ?? '',
        );

        // Cập nhật vị trí cho user
        user.viTri = viTri;

        print("=== USER FINAL CHECK ===");
        print("user.ngaySinh: ${user.ngaySinh}");
        print("user.ngaySinh != null: ${user.ngaySinh != null}");

        if (user.ngaySinh != null) {
          print("user.ngaySinh ISO: ${user.ngaySinh!.toIso8601String()}");
        } else {
          print("❌ USER NGAY SINH IS NULL!");
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text("Lỗi xử lý ngày sinh")),
          );
          return;
        }

        // Gửi đến Bloc
        context.read<FillProfileBloc>().add(
          FillProfileSubmiited(user),
        );

      } catch (e) {
        print("❌ Lỗi trong updateUser: $e");
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Có lỗi xảy ra: ${e.toString()}")),
        );
      }
    }
  }


  // void updateUser() async {
  //   validFullNameCheck(fullNameController.text);
  //   validPhoneNumberCheck(phoneNumberController.text);
  //   validGenderCheck(_selectedGender ?? "");
  //   validDateOfBirthCheck(calendarController.text);
  //   validProvinceCheck(_selectedProvince?.name ?? "");
  //   validDistrictCheck(_selectedDistrict?.name ?? "");
  //   validWardCheck(_selectedWard?.name ?? "");
  //   validAddressCheck(addressController.text);
  //
  //   String? user_id = await getUserId();
  //   print("Id của user: ${user_id}");
  //   if (_formKey.currentState!.validate() &&
  //       errorFullName == null &&
  //       errorPhoneNumber == null &&
  //       errorGender == null &&
  //       errorDoB == null &&
  //       errorProvince == null &&
  //       errorDistrict == null &&
  //       errorWard == null &&
  //       errorAddress == null) {
  //
  //     // Tạo object ViTri
  //     ViTri viTri = ViTri(
  //       thanhPho: _selectedProvince?.name,
  //       quan: _selectedDistrict?.name,
  //       phuong: _selectedWard?.name,
  //       soNha: addressController.text,
  //     );
  //
  //     NguoiDung user = NguoiDung.short(
  //       id: user_id ?? "",
  //
  //       tenNguoiDung: fullNameController.text,
  //       soDienThoai: phoneNumberController.text,
  //       gioiTinh: (_selectedGender == genders[0] ? true : false),
  //       ngaySinh: _parseDate(calendarController.text),
  //       hinhDaiDien: _image?.path ?? '',
  //     );
  //     // Cập nhật vị trí cho user
  //     user.viTri = viTri;
  //     print("=== USER OBJECT DEBUG ===");
  //     print("gia tri ngay sinh: ${user.ngaySinh}");
  //     print("ngay sinh ISO: ${user.ngaySinh?.toIso8601String()}");
  //     print("ngay tao: ${user.ngayTao}");
  //     print("ngay tao ISO: ${user.ngayTao.toIso8601String()}");
  //
  //     context.read<FillProfileBloc>().add(
  //       FillProfileSubmiited(user),
  //     );
  //   }
  // }

  // Validation methods
  void validGenderCheck(String value) {
    if (value.isEmpty) {
      setState(() {
        errorGender = _selectedGender == null ? S.of(context).pleaseSelectGender : null;
      });
    } else {
      setState(() {
        errorGender = null;
      });
    }
  }

  // ✅ Cập nhật method validation cho ngày sinh
  void validDateOfBirthCheck(String? value) {
    // Kiểm tra null safety trước
    if (value == null || value.isEmpty) {
      setState(() {
        errorDoB = S.of(context).pleaseSelectDateOfBirth;
      });
      return;
    }

    // Parse ngày sinh và kiểm tra tuổi
    try {
      DateTime? birthDate = _parseDate(value);
      if (birthDate == null) {
        setState(() {
          errorDoB = "Định dạng ngày không hợp lệ";
        });
        return;
      }

      // Tính tuổi
      DateTime today = DateTime.now();
      int age = today.year - birthDate.year;

      // Điều chỉnh tuổi nếu chưa qua sinh nhật trong năm nay
      if (today.month < birthDate.month ||
          (today.month == birthDate.month && today.day < birthDate.day)) {
        age--;
      }

      // Kiểm tra tuổi trong khoảng 16-100
      if (age < 16) {
        setState(() {
          errorDoB = S.of(context).notOldEnough;
        });
      } else {
        setState(() {
          errorDoB = null; // Tuổi hợp lệ
        });
      }

    } catch (e) {
      setState(() {
        errorDoB = S.of(context).invalidAge;
      });
    }
  }

  void validFullNameCheck(String value) {
    if (value.isEmpty) {
      setState(() {
        errorFullName = S.of(context).pleaseEnterFullName;
      });
    } else if (!RegExp(r"^[a-zA-ZÀ-ỹ\s]+$").hasMatch(value)) {
      setState(() {
        errorFullName = S.of(context).nameCannotContainSpecialCharacters;
      });
    } else {
      setState(() {
        errorFullName = null;
      });
    }
  }

  void validPhoneNumberCheck(String value) {
    final phoneRegex = RegExp(r"^0[0-9]{9}$");
    if (value.isEmpty) {
      setState(() {
        errorPhoneNumber = S.of(context).pleaseEnterPhoneNumber;
      });
    } else if (!phoneRegex.hasMatch(value)) {
      setState(() {
        errorPhoneNumber = S.of(context).invalidPhoneNumber;
      });
    } else {
      setState(() {
        errorPhoneNumber = null;
      });
    }
  }

  void validProvinceCheck(String value) {
    if (value.isEmpty) {
      setState(() {
        errorProvince = "Vui lòng chọn tỉnh/thành phố";
      });
    } else {
      setState(() {
        errorProvince = null;
      });
    }
  }

  void validDistrictCheck(String value) {
    if (value.isEmpty) {
      setState(() {
        errorDistrict = "Vui lòng chọn quận/huyện";
      });
    } else {
      setState(() {
        errorDistrict = null;
      });
    }
  }

  void validWardCheck(String value) {
    if (value.isEmpty) {
      setState(() {
        errorWard = "Vui lòng chọn phường/xã";
      });
    } else {
      setState(() {
        errorWard = null;
      });
    }
  }

  void validAddressCheck(String value) {
    if (value.isEmpty) {
      setState(() {
        errorAddress = "Vui lòng nhập số nhà, tên đường";
      });
    } else {
      setState(() {
        errorAddress = null;
      });
    }
  }

  Future<void> _selectDate(BuildContext context) async {
    try {
      // Tính toán ngày sinh phù hợp (18-100 tuổi)
      final DateTime maxDate = DateTime.now().subtract(Duration(days: 365 * 16));
      final DateTime minDate = DateTime.now().subtract(Duration(days: 365 * 100));

      DateTime initialDate;
      if (calendarController.text.isNotEmpty) {
        DateTime? currentDate = _parseDate(calendarController.text);
        if (currentDate != null &&
            currentDate.isAfter(minDate) &&
            currentDate.isBefore(maxDate.add(Duration(days: 1)))) {
          initialDate = currentDate;
        } else {
          initialDate = DateTime.now().subtract(Duration(days: 365 * 25)); // 25 tuổi
        }
      } else {
        initialDate = DateTime.now().subtract(Duration(days: 365 * 25)); // 25 tuổi
      }

      final DateTime? picker = await showDatePicker(
        context: context,
        initialDate: initialDate,
        firstDate: minDate,
        lastDate: maxDate,
        helpText: 'Chọn ngày sinh của bạn',
        cancelText: 'Hủy',
        confirmText: 'Xác nhận',
        fieldLabelText: 'Ngày sinh',
        fieldHintText: 'dd/MM/yyyy',
        errorFormatText: 'Vui lòng nhập đúng định dạng dd/MM/yyyy',
        errorInvalidText: 'Ngày sinh không hợp lệ',
        initialEntryMode: DatePickerEntryMode.calendar,
        // ✅ Custom builder để tùy chỉnh giao diện
        builder: (BuildContext context, Widget? child) {
          return Theme(
            data: Theme.of(context).copyWith(
              colorScheme: Theme.of(context).colorScheme.copyWith(
                primary: Color(0xFF1565C0), // Màu chính của app
                onPrimary: Colors.white,
              ),
            ),
            child: child!,
          );
        },
      );

      if (picker != null) {
        // ✅ Double check tuổi trước khi set
        int age = DateTime.now().year - picker.year;
        if (DateTime.now().month < picker.month ||
            (DateTime.now().month == picker.month && DateTime.now().day < picker.day)) {
          age--;
        }

        if (age >= 16 && age <= 100) {
          setState(() {
            calendarController.text = DateFormat('dd/MM/yyyy').format(picker);
            validDateOfBirthCheck(calendarController.text);
          });
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Tuổi phải từ 16 đến 100. Bạn đã chọn: $age tuổi'),
                backgroundColor: Colors.orange,
              ),
            );
          }
        }
      }
    } catch (e) {
      print('Lỗi khi chọn ngày: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Có lỗi xảy ra. Vui lòng thử lại.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

// ✅ Helper method để validate ngày đã chọn
  bool _isValidBirthDate(DateTime date) {
    final now = DateTime.now();
    final age = now.year - date.year;
    final adjustedAge = (now.month < date.month ||
        (now.month == date.month && now.day < date.day))
        ? age - 1 : age;

    return adjustedAge >= 16 && adjustedAge <= 100;
  }


  Future<void> pickImage() async {
    showModalBottomSheet(
      context: context,
      builder: (context) => Wrap(
        children: [
          ListTile(
            leading: Icon(Icons.camera),
            title: Text(S.of(context).takePhoto),
            onTap: () async {
              Navigator.pop(context);
              await getImage(ImageSource.camera);
            },
          ),
          ListTile(
            leading: Icon(Icons.photo_library),
            title: Text(S.of(context).chooseFromGallery),
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
    } else {
      setState(() {
        _image = null;
      });
    }
  }

  Widget _buildDropdown<T>({
    required String hint,
    required T? value,
    required List<T> items,
    required String Function(T) getLabel,
    required void Function(T?) onChanged,
    required bool isLoading,
    String? errorText,
    bool enabled = true,
  }) {
    return DropdownButtonFormField<T>(
      value: value,
      hint: Text(hint, style: TextStyle(fontStyle: FontStyle.italic, fontWeight: FontWeight.w500)),
      decoration: InputDecoration(
        filled: true,
        fillColor: enabled ? Color(0xFFF1F1F1) : Colors.grey[200],
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Color(0xFF16F1FA), width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.red),
        ),
        errorText: errorText,
        suffixIcon: isLoading
            ? SizedBox(
          width: 20,
          height: 20,
          child: Padding(
            padding: EdgeInsets.all(12),
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        )
            : null,
      ),
      items: enabled && !isLoading
          ? items.map((item) {
        return DropdownMenuItem<T>(
          value: item,
          child: Text(getLabel(item), style: TextStyle(fontWeight: FontWeight.normal)),
        );
      }).toList()
          : [],
      onChanged: enabled && !isLoading ? onChanged : null,
    );
  }

  Widget _buildAddressSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 20),
        Text(
          'Thông tin địa chỉ',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF404040),
          ),
        ),
        const SizedBox(height: 15),

        // Dropdown tỉnh/thành phố
        _buildDropdown<Province>(
          hint: 'Chọn tỉnh/thành phố',
          value: _selectedProvince,
          items: provinces,
          getLabel: (province) => province.name,
          isLoading: isLoadingProvinces,
          errorText: errorProvince,
          onChanged: (Province? newValue) {
            setState(() {
              _selectedProvince = newValue;
              validProvinceCheck(newValue?.name ?? "");
            });
            if (newValue != null) {
              loadDistricts(newValue.code);
            }
          },
        ),
        const SizedBox(height: 15),

        // Dropdown quận/huyện
        _buildDropdown<District>(
          hint: 'Chọn quận/huyện',
          value: _selectedDistrict,
          items: districts,
          getLabel: (district) => district.name,
          isLoading: isLoadingDistricts,
          errorText: errorDistrict,
          enabled: _selectedProvince != null,
          onChanged: (District? newValue) {
            setState(() {
              _selectedDistrict = newValue;
              validDistrictCheck(newValue?.name ?? "");
            });
            if (newValue != null) {
              loadWards(newValue.code);
            }
          },
        ),
        const SizedBox(height: 15),

        // Dropdown phường/xã
        _buildDropdown<Ward>(
          hint: 'Chọn phường/xã',
          value: _selectedWard,
          items: wards,
          getLabel: (ward) => ward.name,
          isLoading: isLoadingWards,
          errorText: errorWard,
          enabled: _selectedDistrict != null,
          onChanged: (Ward? newValue) {
            setState(() {
              _selectedWard = newValue;
              validWardCheck(newValue?.name ?? "");
            });
          },
        ),
        const SizedBox(height: 15),

        // TextField số nhà, tên đường
        TextFormField(
          controller: addressController,
          onChanged: validAddressCheck,
          style: TextStyle(fontFamily: 'Lato Semibold'),
          decoration: InputDecoration(
            errorText: errorAddress,
            filled: true,
            fillColor: Color(0xFFF1F1F1),
            hintText: 'Số nhà, tên đường',
            hintStyle: TextStyle(
              fontWeight: FontWeight.w400,
              fontStyle: FontStyle.italic,
            ),
            prefixIcon: Icon(Icons.home),
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

        // Hiển thị địa chỉ đầy đủ
        if (_selectedProvince != null || _selectedDistrict != null || _selectedWard != null || addressController.text.isNotEmpty)
          Container(
            margin: EdgeInsets.only(top: 15),
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.blue[200]!),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Địa chỉ đầy đủ:',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.blue[800],
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  [
                    if (addressController.text.isNotEmpty) addressController.text,
                    _selectedWard?.name,
                    _selectedDistrict?.name,
                    _selectedProvince?.name,
                  ].where((e) => e != null && e.isNotEmpty).join(', '),
                  style: TextStyle(color: Colors.blue[700]),
                ),
              ],
            ),
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<FillProfileBloc, FillProfileState>(
      listener: (context, state) {
        if (state is FillProfileSuccess) {
          Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                  builder: (context) => HomeScreen(user: state.user)));
        } else if (state is FillProfileFailure) {
          print("Lôỗi ngy sinh: ${state.errorMessage}");
          ScaffoldMessenger.of(context).showSnackBar(

              SnackBar(content: Text(state.errorMessage ?? "")));
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
              S.of(context).fillYourProfile,
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
                    // Profile picture section
                    Center(
                      child: GestureDetector(
                        onTap: pickImage,
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            CircleAvatar(
                              radius: 70,
                              backgroundColor: Colors.transparent,
                              backgroundImage: _image != null
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
                    const SizedBox(height: 30),

                    // Personal information section
                    Text(
                      'Thông tin cá nhân',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF404040),
                      ),
                    ),
                    const SizedBox(height: 15),

                    // Full name field
                    TextFormField(
                      controller: fullNameController,
                      style: TextStyle(fontFamily: 'Lato Semibold'),
                      onChanged: validFullNameCheck,
                      decoration: InputDecoration(
                        errorText: errorFullName,
                        filled: true,
                        fillColor: Color(0xFFF1F1F1),
                        hintText: S.of(context).fullName,
                        hintStyle: TextStyle(
                          fontWeight: FontWeight.w400,
                          fontStyle: FontStyle.italic,
                        ),
                        prefixIcon: Icon(Icons.person),
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

                    // Gender dropdown
                    DropdownButtonFormField<String>(
                      value: _selectedGender,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Color(0xFFF1F1F1),
                        prefixIcon: Icon(Icons.person_outline),
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
                        errorText: errorGender,
                      ),
                      hint: Text(S.of(context).selectGender,
                          style: TextStyle(
                              fontStyle: FontStyle.italic,
                              fontWeight: FontWeight.w500)),
                      items: genders.map((String gender) {
                        return DropdownMenuItem<String>(
                          value: gender,
                          child: Text(gender,
                              style: TextStyle(fontWeight: FontWeight.normal)),
                        );
                      }).toList(),
                      onChanged: (String? newValue) {
                        setState(() {
                          _selectedGender = newValue;
                          validGenderCheck(newValue ?? "");
                        });
                      },
                    ),
                    const SizedBox(height: 15),

                    // Date of birth field
                    TextFormField(
                      controller: calendarController,
                      onChanged: validDateOfBirthCheck,
                      style: TextStyle(fontFamily: 'Lato Semibold'),
                      readOnly: true,
                      decoration: InputDecoration(
                        errorText: errorDoB,
                        filled: true,
                        fillColor: Color(0xFFF1F1F1),
                        hintText: S.of(context).dateOfBirth,
                        hintStyle: TextStyle(
                          fontWeight: FontWeight.w400,
                          fontStyle: FontStyle.italic,
                        ),
                        prefixIcon: Icon(Icons.calendar_today),
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

                    // Phone number field
                    TextFormField(
                      controller: phoneNumberController,
                      onChanged: validPhoneNumberCheck,
                      decoration: InputDecoration(
                        counterText: "",
                        errorText: errorPhoneNumber,
                        filled: true,
                        fillColor: Color(0xFFF1F1F1),
                        hintText: S.of(context).phoneNumber,
                        hintStyle: TextStyle(
                          fontWeight: FontWeight.w400,
                          fontStyle: FontStyle.italic,
                        ),
                        prefixIcon: Icon(Icons.phone),
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
                      inputFormatters: [
                        LengthLimitingTextInputFormatter(10),
                        FilteringTextInputFormatter.digitsOnly,
                      ],
                      keyboardType: TextInputType.number,
                    ),

                    // Address section
                    _buildAddressSection(),

                    const SizedBox(height: 30),

                    // Continue button
                    SizedBox(
                      width: MediaQuery.of(context).size.width * 0.8,
                      child: ElevatedButton(
                        onPressed: () {
                          updateUser();
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Color(0xFF16F1FA),
                          foregroundColor: Colors.white,
                          padding: EdgeInsets.symmetric(vertical: 15),
                        ),
                        child: Text(S.of(context).continueText,
                            style: TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 17)),
                      ),
                    ),
                    const SizedBox(height: 30),
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