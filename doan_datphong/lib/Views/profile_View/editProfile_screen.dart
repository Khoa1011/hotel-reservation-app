import 'dart:io';
import 'package:doan_datphong/Blocs/updateProfile/updateProfile_bloc.dart';
import 'package:doan_datphong/Blocs/updateProfile/updateProfile_event.dart';
import 'package:doan_datphong/Blocs/updateProfile/updateProfile_state.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../Models/NguoiDung.dart';
import '../../Models/ViTri.dart';
import 'package:doan_datphong/Data/Provider/auth_provider.dart';
import 'package:provider/provider.dart';
import '../../Data/Repository/addressService_Repository/addressService_repo.dart';

enum Gender { male, female }

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  _EditProfileState createState() => _EditProfileState();
}

class _EditProfileState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final picker = ImagePicker();
  File? _image;

  // Danh sách từ API địa chỉ
  List<Province> provinces = [];
  List<District> districts = [];
  List<Ward> wards = [];

  // Loading states
  bool isLoadingProvinces = false;
  bool isLoadingDistricts = false;
  bool isLoadingWards = false;

  // Controllers
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;
  late TextEditingController _dobController;
  late TextEditingController _newPasswordController;
  late TextEditingController _confirmPasswordController;
  late TextEditingController _addressController;

  // Password visibility
  bool _obscureConfirmPassword = true;
  bool _obscureNewPassword = true;

  // Validation errors
  String? _errorMessage;
  String? errorPassword;
  String? errorConfirmPassWord;
  String? errorDob;
  String? errorFullName;
  String? errorPhone;
  String? errorGender;
  String? errorProvince;
  String? errorDistrict;
  String? errorWard;
  String? errorAddress;

  // Selected values
  String? _selectedGender;
  Province? _selectedProvince;
  District? _selectedDistrict;
  Ward? _selectedWard;

  // Gender options
  List<String> get genders => ['Nam', 'Nữ'];

  @override
  void initState() {
    super.initState();
    // Khởi tạo controllers với giá trị rỗng trước
    _nameController = TextEditingController();
    _emailController = TextEditingController();
    _phoneController = TextEditingController();
    _dobController = TextEditingController();
    _newPasswordController = TextEditingController();
    _confirmPasswordController = TextEditingController();
    _addressController = TextEditingController();

    // ✅ SỬA: Load provinces trước, sau đó mới load user data
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeData();
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _dobController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  // ✅ THÊM: Method khởi tạo dữ liệu theo thứ tự
  Future<void> _initializeData() async {
    try {
      // 1. Load provinces trước
      await loadProvinces();

      // 2. Sau đó load user data và địa chỉ
      await _loadUserData();

    } catch (e) {
      print('❌ Lỗi khởi tạo dữ liệu: $e');
    }
  }

  // ✅ THÊM: Debug method để kiểm tra dữ liệu user
  void _debugUserData() {
    final authProvider = context.read<UserAuthProvider>();
    if (authProvider.user != null) {
      final user = authProvider.user!;

      print('🔍 DEBUG USER DATA:');
      print('   - ID: ${user.id}');
      print('   - Tên: ${user.tenNguoiDung}');
      print('   - Email: ${user.email}');
      print('   - SĐT: ${user.soDienThoai}');
      print('   - Giới tính: ${user.gioiTinh}');
      print('   - Ngày sinh: ${user.ngaySinh}');
      print('   - Avatar: ${user.hinhDaiDien}');

      if (user.viTri != null) {
        print('   - ViTri object: ${user.viTri}');
        print('   - Tỉnh/TP: "${user.viTri!.thanhPho}"');
        print('   - Quận/Huyện: "${user.viTri!.quan}"');
        print('   - Phường/Xã: "${user.viTri!.phuong}"');
        print('   - Số nhà: "${user.viTri!.soNha}"');
      } else {
        print('   - ViTri: null');
      }
    }
  }

  // ✅ SỬA: Đổi thành async và chờ load địa chỉ hoàn thành
  Future<void> _loadUserData() async {
    final authProvider = context.read<UserAuthProvider>();

    if (authProvider.isLoggedIn && authProvider.user != null) {
      // ✅ THÊM: Debug user data
      _debugUserData();

      final user = authProvider.user!;

      _nameController.text = user.tenNguoiDung;
      _emailController.text = user.email;
      _phoneController.text = user.soDienThoai;
      _dobController.text = _formatDateForDisplay(user.ngaySinh);

      // Set gender
      _selectedGender = user.gioiTinh ? 'Nam' : 'Nữ';

      // ✅ SỬA: Load địa chỉ nếu có
      if (user.viTri != null) {
        _addressController.text = user.viTri!.soNha ?? '';

        // ✅ SỬA: Chờ load địa chỉ hoàn thành
        await _loadExistingAddress(user.viTri!);
      }

      // Password fields giữ nguyên rỗng
      _newPasswordController.text = '';
      _confirmPasswordController.text = '';

      // ✅ THÊM: setState để refresh UI
      if (mounted) {
        setState(() {});
      }
    }
  }

  // ✅ SỬA: Cải thiện logic tìm địa chỉ
  Future<void> _loadExistingAddress(ViTri viTri) async {
    print('🔍 DEBUG: Loading existing address...');
    print('   - Tỉnh/TP: ${viTri.thanhPho}');
    print('   - Quận/Huyện: ${viTri.quan}');
    print('   - Phường/Xã: ${viTri.phuong}');
    print('   - Số nhà: ${viTri.soNha}');
    print('   - Provinces loaded: ${provinces.length}');

    try {
      // 1. Tìm và set province
      if (viTri.thanhPho != null && provinces.isNotEmpty) {
        print('🔍 Tìm province: ${viTri.thanhPho}');

        // ✅ SỬA: Tìm kiếm linh hoạt hơn
        Province? foundProvince;
        for (Province p in provinces) {
          if (p.name.toLowerCase().trim() == viTri.thanhPho!.toLowerCase().trim()) {
            foundProvince = p;
            break;
          }
        }

        if (foundProvince != null) {
          _selectedProvince = foundProvince;
          print('✅ Found province: ${foundProvince.name}');

          // 2. Load districts và tìm district
          await loadDistricts(foundProvince.id);

          if (viTri.quan != null && districts.isNotEmpty) {
            print('🔍 Tìm district: ${viTri.quan}');

            District? foundDistrict;
            for (District d in districts) {
              if (d.name.toLowerCase().trim() == viTri.quan!.toLowerCase().trim()) {
                foundDistrict = d;
                break;
              }
            }

            if (foundDistrict != null) {
              _selectedDistrict = foundDistrict;
              print('✅ Found district: ${foundDistrict.name}');

              // 3. Load wards và tìm ward
              await loadWards(foundDistrict.id);

              if (viTri.phuong != null && wards.isNotEmpty) {
                print('🔍 Tìm ward: ${viTri.phuong}');

                Ward? foundWard;
                for (Ward w in wards) {
                  if (w.name.toLowerCase().trim() == viTri.phuong!.toLowerCase().trim()) {
                    foundWard = w;
                    break;
                  }
                }

                if (foundWard != null) {
                  _selectedWard = foundWard;
                  print('✅ Found ward: ${foundWard.name}');
                } else {
                  print('❌ Ward not found: ${viTri.phuong}');
                  print('Available wards: ${wards.map((w) => w.name).take(5).join(", ")}');
                }
              }
            } else {
              print('❌ District not found: ${viTri.quan}');
              print('Available districts: ${districts.map((d) => d.name).take(5).join(", ")}');
            }
          }
        } else {
          print('❌ Province not found: ${viTri.thanhPho}');
          print('Available provinces: ${provinces.map((p) => p.name).take(5).join(", ")}');
        }
      }

      // ✅ THÊM: setState để refresh UI
      if (mounted) {
        setState(() {});
      }

    } catch (e) {
      print('❌ Lỗi load existing address: $e');
    }
  }

  // Address API methods - ✅ SỬA: Thêm return Future để có thể await
  Future<void> loadProvinces() async {
    if (!mounted) return;
    try {
      setState(() {
        isLoadingProvinces = true;
        errorProvince = null;
      });

      print('🔄 Loading provinces...');
      final loadedProvinces = await AddressService.getProvinces();
      print('✅ Loaded ${loadedProvinces.length} provinces');

      if (!mounted) return;

      setState(() {
        provinces = loadedProvinces;
        isLoadingProvinces = false;
      });
    } catch (e) {
      print('❌ Lỗi load provinces: $e');
      if (!mounted) return;
      setState(() {
        isLoadingProvinces = false;
        errorProvince = 'Không thể tải danh sách tỉnh/thành phố';
      });
    }
  }

  Future<void> loadDistricts(String provinceCode) async {
    if (!mounted) return;
    try {
      setState(() {
        isLoadingDistricts = true;
        districts = [];
        _selectedDistrict = null;
        _selectedWard = null;
        wards = [];
        errorDistrict = null;
      });

      print('🔄 Loading districts for province: $provinceCode');
      final loadedDistricts = await AddressService.getDistricts(provinceCode);
      print('✅ Loaded ${loadedDistricts.length} districts');

      if (!mounted) return;

      setState(() {
        districts = loadedDistricts;
        isLoadingDistricts = false;
      });
    } catch (e) {
      print('❌ Lỗi load districts: $e');
      if (!mounted) return;
      setState(() {
        isLoadingDistricts = false;
        errorDistrict = 'Không thể tải danh sách quận/huyện';
      });
    }
  }

  Future<void> loadWards(String districtId) async {
    if (!mounted) return;
    try {
      setState(() {
        isLoadingWards = true;
        wards = [];
        _selectedWard = null;
        errorWard = null;
      });

      print('🔄 Loading wards for district: $districtId');
      final loadedWards = await AddressService.getWards(districtId);
      print('✅ Loaded ${loadedWards.length} wards');

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

  // Validation methods
  void validFullNameCheck(String value) {
    if (!mounted) return;
    setState(() {
      if (value.isEmpty) {
        errorFullName = 'Vui lòng nhập họ tên';
      } else if (!RegExp(r"^[a-zA-ZÀ-ỹ\s]+$").hasMatch(value)) {
        errorFullName = 'Tên không được chứa ký tự đặc biệt';
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
        errorPhone = 'Vui lòng nhập số điện thoại';
      } else if (!phoneRegex.hasMatch(value)) {
        errorPhone = 'Số điện thoại không hợp lệ';
      } else {
        errorPhone = null;
      }
    });
  }

  void validGenderCheck(String value) {
    if (!mounted) return;
    setState(() {
      errorGender = value.isEmpty ? 'Vui lòng chọn giới tính' : null;
    });
  }

  void validDateOfBirthCheck(String? value) {
    if (!mounted) return;
    if (value == null || value.isEmpty) {
      setState(() {
        errorDob = 'Vui lòng chọn ngày sinh';
      });
      return;
    }

    try {
      DateTime? birthDate = _parseDate(value);
      if (birthDate == null) {
        setState(() {
          errorDob = "Định dạng ngày không hợp lệ";
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
        errorDob = age < 16 ? 'Tuổi phải từ 16 trở lên' : null;
      });
    } catch (e) {
      setState(() {
        errorDob = 'Tuổi không hợp lệ';
      });
    }
  }

  void validProvinceCheck(String value) {
    if (!mounted) return;
    setState(() {
      errorProvince = value.isEmpty ? "Vui lòng chọn tỉnh/thành phố" : null;
    });
  }

  void validDistrictCheck(String value) {
    if (!mounted) return;
    setState(() {
      errorDistrict = value.isEmpty ? "Vui lòng chọn quận/huyện" : null;
    });
  }

  void validWardCheck(String value) {
    if (!mounted) return;
    setState(() {
      errorWard = value.isEmpty ? "Vui lòng chọn phường/xã" : null;
    });
  }

  void validAddressCheck(String value) {
    if (!mounted) return;
    setState(() {
      errorAddress = value.isEmpty ? "Vui lòng nhập số nhà, tên đường" : null;
    });
  }

  String _formatDateForDisplay(DateTime? date) {
    if (date == null) return '';
    return DateFormat('dd/MM/yyyy').format(date);
  }

  DateTime? _parseDate(String dateString) {
    if (dateString.isEmpty) return null;
    try {
      return DateFormat('dd/MM/yyyy').parse(dateString);
    } catch (e) {
      return null;
    }
  }

  Future<void> _selectDate(BuildContext context) async {
    try {
      final DateTime maxDate = DateTime.now().subtract(Duration(days: 365 * 16));
      final DateTime minDate = DateTime.now().subtract(Duration(days: 365 * 100));

      DateTime initialDate = DateTime.now().subtract(Duration(days: 365 * 25));

      if (_dobController.text.isNotEmpty) {
        DateTime? currentDate = _parseDate(_dobController.text);
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
      );

      if (picker != null && mounted) {
        setState(() {
          _dobController.text = DateFormat('dd/MM/yyyy').format(picker);
          validDateOfBirthCheck(_dobController.text);
        });
      }
    } catch (e) {
      print('❌ Lỗi khi chọn ngày: $e');
    }
  }

  Future<void> pickImage() async {
    showModalBottomSheet(
      context: context,
      builder: (context) => Wrap(
        children: [
          ListTile(
            leading: const Icon(Icons.camera),
            title: const Text("Chụp ảnh"),
            onTap: () async {
              Navigator.pop(context);
              await getImage(ImageSource.camera);
            },
          ),
          ListTile(
            leading: const Icon(Icons.photo_library),
            title: const Text("Chọn từ thư viện"),
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
    }
  }

  void comparePassword(String confirmPassword) {
    String passwordPrevious = _newPasswordController.text.trim();
    if (confirmPassword != passwordPrevious) {
      setState(() {
        errorConfirmPassWord = "Mật khẩu không khớp!";
      });
    } else {
      setState(() {
        errorConfirmPassWord = null;
      });
    }
  }

  void validatePassword(String? password) {
    if (password != null && password.isNotEmpty && password.length < 6) {
      setState(() {
        errorPassword = "Mật khẩu phải có ít nhất 6 ký tự!";
      });
    } else {
      setState(() {
        errorPassword = null;
      });
    }
  }

  Widget _buildAvatarImage(String? avatar) {
    if (avatar == null || avatar.isEmpty) {
      return _buildDefaultAvatar();
    }

    try {
      if (avatar.startsWith('http')) {
        return Image.network(
          avatar,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return _buildDefaultAvatar();
          },
        );
      } else {
        final filePath = avatar.startsWith('file://')
            ? avatar.replaceFirst('file://', '')
            : avatar;

        if (File(filePath).existsSync()) {
          return Image.file(
            File(filePath),
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              return _buildDefaultAvatar();
            },
          );
        }
      }
    } catch (e) {
      debugPrint('Avatar loading error: $e');
    }

    return _buildDefaultAvatar();
  }

  Widget _buildDefaultAvatar() {
    return CircleAvatar(
      radius: 70,
      backgroundColor: Colors.grey[200],
      child: Icon(
        Icons.person,
        size: 60,
        color: Colors.grey[600],
      ),
    );
  }

  Widget _buildProfilePicture() {
    return Consumer<UserAuthProvider>(
      builder: (context, authProvider, child) {
        return Center(
          child: GestureDetector(
            onTap: pickImage,
            child: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 140,
                  height: 140,
                  child: ClipOval(
                    child: _image != null
                        ? Image.file(
                      _image!,
                      fit: BoxFit.cover,
                    )
                        : _buildAvatarImage(authProvider.user?.hinhDaiDien),
                  ),
                ),
                Positioned(
                  bottom: 0,
                  right: 10,
                  child: Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFF14D9E1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    padding: const EdgeInsets.all(8),
                    child: const Icon(
                      Icons.edit,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // Build dropdown similar to FillProfile
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

  Widget _buildTextField(
      String label,
      TextEditingController controller, {
        required IconData icon,
        required bool obscure,
        Widget? suffixIcon,
        Function(String)? onChanged,
        String? Function(String?)? validator,
        bool isPhone = false,
        bool isDob = false,
        bool readOnly = false,
      }) {
    return TextFormField(
      controller: controller,
      obscureText: obscure,
      onChanged: onChanged,
      validator: validator,
      readOnly: readOnly,
      inputFormatters: isPhone
          ? [
        LengthLimitingTextInputFormatter(10),
        FilteringTextInputFormatter.digitsOnly,
      ]
          : null,
      keyboardType: isPhone ? TextInputType.number : null,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
        suffixIcon: suffixIcon,
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
        counterText: isPhone ? "" : null,
      ),
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
              districts = [];
              wards = [];
              validProvinceCheck(newValue?.name ?? "");
            });
            if (newValue != null) {
              loadDistricts(newValue.id);
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
        _buildTextField(
          'Số nhà, tên đường',
          _addressController,
          icon: Icons.home,
          obscure: false,
          onChanged: validAddressCheck,
          validator: (value) {
            validAddressCheck(value ?? '');
            return errorAddress;
          },
        ),

        // Hiển thị địa chỉ đầy đủ
        if (_selectedProvince != null || _selectedDistrict != null || _selectedWard != null || _addressController.text.isNotEmpty)
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
                    if (_addressController.text.isNotEmpty) _addressController.text,
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

  Widget _buildPasswordFields() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Đổi mật khẩu (tùy chọn)',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 18,
            color: Color(0xFF404040),
          ),
        ),
        const SizedBox(height: 15),
        _buildTextField(
          'Mật khẩu mới',
          _newPasswordController,
          icon: Icons.lock,
          obscure: _obscureNewPassword,
          suffixIcon: IconButton(
            icon: Icon(
              _obscureNewPassword ? Icons.visibility_off : Icons.visibility,
              color: Colors.grey,
            ),
            onPressed: () {
              setState(() {
                _obscureNewPassword = !_obscureNewPassword;
              });
            },
          ),
          onChanged: (value) {
            validatePassword(value);
            comparePassword(_confirmPasswordController.text);
          },
          validator: (value) {
            validatePassword(value);
            return errorPassword;
          },
        ),
        const SizedBox(height: 15),
        _buildTextField(
          'Xác nhận mật khẩu',
          _confirmPasswordController,
          icon: Icons.lock,
          obscure: _obscureConfirmPassword,
          suffixIcon: IconButton(
            icon: Icon(
              _obscureConfirmPassword ? Icons.visibility_off : Icons.visibility,
              color: Colors.grey,
            ),
            onPressed: () {
              setState(() {
                _obscureConfirmPassword = !_obscureConfirmPassword;
              });
            },
          ),
          onChanged: (value) {
            comparePassword(value);
          },
          validator: (value) {
            comparePassword(value ?? '');
            return errorConfirmPassWord;
          },
        ),
      ],
    );
  }

  void _saveProfile() {
    final authProvider = context.read<UserAuthProvider>();

    if (!authProvider.isLoggedIn || authProvider.user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.')),
      );
      return;
    }

    // Validate tất cả fields
    validFullNameCheck(_nameController.text);
    validPhoneNumberCheck(_phoneController.text);
    validGenderCheck(_selectedGender ?? "");
    validDateOfBirthCheck(_dobController.text);
    validProvinceCheck(_selectedProvince?.name ?? "");
    validDistrictCheck(_selectedDistrict?.name ?? "");
    validWardCheck(_selectedWard?.name ?? "");
    validAddressCheck(_addressController.text);

    if (_formKey.currentState!.validate() &&
        errorFullName == null &&
        errorPhone == null &&
        errorGender == null &&
        errorDob == null &&
        errorProvince == null &&
        errorDistrict == null &&
        errorWard == null &&
        errorAddress == null &&
        errorPassword == null &&
        errorConfirmPassWord == null) {

      try {
        DateTime? parsedDate = _parseDate(_dobController.text);
        if (parsedDate == null) {
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
          soNha: _addressController.text,
        );

        NguoiDung user = NguoiDung.shortUpdateProfile(
          id: authProvider.user!.id,
          tenNguoiDung: _nameController.text,
          soDienThoai: _phoneController.text,
          gioiTinh: (_selectedGender == 'Nam' ? true : false),
          ngaySinh: parsedDate,
          hinhDaiDien: _image?.path ?? authProvider.user!.hinhDaiDien,
          matKhau: _newPasswordController.text.trim().isEmpty ? '' : _newPasswordController.text,
        );

        user.viTri = viTri;

        context.read<UpdateProfileBloc>().add(
          UpdateProfileSubmiited(user),
        );

      } catch (e) {
        print("❌ Lỗi trong _saveProfile: $e");
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Có lỗi xảy ra: ${e.toString()}")),
        );
      }
    }
  }

  Widget _buildSaveButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _saveProfile,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF14D9E1),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
        child: const Text(
          'LƯU THAY ĐỔI',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<UpdateProfileBloc, UpdateProfileState>(
      listener: (context, state) {
        if (state is UpdateProfileSuccess) {
          // Cập nhật AuthProvider với thông tin mới
          context.read<UserAuthProvider>().saveUser(state.userData);

          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              title: Text(
                "Thành công!",
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 20,
                  color: Color(0xFF14D9E1),
                ),
              ),
              content: Text(
                "Cập nhật thông tin thành công!",
                style: TextStyle(
                  fontStyle: FontStyle.italic,
                  fontSize: 15,
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.pop(context); // Đóng dialog
                    Navigator.pop(context); // Quay lại trang trước
                  },
                  child: Text("OK"),
                )
              ],
            ),
          );
        } else if (state is UpdateProfileFailure) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.errorMessage),
              backgroundColor: Colors.red,
            ),
          );
        }
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.black),
            onPressed: () => Navigator.pop(context),
          ),
          title: const Text(
            'Chỉnh sửa thông tin',
            style: TextStyle(
              color: Colors.black,
              fontWeight: FontWeight.bold,
              fontSize: 20,
            ),
          ),
          centerTitle: true,
        ),
        body: BlocBuilder<UpdateProfileBloc, UpdateProfileState>(
          builder: (context, state) {
            if (state is UpdateProfileLoading) {
              return Center(
                child: CircularProgressIndicator(
                  color: Color(0xFF14D9E1),
                ),
              );
            }

            return SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Profile picture
                    _buildProfilePicture(),
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
                    _buildTextField(
                      'Họ và tên',
                      _nameController,
                      icon: Icons.person,
                      obscure: false,
                      onChanged: validFullNameCheck,
                      validator: (value) {
                        validFullNameCheck(value ?? '');
                        return errorFullName;
                      },
                    ),
                    const SizedBox(height: 15),

                    // Email field (read-only)
                    _buildTextField(
                      'Email',
                      _emailController,
                      icon: Icons.email,
                      obscure: false,
                      readOnly: true,
                    ),
                    const SizedBox(height: 15),

                    // Phone number field
                    _buildTextField(
                      'Số điện thoại',
                      _phoneController,
                      icon: Icons.phone,
                      obscure: false,
                      isPhone: true,
                      onChanged: validPhoneNumberCheck,
                      validator: (value) {
                        validPhoneNumberCheck(value ?? '');
                        return errorPhone;
                      },
                    ),
                    const SizedBox(height: 15),

                    // Gender dropdown
                    DropdownButtonFormField<String>(
                      value: _selectedGender,
                      decoration: InputDecoration(
                        labelText: 'Giới tính',
                        prefixIcon: Icon(Icons.person_outline),
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
                        errorText: errorGender,
                      ),
                      hint: Text(
                        'Chọn giới tính',
                        style: TextStyle(
                          fontStyle: FontStyle.italic,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      items: genders.map((String gender) {
                        return DropdownMenuItem<String>(
                          value: gender,
                          child: Text(
                            gender,
                            style: TextStyle(fontWeight: FontWeight.normal),
                          ),
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
                    _buildTextField(
                      'Ngày sinh',
                      _dobController,
                      icon: Icons.calendar_today,
                      obscure: false,
                      readOnly: true,
                      onChanged: validDateOfBirthCheck,
                      validator: (value) {
                        validDateOfBirthCheck(value);
                        return errorDob;
                      },
                      suffixIcon: IconButton(
                        onPressed: () => _selectDate(context),
                        icon: const Icon(Icons.calendar_month),
                      ),
                    ),

                    // Address section
                    _buildAddressSection(),

                    const SizedBox(height: 20),

                    // Password section
                    _buildPasswordFields(),

                    const SizedBox(height: 10),
                    if (_errorMessage != null)
                      Text(
                        _errorMessage!,
                        style: const TextStyle(color: Colors.red),
                      ),
                    const SizedBox(height: 100), // Padding để tránh overlap với bottom button
                  ],
                ),
              ),
            );
          },
        ),
        bottomNavigationBar: Padding(
          padding: const EdgeInsets.all(20.0),
          child: SizedBox(
            width: double.infinity,
            height: 50,
            child: _buildSaveButton(),
          ),
        ),
      ),
    );
  }
}