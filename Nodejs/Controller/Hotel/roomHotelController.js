const express = require("express");
const mongoose = require("mongoose");
const authorizeRoles = require('../../middleware/roleAuth');
const roomHotelRouter = express.Router();
const Room = require("../../Model/Room/Room");
const Hotel = require("../../Model/Hotel/Hotel");
const User = require("../../Model/User/User");
const moment = require('moment-timezone');
const crypto = require('crypto');
const axios = require('axios');
const RoomType = require("../../Model/RoomType/RoomType");
const Booking = require("../../Model/Booking/Booking");
const RoomBookingAssignment = require("../../Model/Room/RoomBookingAssignment");

const {
    uploadRoom,
    handleMulterError,
    logUploadProcess,
    getRelativePath,
    deleteFiles
} = require('../../config/upload');
const RoomImage = require('../../Model/Room/RoomImage')


// 1. Tạo phòng mới với upload nhiều hình ảnh
roomHotelRouter.post("/hotelowner/create-room",
    authorizeRoles("chuKhachSan"),
    logUploadProcess,
    uploadRoom.array('hinhAnh', 10),
    handleMulterError,
    async (req, res) => {
        try {
            const {
                maLoaiPhong,
                soPhong,
                tang,
                loaiView,
                dienTich,
                moTa,
                soLuongGiuong,
                soLuongNguoiToiDa,
                cauHinhGiuong,
            } = req.body;

            // Validation
            const missingFields = [];
            if (!maLoaiPhong) missingFields.push("maLoaiPhong");
            if (!soPhong) missingFields.push("soPhong");
            if (!moTa) missingFields.push("moTa");
            if (!soLuongGiuong) missingFields.push("soLuongGiuong");
            if (!soLuongNguoiToiDa) missingFields.push("soLuongNguoiToiDa");

            if (missingFields.length > 0) {
                if (req.files) {
                    const uploadedPaths = req.files.map(f => f.path);
                    deleteFiles(uploadedPaths);
                }

                return res.status(400).json({
                    success: false,
                    message: "Thiếu thông tin bắt buộc",
                    missingFields
                });
            }

            // ✅ SỬA: Kiểm tra room type và lấy hotel ID
            const roomType = await RoomType.findById(maLoaiPhong).populate('maKhachSan', 'tenKhachSan');
            if (!roomType) {
                if (req.files) {
                    const uploadedPaths = req.files.map(f => f.path);
                    deleteFiles(uploadedPaths);
                }
                return res.status(400).json({
                    success: false,
                    message: "Loại phòng không tồn tại"
                });
            }

            const hotelId = roomType.maKhachSan._id;
            const hotelName = roomType.maKhachSan.tenKhachSan;

            // ✅ SỬA: Kiểm tra unique per hotel
            const isAvailable = await Room.isRoomNumberAvailable(soPhong.trim(), hotelId);
            if (!isAvailable) {
                if (req.files) {
                    const uploadedPaths = req.files.map(f => f.path);
                    deleteFiles(uploadedPaths);
                }
                return res.status(400).json({
                    success: false,
                    message: `Số phòng ${soPhong} đã tồn tại trong khách sạn "${hotelName}"`
                });
            }

            // Kiểm tra có ít nhất 1 hình ảnh
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng tải lên ít nhất 1 hình ảnh phòng"
                });
            }

            // Xử lý cấu hình giường
            let bedConfig = [];
            if (cauHinhGiuong) {
                try {
                    if (typeof cauHinhGiuong === 'string') {
                        bedConfig = JSON.parse(cauHinhGiuong);
                    } else if (Array.isArray(cauHinhGiuong)) {
                        bedConfig = cauHinhGiuong;
                    }
                } catch (parseError) {
                    return res.status(400).json({
                        success: false,
                        message: "Định dạng cấu hình giường không hợp lệ",
                        error: parseError.message
                    });
                }
            }

            // ✅ Tạo phòng mới
            const newRoom = new Room({
                maLoaiPhong,
                soPhong: soPhong.trim(),
                tang: parseInt(tang) || 1,
                loaiView: loaiView || "none",
                trangThaiPhong: "trong",
                dienTich: parseFloat(dienTich) || 0,
                moTa: moTa.trim(),
                soLuongGiuong: parseInt(soLuongGiuong),
                soLuongNguoiToiDa: parseInt(soLuongNguoiToiDa),
                cauHinhGiuong: bedConfig,
            });

            await newRoom.save();

            // Lưu hình ảnh vào bảng RoomImage
            const imagePromises = req.files.map((file, index) => {
                const relativePath = getRelativePath(file.path);

                const roomImage = new RoomImage({
                    maPhong: newRoom._id,
                    url_anh: relativePath,
                    thuTuAnh: index + 1,
                    moTa: `Hình ảnh phòng ${newRoom.soPhong} - ${index + 1}`
                });
                return roomImage.save();
            });

            await Promise.all(imagePromises);

            // Populate thông tin đầy đủ
            await newRoom.populate('maLoaiPhong', 'tenLoaiPhong giaCa');

            // Lấy danh sách hình ảnh
            const roomImages = await RoomImage.find({ maPhong: newRoom._id }).sort({ thuTuAnh: 1 });

            console.log(`✅ Created room ${newRoom.soPhong} in hotel "${hotelName}"`);

            res.status(201).json({
                success: true,
                message: `Tạo phòng ${newRoom.soPhong} thành công cho khách sạn "${hotelName}"!`,
                room: {
                    ...newRoom.toObject(),
                    hinhAnh: roomImages,
                    hotelInfo: {
                        hotelId,
                        hotelName
                    }
                }
            });

        } catch (error) {
            console.error("Lỗi tạo phòng:", error);

            // ✅ Handle specific validation errors
            if (error.message?.includes('đã tồn tại trong khách sạn')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            // Handle compound unique index error
            if (error.code === 11000) {
                const duplicateField = Object.keys(error.keyPattern || {})[0];
                if (duplicateField === 'soPhong') {
                    return res.status(400).json({
                        success: false,
                        message: `Số phòng ${req.body.soPhong} đã tồn tại trong loại phòng này`
                    });
                }
            }

            res.status(500).json({
                success: false,
                message: "Lỗi server khi tạo phòng",
                error: error.message
            });
        }
    }
);

// 2. Lấy danh sách phòng theo loại với hình ảnh
roomHotelRouter.get("/hotelowner/rooms/:roomTypeId", authorizeRoles("chuKhachSan"), async (req, res) => {
    try {
        const { roomTypeId } = req.params;
        const { page = 1, limit = 10, status } = req.query;

        if (!mongoose.Types.ObjectId.isValid(roomTypeId)) {
            return res.status(400).json({
                success: false,
                message: "ID loại phòng không hợp lệ"
            });
        }

        const searchQuery = { maLoaiPhong: roomTypeId };
        if (status !== undefined) {
            searchQuery.trangThaiPhong = status;
        }

        const skip = (page - 1) * limit;
        const rooms = await Room.find(searchQuery)
            .populate('maLoaiPhong', 'tenLoaiPhong giaCa')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Lấy hình ảnh cho từng phòng
        const roomsWithImages = await Promise.all(
            rooms.map(async (room) => {
                const images = await RoomImage.find({ maPhong: room._id }).sort({ thuTuAnh: 1 });
                return {
                    ...room.toObject(),
                    hinhAnh: images
                };
            })
        );

        const total = await Room.countDocuments(searchQuery);

        res.status(200).json({
            success: true,
            message: "Lấy danh sách phòng thành công",
            data: {
                rooms: roomsWithImages,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error("Lỗi lấy danh sách phòng:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server khi lấy danh sách phòng",
            error: error.message
        });
    }
});

// 3. Cập nhật phòng và hình ảnh
roomHotelRouter.put("/hotelowner/update-room/:roomId",
    authorizeRoles("chuKhachSan"),
    logUploadProcess,
    uploadRoom.array('hinhAnh', 10),
    handleMulterError,
    async (req, res) => {
        try {
            const { roomId } = req.params;
            const {
                trangThaiPhong,
                soPhong,        // ✅ THÊM: Cho phép update số phòng
                tang,           // ✅ THÊM
                loaiView,       // ✅ THÊM
                dienTich,
                moTa,
                soLuongGiuong,
                soLuongNguoiToiDa,
                cauHinhGiuong,
                deleteImages
            } = req.body;

            if (!mongoose.Types.ObjectId.isValid(roomId)) {
                return res.status(400).json({
                    success: false,
                    message: "ID phòng không hợp lệ"
                });
            }

            const room = await Room.findById(roomId).populate({
                path: 'maLoaiPhong',
                populate: {
                    path: 'maKhachSan',
                    select: 'tenKhachSan'
                }
            });

            if (!room) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy phòng"
                });
            }

            const hotelId = room.maLoaiPhong.maKhachSan._id;
            const hotelName = room.maLoaiPhong.maKhachSan.tenKhachSan;

            // ✅ SỬA: Kiểm tra unique số phòng nếu có thay đổi
            if (soPhong && soPhong.trim() !== room.soPhong) {
                const isAvailable = await Room.isRoomNumberAvailable(
                    soPhong.trim(),
                    hotelId,
                    roomId  // Exclude current room
                );

                if (!isAvailable) {
                    return res.status(400).json({
                        success: false,
                        message: `Số phòng ${soPhong} đã tồn tại trong khách sạn "${hotelName}"`
                    });
                }
            }

            // Xử lý cấu hình giường
            let bedConfig = room.cauHinhGiuong;
            if (cauHinhGiuong !== undefined) {
                try {
                    if (typeof cauHinhGiuong === 'string') {
                        bedConfig = JSON.parse(cauHinhGiuong);
                    } else if (Array.isArray(cauHinhGiuong)) {
                        bedConfig = cauHinhGiuong;
                    }
                } catch (parseError) {
                    return res.status(400).json({
                        success: false,
                        message: "Định dạng cấu hình giường không hợp lệ",
                        error: parseError.message
                    });
                }
            }

            // ✅ SỬA: Cập nhật thông tin phòng với các field mới
            const updateFields = {};

            if (trangThaiPhong !== undefined) updateFields.trangThaiPhong = trangThaiPhong;
            if (soPhong !== undefined) updateFields.soPhong = soPhong.trim();
            if (tang !== undefined) updateFields.tang = parseInt(tang);
            if (loaiView !== undefined) updateFields.loaiView = loaiView;
            if (dienTich !== undefined) updateFields.dienTich = parseFloat(dienTich);
            if (moTa !== undefined) updateFields.moTa = moTa.trim();
            if (soLuongGiuong !== undefined) updateFields.soLuongGiuong = parseInt(soLuongGiuong);
            if (soLuongNguoiToiDa !== undefined) updateFields.soLuongNguoiToiDa = parseInt(soLuongNguoiToiDa);
            if (cauHinhGiuong !== undefined) updateFields.cauHinhGiuong = bedConfig;

            updateFields.capNhatCuoi = new Date();

            const updatedRoom = await Room.findByIdAndUpdate(
                roomId,
                updateFields,
                { new: true, runValidators: true }
            ).populate('maLoaiPhong', 'tenLoaiPhong giaCa');

            // Xóa hình ảnh cũ nếu có
            if (deleteImages) {
                let imageIdsToDelete = [];

                try {
                    // Xử lý trường hợp deleteImages là string JSON
                    if (typeof deleteImages === 'string') {
                        imageIdsToDelete = JSON.parse(deleteImages);
                    } else if (Array.isArray(deleteImages)) {
                        imageIdsToDelete = deleteImages;
                    } else {
                        imageIdsToDelete = [deleteImages];
                    }

                    // Validate ObjectIds
                    const validImageIds = imageIdsToDelete.filter(id =>
                        mongoose.Types.ObjectId.isValid(id)
                    );

                    if (validImageIds.length > 0) {
                        await RoomImage.deleteMany({ _id: { $in: validImageIds } });
                        console.log(`✅ Deleted ${validImageIds.length} images`);
                    }

                } catch (parseError) {
                    console.error("Lỗi parse deleteImages:", parseError);
                    return res.status(400).json({
                        success: false,
                        message: "Định dạng danh sách hình ảnh cần xóa không hợp lệ"
                    });
                }
            }
            // Thêm hình ảnh mới nếu có
            if (req.files && req.files.length > 0) {
                const lastImage = await RoomImage.findOne({ maPhong: roomId }).sort({ thuTuAnh: -1 });
                const startOrder = lastImage ? lastImage.thuTuAnh + 1 : 1;

                const imagePromises = req.files.map((file, index) => {
                    const relativePath = getRelativePath(file.path);

                    const roomImage = new RoomImage({
                        maPhong: roomId,
                        url_anh: relativePath,
                        thuTuAnh: startOrder + index,
                        moTa: `Hình ảnh phòng ${updatedRoom.soPhong} - ${startOrder + index}`
                    });
                    return roomImage.save();
                });

                await Promise.all(imagePromises);
            }

            // Lấy danh sách hình ảnh mới
            const roomImages = await RoomImage.find({ maPhong: roomId }).sort({ thuTuAnh: 1 });

            console.log(`✅ Updated room ${updatedRoom.soPhong} in hotel "${hotelName}"`);

            res.status(200).json({
                success: true,
                message: `Cập nhật phòng ${updatedRoom.soPhong} thành công!`,
                room: {
                    ...updatedRoom.toObject(),
                    hinhAnh: roomImages,
                    hotelInfo: {
                        hotelId,
                        hotelName
                    }
                }
            });

        } catch (error) {
            console.error("Lỗi cập nhật phòng:", error);

            // ✅ Handle validation errors
            if (error.message?.includes('đã tồn tại trong khách sạn')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: "Lỗi server khi cập nhật phòng",
                error: error.message
            });
        }
    }
);

// 4. Xóa phòng và tất cả hình ảnh
roomHotelRouter.delete("/hotelowner/delete-room/:roomId", authorizeRoles("chuKhachSan"), async (req, res) => {
    try {
        const { roomId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({
                success: false,
                message: "ID phòng không hợp lệ"
            });
        }

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phòng"
            });
        }

        // Kiểm tra phòng có đang được đặt không
        if (room.trangThaiPhong === 'dang_su_dung') {
            return res.status(400).json({
                success: false,
                message: "Không thể xóa phòng đang được sử dụng"
            });
        }

        // Xóa tất cả hình ảnh của phòng
        await RoomImage.deleteMany({ maPhong: roomId });

        // Xóa phòng
        await Room.findByIdAndDelete(roomId);

        res.status(200).json({
            success: true,
            message: "Xóa phòng và hình ảnh thành công!"
        });

    } catch (error) {
        console.error("Lỗi xóa phòng:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server khi xóa phòng",
            error: error.message
        });
    }
});

// 5. Lấy chi tiết phòng với hình ảnh
roomHotelRouter.get("/hotelowner/room-detail/:roomId", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { roomId } = req.params;
        const user = await User.findById(req.user.id);

        if (!user || user.vaiTro !== "chuKhachSan") {
            return res.status(403).json({
                success: false,
                message: "Không có quyền truy cập!"
            });
        }

        // ✅ 1. Lấy thông tin phòng
        const room = await Room.findById(roomId)
            .populate('maLoaiPhong', 'tenLoaiPhong giaCa soLuongKhach moTa')
            .populate({
                path: 'maLoaiPhong',
                populate: {
                    path: 'maKhachSan',
                    select: 'tenKhachSan maChuKhachSan'
                }
            });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phòng!"
            });
        }

        // ✅ Kiểm tra quyền sở hữu khách sạn
        if (room.maLoaiPhong.maKhachSan.maChuKhachSan.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền xem phòng này!"
            });
        }

        // ✅ 2. Tìm room assignment hiện tại của phòng
        let currentAssignment = null;
        let currentBooking = null;
        let guestInfo = null;



        if (room.trangThaiPhong === 'da_dat') {
            // Tìm assignment đang active cho phòng này
            currentAssignment = await mongoose.model('chiTietPhong')
                .findOne({
                    maPhong: roomId,
                    trangThaiGanPhong: { $in: ['da_gan', 'dang_cho_checkin', 'da_checkin', 'dang_su_dung'] }
                })
                .populate({
                    path: 'maDatPhong',
                    match: {
                        // Chỉ lấy đơn đang hoạt động
                        trangThai: { $in: ['dang_cho', 'da_xac_nhan', 'da_nhan_phong', 'dang_su_dung'] }
                    },
                    populate: {
                        path: 'maNguoiDung',
                        select: 'tenNguoiDung email soDienThoai'
                    }
                })
                .sort({ createdAt: -1 })
                .exec();

            console.log("Mã phòng đã đặt hiện tại: ", roomId);
            console.log("Đơn hiện tại:", currentAssignment.maDatPhong._id);


            if (currentAssignment && currentAssignment.maDatPhong) {
                currentBooking = currentAssignment.maDatPhong;


                // ✅ 3. Lấy thông tin khách hàng
                if (currentBooking.maNguoiDung && currentBooking.maNguoiDung.tenNguoiDung) {
                    // Khách có tài khoản
                    guestInfo = {
                        customerId: currentBooking.maNguoiDung,
                        customerName: currentBooking.maNguoiDung.tenNguoiDung,
                        email: currentBooking.maNguoiDung.email || "Không có email",
                        phoneNumber: currentBooking.maNguoiDung.soDienThoai || currentBooking.soDienThoai || "Không có SĐT",
                        cccd: currentBooking.cccd || "Chưa cập nhật"
                    };
                } else {
                    // Khách đặt tại quầy hoặc thông tin từ assignment
                    guestInfo = {
                        customerId: null,
                        customerName: currentAssignment.thongTinKhachPhong?.tenKhachChinh || "Khách đặt tại quầy",
                        email: "Khách đặt tại quầy",
                        phoneNumber: currentAssignment.thongTinKhachPhong?.soDienThoaiLienHe || currentBooking.soDienThoai || "Không có SĐT",
                        cccd: currentBooking.cccd || "Chưa cập nhật"
                    };
                }
            }
        }

        // ✅ 4. Tính toán thời gian và giá tiền
        let durationInfo = null;
        let pricingInfo = null;

        if (currentBooking) {
            const checkInDate = moment(currentBooking.ngayNhanPhong);
            const checkOutDate = moment(currentBooking.ngayTraPhong);
            const now = moment();

            // Tính thời gian
            const totalDuration = checkOutDate.diff(checkInDate);
            const elapsedTime = now.diff(checkInDate);

            if (currentBooking.loaiDatPhong === 'theo_gio') {
                const totalHours = Math.ceil(moment.duration(totalDuration).asHours());
                const elapsedHours = Math.max(0, Math.floor(moment.duration(elapsedTime).asHours()));
                const remainingHours = Math.max(0, totalHours - elapsedHours);

                durationInfo = {
                    type: 'theo_gio',
                    total: totalHours,
                    elapsed: elapsedHours,
                    remaining: remainingHours,
                    unit: 'giờ',
                    checkInTime: currentBooking.gioNhanPhong,
                    checkOutTime: currentBooking.gioTraPhong
                };
            } else {
                const totalDays = Math.ceil(moment.duration(totalDuration).asDays());
                const elapsedDays = Math.max(0, Math.floor(moment.duration(elapsedTime).asDays()));
                const remainingDays = Math.max(0, totalDays - elapsedDays);

                const unit = currentBooking.loaiDatPhong === 'qua_dem' ? 'đêm' : 'ngày';

                durationInfo = {
                    type: currentBooking.loaiDatPhong,
                    total: totalDays,
                    elapsed: elapsedDays,
                    remaining: remainingDays,
                    unit: unit
                };
            }

            // Thông tin giá
            const serviceCharges = (currentAssignment?.dichVuSuDung || []).reduce((total, service) =>
                total + (service.thanhTien || 0), 0
            );

            pricingInfo = {
                basePrice: room.maLoaiPhong.giaCa,
                unitPrice: currentBooking.thongTinGia.donGia,
                totalAmount: currentBooking.thongTinGia.tongDonDat,
                roomPrice: currentBooking.thongTinGia.tongTienPhong,
                discount: currentBooking.thongTinGia.giamGia || 0,
                surcharge: currentBooking.thongTinGia.phuPhiCuoiTuan || 0,
                serviceCharges: serviceCharges,
                paymentMethod: currentBooking.phuongThucThanhToan,
                paymentStatus: currentBooking.trangThaiThanhToan
            };
        }

        // ✅ 5. Lịch sử phòng (booking gần đây)
        const recentAssignments = await mongoose.model('chiTietPhong').find({
            maPhong: roomId
        })
            .populate({
                path: 'maDatPhong',
                populate: {
                    path: 'maNguoiDung',
                    select: 'tenNguoiDung'
                }
            })
            .sort({ createdAt: -1 })
            .limit(5);

        const recentHistory = recentAssignments.map(assignment => {
            const booking = assignment.maDatPhong;
            return {
                bookingId: booking._id,
                guestName: booking.maNguoiDung?.tenNguoiDung || assignment.thongTinKhachPhong?.tenKhachChinh || "Khách đặt tại quầy",
                bookingType: booking.loaiDatPhong,
                checkIn: moment(booking.ngayNhanPhong).format('DD/MM/YYYY'),
                checkOut: moment(booking.ngayTraPhong).format('DD/MM/YYYY'),
                status: booking.trangThai,
                amount: booking.thongTinGia.tongDonDat,
                createdAt: moment(booking.thoiGianTaoDon).format('DD/MM/YYYY')
            };
        });

        // ✅ 6. Dịch vụ đang sử dụng
        const servicesUsed = currentAssignment?.dichVuSuDung || [];

        const result = {
            // Thông tin phòng
            room: {
                roomId: room._id,
                roomNumber: room.soPhong,
                floor: room.tang,
                viewType: room.loaiView,
                area: room.dienTich,
                maxGuests: room.soLuongNguoiToiDa,
                bedCount: room.soLuongGiuong,
                bedConfig: room.cauHinhGiuong,
                description: room.moTa,
                status: room.trangThaiPhong,
                images: room.hinhAnh || []
            },

            // Thông tin loại phòng
            roomType: {
                name: room.maLoaiPhong.tenLoaiPhong,
                basePrice: room.maLoaiPhong.giaCa,
                capacity: room.maLoaiPhong.soLuongKhach,
                description: room.maLoaiPhong.moTa
            },

            // Thông tin khách hiện tại
            currentGuest: guestInfo,

            // Thông tin booking hiện tại
            currentBooking: currentBooking ? {
                bookingId: currentBooking._id,
                bookingType: currentBooking.loaiDatPhong,
                checkInDate: moment(currentBooking.ngayNhanPhong).format('DD/MM/YYYY'),
                checkOutDate: moment(currentBooking.ngayTraPhong).format('DD/MM/YYYY'),
                checkInTime: currentBooking.gioNhanPhong,
                checkOutTime: currentBooking.gioTraPhong,
                status: currentBooking.trangThai,
                createdAt: moment(currentBooking.thoiGianTaoDon).format('DD/MM/YYYY HH:mm'),
                notes: currentBooking.ghiChu
            } : null,

            // Thông tin thời gian
            duration: durationInfo,

            // Thông tin giá cả
            pricing: pricingInfo,

            // Dịch vụ đang sử dụng
            services: servicesUsed,

            // Lịch sử booking gần đây
            recentHistory: recentHistory
        };

        return res.status(200).json({
            success: true,
            message: "Lấy chi tiết phòng thành công",
            data: result
        });

    } catch (error) {
        console.error("Lỗi lấy chi tiết phòng:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server khi lấy chi tiết phòng.",
            error: error.message
        });
    }
});

// 6. Lấy tất cả phòng trong khách sạn với thống kê
roomHotelRouter.get("/hotelowner/hotel-rooms/:hotelId",
    authorizeRoles("chuKhachSan"),
    async (req, res) => {
        try {
            const { hotelId } = req.params;
            const { roomTypeId, status, page = 1, limit = 50 } = req.query;

            if (!mongoose.Types.ObjectId.isValid(hotelId)) {
                return res.status(400).json({
                    success: false,
                    message: "ID khách sạn không hợp lệ"
                });
            }

            // Kiểm tra khách sạn tồn tại
            const hotel = await Hotel.findById(hotelId);
            if (!hotel) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy khách sạn"
                });
            }

            // Lấy tất cả loại phòng của khách sạn
            const roomTypes = await RoomType.find({ maKhachSan: hotelId })
                .select('_id tenLoaiPhong giaCa')
                .sort({ tenLoaiPhong: 1 });

            if (roomTypes.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: "Khách sạn chưa có loại phòng nào",
                    data: {
                        hotel: {
                            _id: hotel._id,
                            tenKhachSan: hotel.tenKhachSan
                        },
                        roomTypes: [],
                        rooms: [],
                        statistics: {
                            totalRooms: 0,
                            availableRooms: 0,
                            occupiedRooms: 0,
                            maintenanceRooms: 0,
                            byRoomType: []
                        },
                        pagination: {
                            currentPage: parseInt(page),
                            totalPages: 0,
                            totalItems: 0,
                            itemsPerPage: parseInt(limit)
                        }
                    }
                });
            }

            const roomTypeIds = roomTypes.map(rt => rt._id);

            // Tạo query filter cho phòng
            const roomQuery = { maLoaiPhong: { $in: roomTypeIds } };

            // Lọc theo loại phòng nếu có
            if (roomTypeId && mongoose.Types.ObjectId.isValid(roomTypeId)) {
                roomQuery.maLoaiPhong = roomTypeId;
            }

            // Lọc theo trạng thái nếu có
            if (status && status !== 'all') {
                if (status === 'available') {
                    roomQuery.trangThaiPhong = 'trong';
                } else if (status === 'occupied') {
                    roomQuery.trangThaiPhong = { $in: ['da_dat', 'dang_su_dung'] };
                } else if (status === 'maintenance') {
                    roomQuery.trangThaiPhong = 'bao_tri';
                } else {
                    roomQuery.trangThaiPhong = status;
                }
            }

            // Đếm tổng số phòng để phân trang
            const totalRooms = await Room.countDocuments(roomQuery);

            // Lấy danh sách phòng với phân trang
            const skip = (page - 1) * limit;
            const rooms = await Room.find(roomQuery)
                .populate('maLoaiPhong', 'tenLoaiPhong giaCa tienNghiDacBiet')
                .sort({ soPhong: 1 })
                .skip(skip)
                .limit(parseInt(limit));

            // Lấy hình ảnh cho từng phòng
            const roomsWithImages = await Promise.all(
                rooms.map(async (room) => {
                    const images = await RoomImage.find({ maPhong: room._id }).sort({ thuTuAnh: 1 });
                    return {
                        ...room.toObject(),
                        hinhAnh: images
                    };
                })
            );

            // Tính thống kê tổng quan (không áp dụng filter roomTypeId và status)
            const allRoomsQuery = { maLoaiPhong: { $in: roomTypeIds } };
            const allRooms = await Room.find(allRoomsQuery).select('trangThaiPhong maLoaiPhong');

            // Thống kê tổng quan
            const totalAllRooms = allRooms.length;
            const availableRooms = allRooms.filter(r => r.trangThaiPhong === 'trong').length;
            const occupiedRooms = allRooms.filter(r => ['da_dat', 'dang_su_dung'].includes(r.trangThaiPhong)).length;
            const maintenanceRooms = allRooms.filter(r => r.trangThaiPhong === 'bao_tri').length;

            // Thống kê theo từng loại phòng
            const statisticsByRoomType = roomTypes.map(roomType => {
                const roomsOfType = allRooms.filter(r => r.maLoaiPhong.toString() === roomType._id.toString());
                const total = roomsOfType.length;
                const available = roomsOfType.filter(r => r.trangThaiPhong === 'trong').length;
                const occupied = roomsOfType.filter(r => ['da_dat', 'dang_su_dung'].includes(r.trangThaiPhong)).length;
                const maintenance = roomsOfType.filter(r => r.trangThaiPhong === 'bao_tri').length;

                return {
                    roomType: {
                        _id: roomType._id,
                        tenLoaiPhong: roomType.tenLoaiPhong,
                        giaCa: roomType.giaCa
                    },
                    total,
                    available,
                    occupied,
                    maintenance,
                    occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0
                };
            });

            console.log(`✅ Fetched ${roomsWithImages.length} rooms for hotel "${hotel.tenKhachSan}"`);

            res.status(200).json({
                success: true,
                message: "Lấy danh sách phòng thành công",
                data: {
                    hotel: {
                        _id: hotel._id,
                        tenKhachSan: hotel.tenKhachSan
                    },
                    roomTypes,
                    rooms: roomsWithImages,
                    statistics: {
                        totalRooms: totalAllRooms,
                        availableRooms,
                        occupiedRooms,
                        maintenanceRooms,
                        occupancyRate: totalAllRooms > 0 ? Math.round((occupiedRooms / totalAllRooms) * 100) : 0,
                        byRoomType: statisticsByRoomType
                    },
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(totalRooms / limit),
                        totalItems: totalRooms,
                        itemsPerPage: parseInt(limit)
                    }
                }
            });

        } catch (error) {
            console.error("Lỗi lấy danh sách phòng khách sạn:", error);
            res.status(500).json({
                success: false,
                message: "Lỗi server khi lấy danh sách phòng",
                error: error.message
            });
        }
    }
);

// 7. API cập nhật trạng thái phòng (toggle)
roomHotelRouter.put("/hotelowner/update-room-status/:roomId",
    authorizeRoles("chuKhachSan"),
    async (req, res) => {
        try {
            const { roomId } = req.params;
            const { trangThaiPhong } = req.body;

            if (!mongoose.Types.ObjectId.isValid(roomId)) {
                return res.status(400).json({
                    success: false,
                    message: "ID phòng không hợp lệ"
                });
            }

            if (!trangThaiPhong || !['trong', 'da_dat', 'dang_su_dung', 'bao_tri'].includes(trangThaiPhong)) {
                return res.status(400).json({
                    success: false,
                    message: "Trạng thái phòng không hợp lệ"
                });
            }

            const room = await Room.findById(roomId).populate({
                path: 'maLoaiPhong',
                populate: {
                    path: 'maKhachSan',
                    select: 'tenKhachSan'
                }
            });

            if (!room) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy phòng"
                });
            }

            // Cập nhật trạng thái
            room.trangThaiPhong = trangThaiPhong;
            room.capNhatCuoi = new Date();
            await room.save();

            const hotelName = room.maLoaiPhong.maKhachSan.tenKhachSan;
            console.log(`✅ Updated room ${room.soPhong} status to ${trangThaiPhong} in hotel "${hotelName}"`);

            res.status(200).json({
                success: true,
                message: `Cập nhật trạng thái phòng ${room.soPhong} thành công!`,
                room: {
                    _id: room._id,
                    soPhong: room.soPhong,
                    trangThaiPhong: room.trangThaiPhong,
                    capNhatCuoi: room.capNhatCuoi
                }
            });

        } catch (error) {
            console.error("Lỗi cập nhật trạng thái phòng:", error);
            res.status(500).json({
                success: false,
                message: "Lỗi server khi cập nhật trạng thái phòng",
                error: error.message
            });
        }
    }
);

// ✅ API lấy chi tiết phòng và thông tin khách đang sử dụng








module.exports = roomHotelRouter;