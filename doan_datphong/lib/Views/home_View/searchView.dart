import 'package:doan_datphong/Views/seach_View/filter_modal.dart';
import 'package:doan_datphong/Views/seach_View/search_screen.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:doan_datphong/generated/l10n.dart';

class SearchBarWithAnimation extends StatefulWidget {
  @override
  _SearchBarWithAnimationState createState() => _SearchBarWithAnimationState();
}

class _SearchBarWithAnimationState extends State<SearchBarWithAnimation> {
  final FocusNode _focusNode = FocusNode();
  final TextEditingController _controller = TextEditingController();
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
    _controller.dispose();
    super.dispose();
  }

  void _handleFocusChange() {
    setState(() {
      _isFocused = _focusNode.hasFocus;
    });
  }

  // ✅ Xử lý khi tap vào ô search
  void _handleSearchTap() {
    // Chuyển sang SearchView (màn hình tìm kiếm)
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => SearchView(user: null), // Truyền user nếu có
      ),
    );
  }

  //Xử lý khi tap vào icon filter
  void _showFilterModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => FilterModal(
        currentFilters: {}, // Truyền current filters
        onFiltersApplied: (filters) {
          // Xử lý khi apply filters
          print('Filters applied: $filters');
          // Có thể navigate sang SearchView với filters
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => SearchView(user: null),
            ),
          );
        },
        onReset: () {
          print('Filters reset');
        },
      ),
    );
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
          child: GestureDetector(
            // ✅ Khi tap vào ô search → chuyển sang SearchView
            onTap: _handleSearchTap,
            child: AbsorbPointer( // Ngăn TextField nhận focus
              child: TextField(
                controller: _controller,
                focusNode: _focusNode,
                decoration: InputDecoration(
                  hintText: S.of(context).searchPlaceholder,
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
                      // ✅ Khi tap vào icon filter → hiện FilterModal
                      onPressed: _showFilterModal,
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
        ),
      ),
    );
  }
}

// ✅ PHIÊN BẢN TỐI ƯU HỖN - Tách riêng search bar và filter button
class SearchBarWithSeparateActions extends StatelessWidget {
  final VoidCallback? onSearchTap;
  final VoidCallback? onFilterTap;
  final String? initialText;

  const SearchBarWithSeparateActions({
    Key? key,
    this.onSearchTap,
    this.onFilterTap,
    this.initialText,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: Row(
        children: [
          // ✅ Search Bar - Tap để chuyển sang SearchView
          Expanded(
            child: GestureDetector(
              onTap: onSearchTap ?? () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => SearchView(user: null),
                  ),
                );
              },
              child: Container(
                height: 50,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(15),
                  border: Border.all(
                    color: Colors.grey.shade300,
                    width: 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 5,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Icon(
                        Icons.search,
                        color: Colors.grey.shade500,
                        size: 24,
                      ),
                    ),
                    Expanded(
                      child: Text(
                        initialText ?? S.of(context).searchPlaceholder,
                        style: TextStyle(
                          color: initialText != null
                              ? Colors.black87
                              : Colors.grey.shade500,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(width: 12),

          // ✅ Filter Button - Tap để hiện FilterModal
          GestureDetector(
            onTap: onFilterTap ?? () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (context) => FilterModal(
                  currentFilters: {},
                  onFiltersApplied: (filters) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => SearchView(user: null),
                      ),
                    );
                  },
                  onReset: () {},
                ),
              );
            },
            child: Container(
              height: 50,
              width: 50,
              decoration: BoxDecoration(
                color: Color(0xFF1565C0),
                borderRadius: BorderRadius.circular(15),
                boxShadow: [
                  BoxShadow(
                    color: Color(0xFF1565C0).withOpacity(0.3),
                    blurRadius: 8,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: Icon(
                Icons.filter_list_alt,
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