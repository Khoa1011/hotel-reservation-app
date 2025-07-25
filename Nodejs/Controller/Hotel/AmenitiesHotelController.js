const express = require("express");
const mongoose = require("mongoose");
const authorizeRoles = require('../../middleware/roleAuth');
const amenitiesHotelRouter = express.Router();

const Amenities = require("../../Model/Amenities/Amenities");
const AmenityDetails = require("../../Model/Amenities/AmenityDetails");
const Room = require("../../Model/Room/Room");
const RoomType = require("../../Model/RoomType/RoomType");

// 1. Lấy tất cả tiện nghi có sẵn (để admin chọn)
amenitiesHotelRouter.get("/hotelowner/amenities", 
    authorizeRoles("chuKhachSan"), 
    async (req, res) => {
        try {
            const { category, search } = req.query;

            // ✅ SỬA: Tạo query filter đơn giản
            const query = {};
            
            // ✅ SỬA: Lọc theo category nếu có (sử dụng maNhomTienNghi)
            if (category && category !== 'all') {
                query.maNhomTienNghi = category;
            }
            
            // Search theo tên tiện nghi
            if (search) {
                query.tenTienNghi = { $regex: search, $options: 'i' };
            }

            // ✅ SỬA: Lấy tất cả tiện nghi và populate nhóm tiện nghi
            const amenities = await Amenities.find(query)
                .populate('maNhomTienNghi', 'tenNhomTienNghi icon thuTuNhom')
                .sort({ thuTu: 1 })
                .lean();

            console.log(`✅ Found ${amenities.length} amenities`);

            // Group by category nếu cần
            const categorizedAmenities = {};
            amenities.forEach(amenity => {
                const categoryId = amenity.maNhomTienNghi?._id?.toString() || 'other';
                const categoryName = amenity.maNhomTienNghi?.tenNhomTienNghi || 'Khác';
                
                if (!categorizedAmenities[categoryId]) {
                    categorizedAmenities[categoryId] = {
                        name: categoryName,
                        icon: amenity.maNhomTienNghi?.icon,
                        amenities: []
                    };
                }
                categorizedAmenities[categoryId].amenities.push(amenity);
            });

            res.status(200).json({
                success: true,
                message: "Lấy danh sách tiện nghi thành công",
                data: {
                    amenities,
                    categorized: categorizedAmenities,
                    total: amenities.length
                }
            });

        } catch (error) {
            console.error("Lỗi lấy danh sách tiện nghi:", error);
            res.status(500).json({
                success: false,
                message: "Lỗi server khi lấy danh sách tiện nghi",
                error: error.message
            });
        }
    }
);

// 2. Lấy tiện nghi của một phòng cụ thể
amenitiesHotelRouter.get("/hotelowner/room-amenities/:roomId", 
    authorizeRoles("chuKhachSan"), 
    async (req, res) => {
        try {
            const { roomId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(roomId)) {
                return res.status(400).json({
                    success: false,
                    message: "ID phòng không hợp lệ"
                });
            }

            // Kiểm tra phòng tồn tại
            const room = await Room.findById(roomId)
                .populate({
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

            // ✅ SỬA: Lấy tiện nghi của phòng với populate đúng
            const roomAmenities = await AmenityDetails.find({ maPhong: roomId })
                .populate({
                    path: 'maTienNghi',
                    populate: {
                        path: 'maNhomTienNghi',
                        select: 'tenNhomTienNghi icon'
                    }
                })
                .sort({ 'maTienNghi.thuTu': 1 });

            console.log(`✅ Found ${roomAmenities.length} amenities for room ${room.soPhong}`);

            // Group theo category
            const categorizedRoomAmenities = {};
            roomAmenities.forEach(detail => {
                const amenity = detail.maTienNghi;
                const categoryId = amenity.maNhomTienNghi?._id?.toString() || 'other';
                const categoryName = amenity.maNhomTienNghi?.tenNhomTienNghi || 'Khác';
                
                if (!categorizedRoomAmenities[categoryId]) {
                    categorizedRoomAmenities[categoryId] = {
                        categoryName: categoryName,
                        amenities: []
                    };
                }
                
                categorizedRoomAmenities[categoryId].amenities.push({
                    detailId: detail._id,
                    amenityId: amenity._id,
                    tenTienNghi: amenity.tenTienNghi,
                    icon: amenity.icon,
                    soLuong: detail.soLuong,
                    trangThai: detail.trangThai,
                    moTa: detail.moTa
                });
            });

            res.status(200).json({
                success: true,
                message: "Lấy tiện nghi phòng thành công",
                data: {
                    room: {
                        _id: room._id,
                        soPhong: room.soPhong,
                        tenLoaiPhong: room.maLoaiPhong?.tenLoaiPhong,
                        tenKhachSan: room.maLoaiPhong?.maKhachSan?.tenKhachSan
                    },
                    amenities: roomAmenities,
                    categorized: categorizedRoomAmenities,
                    total: roomAmenities.length
                }
            });

        } catch (error) {
            console.error("Lỗi lấy tiện nghi phòng:", error);
            res.status(500).json({
                success: false,
                message: "Lỗi server khi lấy tiện nghi phòng",
                error: error.message
            });
        }
    }
);

// 3. Thêm tiện nghi vào phòng
amenitiesHotelRouter.post("/hotelowner/room-amenities/:roomId", 
    authorizeRoles("chuKhachSan"), 
    async (req, res) => {
        try {
            const { roomId } = req.params;
            const { maTienNghi, soLuong = 1, trangThai = true, moTa = "" } = req.body;

            // Validation
            if (!mongoose.Types.ObjectId.isValid(roomId)) {
                return res.status(400).json({
                    success: false,
                    message: "ID phòng không hợp lệ"
                });
            }

            if (!mongoose.Types.ObjectId.isValid(maTienNghi)) {
                return res.status(400).json({
                    success: false,
                    message: "ID tiện nghi không hợp lệ"
                });
            }

            // Kiểm tra phòng và tiện nghi tồn tại
            const [room, amenity] = await Promise.all([
                Room.findById(roomId),
                Amenities.findById(maTienNghi)
            ]);

            if (!room) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy phòng"
                });
            }

            if (!amenity) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy tiện nghi"
                });
            }

            // Kiểm tra tiện nghi đã tồn tại trong phòng chưa
            const existingDetail = await AmenityDetails.findOne({
                maPhong: roomId,
                maTienNghi: maTienNghi
            });

            if (existingDetail) {
                return res.status(400).json({
                    success: false,
                    message: `Tiện nghi "${amenity.tenTienNghi}" đã có trong phòng ${room.soPhong}`
                });
            }

            // Tạo chi tiết tiện nghi mới
            const newAmenityDetail = new AmenityDetails({
                maPhong: roomId,
                maTienNghi: maTienNghi,
                soLuong: parseInt(soLuong),
                trangThai,
                moTa
            });

            await newAmenityDetail.save();

            // Populate thông tin để trả về
            await newAmenityDetail.populate('maTienNghi');

            console.log(`✅ Added amenity "${amenity.tenTienNghi}" to room ${room.soPhong}`);

            res.status(201).json({
                success: true,
                message: `Thêm tiện nghi "${amenity.tenTienNghi}" vào phòng ${room.soPhong} thành công!`,
                data: newAmenityDetail
            });

        } catch (error) {
            console.error("Lỗi thêm tiện nghi vào phòng:", error);
            res.status(500).json({
                success: false,
                message: "Lỗi server khi thêm tiện nghi vào phòng",
                error: error.message
            });
        }
    }
);

// 4. Thêm nhiều tiện nghi vào phòng (bulk add)
amenitiesHotelRouter.post("/hotelowner/room-amenities-bulk/:roomId", 
    authorizeRoles("chuKhachSan"), 
    async (req, res) => {
        try {
            const { roomId } = req.params;
            const { amenities } = req.body; // Array of {maTienNghi, soLuong, trangThai, moTa}

            if (!mongoose.Types.ObjectId.isValid(roomId)) {
                return res.status(400).json({
                    success: false,
                    message: "ID phòng không hợp lệ"
                });
            }

            if (!Array.isArray(amenities) || amenities.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Danh sách tiện nghi không hợp lệ"
                });
            }

            // Kiểm tra phòng tồn tại
            const room = await Room.findById(roomId);
            if (!room) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy phòng"
                });
            }

            // Lấy danh sách tiện nghi hiện tại của phòng
            const existingAmenities = await AmenityDetails.find({ maPhong: roomId })
                .select('maTienNghi');
            const existingAmenityIds = existingAmenities.map(a => a.maTienNghi.toString());

            const results = {
                added: [],
                skipped: [],
                failed: []
            };

            // Xử lý từng tiện nghi
            for (const amenityData of amenities) {
                try {
                    const { maTienNghi, soLuong = 1, trangThai = true, moTa = "" } = amenityData;

                    // Kiểm tra đã tồn tại
                    if (existingAmenityIds.includes(maTienNghi)) {
                        results.skipped.push({
                            maTienNghi,
                            reason: "Đã tồn tại trong phòng"
                        });
                        continue;
                    }

                    // Kiểm tra tiện nghi hợp lệ
                    const amenity = await Amenities.findById(maTienNghi);
                    if (!amenity) {
                        results.failed.push({
                            maTienNghi,
                            reason: "Tiện nghi không tồn tại"
                        });
                        continue;
                    }

                    // Tạo chi tiết tiện nghi
                    const amenityDetail = new AmenityDetails({
                        maPhong: roomId,
                        maTienNghi,
                        soLuong: parseInt(soLuong),
                        trangThai,
                        moTa
                    });

                    await amenityDetail.save();
                    await amenityDetail.populate('maTienNghi');

                    results.added.push({
                        detailId: amenityDetail._id,
                        tenTienNghi: amenity.tenTienNghi,
                        soLuong: amenityDetail.soLuong
                    });

                } catch (error) {
                    results.failed.push({
                        maTienNghi: amenityData.maTienNghi,
                        reason: error.message
                    });
                }
            }

            console.log(`✅ Bulk added amenities to room ${room.soPhong}:`, {
                added: results.added.length,
                skipped: results.skipped.length,
                failed: results.failed.length
            });

            res.status(200).json({
                success: true,
                message: `Thêm tiện nghi vào phòng ${room.soPhong} thành công`,
                data: results
            });

        } catch (error) {
            console.error("Lỗi thêm nhiều tiện nghi vào phòng:", error);
            res.status(500).json({
                success: false,
                message: "Lỗi server khi thêm nhiều tiện nghi vào phòng",
                error: error.message
            });
        }
    }
);

// 5. Cập nhật tiện nghi trong phòng
amenitiesHotelRouter.put("/hotelowner/room-amenity-detail/:detailId", 
    authorizeRoles("chuKhachSan"), 
    async (req, res) => {
        try {
            const { detailId } = req.params;
            const { soLuong, trangThai, moTa } = req.body;

            if (!mongoose.Types.ObjectId.isValid(detailId)) {
                return res.status(400).json({
                    success: false,
                    message: "ID chi tiết tiện nghi không hợp lệ"
                });
            }

            const updateData = {};
            if (soLuong !== undefined) updateData.soLuong = parseInt(soLuong);
            if (trangThai !== undefined) updateData.trangThai = trangThai;
            if (moTa !== undefined) updateData.moTa = moTa;

            const updatedDetail = await AmenityDetails.findByIdAndUpdate(
                detailId,
                updateData,
                { new: true, runValidators: true }
            ).populate('maTienNghi').populate('maPhong', 'soPhong');

            if (!updatedDetail) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy chi tiết tiện nghi"
                });
            }

            console.log(`✅ Updated amenity detail for room ${updatedDetail.maPhong.soPhong}`);

            res.status(200).json({
                success: true,
                message: "Cập nhật tiện nghi thành công",
                data: updatedDetail
            });

        } catch (error) {
            console.error("Lỗi cập nhật tiện nghi:", error);
            res.status(500).json({
                success: false,
                message: "Lỗi server khi cập nhật tiện nghi",
                error: error.message
            });
        }
    }
);

// 6. Xóa tiện nghi khỏi phòng
amenitiesHotelRouter.delete("/hotelowner/room-amenity-detail/:detailId", 
    authorizeRoles("chuKhachSan"), 
    async (req, res) => {
        try {
            const { detailId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(detailId)) {
                return res.status(400).json({
                    success: false,
                    message: "ID chi tiết tiện nghi không hợp lệ"
                });
            }

            const amenityDetail = await AmenityDetails.findById(detailId)
                .populate('maTienNghi', 'tenTienNghi')
                .populate('maPhong', 'soPhong');

            if (!amenityDetail) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy chi tiết tiện nghi"
                });
            }

            await AmenityDetails.findByIdAndDelete(detailId);

            console.log(`✅ Removed amenity "${amenityDetail.maTienNghi.tenTienNghi}" from room ${amenityDetail.maPhong.soPhong}`);

            res.status(200).json({
                success: true,
                message: `Xóa tiện nghi "${amenityDetail.maTienNghi.tenTienNghi}" khỏi phòng ${amenityDetail.maPhong.soPhong} thành công`
            });

        } catch (error) {
            console.error("Lỗi xóa tiện nghi:", error);
            res.status(500).json({
                success: false,
                message: "Lỗi server khi xóa tiện nghi",
                error: error.message
            });
        }
    }
);

// 7. Copy tiện nghi từ phòng này sang phòng khác
amenitiesHotelRouter.post("/hotelowner/copy-room-amenities", 
    authorizeRoles("chuKhachSan"), 
    async (req, res) => {
        try {
            const { fromRoomId, toRoomIds, overwrite = false } = req.body;

            if (!mongoose.Types.ObjectId.isValid(fromRoomId)) {
                return res.status(400).json({
                    success: false,
                    message: "ID phòng nguồn không hợp lệ"
                });
            }

            if (!Array.isArray(toRoomIds) || toRoomIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Danh sách phòng đích không hợp lệ"
                });
            }

            // Lấy tiện nghi từ phòng nguồn
            const sourceAmenities = await AmenityDetails.find({ maPhong: fromRoomId });
            
            if (sourceAmenities.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Phòng nguồn không có tiện nghi nào"
                });
            }

            const results = [];

            for (const toRoomId of toRoomIds) {
                try {
                    if (!mongoose.Types.ObjectId.isValid(toRoomId)) {
                        results.push({
                            roomId: toRoomId,
                            success: false,
                            message: "ID phòng không hợp lệ"
                        });
                        continue;
                    }

                    // Kiểm tra phòng đích tồn tại
                    const targetRoom = await Room.findById(toRoomId);
                    if (!targetRoom) {
                        results.push({
                            roomId: toRoomId,
                            success: false,
                            message: "Phòng không tồn tại"
                        });
                        continue;
                    }

                    // Xóa tiện nghi cũ nếu overwrite = true
                    if (overwrite) {
                        await AmenityDetails.deleteMany({ maPhong: toRoomId });
                    }

                    // Copy tiện nghi
                    const amenityPromises = sourceAmenities.map(amenity => {
                        return AmenityDetails.findOneAndUpdate(
                            {
                                maPhong: toRoomId,
                                maTienNghi: amenity.maTienNghi
                            },
                            {
                                maPhong: toRoomId,
                                maTienNghi: amenity.maTienNghi,
                                soLuong: amenity.soLuong,
                                trangThai: amenity.trangThai,
                                moTa: amenity.moTa
                            },
                            { upsert: true, new: true }
                        );
                    });

                    await Promise.all(amenityPromises);

                    results.push({
                        roomId: toRoomId,
                        roomNumber: targetRoom.soPhong,
                        success: true,
                        message: `Copy ${sourceAmenities.length} tiện nghi thành công`
                    });

                } catch (error) {
                    results.push({
                        roomId: toRoomId,
                        success: false,
                        message: error.message
                    });
                }
            }

            const successCount = results.filter(r => r.success).length;

            res.status(200).json({
                success: true,
                message: `Copy tiện nghi thành công cho ${successCount}/${toRoomIds.length} phòng`,
                data: results
            });

        } catch (error) {
            console.error("Lỗi copy tiện nghi:", error);
            res.status(500).json({
                success: false,
                message: "Lỗi server khi copy tiện nghi",
                error: error.message
            });
        }
    }
);

// 8. Lấy thống kê tiện nghi theo khách sạn
amenitiesHotelRouter.get("/hotelowner/amenities-statistics/:hotelId", 
    authorizeRoles("chuKhachSan"), 
    async (req, res) => {
        try {
            const { hotelId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(hotelId)) {
                return res.status(400).json({
                    success: false,
                    message: "ID khách sạn không hợp lệ"
                });
            }

            // Lấy tất cả room types của hotel
            const roomTypes = await RoomType.find({ maKhachSan: hotelId });
            const roomTypeIds = roomTypes.map(rt => rt._id);

            // Lấy tất cả phòng của hotel
            const rooms = await Room.find({ maLoaiPhong: { $in: roomTypeIds } });
            const roomIds = rooms.map(r => r._id);

            // Thống kê tiện nghi
            const amenityStats = await AmenityDetails.aggregate([
                { $match: { maPhong: { $in: roomIds } } },
                {
                    $lookup: {
                        from: 'tiennghis',
                        localField: 'maTienNghi',
                        foreignField: '_id',
                        as: 'amenity'
                    }
                },
                { $unwind: '$amenity' },
                {
                    $group: {
                        _id: '$maTienNghi',
                        tenTienNghi: { $first: '$amenity.tenTienNghi' },
                        nhomTienNghi: { $first: '$amenity.nhomTienNghi' },
                        icon: { $first: '$amenity.icon' },
                        totalRooms: { $sum: 1 },
                        totalQuantity: { $sum: '$soLuong' },
                        avgQuantity: { $avg: '$soLuong' }
                    }
                },
                { $sort: { totalRooms: -1 } }
            ]);

            res.status(200).json({
                success: true,
                message: "Lấy thống kê tiện nghi thành công",
                data: {
                    totalRooms: rooms.length,
                    totalAmenityTypes: amenityStats.length,
                    amenityStats
                }
            });

        } catch (error) {
            console.error("Lỗi lấy thống kê tiện nghi:", error);
            res.status(500).json({
                success: false,
                message: "Lỗi server khi lấy thống kê tiện nghi",
                error: error.message
            });
        }
    }
);

module.exports = amenitiesHotelRouter;