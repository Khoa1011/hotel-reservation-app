const express = require("express");
const Room = require('../Model/Room/Room');
const RoomType = require('../Model/RoomType/RoomType');
const upload = require("../config/upload"); 
const Hotel = require("../Model/Hotel/Hotel"); 
const { route } = require("./userController");
const router = express.Router();
const Booking = require("../Model/Booking/Booking");


router.post("/upload", upload.single("image"), async (req, res) => {
    try {
        const newHotel = new Hotel({
            hotelName: req.body.hotelName,
            address: req.body.address,
            city: req.body.city,
            description: req.body.description,
            star: req.body.star,
            phoneNumber: req.body.phoneNumber,
            email: req.body.email,
            price: req.body.price,
            image: req.file ? `/uploads/hotels/${req.file.filename}` : "",
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
    const rooms = await Room.find({ hotelsId: hotelId }).populate('roomTypeId');

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
        roomId: room._id,
        roomType: room.roomTypeId.roomType,
        price: room.roomTypeId.price,
        image: room.image,
        roomState: room.roomState,
        description: room.description,
        bedCount: room.bedCount,
        capacity: room.capacity,
        amenities: room.amenities,
        totalRooms: room.totalRooms,
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
    const rooms = await Room.find({ hotelsId: hotelId });
    
    await Promise.all(rooms.map(async (room) => {
      // Tính toán số phòng đã được đặt
      const bookings = await Booking.find({ roomId: room._id });
      const bookedCount = bookings.reduce((sum, booking) => sum + (booking.quantity || 1), 0);
      
      // Cập nhật TRỰC TIẾP vào totalRooms (giả sử totalRooms ban đầu là tổng phòng)
      room.totalRooms = room.totalRooms - bookedCount;
      await room.save();
    }));

    res.status(200).json({ message: 'Room availability updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
