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
            roomTypeId: booking.maLoaiPhong?._id?.toString(), 
            maLoaiPhong: booking.maLoaiPhong?._id?.toString(),
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
        const { 
            status, 
            assignedRooms, 
            paymentMethod, 
            reason, 
            service,
            // ✅ THÊM CÁC FIELD MỚI
            newBookingType,      // Thay đổi loại đặt phòng
            newCheckInDate,      // Thay đổi ngày nhận
            newCheckOutDate,     // Thay đổi ngày trả  
            newCheckInTime,      // Thay đổi giờ nhận
            newCheckOutTime,     // Thay đổi giờ trả
            actualCheckInTime,   // ✅ Giờ nhận thực tế
            actualCheckOutTime,  // ✅ Giờ trả thực tế
            roomIndex            // Index của phòng cần update thời gian thực tế
        } = req.body;

        console.log("🛠 PUT /update/:id - Params:", req.params);
        console.log("🛠 PUT /update/:id - Body:", req.body);

        const booking = await Booking.findById(id).populate('maLoaiPhong');
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const updateData = {};
        let recalculatePrice = false;

        // ✅ Cập nhật trạng thái booking
        if (status) {
            const validStatuses = ["dang_cho", "da_xac_nhan", "da_huy", "da_nhan_phong", "dang_su_dung", "da_tra_phong", "khong_nhan_phong"];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    message: { msgBody: "Trạng thái không hợp lệ!", msgError: true }
                });
            }
            updateData.trangThai = status;
        }

        // ✅ THAY ĐỔI LOẠI ĐẶT PHÒNG
        if (newBookingType && newBookingType !== booking.loaiDatPhong) {
            if (!['theo_gio', 'qua_dem', 'dai_ngay'].includes(newBookingType)) {
                return res.status(400).json({
                    message: { msgBody: "Loại đặt phòng không hợp lệ!", msgError: true }
                });
            }
            
            updateData.loaiDatPhong = newBookingType;
            recalculatePrice = true;
            
            console.log(`🔄 Changing booking type: ${booking.loaiDatPhong} → ${newBookingType}`);
        }

        // ✅ THAY ĐỔI THỜI GIAN
        if (newCheckInDate) {
            updateData.ngayNhanPhong = new Date(newCheckInDate);
            recalculatePrice = true;
        }
        
        if (newCheckOutDate) {
            updateData.ngayTraPhong = new Date(newCheckOutDate);
            recalculatePrice = true;
        }
        
        if (newCheckInTime) {
            updateData.gioNhanPhong = newCheckInTime;
        }
        
        if (newCheckOutTime) {
            updateData.gioTraPhong = newCheckOutTime;
        }

        // ✅ CẬP NHẬT THỜI GIAN THỰC TẾ CHO PHÒNG
        if (actualCheckInTime || actualCheckOutTime) {
            if (roomIndex !== undefined && booking.phongDuocGiao && booking.phongDuocGiao[roomIndex]) {
                const currentRooms = [...booking.phongDuocGiao];
                
                if (actualCheckInTime) {
                    // Set thời gian vào thực tế
                    const actualCheckInDate = new Date(`${moment(booking.ngayNhanPhong).format('YYYY-MM-DD')} ${actualCheckInTime}`);
                    currentRooms[roomIndex].thoiGianVaoThucTe = actualCheckInDate;
                    
                    // ✅ LOGIC: Nhận sớm thì trả sớm, nhận trễ thì trả đúng giờ
                    const plannedCheckIn = moment(`${moment(booking.ngayNhanPhong).format('YYYY-MM-DD')} ${booking.gioNhanPhong}`, 'YYYY-MM-DD HH:mm');
                    const actualCheckInMoment = moment(`${moment(booking.ngayNhanPhong).format('YYYY-MM-DD')} ${actualCheckInTime}`, 'YYYY-MM-DD HH:mm');
                    
                    let adjustedCheckOutTime = booking.gioTraPhong; // Default giữ nguyên
                    
                    if (actualCheckInMoment.isBefore(plannedCheckIn)) {
                        // ✅ Nhận sớm → Trả sớm
                        const earlyMinutes = plannedCheckIn.diff(actualCheckInMoment, 'minutes');
                        const plannedCheckOut = moment(`${moment(booking.ngayTraPhong).format('YYYY-MM-DD')} ${booking.gioTraPhong}`, 'YYYY-MM-DD HH:mm');
                        const adjustedCheckOut = plannedCheckOut.subtract(earlyMinutes, 'minutes');
                        
                        adjustedCheckOutTime = adjustedCheckOut.format('HH:mm');
                        currentRooms[roomIndex].gioTraPhongDieuChinh = adjustedCheckOutTime;
                        
                        console.log(`⏰ Early check-in detected: ${earlyMinutes} minutes early`);
                        console.log(`🔄 Adjusted checkout time: ${adjustedCheckOutTime}`);
                        
                    } else if (actualCheckInMoment.isAfter(plannedCheckIn)) {
                        // ✅ Nhận trễ → Trả đúng giờ (không điều chỉnh)
                        const lateMinutes = actualCheckInMoment.diff(plannedCheckIn, 'minutes');
                        currentRooms[roomIndex].gioTraPhongDieuChinh = booking.gioTraPhong; // Giữ nguyên
                        
                        console.log(`⏰ Late check-in detected: ${lateMinutes} minutes late`);
                        console.log(`🔄 Checkout time remains: ${booking.gioTraPhong}`);
                        
                    } else {
                        // ✅ Nhận đúng giờ → Trả đúng giờ
                        currentRooms[roomIndex].gioTraPhongDieuChinh = booking.gioTraPhong;
                        console.log(`⏰ On-time check-in, checkout unchanged: ${booking.gioTraPhong}`);
                    }
                }
                
                if (actualCheckOutTime) {
                    const actualCheckOutDate = new Date(`${moment(booking.ngayTraPhong).format('YYYY-MM-DD')} ${actualCheckOutTime}`);
                    currentRooms[roomIndex].thoiGianRaThucTe = actualCheckOutDate;
                }
                
                updateData.phongDuocGiao = currentRooms;
            } else {
                return res.status(400).json({
                    message: { msgBody: "Phòng chưa được gán hoặc roomIndex không hợp lệ!", msgError: true }
                });
            }
        }

        // ✅ TÍNH LẠI GIÁ NẾU CẦN
        if (recalculatePrice) {
            const roomType = booking.maLoaiPhong;
            const finalBookingType = newBookingType || booking.loaiDatPhong;
            const finalCheckIn = moment(newCheckInDate || booking.ngayNhanPhong);
            const finalCheckOut = moment(newCheckOutDate || booking.ngayTraPhong);
            
            let duration = 1;
            let unit = "dem";
            let unitPrice = roomType.giaCa;
            
            switch (finalBookingType) {
                case 'theo_gio':
                    const checkInTime = newCheckInTime || booking.gioNhanPhong;
                    const checkOutTime = newCheckOutTime || booking.gioTraPhong;
                    
                    const startTime = moment(`${finalCheckIn.format('YYYY-MM-DD')} ${checkInTime}`, 'YYYY-MM-DD HH:mm');
                    let endTime = moment(`${finalCheckIn.format('YYYY-MM-DD')} ${checkOutTime}`, 'YYYY-MM-DD HH:mm');
                    
                    if (endTime.isSameOrBefore(startTime)) {
                        endTime.add(1, 'day');
                    }
                    
                    duration = Math.ceil(endTime.diff(startTime, 'hours', true));
                    unit = "gio";
                    unitPrice = Math.round(roomType.giaCa / 14);
                    break;
                    
                case 'qua_dem':
                    duration = 1;
                    unit = "dem";
                    break;
                    
                case 'dai_ngay':
                    duration = finalCheckOut.diff(finalCheckIn, 'days');
                    unit = "ngay";
                    break;
            }
            
            const newRoomTotal = unitPrice * duration * booking.soLuongPhong;
            const existingServiceFee = booking.thongTinGia?.phiDichVu || 0;
            
            updateData['thongTinGia.donGia'] = unitPrice;
            updateData['thongTinGia.soLuongDonVi'] = duration;
            updateData['thongTinGia.donVi'] = unit;
            updateData['thongTinGia.tongTienPhong'] = newRoomTotal;
            updateData['thongTinGia.tongDonDat'] = newRoomTotal + existingServiceFee;
            
            console.log(`💰 Recalculated price: ${newRoomTotal.toLocaleString('vi-VN')}đ (${duration} ${unit})`);
        }

        // ✅ Các cập nhật khác (không thay đổi)
        if (assignedRooms) updateData.phongDuocGiao = assignedRooms;
        if (paymentMethod) updateData.phuongThucThanhToan = paymentMethod;
        if (reason) updateData.ghiChu = reason || "Khách sạn đã hủy đơn này!";

        // ✅ Xử lý dịch vụ bổ sung (giữ nguyên logic cũ)
        if (service && Array.isArray(service)) {
            const dichVuMoi = service.map(service => ({
                tenDichVu: service.name,
                donGia: service.price,
                soLuong: service.quantity || 1,
                thanhTien: service.price * (service.quantity || 1)
            }));

            updateData.dichVuBoSung = dichVuMoi;
            const tongPhiDichVu = dichVuMoi.reduce((total, service) => total + service.thanhTien, 0);
            updateData['thongTinGia.phiDichVu'] = tongPhiDichVu;

            const currentRoomTotal = updateData['thongTinGia.tongTienPhong'] || booking.thongTinGia.tongTienPhong;
            updateData['thongTinGia.tongDonDat'] = currentRoomTotal + tongPhiDichVu;
        }

        const updatedBooking = await Booking.findByIdAndUpdate(id, updateData, { new: true })
            .populate("maNguoiDung", "tenNguoiDung email soDienThoai")
            .populate("maLoaiPhong", "tenLoaiPhong giaCa")
            .populate("maKhachSan", "tenKhachSan");

        if (!updatedBooking) {
            return res.status(404).json({
                message: { msgBody: "Không tìm thấy đơn đặt phòng!", msgError: true }
            });
        }

        // ✅ Response message thông minh
        let successMessage = "✅ Cập nhật đơn đặt thành công!";
        
        if (recalculatePrice) {
            successMessage += ` Giá mới: ${updatedBooking.thongTinGia.tongDonDat.toLocaleString('vi-VN')}đ`;
        }
        
        if (status === "da_huy") {
            successMessage = "🚫 Đã hủy đơn đặt phòng thành công!";
        }
        
        if (actualCheckInTime || actualCheckOutTime) {
            successMessage += " ⏰ Đã cập nhật thời gian thực tế!";
        }

        console.log("✅ Updated booking:", updatedBooking._id);

        res.status(200).json({
            message: { msgBody: successMessage, msgError: false },
            updatedBooking: {
                bookingId: updatedBooking._id,
                status: updatedBooking.trangThai,
                bookingType: updatedBooking.loaiDatPhong,
                assignedRooms: updatedBooking.phongDuocGiao,
                services: updatedBooking.dichVuBoSung || [],
                servicesFee: updatedBooking.thongTinGia.phiDichVu || 0,
                totalAmount: updatedBooking.thongTinGia.tongDonDat || 0,
                priceDetails: updatedBooking.thongTinGia,
                reason: updatedBooking.ghiChu,
                // ✅ Thông tin thời gian
                timeInfo: {
                    planned: {
                        checkIn: `${moment(updatedBooking.ngayNhanPhong).format('DD/MM/YYYY')} ${updatedBooking.gioNhanPhong}`,
                        checkOut: `${moment(updatedBooking.ngayTraPhong).format('DD/MM/YYYY')} ${updatedBooking.gioTraPhong}`
                    },
                    actual: updatedBooking.phongDuocGiao.map(room => ({
                        roomNumber: room.soPhong,
                        actualCheckIn: room.thoiGianVaoThucTe,
                        actualCheckOut: room.thoiGianRaThucTe,
                        adjustedCheckOutTime: room.gioTraPhongDieuChinh
                    }))
                }
            }
        });
        
    } catch (error) {
        console.error("Lỗi cập nhật booking:", error);
        res.status(400).json({
            message: { msgBody: "❌ Cập nhật đơn đặt thất bại!", msgError: true },
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
            checkInTime,      // ✅ THÊM
            checkOutTime,     // ✅ THÊM
            bookingType,      // ✅ THÊM - "dai_ngay", "qua_dem", "theo_gio"
            customerName,
            phoneNumber,
            email,
            cccd,
            paymentMethod,
            guests,
            notes,
            roomQuantity = 1
        } = req.body;

        console.log("🔄 Creating booking with type:", bookingType);

        // ✅ Validate booking type
        if (!bookingType || !['theo_gio', 'qua_dem', 'dai_ngay'].includes(bookingType)) {
            return res.status(400).json({
                msgBody: "Loại đặt phòng không hợp lệ! Chọn: theo_gio, qua_dem, dai_ngay",
                msgError: true,
            });
        }

        // Validate required fields
        if (!maKhachSan || !maLoaiPhong || !checkInDate) {
            return res.status(400).json({
                msgBody: "Thiếu thông tin bắt buộc: khách sạn, loại phòng, ngày nhận phòng!",
                msgError: true,
            });
        }

        // ✅ Validation theo booking type
        const checkIn = moment(checkInDate);
        let checkOut = checkOutDate ? moment(checkOutDate) : null;

        let duration = 1;
        let unit = "dem";

        switch (bookingType) {
            case 'theo_gio':
                if (!checkInTime || !checkOutTime) {
                    return res.status(400).json({
                        msgBody: "Đặt theo giờ cần có giờ nhận và giờ trả!",
                        msgError: true,
                    });
                }

                // Tính số giờ
                const startTime = moment(`${checkInDate} ${checkInTime}`, 'YYYY-MM-DD HH:mm');
                let endTime = moment(`${checkInDate} ${checkOutTime}`, 'YYYY-MM-DD HH:mm');

                if (endTime.isSameOrBefore(startTime)) {
                    endTime.add(1, 'day');
                }

                duration = Math.ceil(endTime.diff(startTime, 'hours', true));
                unit = "gio";
                checkOut = checkIn; // Cùng ngày
                break;

            case 'qua_dem':
                if (!checkOutDate) {
                    return res.status(400).json({
                        msgBody: "Đặt qua đêm cần có ngày trả phòng!",
                        msgError: true,
                    });
                }

                const nightDiff = checkOut.diff(checkIn, 'days');
                if (nightDiff !== 1) {
                    return res.status(400).json({
                        msgBody: "Đặt qua đêm phải chính xác 1 ngày!",
                        msgError: true,
                    });
                }

                duration = 1;
                unit = "dem";
                break;

            case 'dai_ngay':
                if (!checkOutDate) {
                    return res.status(400).json({
                        msgBody: "Đặt dài ngày cần có ngày trả phòng!",
                        msgError: true,
                    });
                }

                const longDiff = checkOut.diff(checkIn, 'days');
                if (longDiff < 2) {
                    return res.status(400).json({
                        msgBody: "Đặt dài ngày tối thiểu 2 ngày!",
                        msgError: true,
                    });
                }

                duration = longDiff;
                unit = "ngay";
                break;
        }

        // Lấy thông tin loại phòng để tính giá
        const roomType = await RoomType.findById(maLoaiPhong);
        if (!roomType) {
            return res.status(400).json({
                msgBody: "Loại phòng không tồn tại!",
                msgError: true,
            });
        }

        // ✅ Tính giá theo booking type
        let unitPrice = roomType.giaCa;

        if (bookingType === 'theo_gio') {
            // Giá theo giờ = giá phòng / 14 giờ (quy ước)
            unitPrice = Math.round(roomType.giaCa / 14);
        }

        const roomTotal = unitPrice * duration * roomQuantity;

        // ✅ Set default times nếu không có
        const finalCheckInTime = checkInTime || (bookingType === 'theo_gio' ? '14:00' : '14:00');
        const finalCheckOutTime = checkOutTime || (bookingType === 'theo_gio' ? '18:00' : '12:00');

        const newBooking = new Booking({
            maNguoiDung: guestUserId,
            maKhachSan,
            maLoaiPhong,
            maPhong: null,
            cccd: cccd || "",
            loaiDatPhong: bookingType,  // ✅ Sử dụng bookingType từ input
            soLuongPhong: roomQuantity,
            ngayNhanPhong: checkIn.toDate(),
            ngayTraPhong: checkOut.toDate(),
            gioNhanPhong: finalCheckInTime,   // ✅ Từ input
            gioTraPhong: finalCheckOutTime,   // ✅ Từ input
            trangThai: "da_xac_nhan",
            phuongThucThanhToan: paymentMethod || "tien_mat",
            trangThaiThanhToan: "chua_thanh_toan",
            ghiChu: notes || "",
            soDienThoai: phoneNumber || "",

            // ✅ Thông tin giá chi tiết
            thongTinGia: {
                donGia: unitPrice,
                soLuongDonVi: duration,
                donVi: unit,
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
                msgBody: `Tạo đơn đặt phòng ${getBookingTypeText(bookingType)} thành công!`,
                msgError: false
            },
            booking: {
                bookingId: newBooking._id,
                customerName: customerName || "Khách lẻ",
                roomType: roomType.tenLoaiPhong,
                bookingType: bookingType,
                duration: `${duration} ${unit}`,
                checkInTime: finalCheckInTime,
                checkOutTime: finalCheckOutTime,
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

// ✅ Helper function
function getBookingTypeText(type) {
    switch (type) {
        case 'theo_gio': return 'theo giờ';
        case 'qua_dem': return 'qua đêm';
        case 'dai_ngay': return 'dài ngày';
        default: return '';
    }
}

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