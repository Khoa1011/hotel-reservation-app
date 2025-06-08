import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class SearchBarWithAnimation extends StatefulWidget {
  @override
  _SearchBarWithAnimationState createState() => _SearchBarWithAnimationState();
}

class _SearchBarWithAnimationState extends State<SearchBarWithAnimation> {
  final FocusNode _focusNode = FocusNode();
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(_handleFocusChange);
  }

  @override
  void dispose() {
    _focusNode.removeListener(_handleFocusChange);
    _focusNode.dispose();
    super.dispose();
  }

  void _handleFocusChange() {
    setState(() {
      _isFocused = _focusNode.hasFocus;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: SizedBox(
        height: 50,
        child: AnimatedContainer(
          duration: Duration(milliseconds: 200),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(15),
            boxShadow: _isFocused
                ? [
              BoxShadow(
                color: Colors.blue.withOpacity(0.1),
                blurRadius: 10,
                spreadRadius: 2,
                offset: Offset(0, 2),
              )
            ]
                : [],
          ),
          child: TextField(
            focusNode: _focusNode,
            decoration: InputDecoration(
              hintText: "Search...",
              hintStyle: TextStyle(
                color: Colors.grey.shade500,
                fontSize: 16,
              ),
              prefixIcon: Icon(
                Icons.search,
                color: _isFocused ? Colors.blue.shade400 : Colors.grey.shade500,
                size: 24,
              ),
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(15),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(15),
                borderSide: BorderSide(
                  color: Colors.grey.shade300,
                  width: 1,
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(15),
                borderSide: BorderSide(
                  color: Colors.blue.shade400,
                  width: 1.5,
                ),
              ),
              contentPadding: EdgeInsets.symmetric(vertical: 12),
              suffixIcon: AnimatedRotation(
                duration: Duration(milliseconds: 300),
                turns: _isFocused ? 0.25 : 0,
                child: IconButton(
                  onPressed: () {},
                  icon: Icon(
                    Icons.filter_list_alt,
                    color: _isFocused ? Colors.blue.shade400 : Color(0xff9A9EAB),
                  ),
                ),
              ),
            ),
            style: TextStyle(
              fontSize: 16,
              color: Colors.black87,
            ),
            cursorColor: Colors.blue.shade400,
          ),
        ),
      ),
    );
  }
}