// =============================================================================
// 🔍 SIMPLE SEARCH API 2025 - CHỈ CÁC FILTER CẦN THIẾT
// =============================================================================

const express = require("express");
const mongoose = require("mongoose");
const Hotel = require('../Model/Hotel/Hotel');
const RoomType = require('../Model/RoomType/RoomType');
const Booking = require('../Model/Booking/Booking');
const moment = require('moment-timezone');

const searchRouter = express.Router();

// 🔍 API TÌM KIẾM KHÁCH SẠN ĐỚN GIẢN 2025
searchRouter.get('/search', async (req, res) => {
    try {

        // 📥 NHẬN CÁC THAM SỐ CẦN THIẾT
        const {
            // === TÌM KIẾM TỔNG QUÁT ===
            keyword,           // ✅ THÊM: Từ khóa tìm kiếm (tên khách sạn, địa điểm)
            showAll,           // ✅ THÊM: Flag để hiển thị tất cả khách sạn

            // === ĐỊA ĐIỂM (CẤU TRÚC 2025) ===
            tinhThanh,         // Tỉnh/thành phố
            phuongXa,          // Phường/xã

            // === GIÁ CẢ ===
            minPrice,          // Giá tối thiểu (VND)
            maxPrice,          // Giá tối đa (VND)

            // === SỨC CHỨA ===
            guests,            // Số khách
            rooms,             // Số phòng cần

            // === NGÀY & LOẠI ĐẶT PHÒNG ===
            checkIn,           // Ngày nhận phòng (YYYY-MM-DD)
            checkOut,          // Ngày trả phòng (YYYY-MM-DD)
            bookingType,       // Loại đặt: 'theo_gio', 'qua_dem', 'dai_ngay'


        } = req.query;

        console.log('🔍 Search request 2025:', req.query);

        // ✅ KIỂM TRA NẾU LÀ REQUEST LOAD TẤT CẢ KHÁCH SẠN
        const isShowAllRequest = showAll === 'true' || (
            !keyword &&
            !tinhThanh &&
            !phuongXa &&
            !minPrice &&
            !maxPrice &&
            !guests &&
            !rooms &&
            !checkIn &&
            !checkOut
        );

        // 🏗️ XÂY DỰNG PIPELINE TÌM KIẾM
        const pipeline = [];

        // 🎯 BƯỚC 1: FILTER THEO KEYWORD VÀ ĐỊA ĐIỂM
        const searchMatch = {};

        if (!isShowAllRequest) {
            // ✅ TÌM KIẾM THEO KEYWORD (tên khách sạn, địa chỉ, mô tả)
            if (keyword) {
                searchMatch.$or = [
                    { tenKhachSan: { $regex: keyword, $options: 'i' } },
                    { diaChiDayDu: { $regex: keyword, $options: 'i' } },
                    { moTa: { $regex: keyword, $options: 'i' } },
                    { 'diaChi.tinhThanh': { $regex: keyword, $options: 'i' } },
                    { 'diaChi.phuongXa': { $regex: keyword, $options: 'i' } }
                ];
            }

            // ✅ TÌM KIẾM THEO ĐỊA ĐIỂM CỤ THỂ (kết hợp với keyword)
            if (tinhThanh) {
                searchMatch['diaChi.tinhThanh'] = { $regex: tinhThanh, $options: 'i' };
            }
            if (phuongXa) {
                searchMatch['diaChi.phuongXa'] = { $regex: phuongXa, $options: 'i' };
            }
        }

        // ✅ Chỉ thêm match nếu có điều kiện tìm kiếm
        if (Object.keys(searchMatch).length > 0) {
            pipeline.push({ $match: searchMatch });
        }

        // 🔗 BƯỚC 2: JOIN VỚI ROOM TYPES
        pipeline.push({
            $lookup: {
                from: 'loaiphongs',
                localField: '_id',
                foreignField: 'maKhachSan',
                as: 'roomTypes'
            }
        });

        // 🧮 BƯỚC 3: TÍNH GIÁ VÀ SỨC CHỨA
        pipeline.push({
            $addFields: {
                minRoomPrice: { $min: '$roomTypes.giaCa' },
                maxRoomPrice: { $max: '$roomTypes.giaCa' },
                totalRoomTypes: { $size: '$roomTypes' },
                maxCapacity: { $max: '$roomTypes.soLuongKhach' },

                // ✅ THÊM: Tính điểm relevance cho keyword search
                relevanceScore: {
                    $cond: {
                        if: { $and: [{ $ne: [keyword, null] }, { $ne: [keyword, ""] }] },
                        then: {
                            $add: [
                                // Tên khách sạn match = +10 điểm
                                {
                                    $cond: [
                                        { $regexMatch: { input: '$tenKhachSan', regex: keyword, options: 'i' } },
                                        10, 0
                                    ]
                                },
                                // Địa chỉ match = +5 điểm  
                                {
                                    $cond: [
                                        { $regexMatch: { input: '$diaChiDayDu', regex: keyword, options: 'i' } },
                                        5, 0
                                    ]
                                },
                                // Mô tả match = +3 điểm
                                {
                                    $cond: [
                                        { $regexMatch: { input: '$moTa', regex: keyword, options: 'i' } },
                                        3, 0
                                    ]
                                },
                                // Bonus điểm cho số sao
                                { $multiply: ['$soSao', 1] }
                            ]
                        },
                        else: '$soSao' // Không có keyword thì sort theo sao
                    }
                }
            }
        });

        // 💰 BƯỚC 4: FILTER THEO GIÁ VÀ SỨC CHỨA
        const priceCapacityMatch = {};

        if (!isShowAllRequest) {
            // Filter giá (chỉ khi không show all)
            if (minPrice) priceCapacityMatch.minRoomPrice = { $gte: parseFloat(minPrice) };
            if (maxPrice) priceCapacityMatch.maxRoomPrice = { $lte: parseFloat(maxPrice) };

            // Filter sức chứa (chỉ khi không show all)
            if (guests) priceCapacityMatch.maxCapacity = { $gte: parseInt(guests) };
        }

        // ✅ Luôn chỉ lấy khách sạn có phòng (kể cả show all)
        priceCapacityMatch.totalRoomTypes = { $gt: 0 };

        if (Object.keys(priceCapacityMatch).length > 0) {
            pipeline.push({ $match: priceCapacityMatch });
        }

        // 📅 BƯỚC 5: KIỂM TRA PHÒNG TRỐNG (NẾU CÓ NGÀY)
        if (!isShowAllRequest && checkIn && checkOut && bookingType) {
            // Validate booking type và dates
            const isValidBooking = validateBookingRequest({
                checkIn, checkOut, bookingType, guests: parseInt(guests), rooms: parseInt(rooms)
            });

            if (isValidBooking.valid) {
                // Tìm khách sạn có phòng trống
                const availableHotels = await findAvailableHotels({
                    checkIn,
                    checkOut,
                    bookingType,
                    requiredGuests: parseInt(guests),
                    requiredRooms: parseInt(rooms)
                });

                if (availableHotels.length > 0) {
                    pipeline.push({
                        $match: {
                            _id: { $in: availableHotels.map(h => new mongoose.Types.ObjectId(h)) }
                        }
                    });
                } else {
                    // Không có khách sạn nào có phòng trống
                    return res.json({
                        message: 'Không tìm thấy khách sạn có phòng trống trong thời gian này',
                        searchInfo: {
                            keyword: keyword || null,
                            checkIn, checkOut, bookingType, guests, rooms
                        },
                        hotels: [],
                        total: 0,
                        pagination: {
                            page: parseInt(page),
                            limit: parseInt(limit),
                            totalPages: 0
                        }
                    });
                }
            } else {
                return res.status(400).json({
                    message: isValidBooking.message,
                    error: true
                });
            }
        }

        // 🔄 BƯỚC 6: SẮP XẾP THÔNG MINH
        const sortCriteria = {};

        if (isShowAllRequest) {
            // ✅ Show All: Sort theo sao cao nhất, sau đó theo số phòng
            sortCriteria.soSao = -1;
            sortCriteria.totalRoomTypes = -1;
            sortCriteria.tenKhachSan = 1; // Tên A-Z cho stable sort
        } else if (keyword) {
            // ✅ Có keyword: Sort theo relevance score trước
            sortCriteria.relevanceScore = -1;
            sortCriteria.soSao = -1;
            sortCriteria.totalRoomTypes = -1;
        } else {
            // ✅ Không có keyword: Sort theo sao và số phòng
            sortCriteria.soSao = -1;
            sortCriteria.totalRoomTypes = -1;
        }

        pipeline.push({ $sort: sortCriteria });



        // 📊 BƯỚC 7: CHỌN TRƯỜNG TRẢ VỀ
        pipeline.push({
            $project: {
                _id: 1,
                tenKhachSan: 1,
                diaChiDayDu: 1,
                'diaChi.tinhThanh': 1,
                'diaChi.phuongXa': 1,
                'diaChi.soNha': 1,
                hinhAnh: 1,
                moTa: 1,
                soSao: 1,
                soDienThoai: 1,
                email: 1,
                loaiKhachSan: 1,

                // Thông tin giá và phòng
                minRoomPrice: 1,
                maxRoomPrice: 1,
                totalRoomTypes: 1,
                maxCapacity: 1,

                // ✅ THÊM: Relevance score để debug (chỉ khi có keyword)
                relevanceScore: {
                    $cond: {
                        if: { $and: [{ $ne: [keyword, null] }, { $ne: [keyword, ""] }] },
                        then: '$relevanceScore',
                        else: '$$REMOVE'
                    }
                },

                // Thông tin hiển thị
                location: {
                    tinhThanh: '$diaChi.tinhThanh',
                    phuongXa: '$diaChi.phuongXa',
                    soNha: '$diaChi.soNha',
                    fullAddress: '$diaChiDayDu'
                },

                giaTheoNgay: '$minRoomPrice',
                hasImage: { $ne: ['$hinhAnh', ''] }
            }
        });

        // ⚡ THỰC HIỆN QUERY
        const hotels = await Hotel.aggregate(pipeline);

        // ✅ TẠO MESSAGE THÔNG MINH
        let message = '';
        if (isShowAllRequest) {
            message = `Hiển thị tất cả khách sạn (${hotels.length} kết quả)`;
        } else if (keyword && (tinhThanh || phuongXa)) {
            const location = [phuongXa, tinhThanh].filter(Boolean).join(', ');
            message = `Tìm thấy ${hotels.length} khách sạn cho "${keyword}" tại ${location}`;
        } else if (keyword) {
            message = `Tìm thấy ${hotels.length} khách sạn cho "${keyword}"`;
        } else if (tinhThanh || phuongXa) {
            const location = [phuongXa, tinhThanh].filter(Boolean).join(', ');
            message = `Tìm thấy ${hotels.length} khách sạn tại ${location}`;
        } else {
            message = `Tìm thấy ${hotels.length} khách sạn phù hợp`;
        }

        // 📤 TRẢ VỀ KẾT QUẢ ĐƠN GIẢN
        return res.json({
            message,
            searchInfo: {
                keyword: keyword || null,
                tinhThanh: tinhThanh || null,
                phuongXa: phuongXa || null,

                guests: guests ? parseInt(guests) : null,
                rooms: rooms ? parseInt(rooms) : null,
                checkIn: checkIn || null,
                checkOut: checkOut || null,
                bookingType: bookingType || null,
                showAll: isShowAllRequest
            },

            hotels: hotels,
            total: hotels.length,

    
        });

    } catch (error) {
        console.error('❌ Search API error:', error);
        return res.status(500).json({
            message: 'Lỗi máy chủ',
            error: error.message
        });
    }
});

// =============================================================================
// 🔧 HELPER FUNCTIONS - CHỈ NHỮNG HÀM CẦN THIẾT
// =============================================================================

// ✅ Validate yêu cầu đặt phòng
function validateBookingRequest({ checkIn, checkOut, bookingType, guests, rooms }) {
    // Validate dates
    if (!moment(checkIn, 'YYYY-MM-DD', true).isValid()) {
        return { valid: false, message: 'Ngày nhận phòng không hợp lệ' };
    }

    if (!moment(checkOut, 'YYYY-MM-DD', true).isValid()) {
        return { valid: false, message: 'Ngày trả phòng không hợp lệ' };
    }

    const checkInMoment = moment(checkIn);
    const checkOutMoment = moment(checkOut);

    if (checkInMoment.isAfter(checkOutMoment)) {
        return { valid: false, message: 'Ngày nhận phòng không được sau ngày trả phòng' };
    }

    // Validate booking type
    if (!['theo_gio', 'qua_dem', 'dai_ngay'].includes(bookingType)) {
        return { valid: false, message: 'Loại đặt phòng không hợp lệ' };
    }

    // Validate theo loại đặt phòng
    const daysDiff = checkOutMoment.diff(checkInMoment, 'days');

    switch (bookingType) {
        case 'theo_gio':
            if (daysDiff !== 0) {
                return { valid: false, message: 'Đặt theo giờ phải trong cùng ngày' };
            }
            break;
        case 'qua_dem':
            if (daysDiff !== 1) {
                return { valid: false, message: 'Đặt qua đêm phải chính xác 1 ngày' };
            }
            break;
        case 'dai_ngay':
            if (daysDiff < 2) {
                return { valid: false, message: 'Đặt dài ngày tối thiểu 2 ngày' };
            }
            break;
    }

    // Validate guests và rooms
    if (guests < 1) {
        return { valid: false, message: 'Số khách phải ít nhất 1' };
    }

    if (rooms < 1) {
        return { valid: false, message: 'Số phòng phải ít nhất 1' };
    }

    return { valid: true };
}

// ✅ Tìm khách sạn có phòng trống - ENHANCED VERSION
async function findAvailableHotels({ checkIn, checkOut, bookingType, requiredGuests, requiredRooms }) {
    try {
        // ✅ Phân tích phân bổ khách
        const guestCapacityAnalysis = calculateMultiRoomCapacity({
            totalGuests: requiredGuests,
            requestedRooms: requiredRooms
        });

        console.log('👥 Guest capacity analysis:', guestCapacityAnalysis);

        // Tìm room types phù hợp với phân bổ khách
        const suitableRoomTypes = await RoomType.find({
            soLuongKhach: { $gte: guestCapacityAnalysis.minCapacityPerRoom },
            tongSoPhong: { $gte: requiredRooms }
        }).select('_id maKhachSan tongSoPhong soLuongKhach tenLoaiPhong');

        if (!suitableRoomTypes.length) {
            console.log('❌ No suitable room types found');
            return [];
        }

        const availableHotelIds = [];

        // Kiểm tra từng room type với enhanced availability check
        for (const roomType of suitableRoomTypes) {
            const isAvailable = await checkEnhancedRoomAvailability({
                hotelId: roomType.maKhachSan,
                roomTypeId: roomType._id,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                bookingType,
                requestedRooms: requiredRooms
            });

            if (isAvailable.isAvailable &&
                isAvailable.availableRooms >= requiredRooms &&
                !availableHotelIds.includes(roomType.maKhachSan.toString())) {

                availableHotelIds.push(roomType.maKhachSan.toString());
                console.log(`✅ Hotel ${roomType.maKhachSan} available with ${roomType.tenLoaiPhong}`);
            }
        }

        return availableHotelIds;

    } catch (error) {
        console.error('❌ Error finding available hotels:', error);
        return [];
    }
}

// ✅ Tính toán phân bổ khách cho nhiều phòng
function calculateMultiRoomCapacity({ totalGuests, requestedRooms, roomCapacity = 2 }) {
    const avgGuestsPerRoom = Math.ceil(totalGuests / requestedRooms);
    const minCapacityPerRoom = Math.max(1, avgGuestsPerRoom);

    // Phân bổ khách theo phòng
    const guestDistribution = [];
    let remainingGuests = totalGuests;

    for (let i = 0; i < requestedRooms && remainingGuests > 0; i++) {
        const guestsInThisRoom = Math.min(minCapacityPerRoom, remainingGuests);
        guestDistribution.push({
            roomNumber: i + 1,
            guests: guestsInThisRoom,
            capacity: minCapacityPerRoom
        });
        remainingGuests -= guestsInThisRoom;
    }

    return {
        totalGuests,
        requestedRooms,
        avgGuestsPerRoom,
        minCapacityPerRoom,
        guestDistribution,
        canAccommodate: remainingGuests === 0,
        remainingGuests
    };
}

// ✅ ENHANCED: Kiểm tra availability chi tiết (copy từ hotel controller)
async function checkEnhancedRoomAvailability({
    hotelId, roomTypeId, bookingType, checkInDate, checkOutDate,
    checkInTime, checkOutTime, requestedRooms
}) {
    try {
        // Lấy thông tin loại phòng
        const roomType = await RoomType.findById(roomTypeId);
        if (!roomType) {
            return { isAvailable: false, availableRooms: 0, reason: "Loại phòng không tồn tại" };
        }

        const totalRooms = roomType.tongSoPhong || 0;
        if (totalRooms === 0) {
            return { isAvailable: false, availableRooms: 0, reason: "Không có phòng" };
        }

        // Xử lý theo loại đặt phòng
        switch (bookingType) {
            case 'theo_gio':
                return await checkHourlyAvailabilityEnhanced({
                    hotelId, roomTypeId, totalRooms, checkInDate, checkInTime, checkOutTime, requestedRooms
                });

            case 'qua_dem':
                return await checkOvernightAvailabilityEnhanced({
                    hotelId, roomTypeId, totalRooms, checkInDate, checkOutDate, requestedRooms
                });

            case 'dai_ngay':
                return await checkLongStayAvailabilityEnhanced({
                    hotelId, roomTypeId, totalRooms, checkInDate, checkOutDate, requestedRooms
                });

            default:
                return { isAvailable: false, availableRooms: 0, reason: "Loại đặt phòng không hỗ trợ" };
        }

    } catch (error) {
        console.error('❌ Enhanced availability check error:', error);
        return { isAvailable: false, availableRooms: 0, reason: "Lỗi hệ thống" };
    }
}

// ✅ Kiểm tra availability theo giờ
async function checkHourlyAvailabilityEnhanced({
    hotelId, roomTypeId, totalRooms, checkInDate, checkInTime, checkOutTime, requestedRooms
}) {
    try {
        const targetDate = moment(checkInDate).startOf('day');
        const requestStart = moment(`${checkInDate} ${checkInTime}`, 'YYYY-MM-DD HH:mm');
        let requestEnd = moment(`${checkInDate} ${checkOutTime}`, 'YYYY-MM-DD HH:mm');

        // Xử lý checkout ngày hôm sau
        if (requestEnd.isSameOrBefore(requestStart)) {
            requestEnd.add(1, 'day');
        }

        // Lấy tất cả booking conflicts
        const conflictingBookings = await Booking.find({
            maKhachSan: hotelId,
            maLoaiPhong: roomTypeId,
            trangThai: { $nin: ['da_huy'] },
            $or: [
                {
                    loaiDatPhong: 'theo_gio',
                    ngayNhanPhong: {
                        $gte: targetDate.toDate(),
                        $lt: targetDate.clone().add(1, 'day').toDate()
                    }
                },
                {
                    loaiDatPhong: { $in: ['qua_dem', 'dai_ngay'] },
                    ngayNhanPhong: { $lte: requestEnd.toDate() },
                    ngayTraPhong: { $gte: requestStart.toDate() }
                }
            ]
        }).select('loaiDatPhong ngayNhanPhong ngayTraPhong gioNhanPhong gioTraPhong soLuongPhong');

        let maxConflictRooms = 0;

        // Kiểm tra từng booking conflict
        for (const booking of conflictingBookings) {
            let isConflict = false;

            if (booking.loaiDatPhong === 'theo_gio') {
                const bookingStart = moment(`${moment(booking.ngayNhanPhong).format('YYYY-MM-DD')} ${booking.gioNhanPhong}`);
                let bookingEnd = moment(`${moment(booking.ngayNhanPhong).format('YYYY-MM-DD')} ${booking.gioTraPhong}`);

                if (bookingEnd.isSameOrBefore(bookingStart)) {
                    bookingEnd.add(1, 'day');
                }

                if (requestStart.isBefore(bookingEnd) && requestEnd.isAfter(bookingStart)) {
                    isConflict = true;
                }
            } else {
                const bookingStart = moment(booking.ngayNhanPhong);
                const bookingEnd = moment(booking.ngayTraPhong);

                if (requestStart.isBefore(bookingEnd) && requestEnd.isAfter(bookingStart)) {
                    isConflict = true;
                }
            }

            if (isConflict) {
                maxConflictRooms += booking.soLuongPhong;
            }
        }

        const availableRooms = Math.max(0, totalRooms - maxConflictRooms);

        return {
            isAvailable: availableRooms >= requestedRooms,
            availableRooms,
            totalRooms,
            bookedRooms: maxConflictRooms
        };

    } catch (error) {
        console.error('❌ Hourly availability error:', error);
        return { isAvailable: false, availableRooms: 0 };
    }
}

// ✅ Kiểm tra availability qua đêm
async function checkOvernightAvailabilityEnhanced({
    hotelId, roomTypeId, totalRooms, checkInDate, checkOutDate, requestedRooms
}) {
    try {
        const startDate = moment(checkInDate);
        const endDate = moment(checkOutDate);

        // Tạo array các ngày cần check
        const datesInRange = [];
        const current = startDate.clone();
        while (current.isBefore(endDate)) {
            datesInRange.push(current.format('YYYY-MM-DD'));
            current.add(1, 'day');
        }

        let minAvailableRooms = totalRooms;

        // Check availability cho từng ngày
        for (const dateStr of datesInRange) {
            const dayStart = moment(dateStr).startOf('day');
            const dayEnd = moment(dateStr).endOf('day');

            const conflictingBookings = await Booking.find({
                maKhachSan: hotelId,
                maLoaiPhong: roomTypeId,
                trangThai: { $nin: ['da_huy'] },
                $or: [
                    { ngayNhanPhong: { $gte: dayStart.toDate(), $lte: dayEnd.toDate() } },
                    { ngayTraPhong: { $gte: dayStart.toDate(), $lte: dayEnd.toDate() } },
                    {
                        ngayNhanPhong: { $lt: dayStart.toDate() },
                        ngayTraPhong: { $gt: dayEnd.toDate() }
                    }
                ]
            }).select('soLuongPhong');

            const dayConflictRooms = conflictingBookings.reduce((sum, booking) =>
                sum + booking.soLuongPhong, 0);

            const dayAvailableRooms = Math.max(0, totalRooms - dayConflictRooms);
            minAvailableRooms = Math.min(minAvailableRooms, dayAvailableRooms);
        }

        return {
            isAvailable: minAvailableRooms >= requestedRooms,
            availableRooms: minAvailableRooms,
            totalRooms,
            bookedRooms: totalRooms - minAvailableRooms
        };

    } catch (error) {
        console.error('❌ Overnight availability error:', error);
        return { isAvailable: false, availableRooms: 0 };
    }
}

// ✅ Kiểm tra availability dài ngày
async function checkLongStayAvailabilityEnhanced({
    hotelId, roomTypeId, totalRooms, checkInDate, checkOutDate, requestedRooms
}) {
    try {
        // Sử dụng cùng logic với overnight
        const overnightResult = await checkOvernightAvailabilityEnhanced({
            hotelId, roomTypeId, totalRooms, checkInDate, checkOutDate, requestedRooms
        });

        // Tính discount cho lưu trú dài ngày
        const stayDuration = moment(checkOutDate).diff(moment(checkInDate), 'days');
        let discount = 0;
        if (stayDuration >= 7) discount = 15;
        else if (stayDuration >= 5) discount = 10;
        else if (stayDuration >= 3) discount = 5;

        return {
            ...overnightResult,
            longStayDiscount: discount,
            stayDuration
        };

    } catch (error) {
        console.error('❌ Long stay availability error:', error);
        return { isAvailable: false, availableRooms: 0 };
    }
}

// ✅ API lấy gợi ý địa điểm đơn giản
searchRouter.get('/locations', async (req, res) => {
    try {
        const { q, type = 'all' } = req.query;

        if (!q || q.length < 2) {
            return res.json({ suggestions: [] });
        }

        const suggestions = [];

        // Gợi ý tỉnh/thành phố
        if (type === 'all' || type === 'provinces') {
            const provinces = await Hotel.aggregate([
                {
                    $match: {
                        'diaChi.tinhThanh': { $regex: q, $options: 'i' }
                    }
                },
                {
                    $group: {
                        _id: '$diaChi.tinhThanh',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]);

            suggestions.push(...provinces.map(p => ({
                type: 'province',
                name: p._id,
                count: p.count
            })));
        }

        // Gợi ý phường/xã
        if (type === 'all' || type === 'wards') {
            const wards = await Hotel.aggregate([
                {
                    $match: {
                        'diaChi.phuongXa': { $regex: q, $options: 'i' }
                    }
                },
                {
                    $group: {
                        _id: {
                            phuongXa: '$diaChi.phuongXa',
                            tinhThanh: '$diaChi.tinhThanh'
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]);

            suggestions.push(...wards.map(w => ({
                type: 'ward',
                name: w._id.phuongXa,
                province: w._id.tinhThanh,
                count: w.count
            })));
        }

        return res.json({ suggestions });

    } catch (error) {
        console.error('❌ Locations API error:', error);
        return res.status(500).json({
            error: error.message
        });
    }
});

// ✅ API chi tiết availability cho khách sạn cụ thể
searchRouter.post('/hotel/:hotelId/availability', async (req, res) => {
    try {
        const { hotelId } = req.params;
        const {
            checkIn,
            checkOut,
            bookingType,
            guests,
            rooms: requestedRooms = 1
        } = req.body;

        // Validate input
        const validation = validateBookingRequest({
            checkIn, checkOut, bookingType,
            guests: parseInt(guests),
            rooms: parseInt(requestedRooms)
        });

        if (!validation.valid) {
            return res.status(400).json({
                message: validation.message,
                error: true
            });
        }

        // Kiểm tra khách sạn tồn tại
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({
                message: 'Khách sạn không tồn tại',
                error: true
            });
        }

        // Lấy tất cả loại phòng của khách sạn
        const roomTypes = await RoomType.find({ maKhachSan: hotelId }).sort({ giaCa: 1 });

        if (!roomTypes.length) {
            return res.status(404).json({
                message: 'Khách sạn chưa có loại phòng nào',
                error: true
            });
        }

        const totalGuests = parseInt(guests);
        const capacityAnalysis = calculateMultiRoomCapacity({
            totalGuests,
            requestedRooms: parseInt(requestedRooms)
        });

        const availableRoomTypes = [];
        const suggestions = [];

        // Kiểm tra từng loại phòng
        for (const roomType of roomTypes) {
            try {
                // Kiểm tra khả năng chứa khách
                const canAccommodate = (roomType.soLuongKhach * parseInt(requestedRooms)) >= totalGuests;

                if (!canAccommodate) {
                    // Tạo đề xuất số phòng cần thiết
                    const suggestedRooms = Math.ceil(totalGuests / roomType.soLuongKhach);
                    if (suggestedRooms <= roomType.tongSoPhong) {
                        suggestions.push({
                            roomTypeId: roomType._id,
                            roomTypeName: roomType.tenLoaiPhong,
                            currentCapacity: roomType.soLuongKhach,
                            suggestedRooms,
                            totalCapacity: roomType.soLuongKhach * suggestedRooms,
                            pricePerRoom: roomType.giaCa,
                            estimatedTotal: roomType.giaCa * suggestedRooms
                        });
                    }
                    continue;
                }

                // Kiểm tra availability
                const availability = await checkEnhancedRoomAvailability({
                    hotelId,
                    roomTypeId: roomType._id,
                    bookingType,
                    checkInDate: checkIn,
                    checkOutDate: checkOut,
                    requestedRooms: parseInt(requestedRooms)
                });

                if (availability.isAvailable && availability.availableRooms >= parseInt(requestedRooms)) {
                    availableRoomTypes.push({
                        roomTypeId: roomType._id,
                        tenLoaiPhong: roomType.tenLoaiPhong,
                        moTa: roomType.moTa,
                        soLuongKhach: roomType.soLuongKhach,
                        giaCa: roomType.giaCa,
                        tongSoPhong: roomType.tongSoPhong,

                        availability: {
                            availableRooms: availability.availableRooms,
                            totalRooms: availability.totalRooms,
                            bookedRooms: availability.bookedRooms,
                            canBookRequestedQuantity: availability.availableRooms >= parseInt(requestedRooms)
                        },

                        capacityInfo: {
                            requestedRooms: parseInt(requestedRooms),
                            totalCapacity: roomType.soLuongKhach * parseInt(requestedRooms),
                            guestDistribution: capacityAnalysis.guestDistribution,
                            occupancyRate: Math.round((totalGuests / (roomType.soLuongKhach * parseInt(requestedRooms))) * 100)
                        },

                        pricing: {
                            pricePerRoom: roomType.giaCa,
                            totalPrice: roomType.giaCa * parseInt(requestedRooms),
                            bookingType,
                            // Giảm giá nhóm nếu >= 3 phòng
                            groupDiscount: parseInt(requestedRooms) >= 3 ? 0.05 : 0,
                            finalPrice: Math.round(roomType.giaCa * parseInt(requestedRooms) *
                                (1 - (parseInt(requestedRooms) >= 3 ? 0.05 : 0)))
                        }
                    });
                }

            } catch (error) {
                console.error(`❌ Error checking room type ${roomType._id}:`, error);
            }
        }

        return res.json({
            message: availableRoomTypes.length > 0
                ? `Tìm thấy ${availableRoomTypes.length} loại phòng có sẵn`
                : 'Không tìm thấy phòng phù hợp',

            hotelInfo: {
                id: hotel._id,
                name: hotel.tenKhachSan,
                address: hotel.diaChiDayDu,
                location: {
                    tinhThanh: hotel.diaChi?.tinhThanh,
                    phuongXa: hotel.diaChi?.phuongXa
                }
            },

            searchCriteria: {
                checkIn,
                checkOut,
                bookingType,
                guests: totalGuests,
                rooms: parseInt(requestedRooms)
            },

            capacityAnalysis,
            availableRoomTypes,

            // Đề xuất nếu không có phòng phù hợp
            suggestions: availableRoomTypes.length === 0 ? suggestions.slice(0, 3) : null,

            statistics: {
                totalRoomTypes: roomTypes.length,
                availableRoomTypes: availableRoomTypes.length,
                totalAvailableRooms: availableRoomTypes.reduce((sum, room) =>
                    sum + room.availability.availableRooms, 0)
            }
        });

    } catch (error) {
        console.error('❌ Hotel availability error:', error);
        return res.status(500).json({
            message: 'Lỗi máy chủ',
            error: error.message
        });
    }
});

module.exports = searchRouter;