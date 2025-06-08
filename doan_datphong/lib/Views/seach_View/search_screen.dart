import 'package:flutter/material.dart';
import 'package:doan_datphong/Models/User.dart';
import 'package:doan_datphong/Views/home_View/home_screen.dart';
import '../listBooking_View/listBooking_screen.dart';
import '../profile_View/profile_screen.dart';

class SearchView extends StatefulWidget {
  final User? user;

  const SearchView({super.key, required this.user});

  @override
  _SearchViewState createState() => _SearchViewState();
}

class _SearchViewState extends State<SearchView> {
  int _currentIndex = 1;
  final TextEditingController _searchController = TextEditingController();
  final List<Map<String, dynamic>> _hotels = [
    {
      'name': 'Le Bristol Hotel',
      'location': 'Istanbul, Turkiye',
      'rating': 4.8,
      'reviews': 4981,
      'price': 27,
    },
    {
      'name': 'Maison Souquet',
      'location': 'Paris, France',
      'rating': 4.8,
      'reviews': 4378,
      'price': 35,
    },
    {
      'name': 'Le Meurice Hotel',
      'location': 'London, United Kingdom',
      'rating': 4.6,
      'reviews': 3672,
      'price': 32,
    },
    {
      'name': 'Plaza Athenee',
      'location': 'Rome, Italia',
      'rating': 4.7,
      'reviews': 4123,
      'price': 36,
    },
  ];
  late List<Map<String, dynamic>> _filteredHotels;

  @override
  void initState() {
    super.initState();
    _filteredHotels = List.from(_hotels);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _filterHotels(String query) {
    setState(() {
      _filteredHotels = _hotels.where((hotel) {
        final nameLower = hotel['name'].toString().toLowerCase();
        final locationLower = hotel['location'].toString().toLowerCase();
        final searchLower = query.toLowerCase();

        return nameLower.contains(searchLower) ||
            locationLower.contains(searchLower);
      }).toList();
    });
  }

  Widget _buildHotelCard(Map<String, dynamic> hotel) {
    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              hotel['name'],
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              hotel['location'],
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.star, color: Colors.amber, size: 20),
                const SizedBox(width: 4),
                Text(
                  hotel['rating'].toString(),
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  '(${hotel['reviews'].toString()} reviews)',
                  style: const TextStyle(
                    fontSize: 14,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '\$${hotel['price']}',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue,
                  ),
                ),
                const Text(
                  '/ night',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey,
                  ),
                ),
                const Spacer(),
                ElevatedButton(
                  onPressed: () {
                    // Handle booking
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF14D9E1),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'Book Now',
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Search Hotels',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search hotels or locations...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onChanged: _filterHotels,
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _filteredHotels.length,
              itemBuilder: (context, index) {
                return _buildHotelCard(_filteredHotels[index]);
              },
            ),
          ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          if (_currentIndex == index) return;

          setState(() {
            _currentIndex = index;
          });

          switch (index) {
            case 0:
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => HomeScreen(user: widget.user)),
              );
              break;
            case 1:
            // Đang ở trang Search rồi nên không làm gì
              break;
            case 2:
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => ListBookingScreen(user: widget.user)),
              );
              break;
            case 3:
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => ProfileScreen(user: widget.user)),
              );
              break;
          }
        },
        selectedItemColor: const Color(0xFF14D9E1),
        unselectedItemColor: const Color(0xff9A9EAB),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.search),
            label: 'Search',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.view_list_outlined),
            label: 'Booking',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}