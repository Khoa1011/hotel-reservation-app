const express = require("express");
const multer = require("multer");
const Room = require("../Model/Room/Room");
const RoomType = require("../Model/RoomType/RoomType");
const Hotels = require("../Model/Hotel/Hotel");
const authorizeRoles = require('../middleware/roleAuth');
const mongoose = require("mongoose");
const RoomImage = require("../Model/Room/RoomImage");
const AmenityDetails = require("../Model/Amenities/AmenityDetails");
const Amenity = require("../Model/Amenities/Amenities");
const roomRouter = express.Router();
const { uploadRoom } = require("../config/upload");

// API thêm phòng mới

roomRouter.post("/add", uploadRoom.any(), async (req, res) => {
    try {
        // Gán file đầu tiên vào req.file
        if (req.files && req.files.length > 0) {
            req.file = req.files[0];
        }

        const {
            maLoaiPhong,
            maKhachsan,
            trangThaiPhong,
            moTa,
            soLuongGiuong,
            soLuongNguoiToiDa,
            danhSachTienNghi,
            tongSoPhong
        } = req.body;

        // Validation
        const missingFields = [];
        if (!maLoaiPhong) missingFields.push("maLoaiPhong");
        if (!maKhachsan) missingFields.push("maKhachsan");
        if (!moTa) missingFields.push("moTa");
        if (!soLuongGiuong) missingFields.push("soLuongGiuong");
        if (!soLuongNguoiToiDa) missingFields.push("soLuongNguoiToiDa");
        if (!danhSachTienNghi) missingFields.push("danhSachTienNghi");
        if (!tongSoPhong) missingFields.push("tongSoPhong");

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: "Missing required fields",
                missingFields
            });
        }

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(maLoaiPhong)) {
            return res.status(400).json({ message: "Invalid maLoaiPhong ObjectId" });
        }

        if (!mongoose.Types.ObjectId.isValid(maKhachsan)) {
            return res.status(400).json({ message: "Invalid maKhachsan ObjectId" });
        }

        // Check if room type exists
        const roomType = await RoomType.findById(maLoaiPhong);
        if (!roomType) {
            return res.status(404).json({ message: "Room type not found" });
        }

        // Check if hotel exists
        const hotel = await Hotels.findById(maKhachsan);
        if (!hotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }

        // Handle image
        let imagePath = "";
        if (req.file) {
            imagePath = `/uploads/rooms/${req.file.filename}`;
        }

        // Handle amenities
        let amenitiesList = [];
        if (danhSachTienNghi) {
            try {
                if (typeof danhSachTienNghi === 'string') {
                    amenitiesList = JSON.parse(danhSachTienNghi);
                } else if (Array.isArray(danhSachTienNghi)) {
                    amenitiesList = danhSachTienNghi;
                }
            } catch (parseError) {
                return res.status(400).json({
                    message: "Invalid amenities format",
                    error: parseError.message
                });
            }
        }

        // Create new room
        const newRoom = new Room({
            maLoaiPhong,
            maKhachsan,
            hinhAnh: imagePath,
            trangThaiPhong: typeof trangThaiPhong === 'string' && trangThaiPhong
                ? trangThaiPhong
                : "trong",
            moTa: moTa.trim(),
            soLuongGiuong: parseInt(soLuongGiuong),
            soLuongNguoiToiDa: parseInt(soLuongNguoiToiDa),
            danhSachTienNghi: amenitiesList,
            tongSoPhong: parseInt(tongSoPhong)
        });

        // Save room
        await newRoom.save();

        // Add room to hotel's room list
        if (hotel.danhSachPhong) {
            hotel.danhSachPhong.push(newRoom._id);
        } else if (hotel.rooms) {
            hotel.rooms.push(newRoom._id);
        } else {
            hotel.danhSachPhong = [newRoom._id];
        }

        await hotel.save();

        res.status(201).json({
            success: true,
            message: "Room added successfully",
            room: newRoom
        });

    } catch (error) {
        // Clean up uploaded file if error
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

// API lấy thông tin chi tiết phòng (bao gồm hình ảnh và tiện nghi)
roomRouter.get("/details/:roomId", async (req, res) => {
    const { roomId } = req.params;

    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({
                msgBody: "Mã phòng không hợp lệ!",
                msgError: true
            });
        }

        // Lấy thông tin cơ bản của phòng
        const roomInfo = await Room.findById(roomId)
            .populate('maLoaiPhong', 'tenLoaiPhong giaPhong')
            .populate('maKhachsan', 'tenKhachSan diaChi');

        if (!roomInfo) {
            return res.status(404).json({
                msgBody: "Không tìm thấy phòng!",
                msgError: true
            });
        }

        // Lấy danh sách hình ảnh
        const images = await RoomImage.find({ maPhong: roomId })
            .sort({ thuTuAnh: 1 })
            .select('url_anh thuTuAnh moTa');

        // Lấy danh sách tiện nghi
        const amenities = await AmenityDetails.find({
            maPhong: roomId,
            trangThai: true
        })
            .populate('maTienNghi', 'tenTienNghi loaiTienNghi icon')
            .select('maTienNghi soLuong moTa');

        const result = {
            roomInfo: {
                roomId: roomInfo._id,
                roomTypeId: roomInfo.maLoaiPhong._id,
                roomTypeName: roomInfo.maLoaiPhong.tenLoaiPhong,
                roomTypePrice: roomInfo.maLoaiPhong.giaPhong,
                hotelId: roomInfo.maKhachsan._id,
                hotelName: roomInfo.maKhachsan.tenKhachSan,
                hotelAddress: roomInfo.maKhachsan.diaChi,
                mainImage: roomInfo.hinhAnh,
                roomStatus: roomInfo.trangThaiPhong,
                description: roomInfo.moTa,
                bedCount: roomInfo.soLuongGiuong,
                maxGuests: roomInfo.soLuongNguoiToiDa,
                basicAmenities: roomInfo.danhSachTienNghi,
                totalRooms: roomInfo.tongSoPhong
            },
            images: images.map(image => ({
                imageId: image._id,
                imageUrl: image.url_anh,
                imageOrder: image.thuTuAnh,
                description: image.moTa
            })),
            amenities: amenities.map(amenity => ({
                amenityId: amenity._id,
                amenityDetailsId: amenity.maTienNghi._id,
                amenityName: amenity.maTienNghi.tenTienNghi,
                amenityType: amenity.maTienNghi.loaiTienNghi,
                amenityIcon: amenity.maTienNghi.icon,
                quantity: amenity.soLuong,
                description: amenity.moTa
            }))
        };

        return res.status(200).json(result);

    } catch (error) {
        return res.status(500).json({
            msgBody: "Lỗi truy xuất chi tiết phòng!",
            msgError: true,
            messageError: error.message
        });
    }
});


// /--------------------------------------------------------------------------



module.exports = roomRouter;
