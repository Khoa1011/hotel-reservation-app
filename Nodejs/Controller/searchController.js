const express = require("express");
const mongoose = require("mongoose");
const Hotel = require('../Model/Hotel/Hotel');
const RoomType = require('../Model/RoomType/RoomType');
const Booking = require('../Model/Booking/Booking');
const moment = require('moment-timezone');
const Room = require('../Model/Room/Room');
const RoomAvailability = require('../Model/Room/RoomAvailability');

const searchRouter = express.Router();

// 🔍 API TÌM KIẾM KHÁCH SẠN ĐỚN GIẢN 2025
searchRouter.get('/search', async (req, res) => {
    try {
        // 📥 NHẬN CÁC THAM SỐ CẦN THIẾT
        const {
            // === TÌM KIẾM TỔNG QUÁT ===
            keyword,           // Từ khóa tìm kiếm (tên khách sạn, địa điểm)
            showAll,           // Flag để hiển thị tất cả khách sạn
            sortBy,            // Tùy chọn sắp xếp

            // === ĐỊA ĐIỂM ===
            thanhPho,          // Thành phố
            quan,              // Quận/Huyện
            phuong,            // Phường/Xã (optional)

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

        // ✅ VALIDATE PARAMETERS (FLEXIBLE)
        if (guests && parseInt(guests) < 1) {
            return res.status(400).json({
                message: 'Số khách phải ít nhất 1',
                error: true
            });
        }

        if (rooms && parseInt(rooms) < 1) {
            return res.status(400).json({
                message: 'Số phòng phải ít nhất 1',
                error: true
            });
        }

        // ✅ FLEXIBLE: Chỉ validate ngày nếu có cả checkIn và checkOut
        if (checkIn && checkOut) {
            if (!moment(checkIn, 'YYYY-MM-DD', true).isValid()) {
                return res.status(400).json({
                    message: 'Ngày nhận phòng không hợp lệ',
                    error: true
                });
            }

            if (!moment(checkOut, 'YYYY-MM-DD', true).isValid()) {
                return res.status(400).json({
                    message: 'Ngày trả phòng không hợp lệ',
                    error: true
                });
            }

            const checkInMoment = moment(checkIn);
            const checkOutMoment = moment(checkOut);

            if (checkInMoment.isSameOrAfter(checkOutMoment)) {
                return res.status(400).json({
                    message: 'Ngày trả phòng phải sau ngày nhận phòng',
                    error: true
                });
            }
        }

        // ✅ KIỂM TRA REQUEST LOAD TẤT CẢ
        const isShowAllRequest = showAll === 'true' || (
            !keyword &&
            !thanhPho &&
            !quan &&
            !phuong &&
            !minPrice &&
            !maxPrice &&
            !guests &&
            !rooms &&
            !checkIn &&
            !checkOut
        );

        // 🏗️ XÂY DỰNG PIPELINE TÌM KIẾM
        const pipeline = [];

        // 🎯 BƯỚC 1: FILTER CƠ BẢN (chỉ hotel hoạt động)
        const basicMatch = { trangThai: "hoatDong" };

        if (!isShowAllRequest) {
            // TÌM KIẾM THEO KEYWORD
            if (keyword) {
                basicMatch.$or = [
                    { tenKhachSan: { $regex: keyword, $options: 'i' } },
                    { diaChiDayDu: { $regex: keyword, $options: 'i' } },
                    { moTa: { $regex: keyword, $options: 'i' } },
                    { 'diaChi.thanhPho': { $regex: keyword, $options: 'i' } },
                    { 'diaChi.quan': { $regex: keyword, $options: 'i' } },
                    { 'diaChi.phuong': { $regex: keyword, $options: 'i' } }
                ];
            }

            // TÌM KIẾM THEO ĐỊA ĐIỂM
            if (thanhPho) {
                basicMatch['diaChi.thanhPho'] = { $regex: thanhPho, $options: 'i' };
            }
            if (quan) {
                basicMatch['diaChi.quan'] = { $regex: quan, $options: 'i' };
            }
            if (phuong) {
                basicMatch['diaChi.phuong'] = { $regex: phuong, $options: 'i' };
            }
        }

        pipeline.push({ $match: basicMatch });

        // ✅ DEBUG: Log hotels after basic match
        const hotelsAfterBasic = await Hotel.aggregate([...pipeline, { $project: { _id: 1, tenKhachSan: 1 } }]);
        console.log(`🔍 DEBUG: Hotels after basic match: ${hotelsAfterBasic.length}`);
        if (hotelsAfterBasic.length > 0) {
            console.log('🔍 DEBUG: Sample hotels:', hotelsAfterBasic.slice(0, 3));
        }

        // 🔗 BƯỚC 2: JOIN VỚI ROOM TYPES VÀ ACTUAL ROOMS
        pipeline.push({
            $lookup: {
                from: 'loaiphongs',
                localField: '_id',
                foreignField: 'maKhachSan',
                as: 'roomTypes'
            }
        });

        // ✅ ĐIỀU KIỆN TIÊN QUYẾT: JOIN VỚI ACTUAL ROOMS
        pipeline.push({
            $lookup: {
                from: 'phongs',
                let: { hotelId: '$_id' },
                pipeline: [
                    {
                        $lookup: {
                            from: 'loaiphongs',
                            localField: 'maLoaiPhong',
                            foreignField: '_id',
                            as: 'roomTypeInfo'
                        }
                    },
                    { $unwind: '$roomTypeInfo' },
                    {
                        $match: {
                            $expr: { $eq: ['$roomTypeInfo.maKhachSan', '$$hotelId'] },
                            trangThaiPhong: 'trong'
                        }
                    }
                ],
                as: 'availableRooms'
            }
        });

        // ✅ BƯỚC 3: TÍNH TOÁN THÔNG TIN CƠ BẢN VÀ ĐIỀU KIỆN TIÊN QUYẾT
        pipeline.push({
            $addFields: {
                minRoomPrice: { $min: '$roomTypes.giaCa' },
                maxRoomPrice: { $max: '$roomTypes.giaCa' },
                totalRoomTypes: { $size: '$roomTypes' },
                totalAvailableRooms: { $size: '$availableRooms' },

                // TÍNH POPULARITY SCORE
                popularityScore: {
                    $add: [
                        { $multiply: ['$soSao', 3] },
                        { $size: '$roomTypes' },
                        { $multiply: [{ $size: '$availableRooms' }, 0.5] }
                    ]
                },

                // RELEVANCE SCORE cho keyword search
                relevanceScore: {
                    $cond: {
                        if: { $and: [{ $ne: [keyword, null] }, { $ne: [keyword, ""] }] },
                        then: {
                            $add: [
                                {
                                    $cond: [
                                        { $regexMatch: { input: '$tenKhachSan', regex: keyword || '', options: 'i' } },
                                        10, 0
                                    ]
                                },
                                {
                                    $cond: [
                                        { $regexMatch: { input: '$diaChiDayDu', regex: keyword || '', options: 'i' } },
                                        5, 0
                                    ]
                                },
                                { $multiply: ['$soSao', 1] }
                            ]
                        },
                        else: '$soSao'
                    }
                }
            }
        });

        // ✅ ĐIỀU KIỆN TIÊN QUYẾT: Chỉ giữ lại hotels có phòng trống và room types
        pipeline.push({
            $match: {
                totalRoomTypes: { $gt: 0 },
                totalAvailableRooms: { $gt: 0 }
            }
        });

        // ✅ DEBUG: Log hotels after availability check
        const hotelsAfterAvailability = await Hotel.aggregate([...pipeline, { $project: { _id: 1, tenKhachSan: 1, totalAvailableRooms: 1 } }]);
        console.log(`🔍 DEBUG: Hotels after availability check: ${hotelsAfterAvailability.length}`);
        if (hotelsAfterAvailability.length > 0) {
            console.log('🔍 DEBUG: Sample available hotels:', hotelsAfterAvailability.slice(0, 3));
        }

        // ✅ BƯỚC 4: KIỂM TRA CAPACITY ĐơN GIẢN HƠN
        if (guests && rooms && !isShowAllRequest) {
            const requiredGuests = parseInt(guests);
            const requiredRooms = parseInt(rooms);

            console.log(`🔍 DEBUG: Checking capacity for ${requiredGuests} guests, ${requiredRooms} rooms`);

            // Đơn giản hóa: chỉ check có phòng có capacity đủ không
            pipeline.push({
                $addFields: {
                    hasValidCapacity: {
                        $anyElementTrue: {
                            $map: {
                                input: '$availableRooms',
                                as: 'room',
                                in: {
                                    $gte: [{ $ifNull: ['$$room.soLuongNguoiToiDa', 2] }, requiredGuests]
                                }
                            }
                        }
                    }
                }
            });

            // Debug capacity check
            const hotelsAfterCapacity = await Hotel.aggregate([
                ...pipeline,
                { $project: { _id: 1, tenKhachSan: 1, hasValidCapacity: 1, totalAvailableRooms: 1 } }
            ]);
            console.log(`🔍 DEBUG: Hotels after capacity check: ${hotelsAfterCapacity.length}`);
            console.log('🔍 DEBUG: Capacity results:', hotelsAfterCapacity.slice(0, 3));

            // Filter chỉ giữ hotels có capacity phù hợp
            pipeline.push({
                $match: {
                    hasValidCapacity: true
                }
            });
        }

        // ✅ BƯỚC 5: KIỂM TRA AVAILABILITY CHO NGÀY CỤ THỂ (FLEXIBLE)
        if (!isShowAllRequest && checkIn && checkOut) {
            console.log('🔍 Checking availability for date range...');

            // Lấy hotels hiện tại từ pipeline
            const currentHotels = await Hotel.aggregate([...pipeline, { $project: { _id: 1 } }]);
            console.log(`🔍 Hotels before availability check: ${currentHotels.length}`);

            if (currentHotels.length > 0) {
                const hotelIds = currentHotels.map(h => h._id);
                const availableHotels = await findAvailableHotelsForDateRange({
                    hotelIds,
                    checkIn,
                    checkOut,
                    requiredGuests: guests ? parseInt(guests) : 1,
                    requiredRooms: rooms ? parseInt(rooms) : 1,
                    minPrice: minPrice ? parseFloat(minPrice) : null,
                    maxPrice: maxPrice ? parseFloat(maxPrice) : null
                });

                console.log(`🔍 Available hotels after date check: ${availableHotels.length}`);

                if (availableHotels.length > 0) {
                    pipeline.push({
                        $match: {
                            _id: { $in: availableHotels.map(h => new mongoose.Types.ObjectId(h.hotelId)) }
                        }
                    });

                    // Thêm thông tin số phòng trống
                    pipeline.push({
                        $addFields: {
                            availableRoomsCount: {
                                $switch: {
                                    branches: availableHotels.map(hotel => ({
                                        case: { $eq: ['$_id', new mongoose.Types.ObjectId(hotel.hotelId)] },
                                        then: hotel.availableRooms
                                    })),
                                    default: 0
                                }
                            }
                        }
                    });
                } else {
                    return res.json({
                        message: 'Không tìm thấy khách sạn có phòng trống trong thời gian này',
                        searchInfo: {
                            keyword: keyword || null,
                            thanhPho: thanhPho || null,
                            quan: quan || null,
                            checkIn, checkOut,
                            guests: guests ? parseInt(guests) : null,
                            rooms: rooms ? parseInt(rooms) : null
                        },
                        hotels: [],
                        total: 0,
                        suggestions: await generateSuggestions({ thanhPho, quan, checkIn, checkOut })
                    });
                }
            }
        } else {
            // Không có filter ngày - chỉ dùng số phòng available hiện tại
            pipeline.push({
                $addFields: {
                    availableRoomsCount: '$totalAvailableRooms'
                }
            });
        }

        // ✅ BƯỚC 6: FILTER THEO GIÁ - SỬA LOGIC
        if (!isShowAllRequest && (minPrice || maxPrice)) {
            const priceMatch = {};
            // Logic mới: Hotel có ít nhất 1 phòng trong range
            if (minPrice && maxPrice) {
                priceMatch.minRoomPrice = {
                    $gte: parseFloat(minPrice),
                    $lte: parseFloat(maxPrice)
                };
            } else if (minPrice) {
                priceMatch.maxRoomPrice = { $gte: parseFloat(minPrice) };
            } else if (maxPrice) {
                priceMatch.minRoomPrice = { $lte: parseFloat(maxPrice) };
            }

            if (Object.keys(priceMatch).length > 0) {
                pipeline.push({ $match: priceMatch });

                
                // ✅ DEBUG: Log hotels sau khi filter giá
                const hotelsAfterPrice = await Hotel.aggregate([
                    ...pipeline,
                    { $project: { _id: 1, tenKhachSan: 1, minRoomPrice: 1 } }
                ]);
                console.log(`🔍 DEBUG: Hotels after price filter: ${hotelsAfterPrice.length}`);
                if (hotelsAfterPrice.length > 0) {
                    console.log('🔍 DEBUG: Sample hotels with prices:', hotelsAfterPrice.slice(0, 3));
                }
            }
        }

        // 🔄 BƯỚC 7: SẮP XẾP MẶC ĐỊNH (KHÔNG CÓ SORTBY)
        const sortCriteria = {};
        if (keyword) {
            sortCriteria.relevanceScore = -1;
        }
        sortCriteria.soSao = -1;
        sortCriteria.totalRoomTypes = -1;
        sortCriteria.tenKhachSan = 1;

        pipeline.push({ $sort: sortCriteria });

        // 📊 BƯỚC 8: SELECT FIELDS TRẢ VỀ
        pipeline.push({
            $project: {
                _id: 1,
                tenKhachSan: 1,
                diaChiDayDu: 1,
                'diaChi.thanhPho': 1,
                'diaChi.quan': 1,
                'diaChi.phuong': 1,
                'diaChi.soNha': 1,
                'diaChi.tenDuong': 1,
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

                // ✅ THÊM: Số phòng trống (KEY REQUIREMENT)
                availableRoomsCount: 1,

                // Debug scores (chỉ khi có keyword)
                ...(keyword && { relevanceScore: 1 }),

                // Location info
                location: {
                    thanhPho: '$diaChi.thanhPho',
                    quan: '$diaChi.quan',
                    phuong: '$diaChi.phuong',
                    soNha: '$diaChi.soNha',
                    tenDuong: '$diaChi.tenDuong',
                    fullAddress: '$diaChiDayDu'
                },

                giaTheoNgay: '$minRoomPrice',
                hasImage: { $ne: ['$hinhAnh', ''] }
            }
        });

        // ⚡ THỰC HIỆN QUERY
        console.log('🔍 Executing final pipeline...');
        const hotels = await Hotel.aggregate(pipeline);
        console.log(`🔍 Final result: ${hotels.length} hotels`);

        // ✅ TẠO MESSAGE THÔNG MINH
        const message = createSearchMessage({
            hotels: hotels.length,
            keyword,
            thanhPho,
            quan,
            phuong,
            hasDateFilter: !!(checkIn && checkOut)
        });

        // 📤 TRẢ VỀ KẾT QUẢ
        return res.json({
            message,
            searchInfo: {
                keyword: keyword || null,
                thanhPho: thanhPho || null,
                quan: quan || null,
                phuong: phuong || null,
                guests: guests ? parseInt(guests) : null,
                rooms: rooms ? parseInt(rooms) : null,
                checkIn: checkIn || null,
                checkOut: checkOut || null,
                priceRange: {
                    min: minPrice ? parseFloat(minPrice) : null,
                    max: maxPrice ? parseFloat(maxPrice) : null
                },
                showAll: isShowAllRequest
            },
            hotels,
            total: hotels.length,
            // Thêm suggestions nếu ít kết quả
            ...(hotels.length === 0 && {
                suggestions: await generateSuggestions({ thanhPho, quan, keyword })
            })
        });

    } catch (error) {
        console.error('❌ Search API error:', error);
        return res.status(500).json({
            message: 'Lỗi máy chủ khi tìm kiếm',
            error: error.message
        });
    }
});

// ✅ API lấy gợi ý địa điểm theo schema hiện tại
searchRouter.get('/locations', async (req, res) => {
    try {
        const { q, type = 'all' } = req.query;

        if (!q || q.length < 2) {
            return res.json({ suggestions: [] });
        }

        const suggestions = [];

        // Gợi ý thành phố
        if (type === 'all' || type === 'cities') {
            const cities = await Hotel.aggregate([
                {
                    $match: {
                        'diaChi.thanhPho': { $regex: q, $options: 'i' }
                    }
                },
                {
                    $group: {
                        _id: '$diaChi.thanhPho',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]);

            suggestions.push(...cities.map(c => ({
                type: 'city',
                name: c._id,
                count: c.count
            })));
        }

        // Gợi ý quận/huyện
        if (type === 'all' || type === 'districts') {
            const districts = await Hotel.aggregate([
                {
                    $match: {
                        'diaChi.quan': { $regex: q, $options: 'i' }
                    }
                },
                {
                    $group: {
                        _id: {
                            quan: '$diaChi.quan',
                            thanhPho: '$diaChi.thanhPho'
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]);

            suggestions.push(...districts.map(d => ({
                type: 'district',
                name: d._id.quan,
                city: d._id.thanhPho,
                count: d.count
            })));
        }

        // Gợi ý phường/xã
        if (type === 'all' || type === 'wards') {
            const wards = await Hotel.aggregate([
                {
                    $match: {
                        'diaChi.phuong': { $regex: q, $options: 'i' }
                    }
                },
                {
                    $group: {
                        _id: {
                            phuong: '$diaChi.phuong',
                            quan: '$diaChi.quan',
                            thanhPho: '$diaChi.thanhPho'
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]);

            suggestions.push(...wards.map(w => ({
                type: 'ward',
                name: w._id.phuong,
                district: w._id.quan,
                city: w._id.thanhPho,
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

                const actualRoomCount = await Room.countDocuments({
                    maLoaiPhong: roomType._id,
                    trangThaiPhong: "trong"
                });

                // Kiểm tra khả năng chứa khách
                const realCapacity = await getRealRoomCapacity(roomType._id);
                const effectiveCapacity = realCapacity.averageCapacity;

                // Skip nếu không có phòng thực tế
                if (realCapacity.totalRooms === 0) {
                    console.log(`⚠️ Room type "${roomType.tenLoaiPhong}" has no actual rooms - skipping`);
                    continue;
                }

                const canAccommodate = (effectiveCapacity * parseInt(requestedRooms)) >= totalGuests;

                if (!canAccommodate) {
                    // Tạo đề xuất số phòng cần thiết
                    const suggestedRooms = Math.ceil(totalGuests / effectiveCapacity);
                    if (suggestedRooms <= actualRoomCount) {
                        suggestions.push({
                            roomTypeId: roomType._id,
                            roomTypeName: roomType.tenLoaiPhong,
                            currentCapacity: effectiveCapacity,
                            suggestedRooms,
                            totalCapacity: effectiveCapacity * suggestedRooms,
                            pricePerRoom: roomType.giaCa,
                            estimatedTotal: roomType.giaCa * suggestedRooms,
                            actualRoomCount
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
                        soLuongKhach: effectiveCapacity,
                        giaCa: roomType.giaCa,
                        tongSoPhong: actualRoomCount,

                        availability: {
                            availableRooms: availability.availableRooms,
                            totalRooms: availability.totalRooms,
                            bookedRooms: availability.bookedRooms,
                            canBookRequestedQuantity: availability.availableRooms >= parseInt(requestedRooms)
                        },

                        capacityInfo: {
                            requestedRooms: parseInt(requestedRooms),
                            totalCapacity: effectiveCapacity * parseInt(requestedRooms),
                            guestDistribution: capacityAnalysis.guestDistribution,
                            occupancyRate: Math.round((totalGuests / (effectiveCapacity * parseInt(requestedRooms))) * 100)
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
                    thanhPho: hotel.diaChi?.thanhPho,
                    quan: hotel.diaChi?.quan,
                    phuong: hotel.diaChi?.phuong
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

// =============================================================================
// 🔧 HELPER FUNCTIONS - CÁC HÀM HELPER KHÔNG THAY ĐỔI
// =============================================================================

async function findAvailableHotelsForDateRange({
    hotelIds, checkIn, checkOut, requiredGuests, requiredRooms, minPrice, maxPrice
}) {
    const availableHotels = [];

    for (const hotelId of hotelIds) {
        try {
            // Lấy room types của hotel với price filter
            let roomTypeQuery = { maKhachSan: hotelId };
            if (minPrice || maxPrice) {
                if (minPrice) roomTypeQuery.giaCa = { $gte: minPrice };
                if (maxPrice) roomTypeQuery.giaCa = { ...roomTypeQuery.giaCa, $lte: maxPrice };
            }

            const roomTypes = await RoomType.find(roomTypeQuery);
            if (!roomTypes.length) continue;

            let hotelAvailableRooms = 0;

            // Kiểm tra từng room type
            for (const roomType of roomTypes) {
                // Lấy actual rooms
                const actualRooms = await Room.find({
                    maLoaiPhong: roomType._id,
                    trangThaiPhong: 'trong'
                });

                if (actualRooms.length < requiredRooms) continue;

                // Check capacity
                const avgCapacity = actualRooms.reduce((sum, room) =>
                    sum + (room.soLuongNguoiToiDa || 2), 0) / actualRooms.length;

                if (Math.floor(avgCapacity * requiredRooms) < requiredGuests) continue;

                // Check availability trong khoảng thời gian (KHÔNG CẦN BOOKINGTYPE)
                const availability = await checkDateRangeAvailability({
                    hotelId,
                    roomTypeId: roomType._id,
                    checkIn,
                    checkOut,
                    requiredRooms,
                    totalRooms: actualRooms.length
                });

                if (availability.isAvailable) {
                    hotelAvailableRooms += availability.availableRooms;
                }
            }

            if (hotelAvailableRooms >= requiredRooms) {
                availableHotels.push({
                    hotelId: hotelId.toString(),
                    availableRooms: hotelAvailableRooms
                });
            }

        } catch (error) {
            console.error(`❌ Error checking hotel ${hotelId}:`, error);
        }
    }

    return availableHotels;
}



async function checkDateRangeAvailability({
    hotelId, roomTypeId, checkIn, checkOut, requiredRooms, totalRooms
}) {
    try {
        const startDate = moment(checkIn);
        const endDate = moment(checkOut);

        // Build conflict query cho TẤT CẢ loại booking trong date range
        const conflictQuery = {
            maKhachSan: hotelId,
            maLoaiPhong: roomTypeId,
            trangThai: { $nin: ['da_huy', 'khong_nhan_phong'] },
            // Conflict nếu có overlap với date range
            $or: [
                {
                    ngayNhanPhong: { $lt: endDate.toDate() },
                    ngayTraPhong: { $gt: startDate.toDate() }
                }
            ]
        };

        const conflictingBookings = await Booking.find(conflictQuery).select('soLuongPhong');

        const totalConflictRooms = conflictingBookings.reduce((sum, booking) =>
            sum + (booking.soLuongPhong || 1), 0);

        const availableRooms = Math.max(0, totalRooms - totalConflictRooms);

        return {
            isAvailable: availableRooms >= requiredRooms,
            availableRooms,
            totalRooms,
            bookedRooms: totalConflictRooms
        };

    } catch (error) {
        console.error('❌ Error checking date range availability:', error);
        return { isAvailable: false, availableRooms: 0 };
    }
}



async function getRealRoomCapacity(roomTypeId) {
    try {
        const rooms = await Room.find({
            maLoaiPhong: roomTypeId,
            trangThaiPhong: "trong"
        }).select('soLuongNguoiToiDa _id');

        if (!rooms || rooms.length === 0) {
            const roomType = await RoomType.findById(roomTypeId);
            return {
                averageCapacity: roomType?.soLuongKhach || 2,
                minCapacity: roomType?.soLuongKhach || 2,
                maxCapacity: roomType?.soLuongKhach || 2,
                totalRooms: 0,
                capacitySource: 'room_type_fallback'
            };
        }

        const capacities = rooms.map(room => room.soLuongNguoiToiDa || 2);
        const averageCapacity = Math.round(capacities.reduce((sum, cap) => sum + cap, 0) / capacities.length);
        const minCapacity = Math.min(...capacities);
        const maxCapacity = Math.max(...capacities);

        return {
            averageCapacity,
            minCapacity,
            maxCapacity,
            totalRooms: rooms.length,
            capacitySource: 'actual_rooms'
        };
    } catch (error) {
        console.error('❌ Lỗi lấy capacity phòng:', error);
        return {
            averageCapacity: 2,
            minCapacity: 2,
            maxCapacity: 2,
            totalRooms: 0,
            capacitySource: 'error_fallback'
        };
    }
}

async function findAvailableHotelsForDates({
    hotelIds, checkIn, checkOut, bookingType, requiredGuests, requiredRooms, minPrice, maxPrice
}) {
    const availableHotels = [];

    for (const hotelId of hotelIds) {
        try {
            // Lấy room types của hotel với price filter
            let roomTypeQuery = { maKhachSan: hotelId };
            if (minPrice || maxPrice) {
                if (minPrice) roomTypeQuery.giaCa = { $gte: minPrice };
                if (maxPrice) roomTypeQuery.giaCa = { ...roomTypeQuery.giaCa, $lte: maxPrice };
            }

            const roomTypes = await RoomType.find(roomTypeQuery);
            if (!roomTypes.length) continue;

            let hotelAvailableRooms = 0;

            // Kiểm tra từng room type
            for (const roomType of roomTypes) {
                // Lấy actual rooms
                const actualRooms = await Room.find({
                    maLoaiPhong: roomType._id,
                    trangThaiPhong: 'trong'
                });

                if (actualRooms.length < requiredRooms) continue;

                // Check capacity
                const avgCapacity = actualRooms.reduce((sum, room) =>
                    sum + (room.soLuongNguoiToiDa || 2), 0) / actualRooms.length;

                if (Math.floor(avgCapacity * requiredRooms) < requiredGuests) continue;

                // Check availability trong khoảng thời gian
                const availability = await checkRoomTypeAvailabilityOptimized({
                    hotelId,
                    roomTypeId: roomType._id,
                    checkIn,
                    checkOut,
                    bookingType,
                    requiredRooms,
                    totalRooms: actualRooms.length
                });

                if (availability.isAvailable) {
                    hotelAvailableRooms += availability.availableRooms;
                }
            }

            if (hotelAvailableRooms >= requiredRooms) {
                availableHotels.push({
                    hotelId: hotelId.toString(),
                    availableRooms: hotelAvailableRooms
                });
            }

        } catch (error) {
            console.error(`❌ Error checking hotel ${hotelId}:`, error);
        }
    }

    return availableHotels;
}

async function checkRoomTypeAvailabilityOptimized({
    hotelId, roomTypeId, checkIn, checkOut, bookingType, requiredRooms, totalRooms
}) {
    try {
        const startDate = moment(checkIn);
        const endDate = moment(checkOut);

        // Build conflict query dựa trên booking type
        const conflictQuery = {
            maKhachSan: hotelId,
            maLoaiPhong: roomTypeId,
            trangThai: { $nin: ['da_huy', 'khong_nhan_phong'] }
        };

        switch (bookingType) {
            case 'theo_gio':
                conflictQuery.$or = [
                    {
                        loaiDatPhong: 'theo_gio',
                        ngayNhanPhong: {
                            $gte: startDate.startOf('day').toDate(),
                            $lt: startDate.clone().add(1, 'day').startOf('day').toDate()
                        }
                    },
                    {
                        loaiDatPhong: { $in: ['qua_dem', 'dai_ngay'] },
                        ngayNhanPhong: { $lt: endDate.toDate() },
                        ngayTraPhong: { $gt: startDate.toDate() }
                    }
                ];
                break;

            case 'qua_dem':
            case 'dai_ngay':
                conflictQuery.$or = [
                    {
                        ngayNhanPhong: { $lt: endDate.toDate() },
                        ngayTraPhong: { $gt: startDate.toDate() }
                    }
                ];
                break;
        }

        const conflictingBookings = await Booking.find(conflictQuery).select('soLuongPhong');

        const totalConflictRooms = conflictingBookings.reduce((sum, booking) =>
            sum + (booking.soLuongPhong || 1), 0);

        const availableRooms = Math.max(0, totalRooms - totalConflictRooms);

        return {
            isAvailable: availableRooms >= requiredRooms,
            availableRooms,
            totalRooms,
            bookedRooms: totalConflictRooms
        };

    } catch (error) {
        console.error('❌ Error checking room type availability:', error);
        return { isAvailable: false, availableRooms: 0 };
    }
}


// ✅ Tạo search message - CẢI TIẾN TỪ LOGIC CŨ  
function createSearchMessage({ hotels, keyword, thanhPho, quan, phuong, sortBy, isShowAllRequest, hasDateFilter }) {
    const sortText = sortBy ? ` (${sortBy})` : '';

    if (isShowAllRequest) {
        return `Hiển thị tất cả khách sạn${sortText} (${hotels} kết quả)`;
    } else if (keyword && (thanhPho || quan || phuong)) {
        const location = [phuong, quan, thanhPho].filter(Boolean).join(', ');
        return `Tìm thấy ${hotels} khách sạn tại ${location}${sortText}`;
    } else if (hasDateFilter) {
        return `Tìm thấy ${hotels} khách sạn có phòng trống${sortText}`;
    } else {
        return `Tìm thấy ${hotels} khách sạn phù hợp${sortText}`;
    }
}

async function generateSuggestions({ thanhPho, quan, keyword }) {
    try {
        const suggestions = [];

        // Gợi ý địa điểm gần đó
        if (thanhPho) {
            const nearbyDistricts = await Hotel.aggregate([
                {
                    $match: {
                        'diaChi.thanhPho': { $regex: thanhPho, $options: 'i' },
                        trangThai: 'hoatDong'
                    }
                },
                {
                    $group: {
                        _id: '$diaChi.quan',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 3 }
            ]);

            suggestions.push(...nearbyDistricts.map(d => ({
                type: 'location',
                text: `Thử tìm tại ${d._id}, ${thanhPho}`,
                params: { thanhPho, quan: d._id }
            })));
        }

        // Gợi ý từ khóa tương tự
        if (keyword) {
            const similarKeywords = ['khách sạn', 'resort', 'hotel', 'nhà nghỉ'];
            const keywordSuggestions = similarKeywords
                .filter(k => k !== keyword.toLowerCase())
                .slice(0, 2)
                .map(k => ({
                    type: 'keyword',
                    text: `Thử tìm "${k}"`,
                    params: { keyword: k }
                }));

            suggestions.push(...keywordSuggestions);
        }

        return suggestions.slice(0, 3);
    } catch (error) {
        console.error('❌ Error generating suggestions:', error);
        return [];
    }
}

// ✅ Validate yêu cầu đặt phòng
function validateBookingRequest({ checkIn, checkOut, guests, rooms }) {
    // Validate dates
    if (!moment(checkIn, 'YYYY-MM-DD', true).isValid()) {
        return { valid: false, message: 'Ngày nhận phòng không hợp lệ' };
    }

    if (!moment(checkOut, 'YYYY-MM-DD', true).isValid()) {
        return { valid: false, message: 'Ngày trả phòng không hợp lệ' };
    }

    const checkInMoment = moment(checkIn);
    const checkOutMoment = moment(checkOut);

    if (checkInMoment.isSameOrAfter(checkOutMoment)) {
        return { valid: false, message: 'Ngày trả phòng phải sau ngày nhận phòng' };
    }

    // Validate guests và rooms
    if (guests && guests < 1) {
        return { valid: false, message: 'Số khách phải ít nhất 1' };
    }

    if (rooms && rooms < 1) {
        return { valid: false, message: 'Số phòng phải ít nhất 1' };
    }

    return { valid: true };
}

// ✅ Tính toán phân bổ khách cho nhiều phòng
function calculateMultiRoomCapacity({ totalGuests, requestedRooms }) {
    if (requestedRooms <= 0) return {
        totalGuests,
        requestedRooms,
        avgGuestsPerRoom: 0,
        minCapacityPerRoom: 0,
        guestDistribution: [],
        canAccommodate: false,
        remainingGuests: totalGuests
    };

    const baseGuestsPerRoom = Math.floor(totalGuests / requestedRooms);
    let remainingGuests = totalGuests % requestedRooms;

    const guestDistribution = [];
    for (let i = 0; i < requestedRooms; i++) {
        const guestsInRoom = baseGuestsPerRoom + (remainingGuests > 0 ? 1 : 0);
        guestDistribution.push({
            roomNumber: i + 1,
            guests: guestsInRoom,
            capacity: guestsInRoom
        });
        if (remainingGuests > 0) remainingGuests--;
    }

    return {
        totalGuests,
        requestedRooms,
        avgGuestsPerRoom: baseGuestsPerRoom,
        minCapacityPerRoom: guestDistribution[0]?.capacity || 0,
        guestDistribution,
        canAccommodate: true,
        remainingGuests: 0
    };
}

// ✅ ENHANCED: Kiểm tra availability chi tiết
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

        const totalRooms = await Room.countDocuments({
            maLoaiPhong: roomTypeId,
            trangThaiPhong: "trong"
        });

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

module.exports = searchRouter;