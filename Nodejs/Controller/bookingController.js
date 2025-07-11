const express = require("express");
const Booking = require("../Model/Booking/Booking");
const Room = require("../Model/Room/Room");
const Hotel = require("../Model/Hotel/Hotel");
const mongoose = require("mongoose");
const authorizeRoles = require('../middleware/roleAuth');
const User = require("../Model/User/User");
const moment = require('moment-timezone');
const bookingRouter = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const notificationHook = require('../middleware/notificationHook');


bookingRouter.post('/addbooking',notificationHook, async (req, res) => {
  try {
    console.log('📝 Creating new booking:', req.body);
    
    const newBooking = new Booking(req.body);
    await newBooking.save();
    
    console.log('✅ Booking created successfully:', newBooking._id);
    
    res.status(201).json({ 
      success: true,
      message: "Đặt phòng thành công!", 
      booking: newBooking 
    });
  } catch (error) {
    console.error('❌ Booking creation error:', error);
    res.status(400).json({ 
      success: false,
      message: "Đặt phòng thất bại",
      error: error.message 
    });
  }
});


// Lấy danh sách đặt phòng
// GET danh sách booking kèm tên khách sạn
// bookingRouter.get("/getBookingList/:userId", async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const bookings = await Booking.find({ maNguoiDung: new mongoose.Types.ObjectId(userId) })
//       .populate({
//         path: "maKhachSan",
//         select: "tenKhachSan diaChi hinhAnh",
//       })
//       .populate({
//         path: "maPhong",
//         populate: {
//           path: "maLoaiPhong",
//           select: "tenLoaiPhong",
//         },
//         select: "maLoaiPhong",
//       });

//     // Tạo mảng dữ liệu đơn giản hóa
//     const formattedBookings = bookings.map((b) => ({
//       id: b._id,
//       tenKhachSan: b.maKhachSan?.tenKhachSan ?? "Unknown Hotel",
//       diaChiKhachSan: b.maKhachSan?.diaChi ?? "Unknown Address",
//       tenLoaiPhong: b.maPhong?.maLoaiPhong?.tenLoaiPhong ?? "Unknown Room Type",
//       hinhAnhKhachSan: b.maKhachSan?.hinhAnh,
//       // Thêm các field khác như ngày nhận, trả, tổng tiền...
//       ngayNhanPhong: b.ngayNhanPhong,
//       ngayTraPhong: b.ngayTraPhong,
//       gioNhanPhong: b.gioNhanPhong,
//       gioTraPhong: b.gioTraPhong,
//       tongTien: b.tongTien,
//       phuongThucThanhToan: b.phuongThucThanhToan,
//       trangThai: b.trangThai,
//     }));

//     return res.status(200).json({
//       message: "Successfully",
//       bookings: formattedBookings,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });


bookingRouter.get("/getBookingList/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const bookings = await Booking.find({ maNguoiDung: new mongoose.Types.ObjectId(userId) })
      .populate({
        path: "maKhachSan",
        select: "tenKhachSan diaChiDayDu hinhAnh",
      })
      .populate({
        path: "maLoaiPhong",
        select: "tenLoaiPhong giaTheoGio giaTheoNgay giaQuaDem",
      })
      .sort({ thoiGianTaoDon: -1 }); // Sắp xếp theo thời gian tạo mới nhất

    // Helper function để xác định trạng thái booking
    const getBookingStatus = (booking) => {
      const now = new Date();
      const checkInDate = new Date(booking.ngayNhanPhong);
      const checkOutDate = new Date(booking.ngayTraPhong);

      // Nếu đã hủy
      if (booking.trangThai === "da_huy") {
        return "canceled";
      }

      // Nếu đã trả phòng
      if (booking.trangThai === "da_tra_phong") {
        return "completed";
      }

      // Nếu quá hạn
      if (booking.trangThai === "qua_gio") {
        return "expired";
      }

      // Nếu không nhận phòng
      if (booking.trangThai === "khong_nhan_phong") {
        return "noCheckIn";
      }

      // Các trạng thái ongoing
      if (["dang_cho", "da_xac_nhan", "da_nhan_phong", "dang_su_dung"].includes(booking.trangThai)) {
        return "ongoing";
      }

      return "ongoing";
    };

    // Helper function để format ngày
    const formatDate = (date) => {
      if (!date) return null;
      return new Date(date).toISOString().split('T')[0]; // YYYY-MM-DD
    };

    // Tạo mảng dữ liệu đơn giản hóa
    const formattedBookings = bookings.map((b) => ({
      id: b._id,
      hotelName: b.maKhachSan?.tenKhachSan || "Unknown Hotel",
      hotelAddress: b.maKhachSan?.diaChiDayDu || "Unknown Address",
      roomType: b.maLoaiPhong?.tenLoaiPhong || "Unknown Room Type",
      image: b.maKhachSan?.hinhAnh || null,
      
      // Thông tin thời gian
      checkInDate: formatDate(b.ngayNhanPhong),
      checkOutDate: formatDate(b.ngayTraPhong),
      checkInTime: b.gioNhanPhong || "14:00",
      checkOutTime: b.gioTraPhong || "12:00",
      
      // Thông tin giá
      totalAmount: b.thongTinGia?.tongDonDat || 0,
      roomQuantity: b.soLuongPhong || 1,
      
      // Thông tin thanh toán
      paymentMethod: b.phuongThucThanhToan || "tien_mat",
      paymentStatus: b.trangThaiThanhToan || "chua_thanh_toan",
      
      // Trạng thái
      status: getBookingStatus(b),
      originalStatus: b.trangThai,
      
      // Thông tin đặt phòng
      bookingType: b.loaiDatPhong || "qua_dem",
      note: b.ghiChu || "",
      phoneNumber: b.soDienThoai || "",
      
      // Thông tin thời gian tạo
      createdAt: b.thoiGianTaoDon || b.createdAt,
      
      // Thông tin phòng đã giao (nếu có)
      assignedRooms: b.phongDuocGiao || [],
      
      // Thông tin chi tiết giá
      priceDetails: {
        unitPrice: b.thongTinGia?.donGia || 0,
        quantity: b.thongTinGia?.soLuongDonVi || 1,
        unit: b.thongTinGia?.donVi || "dem",
        roomTotal: b.thongTinGia?.tongTienPhong || 0,
        serviceFee: b.thongTinGia?.phiDichVu || 0,
        tax: b.thongTinGia?.thue || 0,
        discount: b.thongTinGia?.giamGia || 0,
        total: b.thongTinGia?.tongDonDat || 0
      }
    }));

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách booking thành công",
      data: formattedBookings,
      count: formattedBookings.length
    });

  } catch (error) {
    console.error("Lỗi khi lấy danh sách booking:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi lấy danh sách đặt phòng",
      error: error.message
    });
  }
});

// API để lấy chi tiết booking
bookingRouter.get("/getBookingDetail/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate({
        path: "maKhachSan",
        select: "tenKhachSan diaChiDayDu hinhAnh soDienThoai email",
      })
      .populate({
        path: "maLoaiPhong",
        select: "tenLoaiPhong giaTheoGio giaTheoNgay giaQuaDem moTa tienNghi",
      })
      .populate({
        path: "maNguoiDung",
        select: "tenNguoiDung email soDienThoai",
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking"
      });
    }

    // Format dữ liệu chi tiết
    const bookingDetail = {
      id: booking._id,
      
      // Thông tin khách sạn
      hotel: {
        id: booking.maKhachSan?._id,
        name: booking.maKhachSan?.tenKhachSan || "Unknown Hotel",
        address: booking.maKhachSan?.diaChiDayDu || "Unknown Address",
        image: booking.maKhachSan?.hinhAnh || null,
        phone: booking.maKhachSan?.soDienThoai || "",
        email: booking.maKhachSan?.email || "",
      },
      
      // Thông tin phòng
      room: {
        type: booking.maLoaiPhong?.tenLoaiPhong || "Unknown Room Type",
        description: booking.maLoaiPhong?.moTa || "",
        amenities: booking.maLoaiPhong?.tienNghi || [],
        quantity: booking.soLuongPhong || 1,
      },
      
      // Thông tin khách hàng
      guest: {
        name: booking.maNguoiDung?.tenNguoiDung || "Unknown Guest",
        email: booking.maNguoiDung?.email || "",
        phone: booking.maNguoiDung?.soDienThoai || booking.soDienThoai || "",
        cccd: booking.cccd || "",
      },
      
      // Thông tin đặt phòng
      booking: {
        type: booking.loaiDatPhong || "qua_dem",
        checkInDate: booking.ngayNhanPhong,
        checkOutDate: booking.ngayTraPhong,
        checkInTime: booking.gioNhanPhong || "14:00",
        checkOutTime: booking.gioTraPhong || "12:00",
        note: booking.ghiChu || "",
        status: booking.trangThai,
        createdAt: booking.thoiGianTaoDon || booking.createdAt,
      },
      
      // Thông tin thanh toán
      payment: {
        method: booking.phuongThucThanhToan || "tien_mat",
        status: booking.trangThaiThanhToan || "chua_thanh_toan",
        paidAt: booking.thongTinThanhToan?.thoiGianThanhToan || null,
        orderId: booking.thongTinThanhToan?.maDonHang || null,
      },
      
      // Chi tiết giá
      pricing: {
        unitPrice: booking.thongTinGia?.donGia || 0,
        quantity: booking.thongTinGia?.soLuongDonVi || 1,
        unit: booking.thongTinGia?.donVi || "dem",
        roomTotal: booking.thongTinGia?.tongTienPhong || 0,
        serviceFee: booking.thongTinGia?.phiDichVu || 0,
        tax: booking.thongTinGia?.thue || 0,
        discount: booking.thongTinGia?.giamGia || 0,
        total: booking.thongTinGia?.tongDonDat || 0,
      },
      
      // Phòng đã giao
      assignedRooms: booking.phongDuocGiao || [],
    };

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết booking thành công",
      data: bookingDetail
    });

  } catch (error) {
    console.error("Lỗi khi lấy chi tiết booking:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi lấy chi tiết đặt phòng",
      error: error.message
    });
  }
});

// API để hủy booking
bookingRouter.put("/cancelBooking/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking"
      });
    }

    // Kiểm tra xem có thể hủy được không
    if (booking.trangThai === "da_huy") {
      return res.status(400).json({
        success: false,
        message: "Booking đã được hủy trước đó"
      });
    }

    if (booking.trangThai === "da_tra_phong") {
      return res.status(400).json({
        success: false,
        message: "Không thể hủy booking đã hoàn thành"
      });
    }

    // Cập nhật trạng thái
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        trangThai: "da_huy",
        trangThaiThanhToan: "da_hoan_tien",
        ghiChu: reason || "Khách hàng yêu cầu hủy"
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Hủy booking thành công",
      data: updatedBooking
    });

  } catch (error) {
    console.error("Lỗi khi hủy booking:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi hủy đặt phòng",
      error: error.message
    });
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