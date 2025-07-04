// API TÌM KIẾM KHÁCH SẠN VỚI FILTER NÂNG CAO
const express = require("express");
const mongoose = require("mongoose");
const Hotel = require('../Model/Hotel/Hotel');
const RoomType = require('../Model/RoomType/RoomType');
const Amenities = require('../Model/Amenities/Amenities');
const AmenityDetails = require('../Model/Amenities/AmenityDetails');
const Room = require('../Model/Room/Room');
const RoomAvailability = require('../Model/Room/RoomAvailability');
const moment = require('moment-timezone');

const searchRouter = express.Router();

// 🔍 API TÌM KIẾM KHÁCH SẠN CHÍNH
// Endpoint: GET /search
// Mục đích: Tìm kiếm khách sạn với nhiều tiêu chí filter khác nhau
searchRouter.get('/search', async (req, res) => {
    try {
        
        // 📥 NHẬN CÁC THAM SỐ TỪ QUERY STRING
        const {
            // === TÌM KIẾM CƠ BẢN ===
            keyword,           // Từ khóa tìm kiếm: tên khách sạn, địa chỉ, mô tả
            city,              // Thành phố cụ thể
            district,          // Quận/huyện cụ thể
            
            // === FILTER GIÁ CẢ ===
            minPrice,          // Giá tối thiểu (VND)
            maxPrice,          // Giá tối đa (VND)
            
            // === FILTER ĐÁNH GIÁ ===
            minStars,          // Số sao tối thiểu (1-5)
            maxStars,          // Số sao tối đa (1-5)
            
            // === FILTER LOẠI KHÁCH SẠN ===
            hotelTypes,        // Mảng loại khách sạn: ['khachSan', 'khuNghiDuong', 'nhaNghi']
            
            // === FILTER TIỆN NGHI ===
            amenities,         // Mảng ID tiện nghi: ['wifi_id', 'pool_id', 'parking_id']
            
            // === FILTER SỨC CHỨA ===
            guests,            // Số khách tối thiểu mà khách sạn phải phục vụ được
            rooms,             // Số phòng cần thiết
            
            // === FILTER NGÀY (KIỂM TRA PHÒNG TRỐNG) ===
            checkIn,           // Ngày check-in (YYYY-MM-DD)
            checkOut,          // Ngày check-out (YYYY-MM-DD)
            bookingType,       // Loại đặt phòng: 'theo_gio', 'qua_dem', 'dai_ngay'
            
            // === SẮP XẾP & PHÂN TRANG ===
            sortBy,            // Cách sắp xếp: 'price_asc', 'price_desc', 'rating_desc'
            sortOrder,         // Thứ tự sắp xếp (không sử dụng nhiều)
            page = 1,          // Trang hiện tại (mặc định = 1)
            limit = 10,        // Số lượng kết quả mỗi trang (mặc định = 10)
            
            // === VỊ TRÍ ĐỊA LÝ ===
            lat,               // Vĩ độ để tìm kiếm theo khoảng cách
            lng,               // Kinh độ để tìm kiếm theo khoảng cách
            radius,            // Bán kính tìm kiếm (km)
            
            // === FILTER NÂNG CAO ===
            hasImages,         // Chỉ lấy khách sạn có hình ảnh
            hasAvailability,   // Chỉ lấy khách sạn có phòng trống
            verified,          // Chỉ lấy khách sạn đã xác minh
        } = req.query;

        console.log('🔍 Yêu cầu tìm kiếm:', req.query);

        // 🏗️ BƯỚC 1: XÂY DỰNG PIPELINE AGGREGATION
        // Pipeline là một chuỗi các bước xử lý dữ liệu trong MongoDB
        const pipeline = [];
        
        // 🎯 BƯỚC 1.1: MATCH STAGE - LỌC DỮ LIỆU CƠ BẢN
        // Tạo điều kiện tìm kiếm ban đầu
        const matchStage = {};
        
        // Tìm kiếm theo từ khóa trong nhiều trường
        if (keyword) {
            matchStage.$or = [
                { tenKhachSan: { $regex: keyword, $options: 'i' } },        // Tìm trong tên khách sạn
                { 'diaChi.thanhPho': { $regex: keyword, $options: 'i' } },  // Tìm trong tên thành phố
                { 'diaChi.quan': { $regex: keyword, $options: 'i' } },      // Tìm trong tên quận
                { diaChiDayDu: { $regex: keyword, $options: 'i' } },        // Tìm trong địa chỉ đầy đủ
                { moTa: { $regex: keyword, $options: 'i' } }                // Tìm trong mô tả
            ];
            // $regex: tìm kiếm theo pattern
            // $options: 'i' = không phân biệt chữ hoa/thường
        }
        
        // Tìm kiếm theo thành phố cụ thể
        if (city) {
            matchStage['diaChi.thanhPho'] = { $regex: city, $options: 'i' };
        }
        
        // Tìm kiếm theo quận/huyện cụ thể
        if (district) {
            matchStage['diaChi.quan'] = { $regex: district, $options: 'i' };
        }
        
        // Lọc theo số sao (rating)
        if (minStars || maxStars) {
            matchStage.soSao = {};
            if (minStars) matchStage.soSao.$gte = parseFloat(minStars);  // Lớn hơn hoặc bằng
            if (maxStars) matchStage.soSao.$lte = parseFloat(maxStars);  // Nhỏ hơn hoặc bằng
        }
        
        // Lọc theo loại khách sạn
        if (hotelTypes && hotelTypes.length > 0) {
            // Xử lý trường hợp hotelTypes là string hoặc array
            const types = Array.isArray(hotelTypes) ? hotelTypes : [hotelTypes];
            matchStage.loaiKhachSan = { $in: types };  // $in: có trong danh sách
        }
        
        // Thêm match stage vào pipeline nếu có điều kiện
        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }
        
        // 🔗 BƯỚC 1.2: LOOKUP ROOM TYPES - NỐI BẢNG LOẠI PHÒNG
        // Mục đích: Lấy thông tin loại phòng để tính giá
        pipeline.push({
            $lookup: {
                from: 'loaiphongs',        // Tên collection loại phòng
                localField: '_id',         // Trường _id trong bảng Hotel
                foreignField: 'maKhachSan',// Trường maKhachSan trong bảng RoomType
                as: 'roomTypes'            // Tên field chứa kết quả join
            }
        });
        
        // 🧮 BƯỚC 1.3: CALCULATE PRICE RANGE - TÍNH GIÁ PHÒNG
        // Tính giá min, max, trung bình cho mỗi khách sạn
        pipeline.push({
            $addFields: {
                // Giá phòng thấp nhất
                minRoomPrice: {
                    $min: {
                        $map: {
                            input: '$roomTypes',      // Duyệt qua mảng roomTypes
                            as: 'roomType',           // Biến tạm cho mỗi phần tử
                            in: '$$roomType.giaCa'    // Lấy giá của từng loại phòng
                        }
                    }
                },
                // Giá phòng cao nhất
                maxRoomPrice: {
                    $max: {
                        $map: {
                            input: '$roomTypes',
                            as: 'roomType',
                            in: '$$roomType.giaCa'
                        }
                    }
                },
                // Giá phòng trung bình
                avgRoomPrice: {
                    $avg: {
                        $map: {
                            input: '$roomTypes',
                            as: 'roomType',
                            in: '$$roomType.giaCa'
                        }
                    }
                },
                // Tổng số loại phòng
                totalRoomTypes: { $size: '$roomTypes' },
                
                // Tổng số phòng của khách sạn
                totalRooms: {
                    $sum: {
                        $map: {
                            input: '$roomTypes',
                            as: 'roomType',
                            in: '$$roomType.tongSoPhong'
                        }
                    }
                },
                // Sức chứa tối đa (khách sạn có thể phục vụ bao nhiêu khách)
                maxCapacity: {
                    $max: {
                        $map: {
                            input: '$roomTypes',
                            as: 'roomType',
                            in: '$$roomType.soLuongKhach'
                        }
                    }
                }
            }
        });
        
        // 💰 BƯỚC 1.4: FILTER BY PRICE RANGE - LỌC THEO GIÁ
        // Lọc khách sạn theo khoảng giá đã tính
        const priceMatchStage = {};
        
        if (minPrice || maxPrice) {
            if (minPrice) priceMatchStage.minRoomPrice = { $gte: parseFloat(minPrice) };
            if (maxPrice) priceMatchStage.maxRoomPrice = { $lte: parseFloat(maxPrice) };
        }
        
        // Lọc theo sức chứa
        if (guests) {
            priceMatchStage.maxCapacity = { $gte: parseInt(guests) };
        }
        
        // Chỉ lấy khách sạn có ít nhất 1 loại phòng
        priceMatchStage.totalRoomTypes = { $gt: 0 };
        
        if (Object.keys(priceMatchStage).length > 0) {
            pipeline.push({ $match: priceMatchStage });
        }
        
        // 🏨 BƯỚC 1.5: LOOKUP AMENITIES - LỌC THEO TIỆN NGHI
        // Nếu có filter tiện nghi, nối với bảng phòng và tiện nghi
        if (amenities && amenities.length > 0) {
            const amenityIds = Array.isArray(amenities) ? amenities : [amenities];
            
            // Nối với bảng phòng
            pipeline.push({
                $lookup: {
                    from: 'phongs',
                    localField: 'roomTypes._id',
                    foreignField: 'maLoaiPhong',
                    as: 'rooms'
                }
            });
            
            // Nối với bảng chi tiết tiện nghi
            pipeline.push({
                $lookup: {
                    from: 'chitiettiennghis',
                    localField: 'rooms._id',
                    foreignField: 'maPhong',
                    as: 'amenityDetails'
                }
            });
            
            // Lọc khách sạn có tiện nghi yêu cầu
            pipeline.push({
                $match: {
                    'amenityDetails.maTienNghi': { 
                        $in: amenityIds.map(id => new mongoose.Types.ObjectId(id)) 
                    }
                }
            });
        }
        
        // 📅 BƯỚC 1.6: CHECK AVAILABILITY - KIỂM TRA PHÒNG TRỐNG
        // Nếu có ngày check-in và yêu cầu phòng trống
        if (checkIn && hasAvailability === 'true') {
            pipeline.push({
                $lookup: {
                    from: 'lichphongtongs',         // Bảng lịch phòng trống
                    let: { 
                        hotelId: '$_id',            // ID khách sạn
                        roomTypeIds: '$roomTypes._id' // Danh sách ID loại phòng
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$maKhachSan', '$$hotelId'] },
                                        { $in: ['$maLoaiPhong', '$$roomTypeIds'] },
                                        { $gte: ['$ngay', new Date(checkIn)] },
                                        { $gt: ['$soPhongConLai', 0] }  // Có phòng trống
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'availability'
                }
            });
            
            // Chỉ lấy khách sạn có phòng trống
            pipeline.push({
                $match: {
                    'availability.0': { $exists: true }  // Có ít nhất 1 bản ghi availability
                }
            });
        }
        
        // 🔄 BƯỚC 1.7: SORTING - SẮP XẾP
        // Xác định cách sắp xếp kết quả
        const sortStage = {};
        switch (sortBy) {
            case 'price_asc':           // Giá tăng dần
                sortStage.minRoomPrice = 1;
                break;
            case 'price_desc':          // Giá giảm dần
                sortStage.maxRoomPrice = -1;
                break;
            case 'rating_desc':         // Rating giảm dần (khách sạn tốt nhất trước)
                sortStage.soSao = -1;
                break;
            case 'rating_asc':          // Rating tăng dần
                sortStage.soSao = 1;
                break;
            case 'name_asc':            // Tên A-Z
                sortStage.tenKhachSan = 1;
                break;
            case 'name_desc':           // Tên Z-A
                sortStage.tenKhachSan = -1;
                break;
            case 'newest':              // Mới nhất
                sortStage.createdAt = -1;
                break;
            case 'capacity_desc':       // Sức chứa cao nhất
                sortStage.maxCapacity = -1;
                break;
            default:                    // Mặc định: Rating cao nhất, nhiều loại phòng
                sortStage.soSao = -1;
                sortStage.totalRoomTypes = -1;
        }
        
        pipeline.push({ $sort: sortStage });
        
        // 📄 BƯỚC 1.8: PAGINATION - PHÂN TRANG
        // Xử lý phân trang kết quả
        const pageNum = parseInt(page) || 1;                          // Trang hiện tại
        const pageSize = Math.min(parseInt(limit) || 10, 50);         // Kích thước trang (tối đa 50)
        const skip = (pageNum - 1) * pageSize;                       // Số item bỏ qua
        
        // Tạo pipeline để đếm tổng số kết quả (cho pagination)
        const countPipeline = [...pipeline, { $count: 'total' }];
        
        // Thêm phân trang vào pipeline chính
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: pageSize });
        
        // 📊 BƯỚC 1.9: PROJECT FINAL FIELDS - CHỌN CÁC TRƯỜNG TRẢ VỀ
        // Quyết định những trường nào sẽ có trong kết quả cuối cùng
        pipeline.push({
            $project: {
                // === THÔNG TIN CƠ BẢN KHÁCH SẠN ===
                _id: 1,
                tenKhachSan: 1,
                diaChiDayDu: 1,
                'diaChi.thanhPho': 1,
                'diaChi.quan': 1,
                hinhAnh: 1,
                moTa: 1,
                soSao: 1,
                soDienThoai: 1,
                email: 1,
                loaiKhachSan: 1,
                
                // === THÔNG TIN GIÁ ĐÃ TÍNH TOÁN ===
                minRoomPrice: 1,
                maxRoomPrice: 1,
                avgRoomPrice: { $round: ['$avgRoomPrice', 0] },     // Làm tròn giá trung bình
                totalRoomTypes: 1,
                totalRooms: 1,
                maxCapacity: 1,
                
                // === THÔNG TIN HIỂN THỊ ===
                priceRange: {
                    min: '$minRoomPrice',
                    max: '$maxRoomPrice',
                    avg: { $round: ['$avgRoomPrice', 0] }
                },
                
                roomInfo: {
                    totalTypes: '$totalRoomTypes',
                    totalRooms: '$totalRooms',
                    maxGuests: '$maxCapacity'
                },
                
                location: {
                    city: '$diaChi.thanhPho',
                    district: '$diaChi.quan',
                    fullAddress: '$diaChiDayDu'
                },
                
                // === CÁC FLAG TIỆN ÍCH ===
                hasImage: { $ne: ['$hinhAnh', ''] },               // Có hình ảnh
                isVerified: { $ne: ['$soDienThoai', ''] },         // Đã xác minh (có SĐT)
                
                // === TƯƠNG THÍCH VỚI CODE CŨ ===
                giaTheoNgay: '$minRoomPrice'                       // Giá khởi điểm
            }
        });
        
        // ⚡ BƯỚC 2: THỰC HIỆN QUERY
        // Chạy 2 query song song để tối ưu performance
        const [hotels, countResult] = await Promise.all([
            Hotel.aggregate(pipeline),          // Lấy dữ liệu khách sạn
            Hotel.aggregate(countPipeline)      // Đếm tổng số kết quả
        ]);
        
        const totalHotels = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalHotels / pageSize);
        
        // 🚀 BƯỚC 3: ENHANCE RESULTS - TĂNG CƯỜNG KẾT QUẢ
        // Thêm các thông tin bổ sung cho mỗi khách sạn
        const enhancedHotels = await Promise.all(
            hotels.map(async (hotel) => {
                try {
                    // Tính toán các thông tin bổ sung
                    const additionalInfo = {
                        // Điểm liên quan (relevance score)
                        searchScore: calculateSearchScore(hotel, { keyword, city, minStars }),
                        
                        // Khoảng cách từ điểm trung tâm (nếu có tọa độ)
                        distanceFromCenter: lat && lng ? 
                            calculateDistance(lat, lng, hotel.diaChi?.lat, hotel.diaChi?.lng) : null,
                        
                        // Điểm phổ biến (popularity score)
                        popularityScore: hotel.soSao * 20 + hotel.totalRoomTypes * 5,
                        
                        // Phân loại mức giá
                        priceLevel: categorizePriceLevel(hotel.avgRoomPrice),
                        
                        // Trạng thái có phòng trống
                        availabilityStatus: hasAvailability === 'true' ? 'available' : 'unknown'
                    };
                    
                    return {
                        ...hotel,              // Giữ nguyên thông tin gốc
                        ...additionalInfo      // Thêm thông tin bổ sung
                    };
                } catch (error) {
                    console.error(`Lỗi khi tăng cường thông tin khách sạn ${hotel._id}:`, error);
                    return hotel;  // Trả về dữ liệu gốc nếu có lỗi
                }
            })
        );
        
        // 📤 BƯỚC 4: TẠO RESPONSE - CHUẨN BỊ KẾT QUẢ TRẢ VỀ
        const response = {
            // Thông báo kết quả
            message: `Tìm thấy ${totalHotels} khách sạn phù hợp`,
            
            // Thông tin về yêu cầu tìm kiếm
            searchInfo: {
                keyword: keyword || null,
                city: city || null,
                district: district || null,
                priceRange: {
                    min: minPrice ? parseFloat(minPrice) : null,
                    max: maxPrice ? parseFloat(maxPrice) : null
                },
                starRange: {
                    min: minStars ? parseFloat(minStars) : null,
                    max: maxStars ? parseFloat(maxStars) : null
                },
                filters: {
                    hotelTypes: hotelTypes || [],
                    amenities: amenities || [],
                    guests: guests ? parseInt(guests) : null,
                    rooms: rooms ? parseInt(rooms) : null,
                    hasAvailability: hasAvailability === 'true'
                },
                sorting: sortBy || 'rating_desc',
                searchTime: new Date().toISOString()
            },
            
            // Thông tin phân trang
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalItems: totalHotels,
                itemsPerPage: pageSize,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1,
                nextPage: pageNum < totalPages ? pageNum + 1 : null,
                prevPage: pageNum > 1 ? pageNum - 1 : null
            },
            
            // Thống kê tổng quan
            statistics: {
                totalHotels,
                priceRange: hotels.length > 0 ? {
                    min: Math.min(...hotels.map(h => h.minRoomPrice)),
                    max: Math.max(...hotels.map(h => h.maxRoomPrice)),
                    avg: Math.round(hotels.reduce((sum, h) => sum + h.avgRoomPrice, 0) / hotels.length)
                } : null,
                starRange: hotels.length > 0 ? {
                    min: Math.min(...hotels.map(h => h.soSao)),
                    max: Math.max(...hotels.map(h => h.soSao)),
                    avg: Math.round((hotels.reduce((sum, h) => sum + h.soSao, 0) / hotels.length) * 10) / 10
                } : null,
                hotelTypes: [...new Set(hotels.map(h => h.loaiKhachSan))],
                cities: [...new Set(hotels.map(h => h.location.city))],
                districts: [...new Set(hotels.map(h => h.location.district))]
            },
            
            // Danh sách khách sạn
            hotels: enhancedHotels,
            
            // Gợi ý tìm kiếm nếu không có kết quả
            suggestions: totalHotels === 0 ? await generateSearchSuggestions(keyword, city) : null
        };
        
        return res.status(200).json(response);
        
    } catch (error) {
        console.error('❌ Lỗi API tìm kiếm khách sạn:', error);
        return res.status(500).json({
            message: 'Lỗi máy chủ khi tìm kiếm khách sạn',
            error: error.message,
            success: false
        });
    }
});

// 🎯 API AUTOCOMPLETE/SUGGESTIONS - TỰ ĐỘNG HOÀN THÀNH
// Endpoint: GET /suggestions
// Mục đích: Đưa ra gợi ý khi người dùng gõ từ khóa
searchRouter.get('/suggestions', async (req, res) => {
    try {
        const { q, type = 'all', limit = 10 } = req.query;
        
        // Kiểm tra độ dài từ khóa
        if (!q || q.length < 2) {
            return res.json({
                suggestions: [],
                message: 'Nhập ít nhất 2 ký tự để tìm kiếm'
            });
        }
        
        const suggestions = [];
        
        // === GỢI Ý TÊN KHÁCH SẠN ===
        if (type === 'all' || type === 'hotels') {
            const hotelSuggestions = await Hotel.find({
                tenKhachSan: { $regex: q, $options: 'i' }
            })
            .select('tenKhachSan diaChi.thanhPho soSao')  // Chỉ lấy các trường cần thiết
            .limit(limit)
            .lean();  // Trả về plain JavaScript object (nhanh hơn)
            
            // Chuyển đổi format cho frontend
            suggestions.push(...hotelSuggestions.map(hotel => ({
                type: 'hotel',
                title: hotel.tenKhachSan,
                subtitle: hotel.diaChi?.thanhPho || '',
                stars: hotel.soSao,
                value: hotel.tenKhachSan,
                id: hotel._id
            })));
        }
        
        // === GỢI Ý THÀNH PHỐ ===
        if (type === 'all' || type === 'cities') {
            const citySuggestions = await Hotel.aggregate([
                {
                    $match: {
                        'diaChi.thanhPho': { $regex: q, $options: 'i' }
                    }
                },
                {
                    $group: {
                        _id: '$diaChi.thanhPho',
                        count: { $sum: 1 },                    // Đếm số khách sạn
                        avgRating: { $avg: '$soSao' }          // Tính rating trung bình
                    }
                },
                {
                    $sort: { count: -1 }                       // Sắp xếp theo số lượng khách sạn
                },
                {
                    $limit: limit
                }
            ]);
            
            suggestions.push(...citySuggestions.map(city => ({
                type: 'city',
                title: city._id,
                subtitle: `${city.count} khách sạn`,
                stars: Math.round(city.avgRating * 10) / 10,
                value: city._id,
                count: city.count
            })));
        }
        
        // === GỢI Ý QUẬN/HUYỆN ===
        if (type === 'all' || type === 'districts') {
            const districtSuggestions = await Hotel.aggregate([
                {
                    $match: {
                        'diaChi.quan': { $regex: q, $options: 'i' }
                    }
                },
                {
                    $group: {
                        _id: {
                            district: '$diaChi.quan',
                            city: '$diaChi.thanhPho'
                        },
                        count: { $sum: 1 },
                        avgRating: { $avg: '$soSao' }
                    }
                },
                {
                    $sort: { count: -1 }
                },
                {
                    $limit: limit
                }
            ]);
            
            suggestions.push(...districtSuggestions.map(district => ({
                type: 'district',
                title: district._id.district,
                subtitle: `${district._id.city} - ${district.count} khách sạn`,
                stars: Math.round(district.avgRating * 10) / 10,
                value: district._id.district,
                count: district.count
            })));
        }
        
        // === SẮP XẾP THEO ĐỘ LIÊN QUAN ===
        const sortedSuggestions = suggestions
            .sort((a, b) => {
                // Ưu tiên match chính xác (bắt đầu bằng từ khóa)
                const aExact = a.title.toLowerCase().startsWith(q.toLowerCase());
                const bExact = b.title.toLowerCase().startsWith(q.toLowerCase());
                
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;
                
                // Sau đó sắp xếp theo số lượng/rating
                return (b.count || 0) - (a.count || 0) || (b.stars || 0) - (a.stars || 0);
            })
            .slice(0, limit);  // Giới hạn số lượng kết quả
        
        return res.json({
            suggestions: sortedSuggestions,
            query: q,
            total: sortedSuggestions.length
        });
        
    } catch (error) {
        console.error('❌ Lỗi API gợi ý:', error);
        return res.status(500).json({
            suggestions: [],
            error: error.message
        });
    }
});

// 📊 API FILTER OPTIONS - TÙY CHỌN FILTER
// Endpoint: GET /filter-options
// Mục đích: Lấy các tùy chọn filter động dựa trên dữ liệu thực tế
searchRouter.get('/filter-options', async (req, res) => {
    try {
        const { city, district } = req.query;
        
        // Điều kiện lọc theo vị trí (nếu có)
        const locationMatch = {};
        if (city) locationMatch['diaChi.thanhPho'] = city;
        if (district) locationMatch['diaChi.quan'] = district;
        
        // Chạy 6 query song song để lấy tất cả filter options
        const [priceRange, starRange, cities, districts, hotelTypes, amenities] = await Promise.all([
            
            // === 1. KHOẢNG GIÁ ===
            // Tính giá min/max/avg của tất cả khách sạn
            Hotel.aggregate([
                { $match: locationMatch },
                {
                    $lookup: {
                        from: 'loaiphongs',
                        localField: '_id',
                        foreignField: 'maKhachSan',
                        as: 'roomTypes'
                    }
                },
                {
                    $addFields: {
                        minPrice: { $min: '$roomTypes.giaCa' },
                        maxPrice: { $max: '$roomTypes.giaCa' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        minPrice: { $min: '$minPrice' },
                        maxPrice: { $max: '$maxPrice' },
                        avgPrice: { $avg: '$minPrice' }
                    }
                }
            ]),
            
            // === 2. KHOẢNG SAO ===
            // Tính số sao min/max/avg của tất cả khách sạn
            Hotel.aggregate([
                { $match: locationMatch },
                {
                    $group: {
                        _id: null,
                        minStars: { $min: '$soSao' },
                        maxStars: { $max: '$soSao' },
                        avgStars: { $avg: '$soSao' }
                    }
                }
            ]),
            
            // === 3. DANH SÁCH THÀNH PHỐ ===
            // Lấy tất cả thành phố có khách sạn
            Hotel.aggregate([
                { $match: locationMatch },
                {
                    $group: {
                        _id: '$diaChi.thanhPho',
                        count: { $sum: 1 }                    // Đếm số khách sạn mỗi thành phố
                    }
                },
                { $sort: { count: -1 } }                       // Sắp xếp theo số lượng
            ]),
            
            // === 4. DANH SÁCH QUẬN/HUYỆN ===
            // Lấy tất cả quận/huyện có khách sạn
            Hotel.aggregate([
                { $match: locationMatch },
                {
                    $group: {
                        _id: {
                            city: '$diaChi.thanhPho',
                            district: '$diaChi.quan'
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]),
            
            // === 5. LOẠI KHÁCH SẠN ===
            // Lấy tất cả loại khách sạn có sẵn
            Hotel.aggregate([
                { $match: locationMatch },
                {
                    $group: {
                        _id: '$loaiKhachSan',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]),
            
            // === 6. TIỆN NGHI PHỔ BIẾN ===
            // Lấy 20 tiện nghi phổ biến nhất
            Amenities.find()
                .populate('maNhomTienNghi', 'tenNhomTienNghi')  // Nối với bảng nhóm tiện nghi
                .select('tenTienNghi icon maNhomTienNghi')
                .limit(20)
                .lean()
        ]);
        
        // Trả về kết quả với format chuẩn
        return res.json({
            // Khoảng giá (fallback nếu không có dữ liệu)
            priceRange: priceRange[0] || { 
                minPrice: 0, 
                maxPrice: 1000000, 
                avgPrice: 500000 
            },
            
            // Khoảng sao (fallback nếu không có dữ liệu)
            starRange: starRange[0] || { 
                minStars: 1, 
                maxStars: 5, 
                avgStars: 3 
            },
            
            // Danh sách thành phố
            cities: cities.map(c => ({ 
                name: c._id, 
                count: c.count 
            })),
            
            // Danh sách quận/huyện
            districts: districts.map(d => ({ 
                name: d._id.district, 
                city: d._id.city,
                count: d.count 
            })),
            
            // Danh sách loại khách sạn
            hotelTypes: hotelTypes.map(t => ({ 
                type: t._id, 
                count: t.count 
            })),
            
            // Danh sách tiện nghi
            amenities: amenities.map(a => ({
                id: a._id,
                name: a.tenTienNghi,
                icon: a.icon,
                category: a.maNhomTienNghi?.tenNhomTienNghi || 'Khác'
            }))
        });
        
    } catch (error) {
        console.error('❌ Lỗi API filter options:', error);
        return res.status(500).json({
            error: error.message
        });
    }
});

// 🔧 HELPER FUNCTIONS - CÁC HÀM HỖ TRỢ

// Tính điểm liên quan của khách sạn với yêu cầu tìm kiếm
function calculateSearchScore(hotel, searchParams) {
    let score = 0;
    
    // Điểm cơ bản từ rating (5 sao = 100 điểm)
    score += hotel.soSao * 20;
    
    // Bonus nếu tên khách sạn chứa từ khóa
    if (searchParams.keyword) {
        if (hotel.tenKhachSan.toLowerCase().includes(searchParams.keyword.toLowerCase())) {
            score += 30;  // +30 điểm cho keyword match
        }
    }
    
    // Bonus nếu thành phố trùng khớp
    if (searchParams.city && hotel.location.city === searchParams.city) {
        score += 25;  // +25 điểm cho city match
    }
    
    // Bonus nếu đáp ứng yêu cầu về sao
    if (searchParams.minStars && hotel.soSao >= searchParams.minStars) {
        score += 15;  // +15 điểm cho star requirement
    }
    
    // Bonus cho khách sạn có nhiều loại phòng
    score += hotel.totalRoomTypes * 5;  // +5 điểm mỗi loại phòng
    
    // Bonus cho khách sạn có hình ảnh
    if (hotel.hasImage) {
        score += 10;  // +10 điểm cho có hình ảnh
    }
    
    return Math.round(score);
}

// Tính khoảng cách giữa 2 điểm GPS (công thức Haversine)
function calculateDistance(lat1, lng1, lat2, lng2) {
    if (!lat2 || !lng2) return null;
    
    const R = 6371; // Bán kính Trái Đất (km)
    
    // Chuyển đổi độ sang radian
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    // Công thức Haversine
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return Math.round(R * c * 100) / 100; // Làm tròn 2 chữ số thập phân
}

// Phân loại mức giá khách sạn
function categorizePriceLevel(avgPrice) {
    if (avgPrice < 200000) return 'budget';         // Giá rẻ
    if (avgPrice < 500000) return 'mid_range';      // Tầm trung
    if (avgPrice < 1000000) return 'high_end';      // Cao cấp
    return 'luxury';                                // Sang trọng
}

// Tạo gợi ý tìm kiếm khi không có kết quả
async function generateSearchSuggestions(keyword, city) {
    try {
        const suggestions = [];
        
        // === GỢI Ý THÀNH PHỐ PHỔ BIẾN ===
        const popularCities = await Hotel.aggregate([
            {
                $group: {
                    _id: '$diaChi.thanhPho',
                    count: { $sum: 1 },
                    avgRating: { $avg: '$soSao' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        
        suggestions.push(...popularCities.map(c => ({
            type: 'city',
            suggestion: `Thử tìm kiếm ở ${c._id}`,
            query: { city: c._id }
        })));
        
        // === GỢI Ý LOẠI KHÁCH SẠN PHỔ BIẾN ===
        const popularTypes = await Hotel.aggregate([
            {
                $group: {
                    _id: '$loaiKhachSan',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 3 }
        ]);
        
        suggestions.push(...popularTypes.map(t => ({
            type: 'hotel_type',
            suggestion: `Xem các ${t._id}`,
            query: { hotelTypes: [t._id] }
        })));
        
        return suggestions;
        
    } catch (error) {
        console.error('Lỗi tạo gợi ý tìm kiếm:', error);
        return [];
    }
}

module.exports = searchRouter;