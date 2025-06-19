const express = require("express");
const Booking = require("../Model/Booking/Booking");
const bookingRouter = express.Router();
const Room = require("../Model/Room/Room");
const Hotel = require("../Model/Hotel/Hotel");
const mongoose = require("mongoose");
const authorizeRoles = require('../middleware/roleAuth');
const User = require("../Model/User/User");
const moment = require('moment-timezone');

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

    const bookings = await Booking.find({ maNguoiDung: new mongoose.Types.ObjectId(userId) })
      .populate({
        path: "maKhachSan",
        select: "tenKhachSan diaChi hinhAnh",
      })
      .populate({
        path: "maPhong",
        populate: {
          path: "maLoaiPhong",
          select: "tenLoaiPhong",
        },
        select: "maLoaiPhong",
      });

    // Tạo mảng dữ liệu đơn giản hóa
    const formattedBookings = bookings.map((b) => ({
      id: b._id,
      tenKhachSan: b.maKhachSan?.tenKhachSan ?? "Unknown Hotel",
      diaChiKhachSan: b.maKhachSan?.diaChi ?? "Unknown Address",
      tenLoaiPhong: b.maPhong?.maLoaiPhong?.tenLoaiPhong ?? "Unknown Room Type",
      hinhAnhKhachSan: b.maKhachSan?.hinhAnh,
      // Thêm các field khác như ngày nhận, trả, tổng tiền...
      ngayNhanPhong: b.ngayNhanPhong,
      ngayTraPhong: b.ngayTraPhong,
      gioNhanPhong: b.gioNhanPhong,
      gioTraPhong: b.gioTraPhong,
      tongTien: b.tongTien,
      phuongThucThanhToan: b.phuongThucThanhToan,
      trangThai: b.trangThai,
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


// --------------------------------------------------------------------------------------------------

bookingRouter.get("/hotelowner/bookings", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
  try {
    const { hotelId, filter, fromDate, toDate, status } = req.query;
    const user = await User.findById(req.user.id);

    if (!user || user.vaiTro !== "chuKhachSan") {
      return res.status(403).json({
        msgBody: "Tài khoản không có quyền sử dụng chức năng này!",
        msgError: true
      });
    }

    const hotels = await Hotel.find({ maChuKhachSan: user._id });
    if (hotels.length === 0) {
      return res.status(404).json({
        msgBody: "Bạn chưa sở hữu khách sạn nào.",
        msgError: true
      });
    }
    console.log("các khách sạn ",hotels);

    const hotelIds = hotels.map(h => h._id);
    console.log("Hotelids ",hotelIds);
    let query = {};

    if (req.query.hotelId) {
      const requestedHotelId = req.query.hotelId;
      console.log("mã chủ khách sạn: ",requestedHotelId);
      if (!hotelIds.map(id => id.toString()).includes(requestedHotelId)) {
        console.log("❌ Hotel ID not found in user's hotels");
        console.log("🔍 Available hotel IDs:", hotelIds.map(id => id.toString()));
        return res.status(403).json({
          msgBody: "Bạn không có quyền truy cập dữ liệu của khách sạn này.",
          msgError: true
        });
      }
      console.log("hehe",query.maKhachSan);
      query.maKhachSan = requestedHotelId;
    } else {
      query.maKhachSan = { $in: hotelIds };
    }


    // Lọc theo trạng thái booking nếu có
    if (status && ["Đang chờ", "Đã xác nhận", "Đã hủy"].includes(status)) {
      query.trangThai = status;
    }

    // Lọc theo ngày check-in nếu có
    if (fromDate || toDate) {
      if (fromDate && !moment(fromDate, "YYYY-MM-DD", true).isValid()) {
        return res.status(400).json({
          msgBody: "Định dạng ngày 'fromDate' không hợp lệ (YYYY-MM-DD)",
          msgError: true
        });
      }
      if (toDate && !moment(toDate, "YYYY-MM-DD", true).isValid()) {
        return res.status(400).json({
          msgBody: "Định dạng ngày 'toDate' không hợp lệ (YYYY-MM-DD)",
          msgError: true
        });
      }
      query.ngayNhanPhong = {};
      if (fromDate) {
        query.ngayNhanPhong.$gte = moment(fromDate, "YYYY-MM-DD").format("DD-MM-YYYY");
      }
      if (toDate) {
        query.ngayNhanPhong.$lte = moment(toDate, "YYYY-MM-DD").format("DD-MM-YYYY");
      }
    }

    let bookings = await Booking.find(query)
      .populate("maNguoiDung", "tenNguoiDung email soDienThoai")
      .populate({
        path: "maPhong",
        populate: { path: "maLoaiPhong", model: "loaiPhong", select: "tenLoaiPhong" }
      })
      .populate("maKhachSan", "tenKhachSan")
      .sort({ createdAt: -1 });

    // Lọc theo thời gian check-in/check-out (nếu filter được truyền)
    const today = moment().startOf("day");

    if (filter) {
      bookings = bookings.filter(booking => {
        const checkIn = moment(booking.ngayNhanPhong, "DD-MM-YYYY", true);
        const checkOut = moment(booking.ngayTraPhong, "DD-MM-YYYY", true);
        if (!checkIn.isValid() || !checkOut.isValid()) return false;

        if (filter === "past") return checkOut.isBefore(today, "day");
        if (filter === "upcoming") return checkIn.isAfter(today, "day");
        if (filter === "current") return checkIn.isSameOrBefore(today, "day") && checkOut.isSameOrAfter(today, "day");
        return true;
      });
    }

    const result = bookings.map(booking => ({
      hotelId : booking.maKhachSan,
      bookingId: booking._id,
      customerName: booking.maNguoiDung?.tenNguoiDung || "Khách lẻ",
      roomType: booking.maPhong?.maLoaiPhong?.tenLoaiPhong || "N/A",
      checkInDate: moment(booking.ngayNhanPhong, ["YYYY-MM-DD", "DD-MM-YYYY", moment.ISO_8601]).format("DD-MM-YYYY"),
      checkOutDate: moment(booking.ngayTraPhong, ["YYYY-MM-DD", "DD-MM-YYYY", moment.ISO_8601]).format("DD-MM-YYYY"),
      email: booking.maNguoiDung?.email || "N/A",
      phoneNumber: booking.maNguoiDung?.soDienThoai || "N/A",
      paymentMethod: booking.phuongThucThanhToan,
      status: booking.trangThai,
      createdAt: (booking.thoiGianTaoDon),
      totalAmount: booking.tongTien || "N/A",
      paymentStatus: booking.trangThaiThanhToan || "N/A",
    }));
    console.log("Kết quả trả về:", result);

    return res.status(200).json(result);

  } catch (error) {
    console.error("Lỗi khi lấy danh sách booking:", error);
    return res.status(500).json({
      msgBody: "Lỗi máy chủ khi lấy danh sách đặt phòng.",
      msgError: true
    });
  }
});


// Cập nhật trạng thái đặt phòng
bookingRouter.put("/hotelowner/update/:id", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
  try {
    const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({
      message: {
        msgBody: "✅ Cập nhật trạng thái đơn đặt thành công!",
        msgError: false
      },
      updatedBooking
    });
  } catch (error) {
    res.status(400).json({
      message: {
        msgBody: "❌ Cập nhật trạng thái đơn đặt thất bại!",
        msgError: true
      },
      error: error.message
    });
  }
});



bookingRouter.post("/hotelowner/create-booking", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
  try {
    const guestUserId = '684c6304de66d4781c70129e';
    const { hotelsId, roomId } = req.body;

    // Kiểm tra phòng có tồn tại và thuộc khách sạn đó không
    const room = await Room.findOne({ _id: roomId, hotelsId: hotelsId });
    if (!room) {
      return res.status(400).json({
        msgBody: "Phòng không thuộc khách sạn này hoặc không tồn tại!",
        msgError: true,
      });
    }

    const newBooking = new Booking({
      ...req.body,
      userId: req.body.userId || guestUserId
    });

    await newBooking.save();

    res.status(200).json({
      message: {
        msgBody: "Tạo đơn đặt phòng thành công!",
        msgError: false
      },
      booking: newBooking
    });

  } catch (error) {
    console.error("Lỗi tạo booking:", error);
    res.status(400).json({
      msgBody: "Tạo đơn đặt phòng thất bại!",
      msgError: true
    });
  }
});


module.exports = bookingRouter;