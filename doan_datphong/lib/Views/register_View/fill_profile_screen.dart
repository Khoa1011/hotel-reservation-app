import 'dart:io';
import 'package:doan_datphong/Blocs/fillProfile_Blocs/fillProfile_bloc.dart';
import 'package:doan_datphong/Blocs/fillProfile_Blocs/fillProfile_event.dart';
import 'package:doan_datphong/Blocs/fillProfile_Blocs/fillProfile_state.dart';
import 'package:doan_datphong/Models/NguoiDung.dart';
import 'package:doan_datphong/Models/ViTri.dart';
import 'package:doan_datphong/Views/home_View/home_screen.dart';
import 'package:doan_datphong/Views/login_View/login_screen.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:doan_datphong/generated/l10n.dart';
import '../../Data/Provider/auth_provider.dart';
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
    // ✅ Sử dụng WidgetsBinding để đảm bảo context đã sẵn sàng
    WidgetsBinding.instance.addPostFrameCallback((_) {
      loadProvinces();
    });
  }

  @override
  void dispose() {
    fullNameController.dispose();
    phoneNumberController.dispose();
    calendarController.dispose();
    addressController.dispose();
    super.dispose();
  }

  // ✅ THÊM: Method load wards
  Future<void> loadWards(String districtId) async {
    if (!mounted) return;

    try {
      setState(() {
        isLoadingWards = true;
        wards = [];
        _selectedWard = null;
        errorWard = null;
      });
      print('📥 BẮT ĐẦU loadWards với ID: $districtId');

      final loadedWards = await AddressService.getWards(districtId);

      if (!mounted) return;

      setState(() {
        wards = loadedWards;
        isLoadingWards = false;
      });
    } catch (e) {
      print('❌ Lỗi load wards: $e');

      if (!mounted) return;

      setState(() {
        isLoadingWards = false;
        errorWard = 'Không thể tải danh sách phường/xã';
      });
    }
  }

  // ✅ Thêm error handling và loading state tốt hơn
  Future<void> loadProvinces() async {
    if (!mounted) return; // ✅ Check mounted state
    try {
      setState(() {
        isLoadingProvinces = true;
        errorProvince = null;
      });

      final loadedProvinces = await AddressService.getProvinces();

      if (!mounted) return; // ✅ Check mounted state again

      setState(() {
        provinces = loadedProvinces;
        isLoadingProvinces = false;
      });
    } catch (e) {
      print('❌ Lỗi load provinces: $e');

      if (!mounted) return; // ✅ Check mounted state

      setState(() {
        isLoadingProvinces = false;
        errorProvince = 'Không thể tải danh sách tỉnh/thành phố';
      });

      // ✅ Hiển thị dialog thay vì SnackBar
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Text('Lỗi kết nối'),
          content: Text('Không thể tải danh sách tỉnh/thành phố. Vui lòng kiểm tra kết nối mạng và thử lại.'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                loadProvinces(); // Retry
              },
              child: Text('Thử lại'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Đóng'),
            ),
          ],
        ),
      );
    }
  }

  // ✅ Cập nhật method load wards với error handling
  Future<void> loadDistricts(String provinceCode) async {
    if (!mounted) return;

    try {
      setState(() {
        isLoadingDistricts  = true;
        districts  = [];
        _selectedDistrict = null;
        errorDistrict = null;
      });

      final loadedDictricts = await AddressService.getDistricts(provinceCode);

      if (!mounted) return;

      setState(() {
        districts  = loadedDictricts;
        isLoadingDistricts  = false;
      });
    } catch (e) {
      print('❌ Lỗi load wards: $e');

      if (!mounted) return;

      setState(() {
        isLoadingDistricts  = false;
        errorDistrict = 'Không thể tải danh sách phường/xã';
      });
    }
  }

  DateTime? _parseDate(String? dateString) {
    if (dateString == null || dateString.isEmpty) {
      return null;
    }

    try {
      String cleanedDate = dateString.trim();
      RegExp dateRegex = RegExp(r'^\d{2}/\d{2}/\d{4}$');
      if (!dateRegex.hasMatch(cleanedDate)) {
        return null;
      }
      return DateFormat('dd/MM/yyyy').parse(cleanedDate);
    } catch (e) {
      print('❌ Lỗi parse date "$dateString": $e');
      return null;
    }
  }

  Future<String?> getUserId() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      String? userToken = prefs.getString("user");

      if (userToken != null) {
        NguoiDung user = NguoiDung.fromJsonString(userToken);
        return user.id;
      }
      return null;
    } catch (e) {
      print('❌ Lỗi get user ID: $e');
      return null;
    }
  }

  void updateUser() async {
    // ✅ Validate tất cả fields trước
    validFullNameCheck(fullNameController.text);
    validPhoneNumberCheck(phoneNumberController.text);
    validGenderCheck(_selectedGender ?? "");
    validDateOfBirthCheck(calendarController.text);
    validProvinceCheck(_selectedProvince?.name ?? "");
    validAddressCheck(addressController.text);
    validDistrictCheck(_selectedDistrict?.name ?? "");  // ✅ SỬA: không phải validWardCheck
    validWardCheck(_selectedWard?.name ?? "");

    // ✅ Check mounted state
    if (!mounted) return;

    String? user_id = await getUserId();

    if (user_id == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Không thể lấy thông tin người dùng")),
      );
      return;
    }

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
        DateTime? parsedDate = _parseDate(calendarController.text);

        if (parsedDate == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text("Vui lòng chọn ngày sinh hợp lệ")),
          );
          return;
        }

        // ✅ Tạo object ViTri với cấu trúc mới (không có thanhPho)
        ViTri viTri = ViTri(
          thanhPho: _selectedProvince?.name, // ✅ Sử dụng tinhThanh thay vì thanhPho
          quan: _selectedDistrict?.name,
          phuong: _selectedWard?.name,
          soNha: addressController.text,
        );

        NguoiDung user = NguoiDung.short(
          id: user_id,
          tenNguoiDung: fullNameController.text,
          soDienThoai: phoneNumberController.text,
          gioiTinh: (_selectedGender == genders[0] ? true : false),
          ngaySinh: parsedDate,
          hinhDaiDien: _image?.path ?? '',
        );

        user.viTri = viTri;

        // ✅ Check mounted state trước khi gửi event
        if (!mounted) return;

        context.read<FillProfileBloc>().add(
          FillProfileSubmiited(user),
        );

      } catch (e) {
        print("❌ Lỗi trong updateUser: $e");
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text("Có lỗi xảy ra: ${e.toString()}")),
          );
        }
      }
    }
  }

  // ✅ Validation methods (giữ nguyên nhưng thêm mounted check)
  void validGenderCheck(String value) {
    if (!mounted) return;
    setState(() {
      errorGender = value.isEmpty ? S.of(context).pleaseSelectGender : null;
    });
  }

  void validDateOfBirthCheck(String? value) {
    if (!mounted) return;

    if (value == null || value.isEmpty) {
      setState(() {
        errorDoB = S.of(context).pleaseSelectDateOfBirth;
      });
      return;
    }

    try {
      DateTime? birthDate = _parseDate(value);
      if (birthDate == null) {
        setState(() {
          errorDoB = "Định dạng ngày không hợp lệ";
        });
        return;
      }

      DateTime today = DateTime.now();
      int age = today.year - birthDate.year;

      if (today.month < birthDate.month ||
          (today.month == birthDate.month && today.day < birthDate.day)) {
        age--;
      }

      setState(() {
        errorDoB = age < 16 ? S.of(context).notOldEnough : null;
      });

    } catch (e) {
      setState(() {
        errorDoB = S.of(context).invalidAge;
      });
    }
  }

  void validFullNameCheck(String value) {
    if (!mounted) return;
    setState(() {
      if (value.isEmpty) {
        errorFullName = S.of(context).pleaseEnterFullName;
      } else if (!RegExp(r"^[a-zA-ZÀ-ỹ\s]+$").hasMatch(value)) {
        errorFullName = S.of(context).nameCannotContainSpecialCharacters;
      } else {
        errorFullName = null;
      }
    });
  }

  void validPhoneNumberCheck(String value) {
    if (!mounted) return;
    final phoneRegex = RegExp(r"^0[0-9]{9}$");
    setState(() {
      if (value.isEmpty) {
        errorPhoneNumber = S.of(context).pleaseEnterPhoneNumber;
      } else if (!phoneRegex.hasMatch(value)) {
        errorPhoneNumber = S.of(context).invalidPhoneNumber;
      } else {
        errorPhoneNumber = null;
      }
    });
  }
  void validDistrictCheck(String value) {
    if (!mounted) return;
    setState(() {
      errorDistrict = value.isEmpty ? "Vui lòng chọn quận/huyện" : null;
    });
  }

  void validProvinceCheck(String value) {
    if (!mounted) return;
    setState(() {
      errorProvince = value.isEmpty ? "Vui lòng chọn tỉnh/thành phố" : null;
    });
  }

  void validWardCheck(String value) {
    if (!mounted) return;
    setState(() {
      errorWard = value.isEmpty ? "Vui lòng chọn phường/xã" : null;  // ✅ SỬA: errorWard
    });
  }

  void validAddressCheck(String value) {
    if (!mounted) return;
    setState(() {
      errorAddress = value.isEmpty ? "Vui lòng nhập số nhà, tên đường" : null;
    });
  }

  // ✅ Cập nhật method chọn ngày với error handling tốt hơn
  Future<void> _selectDate(BuildContext context) async {
    try {
      final DateTime maxDate = DateTime.now().subtract(Duration(days: 365 * 16));
      final DateTime minDate = DateTime.now().subtract(Duration(days: 365 * 100));

      DateTime initialDate = DateTime.now().subtract(Duration(days: 365 * 25));

      if (calendarController.text.isNotEmpty) {
        DateTime? currentDate = _parseDate(calendarController.text);
        if (currentDate != null &&
            currentDate.isAfter(minDate) &&
            currentDate.isBefore(maxDate.add(Duration(days: 1)))) {
          initialDate = currentDate;
        }
      }

      final DateTime? picker = await showDatePicker(
        context: context,
        initialDate: initialDate,
        firstDate: minDate,
        lastDate: maxDate,
        helpText: 'Chọn ngày sinh của bạn',
        cancelText: 'Hủy',
        confirmText: 'Xác nhận',
        builder: (BuildContext context, Widget? child) {
          return Theme(
            data: Theme.of(context).copyWith(
              colorScheme: Theme.of(context).colorScheme.copyWith(
                primary: Color(0xFF1565C0),
                onPrimary: Colors.white,
              ),
            ),
            child: child!,
          );
        },
      );

      if (picker != null && mounted) {
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
      print('❌ Lỗi khi chọn ngày: $e');
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

  // ✅ Các methods pick image (giữ nguyên)
  Future<void> pickImage() async {
    if (!mounted) return;

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
    try {
      final pickedFile = await picker.pickImage(source: source);
      if (pickedFile != null && mounted) {
        setState(() {
          _image = File(pickedFile.path);
        });
      }
    } catch (e) {
      print('❌ Lỗi pick image: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Không thể chọn ảnh. Vui lòng thử lại.')),
        );
      }
    }
  }

  // ✅ Widget build dropdown (giữ nguyên)
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
          borderSide: BorderSide(color: Color(0xFF1565C0), width: 2),
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
              _selectedDistrict = null;
              _selectedWard = null;
              districts  = [];
              wards =[];
              validProvinceCheck(newValue?.name ?? "");
            });
            if (newValue != null) {
              loadDistricts(newValue.id);
            }
          },
        ),

        const SizedBox(height: 15),

        // Dropdown phường/xã
        _buildDropdown<District>(
          hint: 'Chọn quận/huyện',
          value: _selectedDistrict,
          items: districts,
          getLabel: (district) => district.name,
          isLoading: isLoadingDistricts ,
          errorText: errorDistrict,
          enabled: _selectedProvince != null,
          onChanged: (District? newValue) {
            setState(() {
              _selectedDistrict = newValue;
              _selectedWard = null;
              wards = [];
              validDistrictCheck(newValue?.name ?? "");
            });
            if (newValue != null) {
              loadWards(newValue.id);
            }
          },
        ),
        const SizedBox(height: 15),
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
                color: Color(0xFF1565C0),
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
          context.read<UserAuthProvider>().saveUser(state.user);
          Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                  builder: (context) => HomeScreen()));
        } else if (state is FillProfileFailure) {
          print("❌ Lỗi fill profile: ${state.errorMessage}");
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(state.errorMessage ?? "Có lỗi xảy ra")));
          }
        }
      },
      child: Scaffold(
        // ✅ Thêm backgroundColor để tránh màn hình đen
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: Icon(Icons.arrow_back, color: Colors.black),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => LoginScreen()),
              );
            },
          ),
          title: Text(
            S.of(context).fillYourProfile,
            style: TextStyle(
              fontFamily: 'Lato Semibold',
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.black,
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
                          color: Color(0xFF1565C0),
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
                          color: Color(0xFF1565C0),
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
                          color: Color(0xFF1565C0),
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
                          color: Color(0xFF1565C0),
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
                        backgroundColor: Color(0xFF1565C0),
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
    );
  }
}