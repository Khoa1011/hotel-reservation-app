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



//1. Thêm mới loại phòng
roomHotelRouter.post("/hotelowner/create-roomtype", authorizeRoles("chuKhachSan"), async (req, res) => {
    try {
        const {
            maKhachSan,
            tenLoaiPhong,
            giaCa,
            moTa,
            tienNghiDacBiet,
        } = req.body;

        // Validation
        const missingFields = [];
        if (!maKhachSan) missingFields.push("maKhachSan");
        if (!tenLoaiPhong) missingFields.push("tenLoaiPhong");
        if (!giaCa) missingFields.push("giaCa");

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin bắt buộc",
                missingFields
            });
        }

        //Kiểm tra khách sạn
        if (!mongoose.Types.ObjectId.isValid(maKhachSan)) {
            return res.status(400).json({
                success: false,
                message: "Không có khách sạn này!"
            });
        }

        // Kiểm tra khách sạn có tồn tại không
        const hotel = await Hotel.findById(maKhachSan);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy khách sạn"
            });
        }

        // Kiểm tra tên loại phòng đã tồn tại trong khách sạn chưa
        const existingRoomType = await RoomType.findOne({
            maKhachSan,
            tenLoaiPhong: tenLoaiPhong.trim()
        });

        if (existingRoomType) {
            return res.status(409).json({
                success: false,
                message: "Tên loại phòng đã tồn tại trong khách sạn này"
            });
        }

        // Xử lý tiện nghi đặc biệt
        let amenitiesList = [];
        if (tienNghiDacBiet) {
            try {
                if (typeof tienNghiDacBiet === 'string') {
                    amenitiesList = JSON.parse(tienNghiDacBiet);
                } else if (Array.isArray(tienNghiDacBiet)) {
                    amenitiesList = tienNghiDacBiet;
                }
            } catch (parseError) {
                return res.status(400).json({
                    success: false,
                    message: "Định dạng tiện nghi không hợp lệ",
                    error: parseError.message
                });
            }
        }

        // Tạo loại phòng mới
        const newRoomType = new RoomType({
            maKhachSan,
            tenLoaiPhong: tenLoaiPhong.trim(),
            giaCa: parseFloat(giaCa),
            moTa: moTa?.trim() || "",
            tienNghiDacBiet: amenitiesList,
        });

        await newRoomType.save();

        // Populate thông tin khách sạn
        await newRoomType.populate('maKhachSan', 'tenKhachSan');

        res.status(201).json({
            success: true,
            message: "Tạo loại phòng thành công!",
            loaiPhong: newRoomType
        });

    } catch (error) {
        console.error("Lỗi tạo loại phòng:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server khi tạo loại phòng",
            error: error.message
        });
    }
});

// 2. Lấy danh sách loại phòng
roomHotelRouter.get("/hotelowner/roomtypes/:hotelId", authorizeRoles("chuKhachSan"), async (req, res) => {
    try {
        const { hotelId } = req.params;
        const { page = 1, limit = 100, search = "" } = req.query;

        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            return res.status(400).json({
                success: false,
                message: "Không có khách sạn này!"
            });
        }

        // Tạo query tìm kiếm
        const searchQuery = {
            maKhachSan: hotelId
        };

        if (search.trim()) {
            searchQuery.tenLoaiPhong = { $regex: search.trim(), $options: 'i' };
        }

        const skip = (page - 1) * limit;

        const roomTypes = await RoomType.find(searchQuery)
            .populate('maKhachSan', 'tenKhachSan')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await RoomType.countDocuments(searchQuery);

        res.status(200).json({
            success: true,
            message: "Lấy danh sách loại phòng thành công",
            data: {
                loaiPhong: roomTypes,
                phanTrang: {
                    trangHienTai: parseInt(page),
                    tongTrang: Math.ceil(total / limit),
                    tongLoai: total,
                    tongLoaiTrenMoiTrang: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error("Lỗi lấy danh sách loại phòng:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server khi lấy danh sách loại phòng",
            error: error.message
        });
    }
});

// 3. Sửa loại phòng
roomHotelRouter.put("/hotelowner/update-roomtype/:roomTypeId", authorizeRoles("chuKhachSan"), async (req, res) => {
    try {
        const { roomTypeId } = req.params;
        const {
            tenLoaiPhong,
            giaCa,
            moTa,
            tienNghiDacBiet,
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(roomTypeId)) {
            return res.status(400).json({
                success: false,
                message: "ID loại phòng không hợp lệ"
            });
        }

        const roomType = await RoomType.findById(roomTypeId);
        if (!roomType) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy loại phòng"
            });
        }

        // Kiểm tra tên loại phòng trùng lặp (nếu thay đổi tên)
        if (tenLoaiPhong && tenLoaiPhong.trim() !== roomType.tenLoaiPhong) {
            const existingRoomType = await RoomType.findOne({
                maKhachSan: roomType.maKhachSan,
                tenLoaiPhong: tenLoaiPhong.trim(),
                _id: { $ne: roomTypeId }
            });

            if (existingRoomType) {
                return res.status(409).json({
                    success: false,
                    message: "Tên loại phòng đã tồn tại trong khách sạn này"
                });
            }
        }

        // Xử lý tiện nghi đặc biệt
        let amenitiesList = roomType.tienNghiDacBiet;
        if (tienNghiDacBiet !== undefined) {
            try {
                if (typeof tienNghiDacBiet === 'string') {
                    amenitiesList = JSON.parse(tienNghiDacBiet);
                } else if (Array.isArray(tienNghiDacBiet)) {
                    amenitiesList = tienNghiDacBiet;
                }
            } catch (parseError) {
                return res.status(400).json({
                    success: false,
                    message: "Định dạng tiện nghi không hợp lệ",
                    error: parseError.message
                });
            }
        }

        // Cập nhật loại phòng
        const updatedRoomType = await RoomType.findByIdAndUpdate(
            roomTypeId,
            {
                ...(tenLoaiPhong && { tenLoaiPhong: tenLoaiPhong.trim() }),
                ...(giaCa !== undefined && { giaCa: parseFloat(giaCa) }),
                ...(moTa !== undefined && { moTa: moTa?.trim() || "" }),
                ...(tienNghiDacBiet !== undefined && { tienNghiDacBiet: amenitiesList }),
            },
            { new: true, runValidators: true }
        ).populate('maKhachSan', 'tenKhachSan');

        res.status(200).json({
            success: true,
            message: "Cập nhật loại phòng thành công!",
            loaiPhong: updatedRoomType
        });

    } catch (error) {
        console.error("Lỗi cập nhật loại phòng:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server khi cập nhật loại phòng",
            error: error.message
        });
    }
});

// 4. Xóa loại phòng
roomHotelRouter.delete("/hotelowner/delete-roomtype/:roomTypeId", authorizeRoles("chuKhachSan"), async (req, res) => {
    try {
        const { roomTypeId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(roomTypeId)) {
            return res.status(400).json({
                success: false,
                message: "ID loại phòng không hợp lệ"
            });
        }

        // Kiểm tra có phòng nào đang sử dụng loại phòng này 
        const roomsUsingThisType = await Room.countDocuments({ maLoaiPhong: roomTypeId });
        if (roomsUsingThisType > 0) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa loại phòng này vì đang có ${roomsUsingThisType} phòng sử dụng`
            });
        }

        const deletedRoomType = await RoomType.findByIdAndDelete(roomTypeId);
        if (!deletedRoomType) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy loại phòng"
            });
        }

        res.status(200).json({
            success: true,
            message: "Xóa loại phòng thành công!"
        });

    } catch (error) {
        console.error("Lỗi xóa loại phòng:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server khi xóa loại phòng",
            error: error.message
        });
    }
});

// 5. Tìm kiếm loại phòng
roomHotelRouter.get("/hotelowner/search-roomtypes", authorizeRoles("chuKhachSan"), async (req, res) => {
    try {
        const { 
            hotelId, 
            search = "", 
            minPrice, 
            maxPrice, 
            minGuests, 
            page = 1, 
            limit = 10 
        } = req.query;

        if (!hotelId || !mongoose.Types.ObjectId.isValid(hotelId)) {
            return res.status(400).json({
                success: false,
                message: "ID khách sạn không hợp lệ"
            });
        }

        // Tạo query tìm kiếm
        const searchQuery = { maKhachSan: hotelId };

        // Tìm kiếm theo tên
        if (search.trim()) {
            searchQuery.$or = [
                { tenLoaiPhong: { $regex: search.trim(), $options: 'i' } },
                { moTa: { $regex: search.trim(), $options: 'i' } }
            ];
        }

        // Lọc theo giá
        if (minPrice || maxPrice) {
            searchQuery.giaCa = {};
            if (minPrice) searchQuery.giaCa.$gte = parseFloat(minPrice);
            if (maxPrice) searchQuery.giaCa.$lte = parseFloat(maxPrice);
        }

        // Lọc theo số lượng khách
        if (minGuests) {
            searchQuery.soLuongKhach = { $gte: parseInt(minGuests) };
        }

        const skip = (page - 1) * limit;

        const roomTypes = await RoomType.find(searchQuery)
            .populate('maKhachSan', 'tenKhachSan')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await RoomType.countDocuments(searchQuery);

        res.status(200).json({
            success: true,
            message: "Tìm kiếm loại phòng thành công",
            data: {
                loaiPhong :roomTypes,
                phanTrang: {
                    trangHienTai: parseInt(page),
                    tongTrang: Math.ceil(total / limit),
                    tongItem: total,
                    tongLoaiTrenMoiTrang: parseInt(limit)
                },
                searchCriteria: {
                    search,
                    minPrice,
                    maxPrice,
                    minGuests
                }
            }
        });

    } catch (error) {
        console.error("Lỗi tìm kiếm loại phòng:", error);
        res.status(500).json({
            success: false,
            message: "❌ Lỗi server khi tìm kiếm loại phòng",
            error: error.message
        });
    }
});


module.exports = roomHotelRouter;