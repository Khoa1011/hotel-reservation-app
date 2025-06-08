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
  if (_formKey.currentState!.validate() && errorEmails == null && errorPassword == null) {
    context.read<LoginBloc>().add(
      LoginSubmiited(
        emailsController.text.trim(),
        passwordController.text.trim(),
      ),
    );
  }
}


  void validateEmail(String email) {
    if (email.isEmpty) {
      setState(() {
        errorEmails = "Email cannot be empty!";
      });
    }else if (!RegExp(
      r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9]+\.[a-zA-Z]+",
    ).hasMatch(email)) {
      setState(() {
        errorEmails = "Enter a valid email!";
      });
    }else{
      setState(() {
        errorEmails = null;
      });
    }
  }

  void validatePassword(String password) {
    if (password.length < 6) {
      setState(() {
        errorPassword = "Password must be at least 6 characters!";
      });
    }else{
      setState(() {
        errorPassword = null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<LoginBloc, LoginState>(
      listener: (context,state){
        if (state is LoginSuccess){
          Navigator.pushReplacement(
            context, 
            MaterialPageRoute(builder: (context) => HomeScreen(user: state.userData,)));
        }
        else if(state is LoginIncomplete){
          Navigator.pushReplacement(context, MaterialPageRoute(builder: (context) => FillProfile()));

        }else if (state is LoginFailure){
          ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content:  Text(state.errorMessage))
          );
        }

      },
      child: SafeArea(
        child: Scaffold(
          backgroundColor: Color(0xFFFFFFFF),
          appBar: AppBar(
            backgroundColor: Colors.white,
            
          ),
          body: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    Text(
                      "Welcome to Staytion",
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
                    TextFormField(
                      controller: emailsController,
                      keyboardType: TextInputType.emailAddress,
                      onChanged: validateEmail,
                      
                      decoration: InputDecoration(
                        errorText: errorEmails,
                        filled: true,
                        fillColor: Color(0xFFF1F1F1),
                        hintText: "E-mails",
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
                    TextFormField(
                      controller: passwordController,
                      obscureText: iconShowPassword,
                      onChanged: validatePassword,
                      decoration: InputDecoration(
                        errorText: errorPassword,
                    
                        filled: true,
                        fillColor: Color(0xFFF1F1F1),
                        hintText: "Password",
                        prefixIcon: Icon(Icons.lock),
                        suffixIcon: IconButton(
                          onPressed: () {
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
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 250,
                          child: CheckboxListTile(
                            title: Text(
                              "Remember me",
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            value: isChecked,
                            onChanged: (bool? value) {
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
                    SizedBox(
                      width: MediaQuery.of(context).size.width * 0.8,
                      child: ElevatedButton(
                        onPressed: () {
                          setState(() {
                            authLogin();
                          });
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Color(0xFF16F1FA),
                          foregroundColor: Colors.white,
                          padding: EdgeInsets.symmetric(vertical: 10),
                        ),
                        child: Text("Sign in"),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      "Forgot the password?",
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
                          "or continue with",
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
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
      
                      children: [
                        SizedBox(
                          height: 60,
                          width: 80,
                          child: ElevatedButton(
                            onPressed: () {},
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
                            onPressed: () {},
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
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          "Don't have an account?",
                          style: TextStyle(
                            fontSize: 14,
                            fontFamily: 'Lato Semibold',
                            color: Colors.grey.shade600,
                          ),
                        ),
                        const SizedBox(width: 10),
                        TextButton(
                          onPressed: () {
                            setState(() {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => RegisterScreen(),
                                ),
                              );
                              emailsController.clear();
                              passwordController.clear();
                            });
                          },
                          child: Text(
                            "Sign up",
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
        ),
      ),
    );
  }
}
