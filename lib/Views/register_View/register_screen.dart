import 'package:doan_datphong/Blocs/register_Blocs/register_bloc.dart';
import 'package:doan_datphong/Blocs/register_Blocs/register_event.dart';
import 'package:doan_datphong/Blocs/register_Blocs/register_state.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

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
    if(_formKey.currentState!.validate() && errorEmails == null &&errorConfirmPassWord == null){
      context.read<RegisterBlocs>().add(
        RegisterSubmitted(
          emailController.text.trim(),
          password.text.trim()
        ),
      );
    }
  }

  void comparePassword(String confirmPassword){
    String passwordPrevious = password.text.trim();
      if (confirmPassword != passwordPrevious){
        setState(() {
          errorConfirmPassWord = "Passwords do not match!";
        });
        
      }else{
        setState(() {
          errorConfirmPassWord = null;
        });
        
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
    return BlocListener<RegisterBlocs,RegisterState>(
      listener: (context,state){
        if(state is RegisterSuccess){
          showDialog(
              context: context,
              builder: (context) => AlertDialog(
                title: Text("Successful!",
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 20,
                  color: Color(0xFF14D9E1)
                ),),
                content: Text("Registration successful!",
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
        }else if (state is RegisterFailure){
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.errorMessage)),
          );
        }
      },
      child: SafeArea(
        child: Scaffold(
          backgroundColor: Color(0xFFFFFFFF),
          appBar: AppBar(
            backgroundColor: Colors.white,
            leading: IconButton(
              onPressed: () {
                Navigator.pop(context);
              },
              icon: Icon(Icons.arrow_back),
            ),
          ),
          body: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    Text(
                      "Create your Account",
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
                      controller: emailController,
                      onChanged: validateEmail,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Color(0xFFF1F1F1),
                        hintText: "E-mails",
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
                    TextFormField(
                      controller: password,
                      onChanged: validatePassword,
                      obscureText: iconShowPassword1,
                      decoration: InputDecoration(
                        errorText: errorPassword,
                        filled: true,
                        fillColor: Color(0xFFF1F1F1),
                        hintText: "Password",
                        prefixIcon: Icon(Icons.lock),
                        suffixIcon: IconButton(
                          onPressed: () {
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

                    TextFormField(

                      controller: confirmPassword,
                      obscureText: iconShowPassword2,

                      decoration: InputDecoration(
                        errorText: errorConfirmPassWord,
                        filled: true,
                        fillColor: Color(0xFFF1F1F1),
                        hintText: "Confirm Password",
                        prefixIcon: Icon(Icons.password),
                        suffixIcon: IconButton(
                          onPressed: () {
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


                    SizedBox(
                      width: MediaQuery.of(context).size.width * 0.8,
                      child: ElevatedButton(
                        onPressed: registerUser,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Color(0xFF16F1FA),
                          foregroundColor: Colors.white,
                          padding: EdgeInsets.symmetric(vertical: 10),
                        ),
                        child: Text("Sign up"),
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
