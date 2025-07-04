const express = require("express");
const mongoose = require("mongoose");
const Room = require('../Model/Room/Room');
const RoomType = require('../Model/RoomType/RoomType');
const { uploadHotel } = require("../config/upload");
const Hotel = require("../Model/Hotel/Hotel");
const { route } = require("./userController");
const router = express.Router();
const Booking = require("../Model/Booking/Booking");
const RoomImage = require("../Model/Room/RoomImage");
const RoomAvailability = require("../Model/Room/RoomAvailability");
const moment = require('moment-timezone');
const AmenityDetails = require("../Model/Amenities/AmenityDetails");
const Amenities = require("../Model/Amenities/Amenities");


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
        const hotels = await Hotel.find();
        if (!hotels || hotels.length === 0) {
            return res.status(404).json({
                message: { msgBody: "Empty list!", msgError: true }
            });
        }

        // Enhance mỗi khách sạn với giá theo đêm
        const enhancedHotels = await Promise.all(hotels.map(async (hotel) => {
            try {
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

                return {
                    _id: hotel._id,
                    tenKhachSan: hotel.tenKhachSan,
                    diaChiDayDu: hotel.diaChiDayDu,
                    thanhPho: hotel.thanhPho,
                    moTa: hotel.moTa,
                    soSao: hotel.soSao,
                    soDienThoai: hotel.soDienThoai,
                    email: hotel.email,

                    hinhAnh: hotel.hinhAnh,

                    // ✅ Thuộc tính mới - Giá theo đêm
                    giaTheoNgay: giaTheoNgay  // Giá khởi điểm theo đêm
                };
            } catch (error) {
                console.error(`Lỗi xử lý khách sạn ${hotel._id}:`, error);
                // Fallback về giá gốc nếu có lỗi
                return {
                    _id: hotel._id,
                    tenKhachSan: hotel.tenKhachSan,
                    diaChi: hotel.diaChi,
                    thanhPho: hotel.thanhPho,
                    moTa: hotel.moTa,
                    soSao: hotel.soSao,
                    soDienThoai: hotel.soDienThoai,
                    email: hotel.email,
                    giaCa: hotel.giaCa,
                    hinhAnh: hotel.hinhAnh,
                    giaTheoNgay: hotel.giaCa || 0
                };
            }
        }));

        return res.status(200).json({
            message: { msgBody: "Successfully!", msgError: false },
            hotels: enhancedHotels
        });

    } catch (err) {
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
        const validation = validateMultiRoomSearchInput({
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
                console.log(`\n🏨 Đang phân tích loại phòng: ${roomType.tenLoaiPhong}`);
                console.log('📊 Thông số phòng:', {
                    capacity: roomType.soLuongKhach,
                    totalRooms: roomType.tongSoPhong,
                    price: roomType.giaCa
                });

                // ✅ Tính toán khả năng chứa cho nhiều phòng
                const capacityAnalysis = calculateMultiRoomCapacity({
                    roomCapacity: roomType.soLuongKhach,
                    totalGuests,
                    requestedRooms
                });

                console.log('🧮 Phân tích khả năng chứa:', capacityAnalysis);

                // Bỏ qua nếu không thể chứa khách với số phòng yêu cầu
                if (!capacityAnalysis.canAccommodate) {
                    console.log('❌ Không thể chứa khách với số phòng yêu cầu');

                    // Đề xuất số phòng cần thiết
                    if (capacityAnalysis.suggestedRooms <= roomType.tongSoPhong) {
                        roomAllocationSuggestions.push({
                            roomTypeId: roomType._id,
                            roomTypeName: roomType.tenLoaiPhong,
                            capacity: roomType.soLuongKhach,
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
                        // Giảm giá nhóm cho >= 3 phòng
                        groupDiscount: requestedRooms >= 3 ? 0.05 : 0,
                        finalTotalPrice: Math.round(singleRoomPricing.finalPrice * requestedRooms * (1 - (requestedRooms >= 3 ? 0.05 : 0)))
                    };

                    availableRoomTypes.push({
                        roomTypeId: roomType._id,
                        tenLoaiPhong: roomType.tenLoaiPhong,
                        moTa: roomType.moTa || "",
                        soLuongKhach: roomType.soLuongKhach,
                        giaCa: roomType.giaCa,
                        images: roomImages,
                        amenities: amenities,
                        cauHinhGiuong: bedConfig,

                        // ✅ Thông tin đặc biệt cho nhiều phòng
                        multiRoomInfo: {
                            requestedRooms,
                            totalCapacity: roomType.soLuongKhach * requestedRooms,
                            guestDistribution: capacityAnalysis.guestDistribution,
                            canAccommodateAll: capacityAnalysis.canAccommodate,
                            occupancyRate: Math.round((totalGuests / (roomType.soLuongKhach * requestedRooms)) * 100)
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
                            totalCapacity: roomType.soLuongKhach * requestedRooms,
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
                diaChiKhachSan: hotel.diaChiDayDu || `${hotel.diaChi?.quan}, ${hotel.diaChi?.thanhPho}`,
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


function validateMultiRoomSearchInput({
    hotelId, bookingType, checkInDate, checkOutDate,
    checkInTime, checkOutTime, guests, requestedRooms
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

    // ✅ Validation đặc biệt cho nhiều phòng
    if (requestedRooms < 1 || requestedRooms > 20) {
        return {
            valid: false,
            message: "Số phòng phải từ 1-20!",
            suggestion: "Vui lòng chọn số phòng từ 1 đến 20"
        };
    }

    const totalGuests = (guests?.adults || 0) + (guests?.children || 0);
    if (totalGuests < 1 || totalGuests > 50) {
        return {
            valid: false,
            message: "Số khách phải từ 1-50!",
            suggestion: "Vui lòng điều chỉnh số lượng khách"
        };
    }

    // ✅ Kiểm tra logic: Quá nhiều phòng so với khách
    if (requestedRooms > totalGuests) {
        return {
            valid: false,
            message: `${requestedRooms} phòng cho ${totalGuests} khách là quá nhiều!`,
            suggestion: `Đề xuất: ${Math.ceil(totalGuests / 2)} phòng sẽ phù hợp hơn`
        };
    }

    // ✅ Kiểm tra logic: Quá ít phòng cho nhóm đông (giả sử tối đa 4 người/phòng)
    const maxGuestsWithCurrentRooms = requestedRooms * 4; // Giả sử tối đa 4 khách/phòng
    if (totalGuests > maxGuestsWithCurrentRooms) {
        const minRoomsNeeded = Math.ceil(totalGuests / 4);
        return {
            valid: false,
            message: `${requestedRooms} phòng không đủ cho ${totalGuests} khách!`,
            suggestion: `Đề xuất: Cần ít nhất ${minRoomsNeeded} phòng cho ${totalGuests} khách`
        };
    }

    // Booking type specific validations (same as before)
    const checkInMoment = moment(checkInDate);
    const checkOutMoment = checkOutDate ? moment(checkOutDate) : null;

    switch (bookingType) {
        case 'theo_gio':
            if (!checkInTime || !checkOutTime) {
                return { valid: false, message: "Đặt theo giờ cần có giờ nhận và giờ trả!" };
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
            if (longDiff < 3) {
                return { valid: false, message: "Đặt dài ngày tối thiểu 3 ngày!" };
            }
            break;
    }

    return { valid: true, message: "Input hợp lệ" };
}


// ✅ HELPER: Validate search input
function validateSearchInput({ hotelId, bookingType, checkInDate, checkOutDate, checkInTime, checkOutTime, guests, requestedRooms }) {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
        return { valid: false, message: "Mã khách sạn không hợp lệ!" };
    }

    // Validate booking type
    if (!bookingType || !['theo_gio', 'qua_dem', 'dai_ngay'].includes(bookingType)) {
        return { valid: false, message: "Loại đặt phòng không hợp lệ!" };
    }

    // Validate dates
    if (!checkInDate || !moment(checkInDate, 'YYYY-MM-DD', true).isValid()) {
        return { valid: false, message: "Ngày nhận phòng không hợp lệ!" };
    }

    // Validate theo từng loại booking
    const checkInMoment = moment(checkInDate);
    const checkOutMoment = checkOutDate ? moment(checkOutDate) : null;

    switch (bookingType) {
        case 'theo_gio':
            if (!checkInTime || !checkOutTime) {
                return { valid: false, message: "Đặt theo giờ cần có giờ nhận và giờ trả!" };
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
            if (longDiff < 3) {
                return { valid: false, message: "Đặt dài ngày tối thiểu 3 ngày!" };
            }
            break;
    }

    // Validate guests và rooms
    if (requestedRooms < 1 || requestedRooms > 10) {
        return { valid: false, message: "Số phòng phải từ 1-10!" };
    }

    const totalGuests = (guests?.adults || 0) + (guests?.children || 0);
    if (totalGuests < 1 || totalGuests > 20) {
        return { valid: false, message: "Số khách phải từ 1-20!" };
    }

    return { valid: true, message: "Dữ liệu đầu vào hợp lệ" };
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
            const suggestedRooms = Math.ceil(totalGuests / roomType.soLuongKhach);

            if (suggestedRooms <= roomType.tongSoPhong) {
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
                        capacity: roomType.soLuongKhach,
                        suggestedRooms,
                        totalCapacity: roomType.soLuongKhach * suggestedRooms,
                        pricing,
                        guestDistribution: calculateMultiRoomCapacity({
                            roomCapacity: roomType.soLuongKhach,
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


// ✅ Kiểm tra availability theo giờ - ENHANCED
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


// ✅ Kiểm tra availability qua đêm - ENHANCED
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


// ✅ Kiểm tra availability dài ngày - ENHANCED
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

// ✅ Enhanced pricing calculation
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

            // ⚠️ Quy ước: giá phòng theo giờ được tính theo tỷ lệ 1/8 giá cơ bản
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
