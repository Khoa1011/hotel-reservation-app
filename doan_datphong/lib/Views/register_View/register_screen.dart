import 'package:doan_datphong/Blocs/register_Blocs/register_bloc.dart';
import 'package:doan_datphong/Blocs/register_Blocs/register_event.dart';
import 'package:doan_datphong/Blocs/register_Blocs/register_state.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:doan_datphong/generated/l10n.dart';
import 'package:doan_datphong/Views/components/NotificationDialog.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  _RegisterState createState() => _RegisterState();
}

class _RegisterState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  bool iconShowPassword1 = true;
  bool iconShowPassword2 = true;
  bool isChecked1 = false;

  TextEditingController emailController = TextEditingController();
  TextEditingController confirmPassword = TextEditingController();
  TextEditingController password = TextEditingController();

  String? errorEmails;
  String? errorPassword;
  String? errorConfirmPassWord;

  void registerUser() {
    validateEmail(emailController.text);
    validatePassword(password.text);
    comparePassword(confirmPassword.text);

    bool hasEmptyFields = emailController.text.trim().isEmpty ||
        password.text.trim().isEmpty ||
        confirmPassword.text.trim().isEmpty;

    if (hasEmptyFields) {
      NotificationDialog.showWarning(
        context,
        message: S.of(context).pleaseEnterAllFields,
      );
      return;
    }

    if (errorEmails != null || errorPassword != null || errorConfirmPassWord != null) {
      NotificationDialog.showWarning(
        context,
        message: S.of(context).pleaseFixValidationErrors,
      );
      return;
    }

    context.read<RegisterBlocs>().add(
      RegisterSubmitted(
        emailController.text.trim(),
        password.text.trim(),
      ),
    );
  }

  void comparePassword(String confirmPassword) {
    String passwordPrevious = password.text.trim();
    if (confirmPassword != passwordPrevious) {
      setState(() {
        errorConfirmPassWord = S.of(context).passwordsDoNotMatch;
      });
    } else {
      setState(() {
        errorConfirmPassWord = null;
      });
    }
  }

  void validateEmail(String email) {
    if (email.isEmpty) {
      setState(() {
        errorEmails = S.of(context).emailCannotBeEmpty;
      });
    } else if (!RegExp(
      r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9]+\.[a-zA-Z]+",
    ).hasMatch(email)) {
      setState(() {
        errorEmails = S.of(context).enterValidEmail;
      });
    } else {
      setState(() {
        errorEmails = null;
      });
    }
  }

  void validatePassword(String password) {
    if (password.length < 6) {
      setState(() {
        errorPassword = S.of(context).passwordMinLength;
      });
    } else {
      setState(() {
        errorPassword = null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<RegisterBlocs, RegisterState>(
      listener: (context, state) {
        if (state is RegisterSuccess) {
          NotificationDialog.showSuccess(
            context,
            message: S.of(context).registrationSuccessful,
            onButtonPressed: () {
              Navigator.pop(context);
            },
          );
        } else if (state is RegisterFailure) {
          if(state.errorMessage == "ERROR_CONNECTION_TIMEOUT"){
            NotificationDialog.showError(
              context,
              message: S.of(context).errorConnectionTimeout,
            );
          }else if (state.errorMessage == "ERROR_NETWORK_UNREACHABLE"){
            NotificationDialog.showError(
              context,
              message: S.of(context).errorNetworkUnreachable,
            );
          }else {
            NotificationDialog.showError(
              context,
              message: S.of(context).errorServerRefused,
            );
          }
        }
      },
      child: SafeArea(
        child: Scaffold(
          backgroundColor: Color(0xFFFFFFFF),
          appBar: AppBar(
            backgroundColor: Colors.white,
            leading: BlocBuilder<RegisterBlocs, RegisterState>(
              builder: (context, state) {
                bool isLoading = state is RegisterLoading;
                return IconButton(
                  onPressed: isLoading ? null : () => Navigator.pop(context),
                  icon: Icon(Icons.arrow_back),
                );
              },
            ),
          ),
          body: BlocBuilder<RegisterBlocs, RegisterState>(
            builder: (context, state) {
              bool isLoading = state is RegisterLoading;

              return Stack(
                children: [
                  SingleChildScrollView(
                      child: Padding(
                        padding: const EdgeInsets.all(10),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            children: [
                              Text(
                                S.of(context).createYourAccount,
                                style: TextStyle(
                                  fontFamily: 'Lato Semibold',
                                  fontSize: 30,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF14D9E1),
                                ),
                              ),
                              const SizedBox(height: 30),
                              SizedBox(
                                width: MediaQuery.of(context).size.width * 0.9,
                                height: MediaQuery.of(context).size.width * 0.1,
                              ),

                              // ✅ Email field - disable khi loading
                              TextFormField(
                                controller: emailController,
                                onChanged: validateEmail,
                                enabled: !isLoading,
                                decoration: InputDecoration(
                                  filled: true,
                                  fillColor: Color(0xFFF1F1F1),
                                  hintText: S.of(context).emails,
                                  errorText: errorEmails,
                                  prefixIcon: Icon(Icons.mail),
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
                                keyboardType: TextInputType.emailAddress,
                              ),
                              SizedBox(height: 20),

                              // ✅ Password field - disable khi loading
                              TextFormField(
                                controller: password,
                                onChanged: validatePassword,
                                obscureText: iconShowPassword1,
                                enabled: !isLoading,
                                decoration: InputDecoration(
                                  errorText: errorPassword,
                                  filled: true,
                                  fillColor: Color(0xFFF1F1F1),
                                  hintText: S.of(context).password,
                                  prefixIcon: Icon(Icons.lock),
                                  suffixIcon: IconButton(
                                    onPressed: isLoading ? null : () {
                                      setState(() {
                                        iconShowPassword1 = !iconShowPassword1;
                                      });
                                    },
                                    icon: Icon(
                                      iconShowPassword1
                                          ? Icons.visibility
                                          : Icons.visibility_off,
                                      color: Colors.grey,
                                    ),
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
                              const SizedBox(height: 20),

                              // ✅ Confirm Password field - disable khi loading
                              TextFormField(
                                controller: confirmPassword,
                                obscureText: iconShowPassword2,
                                enabled: !isLoading,
                                decoration: InputDecoration(
                                  errorText: errorConfirmPassWord,
                                  filled: true,
                                  fillColor: Color(0xFFF1F1F1),
                                  hintText: S.of(context).confirmPassword,
                                  prefixIcon: Icon(Icons.password),
                                  suffixIcon: IconButton(
                                    onPressed: isLoading ? null : () {
                                      setState(() {
                                        iconShowPassword2 = !iconShowPassword2;
                                      });
                                    },
                                    icon: Icon(
                                      iconShowPassword2
                                          ? Icons.visibility
                                          : Icons.visibility_off,
                                      color: Colors.grey,
                                    ),
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
                                onChanged: comparePassword,
                              ),
                              const SizedBox(height: 30),

                              // ✅ Register Button với loading state
                              SizedBox(
                                width: MediaQuery.of(context).size.width * 0.8,
                                child: ElevatedButton(
                                  onPressed: isLoading ? null : registerUser,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: isLoading ? Colors.grey : Color(0xFF16F1FA),
                                    foregroundColor: Colors.white,
                                    padding: EdgeInsets.symmetric(vertical: 10),
                                  ),
                                  child: isLoading
                                      ? Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                        ),
                                      ),
                                      SizedBox(width: 10),
                                      Text("Đang xử lý..."),
                                    ],
                                  )
                                      : Text(S.of(context).signUp),
                                ),
                              ),

                              const SizedBox(height: 10),
                              Row(
                                children: [
                                  Expanded(
                                    child: Divider(
                                      thickness: 1,
                                      color: Colors.grey.shade300,
                                      indent: 20,
                                      endIndent: 10,
                                    ),
                                  ),
                                  Text(
                                    S.of(context).orContinueWith,
                                    style: TextStyle(
                                      fontSize: 15,
                                      color: Color(0xFF404040),
                                    ),
                                  ),
                                  Expanded(
                                    child: Divider(
                                      thickness: 1,
                                      color: Colors.grey.shade300,
                                      indent: 10,
                                      endIndent: 20,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 20),

                              // ✅ Social buttons - disable khi loading
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  SizedBox(
                                    height: 60,
                                    width: 80,
                                    child: ElevatedButton(
                                      onPressed: isLoading ? null : () {},
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.transparent,
                                        shadowColor: Colors.transparent,
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(10),
                                          side: BorderSide(color: Colors.grey.shade400),
                                        ),
                                      ),
                                      child: Image.asset("assets/icons/icons_facebook.png"),
                                    ),
                                  ),
                                  const SizedBox(width: 20),
                                  SizedBox(
                                    height: 60,
                                    width: 80,
                                    child: ElevatedButton(
                                      onPressed: isLoading ? null : () {},
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.transparent,
                                        shadowColor: Colors.transparent,
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(10),
                                          side: BorderSide(color: Colors.grey.shade400),
                                        ),
                                      ),
                                      child: Image.asset("assets/icons/icons_google.png"),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 50),
                            ],
                          ),
                        ),
                      ),
                  ),
                      // ✅ Loading Overlay - Hiển thị vòng tròn loading
                  if (isLoading)
                  Container(
                    color: Colors.black.withOpacity(0.5),
                    child: Center(
                      child: Container(
                        padding: EdgeInsets.all(30),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(15),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.2),
                              blurRadius: 10,
                              offset: Offset(0, 5),
                            ),
                          ],
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            CircularProgressIndicator(
                              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF16F1FA)),
                              strokeWidth: 3,
                            ),
                            SizedBox(height: 20),
                            Text(
                              "Đang đăng ký...",
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                                color: Colors.black87,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}