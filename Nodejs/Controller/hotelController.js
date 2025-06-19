const express = require("express");
const Room = require('../Model/Room/Room');
const RoomType = require('../Model/RoomType/RoomType');
const { uploadHotel } = require("../config/upload"); 
const Hotel = require("../Model/Hotel/Hotel"); 
const { route } = require("./userController");
const router = express.Router();
const Booking = require("../Model/Booking/Booking");


router.post("/upload", uploadHotel.single("hinhAnh"), async (req, res) => {
    try {
        const newHotel = new Hotel({
            tenKhachSan: req.body.tenKhachSan,
            diaChi: req.body.diaChi,
            thanhPho: req.body.thanhPho,
            moTa: req.body.moTa,
            soSao: req.body.soSao,
            soDienThoai: req.body.soDienThoai,
            email: req.body.email,
            giaCa: req.body.giaCa,
            hinhAnh: req.file ? `/uploads/hotels/${req.file.filename}` : "",
        });

        await newHotel.save();
        res.status(201).json({ message: "Thêm khách sạn thành công!", hotel: newHotel });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error });
    }
});

router.get("/getHotelList", async (req,res) => {
    try{
        const hotels  = await Hotel.find();
        if(!hotels ){
            return res.status(404).json({
                message:{msgBody:"Empty list!",msgError:false}
            });
        }
        return res.status(200).json({
            message:{msgBody:"Successfully!", msgError:false},
            hotels : hotels
        });
    }catch(err){
        return res.status(500).json({ message: 'Lỗi Server', error: err.message });
    }
})


router.get('/:hotelId/rooms', async (req, res) => {
  const { hotelId } = req.params;
  const { checkInDate, checkOutDate } = req.query;

  if (!checkInDate || !checkOutDate) {
    return res.status(400).json({ message: "Missing checkInDate or checkOutDate" });
  }

  try {
    const rooms = await Room.find({ maKhachsan: hotelId }).populate('maLoaiPhong');

    const parsedCheckIn = new Date(checkInDate);
    const parsedCheckOut = new Date(checkOutDate);

    const roomDetails = await Promise.all(rooms.map(async (room) => {
      // Tìm các booking giao với khoảng này
      const overlappingBookings = await Booking.find({
        roomId: room._id,
        checkInDate: { $lte: parsedCheckOut },
        checkOutDate: { $gte: parsedCheckIn }
      });

      let bookedCount = 0;
      for (const booking of overlappingBookings) {
        bookedCount += booking.quantity || 1;
      }

      const availableRooms = Math.max(room.totalRooms - bookedCount, 0);

      return {
        maPhong: room._id,
        maLoaiPhong: room.maLoaiPhong.tenLoaiPhong,
        giaCa: room.roomTypeId.giaCa,
        hinhAnh: room.hinhAnh,
        trangThaiPhong: room.trangThaiPhong,
        moTa: room.moTa,
        soLuongGiuong: room.soLuongGiuong,
        soLuongNguoiToiDa: room.soLuongNguoiToiDa,
        danhSachTienNghi: room.danhSachTienNghi,
        tongSoPhong: room.tongSoPhong,
        availableRooms: availableRooms

      };
    }));

    return res.status(200).json({
      message: { msgBody: "Successfully!", msgError: false },
      rooms: roomDetails
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


router.post('/:hotelId/rooms/update-availability', async (req, res) => {
  const { hotelId } = req.params;

  try {
    const rooms = await Room.find({ maKhachsan: hotelId });
    
    await Promise.all(rooms.map(async (room) => {
      // Tính toán số phòng đã được đặt
      const bookings = await Booking.find({ maPhong: room._id });
      const bookedCount = bookings.reduce((sum, booking) => sum + (booking.quantity || 1), 0);
      
      // Cập nhật TRỰC TIẾP vào totalRooms (giả sử totalRooms ban đầu là tổng phòng)
      room.tongSoPhong = room.tongSoPhong - bookedCount;
      await room.save();
    }));

    res.status(200).json({ message: 'Room availability updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
