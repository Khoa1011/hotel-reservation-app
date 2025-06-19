const express = require("express");
const Room = require("../Model/Room/Room");
const RoomImage = require("../Model/Room/RoomImage"); 
const AmenityDetails = require("../Model/Amenities/AmenityDetails");
const authorizeRoles = require('../middleware/roleAuth');

const roomRouter = express.Router();

// API lấy danh sách hình ảnh của phòng
roomRouter.get("/images/:roomId", async (req, res) => {
    const { roomId } = req.params;
    
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({
                msgBody: "Mã phòng không hợp lệ!",
                msgError: true
            });
        }

        const images = await RoomImage.find({ maPhong: roomId })
            .sort({ thuTuAnh: 1 })
            .select('url_anh thuTuAnh moTa');

        if (!images || images.length === 0) {
            return res.status(404).json({
                msgBody: "Không tìm thấy hình ảnh nào cho phòng này!",
                msgError: true
            });
        }

        const result = images.map(image => ({
            imageId: image._id,
            imageUrl: image.url_anh,
            imageOrder: image.thuTuAnh,
            description: image.moTa
        }));

        return res.status(200).json(result);

    } catch (error) {
        return res.status(500).json({
            msgBody: "Lỗi truy xuất hình ảnh phòng!",
            msgError: true,
            messageError: error.message
        });
    }
});

// API lấy danh sách tiện nghi của phòng
roomRouter.get("/amenities/:roomId", async (req, res) => {
    const { roomId } = req.params;
    
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({
                msgBody: "Mã phòng không hợp lệ!",
                msgError: true
            });
        }

        const amenities = await AmenityDetails.find({ 
            maPhong: roomId,
            trangThai: true 
        })
        .populate('maTienNghi', 'tenTienNghi loaiTienNghi icon')
        .select('maTienNghi soLuong moTa');

        if (!amenities || amenities.length === 0) {
            return res.status(404).json({
                msgBody: "Không tìm thấy tiện nghi nào cho phòng này!",
                msgError: true
            });
        }

        const result = amenities.map(amenity => ({
            amenityId: amenity._id,
            amenityDetailsId: amenity.maTienNghi._id,
            amenityName: amenity.maTienNghi.tenTienNghi,
            amenityType: amenity.maTienNghi.loaiTienNghi,
            amenityIcon: amenity.maTienNghi.icon,
            quantity: amenity.soLuong,
            description: amenity.moTa
        }));

        return res.status(200).json(result);

    } catch (error) {
        return res.status(500).json({
            msgBody: "Lỗi truy xuất tiện nghi phòng!",
            msgError: true,
            messageError: error.message
        });
    }
});


