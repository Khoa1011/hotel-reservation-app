const express = require("express");
const Booking = require("../../Model/Booking/Booking");
const mongoose = require("mongoose");
const authorizeRoles = require('../../middleware/roleAuth');
const hotelBookingRouter = express.Router();
const Room = require("../../Model/Room/Room");
const Hotel = require("../../Model/Hotel/Hotel");
const User = require("../../Model/User/User");
const moment = require('moment-timezone');
const crypto = require('crypto');
const axios = require('axios');
const RoomType = require("../../Model/RoomType/RoomType");


//Lấy danh sách booking và lọc các trạng thái
hotelBookingRouter.get("/hotelowner/bookings", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
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

        const hotelIds = hotels.map(h => h._id);
        let query = {};

        if (req.query.hotelId) {
            const requestedHotelId = req.query.hotelId;
            if (!hotelIds.map(id => id.toString()).includes(requestedHotelId)) {
                return res.status(403).json({
                    msgBody: "Bạn không có quyền truy cập dữ liệu của khách sạn này.",
                    msgError: true
                });
            }
            query.maKhachSan = requestedHotelId;
        } else {
            query.maKhachSan = { $in: hotelIds };
        }

        // Lọc theo trạng thái booking nếu có
        if (status && ["dang_cho", "da_xac_nhan", "da_huy", "da_nhan_phong", "dang_su_dung", "da_tra_phong"].includes(status)) {
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
                query.ngayNhanPhong.$gte = new Date(fromDate);
            }
            if (toDate) {
                query.ngayNhanPhong.$lte = new Date(toDate);
            }
        }

        let bookings = await Booking.find(query)
            .populate("maNguoiDung", "tenNguoiDung email soDienThoai")
            .populate({
                path: "maLoaiPhong",
                model: "loaiPhong",
                select: "tenLoaiPhong giaCa soLuongKhach"
            })
            .populate("maKhachSan", "tenKhachSan diaChi soDienThoai email")
            .sort({ createdAt: -1 });

        // Lọc theo thời gian check-in/check-out (nếu filter được truyền)
        const today = moment().startOf("day");

        if (filter) {
            bookings = bookings.filter(booking => {
                const checkIn = moment(booking.ngayNhanPhong);
                const checkOut = moment(booking.ngayTraPhong);
                if (!checkIn.isValid() || !checkOut.isValid()) return false;

                if (filter === "past") return checkOut.isBefore(today, "day");
                if (filter === "upcoming") return checkIn.isAfter(today, "day");
                if (filter === "current") return checkIn.isSameOrBefore(today, "day") && checkOut.isSameOrAfter(today, "day");
                return true;
            });
        }

        const result = bookings.map(booking => ({
            bookingId: booking._id,
            customerName: booking.maNguoiDung?.tenNguoiDung || "Khách lẻ",
            roomType: booking.maLoaiPhong?.tenLoaiPhong || "N/A",
            roomPrice: booking.maLoaiPhong?.giaCa || 0,
            maxGuests: booking.maLoaiPhong?.soLuongKhach || 1,
            checkInDate: moment(booking.ngayNhanPhong).format("DD-MM-YYYY"),
            checkOutDate: moment(booking.ngayTraPhong).format("DD-MM-YYYY"),
            checkInTime: booking.gioNhanPhong,
            checkOutTime: booking.gioTraPhong,
            email: booking.maNguoiDung?.email || "N/A",
            phoneNumber: booking.maNguoiDung?.soDienThoai || booking.soDienThoai || "N/A",
            paymentMethod: booking.phuongThucThanhToan,
            status: booking.trangThai,
            paymentStatus: booking.trangThaiThanhToan,
            createdAt: booking.thoiGianTaoDon,
            totalAmount: booking.thongTinGia?.tongDonDat || 0,
            roomQuantity: booking.soLuongPhong,
            bookingType: booking.loaiDatPhong,
            notes: booking.ghiChu,
            cccd: booking.cccd,
            assignedRooms: booking.phongDuocGiao || [],
            // Thông tin khách sạn
            hotelId: {
                _id: booking.maKhachSan._id,
                tenKhachSan: booking.maKhachSan.tenKhachSan,
                diaChi: booking.maKhachSan.diaChi,
                soDienThoai: booking.maKhachSan.soDienThoai
            },
            // Thông tin giá chi tiết
            priceDetails: booking.thongTinGia,
            // Thông tin thanh toán chi tiết
            paymentDetails: booking.thongTinThanhToan
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

// Cập nhật trạng thái đặt phòng
hotelBookingRouter.put("/hotelowner/update/:id", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        
        const { id } = req.params;
        const { status, assignedRooms,paymentMethod, reason, service } = req.body;
console.log("🛠 PUT /update/:id - Params:", req.params);
console.log("🛠 PUT /update/:id - Body:", req.body);

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Validate status
        const validStatuses = ["dang_cho", "da_xac_nhan", "da_huy", "da_nhan_phong", "dang_su_dung", "da_tra_phong", "khong_nhan_phong"];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                message: {
                    msgBody: "Trạng thái không hợp lệ!",
                    msgError: true
                }
            });
        }

        const updateData = {};
        if (status) updateData.trangThai = status;
        if (assignedRooms) updateData.phongDuocGiao = assignedRooms;
        if (paymentMethod) updateData.phuongThucThanhToan = paymentMethod;
        if (reason) updateData.ghiChu = reason || "Khách sạn đã hủy đơn này!";

        // ✅ THÊM: Xử lý dịch vụ bổ sung
        if (service && Array.isArray(service)) {
            const dichVuMoi = service.map(service => ({
                tenDichVu: service.name,
                donGia: service.price,
                soLuong: service.quantity || 1,
                thanhTien: service.price * (service.quantity || 1)
            }));

            updateData.dichVuBoSung = dichVuMoi;

            // ✅ Tính tổng phí dịch vụ
            const tongPhiDichVu = dichVuMoi.reduce((total, service) => total + service.thanhTien, 0);
            updateData['thongTinGia.phiDichVu'] = tongPhiDichVu;

            // ✅ Cập nhật tổng đơn đặt (cần lấy thông tin cũ trước)
            const existingBooking = await Booking.findById(id);
            if (existingBooking) {
                const tongTienPhong = existingBooking.thongTinGia.tongTienPhong || 0;
                updateData['thongTinGia.tongDonDat'] = tongTienPhong + tongPhiDichVu;
            }
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        )
            .populate("maNguoiDung", "tenNguoiDung email soDienThoai")
            .populate("maLoaiPhong", "tenLoaiPhong giaCa")
            .populate("maKhachSan", "tenKhachSan");

        if (!updatedBooking) {
            return res.status(404).json({
                message: {
                    msgBody: "Không tìm thấy đơn đặt phòng!",
                    msgError: true
                }
            });
        }
        console.log("🛠 updateData:", updateData);

        // ✅ Response message tùy theo hành động
        let successMessage = "✅ Cập nhật trạng thái đơn đặt thành công!";
        if (status === "da_huy") {
            successMessage = "🚫 Đã hủy đơn đặt phòng thành công!";
        } else if (service && service.length > 0) {
            successMessage = `✅ Cập nhật dịch vụ thành công! Tổng tiền: ${updatedBooking.thongTinGia.tongDonDat.toLocaleString('vi-VN')}đ`;
        }
        console.log("✅ Updated booking:", updatedBooking);

        res.status(200).json({
            message: {
                msgBody: successMessage,
                msgError: false
            },
            updatedBooking: {
                bookingId: updatedBooking._id,
                status: updatedBooking.trangThai,
                assignedRooms: updatedBooking.phongDuocGiao,
                services: updatedBooking.dichVuBoSung || [],
                servicesFee: updatedBooking.thongTinGia.phiDichVu || 0,
                totalAmount: updatedBooking.thongTinGia.tongDonDat || 0,
                reason: updatedBooking.ghiChu
            }
        });
    } catch (error) {
        console.error("Lỗi cập nhật booking:", error);
        res.status(400).json({
            message: {
                msgBody: "❌ Cập nhật trạng thái đơn đặt thất bại!",
                msgError: true
            },
            error: error.message
        });
    }
});

// API gán phòng cho đơn đặt
hotelBookingRouter.put("/hotelowner/assign-room/:id", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { id } = req.params;
        const { roomNumber, floor, viewType, notes } = req.body;

        if (!roomNumber) {
            return res.status(400).json({
                message: {
                    msgBody: "Số phòng là bắt buộc!",
                    msgError: true
                }
            });
        }

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({
                message: {
                    msgBody: "Không tìm thấy đơn đặt phòng!",
                    msgError: true
                }
            });
        }

        // Thêm phòng vào danh sách phòng được giao
        const newRoom = {
            soPhong: roomNumber,
            tang: floor || 1,
            loaiView: viewType || "",
            trangThaiPhong: "da_giao_phong",
            thoiGianGiaoPhong: new Date(),
            ghiChuPhong: notes || ""
        };

        booking.phongDuocGiao.push(newRoom);

        // Cập nhật trạng thái booking nếu cần
        if (booking.trangThai === "da_xac_nhan") {
            booking.trangThai = "da_nhan_phong";
        }

        await booking.save();

        res.status(200).json({
            message: {
                msgBody: "✅ Gán phòng thành công!",
                msgError: false
            },
            assignedRoom: newRoom
        });

    } catch (error) {
        console.error("Lỗi gán phòng:", error);
        res.status(500).json({
            message: {
                msgBody: "❌ Lỗi khi gán phòng!",
                msgError: true
            },
            error: error.message
        });
    }
});

hotelBookingRouter.post("/hotelowner/create-booking", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const guestUserId = '684c6304de66d4781c70129e';
        const {
            maKhachSan,
            maLoaiPhong,
            checkInDate,
            checkOutDate,
            customerName,
            phoneNumber,
            email,
            cccd,
            paymentMethod,
            guests,
            notes,
            roomQuantity = 1
        } = req.body;

        // Validate required fields
        if (!maKhachSan || !maLoaiPhong || !checkInDate || !checkOutDate) {
            return res.status(400).json({
                msgBody: "Thiếu thông tin bắt buộc: khách sạn, loại phòng, ngày nhận/trả phòng!",
                msgError: true,
            });
        }

        // Tính số ngày lưu trú
        const checkIn = moment(checkInDate);
        const checkOut = moment(checkOutDate);
        const nights = checkOut.diff(checkIn, 'days');

        if (nights <= 0) {
            return res.status(400).json({
                msgBody: "Ngày trả phòng phải sau ngày nhận phòng!",
                msgError: true,
            });
        }

        // Lấy thông tin loại phòng để tính giá
        const RoomType = require("../../Model/RoomType/RoomType");
        const roomType = await RoomType.findById(maLoaiPhong);
        if (!roomType) {
            return res.status(400).json({
                msgBody: "Loại phòng không tồn tại!",
                msgError: true,
            });
        }

        // Tính tổng tiền
        const roomTotal = roomType.giaCa * nights * roomQuantity;

        const newBooking = new Booking({
            maNguoiDung: guestUserId, // Default guest user
            maKhachSan,
            maLoaiPhong,
            maPhong: null, // Sẽ được gán sau
            cccd: cccd || "",
            loaiDatPhong: "qua_dem", // Default
            soLuongPhong: roomQuantity,
            ngayNhanPhong: checkIn.toDate(),
            ngayTraPhong: checkOut.toDate(),
            gioNhanPhong: "14:00",
            gioTraPhong: "12:00",
            trangThai: "da_xac_nhan",
            phuongThucThanhToan: paymentMethod || "tien_mat",
            trangThaiThanhToan: "chua_thanh_toan",
            ghiChu: notes || "",
            soDienThoai: phoneNumber || "",

            // Thông tin giá
            thongTinGia: {
                donGia: roomType.giaCa,
                soLuongDonVi: nights,
                donVi: "ngay",
                tongTienPhong: roomTotal,
                phiDichVu: 0,
                thue: 0,
                giamGia: 0,
                phuPhiGio: 0,
                phuPhiCuoiTuan: 0,
                tongDonDat: roomTotal
            },

            phongDuocGiao: []
        });

        await newBooking.save();

        res.status(200).json({
            message: {
                msgBody: "Tạo đơn đặt phòng thành công!",
                msgError: false
            },
            booking: {
                bookingId: newBooking._id,
                customerName: customerName || "Khách lẻ",
                roomType: roomType.tenLoaiPhong,
                totalAmount: roomTotal,
                status: newBooking.trangThai
            }
        });

    } catch (error) {
        console.error("Lỗi tạo booking:", error);
        res.status(400).json({
            msgBody: "Tạo đơn đặt phòng thất bại!",
            msgError: true,
            error: error.message
        });
    }
});

//Danh sách loại phòng cho khách sạn 
hotelBookingRouter.get("/hotelowner/getRoomInHotel/:hotelId", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    const { hotelId } = req.params;
    try {
        const rooms = await RoomType.find({ maKhachSan: hotelId });
        console.log("Các loại phòng trong khách sạn", rooms);
        if (!rooms) {
            return res.status(400).json({
                msgBody: "Không có phòng nào trong khách sạn này!",
                msgError: true
            });
        }
        const result = rooms.map(room => ({
            roomId: room._id,
            roomTypeName: room.tenLoaiPhong,
            roomTypePrice: room.giaCa,
            roomTypeDescription: room.moTa,
            roomcapacity: room.soLuongKhach
        }));
        return res.status(200).json(result);
    } catch (error) {
        return res.status(400).json({
            msgBody: "Lỗi truy xuất phòng trong khách sạn!",
            msgError: true,
            messageError: error
        });
    }
});


// API lấy thông báo mới
hotelBookingRouter.get('/hotelowner/notifications/:hotelId', async (req, res) => {
    try {
        const { hotelId } = req.params; // Lấy từ auth middleware

        // Đếm số đơn đặt phòng mới (trong 24h gần nhất)
        const newBookings = await Booking.countDocuments({
            maKhachSan: hotelId,
            thoiGianTaoDon: {
                $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h ago
            }
        });

        // Đếm số đơn đang chờ xử lý
        const pendingBookings = await Booking.countDocuments({
            maKhachSan: hotelId,
            trangThai: 'dang_cho'
        });

        // Đếm số đơn cần xác nhận
        const needsConfirmation = await Booking.countDocuments({
            maKhachSan: hotelId,
            trangThai: { $in: ['dang_cho', 'da_xac_nhan'] }
        });

        const totalUnread = newBookings + pendingBookings;

        res.json({
            newBookings,
            pendingBookings,
            needsConfirmation,
            totalUnread,
            lastUpdated: new Date()
        });

    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            message: {
                msgError: true,
                msgBody: 'Lỗi khi lấy thông báo'
            }
        });
    }
});

module.exports = hotelBookingRouter;