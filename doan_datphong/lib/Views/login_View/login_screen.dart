import 'package:doan_datphong/Blocs/login_Blocs/login_bloc.dart';
import 'package:doan_datphong/Blocs/login_Blocs/login_event.dart';
import 'package:doan_datphong/Blocs/login_Blocs/login_state.dart';
import 'package:doan_datphong/Data/Repository/login_Repository/login_repo.dart';
import 'package:doan_datphong/Views/register_View/fill_profile_screen.dart';
import 'package:doan_datphong/Views/register_View/register_screen.dart';
import 'package:doan_datphong/Views/home_View/home_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:doan_datphong/generated/l10n.dart';
import 'package:doan_datphong/Views/components/NotificationDialog.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  _LoginState createState() => _LoginState();
}

class _LoginState extends State<LoginScreen> {

  final _formKey = GlobalKey<FormState>();
  bool iconShowPassword = true;
  bool isChecked = false;

  TextEditingController emailsController = TextEditingController();
  TextEditingController passwordController = TextEditingController();
  String? errorEmails;
  String? errorPassword;

  Future<void> _loadRegisteredEmail() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String? email = prefs.getString("registered_email");

    setState(() {
      emailsController = TextEditingController(text: email ?? "");
    });
  }

  void authLogin() {
    validateEmail(emailsController.text);
    validatePassword(passwordController.text);

    bool hasEmptyFields = emailsController.text.trim().isEmpty ||
        passwordController.text.trim().isEmpty;

    if (hasEmptyFields) {
      NotificationDialog.showWarning(
          context,
          message: S.of(context).pleaseEnterAllFields);
      return;
    }

    if (errorEmails != null || errorPassword != null) {
      NotificationDialog.showWarning(context, message: S.of(context).pleaseFixValidationErrors);
      return;
    }

    // ✅ Dispatch event đến LoginBloc
    context.read<LoginBloc>().add(
      LoginSubmiited(
        emailsController.text.trim(),
        passwordController.text.trim(),
      ),
    );
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
    return BlocListener<LoginBloc, LoginState>(
      // ✅ BlocListener CHỈ để listen, thay SnackBar bằng NotificationDialog
      listener: (context, state) {
        if (state is LoginSuccess) {
          Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => HomeScreen(user: state.userData,)));
        }
        else if (state is LoginIncomplete) {
          Navigator.pushReplacement(context, MaterialPageRoute(builder: (context) => FillProfile()));
        } else if (state is LoginFailure) {
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
          ),
          body: BlocBuilder<LoginBloc, LoginState>(
            builder: (context, state) {
              bool isLoading = state is LoginLoading;

              return Stack(
                children: [
                  // ✅ Main UI
                  SingleChildScrollView(
                    child: Padding(
                      padding: const EdgeInsets.all(10),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          children: [
                            Text(
                              S.of(context).welcomeToStaytion,
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
                              controller: emailsController,
                              keyboardType: TextInputType.emailAddress,
                              onChanged: validateEmail,
                              enabled: !isLoading,
                              decoration: InputDecoration(
                                errorText: errorEmails,
                                filled: true,
                                fillColor: Color(0xFFF1F1F1),
                                hintText: S.of(context).emails,
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
                            ),
                            SizedBox(
                              width: MediaQuery.of(context).size.width * 0.9,
                              height: MediaQuery.of(context).size.width * 0.1,
                            ),

                            // ✅ Password field - disable khi loading
                            TextFormField(
                              controller: passwordController,
                              obscureText: iconShowPassword,
                              onChanged: validatePassword,
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
                                      iconShowPassword = !iconShowPassword;
                                    });
                                  },
                                  icon: Icon(
                                    iconShowPassword
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

                            const SizedBox(height: 30),

                            // ✅ Remember me checkbox - disable khi loading
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                SizedBox(
                                  width: 250,
                                  child: CheckboxListTile(
                                    title: Text(
                                      S.of(context).rememberMe,
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    value: isChecked,
                                    onChanged: isLoading ? null : (bool? value) {
                                      setState(() {
                                        isChecked = value!;
                                      });
                                    },
                                    controlAffinity: ListTileControlAffinity.leading,
                                    checkColor: Colors.white,
                                    activeColor: Color(0xFF16F1FA),
                                    side: BorderSide(color: Color(0xFF16F1FA), width: 2),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),

                            // ✅ Login Button với loading state
                            SizedBox(
                              width: MediaQuery.of(context).size.width * 0.8,
                              child: ElevatedButton(
                                onPressed: isLoading ? null : authLogin,
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
                                    Text("Đang đăng nhập..."),
                                  ],
                                )
                                    : Text(S.of(context).signIn),
                              ),
                            ),

                            const SizedBox(height: 10),
                            Text(
                              S.of(context).forgotPassword,
                              style: TextStyle(
                                fontFamily: 'Lato Semibold',
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF14D9E1),
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

                            // ✅ Sign up section - disable khi loading
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  S.of(context).dontHaveAccount,
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontFamily: 'Lato Semibold',
                                    color: Colors.grey.shade600,
                                  ),
                                ),
                                const SizedBox(width: 10),
                                TextButton(
                                  onPressed: isLoading ? null : () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => RegisterScreen(),
                                      ),
                                    );
                                    emailsController.clear();
                                    passwordController.clear();
                                  },
                                  child: Text(
                                    S.of(context).signUp,
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontFamily: 'Lato Semibold',
                                      color: Color(0xFF14D9E1),
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
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
                                "Đang đăng nhập...",
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