const express = require("express");
const Room = require("../Model/Room/Room");
const RoomType = require("../Model/RoomType/RoomType");
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
            .populate({
                path: 'maTienNghi',
                select: 'tenTienNghi icon thuTu moTa maNhomTienNghi', // ✅ Thêm maNhomTienNghi
                populate: {
                    path: 'maNhomTienNghi',
                    select: 'tenNhomTienNghi icon'
                }
            })
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
            amenityType: amenity.maTienNghi.maNhomTienNghi?.tenNhomTienNghi || "Unknown", // ✅ Sửa: thêm null check
            amenityIcon: amenity.maTienNghi.icon,
            quantity: amenity.soLuong,
            description: amenity.moTa
        }));

        return res.status(200).json(result);

    } catch (error) {
        console.error("Error fetching room amenities:", error); // ✅ Thêm logging
        return res.status(500).json({
            msgBody: "Lỗi truy xuất tiện nghi phòng!",
            msgError: true,
            messageError: error.message
        });
    }
});

// API LẤY TIỆN NGHI QUAN TRỌNG CỦA KHÁCH SẠN
// amenitiesRouter.get("/key-amenities/:hotelId", async (req, res) => {
//     const { hotelId } = req.params;

//     try {
//         // Validate ObjectId
//         if (!mongoose.Types.ObjectId.isValid(hotelId)) {
//             return res.status(400).json({
//                 msgBody: "Mã khách sạn không hợp lệ!",
//                 msgError: true
//             });
//         }

//         // Lấy tất cả loại phòng của khách sạn
//         const roomTypes = await RoomType.find({ maKhachSan: hotelId });
//         console.log("Cac loai phong trong khach san: ",roomTypes);

//         if (!roomTypes || roomTypes.length === 0) {
//             return res.status(404).json({
//                 msgBody: "Khách sạn này chưa có loại phòng nào!",
//                 msgError: true
//             });
//         }

//         // ✅ FIX: dùng $in với danh sách _id
//         const roomTypeIds = roomTypes.map(rt => rt._id);
//         const rooms = await Room.find({ maLoaiPhong: { $in: roomTypeIds } });

//         if (!rooms || rooms.length === 0) {
//             return res.status(404).json({
//                 msgBody: "Khách sạn này chưa có phòng nào!",
//                 msgError: true
//             });
//         }

//         const roomIds = rooms.map(room => room._id);

//         // Lấy tất cả chi tiết tiện nghi của các phòng này
//         const amenityDetails = await AmenityDetails.find({
//             maPhong: { $in: roomIds },
//             trangThai: true
//         }).populate({
//             path: "maTienNghi",
//             select: "tenTienNghi icon thuTu moTa maNhomTienNghi",
//             populate: {
//                 path: "maNhomTienNghi",
//                 select: "tenNhomTienNghi icon thuTuNhom maKhachSan"
//             }
//         });

//         // ✅ Lọc tiện nghi thuộc đúng khách sạn
//         const amenityDetailsFiltered = amenityDetails.filter(detail => {
//             const amenity = detail.maTienNghi;
//             const category = amenity?.maNhomTienNghi;
//             return category?.maKhachSan?.toString() === hotelId;
//         });

//         if (!amenityDetailsFiltered || amenityDetailsFiltered.length === 0) {
//             return res.status(404).json({
//                 msgBody: "Không tìm thấy tiện nghi nào cho khách sạn này!",
//                 msgError: true
//             });
//         }

//         // Nhóm tiện nghi và đếm số phòng có mỗi tiện nghi
//         const amenityMap = new Map();

//         amenityDetailsFiltered.forEach(detail => {
//             const amenity = detail.maTienNghi;
//             if (!amenity) return;

//             const amenityId = amenity._id.toString();

//             if (!amenityMap.has(amenityId)) {
//                 amenityMap.set(amenityId, {
//                     _id: amenity._id,
//                     tenTienNghi: amenity.tenTienNghi,
//                     icon: amenity.icon,
//                     thuTu: amenity.thuTu ?? 999,
//                     moTa: amenity.moTa,
//                     tenNhomTienNghi: amenity.maNhomTienNghi?.tenNhomTienNghi || "",
//                     iconNhom: amenity.maNhomTienNghi?.icon || "",
//                     thuTuNhom: amenity.maNhomTienNghi?.thuTuNhom ?? 999,
//                     soPhongCo: new Set(),
//                     tongSoLuong: 0
//                 });
//             }

//             const amenityData = amenityMap.get(amenityId);
//             amenityData.soPhongCo.add(detail.maPhong.toString());
//             amenityData.tongSoLuong += detail.soLuong || 1;
//         });

//         const totalRooms = rooms.length;
//         const amenitiesArray = Array.from(amenityMap.values()).map(amenity => ({
//             ...amenity,
//             soPhongCoTienNghi: amenity.soPhongCo.size,
//             tongSoPhong: totalRooms,
//             phanTramPhong: Math.round((amenity.soPhongCo.size / totalRooms) * 100),
//             soPhongCo: undefined // Xóa Set object
//         }));

//         // Chỉ lấy các tiện nghi có ở >= 25% phòng
//         const filteredAmenities = amenitiesArray.filter(amenity =>
//             amenity.phanTramPhong >= 25
//         );

//         // Sắp xếp theo độ ưu tiên
//         const prioritizedAmenities = filteredAmenities.map(amenity => ({
//             ...amenity,
//             priorityScore:
//                 (10 - (amenity.thuTuNhom ?? 5)) * 20 +
//                 amenity.phanTramPhong +
//                 (10 - (amenity.thuTu ?? 5))
//         }))
//         .sort((a, b) => b.priorityScore - a.priorityScore)
//         .slice(0, 6); // Top 6 tiện nghi

//         // Kết quả trả về
//         const keyAmenities = prioritizedAmenities.map(amenity => ({
//             _id: amenity._id,
//             tenTienNghi: amenity.tenTienNghi,
//             icon: amenity.icon,
//             moTa: amenity.moTa,
//             tenNhomTienNghi: amenity.tenNhomTienNghi,
//             iconNhom: amenity.iconNhom,
//             soPhongCoTienNghi: amenity.soPhongCoTienNghi,
//             tongSoPhong: amenity.tongSoPhong,
//             // phanTramPhong: amenity.phanTramPhong
//         }));

//         return res.status(200).json({
//             message: "Lấy danh sách tiện nghi quan trọng thành công!",
//             keyAmenities: keyAmenities,
//             count: keyAmenities.length
//         });

//     } catch (error) {
//         console.error("Lỗi khi lấy tiện nghi quan trọng:", error);
//         return res.status(500).json({
//             msgBody: "Lỗi máy chủ khi lấy danh sách tiện nghi!",
//             msgError: true,
//             messageError: error.message
//         });
//     }
// });
amenitiesRouter.get("/key-amenities/:hotelId", async (req, res) => {
    const { hotelId } = req.params;
    
    try {
        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            return res.status(400).json({
                msgBody: "Mã khách sạn không hợp lệ!",
                msgError: true
            });
        }

        // 1. Lấy nhóm tiện nghi của khách sạn
        const amenityGroups = await AmenityCategory.find({ maKhachSan: hotelId });
        if (!amenityGroups.length) {
            return res.status(404).json({
                msgBody: "Khách sạn chưa có nhóm tiện nghi!",
                msgError: true
            });
        }

        const groupIds = amenityGroups.map(g => g._id);

        // 2. Lấy tiện nghi của khách sạn và populate nhóm
        const amenities = await Amenities.find({ 
            maNhomTienNghi: { $in: groupIds }
        }).populate('maNhomTienNghi', 'tenNhomTienNghi icon thuTuNhom');

        if (!amenities.length) {
            return res.status(404).json({
                msgBody: "Khách sạn chưa có tiện nghi nào!",
                msgError: true
            });
        }

        // 3. Lấy phòng để tính tổng số phòng
        const roomTypes = await RoomType.find({ maKhachSan: hotelId });
        const rooms = roomTypes.length > 0 ? 
            await Room.find({ maLoaiPhong: { $in: roomTypes.map(rt => rt._id) } }) : [];

        // 4. Sắp xếp theo độ ưu tiên và lấy top 6-8
        const keyAmenities = amenities
            .map(amenity => ({
                _id: amenity._id,
                tenTienNghi: amenity.tenTienNghi,
                icon: amenity.icon,
                moTa: amenity.moTa,
                tenNhomTienNghi: amenity.maNhomTienNghi?.tenNhomTienNghi || "",
                iconNhom: amenity.maNhomTienNghi?.icon || "",
                thuTu: amenity.thuTu || 999,
                thuTuNhom: amenity.maNhomTienNghi?.thuTuNhom || 999,
                // Tính priority score: nhóm ưu tiên cao + tiện nghi ưu tiên cao
                priorityScore: (1000 - (amenity.maNhomTienNghi?.thuTuNhom || 999) * 100) + (1000 - (amenity.thuTu || 999))
            }))
            .sort((a, b) => b.priorityScore - a.priorityScore) // Sắp xếp theo priority
            .slice(0, 6) // Lấy top 6
            .map(amenity => ({
                _id: amenity._id,
                tenTienNghi: amenity.tenTienNghi,
                icon: amenity.icon,
                moTa: amenity.moTa,
                tenNhomTienNghi: amenity.tenNhomTienNghi,
                iconNhom: amenity.iconNhom,
                soPhongCoTienNghi: rooms.length, // Giả định tất cả phòng đều có
                tongSoPhong: rooms.length
            }));

        return res.status(200).json({
            message: "Lấy danh sách tiện nghi quan trọng thành công!",
            keyAmenities: keyAmenities,
            count: keyAmenities.length,
            hotelInfo: {
                hotelId: hotelId,
                totalRooms: rooms.length,
                totalAmenities: amenities.length
            }
        });

    } catch (error) {
        console.error("❌ Error in key amenities:", error);
        return res.status(500).json({
            msgBody: "Lỗi máy chủ khi lấy tiện nghi quan trọng!",
            msgError: true,
            messageError: error.message
        });
    }
});



//API LẤY TẤT CẢ TIỆN NGHI ĐƯỢC NHÓM THEO LOẠI 
// amenitiesRouter.get("/grouped-amenities/:hotelId", async (req, res) => {
//     const { hotelId } = req.params;

//     try {
//         if (!mongoose.Types.ObjectId.isValid(hotelId)) {
//             return res.status(400).json({
//                 msgBody: "Mã khách sạn không hợp lệ!",
//                 msgError: true
//             });
//         }

//         // 1. Lấy loại phòng thuộc khách sạn
//         const roomTypes = await RoomType.find({ maKhachSan: hotelId });
//         if (!roomTypes || roomTypes.length === 0) {
//             return res.status(404).json({
//                 msgBody: "Khách sạn này chưa có loại phòng nào!",
//                 msgError: true
//             });
//         }

//         const roomTypeIds = roomTypes.map(rt => rt._id);

//         // 2. Lấy các phòng thuộc các loại phòng trên
//         const rooms = await Room.find({ maLoaiPhong: { $in: roomTypeIds } });
//         if (!rooms || rooms.length === 0) {
//             return res.status(404).json({
//                 msgBody: "Không tìm thấy phòng nào cho khách sạn này!",
//                 msgError: true
//             });
//         }

//         const roomIds = rooms.map(r => r._id);

//         // 3. Lấy chi tiết tiện nghi của các phòng, populate tiện nghi và nhóm
//         const amenityDetails = await AmenityDetails.find({
//             maPhong: { $in: roomIds },
//             trangThai: true
//         }).populate({
//             path: "maTienNghi",
//             select: "tenTienNghi icon thuTu moTa maNhomTienNghi",
//             populate: {
//                 path: "maNhomTienNghi",
//                 select: "tenNhomTienNghi icon thuTuNhom moTa maKhachSan"
//             }
//         });

//         if (!amenityDetails || amenityDetails.length === 0) {
//             return res.status(404).json({
//                 msgBody: "Không tìm thấy tiện nghi nào cho khách sạn này!",
//                 msgError: true
//             });
//         }

//         // 4. Lọc đúng nhóm tiện nghi của khách sạn này
//         const filteredDetails = amenityDetails.filter(detail => {
//             return (
//                 detail?.maTienNghi?.maNhomTienNghi?.maKhachSan?.toString() === hotelId
//             );
//         });

//         const categoryMap = new Map();

//         filteredDetails.forEach(detail => {
//             const amenity = detail.maTienNghi;
//             const category = amenity?.maNhomTienNghi;

//             if (!amenity || !category) return;

//             const categoryId = category._id.toString();
//             const amenityId = amenity._id.toString();

//             if (!categoryMap.has(categoryId)) {
//                 categoryMap.set(categoryId, {
//                     _id: category._id,
//                     tenNhomTienNghi: category.tenNhomTienNghi,
//                     icon: category.icon,
//                     thuTuNhom: category.thuTuNhom || 999,
//                     moTa: category.moTa,
//                     tienNghi: new Map()
//                 });
//             }

//             const categoryData = categoryMap.get(categoryId);

//             if (!categoryData.tienNghi.has(amenityId)) {
//                 categoryData.tienNghi.set(amenityId, {
//                     _id: amenity._id,
//                     tenTienNghi: amenity.tenTienNghi,
//                     icon: amenity.icon,
//                     thuTu: amenity.thuTu || 999,
//                     moTa: amenity.moTa,
//                     soPhongCo: new Set(),
//                     tongSoLuong: 0
//                 });
//             }

//             const amenityData = categoryData.tienNghi.get(amenityId);
//             amenityData.soPhongCo.add(detail.maPhong.toString());
//             amenityData.tongSoLuong += detail.soLuong || 1;
//         });

//         // Chuyển map → array và sắp xếp
//         const nhomTienNghi = Array.from(categoryMap.values())
//             .map(category => ({
//                 _id: category._id,
//                 tenNhomTienNghi: category.tenNhomTienNghi,
//                 icon: category.icon,
//                 thuTuNhom: category.thuTuNhom,
//                 moTa: category.moTa,
//                 tienNghi: Array.from(category.tienNghi.values())
//                     .map(amenity => ({
//                         _id: amenity._id,
//                         tenTienNghi: amenity.tenTienNghi,
//                         icon: amenity.icon,
//                         thuTu: amenity.thuTu,
//                         moTa: amenity.moTa,
//                         soPhongCo: amenity.soPhongCo.size,
//                         tongSoLuong: amenity.tongSoLuong
//                     }))
//                     .sort((a, b) => a.thuTu - b.thuTu)
//             }))
//             .sort((a, b) => a.thuTuNhom - b.thuTuNhom)
//             .slice(0, 12);

//         const totalAmenities = nhomTienNghi.reduce((sum, group) => sum + group.tienNghi.length, 0);

//         return res.status(200).json({
//             message: "Lấy danh sách tiện nghi theo nhóm thành công!",
//             groupedAmenities: nhomTienNghi,
//             categoriesCount: nhomTienNghi.length,
//             totalAmenities
//         });

//     } catch (error) {
//         console.error("Lỗi khi lấy tiện nghi theo nhóm:", error);
//         return res.status(500).json({
//             msgBody: "Lỗi máy chủ khi lấy danh sách tiện nghi theo nhóm!",
//             msgError: true,
//             messageError: error.message
//         });
//     }
// });


amenitiesRouter.get("/grouped-amenities/:hotelId", async (req, res) => {
    const { hotelId } = req.params;

    try {
        console.log("🏨 Processing hotel:", hotelId);
        
        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            return res.status(400).json({
                msgBody: "Mã khách sạn không hợp lệ!",
                msgError: true
            });
        }

        // BƯỚC 1: Lấy NHÓM TIỆN NGHI của khách sạn này
        console.log("🔍 Step 1: Tìm nhóm tiện nghi của khách sạn...");
        const amenityGroups = await AmenityCategory.find({ 
            maKhachSan: hotelId 
        }).sort({ thuTuNhom: 1 });

        if (!amenityGroups || amenityGroups.length === 0) {
            return res.status(404).json({
                msgBody: "Nhóm tiện nghi này chưa có tiện nghi nào!",
                msgError: true,
                debug: {
                    hotelId: hotelId,
                    message: "Cần tạo nhóm tiện nghi cho khách sạn này trước"
                }
            });
        }

        console.log("✅ Found", amenityGroups.length, "amenity groups for hotel");
        const groupIds = amenityGroups.map(group => group._id);

        // BƯỚC 2: Lấy TIỆN NGHI thuộc các nhóm này
        console.log("🔍 Step 2: Tìm tiện nghi trong các nhóm...");
        const amenities = await Amenities.find({ 
            maNhomTienNghi: { $in: groupIds }
        }).sort({ thuTu: 1 });

        console.log("✅ Found", amenities.length, "amenities in groups");

        // BƯỚC 3: Lấy phòng của khách sạn để tính số lượng
        const roomTypes = await RoomType.find({ maKhachSan: hotelId });
        const rooms = roomTypes.length > 0 ? 
            await Room.find({ maLoaiPhong: { $in: roomTypes.map(rt => rt._id) } }) : [];
        
        console.log("🏠 Found", rooms.length, "rooms for counting");

        // BƯỚC 4: Lấy chi tiết tiện nghi để đếm
        const amenityDetails = rooms.length > 0 ? 
            await AmenityDetails.find({
                maPhong: { $in: rooms.map(r => r._id) },
                trangThai: true
            }) : [];

        console.log("📊 Found", amenityDetails.length, "amenity details");

        // BƯỚC 5: Nhóm dữ liệu theo category
        const result = amenityGroups.map(group => {
            // Lấy tiện nghi thuộc nhóm này
            const groupAmenities = amenities.filter(amenity => 
                amenity.maNhomTienNghi?.toString() === group._id.toString()
            );

            // Tính số phòng có mỗi tiện nghi
            const amenitiesWithCounts = groupAmenities.map(amenity => {
                const count = amenityDetails.filter(detail => 
                    detail.maTienNghi?.toString() === amenity._id.toString()
                ).length;

                const totalQuantity = amenityDetails
                    .filter(detail => detail.maTienNghi?.toString() === amenity._id.toString())
                    .reduce((sum, detail) => sum + (detail.soLuong || 1), 0);

                return {
                    _id: amenity._id,
                    tenTienNghi: amenity.tenTienNghi,
                    icon: amenity.icon,
                    thuTu: amenity.thuTu || 999,
                    moTa: amenity.moTa,
                    soPhongCo: count,
                    tongSoLuong: totalQuantity
                };
            });

            return {
                _id: group._id,
                tenNhomTienNghi: group.tenNhomTienNghi,
                icon: group.icon,
                thuTuNhom: group.thuTuNhom || 999,
                moTa: group.moTa,
                tienNghi: amenitiesWithCounts.sort((a, b) => a.thuTu - b.thuTu)
            };
        });

        const totalAmenities = result.reduce((sum, group) => sum + group.tienNghi.length, 0);

        console.log("✅ SUCCESS: Returning", result.length, "groups with", totalAmenities, "amenities");

        return res.status(200).json({
            message: "Lấy danh sách tiện nghi theo nhóm thành công!",
            groupedAmenities: result,
            categoriesCount: result.length,
            totalAmenities,
            hotelInfo: {
                hotelId: hotelId,
                totalRooms: rooms.length,
                totalRoomTypes: roomTypes.length
            }
        });

    } catch (error) {
        console.error("❌ Error in grouped amenities:", error);
        return res.status(500).json({
            msgBody: "Lỗi máy chủ khi lấy danh sách tiện nghi theo nhóm!",
            msgError: true,
            messageError: error.message
        });
    }
});




module.exports = amenitiesRouter;
