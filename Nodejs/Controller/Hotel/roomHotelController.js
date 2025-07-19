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


// 1. Tạo phòng mới với upload nhiều hình ảnh
roomHotelRouter.post("/hotelowner/create-room", 
    authorizeRoles("chuKhachSan"), 
    upload.array('hinhAnh', 10), // Cho phép upload tối đa 10 hình
    async (req, res) => {
        try {
            const {
                maLoaiPhong,
                dienTich,
                moTa,
                soLuongGiuong,
                soLuongNguoiToiDa,
                cauHinhGiuong,
                cacViewPhong
            } = req.body;

            // Validation
            const missingFields = [];
            if (!maLoaiPhong) missingFields.push("maLoaiPhong");
            if (!moTa) missingFields.push("moTa");
            if (!soLuongGiuong) missingFields.push("soLuongGiuong");
            if (!soLuongNguoiToiDa) missingFields.push("soLuongNguoiToiDa");

            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Thiếu thông tin bắt buộc",
                    missingFields
                });
            }

            // Kiểm tra phải có ít nhất 1 hình ảnh
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng tải lên ít nhất 1 hình ảnh phòng"
                });
            }

            // Kiểm tra loại phòng có tồn tại
            if (!mongoose.Types.ObjectId.isValid(maLoaiPhong)) {
                return res.status(400).json({
                    success: false,
                    message: "ID loại phòng không hợp lệ"
                });
            }

            const roomType = await RoomType.findById(maLoaiPhong);
            if (!roomType) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy loại phòng"
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

            // Tạo phòng mới (bỏ hinhAnh cũ)
            const newRoom = new Room({
                maLoaiPhong,
                trangThaiPhong: false,
                dienTich: parseFloat(dienTich) || 0,
                moTa: moTa.trim(),
                soLuongGiuong: parseInt(soLuongGiuong),
                soLuongNguoiToiDa: parseInt(soLuongNguoiToiDa),
                cauHinhGiuong: bedConfig,
                cacViewPhong: cacViewPhong || []
                // Bỏ field hinhAnh cũ vì giờ dùng bảng riêng
            });

            await newRoom.save();

            // Lưu hình ảnh vào bảng RoomImage
            const imagePromises = req.files.map((file, index) => {
                const roomImage = new RoomImage({
                    maPhong: newRoom._id,
                    url_anh: `/uploads/${file.filename}`, // Đường dẫn file
                    thuTuAnh: index + 1, // Thứ tự hình ảnh
                    moTa: `Hình ảnh phòng ${index + 1}`
                });
                return roomImage.save();
            });

            await Promise.all(imagePromises);

            // Populate thông tin đầy đủ
            await newRoom.populate('maLoaiPhong', 'tenLoaiPhong giaCa');
            
            // Lấy danh sách hình ảnh
            const roomImages = await RoomImage.find({ maPhong: newRoom._id }).sort({ thuTuAnh: 1 });

            res.status(201).json({
                success: true,
                message: "Tạo phòng thành công!",
                room: {
                    ...newRoom.toObject(),
                    hinhAnh: roomImages
                }
            });

        } catch (error) {
            console.error("Lỗi tạo phòng:", error);
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
            searchQuery.trangThaiPhong = status === 'true';
        }

        const skip = (page - 1) * limit;
        const rooms = await Room.find(searchQuery)
            .populate('maLoaiPhong', 'tenLoaiPhong giaCa')
            .populate('cacViewPhong', 'tenTamNhin')
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
    upload.array('hinhAnh', 10),
    async (req, res) => {
        try {
            const { roomId } = req.params;
            const {
                trangThaiPhong,
                dienTich,
                moTa,
                soLuongGiuong,
                soLuongNguoiToiDa,
                cauHinhGiuong,
                cacViewPhong,
                deleteImages // Danh sách ID hình ảnh cần xóa
            } = req.body;

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

            // Cập nhật thông tin phòng
            const updatedRoom = await Room.findByIdAndUpdate(
                roomId,
                {
                    ...(trangThaiPhong !== undefined && { trangThaiPhong: Boolean(trangThaiPhong) }),
                    ...(dienTich !== undefined && { dienTich: parseFloat(dienTich) }),
                    ...(moTa && { moTa: moTa.trim() }),
                    ...(soLuongGiuong !== undefined && { soLuongGiuong: parseInt(soLuongGiuong) }),
                    ...(soLuongNguoiToiDa !== undefined && { soLuongNguoiToiDa: parseInt(soLuongNguoiToiDa) }),
                    ...(cauHinhGiuong !== undefined && { cauHinhGiuong: bedConfig }),
                    ...(cacViewPhong !== undefined && { cacViewPhong })
                },
                { new: true, runValidators: true }
            ).populate('maLoaiPhong', 'tenLoaiPhong giaCa')
             .populate('cacViewPhong', 'tenTamNhin');

            // Xóa hình ảnh cũ nếu có
            if (deleteImages) {
                const imageIdsToDelete = Array.isArray(deleteImages) ? deleteImages : [deleteImages];
                await RoomImage.deleteMany({ _id: { $in: imageIdsToDelete } });
            }

            // Thêm hình ảnh mới nếu có
            if (req.files && req.files.length > 0) {
                // Lấy thứ tự cao nhất hiện tại
                const lastImage = await RoomImage.findOne({ maPhong: roomId }).sort({ thuTuAnh: -1 });
                const startOrder = lastImage ? lastImage.thuTuAnh + 1 : 1;

                const imagePromises = req.files.map((file, index) => {
                    const roomImage = new RoomImage({
                        maPhong: roomId,
                        url_anh: `/uploads/${file.filename}`,
                        thuTuAnh: startOrder + index,
                        moTa: `Hình ảnh phòng ${startOrder + index}`
                    });
                    return roomImage.save();
                });

                await Promise.all(imagePromises);
            }

            // Lấy danh sách hình ảnh mới
            const roomImages = await RoomImage.find({ maPhong: roomId }).sort({ thuTuAnh: 1 });

            res.status(200).json({
                success: true,
                message: "Cập nhật phòng thành công!",
                room: {
                    ...updatedRoom.toObject(),
                    hinhAnh: roomImages
                }
            });

        } catch (error) {
            console.error("Lỗi cập nhật phòng:", error);
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
        if (room.trangThaiPhong) {
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
            .populate('cacViewPhong', 'tenTamNhin moTa');

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