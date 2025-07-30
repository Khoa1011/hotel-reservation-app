const express = require("express");
const mongoose = require("mongoose");
const Room = require('../Model/Room/Room');
const RoomType = require('../Model/RoomType/RoomType');
const {
    uploadHotel,
    handleMulterError,
    logUploadProcess,
    getRelativePath,
    deleteFiles
} = require('../config/upload');
const Hotel = require("../Model/Hotel/Hotel");
const { route } = require("./userController");
const router = express.Router();
const Booking = require("../Model/Booking/Booking");
const RoomImage = require("../Model/Room/RoomImage");
const RoomAvailability = require("../Model/Room/RoomAvailability");
const moment = require('moment-timezone');
const AmenityDetails = require("../Model/Amenities/AmenityDetails");
const Amenities = require("../Model/Amenities/Amenities");


router.post("/upload",
    logUploadProcess,
    uploadHotel.single("hinhAnh"),
    handleMulterError,
    async (req, res) => {
        try {
            const newHotel = new Hotel({
                tenKhachSan: req.body.tenKhachSan,

                // ✅ SỬ DỤNG CẤU TRÚC 2025
                diaChi: {
                    tinhThanh: req.body.tinhThanh,      // ✅ Tỉnh/thành phố
                    phuongXa: req.body.phuongXa,        // ✅ Phường/xã
                    soNha: req.body.soNha               // ✅ Số nhà, tên đường
                },

                moTa: req.body.moTa,
                soSao: req.body.soSao,
                soDienThoai: req.body.soDienThoai,
                email: req.body.email,
                loaiKhachSan: req.body.loaiKhachSan || 'khachSan',
                hinhAnh: req.file ? getRelativePath(req.file.path) : "",
            });

            await newHotel.save();

            if (req.folderInfo) {
                console.log(`✅ Hotel created successfully in: ${req.folderInfo.hotelPath}`);
                console.log(`🏨 Hotel: ${req.folderInfo.hotelName}`);
            }

            res.status(201).json({ message: "Thêm khách sạn thành công!", hotel: newHotel });
        } catch (error) {
            res.status(500).json({ message: "Lỗi server", error });
        }
    });

// router.get("/getHotelList", async (req, res) => {
//     try {
//         const hotels = await Hotel.find();
//         if (!hotels) {
//             return res.status(404).json({
//                 message: { msgBody: "Empty list!", msgError: false }
//             });
//         }
//         return res.status(200).json({
//             message: { msgBody: "Successfully!", msgError: false },
//             hotels: hotels
//         });
//     } catch (err) {
//         return res.status(500).json({ message: 'Lỗi Server', error: err.message });
//     }
// })


router.get("/getHotelList", async (req, res) => {
    try {
        console.log('🏨 [GET HOTEL LIST] Fetching hotels...');

        const hotels = await Hotel.find();
        
        if (!hotels || hotels.length === 0) {
            return res.status(404).json({
                message: { msgBody: "Empty list!", msgError: true }
            });
        }

        // Enhance mỗi khách sạn với giá theo đêm
        const enhancedHotels = await Promise.all(hotels.map(async (hotel) => {
            try {
                if (hotel.trangThai === 'hoatDong') {
                    // Lấy loại phòng có giá thấp nhất của khách sạn
                    const cheapestRoomType = await RoomType.findOne({
                        maKhachSan: hotel._id
                    }).sort({ giaCa: 1 });

                    // Tính giá theo đêm (starting from price)
                    let giaTheoNgay = hotel.giaCa || 0;

                    if (cheapestRoomType) {
                        // Sử dụng giá của room type rẻ nhất
                        giaTheoNgay = cheapestRoomType.giaCa;
                    }

                    // Xử lý hình ảnh - ưu tiên hinhAnhDayDu
                    let hinhAnh = hotel.hinhAnh;
                    if (hotel.hinhAnhDayDu && hotel.hinhAnhDayDu.length > 0) {
                        hinhAnh = hotel.hinhAnhDayDu[0];
                    }

                    // Xử lý thành phố
                    let thanhPho = 'Chưa cập nhật';
                    if (hotel.diaChi && typeof hotel.diaChi === 'object') {
                        thanhPho = hotel.diaChi.tinhThanh || 'Chưa cập nhật';
                    }

                    return {
                        _id: hotel._id,
                        tenKhachSan: hotel.tenKhachSan,
                        diaChiDayDu: hotel.diaChiDayDu,
                        thanhPho: thanhPho,
                        moTa: hotel.moTa,
                        soSao: hotel.soSao,
                        soDienThoai: hotel.soDienThoai,
                        email: hotel.email,
                        hinhAnh: hinhAnh,
                        giaTheoNgay: giaTheoNgay
                    };
                }
                return null; // Trả về null nếu không phải trạng thái hoatDong
            } catch (error) {
                console.error(`Lỗi xử lý khách sạn ${hotel._id}:`, error);
                // Fallback về giá gốc nếu có lỗi
                if (hotel.trangThai === 'hoatDong') {
                    return {
                        _id: hotel._id,
                        tenKhachSan: hotel.tenKhachSan,
                        diaChiDayDu: hotel.diaChiDayDu,
                        thanhPho: hotel.diaChi?.tinhThanh || 'Chưa cập nhật',
                        moTa: hotel.moTa,
                        soSao: hotel.soSao,
                        soDienThoai: hotel.soDienThoai,
                        email: hotel.email,
                        hinhAnh: hotel.hinhAnhDayDu?.[0] || hotel.hinhAnh,
                        giaTheoNgay: hotel.giaCa || 0
                    };
                }
                return null;
            }
        }));

        // Lọc bỏ các hotel null (không hoạt động hoặc lỗi)
        const validHotels = enhancedHotels.filter(hotel => hotel !== null);

        console.log(`✅ [GET HOTEL LIST] Successfully processed ${validHotels.length} active hotels`);

        return res.status(200).json({
            message: { msgBody: "Successfully!", msgError: false },
            hotels: validHotels
        });

    } catch (err) {
        console.error('❌ [GET HOTEL LIST] Server error:', err);
        return res.status(500).json({
            message: 'Lỗi Server',
            error: err.message
        });
    }
});


// API tìm kiếm phòng theo khoảng thời gian - CHÍNH
router.post('/:hotelId/search-roomtypes', async (req, res) => {
    try {
        const { hotelId } = req.params;
        const {
            bookingType, checkInDate, checkOutDate, checkInTime, checkOutTime,
            guests, rooms: requestedRooms = 1
        } = req.body;

        console.log('🔍 Yêu cầu tìm kiếm nhiều phòng:', {
            hotelId, bookingType, checkInDate, checkOutDate, checkInTime, checkOutTime,
            guests, requestedRooms
        });

        // ✅ Validation nâng cao cho đặt nhiều phòng
        const validation = await validateMultiRoomSearchInput({
            hotelId, bookingType, checkInDate, checkOutDate,
            checkInTime, checkOutTime, guests, requestedRooms
        });

        if (!validation.valid) {
            return res.status(400).json({
                msgBody: validation.message,
                msgError: true,
                suggestion: validation.suggestion
            });
        }

        // Kiểm tra khách sạn có tồn tại không
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

        const totalGuests = (guests?.adults || 0) + (guests?.children || 0);
        console.log('👥 Phân tích phân bổ khách:', {
            totalGuests,
            requestedRooms,
            avgGuestsPerRoom: Math.ceil(totalGuests / requestedRooms)
        });

        // ✅ Logic đặt nhiều phòng
        const availableRoomTypes = [];
        const roomAllocationSuggestions = [];

        for (const roomType of roomTypes) {
            try {

                const realCapacity = await getRealRoomCapacity(roomType._id);
                const effectiveCapacity = realCapacity.averageCapacity;


                console.log(`\n🏨 Đang phân tích loại phòng: ${roomType.tenLoaiPhong}`);
                console.log('📊 Thông số phòng:', {
                    capacity: effectiveCapacity,
                    totalRooms: realCapacity.totalRooms,
                    price: roomType.giaCa
                });

                // ✅ Tính toán khả năng chứa cho nhiều phòng
                const capacityAnalysis = calculateMultiRoomCapacity({
                    roomCapacity: effectiveCapacity,
                    totalGuests,
                    requestedRooms
                });

                console.log('🧮 Phân tích khả năng chứa:', capacityAnalysis);

                // Bỏ qua nếu không thể chứa khách với số phòng yêu cầu
                if (!capacityAnalysis.canAccommodate) {
                    console.log('❌ Không thể chứa khách với số phòng yêu cầu');
                    const actualRoomCount = await Room.countDocuments({
                        maLoaiPhong: roomType._id,
                        trangThaiPhong: "trong"
                    });

                    // Đề xuất số phòng cần thiết
                    if (capacityAnalysis.suggestedRooms <= actualRoomCount) {
                        roomAllocationSuggestions.push({
                            roomTypeId: roomType._id,
                            roomTypeName: roomType.tenLoaiPhong,
                            capacity: effectiveCapacity,
                            suggestedRooms: capacityAnalysis.suggestedRooms,
                            distribution: capacityAnalysis.guestDistribution,
                            totalPrice: calculateMultiRoomPrice(roomType, capacityAnalysis.suggestedRooms, bookingType, checkInDate, checkOutDate, checkInTime, checkOutTime)
                        });
                    }
                    continue;
                }

                // ✅ Kiểm tra tình trạng phòng trống cho số phòng yêu cầu
                const availability = await checkEnhancedRoomAvailability({
                    hotelId,
                    roomTypeId: roomType._id,
                    bookingType,
                    checkInDate,
                    checkOutDate,
                    checkInTime,
                    checkOutTime,
                    requestedRooms
                });

                console.log('📋 Kết quả kiểm tra phòng trống:', {
                    isAvailable: availability.isAvailable,
                    availableRooms: availability.availableRooms,
                    requestedRooms
                });

                if (availability.isAvailable && availability.availableRooms >= requestedRooms) {
                    // Lấy thông tin bổ sung: hình ảnh, tiện nghi, cấu hình giường
                    const [roomImages, amenities, bedConfig] = await Promise.all([
                        getRoomTypeImages(roomType._id),
                        getRoomTypeAmenities(roomType._id),
                        getSimpleBedConfiguration(roomType._id)
                    ]);

                    // ✅ Tính giá cho nhiều phòng
                    const singleRoomPricing = calculateEnhancedPricing({
                        roomType, bookingType, checkInDate, checkOutDate, checkInTime, checkOutTime
                    });

                    const multiRoomPricing = {
                        ...singleRoomPricing,
                        pricePerRoom: singleRoomPricing.finalPrice,
                        totalPriceAllRooms: singleRoomPricing.finalPrice * requestedRooms,
                        roomCount: requestedRooms,
                        baseSubtotal: singleRoomPricing.basePrice * requestedRooms,
                        taxAllRoomPrice: singleRoomPricing.breakdown.taxPrice * requestedRooms,
                        groupDiscount: requestedRooms >= 3 ? 0.05 : 0,
                        finalTotalPrice: Math.round(singleRoomPricing.finalPrice * requestedRooms * (1 - (requestedRooms >= 3 ? 0.05 : 0)))
                    };

                    availableRoomTypes.push({
                        roomTypeId: roomType._id,
                        tenLoaiPhong: roomType.tenLoaiPhong,
                        moTa: roomType.moTa || "",
                        soLuongKhach: effectiveCapacity,
                        giaCa: roomType.giaCa,
                        images: roomImages,
                        amenities: amenities,
                        cauHinhGiuong: bedConfig,

                        // ✅ Thông tin đặc biệt cho nhiều phòng
                        multiRoomInfo: {
                            requestedRooms,
                            totalCapacity: effectiveCapacity * requestedRooms,
                            guestDistribution: capacityAnalysis.guestDistribution,
                            canAccommodateAll: capacityAnalysis.canAccommodate,
                            occupancyRate: Math.round((totalGuests / (effectiveCapacity * requestedRooms)) * 100)
                        },

                        availability: {
                            ...availability,
                            totalRequestedRooms: requestedRooms,
                            canBookRequestedQuantity: availability.availableRooms >= requestedRooms
                        },

                        // ✅ Giá cả cho nhiều phòng
                        pricing: multiRoomPricing,

                        displayInfo: {

                            pricePerRoom: singleRoomPricing.finalPrice,
                            totalPrice: multiRoomPricing.finalTotalPrice,
                            unit: getUnitText(bookingType),
                            duration: singleRoomPricing.duration,
                            roomCount: requestedRooms,
                            totalCapacity: effectiveCapacity * requestedRooms,
                            availableCount: availability.availableRooms,
                            hasImages: roomImages.length > 0,
                            imageCount: roomImages.length,
                            groupDiscount: multiRoomPricing.groupDiscount > 0
                        }
                    });

                    console.log('✅ Đã thêm vào danh sách với hỗ trợ nhiều phòng!');
                } else {
                    console.log('❌ Không đủ phòng trống');
                }

            } catch (error) {
                console.error(`❌ Lỗi khi xử lý loại phòng ${roomType._id}:`, error);
            }
        }

        // ✅ Phản hồi kèm đề xuất nếu không có phòng nào phù hợp
        const response = {
            message: availableRoomTypes.length > 0
                ? `Tìm thấy ${availableRoomTypes.length} loại phòng có sẵn cho ${requestedRooms} phòng (${totalGuests} khách)!`
                : `Không tìm thấy loại phòng nào có sẵn cho ${requestedRooms} phòng với ${totalGuests} khách.`,

            searchInfo: {
                hotelId: hotel._id,
                tenKhachSan: hotel.tenKhachSan,
                diaChiKhachSan: hotel.diaChiDayDu || `${hotel.diaChi?.phuongXa}, ${hotel.diaChi?.tinh}`,
                bookingType, checkInDate, checkOutDate: checkOutDate || checkInDate,
                checkInTime, checkOutTime, guests: guests || {}, requestedRooms,
                totalGuests,
                searchTime: new Date().toISOString()
            },

            statistics: {
                totalRoomTypes: roomTypes.length,
                availableRoomTypes: availableRoomTypes.length,
                totalAvailableRooms: availableRoomTypes.reduce((sum, room) =>
                    sum + room.availability.availableRooms, 0),
                totalCapacityIfBooked: availableRoomTypes.reduce((sum, room) =>
                    sum + (room.multiRoomInfo.totalCapacity), 0),
                averagePricePerRoom: availableRoomTypes.length > 0 ?
                    Math.round(availableRoomTypes.reduce((sum, room) =>
                        sum + room.pricing.pricePerRoom, 0) / availableRoomTypes.length) : 0,
                totalPriceRange: availableRoomTypes.length > 0 ? {
                    min: Math.min(...availableRoomTypes.map(room => room.pricing.finalTotalPrice)),
                    max: Math.max(...availableRoomTypes.map(room => room.pricing.finalTotalPrice))
                } : null
            },

            roomTypes: availableRoomTypes,

            // ✅ Đề xuất nếu không có kết quả
            suggestions: availableRoomTypes.length === 0 ? {
                message: "Không tìm thấy phòng phù hợp. Dưới đây là các đề xuất:",
                alternatives: roomAllocationSuggestions.slice(0, 3) // Top 3 đề xuất
            } : null
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error('❌ Lỗi tìm kiếm nhiều phòng:', error);
        return res.status(500).json({
            msgBody: "Lỗi máy chủ khi tìm kiếm phòng!",
            msgError: true,
            messageError: error.message
        });
    }
});

async function getRealRoomCapacity(roomTypeId) {
    try {
        // Lấy tất cả phòng thuộc loại này
        const rooms = await Room.find({
            maLoaiPhong: roomTypeId,
            trangThaiPhong: "trong" // Chỉ lấy phòng hoạt động
        }).select('soLuongNguoiToiDa _id');

        console.log(`📊 Found ${rooms.length} rooms:`, rooms.map(r => ({
            id: r._id.toString().slice(-6),
            capacity: r.soLuongNguoiToiDa
        })));

        if (!rooms || rooms.length === 0) {
            // Fallback về roomType nếu không có phòng
            const roomType = await RoomType.findById(roomTypeId);
            return {
                averageCapacity: 0,
                minCapacity: 0,
                maxCapacity: 0,
                totalRooms: 0,
                capacitySource: 'no_rooms'
            };
        }

        // Tính toán capacity từ phòng thực tế
        const capacities = rooms.map(room => room.soLuongNguoiToiDa || 2);
        const averageCapacity = Math.round(capacities.reduce((sum, cap) => sum + cap, 0) / capacities.length);
        const minCapacity = Math.min(...capacities);
        const maxCapacity = Math.max(...capacities);

        return {
            averageCapacity,
            minCapacity,
            maxCapacity,
            totalRooms: rooms.length,
            capacitySource: 'actual_rooms',
            capacityBreakdown: capacities.reduce((acc, cap) => {
                acc[cap] = (acc[cap] || 0) + 1;
                return acc;
            }, {})
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

async function validateMultiRoomSearchInput({
    hotelId, bookingType, checkInDate, checkOutDate,
    checkInTime, checkOutTime, guests, requestedRooms, roomTypeId
}) {
    // Validation cơ bản
    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
        return { valid: false, message: "Mã khách sạn không hợp lệ!" };
    }

    if (!bookingType || !['theo_gio', 'qua_dem', 'dai_ngay'].includes(bookingType)) {
        return { valid: false, message: "Loại đặt phòng không hợp lệ!" };
    }

    if (!checkInDate || !moment(checkInDate, 'YYYY-MM-DD', true).isValid()) {
        return { valid: false, message: "Ngày nhận phòng không hợp lệ!" };
    }

    // Validation đặc biệt cho nhiều phòng
    if (requestedRooms < 1 || requestedRooms > 20) {
        return {
            valid: false,
            message: "Số phòng phải từ 1-20!",
            suggestion: "Vui lòng chọn số phòng từ 1 đến 20"
        };
    }

    //Di chuyển totalGuests lên trước
    const totalGuests = (guests?.adults || 0) + (guests?.children || 0);
    if (totalGuests < 1 || totalGuests > 50) {
        return {
            valid: false,
            message: "Số khách phải từ 1-50!",
            suggestion: "Vui lòng điều chỉnh số lượng khách"
        };
    }

    // Kiểm tra logic: Quá nhiều phòng so với khách
    if (requestedRooms > totalGuests) {
        return {
            valid: false,
            message: `${requestedRooms} phòng cho ${totalGuests} khách là quá nhiều!`,
            suggestion: `Đề xuất: ${Math.ceil(totalGuests / 2)} phòng sẽ phù hợp hơn`
        };
    }

    if (roomTypeId && mongoose.Types.ObjectId.isValid(roomTypeId)) {
        try {
            const capacityInfo = await getRealRoomCapacity(roomTypeId);
            const maxGuestsWithCurrentRooms = requestedRooms * capacityInfo.maxCapacity;

            if (totalGuests > maxGuestsWithCurrentRooms) {
                const minRoomsNeeded = Math.ceil(totalGuests / capacityInfo.averageCapacity);
                return {
                    valid: false,
                    message: `${requestedRooms} phòng không đủ cho ${totalGuests} khách!`,
                    suggestion: `Loại phòng này chứa tối đa ${capacityInfo.maxCapacity} khách/phòng. Cần ít nhất ${minRoomsNeeded} phòng.`,
                    capacityInfo
                };
            }
        } catch (error) {
            console.error('❌ Lỗi validate capacity:', error);
            // Fallback về validation cũ nếu có lỗi
        }
    } else {
        // Fallback validation khi không có roomTypeId cụ thể
        // Giả sử tối đa 4 khách/phòng (có thể điều chỉnh)
        const assumedMaxCapacity = 4;
        const maxGuestsWithCurrentRooms = requestedRooms * assumedMaxCapacity;

        if (totalGuests > maxGuestsWithCurrentRooms) {
            const minRoomsNeeded = Math.ceil(totalGuests / assumedMaxCapacity);
            return {
                valid: false,
                message: `${requestedRooms} phòng có thể không đủ cho ${totalGuests} khách!`,
                suggestion: `Giả sử tối đa ${assumedMaxCapacity} khách/phòng, cần ít nhất ${minRoomsNeeded} phòng.`,
                note: "Validation chính xác sẽ được thực hiện khi chọn loại phòng cụ thể."
            };
        }
    }

    // Booking type specific validations
    const checkInMoment = moment(checkInDate);
    const checkOutMoment = checkOutDate ? moment(checkOutDate) : null;

    switch (bookingType) {
        case 'theo_gio':
            if (!checkInTime || !checkOutTime) {
                return { valid: false, message: "Đặt theo giờ cần có giờ nhận và giờ trả!" };
            }
            // ✅ MỚI: Validation thời gian hợp lệ
            if (!moment(checkInTime, 'HH:mm', true).isValid() ||
                !moment(checkOutTime, 'HH:mm', true).isValid()) {
                return { valid: false, message: "Định dạng giờ không hợp lệ! (HH:MM)" };
            }
            break;

        case 'qua_dem':
            if (!checkOutDate) {
                return { valid: false, message: "Đặt qua đêm cần có ngày trả phòng!" };
            }
            const nightDiff = checkOutMoment.diff(checkInMoment, 'days');
            if (nightDiff !== 1) {
                return { valid: false, message: "Đặt qua đêm phải chính xác 1 ngày!" };
            }
            break;

        case 'dai_ngay':
            if (!checkOutDate) {
                return { valid: false, message: "Đặt dài ngày cần có ngày trả phòng!" };
            }
            const longDiff = checkOutMoment.diff(checkInMoment, 'days');
            if (longDiff < 2) {
                return { valid: false, message: "Đặt dài ngày tối thiểu 2 ngày!" };
            }
            // ✅ MỚI: Giới hạn tối đa
            if (longDiff > 365) {
                return { valid: false, message: "Đặt dài ngày tối đa 365 ngày!" };
            }
            break;
    }

    // // ✅ MỚI: Validation ngày trong quá khứ
    // if (checkInMoment.isBefore(moment().startOf('day'))) {
    //     return { 
    //         valid: false, 
    //         message: "Ngày nhận phòng không được trong quá khứ!" 
    //     };
    // }

    // // ✅ MỚI: Validation ngày trả sau ngày nhận
    // if (checkOutDate && checkOutMoment.isSameOrBefore(checkInMoment)) {
    //     return { 
    //         valid: false, 
    //         message: "Ngày trả phòng phải sau ngày nhận phòng!" 
    //     };
    // }

    return { valid: true, message: "Input hợp lệ" };
}

// ✅ Tính toán capacity cho multi-room
function calculateMultiRoomCapacity({ roomCapacity, totalGuests, requestedRooms }) {
    const totalCapacity = roomCapacity * requestedRooms;
    const canAccommodate = totalCapacity >= totalGuests;

    // Đề xuất số phòng tối thiểu cần thiết
    const suggestedRooms = Math.ceil(totalGuests / roomCapacity);

    // Phân bổ khách theo phòng
    const guestDistribution = [];
    let remainingGuests = totalGuests;

    for (let i = 0; i < requestedRooms && remainingGuests > 0; i++) {
        const guestsInThisRoom = Math.min(roomCapacity, remainingGuests);
        guestDistribution.push({
            roomNumber: i + 1,
            guests: guestsInThisRoom,
            capacity: roomCapacity,
            utilization: Math.round((guestsInThisRoom / roomCapacity) * 100)
        });
        remainingGuests -= guestsInThisRoom;
    }

    return {
        canAccommodate,
        totalCapacity,
        suggestedRooms,
        guestDistribution,
        remainingGuests, // Phải = 0 nếu có thể chứa được
        occupancyRate: Math.round((totalGuests / totalCapacity) * 100)
    };
}

// ✅ Tính giá cho nhiều phòng
function calculateMultiRoomPrice(roomType, numberOfRooms, bookingType, checkInDate, checkOutDate, checkInTime, checkOutTime) {
    const singleRoomPrice = calculateEnhancedPricing({
        roomType, bookingType, checkInDate, checkOutDate, checkInTime, checkOutTime
    });

    const subtotal = singleRoomPrice.finalPrice * numberOfRooms;

    // Giảm giá nhóm
    let groupDiscount = 0;
    if (numberOfRooms >= 5) groupDiscount = 0.10; // 10% cho >= 5 phòng
    else if (numberOfRooms >= 3) groupDiscount = 0.05; // 5% cho >= 3 phòng

    const totalPrice = Math.round(subtotal * (1 - groupDiscount));

    return {
        pricePerRoom: singleRoomPrice.finalPrice,
        numberOfRooms,
        subtotal,
        groupDiscount,
        totalPrice,
        savings: subtotal - totalPrice
    };
}

// ✅ API để lấy đề xuất khi không có phòng phù hợp
router.post('/:hotelId/room-suggestions', async (req, res) => {
    try {
        const { hotelId } = req.params;
        const { guests, bookingType, checkInDate, checkOutDate, checkInTime, checkOutTime } = req.body;

        const totalGuests = (guests?.adults || 0) + (guests?.children || 0);
        const roomTypes = await RoomType.find({ maKhachSan: hotelId }).sort({ giaCa: 1 });

        const suggestions = [];

        for (const roomType of roomTypes) {

            const realCapacity = await getRealRoomCapacity(roomType._id);
            const effectiveCapacity = realCapacity.averageCapacity;
            const suggestedRooms = Math.ceil(totalGuests / effectiveCapacity);


            const actualRoomCount = await Room.countDocuments({
                maLoaiPhong: roomType._id,
                trangThaiPhong: "trong"
            });

            if (suggestedRooms <= actualRoomCount) {
                const availability = await checkEnhancedRoomAvailability({
                    hotelId,
                    roomTypeId: roomType._id,
                    bookingType,
                    checkInDate,
                    checkOutDate,
                    checkInTime,
                    checkOutTime,
                    requestedRooms: suggestedRooms
                });

                if (availability.isAvailable && availability.availableRooms >= suggestedRooms) {
                    const pricing = calculateMultiRoomPrice(roomType, suggestedRooms, bookingType, checkInDate, checkOutDate, checkInTime, checkOutTime);

                    suggestions.push({
                        roomTypeId: roomType._id,
                        roomTypeName: roomType.tenLoaiPhong,
                        capacity: effectiveCapacity,
                        suggestedRooms,
                        totalCapacity: effectiveCapacity * suggestedRooms,
                        actualRoomCount,
                        pricing,
                        guestDistribution: calculateMultiRoomCapacity({
                            roomCapacity: effectiveCapacity,
                            totalGuests,
                            requestedRooms: suggestedRooms
                        }).guestDistribution
                    });
                }
            }
        }

        return res.json({
            message: `Đề xuất ${suggestions.length} phương án cho ${totalGuests} khách`,
            totalGuests,
            suggestions: suggestions.sort((a, b) => a.pricing.totalPrice - b.pricing.totalPrice)
        });

    } catch (error) {
        return res.status(500).json({
            msgBody: "Lỗi khi tạo đề xuất!",
            msgError: true,
            messageError: error.message
        });
    }
});

// Kiểm tra availability chi tiết
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

// Kiểm tra availability theo giờ - ENHANCED
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

        // Lấy tất cả booking conflicts trong khoảng thời gian
        const conflictingBookings = await Booking.find({
            maKhachSan: hotelId,
            maLoaiPhong: roomTypeId,
            trangThai: { $nin: ['da_huy'] },
            $or: [
                // Booking theo giờ cùng ngày
                {
                    loaiDatPhong: 'theo_gio',
                    ngayNhanPhong: {
                        $gte: targetDate.toDate(),
                        $lt: targetDate.clone().add(1, 'day').toDate()
                    }
                },
                // Booking qua đêm/dài ngày overlap
                {
                    loaiDatPhong: { $in: ['qua_dem', 'dai_ngay'] },
                    ngayNhanPhong: { $lte: requestEnd.toDate() },
                    ngayTraPhong: { $gte: requestStart.toDate() }
                }
            ]
        }).select('loaiDatPhong ngayNhanPhong ngayTraPhong gioNhanPhong gioTraPhong soLuongPhong');

        let maxConflictRooms = 0;
        const conflictDetails = [];

        // Kiểm tra từng booking conflict
        for (const booking of conflictingBookings) {
            let isConflict = false;
            let conflictPeriod = '';

            if (booking.loaiDatPhong === 'theo_gio') {
                const bookingStart = moment(`${moment(booking.ngayNhanPhong).format('YYYY-MM-DD')} ${booking.gioNhanPhong}`);
                let bookingEnd = moment(`${moment(booking.ngayNhanPhong).format('YYYY-MM-DD')} ${booking.gioTraPhong}`);

                if (bookingEnd.isSameOrBefore(bookingStart)) {
                    bookingEnd.add(1, 'day');
                }

                // Check overlap
                if (requestStart.isBefore(bookingEnd) && requestEnd.isAfter(bookingStart)) {
                    isConflict = true;
                    conflictPeriod = `${bookingStart.format('HH:mm')}-${bookingEnd.format('HH:mm')}`;
                }
            } else {
                // Qua đêm/dài ngày chiếm cả ngày
                const bookingStart = moment(booking.ngayNhanPhong);
                const bookingEnd = moment(booking.ngayTraPhong);

                if (requestStart.isBefore(bookingEnd) && requestEnd.isAfter(bookingStart)) {
                    isConflict = true;
                    conflictPeriod = `${bookingStart.format('DD/MM')} - ${bookingEnd.format('DD/MM')}`;
                }
            }

            if (isConflict) {
                maxConflictRooms += booking.soLuongPhong;
                conflictDetails.push({
                    bookingType: booking.loaiDatPhong,
                    period: conflictPeriod,
                    rooms: booking.soLuongPhong
                });
            }
        }

        // Kiểm tra room availability records
        const roomAvailability = await RoomAvailability.findOne({
            maKhachSan: hotelId,
            maLoaiPhong: roomTypeId,
            ngay: targetDate.toDate()
        });

        let maintenanceRooms = 0;
        let blockedRooms = 0;
        let supportedBookingTypes = ['theo_gio', 'qua_dem', 'dai_ngay'];

        if (roomAvailability) {
            maintenanceRooms = roomAvailability.soPhongBaoTri || 0;
            blockedRooms = roomAvailability.soPhongBlock || 0;
            supportedBookingTypes = roomAvailability.loaiDatPhongHoTro || supportedBookingTypes;
        }

        const availableRooms = Math.max(0, totalRooms - maxConflictRooms - maintenanceRooms - blockedRooms);

        return {
            isAvailable: availableRooms >= requestedRooms && supportedBookingTypes.includes('theo_gio'),
            availableRooms,
            totalRooms,
            bookedRooms: maxConflictRooms,
            maintenanceRooms,
            blockedRooms,
            supportedBookingTypes,
            conflictInfo: conflictDetails,
            dateBreakdown: [{
                date: checkInDate,
                timeSlot: `${checkInTime}-${checkOutTime}`,
                availableRooms,
                conflicts: conflictDetails.length
            }]
        };

    } catch (error) {
        console.error('❌ Hourly availability error:', error);
        return { isAvailable: false, availableRooms: 0 };
    }
}

// Kiểm tra availability qua đêm - ENHANCED
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
        const dateBreakdown = [];
        const allConflicts = [];

        // Check availability cho từng ngày
        for (const dateStr of datesInRange) {
            const dayStart = moment(dateStr).startOf('day');
            const dayEnd = moment(dateStr).endOf('day');

            // Lấy bookings overlap với ngày này
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
            }).select('loaiDatPhong soLuongPhong ngayNhanPhong ngayTraPhong');

            let dayConflictRooms = 0;
            const dayConflicts = [];

            for (const booking of conflictingBookings) {
                dayConflictRooms += booking.soLuongPhong;
                dayConflicts.push({
                    bookingType: booking.loaiDatPhong,
                    rooms: booking.soLuongPhong,
                    period: `${moment(booking.ngayNhanPhong).format('DD/MM')} - ${moment(booking.ngayTraPhong).format('DD/MM')}`
                });
            }

            // Check maintenance/blocked rooms
            const roomAvailability = await RoomAvailability.findOne({
                maKhachSan: hotelId,
                maLoaiPhong: roomTypeId,
                ngay: dayStart.toDate()
            });

            let maintenanceRooms = 0;
            let blockedRooms = 0;
            if (roomAvailability) {
                maintenanceRooms = roomAvailability.soPhongBaoTri || 0;
                blockedRooms = roomAvailability.soPhongBlock || 0;
            }

            const dayAvailableRooms = Math.max(0, totalRooms - dayConflictRooms - maintenanceRooms - blockedRooms);
            minAvailableRooms = Math.min(minAvailableRooms, dayAvailableRooms);

            dateBreakdown.push({
                date: dateStr,
                availableRooms: dayAvailableRooms,
                bookedRooms: dayConflictRooms,
                maintenanceRooms,
                blockedRooms,
                conflicts: dayConflicts
            });

            allConflicts.push(...dayConflicts);
        }

        return {
            isAvailable: minAvailableRooms >= requestedRooms,
            availableRooms: minAvailableRooms,
            totalRooms,
            bookedRooms: totalRooms - minAvailableRooms,
            supportedBookingTypes: ['theo_gio', 'qua_dem', 'dai_ngay'],
            conflictInfo: allConflicts,
            dateBreakdown
        };

    } catch (error) {
        console.error('❌ Overnight availability error:', error);
        return { isAvailable: false, availableRooms: 0 };
    }
}

// Kiểm tra availability dài ngày - ENHANCED
async function checkLongStayAvailabilityEnhanced({
    hotelId, roomTypeId, totalRooms, checkInDate, checkOutDate, requestedRooms
}) {
    try {
        // Sử dụng cùng logic với overnight nhưng có thêm discount calculation
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

// Enhanced pricing calculation
function calculateEnhancedPricing({
    roomType, bookingType, checkInDate, checkOutDate, checkInTime, checkOutTime
}) {
    let basePrice = roomType.giaCa;         // ✅ Giá cơ bản của 1 đơn vị (giờ/ngày/đêm)
    let duration = 1;                        // ✅ Khoảng thời gian sử dụng phòng
    let unit = "đêm";                        // ✅ Đơn vị thời gian: đêm, ngày, giờ
    let multiplier = 1;                     // ✅ Hệ số nhân tổng hợp (bao gồm cả phụ thu + giảm giá)
    let priceDiscountPercent = 0;           // ✅ Phần trăm giảm giá nếu ở dài ngày
    let taxPrice = 0;                        // ✅ Giá phụ thu (ví dụ cuối tuần)

    // ---------------------------------------------
    // ⏰ TÍNH KHOẢNG THỜI GIAN VÀ GIÁ CƠ BẢN
    // ---------------------------------------------

    if (bookingType === "theo_gio") {
        const startTime = moment(`${checkInDate} ${checkInTime}`, "YYYY-MM-DD HH:mm");
        let endTime = moment(`${checkInDate} ${checkOutTime}`, "YYYY-MM-DD HH:mm");

        // Nếu checkoutTime trước checkinTime thì chuyển sang ngày hôm sau
        if (endTime.isSameOrBefore(startTime)) {
            endTime.add(1, "day");
        }

        duration = Math.ceil(endTime.diff(startTime, "hours", true)); // Làm tròn lên số giờ
        unit = "giờ";

        basePrice = Math.round((roomType.giaCa / 14) * duration);
    } else if (checkOutDate) {
        duration = moment(checkOutDate).diff(moment(checkInDate), "days");
        unit = bookingType === "qua_dem" ? "đêm" : "ngày";

        // Giá gốc = giá theo đêm/ngày * số lượng ngày
        basePrice = roomType.giaCa * duration;
    }

    // ---------------------------------------------
    // 🔼 PHỤ THU CUỐI TUẦN
    // ---------------------------------------------
    const weekendMultiplier = isWeekend(checkInDate) ? 1.2 : 1; // Tăng 20% nếu là cuối tuần
    if (weekendMultiplier > 1) {
        taxPrice = Math.round(basePrice * (weekendMultiplier - 1)); // Phụ thu = phần tăng
    }

    // ---------------------------------------------
    // 🔽 GIẢM GIÁ DÀI NGÀY
    // ---------------------------------------------
    let longStayMultiplier = 1;
    if (bookingType === 'dai_ngay') {
        if (duration >= 7) {
            longStayMultiplier = 0.85; // Giảm 15%
            priceDiscountPercent = 15;
        } else if (duration >= 5) {
            longStayMultiplier = 0.90; // Giảm 10%
            priceDiscountPercent = 10;
        } else if (duration >= 3) {
            longStayMultiplier = 0.95; // Giảm 5%
            priceDiscountPercent = 5;
        }
    }

    // ✅ Tổng hệ số nhân cuối cùng
    multiplier = weekendMultiplier * longStayMultiplier;

    // ---------------------------------------------
    // 💰 TÍNH GIÁ CUỐI CÙNG
    // ---------------------------------------------
    const finalPrice = Math.round(basePrice * multiplier);
    const discountAmount = Math.round(basePrice * (1 - longStayMultiplier)); // Số tiền được giảm

    // ---------------------------------------------
    // 🧾 TRẢ VỀ KẾT QUẢ
    // ---------------------------------------------
    return {
        basePrice: roomType.giaCa, // Giá gốc của 1 đơn vị
        unitPrice: Math.round(basePrice / duration), // Giá mỗi đơn vị thời gian
        finalPrice, // Tổng giá đã cộng phụ thu và trừ giảm giá
        duration,
        unit,
        multiplier,
        discounts: {
            weekend: isWeekend(checkInDate),
            longStay: bookingType === 'dai_ngay' && duration >= 3,
            discountPercent: priceDiscountPercent,
            discountAmount
        },
        breakdown: {
            baseRate: roomType.giaCa,
            duration: duration,
            subtotal: basePrice,
            discountPercent: priceDiscountPercent,
            taxPrice: taxPrice, // ✅ Phần tiền phụ thu (nếu có)
            discountAmount: discountAmount, // ✅ Phần tiền giảm giá (nếu có)
            multiplier: multiplier,
            total: finalPrice,
        },
    };
}

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
        const totalRooms = await Room.countDocuments({
            maLoaiPhong: roomTypeId,
            trangThaiPhong: "trong"
        });

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

// Lấy cấu hình giường
async function getSimpleBedConfiguration(roomTypeId) {
    try {
        // Lấy TẤT CẢ phòng của loại phòng này
        const allRooms = await Room.find({ maLoaiPhong: roomTypeId })
            .select('cauHinhGiuong')
            .lean();

        if (!allRooms || allRooms.length === 0) {
            return [{
                loaiGiuong: "double",
                soLuong: 1
            }];
        }

        // Tập hợp tất cả các cấu hình giường khác nhau
        const bedConfigMap = new Map();

        allRooms.forEach(room => {
            if (room.cauHinhGiuong && room.cauHinhGiuong.length > 0) {
                room.cauHinhGiuong.forEach(config => {
                    const key = config.loaiGiuong;
                    // Lưu số lượng MAX của từng loại giường
                    if (bedConfigMap.has(key)) {
                        bedConfigMap.set(key, Math.max(bedConfigMap.get(key), config.soLuong));
                    } else {
                        bedConfigMap.set(key, config.soLuong);
                    }
                });
            }
        });

        // Nếu không có cấu hình nào, trả về mặc định
        if (bedConfigMap.size === 0) {
            return [{
                loaiGiuong: "double",
                soLuong: 1
            }];
        }

        // Chuyển đổi thành array và sắp xếp theo thứ tự kích thước giường
        const bedSizeOrder = { 'single': 1, 'double': 2, 'queen': 3, 'king': 4 };

        return Array.from(bedConfigMap.entries())
            .map(([loaiGiuong, soLuong]) => ({
                loaiGiuong,
                soLuong
            }))
            .sort((a, b) => (bedSizeOrder[a.loaiGiuong] || 0) - (bedSizeOrder[b.loaiGiuong] || 0));

    } catch (error) {
        console.error('Lỗi lấy cấu hình giường:', error);
        return [{
            loaiGiuong: "double",
            soLuong: 1
        }];
    }
}

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
                        _id: detail.maTienNghi._id,
                        tenTienNghi: detail.maTienNghi.tenTienNghi,
                        icon: detail.maTienNghi.icon || "🏨",
                        moTa: detail.maTienNghi.moTa || "",
                        categtenNhomTienNghiory: detail.maTienNghi.maNhomTienNghi?.tenNhomTienNghi || "Khác",
                        iconNhom: detail.maTienNghi.maNhomTienNghi?.icon || "📋",
                        soPhongCoTienNghi: 0,
                        tongSoPhong: 0
                    };
                }
                amenityMap[amenityId].soPhongCoTienNghi++;
                amenityMap[amenityId].tongSoPhong += detail.soLuong || 1;
            }
        });

        // Chuyển về array và tính coverage percentage
        const amenities = Object.values(amenityMap).map(amenity => ({
            ...amenity,
            coveragePercentage: Math.round((amenity.soPhongCoTienNghi / rooms.length) * 100)
        }));

        // Sắp xếp theo độ phổ biến
        return amenities.sort((a, b) => b.coveragePercentage - a.coveragePercentage);

    } catch (error) {
        console.error('Lỗi lấy tiện nghi loại phòng:', error);
        return [];
    }
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

        const actualRoomCount = await Room.countDocuments({
            maLoaiPhong: roomTypeId,
            trangThaiPhong: "trong"
        });

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
                tongSoPhong: actualRoomCount,

                // Danh sách hình ảnh
                images: images,

                // Danh sách tiện nghi
                amenities: amenities,

                // Thống kê
                statistics: {
                    imageCount: images.length,
                    amenityCount: amenities.length,
                    totalRooms: actualRoomCount
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
// router.post('/:hotelId/room-type/:roomTypeId/check-availability', async (req, res) => {
//     try {
//         const { hotelId, roomTypeId } = req.params;
//         const { bookingType, checkInDate, checkOutDate, checkInTime, checkOutTime } = req.body;

//         if (!mongoose.Types.ObjectId.isValid(roomTypeId)) {
//             return res.status(400).json({
//                 msgBody: "Mã loại phòng không hợp lệ!",
//                 msgError: true
//             });
//         }

//         const availability = await checkRoomTypeAvailability({
//             hotelId,
//             roomTypeId,
//             bookingType,
//             checkInDate,
//             checkOutDate,
//             checkInTime,
//             checkOutTime
//         });

//         const roomType = await RoomType.findById(roomTypeId);
//         const pricing = calculatePricing({
//             roomType,
//             bookingType,
//             checkInDate,
//             checkOutDate,
//             checkInTime,
//             checkOutTime
//         });

//         return res.status(200).json({
//             message: availability.isAvailable ? "Phòng có sẵn!" : "Phòng không có sẵn!",
//             availability: {
//                 ...availability,
//                 roomTypeName: roomType?.tenLoaiPhong || "Unknown"
//             },
//             pricing: pricing,
//             searchParams: {
//                 bookingType,
//                 checkInDate,
//                 checkOutDate,
//                 checkInTime,
//                 checkOutTime
//             }
//         });

//     } catch (error) {
//         return res.status(500).json({
//             msgBody: "Lỗi kiểm tra availability!",
//             msgError: true,
//             messageError: error.message
//         });
//     }

// });

// ✅ API LẤY TẤT CẢ ĐÁNH GIÁ CỦA KHÁCH SẠN
router.get('/:hotelId/reviews', async (req, res) => {
    try {
        const { hotelId } = req.params;
        const { sortBy = 'newest' } = req.query;

        // ✅ Validate hotelId
        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            return res.status(400).json({
                success: false,
                message: "Mã khách sạn không hợp lệ!"
            });
        }

        // ✅ Kiểm tra khách sạn có tồn tại không
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: "Khách sạn không tồn tại!"
            });
        }



        // ✅ Setup sorting
        let sortOption = {};
        switch (sortBy) {
            case 'newest':
                sortOption = { ngayDanhGia: -1 };
                break;
            case 'oldest':
                sortOption = { ngayDanhGia: 1 };
                break;
            case 'highest_rating':
                sortOption = { soSao: -1, ngayDanhGia: -1 };
                break;
            case 'lowest_rating':
                sortOption = { soSao: 1, ngayDanhGia: -1 };
                break;
            default:
                sortOption = { ngayDanhGia: -1 };
        }

        console.log(`🔍 Đang tìm reviews cho khách sạn: ${hotel.tenKhachSan} (${hotelId})`);

        // ✅ Lấy tất cả booking của khách sạn, sau đó lấy reviews
        const pipeline = [
            // Stage 1: Tìm tất cả reviews
            {
                $lookup: {
                    from: "dondatphongs", // Tên collection booking
                    localField: "maDatPhong",
                    foreignField: "_id",
                    as: "booking"
                }
            },
            // Stage 2: Filter theo hotel
            {
                $match: {
                    "booking.maKhachSan": new mongoose.Types.ObjectId(hotelId)
                }
            },
            // Stage 3: Unwind booking array
            {
                $unwind: "$booking"
            },
            // Stage 4: Lookup user info
            {
                $lookup: {
                    from: "nguoidungs", // Tên collection users
                    localField: "booking.maNguoiDung",
                    foreignField: "_id",
                    as: "user"
                }
            },
            // Stage 5: Unwind user array
            {
                $unwind: "$user"
            },
            // Stage 6: Lookup room type info
            {
                $lookup: {
                    from: "loaiphongs", // Tên collection room types
                    localField: "booking.maLoaiPhong",
                    foreignField: "_id",
                    as: "roomType"
                }
            },
            // Stage 7: Add roomType info (optional)
            {
                $addFields: {
                    roomType: { $arrayElemAt: ["$roomType", 0] }
                }
            },
            // Stage 8: Project final fields
            {
                $project: {
                    _id: 1,
                    soSao: 1,
                    binhLuan: 1,
                    ngayDanhGia: 1,
                    // User info (ẩn thông tin nhạy cảm)
                    user: {
                        _id: "$user._id",
                        tenNguoiDung: "$user.tenNguoiDung",
                        hinhDaiDien: "$user.hinhDaiDien"
                    },
                    // Booking info
                    booking: {
                        _id: "$booking._id",
                        ngayNhanPhong: "$booking.ngayNhanPhong",
                        ngayTraPhong: "$booking.ngayTraPhong",
                        loaiDatPhong: "$booking.loaiDatPhong"
                    },
                    // Room type info
                    roomType: {
                        tenLoaiPhong: "$roomType.tenLoaiPhong"
                    }
                }
            },
            // Stage 9: Sort
            {
                $sort: sortOption
            }
        ];

        // ✅ Execute aggregation with pagination
        const reviews = await mongoose.model("danhGia").aggregate(pipeline);
        if (reviews.length === 0) {
            return res.status(200).json({
                success: true,
                message: `Không có đánh giá nào cho khách sạn ${hotel.tenKhachSan}`,
                data: {
                    hotel: {
                        id: hotel._id,
                        name: hotel.tenKhachSan,
                        address: hotel.diaChiDayDu || `${hotel.diaChi?.phuongXa}, ${hotel.diaChi?.tinhThanh}`
                    },
                    statistics: {
                        totalReviews: 0,
                        averageRating: 0,
                        ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                    },
                    reviews: []
                }
            });
        }

        const total = reviews.length;

        // ✅ Tính toán thống kê ratings
        const ratingStats = await mongoose.model("danhGia").aggregate([
            ...pipeline.slice(0, 7), // Không cần project và sort cho stats
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$soSao" },
                    totalReviews: { $sum: 1 },
                    ratingDistribution: {
                        $push: "$soSao"
                    }
                }
            }
        ]);

        // ✅ Tính phân bổ rating (1-5 sao)
        let ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        if (ratingStats[0]?.ratingDistribution) {
            ratingStats[0].ratingDistribution.forEach(rating => {
                ratingBreakdown[rating] = (ratingBreakdown[rating] || 0) + 1;
            });
        }

        // ✅ Format response data
        const formattedReviews = reviews.map(review => ({
            id: review._id,
            rating: review.soSao,
            comment: review.binhLuan || "",
            reviewDate: review.ngayDanhGia,
            user: {
                id: review.user._id,
                name: review.user.tenNguoiDung || "Người dùng ẩn danh",
                avatar: review.user.hinhDaiDien || ""
            },
            booking: {
                id: review.booking._id,
                checkIn: review.booking.ngayNhanPhong,
                checkOut: review.booking.ngayTraPhong,
                bookingType: review.booking.loaiDatPhong
            },
            roomType: {
                name: review.roomType?.tenLoaiPhong || "Không xác định"
            }
        }));

        // ✅ Response
        res.status(200).json({
            success: true,
            message: `Tìm thấy ${total} đánh giá cho khách sạn ${hotel.tenKhachSan}`,
            data: {
                hotel: {
                    id: hotel._id,
                    name: hotel.tenKhachSan,
                    address: hotel.diaChiDayDu || `${hotel.diaChi?.phuongXa}, ${hotel.diaChi?.tinhThanh}`
                },
                statistics: {
                    totalReviews: total,
                    averageRating: ratingStats[0]?.averageRating ?
                        Math.round(ratingStats[0].averageRating * 10) / 10 : 0,
                    ratingBreakdown: ratingBreakdown
                },
                reviews: formattedReviews
            }
        });

    } catch (error) {
        console.error('❌ Lỗi lấy reviews khách sạn:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi lấy đánh giá",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ✅ API LẤY THỐNG KÊ ĐÁNH GIÁ CHI TIẾT
router.get('/:hotelId/reviews/statistics', async (req, res) => {
    try {
        const { hotelId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            return res.status(400).json({
                success: false,
                message: "Mã khách sạn không hợp lệ!"
            });
        }

        // ✅ Kiểm tra khách sạn
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: "Khách sạn không tồn tại!"
            });
        }

        console.log(`📊 Đang tính thống kê reviews cho: ${hotel.tenKhachSan}`);

        // ✅ Aggregation pipeline cho thống kê chi tiết
        const statsResults = await mongoose.model("danhGia").aggregate([
            // Lookup booking
            {
                $lookup: {
                    from: "dondatphongs",
                    localField: "maDatPhong",
                    foreignField: "_id",
                    as: "booking"
                }
            },
            // Filter theo hotel
            {
                $match: {
                    "booking.maKhachSan": new mongoose.Types.ObjectId(hotelId)
                }
            },
            {
                $unwind: "$booking"
            },
            // Thống kê tổng hợp
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    averageRating: { $avg: "$soSao" },
                    maxRating: { $max: "$soSao" },
                    minRating: { $min: "$soSao" },
                    // Đếm theo từng mức rating
                    rating5: { $sum: { $cond: [{ $eq: ["$soSao", 5] }, 1, 0] } },
                    rating4: { $sum: { $cond: [{ $eq: ["$soSao", 4] }, 1, 0] } },
                    rating3: { $sum: { $cond: [{ $eq: ["$soSao", 3] }, 1, 0] } },
                    rating2: { $sum: { $cond: [{ $eq: ["$soSao", 2] }, 1, 0] } },
                    rating1: { $sum: { $cond: [{ $eq: ["$soSao", 1] }, 1, 0] } },
                    // Đếm theo loại booking
                    hourlyBookings: { $sum: { $cond: [{ $eq: ["$booking.loaiDatPhong", "theo_gio"] }, 1, 0] } },
                    overnightBookings: { $sum: { $cond: [{ $eq: ["$booking.loaiDatPhong", "qua_dem"] }, 1, 0] } },
                    longStayBookings: { $sum: { $cond: [{ $eq: ["$booking.loaiDatPhong", "dai_ngay"] }, 1, 0] } },
                    // Thống kê thời gian
                    oldestReview: { $min: "$ngayDanhGia" },
                    newestReview: { $max: "$ngayDanhGia" },
                    // Collect all comments for analysis
                    allComments: { $push: "$binhLuan" }
                }
            }
        ]);

        const stats = statsResults[0] || {
            totalReviews: 0,
            averageRating: 0,
            rating5: 0, rating4: 0, rating3: 0, rating2: 0, rating1: 0
        };

        // ✅ Tính phần trăm cho rating breakdown
        const total = stats.totalReviews || 1; // Tránh chia cho 0
        const ratingBreakdown = {
            5: { count: stats.rating5, percentage: Math.round((stats.rating5 / total) * 100) },
            4: { count: stats.rating4, percentage: Math.round((stats.rating4 / total) * 100) },
            3: { count: stats.rating3, percentage: Math.round((stats.rating3 / total) * 100) },
            2: { count: stats.rating2, percentage: Math.round((stats.rating2 / total) * 100) },
            1: { count: stats.rating1, percentage: Math.round((stats.rating1 / total) * 100) }
        };

        // ✅ Tính satisfaction level
        const positiveReviews = stats.rating4 + stats.rating5;
        const satisfactionRate = Math.round((positiveReviews / total) * 100);

        // ✅ Phân tích comment length
        const commentStats = {
            withComments: stats.allComments?.filter(comment => comment && comment.trim().length > 0).length || 0,
            withoutComments: (stats.totalReviews || 0) - (stats.allComments?.filter(comment => comment && comment.trim().length > 0).length || 0),
            averageCommentLength: 0
        };

        if (stats.allComments && stats.allComments.length > 0) {
            const validComments = stats.allComments.filter(comment => comment && comment.trim().length > 0);
            if (validComments.length > 0) {
                commentStats.averageCommentLength = Math.round(
                    validComments.reduce((sum, comment) => sum + comment.length, 0) / validComments.length
                );
            }
        }

        // ✅ Response
        res.status(200).json({
            success: true,
            message: "Thống kê đánh giá thành công",
            data: {
                hotel: {
                    id: hotel._id,
                    name: hotel.tenKhachSan
                },
                overview: {
                    totalReviews: stats.totalReviews || 0,
                    averageRating: stats.averageRating ? Math.round(stats.averageRating * 10) / 10 : 0,
                    satisfactionRate: satisfactionRate,
                    ratingRange: {
                        min: stats.minRating || 0,
                        max: stats.maxRating || 0
                    }
                },
                ratingBreakdown: ratingBreakdown,
                bookingTypeBreakdown: {
                    hourly: stats.hourlyBookings || 0,
                    overnight: stats.overnightBookings || 0,
                    longStay: stats.longStayBookings || 0
                },
                timeline: {
                    oldestReview: stats.oldestReview,
                    newestReview: stats.newestReview,
                    reviewPeriod: stats.oldestReview && stats.newestReview ?
                        Math.ceil((new Date(stats.newestReview) - new Date(stats.oldestReview)) / (1000 * 60 * 60 * 24)) : 0
                },
                commentAnalysis: commentStats
            }
        });

    } catch (error) {
        console.error('❌ Lỗi thống kê reviews:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ khi tính thống kê",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ✅ API LẤY REVIEWS MỚI NHẤT (cho widget/preview)
router.get('/:hotelId/reviews/recent', async (req, res) => {
    try {
        const { hotelId } = req.params;
        const { limit = 5 } = req.query;

        if (!mongoose.Types.ObjectId.isValid(hotelId)) {
            return res.status(400).json({
                success: false,
                message: "Mã khách sạn không hợp lệ!"
            });
        }

        // ✅ Kiểm tra khách sạn có tồn tại không
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: "Khách sạn không tồn tại!"
            });
        }

        console.log(`🔍 Lấy ${limit} reviews mới nhất cho hotel: ${hotelId}`);

        // ✅ Pipeline chung để lấy tất cả reviews của khách sạn
        const basePipeline = [
            {
                $lookup: {
                    from: "dondatphongs",
                    localField: "maDatPhong",
                    foreignField: "_id",
                    as: "booking"
                }
            },
            {
                $match: {
                    "booking.maKhachSan": new mongoose.Types.ObjectId(hotelId)
                }
            },
            { $unwind: "$booking" },
            {
                $lookup: {
                    from: "nguoidungs",
                    localField: "booking.maNguoiDung",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" }
        ];

        // ✅ Lấy reviews mới nhất (limited)
        const recentReviews = await mongoose.model("danhGia").aggregate([
            ...basePipeline,
            {
                $project: {
                    _id: 1,
                    soSao: 1,
                    binhLuan: 1,
                    ngayDanhGia: 1,
                    user: {
                        _id: "$user._id",
                        tenNguoiDung: "$user.tenNguoiDung",
                        hinhDaiDien: "$user.hinhDaiDien"
                    }
                }
            },
            { $sort: { ngayDanhGia: -1 } },
            { $limit: parseInt(limit) }
        ]);

        // ✅ Tính statistics từ TẤT CẢ reviews (không limit)
        const allReviewsStats = await mongoose.model("danhGia").aggregate([
            ...basePipeline,
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$soSao" },
                    totalReviews: { $sum: 1 },
                    ratingDistribution: {
                        $push: "$soSao"
                    }
                }
            }
        ]);

        // ✅ Tính phân bổ rating (1-5 sao)
        let ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        if (allReviewsStats[0]?.ratingDistribution) {
            allReviewsStats[0].ratingDistribution.forEach(rating => {
                ratingBreakdown[rating] = (ratingBreakdown[rating] || 0) + 1;
            });
        }

        // ✅ Format recent reviews cho frontend
        const formattedReviews = recentReviews.map(review => ({
            id: review._id,
            rating: review.soSao,
            comment: review.binhLuan || "",
            reviewDate: review.ngayDanhGia,
            user: {
                id: review.user._id,
                name: review.user.tenNguoiDung || "Khách hàng",
                avatar: review.user.hinhDaiDien || ""
            }
        }));

        // ✅ Response với cùng format như API /reviews
        res.status(200).json({
            success: true,
            message: `Lấy ${formattedReviews.length} reviews mới nhất`,
            data: {
                hotel: {
                    id: hotel._id,
                    name: hotel.tenKhachSan,
                    address: hotel.diaChiDayDu || `${hotel.diaChi?.phuongXa}, ${hotel.diaChi?.tinhThanh}`
                },
                statistics: {
                    totalReviews: allReviewsStats[0]?.totalReviews || 0,
                    averageRating: allReviewsStats[0]?.averageRating ?
                        Math.round(allReviewsStats[0].averageRating * 10) / 10 : 0,
                    ratingBreakdown: ratingBreakdown
                },
                reviews: formattedReviews
            }
        });

    } catch (error) {
        console.error('❌ Lỗi lấy recent reviews:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi máy chủ",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});



module.exports = router;
