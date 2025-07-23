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

           
            const existingRoom = await Room.findOne({ soPhong: soPhong.trim() });
            if (existingRoom) {
                if (req.files) {
                    const uploadedPaths = req.files.map(f => f.path);
                    deleteFiles(uploadedPaths);
                }
                return res.status(400).json({
                    success: false,
                    message: `Số phòng ${soPhong} đã tồn tại`
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

            // ✅ Tạo phòng mới với các field mới
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

            res.status(201).json({
                success: true,
                message: `Tạo phòng ${newRoom.soPhong} thành công!`,
                room: {
                    ...newRoom.toObject(),
                    hinhAnh: roomImages
                }
            });

        } catch (error) {
            console.error("Lỗi tạo phòng:", error);
            
            // ✅ Handle duplicate key error
            if (error.code === 11000 && error.keyPattern?.soPhong) {
                return res.status(400).json({
                    success: false,
                    message: `Số phòng ${req.body.soPhong} đã tồn tại`
                });
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
    uploadRoom.array('hinhAnh', 10), // Cho phép upload tối đa 10 hình
    handleMulterError,
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
                    ...(trangThaiPhong !== undefined && {trangThaiPhong}),
                    ...(dienTich !== undefined && { dienTich: parseFloat(dienTich) }),
                    ...(moTa && { moTa: moTa.trim() }),
                    ...(soLuongGiuong !== undefined && { soLuongGiuong: parseInt(soLuongGiuong) }),
                    ...(soLuongNguoiToiDa !== undefined && { soLuongNguoiToiDa: parseInt(soLuongNguoiToiDa) }),
                    ...(cauHinhGiuong !== undefined && { cauHinhGiuong: bedConfig }),
                },
                { new: true, runValidators: true }
            ).populate('maLoaiPhong', 'tenLoaiPhong giaCa')

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
                    // Tạo relative path để lưu vào database
                    const relativePath = getRelativePath(file.path);
                    
                    const roomImage = new RoomImage({
                        maPhong: roomId,
                        url_anh: relativePath,
                        thuTuAnh: startOrder + index,
                        moTa: `Hình ảnh phòng ${startOrder + index}`
                    });
                    return roomImage.save();
                });

                await Promise.all(imagePromises);

                // ✅ NEW: Log update folder info
                if (req.folderInfo) {
                    console.log(`✅ Room updated with new images in: ${req.folderInfo.roomTypePath}`);
                    console.log(`🏨 Hotel: ${req.folderInfo.hotelName} | Room Type: ${req.folderInfo.roomTypeName}`);
                }
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


roomHotelRouter.post('/:hotelId/available-rooms-for-assignment', async (req, res) => {
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

    // Tìm tất cả phòng của loại phòng này
    const allRooms = await Room.find({
      maKhachSan: hotelId,
      maLoaiPhong: maLoaiPhong,
      trangThaiPhong: "trong"
    });

    // ✅ THÊM: Lấy danh sách phòng đã được gán trong thời gian trùng
    const startDate = moment(checkInDate);
    const endDate = moment(checkOutDate);

    // Tìm tất cả assignments có thời gian trùng
    const conflictingAssignments = await RoomBookingAssignment.find({
      trangThaiHoatDong: true,
      trangThaiGanPhong: { $in: ['da_gan', 'dang_su_dung'] },
      maPhong: { $in: allRooms.map(r => r._id) }
    }).populate({
      path: 'maDatPhong',
      select: 'ngayNhanPhong ngayTraPhong gioNhanPhong gioTraPhong bookingId'
    });

    // ✅ Filter ra phòng đã được gán có thời gian trùng
    const occupiedRoomIds = new Set();

    for (const assignment of conflictingAssignments) {
      const booking = assignment.maDatPhong;
      
      // Skip nếu là cùng booking (để cho phép gán nhiều phòng cho 1 đơn)
      if (excludeBookingId && booking.bookingId === excludeBookingId) {
        continue;
      }

      const existingStart = moment(booking.ngayNhanPhong);
      const existingEnd = moment(booking.ngayTraPhong);

      // Kiểm tra overlap thời gian
      const hasTimeOverlap = (
        startDate.isBefore(existingEnd) && endDate.isAfter(existingStart)
      );

      if (hasTimeOverlap) {
        occupiedRoomIds.add(assignment.maPhong.toString());
      }
    }

    // ✅ Lọc ra phòng available
    const availableRooms = allRooms.filter(room => 
      !occupiedRoomIds.has(room._id.toString())
    );

    // Format response
    const formattedRooms = availableRooms.map(room => ({
      roomId: room._id,
      soPhong: room.soPhong,
      tang: room.tang,
      loaiView: room.loaiView,
      displayName: `Phòng ${room.soPhong} - Tầng ${room.tang}${room.loaiView ? ` (${getViewText(room.loaiView)})` : ''}`
    }));

    console.log(`🏠 Found ${formattedRooms.length}/${allRooms.length} available rooms (excluded ${occupiedRoomIds.size} occupied)`);

    res.json({
      success: true,
      availableRooms: formattedRooms,
      totalRooms: allRooms.length,
      occupiedCount: occupiedRoomIds.size
    });

  } catch (error) {
    console.error('Error fetching available rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách phòng trống',
      error: error.message
    });
  }
});


// ✅ SỬA Helper function kiểm tra phòng available với đúng field names
const checkRoomAvailabilityForAssignment = async ({
    roomId,
    soPhong,
    checkInDate,
    checkOutDate,
    checkInTime,
    checkOutTime,
    bookingType,
    excludeBookingId
}) => {
    try {
        console.log(`🔍 Checking availability for room ${soPhong}:`, {
            roomId,
            checkInDate,
            checkOutDate,
            checkInTime,
            checkOutTime,
            bookingType
        });

        // Tìm tất cả assignment của phòng này (active)
        const conflictAssignments = await RoomBookingAssignment.find({
            maPhong: roomId,
            trangThaiHoatDong: true,
            trangThaiGanPhong: { $nin: ['huy_gan', 'da_checkout'] },
            ...(excludeBookingId && { maDatPhong: { $ne: excludeBookingId } })
        }).populate('maDatPhong');

        console.log(`📊 Found ${conflictAssignments.length} potential conflicts for room ${soPhong}`);

        if (conflictAssignments.length === 0) {
            console.log(`✅ Room ${soPhong} is available - no conflicts`);
            return true;
        }

        // Kiểm tra conflict về thời gian
        const requestCheckIn = moment(checkInDate, 'YYYY-MM-DD');
        const requestCheckOut = moment(checkOutDate || checkInDate, 'YYYY-MM-DD');

        for (const assignment of conflictAssignments) {
            const booking = assignment.maDatPhong;
            const bookingCheckIn = moment(booking.ngayNhanPhong);
            const bookingCheckOut = moment(booking.ngayTraPhong);

            console.log(`🔍 Comparing with booking ${booking._id}:`, {
                bookingDates: `${bookingCheckIn.format('DD-MM-YYYY')} - ${bookingCheckOut.format('DD-MM-YYYY')}`,
                requestDates: `${checkInDate} - ${checkOutDate}`,
                bookingType: booking.loaiDatPhong
            });

            // Kiểm tra overlap về ngày
            const hasDateOverlap = requestCheckIn.isBefore(bookingCheckOut) && 
                                 requestCheckOut.isAfter(bookingCheckIn);

            if (hasDateOverlap) {
                // Nếu cùng là booking theo giờ, kiểm tra overlap về giờ
                if (bookingType === 'theo_gio' && booking.loaiDatPhong === 'theo_gio' &&
                    requestCheckIn.isSame(bookingCheckIn, 'day')) {
                    
                    const requestStart = moment(`${checkInDate} ${checkInTime}`, 'YYYY-MM-DD HH:mm');
                    const requestEnd = moment(`${checkInDate} ${checkOutTime}`, 'YYYY-MM-DD HH:mm');
                    
                    const bookingStart = moment(`${bookingCheckIn.format('YYYY-MM-DD')} ${booking.gioNhanPhong}`, 'YYYY-MM-DD HH:mm');
                    const bookingEnd = moment(`${bookingCheckIn.format('YYYY-MM-DD')} ${booking.gioTraPhong}`, 'YYYY-MM-DD HH:mm');

                    // Handle time spanning midnight
                    if (requestEnd.isSameOrBefore(requestStart)) {
                        requestEnd.add(1, 'day');
                    }
                    if (bookingEnd.isSameOrBefore(bookingStart)) {
                        bookingEnd.add(1, 'day');
                    }

                    const hasTimeOverlap = requestStart.isBefore(bookingEnd) && 
                                         requestEnd.isAfter(bookingStart);

                    if (hasTimeOverlap) {
                        console.log(`❌ Room ${soPhong} has time overlap with booking ${booking._id}`);
                        return false;
                    }
                } else {
                    // Nếu có booking overnight/long-stay hoặc khác loại, conflict
                    console.log(`❌ Room ${soPhong} has date overlap with booking ${booking._id}`);
                    return false;
                }
            }
        }

        console.log(`✅ Room ${soPhong} is available - no time conflicts`);
        return true;

    } catch (error) {
        console.error('❌ Error checking room availability:', error);
        return false;
    }
};
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

module.exports = roomHotelRouter;