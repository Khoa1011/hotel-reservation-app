const express = require("express");
const Booking = require("../Model/Booking");
const router = express.Router();
const Room = require("../Model/Room");
const Hotel = require("../Model/Hotel");
const mongoose = require("mongoose");

// Tạo mới một đơn đặt phòng
router.post("/addbooking", async (req, res) => {
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
 router.get("/getBookingList/:userId", async (req, res) => {
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
  router.put("/update/:id", async (req, res) => {
    try {
      const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.status(200).json(updatedBooking);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Xóa đơn đặt phòng
  router.delete("/delete/:id", async (req, res) => {
    try {
      await Booking.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Đã xóa đặt phòng!" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });


  // API để giảm số lượng phòng sau khi đặt
router.put('/:hotelId/rooms/:roomId/book', async (req, res) => {
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


  module.exports = router;