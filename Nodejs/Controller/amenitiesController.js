const express = require("express");
const Room = require("../Model/Room/Room");
const RoomImage = require("../Model/Room/RoomImage"); 
const AmenityDetails = require("../Model/Amenities/AmenityDetails");
const authorizeRoles = require('../middleware/roleAuth');
const mongoose = require("mongoose");
const Hotel = require("../Model/Hotel/Hotel");
const Amenities = require("../Model/Amenities/Amenities");
const AmenityCategory = require("../Model/Amenities/AmenityCategory");


const amenitiesRouter = express.Router();

// API lấy danh sách hình ảnh của phòng
amenitiesRouter.get("/images/:roomId", async (req, res) => {
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
amenitiesRouter.get("/amenities/:roomId", async (req, res) => {
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

// API LẤY TIỆN NGHI QUAN TRỌNG CỦA KHÁCH SẠN 
amenitiesRouter.get("/key-amenities/:hotelId", async (req, res) => {
    const { hotelId } = req.params;
    
    try {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            return res.status(400).json({
                msgBody: "Mã khách sạn không hợp lệ!",
                msgError: true
            });
        }

        // Lấy tất cả phòng của khách sạn
        const rooms = await Room.find({ maKhachsan: hotelId });
        
        if (!rooms || rooms.length === 0) {
            return res.status(404).json({
                msgBody: "Không tìm thấy phòng nào cho khách sạn này!",
                msgError: true
            });
        }

        const roomIds = rooms.map(room => room._id);

        // Lấy tất cả chi tiết tiện nghi của các phòng này
        const amenityDetails = await AmenityDetails.find({ 
            maPhong: { $in: roomIds },
            trangThai: true 
        })
        .populate({
            path: "maTienNghi",
            select: "tenTienNghi icon thuTu moTa maNhomTienNghi",
            populate: {
                path: "maNhomTienNghi",
                select: "tenNhomTienNghi icon thuTuNhom"
            }
        });

        if (!amenityDetails || amenityDetails.length === 0) {
            return res.status(404).json({
                msgBody: "Không tìm thấy tiện nghi nào cho khách sạn này!",
                msgError: true
            });
        }

        // Nhóm tiện nghi và đếm số phòng có mỗi tiện nghi
        const amenityMap = new Map();
        
        amenityDetails.forEach(detail => {
            const amenity = detail.maTienNghi;
            if (!amenity) return;

            const amenityId = amenity._id.toString();
            
            if (!amenityMap.has(amenityId)) {
                amenityMap.set(amenityId, {
                    _id: amenity._id,
                    tenTienNghi: amenity.tenTienNghi,
                    icon: amenity.icon,
                    thuTu: amenity.thuTu,
                    moTa: amenity.moTa,
                    tenNhomTienNghi: amenity.maNhomTienNghi?.tenNhomTienNghi || "",
                    iconNhom: amenity.maNhomTienNghi?.icon || "",
                    thuTuNhom: amenity.maNhomTienNghi?.thuTuNhom || 999,
                    soPhongCo: new Set(),
                    tongSoLuong: 0
                });
            }

            const amenityData = amenityMap.get(amenityId);
            amenityData.soPhongCo.add(detail.maPhong.toString());
            amenityData.tongSoLuong += detail.soLuong;
        });

        // Chuyển Set thành số và tính phần trăm
        const totalRooms = rooms.length;
        const amenitiesArray = Array.from(amenityMap.values()).map(amenity => ({
            ...amenity,
            soPhongCoTienNghi: amenity.soPhongCo.size,
            tongSoPhong: totalRooms,
            phanTramPhong: Math.round((amenity.soPhongCo.size / totalRooms) * 100),
            soPhongCo: undefined // Xóa Set object
        }));

        // Lọc chỉ những tiện nghi có ít nhất 25% phòng
        const filteredAmenities = amenitiesArray.filter(amenity => 
            amenity.phanTramPhong >= 25
        );

        // Tính priority score và sort
        const prioritizedAmenities = filteredAmenities.map(amenity => ({
            ...amenity,
            priorityScore: (10 - amenity.thuTuNhom) * 20 + amenity.phanTramPhong + (10 - amenity.thuTu)
        }))
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, 6); // Lấy top 6

        // Format kết quả trả về
        const keyAmenities = prioritizedAmenities.map(amenity => ({
            _id: amenity._id,
            tenTienNghi: amenity.tenTienNghi,
            icon: amenity.icon,
            moTa: amenity.moTa,
            tenNhomTienNghi: amenity.tenNhomTienNghi,
            iconNhom: amenity.iconNhom,
            soPhongCoTienNghi: amenity.soPhongCoTienNghi,
            tongSoPhong: amenity.tongSoPhong,
            // phanTramPhong: amenity.phanTramPhong
        }));

        return res.status(200).json({
            message: "Lấy danh sách tiện nghi quan trọng thành công!",
            keyAmenities: keyAmenities,
            count: keyAmenities.length
        });

    } catch (error) {
        console.error("Lỗi khi lấy tiện nghi quan trọng:", error);
        return res.status(500).json({
            msgBody: "Lỗi máy chủ khi lấy danh sách tiện nghi!",
            msgError: true,
            messageError: error.message
        });
    }
});

//API LẤY TẤT CẢ TIỆN NGHI ĐƯỢC NHÓM THEO LOẠI 
amenitiesRouter.get("/grouped-amenities/:hotelId", async (req, res) => {
    const { hotelId } = req.params;
    
    try {
        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            return res.status(400).json({
                msgBody: "Mã khách sạn không hợp lệ!",
                msgError: true
            });
        }

        // Lấy tất cả phòng của khách sạn
        const rooms = await Room.find({ maKhachsan: hotelId });
        
        if (!rooms || rooms.length === 0) {
            return res.status(404).json({
                msgBody: "Không tìm thấy phòng nào cho khách sạn này!",
                msgError: true
            });
        }

        const roomIds = rooms.map(room => room._id);

        // Lấy chi tiết tiện nghi với populate đầy đủ
        const amenityDetails = await AmenityDetails.find({ 
            maPhong: { $in: roomIds },
            trangThai: true 
        })
        .populate({
            path: "maTienNghi",
            select: "tenTienNghi icon thuTu moTa maNhomTienNghi",
            populate: {
                path: "maNhomTienNghi",
                select: "tenNhomTienNghi icon thuTuNhom moTa"
            }
        });

        if (!amenityDetails || amenityDetails.length === 0) {
            return res.status(404).json({
                msgBody: "Không tìm thấy tiện nghi nào cho khách sạn này!",
                msgError: true
            });
        }

        // Nhóm theo category
        const categoryMap = new Map();

        amenityDetails.forEach(detail => {
            const amenity = detail.maTienNghi;
            const category = amenity?.maNhomTienNghi;
            
            if (!amenity || !category) return;

            const categoryId = category._id.toString();
            const amenityId = amenity._id.toString();

            // Tạo category nếu chưa có
            if (!categoryMap.has(categoryId)) {
                categoryMap.set(categoryId, {
                    _id: category._id,
                    categoryName: category.tenNhomTienNghi,
                    categoryIcon: category.icon,
                    categoryOrder: category.thuTuNhom,
                    description: category.moTa,
                    amenities: new Map()
                });
            }

            const categoryData = categoryMap.get(categoryId);
            
            // Tạo amenity trong category nếu chưa có
            if (!categoryData.amenities.has(amenityId)) {
                categoryData.amenities.set(amenityId, {
                    _id: amenity._id,
                    tenTienNghi: amenity.tenTienNghi,
                    icon: amenity.icon,
                    thuTu: amenity.thuTu,
                    moTa: amenity.moTa,
                    soPhongCo: new Set(),
                    tongSoLuong: 0
                });
            }

            const amenityData = categoryData.amenities.get(amenityId);
            amenityData.soPhongCo.add(detail.maPhong.toString());
            amenityData.tongSoLuong += detail.soLuong;
        });

        // Chuyển đổi Map thành Array và format
        const nhomTienNghi = Array.from(categoryMap.values()).map(category => ({
            _id: category._id,
            tenNhomTienNghi: category.categoryName,
            icon: category.categoryIcon,
            thuTuNhom: category.categoryOrder,
            moTa:category.description,
            tienNghi: Array.from(category.amenities.values()).map(amenity => ({
                _id: amenity._id,
                tenTienNghi: amenity.tenTienNghi,
                icon: amenity.icon,
                thuTu: amenity.thuTu,
                moTa: amenity.moTa,
                soPhongCo: amenity.soPhongCo.size,
                tongSoLuong: amenity.tongSoLuong
            }))
            .sort((a, b) => a.thuTu - b.thuTu) // Sort amenities theo thứ tự
        }))
        .sort((a, b) => a.categoryOrder - b.categoryOrder) // Sort categories theo thứ tự
        .slice(0, 12); // Giới hạn 12 categories

        // Đếm tổng số tiện nghi
        const totalAmenities = nhomTienNghi.reduce((total, category) => {
            return total + category.tienNghi.length;
        }, 0);

        return res.status(200).json({
            message: "Lấy danh sách tiện nghi theo nhóm thành công!",
            groupedAmenities: nhomTienNghi,
            categoriesCount: nhomTienNghi.length,
            totalAmenities: totalAmenities
        });

    } catch (error) {
        console.error("Lỗi khi lấy tiện nghi theo nhóm:", error);
        return res.status(500).json({
            msgBody: "Lỗi máy chủ khi lấy danh sách tiện nghi theo nhóm!",
            msgError: true,
            messageError: error.message
        });
    }
});

module.exports = amenitiesRouter;
