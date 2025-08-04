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



//Danh sách khách sạn 
hotelBookingRouter.get("/hotelowner/hotels", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user || user.vaiTro !== "chuKhachSan") {
            return res.status(403).json({
                msgBody: "Tài khoản không có quyền sử dụng chức năng này!",
                msgError: true
            });
        }

        const hotels = await Hotel.find({ maChuKhachSan: user._id })
            .select('tenKhachSan diaChi soDienThoai email hinhAnh trangThai')
            .sort({ createdAt: -1 });

        if (hotels.length === 0) {
            return res.status(200).json({
                success: true,
                hotels: [],
                message: "Bạn chưa sở hữu khách sạn nào."
            });
        }

        // ✅ Format response với thống kê cơ bản
        const hotelList = await Promise.all(hotels.map(async (hotel) => {
            // Đếm bookings cho mỗi hotel
            const totalBookings = await Booking.countDocuments({
                maKhachSan: hotel._id
            });

            const activeBookings = await Booking.countDocuments({
                maKhachSan: hotel._id,
                trangThai: { $in: ['da_xac_nhan', 'da_nhan_phong', 'dang_su_dung'] }
            });

            // Đếm room types
            const roomTypes = await RoomType.countDocuments({
                maKhachSan: hotel._id
            });

            // Đếm total rooms
            const totalRooms = await Room.countDocuments({
                maKhachSan: hotel._id
            });

            return {
                hotelId: hotel._id,
                tenKhachSan: hotel.tenKhachSan,
                diaChi: hotel.diaChi,
                soDienThoai: hotel.soDienThoai,
                email: hotel.email,
                hinhAnh: hotel.hinhAnh,
                trangThai: hotel.trangThai,
                statistics: {
                    totalBookings,
                    activeBookings,
                    roomTypes,
                    totalRooms
                }
            };
        }));

        console.log(`✅ Returning ${hotelList.length} hotels for owner ${user._id}`);

        return res.status(200).json({
            success: true,
            hotels: hotelList,
            totalHotels: hotelList.length
        });

    } catch (error) {
        console.error("Lỗi khi lấy danh sách khách sạn:", error);
        return res.status(500).json({
            success: false,
            msgBody: "Lỗi máy chủ khi lấy danh sách khách sạn.",
            msgError: true
        });
    }
});

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

        // ✅ SỬA: Handle empty bookings case
        if (!bookings || bookings.length === 0) {
            console.log('📋 No bookings found - returning empty array');
            return res.status(200).json([]); // ✅ Return empty array instead of error
        }

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
                    soPhong: assignment.maPhong?.soPhong || "000",
                    tang: assignment.maPhong?.tang || 1,
                    loaiView: assignment.maPhong?.loaiView || 'none' // ✅ SỬA: Lấy từ assignment.maPhong
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
            priceDetails: {
                ...booking.thongTinGia,
                // ✅ THÊM: Đảm bảo có chiTietGia
                chiTietGia: booking.thongTinGia?.chiTietGia || {
                    basePrice: booking.maLoaiPhong?.giaCa || 0,
                    subtotalBeforeDiscount: (booking.maLoaiPhong?.giaCa || 0) * (booking.thongTinGia?.soLuongDonVi || 1),
                    discounts: {
                        weekend: false,
                        longStay: false,
                        discountPercent: 0,
                        discountAmount: 0
                    },
                    breakdown: {
                        subtotal: (booking.maLoaiPhong?.giaCa || 0) * (booking.thongTinGia?.soLuongDonVi || 1),
                        taxPrice: booking.thongTinGia?.phuPhiCuoiTuan || 0,
                        discountAmount: booking.thongTinGia?.giamGia || 0,
                        total: booking.thongTinGia?.tongDonDat || 0
                    }
                }
            },
            // Thông tin thanh toán chi tiết
            paymentDetails: booking.thongTinThanhToan
        }));

        console.log(`✅ Returning ${result.length} bookings`);
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
// hotelBookingRouter.put("/hotelowner/update/:id", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
//     try {
//         const { id } = req.params;
//         const {
//             status,
//             paymentMethod,
//             reason,
//             service,
//             newBookingType,
//             newCheckInDate,
//             newCheckOutDate,
//             newCheckInTime,
//             newCheckOutTime,
//         } = req.body;

//         const booking = await Booking.findById(id).populate('maLoaiPhong');
//         if (!booking) {
//             return res.status(404).json({ message: "Booking not found" });
//         }

//         const updateData = {};
//         let recalculatePrice = false;

//         // ✅ THÊM: Xử lý nhận phòng thực tế (da_nhan_phong)
//         if (status === 'da_nhan_phong') {
//             console.log(`🏨 Processing real check-in for booking ${id}`);

//             // ✅ Kiểm tra booking có thể nhận phòng không
//             if (!['da_xac_nhan', 'dang_cho'].includes(booking.trangThai)) {
//                 return res.status(400).json({
//                     message: {
//                         msgBody: `Không thể nhận phòng từ trạng thái "${booking.trangThai}"!`,
//                         msgError: true
//                     }
//                 });
//             }

//             const now = moment().tz('Asia/Ho_Chi_Minh');
//             const currentTime = now.format('HH:mm');
//             const currentDate = now.format('YYYY-MM-DD');

//             console.log(`⏰ Actual check-in time: ${currentTime} on ${currentDate}`);

//             // ✅ Cập nhật thời gian nhận phòng thực tế
//             updateData.trangThai = 'da_nhan_phong';
//             updateData.thoiGianNhanPhongThucTe = now.toDate();
//             updateData.gioNhanPhongThucTe = currentTime;

//             // ✅ Tính toán late check-in fee (nếu có policy)
//             const plannedCheckInTime = moment(`${moment(booking.ngayNhanPhong).format('YYYY-MM-DD')} ${booking.gioNhanPhong}`, 'YYYY-MM-DD HH:mm');
//             const actualCheckInTime = now;

//             let earlyLateFee = 0;
//             let checkInNote = '';

//             if (actualCheckInTime.isAfter(plannedCheckInTime)) {
//                 const lateMinutes = actualCheckInTime.diff(plannedCheckInTime, 'minutes');
//                 checkInNote = `Nhận trễ ${lateMinutes} phút`;

//                 // ✅ Tính phí nhận trễ (nếu có policy - tùy chỉnh)
//                 if (lateMinutes > 60 && booking.loaiDatPhong === 'theo_gio') {
//                     earlyLateFee = Math.ceil(lateMinutes / 60) * 10000; // 10k/giờ trễ
//                     updateData['thongTinGia.phuPhiGio'] = earlyLateFee;
//                     updateData['thongTinGia.tongDonDat'] = booking.thongTinGia.tongTienPhong + (booking.thongTinGia.phiDichVu || 0) + earlyLateFee;
//                 }
//             } else if (actualCheckInTime.isBefore(plannedCheckInTime)) {
//                 const earlyMinutes = plannedCheckInTime.diff(actualCheckInTime, 'minutes');
//                 checkInNote = `Nhận sớm ${earlyMinutes} phút`;
//             } else {
//                 checkInNote = 'Nhận đúng giờ';
//             }

//             // ✅ Cập nhật note
//             const existingNote = booking.ghiChu || '';
//             updateData.ghiChu = existingNote + `\n[${currentTime} ${moment().format('DD/MM/YYYY')}] ${checkInNote}`;

//             console.log(`✅ Check-in processed: ${checkInNote}${earlyLateFee > 0 ? ` - Phí: ${earlyLateFee}đ` : ''}`);

//             // ✅ Thêm thông tin check-in vào response
//             updateData._checkInInfo = {
//                 actualCheckInTime: currentTime,
//                 actualCheckInDate: currentDate,
//                 plannedTime: booking.gioNhanPhong,
//                 isLate: actualCheckInTime.isAfter(plannedCheckInTime),
//                 isEarly: actualCheckInTime.isBefore(plannedCheckInTime),
//                 timeDifferenceMinutes: Math.abs(actualCheckInTime.diff(plannedCheckInTime, 'minutes')),
//                 earlyLateFee,
//                 checkInNote
//             };
//         }
//         // ✅ Xử lý checkout với late fee và payment update
//         else if (status === 'da_tra_phong') {
//             console.log(`🚪 Processing checkout for booking ${id}`);

//             // ✅ Kiểm tra booking có thể checkout không
//             if (!['da_xac_nhan', 'da_nhan_phong', 'dang_su_dung'].includes(booking.trangThai)) {
//                 return res.status(400).json({
//                     message: {
//                         msgBody: `Không thể checkout từ trạng thái "${booking.trangThai}"!`,
//                         msgError: true
//                     }
//                 });
//             }

//             // Lấy tất cả assignments của booking
//             const assignments = await RoomBookingAssignment.find({
//                 maDatPhong: id,
//                 trangThaiHoatDong: true,
//                 trangThaiGanPhong: 'da_gan'
//             }).populate('maPhong', 'soPhong');

//             if (assignments.length === 0) {
//                 return res.status(400).json({
//                     message: { msgBody: "Không có phòng nào để checkout!", msgError: true }
//                 });
//             }

//             let totalLateFee = 0;
//             const checkoutResults = [];

//             // ✅ Checkout từng phòng và tính late fee
//             for (const assignment of assignments) {
//                 const currentTime = moment().format('HH:mm');

//                 // Tính late fee cho phòng này
//                 const lateFeeCalculation = calculateLateFee(booking, assignment, currentTime);

//                 // ✅ SỬA: Không dùng enum "da_tra_phong", dùng fields khác
//                 assignment.gioTraPhongThucTe = currentTime;
//                 assignment.thoiGianCheckOutThucTe = new Date();
//                 assignment.daCheckout = true;  // ✅ THÊM field boolean
//                 assignment.ghiChu += `${lateFeeCalculation.status}`;

//                 // ✅ Thêm phí trả trễ nếu có
//                 if (lateFeeCalculation.lateFee > 0) {
//                     const lateFeeService = {
//                         tenDichVu: `Phí trả trễ phòng ${assignment.maPhong.soPhong} (${lateFeeCalculation.lateMinutes} phút)`,
//                         soLuong: 1,
//                         donGia: lateFeeCalculation.lateFee,
//                         thanhTien: lateFeeCalculation.lateFee,
//                         thoiGianSuDung: new Date(),
//                         loaiDichVu: 'phi_tra_tre'
//                     };

//                     assignment.dichVuSuDung.push(lateFeeService);
//                     assignment.phuPhiNangCap += lateFeeCalculation.lateFee;
//                     totalLateFee += lateFeeCalculation.lateFee;

//                     console.log(`💰 Added late fee ${lateFeeCalculation.lateFee}đ for room ${assignment.maPhong.soPhong}`);
//                 }

//                 // ✅ Cập nhật trạng thái phòng về "trong"
//                 await Room.findByIdAndUpdate(assignment.maPhong._id, {
//                     trangThaiPhong: "trong"
//                 });

//                 await assignment.save();

//                 checkoutResults.push({
//                     roomNumber: assignment.maPhong.soPhong,
//                     checkoutTime: currentTime,
//                     lateFee: lateFeeCalculation.lateFee,
//                     isLate: lateFeeCalculation.isLate
//                 });
//             }

//             // ✅ Cập nhật tổng tiền booking nếu có late fee
//             if (totalLateFee > 0) {
//                 booking.thongTinGia.phiDichVu = (booking.thongTinGia.phiDichVu || 0) + totalLateFee;
//                 booking.thongTinGia.tongDonDat = booking.thongTinGia.tongTienPhong + booking.thongTinGia.phiDichVu;
//                 console.log(`💰 Updated booking total: +${totalLateFee}đ late fee`);
//             }

//             // ✅ Cập nhật booking status và payment
//             updateData.trangThai = 'da_tra_phong';
//             updateData.trangThaiThanhToan = 'da_thanh_toan';
//             updateData.thoiGianTraPhongThucTe = new Date();

//             console.log(`✅ Checkout completed for ${assignments.length} rooms with total late fee: ${totalLateFee}đ`);

//             // Thêm thông tin checkout vào response
//             updateData._checkoutInfo = {
//                 totalRooms: assignments.length,
//                 totalLateFee,
//                 checkoutResults,
//                 paymentStatusUpdated: true,
//                 bookingStatusUpdated: true
//             };
//         } else {
//             // ✅ Cập nhật trạng thái booking bình thường
//             if (status) {
//                 const validStatuses = ["dang_cho", "da_xac_nhan", "da_huy", "da_nhan_phong", "dang_su_dung", "da_tra_phong", "khong_nhan_phong"];
//                 if (!validStatuses.includes(status)) {
//                     return res.status(400).json({
//                         message: { msgBody: "Trạng thái không hợp lệ!", msgError: true }
//                     });
//                 }
//                 updateData.trangThai = status;
//                 console.log(`📝 Updating booking status to: ${status}`);
//             }
//         }

//         // ✅ Thay đổi loại đặt phòng
//         if (newBookingType && newBookingType !== booking.loaiDatPhong) {
//             if (!['theo_gio', 'qua_dem', 'dai_ngay'].includes(newBookingType)) {
//                 return res.status(400).json({
//                     message: { msgBody: "Loại đặt phòng không hợp lệ!", msgError: true }
//                 });
//             }
//             updateData.loaiDatPhong = newBookingType;
//             recalculatePrice = true;
//         }

//         // ✅ Thay đổi thời gian
//         if (newCheckInDate) {
//             updateData.ngayNhanPhong = new Date(newCheckInDate);
//             recalculatePrice = true;
//         }

//         if (newCheckOutDate) {
//             updateData.ngayTraPhong = new Date(newCheckOutDate);
//             recalculatePrice = true;
//         }

//         if (newCheckInTime) {
//             updateData.gioNhanPhong = newCheckInTime;
//         }

//         if (newCheckOutTime) {
//             updateData.gioTraPhong = newCheckOutTime;
//         }

//         // ✅ LOGIC MỚI: Tính lại giá
//         if (recalculatePrice) {
//             const roomType = booking.maLoaiPhong;
//             const finalBookingType = newBookingType || booking.loaiDatPhong;

//             // ✅ KIỂM TRA: Khách đang ở và muốn thay đổi
//             const isGuestCurrentlyStaying = booking.thoiGianNhanPhongThucTe &&
//                 booking.trangThai === 'da_nhan_phong';
//             const isBookingTypeChange = newBookingType && newBookingType !== booking.loaiDatPhong;
//             if (isGuestCurrentlyStaying && isBookingTypeChange) {
//                 // ✅ GUEST CHANGE: Logic cộng thêm ĐÚNG
//                 console.log(`🔄 Guest booking change detected: ${booking.loaiDatPhong} → ${finalBookingType}`);

//                 const now = moment().tz('Asia/Ho_Chi_Minh');
//                 const currentHourlyPrice = booking.thongTinGia.tongTienPhong; // Giá giờ đã trả
//                 const roomBasePrice = booking.maLoaiPhong.giaCa; // Giá đêm gốc

//                 let additionalPrice = 0;
//                 let changeDescription = '';

//                 if (booking.loaiDatPhong === 'theo_gio' && finalBookingType === 'qua_dem') {
//                     // ✅ THEO GIỜ → QUA ĐÊM: Cộng thêm giá qua đêm
//                     // Logic: Khách đã trả giá giờ + muốn thêm qua đêm = cộng thêm giá đêm đủ
//                     additionalPrice = roomBasePrice; // Cộng thêm giá đêm đầy đủ
//                     changeDescription = `Đổi từ theo giờ sang qua đêm - Cộng thêm`;

//                     // Cập nhật checkout time thành 12:00 ngày mai
//                     const newCheckOut = moment(booking.ngayNhanPhong).add(1, 'day').hour(12).minute(0);
//                     updateData.ngayTraPhong = newCheckOut.toDate();
//                     updateData.gioTraPhong = '12:00';

//                     console.log(`💰 Hourly→Overnight: Keep existing ${currentHourlyPrice}đ + Add full night ${additionalPrice}đ = Total ${currentHourlyPrice + additionalPrice}đ`);

//                 } else if (booking.loaiDatPhong === 'qua_dem' && finalBookingType === 'dai_ngay') {
//                     // ✅ QUA ĐÊM → DÀI NGÀY: Cộng thêm ngày thêm
//                     const finalCheckOut = moment(newCheckOutDate || booking.ngayTraPhong);
//                     const extraDays = finalCheckOut.diff(moment(booking.ngayTraPhong), 'days');

//                     if (extraDays > 0) {
//                         const dayPrice = smartRound(roomBasePrice * 1.10); // +10% cho dài ngày
//                         additionalPrice = dayPrice * extraDays;
//                         changeDescription = `Gia hạn thêm ${extraDays} ngày`;

//                         updateData.ngayTraPhong = finalCheckOut.toDate();
//                     }

//                     console.log(`📅 Overnight→LongStay: Keep existing ${currentHourlyPrice}đ + Add ${extraDays} days x ${dayPrice}đ = +${additionalPrice}đ`);

//                 } else if (booking.loaiDatPhong === 'theo_gio' && finalBookingType === 'dai_ngay') {
//                     // ✅ THEO GIỜ → DÀI NGÀY: Cộng thêm giá dài ngày
//                     const finalCheckOut = moment(newCheckOutDate);
//                     const totalDays = finalCheckOut.diff(moment(booking.ngayNhanPhong), 'days');

//                     const dayPrice = smartRound(roomBasePrice * 1.10);
//                     additionalPrice = dayPrice * totalDays; // Cộng thêm giá dài ngày đầy đủ

//                     changeDescription = `Đổi từ theo giờ sang dài ngày (${totalDays} ngày) - Cộng thêm`;
//                     updateData.ngayTraPhong = finalCheckOut.toDate();

//                     console.log(`🏨 Hourly→LongStay: Keep existing ${currentHourlyPrice}đ + Add ${totalDays} days x ${dayPrice}đ = +${additionalPrice}đ`);
//                 }

//                 // ✅ Cập nhật với phụ thu CỘNG THÊM
//                 if (additionalPrice > 0) {
//                     const newTotalRoom = booking.thongTinGia.tongTienPhong + additionalPrice; // ✅ CỘNG THÊM

//                     updateData.loaiDatPhong = finalBookingType;
//                     updateData['thongTinGia.tongTienPhong'] = newTotalRoom;
//                     updateData['thongTinGia.tongDonDat'] = smartRound(newTotalRoom + (booking.thongTinGia.phiDichVu || 0));

//                     // ✅ Thông tin guest change cho response
//                     updateData._guestChangeInfo = {
//                         oldBookingType: booking.loaiDatPhong,
//                         newBookingType: finalBookingType,
//                         oldTotal: booking.thongTinGia.tongTienPhong,
//                         newTotal: newTotalRoom,
//                         additionalPrice: additionalPrice, // ✅ Phụ thu thực tế
//                         changeDescription: changeDescription,
//                         needsPayment: additionalPrice > 0,
//                         refundAmount: 0, // Guest change không hoàn tiền
//                         calculation: {
//                             existingAmount: booking.thongTinGia.tongTienPhong,
//                             additionalAmount: additionalPrice,
//                             finalAmount: newTotalRoom,
//                             formula: `${booking.thongTinGia.tongTienPhong.toLocaleString('vi-VN')}đ + ${additionalPrice.toLocaleString('vi-VN')}đ = ${newTotalRoom.toLocaleString('vi-VN')}đ`
//                         }
//                     };

//                     console.log(`💰 Guest change: ${changeDescription} - Cộng thêm: ${additionalPrice.toLocaleString('vi-VN')}đ`);
//                     console.log(`💰 Calculation: ${booking.thongTinGia.tongTienPhong.toLocaleString('vi-VN')}đ + ${additionalPrice.toLocaleString('vi-VN')}đ = ${newTotalRoom.toLocaleString('vi-VN')}đ`);
//                 }

//             } else {
//                 // ✅ ADMIN UPDATE: Dùng calculateEnhancedPricing với smart rounding
//                 console.log(`🛠️ Admin update: Using enhanced pricing calculation`);

//                 const finalCheckIn = moment(newCheckInDate || booking.ngayNhanPhong);
//                 const finalCheckOut = moment(newCheckOutDate || booking.ngayTraPhong);
//                 const checkInTime = newCheckInTime || booking.gioNhanPhong;
//                 const checkOutTime = newCheckOutTime || booking.gioTraPhong;

//                 // ✅ SỬA: Dùng calculateEnhancedPricing thay vì logic cũ
//                 const enhancedPricing = calculateEnhancedPricing({
//                     roomType: roomType,
//                     bookingType: finalBookingType,
//                     checkInDate: finalCheckIn.format('YYYY-MM-DD'),
//                     checkOutDate: finalBookingType !== 'theo_gio' ? finalCheckOut.format('YYYY-MM-DD') : null,
//                     checkInTime: checkInTime,
//                     checkOutTime: checkOutTime
//                 });

//                 console.log(`💰 Enhanced pricing result:`, enhancedPricing);

//                 // ✅ SỬA: Sử dụng kết quả đã được làm tròn từ calculateEnhancedPricing
//                 const newRoomTotal = smartRound(enhancedPricing.finalPrice * booking.soLuongPhong);
//                 const existingServiceFee = booking.thongTinGia?.phiDichVu || 0;

//                 // ✅ Cập nhật với giá trị đã làm tròn
//                 updateData['thongTinGia.donGia'] = enhancedPricing.unitPrice;
//                 updateData['thongTinGia.soLuongDonVi'] = enhancedPricing.duration;
//                 updateData['thongTinGia.donVi'] = enhancedPricing.unit;
//                 updateData['thongTinGia.tongTienPhong'] = newRoomTotal;
//                 updateData['thongTinGia.tongDonDat'] = smartRound(newRoomTotal + existingServiceFee);

//                 // ✅ THÊM: Chi tiết giá cho response
//                 updateData['thongTinGia.chiTietGia'] = {
//                     basePrice: enhancedPricing.basePrice,
//                     subtotalBeforeDiscount: smartRound(enhancedPricing.breakdown.subtotal * booking.soLuongPhong),
//                     duration: enhancedPricing.duration,
//                     unit: enhancedPricing.unit,
//                     multiplier: enhancedPricing.multiplier,
//                     discounts: {
//                         weekend: enhancedPricing.discounts.weekend,
//                         longStay: enhancedPricing.discounts.longStay,
//                         discountPercent: enhancedPricing.discounts.discountPercent,
//                         discountAmount: smartRound(enhancedPricing.discounts.discountAmount * booking.soLuongPhong)
//                     },
//                     breakdown: {
//                         baseRate: enhancedPricing.basePrice,
//                         duration: enhancedPricing.duration,
//                         subtotal: smartRound(enhancedPricing.breakdown.subtotal * booking.soLuongPhong),
//                         taxPrice: smartRound(enhancedPricing.breakdown.taxPrice * booking.soLuongPhong),
//                         discountAmount: smartRound(enhancedPricing.breakdown.discountAmount * booking.soLuongPhong),
//                         multiplier: enhancedPricing.multiplier,
//                         total: newRoomTotal,
//                     }
//                 };

//                 console.log(`💰 Admin update: New total = ${newRoomTotal.toLocaleString('vi-VN')}đ (enhanced + rounded)`);
//             }
//         }

//         // ✅ Các cập nhật khác (giữ nguyên logic cũ)
//         if (paymentMethod) updateData.phuongThucThanhToan = paymentMethod;
//         if (reason) updateData.ghiChu = reason || "Khách sạn đã hủy đơn này!";

//         // ✅ Xử lý dịch vụ bổ sung
//         if (service && Array.isArray(service)) {
//             const dichVuMoi = service.map(service => ({
//                 tenDichVu: service.name,
//                 donGia: service.price,
//                 soLuong: service.quantity || 1,
//                 thanhTien: service.price * (service.quantity || 1)
//             }));

//             updateData.dichVuBoSung = dichVuMoi;
//             const tongPhiDichVu = dichVuMoi.reduce((total, service) => total + service.thanhTien, 0);
//             updateData['thongTinGia.phiDichVu'] = tongPhiDichVu;

//             const currentRoomTotal = updateData['thongTinGia.tongTienPhong'] || booking.thongTinGia.tongTienPhong;
//             updateData['thongTinGia.tongDonDat'] = currentRoomTotal + tongPhiDichVu;
//         }

//         // ✅ Cập nhật booking trong database
//         const updatedBooking = await Booking.findByIdAndUpdate(id, updateData, { new: true })
//             .populate("maNguoiDung", "tenNguoiDung email soDienThoai")
//             .populate("maLoaiPhong", "tenLoaiPhong giaCa")
//             .populate("maKhachSan", "tenKhachSan");

//         if (!updatedBooking) {
//             return res.status(404).json({
//                 message: { msgBody: "Không tìm thấy đơn đặt phòng!", msgError: true }
//             });
//         }

//         // ✅ Success messages
//         let successMessage = "✅ Cập nhật đơn đặt thành công!";

//         if (status === 'da_nhan_phong' && updateData._checkInInfo) {
//             const checkInInfo = updateData._checkInInfo;
//             successMessage = `🏨 Nhận phòng thành công lúc ${checkInInfo.actualCheckInTime}!`;

//             if (checkInInfo.earlyLateFee > 0) {
//                 successMessage += ` Phí nhận trễ: ${checkInInfo.earlyLateFee.toLocaleString('vi-VN')}đ.`;
//             } else {
//                 successMessage += ` ${checkInInfo.checkInNote}.`;
//             }
//         } else if (status === 'da_tra_phong' && updateData._checkoutInfo) {
//             const checkoutInfo = updateData._checkoutInfo;
//             successMessage = `🚪 Checkout thành công ${checkoutInfo.totalRooms} phòng!`;

//             if (checkoutInfo.totalLateFee > 0) {
//                 successMessage += ` Phí trả trễ: ${checkoutInfo.totalLateFee.toLocaleString('vi-VN')}đ.`;
//             }

//             successMessage += " Đã cập nhật trạng thái thanh toán.";
//         } else if (updateData._guestChangeInfo) {
//             const changeInfo = updateData._guestChangeInfo;
//             successMessage = `🔄 ${changeInfo.changeDescription} thành công! Phụ thu: ${changeInfo.additionalPrice.toLocaleString('vi-VN')}đ`;
//         } else if (recalculatePrice) {
//             successMessage += ` Giá mới: ${updatedBooking.thongTinGia.tongDonDat.toLocaleString('vi-VN')}đ`;
//         } else if (status === "da_huy") {
//             successMessage = "🚫 Đã hủy đơn đặt phòng thành công!";
//         }

//         console.log(`✅ Final booking status: ${updatedBooking.trangThai}, payment: ${updatedBooking.trangThaiThanhToan}`);

//         res.status(200).json({
//             message: { msgBody: successMessage, msgError: false },
//             updatedBooking: {
//                 bookingId: updatedBooking._id,
//                 status: updatedBooking.trangThai,
//                 paymentStatus: updatedBooking.trangThaiThanhToan,
//                 bookingType: updatedBooking.loaiDatPhong,
//                 services: updatedBooking.dichVuBoSung || [],
//                 servicesFee: updatedBooking.thongTinGia.phiDichVu || 0,
//                 totalAmount: updatedBooking.thongTinGia.tongDonDat || 0,
//                 priceDetails: updatedBooking.thongTinGia,
//                 reason: updatedBooking.ghiChu,
//                 // ✅ Thêm thông tin check-in nếu có
//                 ...(updateData._checkInInfo && {
//                     checkInInfo: updateData._checkInInfo
//                 }),
//                 // ✅ Thêm thông tin checkout nếu có
//                 ...(updateData._checkoutInfo && {
//                     checkoutInfo: updateData._checkoutInfo
//                 }),
//                 // ✅ THÊM: Thông tin guest change nếu có
//                 ...(updateData._guestChangeInfo && {
//                     guestChangeInfo: updateData._guestChangeInfo
//                 })
//             }
//         });

//     } catch (error) {
//         console.error("Lỗi cập nhật booking:", error);
//         res.status(400).json({
//             message: { msgBody: "❌ Cập nhật đơn đặt thất bại!", msgError: true },
//             error: error.message
//         });
//     }
// });


// ✅ SỬA: Vị trí đúng của logic trong hotelBookingRouter.put("/hotelowner/update/:id")

// ✅ CODE GỐC + FIX GUEST CHANGE ĐỌN GIẢN

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

        // ✅ THÊM: Xử lý nhận phòng thực tế (da_nhan_phong)
        if (status === 'da_nhan_phong') {
            console.log(`🏨 Processing real check-in for booking ${id}`);

            // ✅ Kiểm tra booking có thể nhận phòng không
            if (!['da_xac_nhan', 'dang_cho'].includes(booking.trangThai)) {
                return res.status(400).json({
                    message: {
                        msgBody: `Không thể nhận phòng từ trạng thái "${booking.trangThai}"!`,
                        msgError: true
                    }
                });
            }

            const now = moment().tz('Asia/Ho_Chi_Minh');
            const currentTime = now.format('HH:mm');
            const currentDate = now.format('YYYY-MM-DD');

            console.log(`⏰ Actual check-in time: ${currentTime} on ${currentDate}`);

            // ✅ Cập nhật thời gian nhận phòng thực tế
            updateData.trangThai = 'da_nhan_phong';
            updateData.thoiGianNhanPhongThucTe = now.toDate();
            updateData.gioNhanPhongThucTe = currentTime;

            // ✅ Tính toán late check-in fee (nếu có policy)
            const plannedCheckInTime = moment(`${moment(booking.ngayNhanPhong).format('YYYY-MM-DD')} ${booking.gioNhanPhong}`, 'YYYY-MM-DD HH:mm');
            const actualCheckInTime = now;

            let earlyLateFee = 0;
            let checkInNote = '';

            if (actualCheckInTime.isAfter(plannedCheckInTime)) {
                const lateMinutes = actualCheckInTime.diff(plannedCheckInTime, 'minutes');
                checkInNote = `Nhận trễ ${lateMinutes} phút`;

                // ✅ Tính phí nhận trễ (nếu có policy - tùy chỉnh)
                if (lateMinutes > 60 && booking.loaiDatPhong === 'theo_gio') {
                    earlyLateFee = Math.ceil(lateMinutes / 60) * 10000; // 10k/giờ trễ
                    updateData['thongTinGia.phuPhiGio'] = earlyLateFee;
                    updateData['thongTinGia.tongDonDat'] = booking.thongTinGia.tongTienPhong + (booking.thongTinGia.phiDichVu || 0) + earlyLateFee;
                }
            } else if (actualCheckInTime.isBefore(plannedCheckInTime)) {
                const earlyMinutes = plannedCheckInTime.diff(actualCheckInTime, 'minutes');
                checkInNote = `Nhận sớm ${earlyMinutes} phút`;
            } else {
                checkInNote = 'Nhận đúng giờ';
            }

            // ✅ Cập nhật note
            const existingNote = booking.ghiChu || '';
            updateData.ghiChu = existingNote + `\n[${currentTime} ${moment().format('DD/MM/YYYY')}] ${checkInNote}`;

            console.log(`✅ Check-in processed: ${checkInNote}${earlyLateFee > 0 ? ` - Phí: ${earlyLateFee}đ` : ''}`);

            // ✅ Thêm thông tin check-in vào response
            updateData._checkInInfo = {
                actualCheckInTime: currentTime,
                actualCheckInDate: currentDate,
                plannedTime: booking.gioNhanPhong,
                isLate: actualCheckInTime.isAfter(plannedCheckInTime),
                isEarly: actualCheckInTime.isBefore(plannedCheckInTime),
                timeDifferenceMinutes: Math.abs(actualCheckInTime.diff(plannedCheckInTime, 'minutes')),
                earlyLateFee,
                checkInNote
            };
        }
        // ✅ Xử lý checkout với late fee và payment update
        else if (status === 'da_tra_phong') {
            console.log(`🚪 Processing checkout for booking ${id}`);

            // ✅ Kiểm tra booking có thể checkout không
            if (!['da_xac_nhan', 'da_nhan_phong', 'dang_su_dung'].includes(booking.trangThai)) {
                return res.status(400).json({
                    message: {
                        msgBody: `Không thể checkout từ trạng thái "${booking.trangThai}"!`,
                        msgError: true
                    }
                });
            }

            // Lấy tất cả assignments của booking
            const assignments = await RoomBookingAssignment.find({
                maDatPhong: id,
                trangThaiHoatDong: true,
                trangThaiGanPhong: 'da_gan'
            }).populate('maPhong', 'soPhong');

            if (assignments.length === 0) {
                return res.status(400).json({
                    message: { msgBody: "Không có phòng nào để checkout!", msgError: true }
                });
            }

            let totalLateFee = 0;
            const checkoutResults = [];

            // ✅ Checkout từng phòng và tính late fee
            for (const assignment of assignments) {
                const currentTime = moment().format('HH:mm');

                // Tính late fee cho phòng này
                const lateFeeCalculation = calculateLateFee(booking, assignment, currentTime);

                // ✅ SỬA: Không dùng enum "da_tra_phong", dùng fields khác
                assignment.gioTraPhongThucTe = currentTime;
                assignment.thoiGianCheckOutThucTe = new Date();
                assignment.daCheckout = true;  // ✅ THÊM field boolean
                assignment.ghiChu += `${lateFeeCalculation.status}`;

                // ✅ Thêm phí trả trễ nếu có
                if (lateFeeCalculation.lateFee > 0) {
                    const lateFeeService = {
                        tenDichVu: `Phí trả trễ phòng ${assignment.maPhong.soPhong} (${lateFeeCalculation.lateMinutes} phút)`,
                        soLuong: 1,
                        donGia: lateFeeCalculation.lateFee,
                        thanhTien: lateFeeCalculation.lateFee,
                        thoiGianSuDung: new Date(),
                        loaiDichVu: 'phi_tra_tre'
                    };

                    assignment.dichVuSuDung.push(lateFeeService);
                    assignment.phuPhiNangCap += lateFeeCalculation.lateFee;
                    totalLateFee += lateFeeCalculation.lateFee;

                    console.log(`💰 Added late fee ${lateFeeCalculation.lateFee}đ for room ${assignment.maPhong.soPhong}`);
                }

                // ✅ Cập nhật trạng thái phòng về "trong"
                await Room.findByIdAndUpdate(assignment.maPhong._id, {
                    trangThaiPhong: "trong"
                });

                await assignment.save();

                checkoutResults.push({
                    roomNumber: assignment.maPhong.soPhong,
                    checkoutTime: currentTime,
                    lateFee: lateFeeCalculation.lateFee,
                    isLate: lateFeeCalculation.isLate
                });
            }

            // ✅ Cập nhật tổng tiền booking nếu có late fee
            if (totalLateFee > 0) {
                booking.thongTinGia.phiDichVu = (booking.thongTinGia.phiDichVu || 0) + totalLateFee;
                booking.thongTinGia.tongDonDat = booking.thongTinGia.tongTienPhong + booking.thongTinGia.phiDichVu;
                console.log(`💰 Updated booking total: +${totalLateFee}đ late fee`);
            }

            // ✅ Cập nhật booking status và payment
            updateData.trangThai = 'da_tra_phong';
            updateData.trangThaiThanhToan = 'da_thanh_toan';
            updateData.thoiGianTraPhongThucTe = new Date();

            console.log(`✅ Checkout completed for ${assignments.length} rooms with total late fee: ${totalLateFee}đ`);

            // Thêm thông tin checkout vào response
            updateData._checkoutInfo = {
                totalRooms: assignments.length,
                totalLateFee,
                checkoutResults,
                paymentStatusUpdated: true,
                bookingStatusUpdated: true
            };
        } else {
            // ✅ Cập nhật trạng thái booking bình thường
            if (status) {
                const validStatuses = ["dang_cho", "da_xac_nhan", "da_huy", "da_nhan_phong", "dang_su_dung", "da_tra_phong", "khong_nhan_phong"];
                if (!validStatuses.includes(status)) {
                    return res.status(400).json({
                        message: { msgBody: "Trạng thái không hợp lệ!", msgError: true }
                    });
                }
                updateData.trangThai = status;
                console.log(`📝 Updating booking status to: ${status}`);
            }
        }

        // ✅ Thay đổi loại đặt phòng
        if (newBookingType && newBookingType !== booking.loaiDatPhong) {
            if (!['theo_gio', 'qua_dem', 'dai_ngay'].includes(newBookingType)) {
                return res.status(400).json({
                    message: { msgBody: "Loại đặt phòng không hợp lệ!", msgError: true }
                });
            }
            updateData.loaiDatPhong = newBookingType;
            recalculatePrice = true;
        }

        // ✅ Thay đổi thời gian
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

        // ✅ LOGIC TÍNH LẠI GIÁ - FIX GUEST CHANGE
        if (recalculatePrice) {
            const roomType = booking.maLoaiPhong;
            const finalBookingType = newBookingType || booking.loaiDatPhong;

            // ✅ KIỂM TRA GUEST CHANGE (ĐƠN GIẢN)
            const isGuestChange = ['da_nhan_phong', 'dang_su_dung'].includes(booking.trangThai) &&
                newBookingType && newBookingType !== booking.loaiDatPhong;

            if (isGuestChange) {
                // ✅ GUEST CHANGE: Cộng thêm giá thay vì thay thế
                console.log(`🔄 Guest Change: ${booking.loaiDatPhong} → ${finalBookingType}`);

                const currentTotal = booking.thongTinGia.tongTienPhong;
                let additionalPrice = 0;

                if (booking.loaiDatPhong === 'theo_gio' && finalBookingType === 'qua_dem') {
                    // Theo giờ → Qua đêm: Cộng thêm giá đêm đầy đủ
                    additionalPrice = roomType.giaCa;

                    // Cập nhật checkout time
                    const newCheckOut = moment(booking.ngayNhanPhong).add(1, 'day').hour(12).minute(0);
                    updateData.ngayTraPhong = newCheckOut.toDate();
                    updateData.gioTraPhong = '12:00';

                } else if (booking.loaiDatPhong === 'qua_dem' && finalBookingType === 'dai_ngay') {
                    // Qua đêm → Dài ngày: Tính thêm ngày
                    const finalCheckOut = moment(newCheckOutDate || booking.ngayTraPhong);
                    const extraDays = finalCheckOut.diff(moment(booking.ngayTraPhong), 'days');
                    if (extraDays > 0) {
                        additionalPrice = roomType.giaCa * 1.1 * extraDays; // +10% cho dài ngày
                        updateData.ngayTraPhong = finalCheckOut.toDate();
                    }

                } else if (booking.loaiDatPhong === 'theo_gio' && finalBookingType === 'dai_ngay') {
                    // Theo giờ → Dài ngày: Cộng thêm giá dài ngày
                    const finalCheckOut = moment(newCheckOutDate);
                    const totalDays = finalCheckOut.diff(moment(booking.ngayNhanPhong), 'days');
                    additionalPrice = roomType.giaCa * 1.1 * totalDays;
                    updateData.ngayTraPhong = finalCheckOut.toDate();
                }

                // ✅ Cập nhật với phụ thu CỘNG THÊM
                const newTotal = currentTotal + additionalPrice;
                updateData['thongTinGia.tongTienPhong'] = newTotal;
                updateData['thongTinGia.tongDonDat'] = newTotal + (booking.thongTinGia.phiDichVu || 0);

                console.log(`💰 Guest Change: ${currentTotal}đ + ${additionalPrice}đ = ${newTotal}đ`);

            } else {
                // ✅ ADMIN UPDATE: Dùng logic gốc
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

                console.log(`💰 Admin Update: New total = ${newRoomTotal}đ`);
            }
        }

        // ✅ Các cập nhật khác (GIỮ NGUYÊN CODE GỐC)
        if (paymentMethod) updateData.phuongThucThanhToan = paymentMethod;
        if (reason) updateData.ghiChu = reason || "Khách sạn đã hủy đơn này!";

        // ✅ Xử lý dịch vụ bổ sung
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

        // ✅ Cập nhật booking trong database
        const updatedBooking = await Booking.findByIdAndUpdate(id, updateData, { new: true })
            .populate("maNguoiDung", "tenNguoiDung email soDienThoai")
            .populate("maLoaiPhong", "tenLoaiPhong giaCa")
            .populate("maKhachSan", "tenKhachSan");

        if (!updatedBooking) {
            return res.status(404).json({
                message: { msgBody: "Không tìm thấy đơn đặt phòng!", msgError: true }
            });
        }

        // ✅ Success messages (GIỮ NGUYÊN CODE GỐC)
        let successMessage = "✅ Cập nhật đơn đặt thành công!";

        if (status === 'da_nhan_phong' && updateData._checkInInfo) {
            const checkInInfo = updateData._checkInInfo;
            successMessage = `🏨 Nhận phòng thành công lúc ${checkInInfo.actualCheckInTime}!`;

            if (checkInInfo.earlyLateFee > 0) {
                successMessage += ` Phí nhận trễ: ${checkInInfo.earlyLateFee.toLocaleString('vi-VN')}đ.`;
            } else {
                successMessage += ` ${checkInInfo.checkInNote}.`;
            }
        } else if (status === 'da_tra_phong' && updateData._checkoutInfo) {
            const checkoutInfo = updateData._checkoutInfo;
            successMessage = `🚪 Checkout thành công ${checkoutInfo.totalRooms} phòng!`;

            if (checkoutInfo.totalLateFee > 0) {
                successMessage += ` Phí trả trễ: ${checkoutInfo.totalLateFee.toLocaleString('vi-VN')}đ.`;
            }

            successMessage += " Đã cập nhật trạng thái thanh toán.";
        } else if (recalculatePrice) {
            successMessage += ` Giá mới: ${updatedBooking.thongTinGia.tongDonDat.toLocaleString('vi-VN')}đ`;
        } else if (status === "da_huy") {
            successMessage = "🚫 Đã hủy đơn đặt phòng thành công!";
        }

        console.log(`✅ Final booking status: ${updatedBooking.trangThai}, payment: ${updatedBooking.trangThaiThanhToan}`);

        res.status(200).json({
            message: { msgBody: successMessage, msgError: false },
            updatedBooking: {
                bookingId: updatedBooking._id,
                status: updatedBooking.trangThai,
                paymentStatus: updatedBooking.trangThaiThanhToan,
                bookingType: updatedBooking.loaiDatPhong,
                services: updatedBooking.dichVuBoSung || [],
                servicesFee: updatedBooking.thongTinGia.phiDichVu || 0,
                totalAmount: updatedBooking.thongTinGia.tongDonDat || 0,
                priceDetails: updatedBooking.thongTinGia,
                reason: updatedBooking.ghiChu,
                // ✅ Thêm thông tin check-in nếu có
                ...(updateData._checkInInfo && {
                    checkInInfo: updateData._checkInInfo
                }),
                // ✅ Thêm thông tin checkout nếu có
                ...(updateData._checkoutInfo && {
                    checkoutInfo: updateData._checkoutInfo
                })
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
hotelBookingRouter.put("/hotelowner/assign-room/:bookingId", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { roomId, notes, guestInfo } = req.body;

        if (!roomId) {
            return res.status(400).json({
                message: { msgBody: "Room ID là bắt buộc!", msgError: true }
            });
        }

        console.log("🔄 Assigning room to booking:", bookingId);

        const booking = await Booking.findById(bookingId).populate('maLoaiPhong');
        if (!booking) {
            return res.status(404).json({
                message: { msgBody: "Không tìm thấy đơn đặt phòng!", msgError: true }
            });
        }

        const room = await Room.findById(roomId).populate('maLoaiPhong');
        if (!room) {
            return res.status(400).json({
                message: { msgBody: "Không tìm thấy phòng!", msgError: true }
            });
        }

        // ✅ SỬA: Kiểm tra phòng có đang trống không
        if (room.trangThaiPhong !== 'trong') {
            return res.status(400).json({
                message: {
                    msgBody: `Phòng ${room.soPhong} đang ${room.trangThaiPhong}, không thể gán!`,
                    msgError: true
                }
            });
        }

        // ✅ SỬA: Kiểm tra room type matching
        if (room.maLoaiPhong.toString() !== booking.maLoaiPhong.toString()) {
            return res.status(400).json({
                message: {
                    msgBody: `Phòng ${room.soPhong} không phải loại phòng ${booking.maLoaiPhong?.tenLoaiPhong}!`,
                    msgError: true
                }
            });
        }

        // Kiểm tra duplicate assignment
        const existingAssignment = await RoomBookingAssignment.findOne({
            maDatPhong: bookingId,
            maPhong: roomId,
            trangThaiHoatDong: true
        });

        if (existingAssignment) {
            return res.status(400).json({
                message: { msgBody: `Phòng ${room.soPhong} đã được gán cho đơn này!`, msgError: true }
            });
        }

        // Tìm hoặc tạo assignment
        let assignment = await RoomBookingAssignment.findOne({
            maDatPhong: bookingId,
            trangThaiGanPhong: "chua_gan",
            trangThaiHoatDong: true
        });

        if (!assignment) {
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

        // Cập nhật assignment info
        assignment.maPhong = roomId;
        assignment.trangThaiGanPhong = "da_gan";
        assignment.ghiChu = notes || `Đã gán phòng ${room.soPhong}`;
        assignment.thongTinKhachPhong.yeuCauDacBiet = guestInfo?.specialRequest || "";
        assignment.thongTinKhachPhong.tenKhachChinh = guestInfo?.guestMain || guestInfo?.tenKhachChinh || "";
        assignment.thongTinKhachPhong.soDienThoaiLienHe = guestInfo?.phoneContact || guestInfo?.soDienThoaiLienHe || "";

        // ✅ Auto time tracking
        const currentTime = moment().format('HH:mm');
        const currentDate = new Date();
        const currentMoment = moment();
        const bookingStartDate = moment(booking.ngayNhanPhong);
        const bookingEndDate = moment(booking.ngayTraPhong);

        let shouldTrackTime = false;
        let timeTrackingReason = '';

        switch (booking.loaiDatPhong) {
            case 'theo_gio':
                shouldTrackTime = currentMoment.isSame(bookingStartDate, 'day');
                timeTrackingReason = shouldTrackTime ? 'Đặt theo giờ - Đúng ngày' : `Đặt theo giờ - Không phải ngày ${bookingStartDate.format('DD/MM')}`;
                break;
            case 'qua_dem':
                shouldTrackTime = currentMoment.isBetween(bookingStartDate, bookingEndDate, 'day', '[]');
                timeTrackingReason = shouldTrackTime ? 'Đặt qua đêm - Trong thời gian ở' : `Đặt qua đêm - Ngoài thời gian ${bookingStartDate.format('DD/MM')}-${bookingEndDate.format('DD/MM')}`;
                break;
            case 'dai_ngay':
                shouldTrackTime = currentMoment.isBetween(bookingStartDate, bookingEndDate, 'day', '[]');
                timeTrackingReason = shouldTrackTime ? 'Đặt dài ngày - Trong thời gian ở' : `Đặt dài ngày - Ngoài thời gian ${bookingStartDate.format('DD/MM')}-${bookingEndDate.format('DD/MM')}`;
                break;
            default:
                shouldTrackTime = false;
                timeTrackingReason = 'Loại booking không xác định';
        }

        if (shouldTrackTime) {
            assignment.gioNhanPhongThucTe = currentTime;
            assignment.thoiGianCheckInThucTe = currentDate;

            const checkoutCalculation = calculateAdjustedCheckoutTime(booking, currentTime);
            assignment.gioTraPhongDuKien = checkoutCalculation.adjustedTime;
            assignment.ghiChu += `\n[${booking.loaiDatPhong}] ${checkoutCalculation.note}`;
        }

        await assignment.save();

        // ✅ SỬA: Cập nhật trạng thái phòng từ "trong" -> "da_dat"
        await Room.findByIdAndUpdate(roomId, {
            trangThaiPhong: "da_dat" // Phòng đã được đặt
        });

        console.log(`✅ Updated room ${room.soPhong} status: trong -> da_dat`);

        // Cập nhật booking status
        const totalAssignments = await RoomBookingAssignment.countDocuments({
            maDatPhong: bookingId,
            trangThaiGanPhong: "da_gan",
            trangThaiHoatDong: true
        });

        if (totalAssignments >= booking.soLuongPhong) {
            await Booking.findByIdAndUpdate(bookingId, {
                trangThai: "da_nhan_phong"
            });
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
                guestInfo: assignment.thongTinKhachPhong,
                timeTracking: {
                    bookingType: booking.loaiDatPhong,
                    plannedCheckIn: `${bookingStartDate.format('DD/MM/YYYY')} ${booking.gioNhanPhong}`,
                    actualCheckIn: assignment.gioNhanPhongThucTe ?
                        `${currentMoment.format('DD/MM/YYYY')} ${assignment.gioNhanPhongThucTe}` : null,
                    plannedCheckOut: `${bookingEndDate.format('DD/MM/YYYY')} ${booking.gioTraPhong || '12:00'}`,
                    adjustedCheckOut: assignment.gioTraPhongDuKien ?
                        `${bookingEndDate.format('DD/MM/YYYY')} ${assignment.gioTraPhongDuKien}` : null,
                    shouldTrack: shouldTrackTime,
                    reason: timeTrackingReason,
                    autoTracked: !!assignment.gioNhanPhongThucTe
                }
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
            message: { msgBody: "❌ Lỗi khi gán phòng!", msgError: true },
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
        let unit = "dem"; // ✅ SỬA: Sử dụng format phù hợp với schema

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
                unit = "gio"; // ✅ SỬA: Sử dụng "gio" thay vì "giờ"
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
                unit = "dem"; // ✅ GIỮ NGUYÊN: "dem"
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
                unit = "ngay"; // ✅ SỬA: Thử "ngay" thay vì "ngày"
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

        // ✅ **SỬA: Sử dụng enhanced pricing calculation**
        const pricingDetails = calculateEnhancedPricing({
            roomType,
            bookingType,
            checkInDate,
            checkOutDate,
            checkInTime,
            checkOutTime
        });

        console.log("💰 Enhanced pricing details:", pricingDetails);

        // ✅ **THÊM: Validation unit value trước khi lưu**
        const validUnits = ["gio", "dem", "ngay"];
        if (!validUnits.includes(pricingDetails.unit)) {
            console.error("❌ Invalid unit:", pricingDetails.unit);
            return res.status(400).json({
                msgBody: `Đơn vị không hợp lệ: ${pricingDetails.unit}. Chỉ chấp nhận: ${validUnits.join(', ')}`,
                msgError: true,
            });
        }

        // Tính tổng giá cho số lượng phòng
        const roomTotal = pricingDetails.finalPrice * roomQuantity;

        let finalCheckInTime = checkInTime;
        let finalCheckOutTime = checkOutTime;
        const now = moment().tz('Asia/Ho_Chi_Minh');

        if (bookingType === 'qua_dem') {
            finalCheckInTime = now.format('HH:mm');
            finalCheckOutTime = '12:00';
        } else if (bookingType === 'theo_gio') {
            finalCheckInTime = checkInTime;
            finalCheckOutTime = checkOutTime;
        } else {
            finalCheckInTime = now.format('HH:mm');
            finalCheckOutTime = null;
        }

        const newBooking = new Booking({
            maNguoiDung: guestUserId,
            maKhachSan,
            maLoaiPhong,
            cccd: cccd || "",
            loaiDatPhong: bookingType,
            soLuongPhong: roomQuantity,
            ngayNhanPhong: checkIn.toDate(),
            ngayTraPhong: checkOut.toDate(),
            gioNhanPhong: finalCheckInTime,
            gioTraPhong: finalCheckOutTime,
            trangThai: "da_xac_nhan",
            phuongThucThanhToan: paymentMethod || "tien_mat",
            trangThaiThanhToan: "chua_thanh_toan",
            ghiChu: notes || "",
            soDienThoai: phoneNumber || "",

            // ✅ **SỬA: Thông tin giá chi tiết từ enhanced pricing**
            thongTinGia: {
                donGia: Math.round(pricingDetails.basePrice), // ✅ Giá gốc/đơn vị
                soLuongDonVi: pricingDetails.duration,
                donVi: pricingDetails.unit,
                tongTienPhong: Math.round(pricingDetails.finalPrice * roomQuantity),
                phiDichVu: 0,
                thue: 0,
                giamGia: Math.round(pricingDetails.discounts.discountAmount * roomQuantity), // ✅ SỬA
                phuPhiGio: 0,
                phuPhiCuoiTuan: Math.round(pricingDetails.breakdown.taxPrice * roomQuantity),
                tongDonDat: Math.round(pricingDetails.finalPrice * roomQuantity),

                chiTietGia: {
                    basePrice: pricingDetails.basePrice,
                    subtotalBeforeDiscount: Math.round(pricingDetails.breakdown.subtotal), // ✅ SỬA: Dùng từ breakdown
                    duration: pricingDetails.duration,
                    unit: pricingDetails.unit,
                    multiplier: pricingDetails.multiplier,
                    discounts: {
                        weekend: pricingDetails.discounts.weekend,
                        longStay: pricingDetails.discounts.longStay,
                        discountPercent: pricingDetails.discounts.discountPercent,
                        discountAmount: pricingDetails.discounts.discountAmount
                    },
                    breakdown: {
                        baseRate: pricingDetails.basePrice,
                        duration: pricingDetails.duration,
                        subtotal: Math.round(pricingDetails.breakdown.subtotal), // ✅ SỬA
                        taxPrice: pricingDetails.breakdown.taxPrice,
                        discountAmount: pricingDetails.discounts.discountAmount,
                        multiplier: pricingDetails.multiplier,
                        total: pricingDetails.finalPrice,
                    }
                }
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
                duration: `${pricingDetails.duration} ${pricingDetails.unit}`,
                checkInTime: finalCheckInTime,
                checkOutTime: finalCheckOutTime,
                totalAmount: roomTotal,
                status: newBooking.trangThai,
                roomQuantity: roomQuantity,
                needsRoomAssignment: true,
                assignedRooms: [],

                // ✅ **THÊM: Chi tiết giá trong response**
                pricingDetails: {
                    basePrice: pricingDetails.basePrice,
                    unitPrice: pricingDetails.unitPrice,
                    finalPrice: pricingDetails.finalPrice,
                    totalPrice: roomTotal,

                    // Thông tin discount/surcharge
                    discounts: {
                        weekend: pricingDetails.discounts.weekend,
                        longStay: pricingDetails.discounts.longStay,
                        discountPercent: pricingDetails.discounts.discountPercent,
                        discountAmount: pricingDetails.discounts.discountAmount * roomQuantity
                    },

                    // Breakdown chi tiết
                    breakdown: {
                        baseRate: pricingDetails.breakdown.baseRate,
                        duration: pricingDetails.breakdown.duration,
                        subtotal: pricingDetails.breakdown.subtotal * roomQuantity,
                        weekendSurcharge: pricingDetails.breakdown.taxPrice * roomQuantity,
                        longStayDiscount: pricingDetails.breakdown.discountAmount * roomQuantity,
                        finalTotal: roomTotal
                    }
                }
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
    const { checkInDate, checkOutDate } = req.query;

    try {
        const rooms = await RoomType.find({ maKhachSan: hotelId });
        console.log(`🏨 Found ${rooms.length} room types in hotel ${hotelId}`);

        if (!rooms || rooms.length === 0) {
            return res.status(400).json({
                msgBody: "Không có phòng nào trong khách sạn này!",
                msgError: true
            });
        }

        // ✅ Tính số phòng trống cho mỗi loại phòng
        const result = await Promise.all(rooms.map(async (room) => {
            try {
                // ✅ Đếm tổng số phòng của loại này
                const totalRooms = await Room.countDocuments({
                    maLoaiPhong: room._id
                });

                // ✅ Đếm số phòng trống (đơn giản)
                const availableRooms = await Room.countDocuments({
                    maLoaiPhong: room._id,
                    trangThaiPhong: "trong"
                });

                console.log(`📊 ${room.tenLoaiPhong}: ${availableRooms}/${totalRooms} phòng trống`);

                // ✅ THÊM: Tính pricing cho tất cả booking types
                const basePrice = room.giaCa;

                // Time-bands pricing cho theo giờ
                const hourlyPrices = {};
                for (let hour = 1; hour <= 12; hour++) {
                    const hourlyRates = {
                        1: 0.25, 2: 0.35, 3: 0.45, 4: 0.55,
                        5: 0.65, 6: 0.70, 7: 0.75, 8: 0.80,
                    };
                    const rate = hourlyRates[hour] || Math.min(0.95, 0.80 + (hour - 8) * 0.03);
                    hourlyPrices[hour] = smartRound(basePrice * rate);
                }

                // Pricing cho các loại booking
                const nightPrice = smartRound(basePrice);
                const dayPrice = smartRound(basePrice * 1.10);
                const hourlyStartPrice = hourlyPrices[1];

                return {
                    roomId: room._id,
                    roomTypeName: room.tenLoaiPhong,
                    roomTypePrice: room.giaCa, // Giá gốc
                    roomTypeDescription: room.moTa,
                    roomcapacity: room.soLuongKhach,
                    availableRooms: availableRooms,
                    totalRooms: totalRooms,

                    // ✅ THÊM: Pricing info đã tính sẵn
                    pricing: {
                        basePrice: basePrice, // Giá gốc

                        // Giá hiển thị cho từng booking type
                        displayPrices: {
                            'theo_gio': {
                                price: hourlyStartPrice,
                                unit: 'giờ',
                                label: `${hourlyStartPrice.toLocaleString('vi-VN')}đ/giờ`,
                                note: 'Giá tăng dần theo thời gian'
                            },
                            'qua_dem': {
                                price: nightPrice,
                                unit: 'đêm',
                                label: `${nightPrice.toLocaleString('vi-VN')}đ/đêm`,
                                note: 'Giá chuẩn'
                            },
                            'dai_ngay': {
                                price: dayPrice,
                                unit: 'ngày',
                                label: `${dayPrice.toLocaleString('vi-VN')}đ/ngày`,
                                note: '+10% so với giá đêm'
                            }
                        },

                        // Chi tiết pricing cho từng booking type
                        detailedPricing: {
                            hourly: {
                                baseRate: hourlyStartPrice,
                                rates: hourlyPrices,
                                maxRate: smartRound(basePrice * 0.95),
                                description: 'Time-bands pricing: 25%-95% giá đêm'
                            },
                            overnight: {
                                rate: nightPrice,
                                percentage: 100,
                                description: '100% giá gốc'
                            },
                            longstay: {
                                rate: dayPrice,
                                percentage: 110,
                                description: '110% giá đêm'
                            }
                        },

                        // ✅ Thông tin bổ sung
                        occupancyRate: totalRooms > 0 ? Math.round(((totalRooms - availableRooms) / totalRooms) * 100) : 0,
                        isAvailable: availableRooms > 0,

                        // ✅ Range info cho frontend display
                        priceRanges: {
                            hourly: `${hourlyStartPrice.toLocaleString('vi-VN')}đ - ${smartRound(basePrice * 0.95).toLocaleString('vi-VN')}đ/giờ`,
                            overnight: `${nightPrice.toLocaleString('vi-VN')}đ/đêm`,
                            longstay: `${dayPrice.toLocaleString('vi-VN')}đ/ngày`
                        }
                    }
                };

            } catch (error) {
                console.error(`❌ Lỗi tính available rooms cho ${room.tenLoaiPhong}:`, error);
                return {
                    roomId: room._id,
                    roomTypeName: room.tenLoaiPhong,
                    roomTypePrice: room.giaCa,
                    roomTypeDescription: room.moTa,
                    roomcapacity: room.soLuongKhach,
                    availableRooms: 0,
                    totalRooms: 0,
                    pricing: {
                        basePrice: room.giaCa,
                        displayPrices: {
                            'theo_gio': { price: 0, unit: 'giờ', label: 'N/A', note: 'Lỗi tính giá' },
                            'qua_dem': { price: 0, unit: 'đêm', label: 'N/A', note: 'Lỗi tính giá' },
                            'dai_ngay': { price: 0, unit: 'ngày', label: 'N/A', note: 'Lỗi tính giá' }
                        },
                        occupancyRate: 100,
                        isAvailable: false
                    },
                    error: 'Lỗi khi tính toán'
                };
            }
        }));

        console.log(`✅ Returning ${result.length} room types with pricing data`);
        return res.status(200).json(result);

    } catch (error) {
        console.error("❌ Lỗi truy xuất phòng trong khách sạn:", error);
        return res.status(400).json({
            msgBody: "Lỗi truy xuất phòng trong khách sạn!",
            msgError: true,
            messageError: error.message
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

        if (!reason || reason.trim() === '') {
            return res.status(400).json({
                message: { msgBody: "Lý do đổi phòng là bắt buộc!", msgError: true }
            });
        }

        // ✅ Lấy assignment cũ với populate đầy đủ
        const oldAssignment = await RoomBookingAssignment.findById(assignmentId)
            .populate('maPhong', 'soPhong tang loaiView dienTich soLuongNguoiToiDa trangThaiPhong')
            .populate('maDatPhong');

        if (!oldAssignment) {
            return res.status(404).json({
                message: { msgBody: "Không tìm thấy phòng đã gán!", msgError: true }
            });
        }

        // ✅ Kiểm tra assignment có active không
        if (!oldAssignment.trangThaiHoatDong || oldAssignment.trangThaiGanPhong !== 'da_gan') {
            return res.status(400).json({
                message: { msgBody: "Assignment không trong trạng thái active!", msgError: true }
            });
        }

        // ✅ Kiểm tra phòng mới với populate đầy đủ
        const newRoom = await Room.findById(newRoomId)
            .populate('maLoaiPhong', 'tenLoaiPhong')
            .select('soPhong tang loaiView dienTich soLuongNguoiToiDa trangThaiPhong maLoaiPhong');

        if (!newRoom) {
            return res.status(400).json({
                message: { msgBody: "Không tìm thấy phòng mới!", msgError: true }
            });
        }

        // ✅ Kiểm tra room type matching
        const booking = oldAssignment.maDatPhong;
        if (newRoom.maLoaiPhong._id.toString() !== booking.maLoaiPhong.toString()) {
            return res.status(400).json({
                message: {
                    msgBody: `Phòng ${newRoom.soPhong} không cùng loại với booking!`,
                    msgError: true
                }
            });
        }

        // ✅ Kiểm tra phòng mới có trống không
        if (newRoom.trangThaiPhong !== 'trong') {
            return res.status(400).json({
                message: {
                    msgBody: `Phòng ${newRoom.soPhong} đang ${newRoom.trangThaiPhong}!`,
                    msgError: true
                }
            });
        }

        // ✅ Prevent transferring to same room
        if (oldAssignment.maPhong._id.toString() === newRoomId) {
            return res.status(400).json({
                message: { msgBody: "Không thể đổi sang chính phòng hiện tại!", msgError: true }
            });
        }

        console.log(`🔄 Transferring from room ${oldAssignment.maPhong.soPhong} to ${newRoom.soPhong}`);

        // ✅ BƯỚC 1: Deactivate assignment cũ (không xóa, để audit trail)
        const transferTime = new Date();
        oldAssignment.trangThaiHoatDong = false;
        oldAssignment.trangThaiGanPhong = 'huy_gan';
        oldAssignment.ghiChu += `\n[Transfer Out ${transferTime.toLocaleString('vi-VN')}] Chuyển sang phòng ${newRoom.soPhong} - Lý do: ${reason}`;
        await oldAssignment.save();

        // ✅ BƯỚC 2: Reset trạng thái phòng cũ về "trong"
        await Room.findByIdAndUpdate(oldAssignment.maPhong._id, {
            trangThaiPhong: "trong"
        });
        console.log(`🏠 Reset old room ${oldAssignment.maPhong.soPhong} to "trong"`);

        // ✅ BƯỚC 3: Tạo assignment MỚI cho phòng mới  
        const newAssignment = new RoomBookingAssignment({
            maDatPhong: oldAssignment.maDatPhong._id,
            maPhong: newRoomId,
            trangThaiGanPhong: "da_gan",

            // ✅ QUAN TRỌNG: Ghi nhận assignment cũ
            ganPhongTruocDo: oldAssignment._id,
            lyDoGanPhong: "thay_the",

            // ✅ Copy thông tin từ assignment cũ
            giaPhongGoc: oldAssignment.giaPhongGoc,
            giaPhongThucTe: oldAssignment.giaPhongThucTe,
            phuPhiNangCap: oldAssignment.phuPhiNangCap + transferFee,

            // ✅ Copy time tracking từ assignment cũ
            gioNhanPhongThucTe: oldAssignment.gioNhanPhongThucTe,
            thoiGianCheckInThucTe: oldAssignment.thoiGianCheckInThucTe,
            gioTraPhongDuKien: oldAssignment.gioTraPhongDuKien,

            // ✅ Copy guest info
            thongTinKhachPhong: { ...oldAssignment.thongTinKhachPhong },

            // ✅ Copy services đã sử dụng
            dichVuSuDung: [...oldAssignment.dichVuSuDung],

            // ✅ Ghi chú transfer
            ghiChu: `[Transfer In ${transferTime.toLocaleString('vi-VN')}] Chuyển từ phòng ${oldAssignment.maPhong.soPhong} - Lý do: ${reason}${transferFee > 0 ? ` - Phí: ${transferFee.toLocaleString('vi-VN')}đ` : ''}`,

            trangThaiHoatDong: true
        });

        await newAssignment.save();
        console.log(`✅ Created new assignment ${newAssignment._id} for room ${newRoom.soPhong}`);

        // ✅ BƯỚC 4: Cập nhật trạng thái phòng mới
        await Room.findByIdAndUpdate(newRoomId, {
            trangThaiPhong: "da_dat"
        });
        console.log(`🏠 Set new room ${newRoom.soPhong} to "da_dat"`);

        // ✅ BƯỚC 5: Cập nhật tổng tiền booking nếu có phí đổi phòng
        let updatedBooking = null;
        if (transferFee > 0) {
            updatedBooking = await Booking.findById(oldAssignment.maDatPhong._id);
            updatedBooking.thongTinGia.phuPhiNangCap = (updatedBooking.thongTinGia.phuPhiNangCap || 0) + transferFee;
            updatedBooking.thongTinGia.tongDonDat = updatedBooking.thongTinGia.tongTienPhong +
                updatedBooking.thongTinGia.phiDichVu +
                (updatedBooking.thongTinGia.phuPhiNangCap || 0) +
                (updatedBooking.thongTinGia.thue || 0) -
                (updatedBooking.thongTinGia.giamGia || 0);
            await updatedBooking.save();
            console.log(`💰 Added transfer fee ${transferFee}đ to booking total`);
        }

        // ✅ ENHANCED: Response structure phù hợp với frontend expectations
        res.status(200).json({
            message: {
                msgBody: `✅ Đổi phòng thành công từ ${oldAssignment.maPhong.soPhong} sang ${newRoom.soPhong}!`,
                msgError: false
            },
            transfer: {
                // ✅ OLD: Thông tin phòng cũ
                oldRoom: {
                    assignmentId: oldAssignment._id,
                    roomInfo: {
                        _id: oldAssignment.maPhong._id,
                        soPhong: oldAssignment.maPhong.soPhong,
                        tang: oldAssignment.maPhong.tang,
                        loaiView: oldAssignment.maPhong.loaiView
                    },
                    status: 'deactivated'
                },
                // ✅ NEW: Thông tin phòng mới (structure match frontend expectations)
                newRoom: {
                    assignmentId: newAssignment._id,
                    roomInfo: {
                        _id: newRoom._id,
                        soPhong: newRoom.soPhong,
                        tang: newRoom.tang,
                        loaiView: newRoom.loaiView,
                        dienTich: newRoom.dienTich,
                        soLuongNguoiToiDa: newRoom.soLuongNguoiToiDa,
                        trangThaiPhong: 'da_dat'
                    },
                    status: 'da_gan',
                    // ✅ Copy guest info to new assignment
                    guestInfo: oldAssignment.thongTinKhachPhong,
                    // ✅ Copy services to new assignment  
                    services: oldAssignment.dichVuSuDung || [],
                    serviceTotal: oldAssignment.dichVuSuDung?.reduce((total, service) =>
                        total + (service.thanhTien || 0), 0) || 0,
                    // ✅ Transfer details
                    transferHistory: [{
                        fromRoom: {
                            _id: oldAssignment.maPhong._id,
                            soPhong: oldAssignment.maPhong.soPhong,
                            tang: oldAssignment.maPhong.tang
                        },
                        toRoom: {
                            _id: newRoom._id,
                            soPhong: newRoom.soPhong,
                            tang: newRoom.tang
                        },
                        reason: reason,
                        transferFee: transferFee,
                        transferredAt: transferTime.toISOString()
                    }],
                    notes: `Đổi từ phòng ${oldAssignment.maPhong.soPhong} - ${reason}`
                }
            },
            // ✅ Additional data for frontend state update
            updatedAssignment: {
                assignmentId: newAssignment._id,
                roomInfo: {
                    _id: newRoom._id,
                    soPhong: newRoom.soPhong,
                    tang: newRoom.tang,
                    loaiView: newRoom.loaiView,
                    dienTich: newRoom.dienTich,
                    soLuongNguoiToiDa: newRoom.soLuongNguoiToiDa
                },
                status: 'da_gan',
                guestInfo: oldAssignment.thongTinKhachPhong,
                services: oldAssignment.dichVuSuDung || [],
                serviceTotal: oldAssignment.dichVuSuDung?.reduce((total, service) =>
                    total + (service.thanhTien || 0), 0) || 0,
                createdAt: transferTime.toISOString(),
                notes: `Đổi từ phòng ${oldAssignment.maPhong.soPhong} - ${reason}`
            },
            // ✅ Updated booking totals if transfer fee applied
            ...(transferFee > 0 && updatedBooking && {
                updatedBooking: {
                    totalAmount: updatedBooking.thongTinGia.tongDonDat,
                    transferFees: updatedBooking.thongTinGia.phuPhiNangCap,
                    priceDetails: updatedBooking.thongTinGia
                }
            }),
            // ✅ Audit trail
            auditTrail: {
                transferTime: transferTime.toISOString(),
                oldAssignmentId: oldAssignment._id,
                newAssignmentId: newAssignment._id,
                transferFee: transferFee,
                reason: reason,
                performedBy: req.user?.id // Assuming user info in req.user
            }
        });

    } catch (error) {
        console.error("❌ Lỗi đổi phòng:", error);
        res.status(500).json({
            message: { msgBody: "❌ Lỗi khi đổi phòng!", msgError: true },
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// API lấy lịch sử đổi phòng
hotelBookingRouter.get("/hotelowner/transfer-history/:bookingId", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { bookingId } = req.params;

        // ✅ Lấy tất cả assignments (cả active và inactive) để trace history
        const allAssignments = await RoomBookingAssignment.find({
            maDatPhong: bookingId
        })
            .populate('maPhong', 'soPhong tang loaiView')
            .populate('ganPhongTruocDo', 'maPhong')
            .sort({ createdAt: 1 });

        // ✅ Build transfer chain
        const transferHistory = allAssignments.map(assignment => ({
            assignmentId: assignment._id,
            roomInfo: assignment.maPhong ? {
                roomId: assignment.maPhong._id,
                soPhong: assignment.maPhong.soPhong,
                tang: assignment.maPhong.tang,
                loaiView: assignment.maPhong.loaiView
            } : null,
            status: assignment.trangThaiGanPhong,
            isActive: assignment.trangThaiHoatDong,
            transferredFrom: assignment.ganPhongTruocDo ? {
                assignmentId: assignment.ganPhongTruocDo._id,
                roomNumber: assignment.ganPhongTruocDo.maPhong?.soPhong
            } : null,
            reason: assignment.lyDoGanPhong,
            transferFee: assignment.phuPhiNangCap || 0,
            createdAt: assignment.createdAt,
            notes: assignment.ghiChu
        }));

        res.status(200).json({
            success: true,
            bookingId,
            transferHistory,
            totalTransfers: transferHistory.filter(h => h.transferredFrom).length
        });

    } catch (error) {
        console.error("Lỗi lấy lịch sử đổi phòng:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy lịch sử đổi phòng!",
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

hotelBookingRouter.post('/:hotelId/available-rooms-for-assignment', async (req, res) => {
    try {
        const { hotelId } = req.params;
        const {
            maLoaiPhong,
            checkInDate,
            checkOutDate,
            checkInTime,
            checkOutTime,
            bookingType,
            excludeBookingId
        } = req.body;

        console.log(`🔍 === SIMPLIFIED AVAILABLE ROOMS ===`);
        console.log(`🏨 Hotel: ${hotelId}, Room Type: ${maLoaiPhong}`);
        console.log(`📅 Request: ${checkInDate} ${checkInTime} → ${checkOutDate} ${checkOutTime} (${bookingType})`);

        // ✅ 1. Validate room type
        const roomType = await RoomType.findOne({
            _id: maLoaiPhong,
            maKhachSan: hotelId
        });

        if (!roomType) {
            return res.status(400).json({
                success: false,
                message: "Loại phòng không thuộc khách sạn này!"
            });
        }

        // ✅ 2. Get all empty rooms
        const allEmptyRooms = await Room.find({
            maLoaiPhong: maLoaiPhong,
            trangThaiPhong: "trong"
        });

        console.log(`🏠 Empty rooms found: ${allEmptyRooms.length}`);
        console.log(`   Rooms: ${allEmptyRooms.map(r => r.soPhong).join(', ')}`);

        if (allEmptyRooms.length === 0) {
            return res.json({
                success: true,
                availableRooms: [],
                totalRooms: 0,
                message: "Không có phòng trống"
            });
        }

        // ✅ 3. Get rooms that are ALREADY ASSIGNED and have time conflict
        const roomIds = allEmptyRooms.map(r => r._id);
        const conflictingAssignments = await RoomBookingAssignment.find({
            trangThaiHoatDong: true,
            trangThaiGanPhong: 'da_gan',
            maPhong: { $in: roomIds }
        }).populate({
            path: 'maDatPhong',
            select: 'ngayNhanPhong ngayTraPhong gioNhanPhong gioTraPhong loaiDatPhong _id trangThai'
        });

        console.log(`📋 Assignments to check: ${conflictingAssignments.length}`);

        // ✅ 4. Filter out rooms that are ACTUALLY assigned with time conflict
        const unavailableRoomIds = new Set();

        for (const assignment of conflictingAssignments) {
            const booking = assignment.maDatPhong;

            if (!booking || !assignment.maPhong) continue;

            // Skip excluded booking
            if (excludeBookingId && booking._id.toString() === excludeBookingId) {
                console.log(`⏭️ Skipping excluded booking assignment: ${excludeBookingId}`);
                continue;
            }

            // ✅ ONLY check ASSIGNED rooms for time conflict
            const hasOverlap = checkTimeOverlap({
                requestType: bookingType,
                requestStart: checkInDate,
                requestEnd: checkOutDate || checkInDate,
                requestStartTime: checkInTime,
                requestEndTime: checkOutTime,
                existingType: booking.loaiDatPhong,
                existingStart: booking.ngayNhanPhong,
                existingEnd: booking.ngayTraPhong,
                existingStartTime: booking.gioNhanPhong,
                existingEndTime: booking.gioTraPhong
            });

            if (hasOverlap) {
                unavailableRoomIds.add(assignment.maPhong.toString());
                console.log(`🚫 Room ${assignment.maPhong} unavailable (assigned + time overlap)`);
            } else {
                console.log(`✅ Room ${assignment.maPhong} available (assigned but no time overlap)`);
            }
        }

        // ✅ 5. SIMPLE LOGIC: Available = Empty - Assigned with conflict
        const availableRooms = allEmptyRooms.filter(room =>
            !unavailableRoomIds.has(room._id.toString())
        );

        console.log(`🟢 Available rooms: ${availableRooms.length}`);
        console.log(`   Available: ${availableRooms.map(r => r.soPhong).join(', ')}`);

        // ✅ 6. Format response with room details
        const formattedRooms = availableRooms.map(room => ({
            roomId: room._id,
            soPhong: room.soPhong,
            tang: room.tang || 1,
            loaiView: room.loaiView || 'none',
            dienTich: room.dienTich || 0,
            soLuongNguoiToiDa: room.soLuongNguoiToiDa || 2,
            soLuongGiuong: room.soLuongGiuong || 1,
            cauHinhGiuong: room.cauHinhGiuong || [],
            displayName: `Phòng ${room.soPhong} - Tầng ${room.tang || 1}${room.loaiView && room.loaiView !== 'none' ? ` (${getViewText(room.loaiView)})` : ''}`,
            features: [
                `${room.soLuongNguoiToiDa || 2} người`,
                `${room.soLuongGiuong || 1} giường`,
                room.dienTich ? `${room.dienTich}m²` : null,
                getViewText(room.loaiView)
            ].filter(Boolean)
        }));

        console.log(`🎯 FINAL RESULT: ${formattedRooms.length} available rooms`);
        console.log(`🔍 === END SIMPLIFIED LOGIC ===`);

        // ✅ 7. CLEAN RESPONSE
        res.json({
            success: true,
            availableRooms: formattedRooms,
            totalRooms: formattedRooms.length,
            summary: {
                totalEmptyRooms: allEmptyRooms.length,
                unavailableRooms: unavailableRoomIds.size,
                availableRooms: formattedRooms.length,
                message: formattedRooms.length > 0
                    ? `Có ${formattedRooms.length} phòng có thể gán`
                    : "Không có phòng trống phù hợp"
            },
            debug: {
                roomType: roomType.tenLoaiPhong,
                logic: "Simplified: Available = Empty - (Assigned with time conflict)",
                emptyRoomsCount: allEmptyRooms.length,
                assignedConflictCount: unavailableRoomIds.size,
                finalAvailableCount: formattedRooms.length
            }
        });

    } catch (error) {
        console.error('❌ Error in available rooms API:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách phòng trống',
            error: error.message
        });
    }
});
// Checkout với tính phí trả trễ
hotelBookingRouter.put("/hotelowner/checkout-room/:assignmentId", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { actualCheckOutTime, notes, confirmLateFee = false } = req.body;

        const assignment = await RoomBookingAssignment.findById(assignmentId)
            .populate('maPhong', 'soPhong')
            .populate({
                path: 'maDatPhong',
                select: 'ngayTraPhong gioTraPhong loaiDatPhong thongTinGia bookingId',
                populate: {
                    path: 'maLoaiPhong',
                    select: 'giaCa tenLoaiPhong'
                }
            });

        if (!assignment) {
            return res.status(404).json({
                message: { msgBody: "Không tìm thấy phòng đã gán!", msgError: true }
            });
        }

        const booking = assignment.maDatPhong;
        const currentTime = actualCheckOutTime || moment().format('HH:mm');
        const currentDate = new Date();

        // Tính toán late fee
        const lateFeeCalculation = calculateLateFee(booking, assignment, currentTime);

        // Cập nhật assignment
        assignment.gioTraPhongThucTe = currentTime;
        assignment.thoiGianCheckOutThucTe = currentDate;
        assignment.trangThaiGanPhong = "da_tra_phong";

        // Thêm phí trả trễ nếu có và được confirm
        if (lateFeeCalculation.lateFee > 0) {
            if (confirmLateFee) {
                const lateFeeService = {
                    tenDichVu: `Phí trả trễ (${lateFeeCalculation.lateMinutes} phút)`,
                    soLuong: 1,
                    donGia: lateFeeCalculation.lateFee,
                    thanhTien: lateFeeCalculation.lateFee,
                    thoiGianSuDung: new Date(),
                    loaiDichVu: 'phi_tra_tre'
                };

                assignment.dichVuSuDung.push(lateFeeService);
                assignment.phuPhiNangCap += lateFeeCalculation.lateFee;

                // Cập nhật tổng tiền trong booking
                await updateBookingTotalWithLateFee(booking._id, lateFeeCalculation.lateFee);

                console.log(`💰 Added late fee: ${lateFeeCalculation.lateFee} VND for ${lateFeeCalculation.lateMinutes} minutes`);
            } else {
                assignment.ghiChu += `\nTrả trễ: ${lateFeeCalculation.lateMinutes} phút - Phí: ${lateFeeCalculation.lateFee.toLocaleString('vi-VN')}đ (Chưa áp dụng)`;
            }
        }

        if (notes) {
            assignment.ghiChu += `\n[Checkout] ${notes}`;
        }

        assignment.ghiChu += `\n${lateFeeCalculation.status}`;

        // ✅ Cập nhật trạng thái phòng về "trong"
        await Room.findByIdAndUpdate(assignment.maPhong._id, {
            trangThaiPhong: "trong"
        });

        await assignment.save();

        // ✅ Kiểm tra nếu tất cả phòng đã checkout -> cập nhật booking
        const remainingActiveAssignments = await RoomBookingAssignment.countDocuments({
            maDatPhong: booking._id,
            trangThaiHoatDong: true,
            trangThaiGanPhong: { $in: ['da_gan', 'dang_su_dung'] }
        });

        if (remainingActiveAssignments === 0) {
            // Tất cả phòng đã checkout -> cập nhật booking status và payment
            await Booking.findByIdAndUpdate(booking._id, {
                trangThai: 'da_tra_phong',
                trangThaiThanhToan: 'da_thanh_toan'
            });
            console.log(`✅ All rooms checked out - Updated booking ${booking.bookingId} to completed & paid`);
        }

        res.status(200).json({
            message: {
                msgBody: `✅ Checkout phòng ${assignment.maPhong.soPhong} thành công!`,
                msgError: false
            },
            checkout: {
                assignmentId: assignment._id,
                roomNumber: assignment.maPhong.soPhong,
                plannedCheckOut: lateFeeCalculation.plannedCheckOut,
                actualCheckOut: lateFeeCalculation.actualCheckOut,
                timeDifference: lateFeeCalculation.lateMinutes,
                status: lateFeeCalculation.status,
                lateFee: {
                    amount: lateFeeCalculation.lateFee,
                    applied: confirmLateFee && lateFeeCalculation.lateFee > 0,
                    calculation: lateFeeCalculation.calculation
                },
                isLate: lateFeeCalculation.isLate,
                isEarly: lateFeeCalculation.isEarly,
                requiresConfirmation: lateFeeCalculation.lateFee > 0 && !confirmLateFee,
                bookingCompleted: remainingActiveAssignments === 0
            }
        });

    } catch (error) {
        console.error("Lỗi checkout:", error);
        res.status(500).json({
            message: { msgBody: "❌ Lỗi khi checkout!", msgError: true },
            error: error.message
        });
    }
});

//Xóa room khỏi booking
hotelBookingRouter.delete("/hotelowner/unassign-room/:assignmentId", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { reason } = req.body;

        const assignment = await RoomBookingAssignment.findById(assignmentId)
            .populate('maPhong', 'soPhong')
            .populate('maDatPhong', 'bookingId soLuongPhong');

        if (!assignment) {
            return res.status(404).json({
                message: { msgBody: "Không tìm thấy phòng đã gán!", msgError: true }
            });
        }

        const roomNumber = assignment.maPhong?.soPhong;
        const bookingId = assignment.maDatPhong?.bookingId;

        // ✅ Kiểm tra không được xóa nếu khách đang ở
        if (assignment.trangThaiGanPhong === 'dang_su_dung') {
            return res.status(400).json({
                message: {
                    msgBody: `Không thể hủy gán phòng ${roomNumber} - Khách đang sử dụng!`,
                    msgError: true
                }
            });
        }

        // ✅ Đặt lại trạng thái phòng về "trong"
        if (assignment.maPhong) {
            await Room.findByIdAndUpdate(assignment.maPhong._id, {
                trangThaiPhong: "trong"
            });
            console.log(`✅ Reset room ${roomNumber} status: da_dat -> trong`);
        }

        // ✅ Xóa assignment (soft delete)
        assignment.trangThaiHoatDong = false;
        assignment.ghiChu += `\n[Hủy gán ${new Date().toLocaleString('vi-VN')}] ${reason || 'Hủy gán phòng'}`;
        await assignment.save();

        // ✅ Cập nhật lại trạng thái booking nếu cần
        const remainingAssignments = await RoomBookingAssignment.countDocuments({
            maDatPhong: assignment.maDatPhong._id,
            trangThaiGanPhong: "da_gan",
            trangThaiHoatDong: true
        });

        if (remainingAssignments === 0) {
            // Nếu không còn phòng nào được gán, về lại trạng thái "da_xac_nhan"
            await Booking.findByIdAndUpdate(assignment.maDatPhong._id, {
                trangThai: "da_xac_nhan"
            });
            console.log(`📝 Updated booking ${bookingId} status: da_nhan_phong -> da_xac_nhan`);
        }

        res.status(200).json({
            message: {
                msgBody: `✅ Đã hủy gán phòng ${roomNumber} khỏi đơn #${bookingId}`,
                msgError: false
            },
            result: {
                unassignedRoom: roomNumber,
                bookingId,
                remainingAssignments,
                totalNeeded: assignment.maDatPhong?.soLuongPhong || 0
            }
        });

    } catch (error) {
        console.error("Lỗi hủy gán phòng:", error);
        res.status(500).json({
            message: { msgBody: "❌ Lỗi khi hủy gán phòng!", msgError: true },
            error: error.message
        });
    }
});

hotelBookingRouter.post("/hotelowner/pricing-preview/:bookingId", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { newBookingType, newCheckInDate, newCheckOutDate, newCheckInTime, newCheckOutTime } = req.body;

        const booking = await Booking.findById(bookingId).populate('maLoaiPhong');
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        const currentTotal = booking.thongTinGia?.tongTienPhong || 0;
        const basePrice = booking.maLoaiPhong.giaCa;
        const roomQuantity = booking.soLuongPhong || 1;

        // ✅ Kiểm tra guest change vs admin update
        const isGuestCurrentlyStaying = ['da_nhan_phong', 'dang_su_dung'].includes(booking.trangThai);

        let pricingPreview = {};

        if (isGuestCurrentlyStaying) {
            // ✅ GUEST CHANGE: Logic cộng thêm ĐÚNG
            let additionalPrice = 0;
            let changeDescription = '';
            let calculationDetails = {};

            if (booking.loaiDatPhong === 'theo_gio' && newBookingType === 'qua_dem') {
                // ✅ THEO GIỜ → QUA ĐÊM: Cộng thêm giá đêm đầy đủ
                additionalPrice = smartRound(basePrice * roomQuantity);
                changeDescription = `Đổi từ theo giờ sang qua đêm - Cộng thêm`;

                calculationDetails = {
                    currentHourlyPrice: currentTotal,
                    additionalNightPrice: additionalPrice,
                    formula: `${currentTotal.toLocaleString('vi-VN')}đ (giờ) + ${additionalPrice.toLocaleString('vi-VN')}đ (đêm) = ${(currentTotal + additionalPrice).toLocaleString('vi-VN')}đ`,
                    explanation: "Khách đã trả giá theo giờ, giờ cộng thêm giá qua đêm đầy đủ"
                };

            } else if (booking.loaiDatPhong === 'qua_dem' && newBookingType === 'dai_ngay') {
                // ✅ QUA ĐÊM → DÀI NGÀY: Cộng thêm ngày thêm
                const checkIn = moment(newCheckInDate || booking.ngayNhanPhong);
                const checkOut = moment(newCheckOutDate || booking.ngayTraPhong);
                const totalDays = Math.max(1, checkOut.diff(checkIn, 'days'));
                const extraDays = totalDays - 1; // Đã trả 1 đêm

                if (extraDays > 0) {
                    const dayPrice = smartRound(basePrice * 1.10);
                    additionalPrice = smartRound(dayPrice * extraDays * roomQuantity);
                    changeDescription = `Gia hạn thêm ${extraDays} ngày`;

                    calculationDetails = {
                        currentNightPrice: currentTotal,
                        extraDays: extraDays,
                        dayPrice: dayPrice,
                        additionalPrice: additionalPrice,
                        formula: `${currentTotal.toLocaleString('vi-VN')}đ (đêm) + ${extraDays} ngày x ${dayPrice.toLocaleString('vi-VN')}đ = ${(currentTotal + additionalPrice).toLocaleString('vi-VN')}đ`,
                        explanation: `Khách đã trả 1 đêm, giờ gia hạn thêm ${extraDays} ngày`
                    };
                }

            } else if (booking.loaiDatPhong === 'theo_gio' && newBookingType === 'dai_ngay') {
                // ✅ THEO GIỜ → DÀI NGÀY: Cộng thêm giá dài ngày đầy đủ
                const checkIn = moment(newCheckInDate || booking.ngayNhanPhong);
                const checkOut = moment(newCheckOutDate);
                const totalDays = Math.max(2, checkOut.diff(checkIn, 'days'));

                const dayPrice = smartRound(basePrice * 1.10);
                additionalPrice = smartRound(dayPrice * totalDays * roomQuantity);
                changeDescription = `Đổi từ theo giờ sang dài ngày (${totalDays} ngày) - Cộng thêm`;

                calculationDetails = {
                    currentHourlyPrice: currentTotal,
                    totalDays: totalDays,
                    dayPrice: dayPrice,
                    additionalPrice: additionalPrice,
                    formula: `${currentTotal.toLocaleString('vi-VN')}đ (giờ) + ${totalDays} ngày x ${dayPrice.toLocaleString('vi-VN')}đ = ${(currentTotal + additionalPrice).toLocaleString('vi-VN')}đ`,
                    explanation: `Khách đã trả giá theo giờ, giờ cộng thêm ${totalDays} ngày dài ngày`
                };
            }

            pricingPreview = {
                changeType: 'guest_change',
                isGuestChange: true,
                oldTotal: currentTotal,
                additionalPrice: additionalPrice,
                newTotal: currentTotal + additionalPrice, // ✅ CỘNG THÊM
                difference: additionalPrice,
                changeDescription: changeDescription,
                needsPayment: additionalPrice > 0,
                refundAmount: 0, // Guest change không hoàn tiền
                calculationDetails: calculationDetails,

                // ✅ THÊM: Display info cho frontend
                displayInfo: {
                    oldBookingType: booking.loaiDatPhong,
                    newBookingType: newBookingType,
                    oldBookingTypeText: getBookingTypeText(booking.loaiDatPhong),
                    newBookingTypeText: getBookingTypeText(newBookingType),
                    isAdditive: true, // ✅ Đánh dấu là cộng thêm
                    paymentRequired: additionalPrice > 0
                }
            };

        } else {
            // ✅ ADMIN UPDATE: Tính lại toàn bộ bằng enhanced pricing
            const enhancedPricing = calculateEnhancedPricing({
                roomType: booking.maLoaiPhong,
                bookingType: newBookingType,
                checkInDate: newCheckInDate || moment(booking.ngayNhanPhong).format('YYYY-MM-DD'),
                checkOutDate: newBookingType !== 'theo_gio' ? (newCheckOutDate || moment(booking.ngayTraPhong).format('YYYY-MM-DD')) : null,
                checkInTime: newCheckInTime || booking.gioNhanPhong,
                checkOutTime: newCheckOutTime || booking.gioTraPhong
            });

            const newTotal = smartRound(enhancedPricing.finalPrice * roomQuantity);

            pricingPreview = {
                changeType: 'admin_update',
                isGuestChange: false,
                oldTotal: currentTotal,
                newTotal: newTotal,
                difference: newTotal - currentTotal,
                duration: enhancedPricing.duration,
                unit: enhancedPricing.unit,
                unitPrice: enhancedPricing.unitPrice,
                enhancedPricing: enhancedPricing,

                displayInfo: {
                    oldBookingType: booking.loaiDatPhong,
                    newBookingType: newBookingType,
                    oldBookingTypeText: getBookingTypeText(booking.loaiDatPhong),
                    newBookingTypeText: getBookingTypeText(newBookingType),
                    isAdditive: false, // ✅ Admin update là thay thế
                    paymentRequired: newTotal > currentTotal
                }
            };
        }

        console.log(`💰 Pricing preview calculated:`, pricingPreview);

        res.status(200).json({
            success: true,
            pricingPreview: pricingPreview
        });

    } catch (error) {
        console.error("Error calculating pricing preview:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi tính preview giá",
            error: error.message
        });
    }
});


// ==========================Hepper xử lý===================================== 


// function calculateEnhancedPricing({
//     roomType, bookingType, checkInDate, checkOutDate, checkInTime, checkOutTime
// }) {
//     let basePrice = roomType.giaCa;
//     let duration = 1;
//     let unit = "dem";
//     let multiplier = 1;
//     let priceDiscountPercent = 0;
//     let taxPrice = 0;

//     // ⏰ TÍNH KHOẢNG THỜI GIAN VÀ GIÁ CƠ BẢN
//     if (bookingType === "theo_gio") {
//         const startTime = moment(`${checkInDate} ${checkInTime}`, "YYYY-MM-DD HH:mm");
//         let endTime = moment(`${checkInDate} ${checkOutTime}`, "YYYY-MM-DD HH:mm");

//         if (endTime.isSameOrBefore(startTime)) {
//             endTime.add(1, "day");
//         }

//         duration = Math.ceil(endTime.diff(startTime, "hours", true));
//         unit = "gio";

//         // ✅ SỬA: Time-bands pricing thay vì chia 14
//         const hourlyRates = {
//             1: 0.25, 2: 0.35, 3: 0.45, 4: 0.55,
//             5: 0.65, 6: 0.70, 7: 0.75, 8: 0.80,
//         };
//         const rate = hourlyRates[duration] || Math.min(0.95, 0.80 + (duration - 8) * 0.03);
//         basePrice = roomType.giaCa * rate;

//     } else if (checkOutDate) {
//         duration = moment(checkOutDate).diff(moment(checkInDate), "days");

//         if (bookingType === "qua_dem") {
//             unit = "dem";
//             basePrice = roomType.giaCa * duration; // 100%
//         } else { // dai_ngay
//             unit = "ngay";
//             // ✅ SỬA: Giá ngày = 110% giá đêm
//             basePrice = roomType.giaCa * 1.10 * duration;
//         }
//     }

//     // 🔼 PHỤ THU CUỐI TUẦN
//     const weekendMultiplier = isWeekend(checkInDate) ? 1.2 : 1;
//     if (weekendMultiplier > 1) {
//         taxPrice = basePrice * (weekendMultiplier - 1);
//     }

//     // 🔽 GIẢM GIÁ DÀI NGÀY
//     let longStayMultiplier = 1;
//     if (bookingType === 'dai_ngay') {
//         if (duration >= 7) {
//             longStayMultiplier = 0.85;
//             priceDiscountPercent = 15;
//         } else if (duration >= 5) {
//             longStayMultiplier = 0.90;
//             priceDiscountPercent = 10;
//         } else if (duration >= 3) {
//             longStayMultiplier = 0.95;
//             priceDiscountPercent = 5;
//         }
//     }

//     multiplier = weekendMultiplier * longStayMultiplier;

//     // 💰 TÍNH GIÁ CUỐI CÙNG với SMART ROUNDING
//     const finalPriceRaw = basePrice * multiplier;
//     const discountAmount = basePrice * (1 - longStayMultiplier);

//     const finalPrice = smartRound(finalPriceRaw);
//     const smartTaxPrice = smartRound(taxPrice);
//     const smartDiscountAmount = smartRound(discountAmount);

//     return {
//         basePrice: roomType.giaCa,
//         unitPrice: smartRound(basePrice / duration),
//         finalPrice,
//         duration,
//         unit,
//         multiplier,
//         discounts: {
//             weekend: isWeekend(checkInDate),
//             longStay: bookingType === 'dai_ngay' && duration >= 3,
//             discountPercent: priceDiscountPercent,
//             discountAmount: smartDiscountAmount
//         },
//         breakdown: {
//             baseRate: roomType.giaCa,
//             duration: duration,
//             subtotal: smartRound(basePrice),
//             discountPercent: priceDiscountPercent,
//             taxPrice: smartTaxPrice,
//             discountAmount: smartDiscountAmount,
//             multiplier: multiplier,
//             total: finalPrice,
//         },
//     };
// }




// ✅ SỬA: Hàm calculateEnhancedPricing để xử lý edge cases

// ✅ SỬA HÀM calculateEnhancedPricing() TRONG hotelController.js

function calculateEnhancedPricing({
    roomType, bookingType, checkInDate, checkOutDate, checkInTime, checkOutTime
}) {
    let basePrice = roomType.giaCa;         // ✅ Giá cơ bản của 1 đơn vị
    let duration = 1;                        // ✅ Khoảng thời gian sử dụng phòng
    let unit = "dem";                        // ✅ Đơn vị thời gian
    let multiplier = 1;                     // ✅ Hệ số nhân tổng hợp
    let priceDiscountPercent = 0;           // ✅ Phần trăm giảm giá
    let taxPrice = 0;                        // ✅ Giá phụ thu

    console.log('🔍 calculateEnhancedPricing INPUT:', {
        roomTypeBasePrice: basePrice,
        bookingType,
        checkInDate,
        checkOutDate,
        checkInTime,
        checkOutTime
    });

    // ⏰ TÍNH KHOẢNG THỜI GIAN VÀ GIÁ CƠ BẢN
    if (bookingType === "theo_gio") {
        const startTime = moment(`${checkInDate} ${checkInTime}`, "YYYY-MM-DD HH:mm");
        let endTime = moment(`${checkInDate} ${checkOutTime}`, "YYYY-MM-DD HH:mm");

        // Nếu checkoutTime trước checkinTime thì chuyển sang ngày hôm sau
        if (endTime.isSameOrBefore(startTime)) {
            endTime.add(1, "day");
        }

        duration = Math.ceil(endTime.diff(startTime, "hours", true));
        unit = "gio";

        console.log('⏰ Hourly calculation:', {
            startTime: startTime.format('YYYY-MM-DD HH:mm'),
            endTime: endTime.format('YYYY-MM-DD HH:mm'),
            duration: duration,
            unit: unit
        });

        // ✅ Time-bands pricing
        const hourlyRates = {
            1: 0.25,    // 1 giờ = 25% giá đêm
            2: 0.35,    // 2 giờ = 35% giá đêm  
            3: 0.45,    // 3 giờ = 45% giá đêm
            4: 0.55,    // 4 giờ = 55% giá đêm
            5: 0.65,    // 5 giờ = 65% giá đêm
            6: 0.70,    // 6 giờ = 70% giá đêm
            7: 0.75,    // 7 giờ = 75% giá đêm
            8: 0.80     // 8 giờ = 80% giá đêm
        };

        const rate = hourlyRates[duration] || Math.min(0.95, 0.80 + (duration - 8) * 0.03);
        basePrice = roomType.giaCa * rate; // ✅ Áp dụng rate

        console.log('💰 Hourly pricing calculation:', {
            originalPrice: roomType.giaCa,
            rate: rate,
            calculatedBasePrice: basePrice
        });

    } else if (checkOutDate) {
        duration = moment(checkOutDate).diff(moment(checkInDate), "days");

        if (bookingType === "qua_dem") {
            unit = "dem";
            basePrice = roomType.giaCa; // ✅ 100% giá gốc, không nhân duration ở đây
            console.log('💰 Overnight pricing:', {
                originalPrice: roomType.giaCa,
                duration: duration,
                basePrice: basePrice
            });
        } else { // dai_ngay
            unit = "ngay";
            // ✅ Giá ngày = 110% giá đêm
            basePrice = roomType.giaCa * 1.10;
            console.log('💰 Long-stay pricing:', {
                originalPrice: roomType.giaCa,
                multiplier: 1.10,
                basePrice: basePrice,
                duration: duration
            });
        }
    }

    // 🔼 PHỤ THU CUỐI TUẦN
    const weekendMultiplier = isWeekend(checkInDate) ? 1.2 : 1;
    if (weekendMultiplier > 1) {
        taxPrice = basePrice * (weekendMultiplier - 1); // Phụ thu = phần tăng
    }

    console.log('📅 Weekend check:', {
        checkInDate,
        isWeekend: isWeekend(checkInDate),
        weekendMultiplier,
        taxPrice
    });

    // 🔽 GIẢM GIÁ DÀI NGÀY
    let longStayMultiplier = 1;
    if (bookingType === 'dai_ngay') {
        if (duration >= 7) {
            longStayMultiplier = 0.85; // Giảm 15%
            priceDiscountPercent = 15;
        } else if (duration >= 5) {
            longStayMultiplier = 0.90; // Giảm 10%
            priceDiscountPercent = 10;
        } else if (duration >= 3) {
            longStayMultiplier = 0.95; // Giảm 5%
            priceDiscountPercent = 5;
        }
    }

    console.log('🔽 Long-stay discount:', {
        bookingType,
        duration,
        longStayMultiplier,
        priceDiscountPercent
    });

    // ✅ Tổng hệ số nhân cuối cùng
    multiplier = weekendMultiplier * longStayMultiplier;

    // 💰 TÍNH GIÁ CUỐI CÙNG
    // ✅ CHÚ Ý: Với booking theo giờ và qua đêm, basePrice đã là giá cho toàn bộ thời gian
    // ✅ Chỉ với dài ngày mới cần nhân duration
    let finalPriceRaw;
    if (bookingType === "dai_ngay") {
        finalPriceRaw = basePrice * duration * multiplier;
    } else {
        // theo_gio và qua_dem: basePrice đã tính sẵn cho duration
        finalPriceRaw = basePrice * multiplier;
    }

    const discountAmount = basePrice * (1 - longStayMultiplier);
    const finalPrice = smartRound(finalPriceRaw);
    const smartTaxPrice = smartRound(taxPrice);
    const smartDiscountAmount = smartRound(discountAmount);

    console.log('💰 FINAL CALCULATION:', {
        basePrice,
        duration,
        multiplier,
        finalPriceRaw,
        finalPrice,
        smartTaxPrice,
        smartDiscountAmount
    });

    // 🧾 TRẢ VỀ KẾT QUẢ
    const result = {
        basePrice: roomType.giaCa, // Giá gốc của room type
        unitPrice: smartRound(finalPriceRaw), // Giá cho toàn bộ thời gian
        finalPrice: finalPrice, // Tổng giá cuối cùng
        duration,
        unit,
        multiplier,
        discounts: {
            weekend: isWeekend(checkInDate),
            longStay: bookingType === 'dai_ngay' && duration >= 3,
            discountPercent: priceDiscountPercent,
            discountAmount: smartDiscountAmount
        },
        breakdown: {
            baseRate: roomType.giaCa,
            duration: duration,
            subtotal: smartRound(basePrice * (bookingType === "dai_ngay" ? duration : 1)),
            discountPercent: priceDiscountPercent,
            taxPrice: smartTaxPrice,
            discountAmount: smartDiscountAmount,
            multiplier: multiplier,
            total: finalPrice,
        },
    };

    console.log('✅ calculateEnhancedPricing RESULT:', result);
    return result;
}

// ✅ Helper function tạo pricing mặc định khi có lỗi
function createDefaultPricing(basePrice = 1000000) {
    const safeBasePrice = basePrice && basePrice > 0 ? basePrice : 1000000;

    return {
        basePrice: safeBasePrice,
        unitPrice: safeBasePrice,
        finalPrice: safeBasePrice,
        duration: 1,
        unit: "dem",
        multiplier: 1,
        discounts: {
            weekend: false,
            longStay: false,
            discountPercent: 0,
            discountAmount: 0
        },
        breakdown: {
            baseRate: safeBasePrice,
            duration: 1,
            subtotal: safeBasePrice,
            discountPercent: 0,
            taxPrice: 0,
            discountAmount: 0,
            multiplier: 1,
            total: safeBasePrice,
        },
        error: 'Fallback pricing used due to calculation error'
    };
}



// ✅ THÊM: Smart rounding function
function smartRound(amount) {
    if (amount <= 0) return 0;

    // ✅ Làm tròn về hàng chục nghìn cho số lớn
    if (amount >= 100000) {
        return Math.round(amount / 10000) * 10000; // Làm tròn về hàng chục nghìn
    } else if (amount >= 10000) {
        return Math.round(amount / 1000) * 1000;   // Làm tròn về hàng nghìn
    } else {
        return Math.round(amount / 100) * 100;     // Làm tròn về hàng trăm
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const isWeekend = (date) => {
    const dayOfWeek = moment(date).day();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
};


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

// ✅ SỬA Helper function kiểm tra phòng available với đúng field names
function checkTimeOverlap({
    requestType, requestStart, requestEnd, requestStartTime, requestEndTime,
    existingType, existingStart, existingEnd, existingStartTime, existingEndTime
}) {
    try {
        // Convert to moment objects for comparison
        const moment = require('moment');

        // Parse request time range
        const reqStart = moment(`${requestStart} ${requestStartTime}`, 'YYYY-MM-DD HH:mm');
        const reqEnd = requestEnd
            ? moment(`${requestEnd} ${requestEndTime}`, 'YYYY-MM-DD HH:mm')
            : reqStart.clone().add(1, 'day').hour(12).minute(0); // Default checkout next day 12:00

        // Parse existing time range  
        const existStart = moment(existingStart).hour(moment(existingStartTime, 'HH:mm').hour()).minute(moment(existingStartTime, 'HH:mm').minute());
        const existEnd = moment(existingEnd).hour(moment(existingEndTime, 'HH:mm').hour()).minute(moment(existingEndTime, 'HH:mm').minute());

        // Check overlap: (start1 < end2) && (start2 < end1)
        const hasOverlap = reqStart.isBefore(existEnd) && existStart.isBefore(reqEnd);

        return hasOverlap;
    } catch (error) {
        console.error('Error in checkTimeOverlap:', error);
        return true; // Default to conflict to be safe
    }
}

// ✅ Helper function get view text
const getViewText = (viewType) => {
    const viewTexts = {
        'sea_view': 'View biển',
        'city_view': 'View thành phố',
        'garden_view': 'View vườn',
        'mountain_view': 'View núi',
        'pool_view': 'View hồ bơi',
        'none': ''
    };
    return viewTexts[viewType] || '';
};

// ✅ HELPER: Calculate adjusted checkout time
function calculateAdjustedCheckoutTime(booking, actualCheckInTime) {
    const plannedCheckIn = moment(`${moment(booking.ngayNhanPhong).format('YYYY-MM-DD')} ${booking.gioNhanPhong}`, 'YYYY-MM-DD HH:mm');
    const actualCheckIn = moment(`${moment(booking.ngayNhanPhong).format('YYYY-MM-DD')} ${actualCheckInTime}`, 'YYYY-MM-DD HH:mm');
    const timeDiff = actualCheckIn.diff(plannedCheckIn, 'minutes');

    let adjustedTime = booking.gioTraPhong || '12:00';
    let note = '';

    if (booking.loaiDatPhong === 'theo_gio') {
        // Theo giờ: Luôn giữ đúng duration
        const plannedCheckOut = moment(`${moment(booking.ngayTraPhong).format('YYYY-MM-DD')} ${booking.gioTraPhong}`, 'YYYY-MM-DD HH:mm');
        const adjustedCheckOut = plannedCheckOut.add(timeDiff, 'minutes');
        adjustedTime = adjustedCheckOut.format('HH:mm');

        if (timeDiff < 0) {
            note = `Nhận sớm ${Math.abs(timeDiff)} phút → Trả sớm ${Math.abs(timeDiff)} phút`;
        } else if (timeDiff > 0) {
            note = `Nhận trễ ${timeDiff} phút → Trả trễ ${timeDiff} phút`;
        } else {
            note = 'Nhận đúng giờ → Trả đúng giờ';
        }
    } else {
        // Qua đêm/dài ngày: Chỉ điều chỉnh nếu nhận sớm
        if (timeDiff < 0) {
            const plannedCheckOut = moment(`${moment(booking.ngayTraPhong).format('YYYY-MM-DD')} ${booking.gioTraPhong || '12:00'}`, 'YYYY-MM-DD HH:mm');
            const adjustedCheckOut = plannedCheckOut.add(timeDiff, 'minutes');
            adjustedTime = adjustedCheckOut.format('HH:mm');
            note = `Nhận sớm ${Math.abs(timeDiff)} phút → Trả sớm ${Math.abs(timeDiff)} phút`;
        } else if (timeDiff > 0) {
            note = `Nhận trễ ${timeDiff} phút → Giữ nguyên giờ trả (${adjustedTime})`;
        } else {
            note = 'Nhận đúng giờ';
        }
    }

    return { adjustedTime, note };
}

// ✅ HELPER: Calculate late fee
function calculateLateFee(booking, assignment, actualCheckOutTime) {
    const checkOutDate = moment(booking.ngayTraPhong);
    const plannedCheckOutTime = assignment.gioTraPhongDuKien || booking.gioTraPhong || '12:00';

    const plannedCheckOut = moment(`${checkOutDate.format('YYYY-MM-DD')} ${plannedCheckOutTime}`, 'YYYY-MM-DD HH:mm');
    const actualCheckOut = moment(`${checkOutDate.format('YYYY-MM-DD')} ${actualCheckOutTime}`, 'YYYY-MM-DD HH:mm');

    const timeDiff = actualCheckOut.diff(plannedCheckOut, 'minutes');

    let lateFee = 0;
    let calculation = '';
    let status = '';

    const isLate = timeDiff > 30; // Grace period 30 minutes
    const isEarly = timeDiff < -30;

    if (isLate) {
        const lateMinutes = timeDiff;
        const roomPrice = booking.maLoaiPhong?.giaCa || 0;

        // ✅ Late fee calculation based on booking type
        switch (booking.loaiDatPhong) {
            case 'theo_gio':
                // Theo giờ: 50% giá giờ cho mỗi giờ trễ
                const hourlyRate = Math.round(roomPrice / 14);
                const lateHours = Math.ceil(lateMinutes / 60);
                lateFee = Math.round(hourlyRate * 0.5 * lateHours);
                calculation = `${lateHours}h x ${hourlyRate.toLocaleString('vi-VN')}đ x 50% = ${lateFee.toLocaleString('vi-VN')}đ`;
                break;

            case 'qua_dem':
            case 'dai_ngay':
                // Qua đêm/dài ngày: 20% giá phòng cho mỗi 4h trễ
                const latePeriods = Math.ceil(lateMinutes / 240); // 4 hours per period
                lateFee = Math.round(roomPrice * 0.2 * latePeriods);
                calculation = `${latePeriods} kỳ (4h/kỳ) x ${roomPrice.toLocaleString('vi-VN')}đ x 20% = ${lateFee.toLocaleString('vi-VN')}đ`;
                break;
        }

        status = `Trả trễ ${lateMinutes} phút → Phí: ${lateFee.toLocaleString('vi-VN')}đ`;
    } else if (isEarly) {
        status = `Trả sớm ${Math.abs(timeDiff)} phút`;
    } else {
        status = 'Trả đúng giờ';
    }

    return {
        plannedCheckOut: plannedCheckOut.format('DD/MM/YYYY HH:mm'),
        actualCheckOut: actualCheckOut.format('DD/MM/YYYY HH:mm'),
        lateMinutes: Math.max(0, timeDiff),
        lateFee,
        calculation,
        status,
        isLate,
        isEarly
    };
}

// ✅ HELPER: Update booking total with late fee
async function updateBookingTotalWithLateFee(bookingId, lateFee) {
    const booking = await Booking.findById(bookingId);
    if (booking) {
        booking.thongTinGia.phiDichVu = (booking.thongTinGia.phiDichVu || 0) + lateFee;
        booking.thongTinGia.tongDonDat = booking.thongTinGia.tongTienPhong + booking.thongTinGia.phiDichVu;
        await booking.save();
        console.log(`💰 Updated booking ${bookingId} total: +${lateFee} VND late fee`);
    }
}

module.exports = hotelBookingRouter;