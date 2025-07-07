import 'dart:io';
import 'package:doan_datphong/Blocs/updateProfile/updateProfile_bloc.dart';
import 'package:doan_datphong/Blocs/updateProfile/updateProfile_event.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../Models/NguoiDung.dart';
import 'package:doan_datphong/Data/Provider/auth_provider.dart';
import 'package:provider/provider.dart';

class EditProfileScreen extends StatefulWidget {


  const EditProfileScreen({super.key});

  @override
  _EditProfileState createState() => _EditProfileState();
}

class _EditProfileState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final picker = ImagePicker();
  File? _image;

  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;
  late TextEditingController _dobController;
  late TextEditingController _newPasswordController;
  late TextEditingController _confirmPasswordController;

  bool _obscureConfirmPassword  = true;
  bool _obscureNewPassword = true;
  String? _errorMessage;
  String? errorPassword;
  String? errorConfirmPassWord;
  String? errorDob;

  void _loadUserData() {
    final authProvider = context.read<UserAuthProvider>();

    if (authProvider.isLoggedIn && authProvider.user != null) {
      final user = authProvider.user!;

      _nameController.text = user.tenNguoiDung;
      _emailController.text = user.email;
      _phoneController.text = user.soDienThoai;
      _dobController.text = _formatDateForDisplay(user.ngaySinh);

      // Password fields giữ nguyên rỗng
      _newPasswordController.text = '';
      _confirmPasswordController.text = '';
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // ✅ Bây giờ context đã sẵn sàng, có thể gọi AuthProvider
    _loadUserData();
  }
  @override
  void initState() {
    super.initState();
    // ✅ Khởi tạo controllers với giá trị rỗng trước
    _nameController = TextEditingController();
    _emailController = TextEditingController();
    _phoneController = TextEditingController();
    _dobController = TextEditingController();
    _newPasswordController = TextEditingController();
    _confirmPasswordController = TextEditingController();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _dobController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
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




  void updateProfile ()async{
    // Lấy giá trị từ các TextEditingController
    String fullName = _nameController.text.trim();
    String phoneNumber = _phoneController.text.trim();
    String dob = _dobController.text.trim();
    String newPassword = _newPasswordController.text.trim();
    String confirmPassword = _confirmPasswordController.text.trim();

    if(errorConfirmPassWord != null
    && _errorMessage != null
    && errorPassword != null){
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please complete all required fields.')),
      );
    }else{

    }

  }
  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() {
        _dobController.text = DateFormat('dd/MM/yyyy').format(picked);
        errorDob = null;
      });
    }
  }

  Future<void> pickImage() async {
    showModalBottomSheet(
      context: context,
      builder: (context) => Wrap(
        children: [
          ListTile(
            leading: const Icon(Icons.camera),
            title: const Text("Take Photo"),
            onTap: () async {
              Navigator.pop(context);
              await getImage(ImageSource.camera);
            },
          ),
          ListTile(
            leading: const Icon(Icons.photo_library),
            title: const Text("Choose from Gallery"),
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
        errorConfirmPassWord = "Passwords do not match!";
      });
    } else {
      setState(() {
        errorConfirmPassWord = null;
      });
    }
  }

  void validatePassword(String? password) {
    if (password == null || password.length < 6) {
      setState(() {
        errorPassword = "Password must be at least 6 characters!";
      });
    } else {
      setState(() {
        errorPassword = null;
      });
    }
  }

  void validateDob(String? dob) {
    if (dob == null || dob.isEmpty) {
      setState(() {
        errorDob = "Please select your date of birth";
      });
    } else {
      setState(() {
        errorDob = null;
      });
    }
  }

  void _saveProfile() {

    final authProvider = context.read<UserAuthProvider>();

    if (!authProvider.isLoggedIn || authProvider.user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('User not found. Please login again.')),
      );
      return;
    }
    validateDob(_dobController.text);
    if (_formKey.currentState!.validate()
        && errorDob == null
        && errorConfirmPassWord == null
        && _errorMessage == null
        && errorPassword == null) {

      NguoiDung user = NguoiDung.shortUpdateProfile(
          id: authProvider.user!.id,
          tenNguoiDung: _nameController.text,
          soDienThoai: _phoneController.text,
          ngaySinh: _parseDate(_dobController.text)!,
          hinhDaiDien: _image!.path,
          matKhau: _newPasswordController.text
      );
      context.read<UpdateProfileBloc>().add(
        UpdateProfileSubmiited(user),
      );
      showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: Text("Successful!",
              style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 20,
                  color: Color(0xFF14D9E1)
              ),),
            content: Text("Update profile successful!",
              style: TextStyle(
                fontStyle: FontStyle.italic,
                fontSize: 15,
              ),),
            actions: [
              TextButton(
                  onPressed:() {
                    Navigator.pop(context);
                    Navigator.pop(context);
                  },
                  child: Text("OK"))
            ],
          ));

    }
  }

  Widget _buildProfilePicture() {
    return Consumer<UserAuthProvider>(
        builder: (context, authProvider, child){
          return Center(
            child: GestureDetector(
              onTap: pickImage, // Hàm pickImage sẽ được gọi khi người dùng click vào ảnh
              child: Stack(
                alignment: Alignment.center,
                children: [
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: Colors.transparent,
                    backgroundImage: _image != null
                        ? FileImage(File(_image!.path)) // Nếu có ảnh mới, hiển thị ảnh từ file
                        : (authProvider.user?.hinhDaiDien != null && authProvider.user!.hinhDaiDien.isNotEmpty
                        ? NetworkImage(authProvider.user!.hinhDaiDien) // Nếu có ảnh cũ, hiển thị ảnh từ URL
                        : const AssetImage('assets/default_profile.png')) as ImageProvider, // Ảnh mặc định
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFF14D9E1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      padding: const EdgeInsets.all(5),
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
        });

  }

  Widget _buildTextField(
      String label,
      TextEditingController controller, {
        required IconData icon,
        required bool obscure,
        Widget? suffixIcon,
        Function(String)? onChanged, // <-- Add onChanged here
        String? Function(String?)? validator, // <-- Add validator here
        bool isPhone = false, // Add default parameter for isPhone
        bool isDob = false,   // Add default parameter for isDob
        bool readOnly = false, // Add default parameter for readOnly
      }) {
    return TextFormField(
      controller: controller,
      obscureText: obscure,
      onChanged: onChanged, // <-- Use onChanged here
      validator: validator, // <-- Use validator here
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
      ),
    );
  }



  Widget _buildPasswordFields() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Change Password',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 18,
            color: Color(0xFF404040),
          ),
        ),
        const SizedBox(height: 15),
        _buildTextField(
          'New Password',
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
          'Confirm Password',
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
            comparePassword(value!);
            return errorConfirmPassWord;
          },
        ),
      ],
    );
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
          'SAVE CHANGES',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Edit Profile',
          style: TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              _buildProfilePicture(),
              const SizedBox(height: 30),
              _buildTextField(
                'Full Name',
                _nameController,
                icon: Icons.person,
                obscure: false,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your name';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 20),
              _buildTextField(
                'Phone Number',
                _phoneController,
                icon: Icons.phone,
                obscure: false,
                isPhone: true, // optional if your textfield requires specific phone number validation
              ),
              const SizedBox(height: 20),
              _buildTextField(
                'Date of Birth',
                _dobController,
                icon: Icons.calendar_today,
                obscure: false,
                readOnly: true,
                validator: (value) {
                  validateDob(value);
                  return errorDob;
                },
                suffixIcon: IconButton(
                  onPressed: () => _selectDate(context),
                  icon: const Icon(Icons.calendar_month),
                ),
              ),
              const SizedBox(height: 20),
              _buildPasswordFields(),
              const SizedBox(height: 10),
              if (_errorMessage != null)
                Text(
                  _errorMessage!,
                  style: const TextStyle(color: Colors.red),
                ),
              const SizedBox(height: 100), // Added padding to avoid overlap
            ],
          ),
        ),
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(20.0),
        child: SizedBox(
          width: double.infinity,
          height: 50,
          child: _buildSaveButton(),
        ),
      ),
    );
  }


}