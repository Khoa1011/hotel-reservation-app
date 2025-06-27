const express = require("express");
const Room = require('../Model/Room/Room');
const RoomType = require('../Model/RoomType/RoomType');
const { uploadHotel } = require("../config/upload"); 
const Hotel = require("../Model/Hotel/Hotel"); 
const { route } = require("./userController");
const router = express.Router();
const Booking = require("../Model/Booking/Booking");


router.post("/upload", uploadHotel.single("hinhAnh"), async (req, res) => {
    try {
        const newHotel = new Hotel({
            tenKhachSan: req.body.tenKhachSan,
            diaChi: req.body.diaChi,
            thanhPho: req.body.thanhPho,
            moTa: req.body.moTa,
            soSao: req.body.soSao,
            soDienThoai: req.body.soDienThoai,
            email: req.body.email,
            giaCa: req.body.giaCa,
            hinhAnh: req.file ? `/uploads/hotels/${req.file.filename}` : "",
        });

        await newHotel.save();
        res.status(201).json({ message: "Thêm khách sạn thành công!", hotel: newHotel });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error });
    }
});

router.get("/getHotelList", async (req,res) => {
    try{
        const hotels  = await Hotel.find();
        if(!hotels ){
            return res.status(404).json({
                message:{msgBody:"Empty list!",msgError:false}
            });
        }
        return res.status(200).json({
            message:{msgBody:"Successfully!", msgError:false},
            hotels : hotels
        });
    }catch(err){
        return res.status(500).json({ message: 'Lỗi Server', error: err.message });
    }
})


router.get('/:hotelId/rooms', async (req, res) => {
  const { hotelId } = req.params;
  const { checkInDate, checkOutDate } = req.query;

  if (!checkInDate || !checkOutDate) {
    return res.status(400).json({ message: "Missing checkInDate or checkOutDate" });
  }

  try {
    const rooms = await Room.find({ maKhachsan: hotelId }).populate('maLoaiPhong');

    const parsedCheckIn = new Date(checkInDate);
    const parsedCheckOut = new Date(checkOutDate);

    const roomDetails = await Promise.all(rooms.map(async (room) => {
      // Tìm các booking giao với khoảng này
      const overlappingBookings = await Booking.find({
        roomId: room._id,
        checkInDate: { $lte: parsedCheckOut },
        checkOutDate: { $gte: parsedCheckIn }
      });

      let bookedCount = 0;
      for (const booking of overlappingBookings) {
        bookedCount += booking.quantity || 1;
      }

      const availableRooms = Math.max(room.totalRooms - bookedCount, 0);

      return {
        maPhong: room._id,
        maLoaiPhong: room.maLoaiPhong.tenLoaiPhong,
        giaCa: room.roomTypeId.giaCa,
        hinhAnh: room.hinhAnh,
        trangThaiPhong: room.trangThaiPhong,
        moTa: room.moTa,
        soLuongGiuong: room.soLuongGiuong,
        soLuongNguoiToiDa: room.soLuongNguoiToiDa,
        danhSachTienNghi: room.danhSachTienNghi,
        tongSoPhong: room.tongSoPhong,
        availableRooms: availableRooms

      };
    }));

    return res.status(200).json({
      message: { msgBody: "Lấy danh sách phòng thành công!", msgError: false },
      rooms: roomDetails
    });

  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});


router.post('/:hotelId/rooms/update-availability', async (req, res) => {
  const { hotelId } = req.params;

  try {
    const rooms = await Room.find({ maKhachsan: hotelId });
    
    await Promise.all(rooms.map(async (room) => {
      // Tính toán số phòng đã được đặt
      const bookings = await Booking.find({ maPhong: room._id });
      const bookedCount = bookings.reduce((sum, booking) => sum + (booking.quantity || 1), 0);
      
      // Cập nhật TRỰC TIẾP vào totalRooms (giả sử totalRooms ban đầu là tổng phòng)
      room.tongSoPhong = room.tongSoPhong - bookedCount;
      await room.save();
    }));

    res.status(200).json({ message: 'Room availability updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API tìm kiếm phòng theo khoảng thời gian - CHÍNH
router.post('/:hotelId/search-roomtypes', async (req, res) => {
    try {
        const { hotelId } = req.params;
        const {
            bookingType,      // theo_gio, qua_dem, dai_ngay
            checkInDate,      // 2025-06-28
            checkOutDate,     // 2025-06-29 (optional cho theo_gio)
            checkInTime,      // 14:00
            checkOutTime,     // 17:00 (bắt buộc cho theo_gio)
            guests,           // {adults: 2, children: 0}
            rooms: requestedRooms = 1
        } = req.body;

        // Validate input
        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            return res.status(400).json({
                msgBody: "Mã khách sạn không hợp lệ!",
                msgError: true
            });
        }

        if (!bookingType || !['theo_gio', 'qua_dem', 'dai_ngay'].includes(bookingType)) {
            return res.status(400).json({
                msgBody: "Loại đặt phòng không hợp lệ!",
                msgError: true
            });
        }

        // Kiểm tra khách sạn tồn tại
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({
                msgBody: "Khách sạn không tồn tại!",
                msgError: true
            });
        }

        // Lấy tất cả loại phòng của khách sạn
        const roomTypes = await RoomType.find({ maKhachSan: hotelId }).sort({ giaCa: 1 });
        if (!roomTypes.length) {
            return res.status(404).json({
                msgBody: "Khách sạn chưa có loại phòng nào!",
                msgError: true
            });
        }

        const availableRoomTypes = [];
        const totalGuests = (guests?.adults || 0) + (guests?.children || 0);

        // Duyệt từng loại phòng để kiểm tra availability
        for (const roomType of roomTypes) {
            try {
                // Kiểm tra availability trong khoảng thời gian
                const availability = await checkRoomTypeAvailability({
                    hotelId,
                    roomTypeId: roomType._id,
                    bookingType,
                    checkInDate,
                    checkOutDate,
                    checkInTime,
                    checkOutTime
                });

                // Chỉ hiển thị loại phòng có sẵn và phù hợp
                if (availability.isAvailable && 
                    availability.availableRooms >= requestedRooms &&
                    roomType.soLuongKhach >= totalGuests) {
                    
                    // Lấy danh sách hình ảnh của loại phòng này
                    const roomImages = await getRoomTypeImages(roomType._id);
                    
                    // Lấy tiện nghi của loại phòng
                    const amenities = await getRoomTypeAmenities(roomType._id);
                    
                    // Tính giá cho khoảng thời gian này
                    const pricing = calculatePricing({
                        roomType,
                        bookingType,
                        checkInDate,
                        checkOutDate,
                        checkInTime,
                        checkOutTime
                    });

                    availableRoomTypes.push({
                        roomTypeId: roomType._id,
                        tenLoaiPhong: roomType.tenLoaiPhong,
                        moTa: roomType.moTa || "",
                        soLuongKhach: roomType.soLuongKhach,
                        giaCa: roomType.giaCa,
                        
                        // Hình ảnh loại phòng
                        images: roomImages,
                        
                        // Tiện nghi
                        amenities: amenities,
                        
                        // Thông tin availability
                        availability: {
                            isAvailable: availability.isAvailable,
                            totalRooms: availability.totalRooms,
                            availableRooms: availability.availableRooms,
                            occupiedRooms: availability.occupiedRooms,
                            canBook: true
                        },
                        
                        // Thông tin giá cả
                        pricing: pricing,
                        
                        // Thông tin display cho Flutter
                        displayInfo: {
                            pricePerUnit: pricing.finalPrice,
                            unit: getUnitText(bookingType),
                            duration: pricing.duration,
                            maxCapacity: roomType.soLuongKhach,
                            availableCount: availability.availableRooms,
                            hasImages: roomImages.length > 0,
                            imageCount: roomImages.length
                        }
                    });
                }
            } catch (error) {
                console.error(`Lỗi xử lý loại phòng ${roomType._id}:`, error);
            }
        }

        return res.status(200).json({
            message: `Tìm thấy ${availableRoomTypes.length} loại phòng có sẵn!`,
            searchInfo: {
                hotelId: hotel._id,
                tenKhachSan: hotel.tenKhachSan,
                diaChiKhachSan: hotel.diaChiDayDu || `${hotel.diaChi?.quan}, ${hotel.diaChi?.thanhPho}`,
                bookingType,
                checkInDate,
                checkOutDate: checkOutDate || checkInDate,
                checkInTime,
                checkOutTime,
                guests: guests || {},
                requestedRooms,
                searchTime: new Date().toISOString()
            },
            statistics: {
                totalRoomTypes: roomTypes.length,
                availableRoomTypes: availableRoomTypes.length,
                totalAvailableRooms: availableRoomTypes.reduce((sum, room) => 
                    sum + room.availability.availableRooms, 0)
            },
            roomTypes: availableRoomTypes
        });

    } catch (error) {
        console.error('Lỗi tìm kiếm phòng:', error);
        return res.status(500).json({
            msgBody: "Lỗi máy chủ khi tìm kiếm phòng!",
            msgError: true,
            messageError: error.message
        });
    }
});

// Lấy hình ảnh loại phòng
router.get('/:hotelId/room-type/:roomTypeId/images', async (req, res) => {
    try {
        const { roomTypeId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(roomTypeId)) {
            return res.status(400).json({
                msgBody: "Mã loại phòng không hợp lệ!",
                msgError: true
            });
        }

        // Lấy phòng thuộc loại này
        const rooms = await Room.find({ maLoaiPhong: roomTypeId });
        const roomIds = rooms.map(room => room._id);

        if (!roomIds.length) {
            return res.status(404).json({
                msgBody: "Loại phòng này chưa có phòng nào!",
                msgError: true
            });
        }

        // Lấy hình ảnh
        const images = await RoomImage.find({ 
            maPhong: { $in: roomIds } 
        }).sort({ thuTuAnh: 1 });

        return res.status(200).json({
            message: `Tìm thấy ${images.length} hình ảnh!`,
            images: images.map(img => ({
                _id: img._id,
                url_anh: img.url_anh,
                moTa: img.moTa,
                thuTuAnh: img.thuTuAnh
            })),
            count: images.length
        });

    } catch (error) {
        return res.status(500).json({
            msgBody: "Lỗi truy xuất hình ảnh!",
            msgError: true,
            messageError: error.message
        });
    }
});

// Lấy time slots cho đặt phòng theo giờ
router.get('/:hotelId/room-type/:roomTypeId/time-slots', async (req, res) => {
    try {
        const { roomTypeId } = req.params;
        const { date } = req.query;
        
        if (!date || !moment(date, 'YYYY-MM-DD', true).isValid()) {
            return res.status(400).json({
                msgBody: "Ngày không hợp lệ! Định dạng: YYYY-MM-DD",
                msgError: true
            });
        }

        // Lấy booking hiện có trong ngày
        const existingBookings = await Booking.find({
            maLoaiPhong: roomTypeId,
            ngayNhanPhong: new Date(date),
            loaiDatPhong: 'theo_gio',
            trangThai: { $in: ['Đã xác nhận', 'Đã nhận phòng', 'Đang sử dụng'] }
        });

        // Lấy tổng số phòng
        const roomType = await RoomType.findById(roomTypeId);
        const totalRooms = roomType?.tongSoPhong || 0;

        // Tạo time slots (6:00 - 23:00)
        const timeSlots = [];
        for (let hour = 6; hour < 24; hour++) {
            const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
            
            // Tính phòng bị chiếm tại thời điểm này
            const occupiedRooms = existingBookings.filter(booking => {
                const bookingStart = moment(`${date} ${booking.gioNhanPhong}`, 'YYYY-MM-DD HH:mm');
                const bookingEnd = moment(`${date} ${booking.gioTraPhong}`, 'YYYY-MM-DD HH:mm');
                const slotTime = moment(`${date} ${timeSlot}`, 'YYYY-MM-DD HH:mm');
                
                // Xử lý checkout ngày hôm sau
                if (bookingEnd.isSameOrBefore(bookingStart)) {
                    bookingEnd.add(1, 'day');
                }
                
                return slotTime.isSameOrAfter(bookingStart) && slotTime.isBefore(bookingEnd);
            }).reduce((sum, booking) => sum + booking.soLuongPhong, 0);

            const availableRooms = Math.max(0, totalRooms - occupiedRooms);

            timeSlots.push({
                time: timeSlot,
                availableRooms,
                isAvailable: availableRooms > 0
            });
        }

        return res.status(200).json({
            message: "Lấy time slots thành công!",
            date,
            totalRooms,
            timeSlots,
            availableSlots: timeSlots.filter(slot => slot.isAvailable).length
        });

    } catch (error) {
        return res.status(500).json({
            msgBody: "Lỗi truy xuất time slots!",
            msgError: true,
            messageError: error.message
        });
    }
});


// Helper Functions

// Lấy hình ảnh của loại phòng
const getRoomTypeImages = async (roomTypeId) => {
    try {
        // Lấy tất cả phòng thuộc loại này
        const rooms = await Room.find({ maLoaiPhong: roomTypeId });
        const roomIds = rooms.map(room => room._id);

        if (!roomIds.length) {
            return [];
        }

        // Lấy hình ảnh từ các phòng thuộc loại này
        const images = await RoomImage.find({ 
            maPhong: { $in: roomIds } 
        }).sort({ thuTuAnh: 1 });

        // Loại bỏ duplicate và lấy tối đa 10 ảnh
        const uniqueImages = [];
        const seenUrls = new Set();

        for (const img of images) {
            if (!seenUrls.has(img.url_anh) && uniqueImages.length < 10) {
                seenUrls.add(img.url_anh);
                uniqueImages.push({
                    imageId: img._id,
                    url: img.url_anh,
                    description: img.moTa || "",
                    order: img.thuTuAnh || 999
                });
            }
        }

        return uniqueImages;
    } catch (error) {
        console.error('Lỗi lấy hình ảnh loại phòng:', error);
        return [];
    }
};

// Lấy tiện nghi của loại phòng
const getRoomTypeAmenities = async (roomTypeId) => {
    try {
        // Lấy phòng thuộc loại này
        const rooms = await Room.find({ maLoaiPhong: roomTypeId });
        const roomIds = rooms.map(room => room._id);

        if (!roomIds.length) {
            return [];
        }

        // Lấy tiện nghi từ các phòng
        const amenityDetails = await AmenityDetails.find({
            maPhong: { $in: roomIds },
            trangThai: true
        }).populate({
            path: 'maTienNghi',
            select: 'tenTienNghi icon moTa maNhomTienNghi',
            populate: {
                path: 'maNhomTienNghi',
                select: 'tenNhomTienNghi icon'
            }
        });

        // Nhóm tiện nghi và tính coverage
        const amenityMap = {};
        amenityDetails.forEach(detail => {
            if (detail.maTienNghi) {
                const amenityId = detail.maTienNghi._id.toString();
                if (!amenityMap[amenityId]) {
                    amenityMap[amenityId] = {
                        amenityId: detail.maTienNghi._id,
                        name: detail.maTienNghi.tenTienNghi,
                        icon: detail.maTienNghi.icon || "🏨",
                        description: detail.maTienNghi.moTa || "",
                        category: detail.maTienNghi.maNhomTienNghi?.tenNhomTienNghi || "Khác",
                        categoryIcon: detail.maTienNghi.maNhomTienNghi?.icon || "📋",
                        roomCount: 0,
                        totalQuantity: 0
                    };
                }
                amenityMap[amenityId].roomCount++;
                amenityMap[amenityId].totalQuantity += detail.soLuong || 1;
            }
        });

        // Chuyển về array và tính coverage percentage
        const amenities = Object.values(amenityMap).map(amenity => ({
            ...amenity,
            coveragePercentage: Math.round((amenity.roomCount / rooms.length) * 100)
        }));

        // Sắp xếp theo độ phổ biến
        return amenities.sort((a, b) => b.coveragePercentage - a.coveragePercentage);

    } catch (error) {
        console.error('Lỗi lấy tiện nghi loại phòng:', error);
        return [];
    }
};

// Kiểm tra availability của loại phòng trong khoảng thời gian
const checkRoomTypeAvailability = async ({
    hotelId, roomTypeId, bookingType, checkInDate, checkOutDate, checkInTime, checkOutTime
}) => {
    try {
        if (bookingType === 'theo_gio') {
            return await checkHourlyRoomAvailability({
                hotelId, roomTypeId, date: checkInDate, checkInTime, checkOutTime
            });
        } else {
            return await checkOvernightRoomAvailability({
                hotelId, roomTypeId, checkInDate, 
                checkOutDate: checkOutDate || moment(checkInDate).add(1, 'day').format('YYYY-MM-DD')
            });
        }
    } catch (error) {
        console.error('Lỗi kiểm tra availability:', error);
        return { isAvailable: false, availableRooms: 0 };
    }
};

// Kiểm tra availability theo giờ cho loại phòng
const checkHourlyRoomAvailability = async ({ hotelId, roomTypeId, date, checkInTime, checkOutTime }) => {
    try {
        // Lấy thông tin availability từ RoomAvailability
        const availability = await RoomAvailability.findOne({
            maKhachSan: hotelId,
            maLoaiPhong: roomTypeId,
            ngay: new Date(date)
        });

        // Nếu không có data availability, kiểm tra từ RoomType
        let totalRooms = 0;
        if (availability) {
            totalRooms = availability.tongSoPhong;
            // Kiểm tra hỗ trợ booking theo giờ
            if (!availability.loaiDatPhongHoTro.includes('theo_gio')) {
                return { isAvailable: false, availableRooms: 0, reason: "Không hỗ trợ đặt theo giờ" };
            }
        } else {
            // Fallback: lấy tổng số phòng từ RoomType
            const roomType = await RoomType.findById(roomTypeId);
            totalRooms = roomType?.tongSoPhong || 0;
        }

        if (totalRooms === 0) {
            return { isAvailable: false, availableRooms: 0, reason: "Không có phòng" };
        }

        // Tìm booking conflicts trong khoảng thời gian
        const requestStart = moment(`${date} ${checkInTime}`, 'YYYY-MM-DD HH:mm');
        let requestEnd = moment(`${date} ${checkOutTime}`, 'YYYY-MM-DD HH:mm');
        
        // Xử lý checkout ngày hôm sau
        if (requestEnd.isSameOrBefore(requestStart)) {
            requestEnd.add(1, 'day');
        }

        const conflictingBookings = await Booking.find({
            maLoaiPhong: roomTypeId,
            ngayNhanPhong: new Date(date),
            loaiDatPhong: 'theo_gio',
            trangThai: { $in: ['Đã xác nhận', 'Đã nhận phòng', 'Đang sử dụng'] }
        });

        // Tính phòng bị chiếm trong khoảng thời gian yêu cầu
        let occupiedRooms = 0;
        conflictingBookings.forEach(booking => {
            const bookingStart = moment(`${date} ${booking.gioNhanPhong}`, 'YYYY-MM-DD HH:mm');
            let bookingEnd = moment(`${date} ${booking.gioTraPhong}`, 'YYYY-MM-DD HH:mm');
            
            if (bookingEnd.isSameOrBefore(bookingStart)) {
                bookingEnd.add(1, 'day');
            }

            // Kiểm tra overlap: có giao thời gian không
            if (requestStart.isBefore(bookingEnd) && bookingStart.isBefore(requestEnd)) {
                occupiedRooms += booking.soLuongPhong || 1;
            }
        });

        // Tính phòng có sẵn (trừ bảo trì và block nếu có)
        const maintenanceRooms = availability?.soPhongBaoTri || 0;
        const blockedRooms = availability?.soPhongBlock || 0;
        const availableRooms = Math.max(0, totalRooms - occupiedRooms - maintenanceRooms - blockedRooms);

        return {
            isAvailable: availableRooms > 0,
            availableRooms,
            totalRooms,
            occupiedRooms,
            maintenanceRooms,
            blockedRooms
        };

    } catch (error) {
        console.error('Lỗi kiểm tra availability theo giờ:', error);
        return { isAvailable: false, availableRooms: 0 };
    }
};

// Kiểm tra availability qua đêm cho loại phòng
const checkOvernightRoomAvailability = async ({ hotelId, roomTypeId, checkInDate, checkOutDate }) => {
    try {
        // Lấy availability cho tất cả ngày trong khoảng thời gian
        const availabilities = await RoomAvailability.find({
            maKhachSan: hotelId,
            maLoaiPhong: roomTypeId,
            ngay: { $gte: new Date(checkInDate), $lt: new Date(checkOutDate) }
        }).sort({ ngay: 1 });

        let totalRooms = 0;
        let minAvailableRooms = Infinity;

        // Nếu không có availability data, lấy từ RoomType
        if (!availabilities.length) {
            const roomType = await RoomType.findById(roomTypeId);
            totalRooms = roomType?.tongSoPhong || 0;
            
            if (totalRooms === 0) {
                return { isAvailable: false, availableRooms: 0, reason: "Không có phòng" };
            }

            // Kiểm tra booking conflicts cho từng ngày
            const dateRange = [];
            const current = moment(checkInDate);
            const end = moment(checkOutDate);
            
            while (current.isBefore(end)) {
                dateRange.push(current.format('YYYY-MM-DD'));
                current.add(1, 'day');
            }

            for (const date of dateRange) {
                const conflictingBookings = await Booking.find({
                    maLoaiPhong: roomTypeId,
                    $or: [
                        // Booking bắt đầu trong ngày này
                        { ngayNhanPhong: new Date(date) },
                        // Booking đang diễn ra qua ngày này
                        {
                            ngayNhanPhong: { $lte: new Date(date) },
                            ngayTraPhong: { $gt: new Date(date) }
                        }
                    ],
                    trangThai: { $in: ['Đã xác nhận', 'Đã nhận phòng', 'Đang sử dụng'] }
                });

                const occupiedForDate = conflictingBookings.reduce((sum, booking) => 
                    sum + (booking.soLuongPhong || 1), 0);

                const availableForDate = totalRooms - occupiedForDate;
                minAvailableRooms = Math.min(minAvailableRooms, availableForDate);
            }
        } else {
            // Có availability data
            for (const avail of availabilities) {
                totalRooms = avail.tongSoPhong;
                const dateStr = moment(avail.ngay).format('YYYY-MM-DD');
                
                // Kiểm tra booking conflicts cho ngày này
                const conflictingBookings = await Booking.find({
                    maLoaiPhong: roomTypeId,
                    $or: [
                        { ngayNhanPhong: new Date(dateStr) },
                        {
                            ngayNhanPhong: { $lte: new Date(dateStr) },
                            ngayTraPhong: { $gt: new Date(dateStr) }
                        }
                    ],
                    trangThai: { $in: ['Đã xác nhận', 'Đã nhận phòng', 'Đang sử dụng'] }
                });

                const occupiedForDate = conflictingBookings.reduce((sum, booking) => 
                    sum + (booking.soLuongPhong || 1), 0);

                const availableForDate = Math.max(0, 
                    avail.tongSoPhong - avail.soPhongBaoTri - avail.soPhongBlock - occupiedForDate
                );

                minAvailableRooms = Math.min(minAvailableRooms, availableForDate);
            }
        }

        const finalAvailable = minAvailableRooms === Infinity ? 0 : Math.max(0, minAvailableRooms);

        return {
            isAvailable: finalAvailable > 0,
            availableRooms: finalAvailable,
            totalRooms,
            occupiedRooms: totalRooms - finalAvailable
        };

    } catch (error) {
        console.error('Lỗi kiểm tra availability qua đêm:', error);
        return { isAvailable: false, availableRooms: 0 };
    }
};

// Tính giá cho khoảng thời gian
const calculatePricing = ({ roomType, bookingType, checkInDate, checkOutDate, checkInTime, checkOutTime }) => {
    let basePrice = roomType.giaCa;
    let duration = 1;
    let unit = "đêm";

    if (bookingType === 'theo_gio') {
        // Tính theo giờ
        const startTime = moment(`${checkInDate} ${checkInTime}`, 'YYYY-MM-DD HH:mm');
        let endTime = moment(`${checkInDate} ${checkOutTime}`, 'YYYY-MM-DD HH:mm');
        
        if (endTime.isSameOrBefore(startTime)) {
            endTime.add(1, 'day');
        }
        
        duration = endTime.diff(startTime, 'hours', true);
        unit = "giờ";
        // Giá theo giờ = giá phòng / 8 (giả sử 8 tiếng 1 ngày)
        basePrice = Math.round((roomType.giaCa / 8) * duration);
    } else if (checkOutDate) {
        // Tính theo ngày/đêm
        duration = moment(checkOutDate).diff(moment(checkInDate), 'days');
        unit = bookingType === 'qua_dem' ? "đêm" : "ngày";
        basePrice = roomType.giaCa * duration;
    }

    // Áp dụng multiplier cơ bản (có thể mở rộng)
    let finalPrice = basePrice;
    
    // Weekend multiplier
    if (isWeekend(checkInDate)) {
        finalPrice = Math.round(finalPrice * 1.2); // +20% cuối tuần
    }

    return {
        basePrice,
        finalPrice,
        duration,
        unit,
        breakdown: {
            baseRate: Math.round(roomType.giaCa),
            duration: duration,
            multiplier: finalPrice / basePrice,
            total: finalPrice
        }
    };
};

// Lấy text đơn vị
const getUnitText = (bookingType) => {
    switch (bookingType) {
        case 'theo_gio': return 'giờ';
        case 'qua_dem': return 'đêm';
        case 'dai_ngay': return 'ngày';
        default: return 'lượt';
    }
};

// Kiểm tra weekend
const isWeekend = (date) => {
    const dayOfWeek = moment(date).day();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
};

// API lấy chi tiết loại phòng với hình ảnh và tiện nghi
router.get('/:hotelId/room-type/:roomTypeId/details', async (req, res) => {
    try {
        const { hotelId, roomTypeId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(roomTypeId)) {
            return res.status(400).json({
                msgBody: "Mã loại phòng không hợp lệ!",
                msgError: true
            });
        }

        // Lấy thông tin loại phòng
        const roomType = await RoomType.findOne({ 
            _id: roomTypeId, 
            maKhachSan: hotelId 
        });
        
        if (!roomType) {
            return res.status(404).json({
                msgBody: "Loại phòng không tồn tại!",
                msgError: true
            });
        }

        // Lấy hình ảnh và tiện nghi
        const [images, amenities] = await Promise.all([
            getRoomTypeImages(roomTypeId),
            getRoomTypeAmenities(roomTypeId)
        ]);

        return res.status(200).json({
            message: "Lấy chi tiết loại phòng thành công!",
            roomType: {
                roomTypeId: roomType._id,
                tenLoaiPhong: roomType.tenLoaiPhong,
                moTa: roomType.moTa || "",
                soLuongKhach: roomType.soLuongKhach,
                giaCa: roomType.giaCa,
                tongSoPhong: roomType.tongSoPhong,
                
                // Danh sách hình ảnh
                images: images,
                
                // Danh sách tiện nghi
                amenities: amenities,
                
                // Thống kê
                statistics: {
                    imageCount: images.length,
                    amenityCount: amenities.length,
                    totalRooms: roomType.tongSoPhong
                }
            }
        });

    } catch (error) {
        return res.status(500).json({
            msgBody: "Lỗi truy xuất chi tiết loại phòng!",
            msgError: true,
            messageError: error.message
        });
    }
});

// API kiểm tra availability nhanh cho 1 loại phòng
router.post('/:hotelId/room-type/:roomTypeId/check-availability', async (req, res) => {
    try {
        const { hotelId, roomTypeId } = req.params;
        const { bookingType, checkInDate, checkOutDate, checkInTime, checkOutTime } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(roomTypeId)) {
            return res.status(400).json({
                msgBody: "Mã loại phòng không hợp lệ!",
                msgError: true
            });
        }

        const availability = await checkRoomTypeAvailability({
            hotelId,
            roomTypeId,
            bookingType,
            checkInDate,
            checkOutDate,
            checkInTime,
            checkOutTime
        });

        const roomType = await RoomType.findById(roomTypeId);
        const pricing = calculatePricing({
            roomType,
            bookingType,
            checkInDate,
            checkOutDate,
            checkInTime,
            checkOutTime
        });

        return res.status(200).json({
            message: availability.isAvailable ? "Phòng có sẵn!" : "Phòng không có sẵn!",
            availability: {
                ...availability,
                roomTypeName: roomType?.tenLoaiPhong || "Unknown"
            },
            pricing: pricing,
            searchParams: {
                bookingType,
                checkInDate,
                checkOutDate,
                checkInTime,
                checkOutTime
            }
        });

    } catch (error) {
        return res.status(500).json({
            msgBody: "Lỗi kiểm tra availability!",
            msgError: true,
            messageError: error.message
        });
    }
});


module.exports = router;
