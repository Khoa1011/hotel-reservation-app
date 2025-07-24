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
                const imageIdsToDelete = Array.isArray(deleteImages) ? deleteImages : [deleteImages];
                await RoomImage.deleteMany({ _id: { $in: imageIdsToDelete } });
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
roomHotelRouter.get("/hotelowner/room-detail/:roomId", authorizeRoles("chuKhachSan"), async (req, res) => {
    try {
        const { roomId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({
                success: false,
                message: "ID phòng không hợp lệ"
            });
        }

        const room = await Room.findById(roomId)
            .populate('maLoaiPhong', 'tenLoaiPhong giaCa tienNghiDacBiet')

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy phòng"
            });
        }

        // Lấy hình ảnh của phòng
        const roomImages = await RoomImage.find({ maPhong: roomId }).sort({ thuTuAnh: 1 });

        res.status(200).json({
            success: true,
            message: "Lấy chi tiết phòng thành công",
            room: {
                ...room.toObject(),
                hinhAnh: roomImages
            }
        });

    } catch (error) {
        console.error("Lỗi lấy chi tiết phòng:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server khi lấy chi tiết phòng",
            error: error.message
        });
    }
});








module.exports = roomHotelRouter;