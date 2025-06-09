const express = require("express");
const Booking = require("../Model/Booking/Booking");
const bookingRouter = express.Router();
const Room = require("../Model/Room/Room");
const Hotel = require("../Model/Hotel/Hotel");
const mongoose = require("mongoose");
const  authorizeRoles   = require('../middleware/roleAuth');
const User = require("../Model/User/User");


// Tạo mới một đơn đặt phòng
bookingRouter.post("/addbooking", async (req, res) => {
    try {
      const newBooking = new Booking(req.body);
      await newBooking.save();
      res.status(201).json({ message: "Đặt phòng thành công!", booking: newBooking });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Lấy danh sách đặt phòng
 // GET danh sách booking kèm tên khách sạn
 bookingRouter.get("/getBookingList/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const bookings = await Booking.find({ userId: new mongoose.Types.ObjectId(userId) })
      .populate({
        path: "hotelsId",
        select: "hotelName address image",
      })
      .populate({
        path: "roomId",
        populate: {
          path: "roomTypeId",
          select: "roomType",
        },
        select: "roomTypeId",
      });

    // Tạo mảng dữ liệu đơn giản hóa
    const formattedBookings = bookings.map((b) => ({
      id: b._id,
      hotelName: b.hotelsId?.hotelName ?? "Unknown Hotel",
      hotelAddress: b.hotelsId?.address ?? "Unknown Address",
      roomType: b.roomId?.roomTypeId?.roomType ?? "Unknown Room Type",
      image: b.hotelsId?.image,
      // Thêm các field khác như ngày nhận, trả, tổng tiền...
      checkInDate: b.checkInDate,
      checkOutDate: b.checkOutDate,
      checkInTime: b.checkInTime,
      checkOutTime: b.checkOutTime,
      totalAmount: b.totalAmount,
      paymentMethod: b.paymentMethod,
      status : b.status,
    }));

    return res.status(200).json({
      message: "Successfully",
      bookings: formattedBookings,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


  
  // Cập nhật trạng thái đặt phòng
  bookingRouter.put("/update/:id", async (req, res) => {
    try {
      const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.status(200).json(updatedBooking);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Xóa đơn đặt phòng
  bookingRouter.delete("/delete/:id", async (req, res) => {
    try {
      await Booking.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Đã xóa đặt phòng!" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });


  // API để giảm số lượng phòng sau khi đặt
bookingRouter.put('/:hotelId/rooms/:roomId/book', async (req, res) => {
  const { hotelId, roomId } = req.params;

  try {
    // Tìm phòng theo hotelId và roomId
    const room = await Room.findOne({ hotelId, roomId });

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Kiểm tra xem có phòng còn không
    if (room.availableCount <= 0) {
      return res.status(400).json({ message: 'No rooms available' });
    }

    // Giảm số phòng còn lại
    room.availableCount -= 1;
    await room.save(); // Lưu lại phòng với số lượng mới

    return res.status(200).json({
      message: 'Room successfully booked',
      availableCount: room.availableCount,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});



bookingRouter.get("/hotelowner/getBookingList", authorizeRoles("hotelowner"),async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Kiểm tra quyền
    if (!user || user.role !== "hotelowner") {
      return res.status(403).json({
        msgBody: "Tài khoản không có quyền sử dụng chức năng này!",
        msgError: true
      });
    }

    // Lấy danh sách khách sạn thuộc user này
    const hotels = await Hotel.find({ ownerId: user._id });
    if (hotels.length === 0) {
      return res.status(404).json({
        msgBody: "Bạn chưa sở hữu khách sạn nào.",
        msgError: true
      });
    }
    const hotelIds = hotels.map(hotel => hotel._id);

    // Lấy booking của các khách sạn trên
    const bookings = await Booking.find({ hotelsId: { $in: hotelIds } })
      .populate({
        path: "userId",
        select: "userName email phoneNumber"
      })
      .populate({
        path: "roomId",
        populate: {
          path: "roomTypeId",
          model: "RoomType",
          select: "roomType"
        }
      })
      .populate("hotelsId", "hotelName")
      .sort({ createdAt: -1 });

    // Chuyển dữ liệu về định dạng cần thiết
    const result = bookings.map(booking => ({
      bookingId: booking._id,
      customerName: booking.userId?.userName || "N/A",
      roomType: booking.roomId?.roomTypeId?.roomType || "N/A",
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      email: booking.userId?.email || "N/A",
      phoneNumber: booking.userId?.phoneNumber || "N/A",
      paymentMethod: booking.paymentMethod,
      status: booking.status,
      createdAt: booking.createdAt,
      hotelName: booking.hotelsId?.hotelName || "N/A"
    }));

    return res.status(200).json(result);

  } catch (error) {
    console.error("Lỗi khi lấy danh sách booking:", error);
    return res.status(500).json({
      msgBody: "Lỗi máy chủ khi lấy danh sách đặt phòng.",
      msgError: true
    });
  }
});



  module.exports = bookingRouter;