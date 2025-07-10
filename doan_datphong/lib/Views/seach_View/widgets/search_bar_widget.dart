import 'package:flutter/material.dart';

class SearchBarWidget extends StatefulWidget {
  final TextEditingController controller;
  final Function(String) onChanged;
  final VoidCallback onFilterTap;

  const SearchBarWidget({
    super.key,
    required this.controller,
    required this.onChanged,
    required this.onFilterTap,
  });

  @override
  _SearchBarWidgetState createState() => _SearchBarWidgetState();


}
class _SearchBarWidgetState extends State<SearchBarWidget>{
  final FocusNode _focusNode = FocusNode();
  bool _onTapRemove = false;


  @override
  void initState() {
    super.initState();
    _focusNode.addListener(_handleOnTapRemoveChange);
  }

  @override
  void dispose() {
    _focusNode.removeListener(_handleOnTapRemoveChange);
    _focusNode.dispose();
    super.dispose();
  }

  void _handleOnTapRemoveChange(){
    setState(() {
      _onTapRemove = _focusNode.hasFocus;
    });
  }



  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Colors.grey[300]!,
                  width: 1,
                ),
              ),
              child: TextField(
                controller: widget.controller,
                onChanged: widget.onChanged,
                decoration: InputDecoration(
                  hintText: 'Hotel',
                  hintStyle: const TextStyle(
                    color: Colors.grey,
                    fontSize: 16,
                  ),
                  prefixIcon: const Icon(
                    Icons.search,
                    color: Colors.grey,
                    size: 20,
                  ),
                  suffixIcon: AnimatedRotation(
                    duration: Duration(milliseconds: 300),
                    turns: _onTapRemove ? 0.25 : 0,
                    child: IconButton(
                        onPressed: widget.controller.clear,
                        icon: Icon(Icons.highlight_remove_outlined,color: Colors.red, size: 20,),

                    ),
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                ),
                style: const TextStyle(
                  fontSize: 16,
                  color: Colors.black87,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: widget.onFilterTap,
            child: Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: const Color(0xFF1565C0),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.tune,
                color: Colors.white,
                size: 24,
              ),
            ),
          ),
        ],
      ),
    );
  }
}