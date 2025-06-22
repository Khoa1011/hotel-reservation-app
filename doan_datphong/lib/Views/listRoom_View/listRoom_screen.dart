import 'package:doan_datphong/Models/KhachSan.dart';
import 'package:doan_datphong/Models/NguoiDung.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../Blocs/getListOfRoom_Blocs/getListOfRoom_bloc.dart';
import '../../Blocs/getListOfRoom_Blocs/getListOfRoom_event.dart';
import '../../Blocs/getListOfRoom_Blocs/getListOfRoom_state.dart';
import 'roomCard_widget.dart';

class ListRoomScreen extends StatefulWidget {
  final String idHotel; // Nhận idHotel từ màn hình trước
  final String checkInDate;
  final String checkOutDate;

  const ListRoomScreen({super.key, required this.idHotel, required this.checkInDate, required this.checkOutDate});

  @override
  _ListRoomState createState() => _ListRoomState();
}

class _ListRoomState extends State<ListRoomScreen> {
  @override
  void initState() {
    super.initState();

    BlocProvider.of<GetListOfRoomBloc>(context).add(FetchRoomList(widget.idHotel, widget.checkInDate,widget.checkOutDate));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Select Room',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        shadowColor: Colors.transparent,
      ),
      body: BlocBuilder<GetListOfRoomBloc, GetListOfRoomState>(
        builder: (context, state) {
          if (state is GetListOfRoomLoading) {
            return const Center(child: CircularProgressIndicator());
          } else if (state is GetListOfRoomSuccess) {
            return ListView.builder(
              itemCount: state.rooms.length,
              itemBuilder: (context, index) {
                return RoomCard(room: state.rooms[index],
                );
              },
            );
          } else if (state is GetListOfRoomFailure) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.hotel, size: 80, color: Colors.grey),
                  SizedBox(height: 10),
                  Text("No rooms available",
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                ],
              ),
            );
          }
          return const Center(child: Text("No data available"));
        },
      ),
    );
  }
}
