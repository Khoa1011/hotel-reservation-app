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
const RoomBookingAssignment = require("../../Model/Room/RoomBookingAssignment");

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

        const bookingIds = bookings.map(b => b._id);

        const allAssignments = await RoomBookingAssignment.find({
            maDatPhong: { $in: bookingIds },
            trangThaiHoatDong: true
        })
            .populate('maPhong', 'soPhong tang loaiView')
            .lean();

        const bookingAssignmentsMap = new Map();
        for (const assignment of allAssignments) {
            const key = assignment.maDatPhong.toString();
            if (!bookingAssignmentsMap.has(key)) {
                bookingAssignmentsMap.set(key, []);
            }
            bookingAssignmentsMap.get(key).push(assignment);
        }


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
            // Sử dụng phongDuocGiao hiện tại nhưng format lại để hỗ trợ multi-room features
            assignedRooms: (bookingAssignmentsMap.get(booking._id.toString()) || []).map(assignment => ({
                assignmentId: assignment._id,
                roomInfo: {
                    roomId: assignment.maPhong?._id || null,
                    soPhong: assignment.maPhong?.soPhong,
                    tang: assignment.maPhong?.tang || 1,
                    loaiView: assignment.maPhong?.loaiView || 'none'
                },
                status: assignment.trangThaiGanPhong,
                actualTimes: {
                    checkIn: assignment.thoiGianCheckInThucTe || null,
                    checkOut: assignment.thoiGianCheckOutThucTe || null,
                    checkInTime: assignment.gioNhanPhongThucTe || null,
                    checkOutTime: assignment.gioTraPhongThucTe || null
                },
                pricing: {
                    originalPrice: assignment.giaPhongGoc,
                    actualPrice: assignment.giaPhongThucTe,
                    upgradeFee: assignment.phuPhiNangCap || 0
                },
                guestInfo: assignment.thongTinKhachPhong || {
                    tenKhachChinh: '',
                    soDienThoaiLienHe: booking.soDienThoai || '',
                    soLuongKhachThucTe: 1,
                    danhSachKhach: [],
                    yeuCauDacBiet: ''
                },
                services: assignment.dichVuSuDung || [],
                serviceTotal: (assignment.dichVuSuDung || []).reduce((total, dv) => total + (dv.thanhTien || 0), 0),
                notes: assignment.ghiChu || ''
            })),
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
            paymentMethod,
            reason,
            service,
            newBookingType,
            newCheckInDate,
            newCheckOutDate,
            newCheckInTime,
            newCheckOutTime,
        } = req.body;

        const booking = await Booking.findById(id).populate('maLoaiPhong');
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const updateData = {};
        let recalculatePrice = false;

        // Cập nhật trạng thái booking
        if (status) {
            const validStatuses = ["dang_cho", "da_xac_nhan", "da_huy", "da_nhan_phong", "dang_su_dung", "da_tra_phong", "khong_nhan_phong"];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    message: { msgBody: "Trạng thái không hợp lệ!", msgError: true }
                });
            }
            updateData.trangThai = status;
        }

        // Thay đổi loại đặt phòng
        if (newBookingType && newBookingType !== booking.loaiDatPhong) {
            if (!['theo_gio', 'qua_dem', 'dai_ngay'].includes(newBookingType)) {
                return res.status(400).json({
                    message: { msgBody: "Loại đặt phòng không hợp lệ!", msgError: true }
                });
            }
            updateData.loaiDatPhong = newBookingType;
            recalculatePrice = true;
        }

        // Thay đổi thời gian
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

        // Tính lại giá nếu cần
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
        }

        // Các cập nhật khác
        if (paymentMethod) updateData.phuongThucThanhToan = paymentMethod;
        if (reason) updateData.ghiChu = reason || "Khách sạn đã hủy đơn này!";

        // Xử lý dịch vụ bổ sung
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

        let successMessage = "✅ Cập nhật đơn đặt thành công!";

        if (recalculatePrice) {
            successMessage += ` Giá mới: ${updatedBooking.thongTinGia.tongDonDat.toLocaleString('vi-VN')}đ`;
        }

        if (status === "da_huy") {
            successMessage = "🚫 Đã hủy đơn đặt phòng thành công!";
        }

        res.status(200).json({
            message: { msgBody: successMessage, msgError: false },
            updatedBooking: {
                bookingId: updatedBooking._id,
                status: updatedBooking.trangThai,
                bookingType: updatedBooking.loaiDatPhong,
                services: updatedBooking.dichVuBoSung || [],
                servicesFee: updatedBooking.thongTinGia.phiDichVu || 0,
                totalAmount: updatedBooking.thongTinGia.tongDonDat || 0,
                priceDetails: updatedBooking.thongTinGia,
                reason: updatedBooking.ghiChu
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
// ✅ SỬA: API gán phòng nhận bookingId thay vì assignmentId
hotelBookingRouter.put("/hotelowner/assign-room/:bookingId", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { roomId, notes, guestInfo } = req.body;

        if (!roomId) {
            return res.status(400).json({
                message: {
                    msgBody: "Room ID là bắt buộc!",
                    msgError: true
                }
            });
        }

        console.log("🔄 Assigning room to booking:", bookingId);

        // ✅ Tìm booking thay vì assignment
        const booking = await Booking.findById(bookingId).populate('maLoaiPhong');
        if (!booking) {
            return res.status(404).json({
                message: {
                    msgBody: "Không tìm thấy đơn đặt phòng!",
                    msgError: true
                }
            });
        }

        // Kiểm tra phòng tồn tại
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(400).json({
                message: {
                    msgBody: "Không tìm thấy phòng!",
                    msgError: true
                }
            });
        }

        // ✅ Kiểm tra xem phòng đã được gán chưa (tránh trùng lặp)
        const existingAssignment = await RoomBookingAssignment.findOne({
            maDatPhong: bookingId,
            maPhong: roomId,
            trangThaiHoatDong: true
        });

        if (existingAssignment) {
            return res.status(400).json({
                message: {
                    msgBody: `Phòng ${room.soPhong} đã được gán cho đơn này!`,
                    msgError: true
                }
            });
        }

        // ✅ Tìm assignment trống đầu tiên hoặc tạo mới
        let assignment = await RoomBookingAssignment.findOne({
            maDatPhong: bookingId,
            trangThaiGanPhong: "chua_gan",
            trangThaiHoatDong: true
        });

        if (!assignment) {
            // ✅ Nếu không có assignment trống, tạo mới
            assignment = new RoomBookingAssignment({
                maDatPhong: bookingId,
                trangThaiGanPhong: "chua_gan",
                giaPhongGoc: booking.thongTinGia?.donGia || 0,
                giaPhongThucTe: booking.thongTinGia?.donGia || 0,
                phuPhiNangCap: 0,
                lyDoGanPhong: "gan_binh_thuong",
                thongTinKhachPhong: {
                    tenKhachChinh: '',
                    soDienThoaiLienHe: booking.soDienThoai || '',
                    soLuongKhachThucTe: 1,
                    danhSachKhach: [],
                    yeuCauDacBiet: ''
                },
                dichVuSuDung: [],
                ghiChu: ''
            });
        }

        // ✅ Cập nhật assignment với phòng cụ thể
        assignment.maPhong = roomId;
        assignment.trangThaiGanPhong = "da_gan";
        assignment.ghiChu = notes || `Đã gán phòng ${room.soPhong}`;
        assignment.thongTinKhachPhong.yeuCauDacBiet = guestInfo?.specialRequest || "";
        assignment.thongTinKhachPhong.tenKhachChinh = guestInfo?.guestMain || guestInfo?.tenKhachChinh || "";
        assignment.thongTinKhachPhong.soDienThoaiLienHe = guestInfo?.phoneContact || guestInfo?.soDienThoaiLienHe || "";

        await assignment.save();

        // ✅ Kiểm tra và cập nhật trạng thái booking nếu đã gán đủ phòng
        const totalAssignments = await RoomBookingAssignment.countDocuments({
            maDatPhong: bookingId,
            trangThaiGanPhong: "da_gan",
            trangThaiHoatDong: true
        });

        console.log(`📊 Đã gán: ${totalAssignments}/${booking.soLuongPhong} phòng`);

        if (totalAssignments >= booking.soLuongPhong) {
            await Booking.findByIdAndUpdate(bookingId, {
                trangThai: "da_nhan_phong"
            });
            console.log("✅ Đã cập nhật trạng thái booking thành 'da_nhan_phong'");
        }

        res.status(200).json({
            message: {
                msgBody: `✅ Gán phòng ${room.soPhong} thành công! (${totalAssignments}/${booking.soLuongPhong})`,
                msgError: false
            },
            assignment: {
                assignmentId: assignment._id,
                roomInfo: {
                    roomId: room._id,
                    soPhong: room.soPhong,
                    tang: room.tang,
                    loaiView: room.loaiView
                },
                status: assignment.trangThaiGanPhong,
                guestInfo: assignment.thongTinKhachPhong
            },
            bookingStatus: {
                totalAssigned: totalAssignments,
                totalNeeded: booking.soLuongPhong,
                isComplete: totalAssignments >= booking.soLuongPhong
            }
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

// ✅ THÊM: API lấy danh sách assignments theo bookingId (để debug)
hotelBookingRouter.get("/hotelowner/assignments/:bookingId", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { bookingId } = req.params;

        const assignments = await RoomBookingAssignment.find({
            maDatPhong: bookingId,
            trangThaiHoatDong: true
        }).populate('maPhong', 'soPhong tang loaiView');

        const booking = await Booking.findById(bookingId);

        res.status(200).json({
            success: true,
            bookingId: bookingId,
            roomQuantity: booking?.soLuongPhong || 0,
            assignments: assignments.map(a => ({
                assignmentId: a._id,
                roomInfo: a.maPhong ? {
                    roomId: a.maPhong._id,
                    soPhong: a.maPhong.soPhong,
                    tang: a.maPhong.tang,
                    loaiView: a.maPhong.loaiView
                } : null,
                status: a.trangThaiGanPhong,
                guestInfo: a.thongTinKhachPhong,
                notes: a.ghiChu
            }))
        });

    } catch (error) {
        console.error("Lỗi lấy assignments:", error);
        res.status(500).json({
            message: { msgBody: "❌ Lỗi khi lấy danh sách phòng!", msgError: true }
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
            checkInTime,      
            checkOutTime,     
            bookingType,       // "dai_ngay", "qua_dem", "theo_gio"
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


                checkOut = checkIn.clone().add(1, 'day');

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



        const finalCheckInTime = checkInTime || (bookingType === 'theo_gio' ? '14:00' : '14:00');
        const finalCheckOutTime = checkOutTime || (bookingType === 'theo_gio' ? '18:00' : '12:00');

        const newBooking = new Booking({
            maNguoiDung: guestUserId,
            maKhachSan,
            maLoaiPhong,

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
                status: newBooking.trangThai,
                roomQuantity: roomQuantity,
                needsRoomAssignment: true,
                assignedRooms: []
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

// API thêm dịch vụ cho phòng cụ thể
hotelBookingRouter.post("/hotelowner/add-room-service/:assignmentId", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { services } = req.body;

        if (!services || !Array.isArray(services)) {
            return res.status(400).json({
                message: { msgBody: "Danh sách dịch vụ không hợp lệ!", msgError: true }
            });
        }

        const assignment = await RoomBookingAssignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({
                message: { msgBody: "Không tìm thấy phòng đã gán!", msgError: true }
            });
        }

        // Thêm dịch vụ mới
        const newServices = services.map(service => ({
            tenDichVu: service.name,
            soLuong: service.quantity || 1,
            donGia: service.price,
            thanhTien: service.price * (service.quantity || 1),
            thoiGianSuDung: new Date()
        }));

        assignment.dichVuSuDung.push(...newServices);
        await assignment.save();

        // Cập nhật tổng phí dịch vụ trong booking
        const allAssignments = await RoomBookingAssignment.find({
            maDatPhong: assignment.maDatPhong,
            trangThaiHoatDong: true
        });

        const totalServiceFee = allAssignments.reduce((total, assign) => {
            return total + assign.dichVuSuDung.reduce((sum, dv) => sum + (dv.thanhTien || 0), 0);
        }, 0);

        const booking = await Booking.findById(assignment.maDatPhong);
        booking.thongTinGia.phiDichVu = totalServiceFee;
        booking.thongTinGia.tongDonDat = booking.thongTinGia.tongTienPhong + totalServiceFee;
        await booking.save();

        res.status(200).json({
            message: { msgBody: "✅ Thêm dịch vụ thành công!", msgError: false },
            services: newServices,
            totalServiceFee: assignment.dichVuSuDung.reduce((total, service) => total + (service.thanhTien || 0), 0)
        });

    } catch (error) {
        console.error("Lỗi thêm dịch vụ:", error);
        res.status(500).json({
            message: { msgBody: "❌ Lỗi khi thêm dịch vụ!", msgError: true },
            error: error.message
        });
    }
});
// API đổi phòng
hotelBookingRouter.post("/hotelowner/transfer-room/:assignmentId", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { newRoomId, reason, transferFee = 0 } = req.body;

        if (!newRoomId) {
            return res.status(400).json({
                message: { msgBody: "Phòng mới là bắt buộc!", msgError: true }
            });
        }

        const assignment = await RoomBookingAssignment.findById(assignmentId).populate('maPhong');
        if (!assignment) {
            return res.status(404).json({
                message: { msgBody: "Không tìm thấy phòng đã gán!", msgError: true }
            });
        }

        const newRoom = await Room.findById(newRoomId);
        if (!newRoom) {
            return res.status(400).json({
                message: { msgBody: "Không tìm thấy phòng mới!", msgError: true }
            });
        }

        // Lưu thông tin phòng cũ
        const oldRoomInfo = {
            maPhong: assignment.maPhong._id,
            soPhong: assignment.maPhong.soPhong,
            tang: assignment.maPhong.tang,
            loaiView: assignment.maPhong.loaiView
        };

        // Cập nhật assignment với phòng mới
        assignment.ganPhongTruocDo = assignment._id;
        assignment.maPhong = newRoomId;
        assignment.lyDoGanPhong = "thay_the";
        assignment.phuPhiNangCap += transferFee;
        assignment.ghiChu += `\n[${new Date().toLocaleString('vi-VN')}] Đổi từ phòng ${oldRoomInfo.soPhong} - Lý do: ${reason}`;
        assignment.trangThaiGanPhong = "da_gan";

        await assignment.save();

        // Cập nhật tổng tiền nếu có phí đổi phòng
        if (transferFee > 0) {
            const booking = await Booking.findById(assignment.maDatPhong);
            booking.thongTinGia.phuPhiNangCap = (booking.thongTinGia.phuPhiNangCap || 0) + transferFee;
            booking.thongTinGia.tongDonDat += transferFee;
            await booking.save();
        }

        res.status(200).json({
            message: { msgBody: `✅ Đổi phòng thành công từ ${oldRoomInfo.soPhong} sang ${newRoom.soPhong}!`, msgError: false },
            transfer: {
                oldRoom: oldRoomInfo,
                newRoom: {
                    roomId: newRoom._id,
                    soPhong: newRoom.soPhong,
                    tang: newRoom.tang,
                    loaiView: newRoom.loaiView
                },
                transferFee,
                reason,
                transferTime: new Date()
            }
        });

    } catch (error) {
        console.error("Lỗi đổi phòng:", error);
        res.status(500).json({
            message: { msgBody: "❌ Lỗi khi đổi phòng!", msgError: true },
            error: error.message
        });
    }
});

// API cập nhật thông tin khách cho phòng
hotelBookingRouter.put("/hotelowner/update-room-guests/:assignmentId", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { guestInfo } = req.body;

        const assignment = await RoomBookingAssignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({
                message: { msgBody: "Không tìm thấy phòng đã gán!", msgError: true }
            });
        }

        // Cập nhật thông tin khách
        assignment.thongTinKhachPhong = {
            ...assignment.thongTinKhachPhong,
            ...guestInfo
        };

        await assignment.save();

        res.status(200).json({
            message: { msgBody: "✅ Cập nhật thông tin khách thành công!", msgError: false },
            guestInfo: assignment.thongTinKhachPhong
        });

    } catch (error) {
        console.error("Lỗi cập nhật thông tin khách:", error);
        res.status(500).json({
            message: { msgBody: "❌ Lỗi khi cập nhật thông tin khách!", msgError: true },
            error: error.message
        });
    }
});

// API cập nhật thời gian thực tế
hotelBookingRouter.put("/hotelowner/update-actual-time/:assignmentId", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { actualCheckInTime, actualCheckOutTime } = req.body;

        const assignment = await RoomBookingAssignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({
                message: { msgBody: "Không tìm thấy phòng đã gán!", msgError: true }
            });
        }

        const booking = await Booking.findById(assignment.maDatPhong);

        if (actualCheckInTime) {
            assignment.gioNhanPhongThucTe = actualCheckInTime;
            assignment.ngayNhanPhongThucTe = new Date(`${moment(booking.ngayNhanPhong).format('YYYY-MM-DD')} ${actualCheckInTime}`);
        }

        if (actualCheckOutTime) {
            assignment.gioTraPhongThucTe = actualCheckOutTime;
            assignment.ngayTraPhongThucTe = new Date(`${moment(booking.ngayTraPhong).format('YYYY-MM-DD')} ${actualCheckOutTime}`);
        }

        await assignment.save();

        res.status(200).json({
            message: { msgBody: "✅ Cập nhật thời gian thực tế thành công!", msgError: false },
            actualTimes: {
                checkInTime: assignment.gioNhanPhongThucTe,
                checkOutTime: assignment.gioTraPhongThucTe,
                checkInDate: assignment.ngayNhanPhongThucTe,
                checkOutDate: assignment.ngayTraPhongThucTe
            }
        });

    } catch (error) {
        console.error("Lỗi cập nhật thời gian thực tế:", error);
        res.status(500).json({
            message: { msgBody: "❌ Lỗi khi cập nhật thời gian thực tế!", msgError: true },
            error: error.message
        });
    }
});

// API lấy chi tiết assignment
hotelBookingRouter.get("/hotelowner/assignment/:assignmentId", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const assignment = await RoomBookingAssignment.findById(assignmentId)
            .populate('maPhong', 'soPhong tang loaiView')
            .populate('maDatPhong', 'bookingId customerName');

        if (!assignment) {
            return res.status(404).json({
                message: { msgBody: "Không tìm thấy phòng đã gán!", msgError: true }
            });
        }

        res.status(200).json({
            success: true,
            assignment: {
                assignmentId: assignment._id,
                roomInfo: assignment.maPhong,
                bookingInfo: assignment.maDatPhong,
                status: assignment.trangThaiGanPhong,
                pricing: {
                    originalPrice: assignment.giaPhongGoc,
                    actualPrice: assignment.giaPhongThucTe,
                    upgradeFee: assignment.phuPhiNangCap
                },
                guestInfo: assignment.thongTinKhachPhong,
                services: assignment.dichVuSuDung,
                serviceTotal: assignment.dichVuSuDung.reduce((total, service) => total + (service.thanhTien || 0), 0),
                notes: assignment.ghiChu,
                createdAt: assignment.createdAt,
                updatedAt: assignment.updatedAt
            }
        });

    } catch (error) {
        console.error("Lỗi lấy chi tiết assignment:", error);
        res.status(500).json({
            message: { msgBody: "❌ Lỗi khi lấy chi tiết phòng!", msgError: true },
            error: error.message
        });
    }
});


// ==========================Hepper xử lý===================================== 
// Tính tổng giá từ các phòng đã gán
const calculateTotalFromAssignments = async (bookingId) => {
    const assignments = await ChiTietPhong.find({
        maDatPhong: bookingId,
        trangThaiHoatDong: true
    });

    let tongTienPhong = 0;
    let tongPhiDichVu = 0;

    assignments.forEach(assignment => {
        tongTienPhong += assignment.giaPhongThucTe + assignment.phuPhiNangCap;
        tongPhiDichVu += assignment.dichVuSuDung.reduce((total, service) =>
            total + service.thanhTien, 0);
    });

    return { tongTienPhong, tongPhiDichVu, tongDonDat: tongTienPhong + tongPhiDichVu };
};

// Format booking response với thông tin chi tiết
const formatBookingResponse = async (booking) => {
    const assignments = await ChiTietPhong.find({
        maDatPhong: booking._id,
        trangThaiHoatDong: true
    }).populate('maPhong', 'soPhong tang loaiView');

    // Tính tổng tiền từ assignments hoặc dùng từ booking
    const totals = assignments.length > 0
        ? await calculateTotalFromAssignments(booking._id)
        : {
            tongTienPhong: booking.thongTinGia?.tongTienPhong || 0,
            tongPhiDichVu: booking.thongTinGia?.phiDichVu || 0,
            tongDonDat: booking.thongTinGia?.tongDonDat || 0
        };

    return {
        bookingId: booking._id,
        customerName: booking.maNguoiDung?.tenNguoiDung || "Khách lẻ",
        roomType: booking.maLoaiPhong?.tenLoaiPhong || "N/A",
        roomTypeId: booking.maLoaiPhong?._id?.toString(),
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
        totalAmount: totals.tongDonDat,
        roomQuantity: Math.max(assignments.length, booking.soLuongPhong),
        bookingType: booking.loaiDatPhong,
        notes: booking.ghiChu,
        cccd: booking.cccd,

        // Thông tin chi tiết các phòng đã gán
        assignedRooms: assignments.map(assignment => ({
            assignmentId: assignment._id,
            roomInfo: {
                roomId: assignment.maPhong._id,
                soPhong: assignment.maPhong?.soPhong || 'N/A',
                tang: assignment.maPhong?.tang || 1,
                loaiView: assignment.maPhong?.loaiView || 'none'
            },
            status: assignment.trangThaiGanPhong,
            actualTimes: {
                checkIn: assignment.ngayNhanPhongThucTe,
                checkOut: assignment.ngayTraPhongThucTe,
                checkInTime: assignment.gioNhanPhongThucTe,
                checkOutTime: assignment.gioTraPhongThucTe
            },
            pricing: {
                originalPrice: assignment.giaPhongGoc,
                actualPrice: assignment.giaPhongThucTe,
                upgradeFee: assignment.phuPhiNangCap
            },
            guestInfo: assignment.thongTinKhachPhong,
            services: assignment.dichVuSuDung || [],
            serviceTotal: assignment.dichVuSuDung.reduce((total, service) =>
                total + service.thanhTien, 0),
            notes: assignment.ghiChu
        })),

        // Thông tin khách sạn
        hotelId: {
            _id: booking.maKhachSan._id,
            tenKhachSan: booking.maKhachSan.tenKhachSan,
            diaChi: booking.maKhachSan.diaChi,
            soDienThoai: booking.maKhachSan.soDienThoai
        },

        // Thông tin giá chi tiết
        priceDetails: {
            ...booking.thongTinGia.toObject(),
            tongTienPhong: totals.tongTienPhong,
            phiDichVu: totals.tongPhiDichVu,
            tongDonDat: totals.tongDonDat
        },

        // Thông tin thanh toán chi tiết
        paymentDetails: booking.thongTinThanhToan
    };
};

module.exports = hotelBookingRouter;