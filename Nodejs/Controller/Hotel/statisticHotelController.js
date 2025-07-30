const express = require("express");
const mongoose = require("mongoose");
const authorizeRoles = require('../../middleware/roleAuth');
const statisticHotelRouter = express.Router();
const Booking = require("../../Model/Booking/Booking");
const User = require("../../Model/User/User");
const Review = require("../../Model/Booking/Review");
const Hotel = require("../../Model/Hotel/Hotel");
const RoomAssignment = require("../../Model/Room/RoomBookingAssignment");
const moment = require("moment");

// ============================================
// CUSTOMER STATISTICS ROUTES
// ============================================
statisticHotelRouter.get("/hotelowner/customers", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { hotelId, page = 1, limit = 20, search = "" } = req.query;
        const user = await User.findById(req.user.id);

        if (!user || user.vaiTro !== "chuKhachSan") {
            return res.status(403).json({
                success: false,
                message: "Không có quyền truy cập!"
            });
        }

        // Lấy danh sách khách sạn của user
        const hotels = await Hotel.find({ maChuKhachSan: user._id });
        if (hotels.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Bạn chưa sở hữu khách sạn nào."
            });
        }

        const hotelIds = hotels.map(h => h._id);
        let query = { 
            maKhachSan: { $in: hotelIds },
            maNguoiDung: { $exists: true, $ne: null }
        };

        // Filter theo hotel cụ thể
        if (hotelId && hotelIds.map(id => id.toString()).includes(hotelId)) {
            query.maKhachSan = new mongoose.Types.ObjectId(hotelId);
        }

        // Aggregation pipeline để thống kê khách hàng
        const pipeline = [
            { $match: query },
            {
                $group: {
                    _id: "$maNguoiDung",
                    totalBookings: { $sum: 1 },
                    totalAmount: { $sum: "$thongTinGia.tongDonDat" },
                    totalDiscount: { $sum: "$thongTinGia.giamGia" },
                    totalSurcharge: { $sum: "$thongTinGia.phuPhiCuoiTuan" },
                    bookingTypes: { $addToSet: "$loaiDatPhong" },
                    lastBooking: { $max: "$thoiGianTaoDon" },
                    firstBooking: { $min: "$thoiGianTaoDon" },
                    cancelledBookings: {
                        $sum: { $cond: [{ $eq: ["$trangThai", "da_huy"] }, 1, 0] }
                    },
                    completedBookings: {
                        $sum: { $cond: [{ $eq: ["$trangThai", "da_tra_phong"] }, 1, 0] }
                    }
                }
            },
            {
                $lookup: {
                    from: User.collection.name,
                    localField: "_id",
                    foreignField: "_id",
                    as: "customerInfo"
                }
            },
            {
                $project: {
                    customerId: "$_id",
                    customerName: {
                        $cond: {
                            if: { $gt: [{ $size: "$customerInfo" }, 0] },
                            then: { $arrayElemAt: ["$customerInfo.tenNguoiDung", 0] },
                            else: "Khách lẻ"
                        }
                    },
                    email: {
                        $cond: {
                            if: { $gt: [{ $size: "$customerInfo" }, 0] },
                            then: { $arrayElemAt: ["$customerInfo.email", 0] },
                            else: "Không có email"
                        }
                    },
                    phoneNumber: {
                        $cond: {
                            if: { $gt: [{ $size: "$customerInfo" }, 0] },
                            then: { $arrayElemAt: ["$customerInfo.soDienThoai", 0] },
                            else: "Không có SĐT"
                        }
                    },
                    isWalkInGuest: {
                        $eq: [{ $size: "$customerInfo" }, 0]
                    },
                    totalBookings: 1,
                    totalAmount: 1,
                    totalDiscount: 1,
                    totalSurcharge: 1,
                    bookingTypes: 1,
                    lastBooking: 1,
                    firstBooking: 1,
                    cancelledBookings: 1,
                    completedBookings: 1,
                    customerSince: { $dateToString: { format: "%d-%m-%Y", date: "$firstBooking" } },
                    loyaltyLevel: {
                        $switch: {
                            branches: [
                                { case: { $gte: ["$totalBookings", 20] }, then: "VIP" },
                                { case: { $gte: ["$totalBookings", 10] }, then: "Gold" },
                                { case: { $gte: ["$totalBookings", 5] }, then: "Silver" },
                            ],
                            default: "Bronze"
                        }
                    }
                }
            }
        ];

        // Thêm search filter nếu có
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { customerName: { $regex: search, $options: "i" } },
                        { email: { $regex: search, $options: "i" } },
                        { phoneNumber: { $regex: search, $options: "i" } }
                    ]
                }
            });
        }

        // Sort và pagination
        pipeline.push(
            { $sort: { totalAmount: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: parseInt(limit) }
        );

        const customers = await Booking.aggregate(pipeline);

        // Đếm tổng số customers - simplified count
        const countPipeline = [
            { $match: query },
            {
                $group: {
                    _id: "$maNguoiDung"
                }
            },
            { $count: "total" }
        ];

        const totalResult = await Booking.aggregate(countPipeline);
        const totalCustomers = totalResult[0]?.total || 0;

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách khách hàng thành công",
            data: {
                customers,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCustomers / limit),
                    totalCustomers,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error("Lỗi lấy danh sách khách hàng:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server khi lấy danh sách khách hàng.",
            error: error.message
        });
    }
});

// ✅ 2. Lấy chi tiết khách hàng - Fixed
statisticHotelRouter.get("/hotelowner/customers/:customerId", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { customerId } = req.params;
        const { hotelId } = req.query;
        const user = await User.findById(req.user.id);

        if (!user || user.vaiTro !== "chuKhachSan") {
            return res.status(403).json({
                success: false,
                message: "Không có quyền truy cập!"
            });
        }

        // ✅ Lấy danh sách khách sạn của user TRƯỚC
        const hotels = await Hotel.find({ maChuKhachSan: user._id });
        const hotelIds = hotels.map(h => h._id);

        // Lấy thông tin khách hàng (có thể là khách lẻ)
        const customer = await User.findById(customerId);
        
        // ✅ Handle walk-in guests who don't have user records
        let customerInfo;
        if (!customer) {
            // This is likely a walk-in guest - get info from first booking
            const sampleBooking = await Booking.findOne({ 
                maNguoiDung: customerId,
                maKhachSan: { $in: hotelIds }
            });
            
            if (!sampleBooking) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy thông tin khách hàng!"
                });
            }
            
            customerInfo = {
                _id: customerId,
                tenNguoiDung: "Khách lẻ",
                email: "Không có email",
                soDienThoai: sampleBooking.soDienThoai || "Không có SĐT",
                ngayTao: sampleBooking.thoiGianTaoDon,
                isWalkInGuest: true
            };
        } else {
            customerInfo = {
                _id: customer._id,
                tenNguoiDung: customer.tenNguoiDung,
                email: customer.email,
                soDienThoai: customer.soDienThoai,
                ngayTao: customer.ngayTao,
                isWalkInGuest: false
            };
        }

        let query = {
            maNguoiDung: new mongoose.Types.ObjectId(customerId), // ✅ Convert to ObjectId
            maKhachSan: { $in: hotelIds }
        };

        if (hotelId && hotelIds.map(id => id.toString()).includes(hotelId)) {
            query.maKhachSan = new mongoose.Types.ObjectId(hotelId); // ✅ Convert to ObjectId
        }

        // Lấy tất cả booking của khách hàng
        const bookings = await Booking.find(query)
            .populate("maKhachSan", "tenKhachSan")
            .populate("maLoaiPhong", "tenLoaiPhong")
            .sort({ thoiGianTaoDon: -1 });

        // Lấy chi tiết room assignments và services
        const bookingIds = bookings.map(b => b._id);
        const assignments = await RoomAssignment.find({
            maDatPhong: { $in: bookingIds }
        }).populate("maPhong", "soPhong tang");

        // Group assignments by booking
        const assignmentsByBooking = new Map();
        for (const assignment of assignments) {
            const bookingId = assignment.maDatPhong.toString();
            if (!assignmentsByBooking.has(bookingId)) {
                assignmentsByBooking.set(bookingId, []);
            }
            assignmentsByBooking.get(bookingId).push(assignment);
        }

        // Format booking data with room and service details
        const detailedBookings = bookings.map(booking => ({
            bookingId: booking._id,
            hotelName: booking.maKhachSan?.tenKhachSan || "N/A",
            roomType: booking.maLoaiPhong?.tenLoaiPhong || "N/A",
            checkInDate: moment(booking.ngayNhanPhong).format("DD-MM-YYYY"),
            checkOutDate: moment(booking.ngayTraPhong).format("DD-MM-YYYY"),
            bookingType: booking.loaiDatPhong,
            status: booking.trangThai,
            totalAmount: booking.thongTinGia.tongDonDat,
            discount: booking.thongTinGia.giamGia || 0,
            surcharge: booking.thongTinGia.phuPhiCuoiTuan || 0,
            createdAt: booking.thoiGianTaoDon,
            rooms: (assignmentsByBooking.get(booking._id.toString()) || []).map(assignment => ({
                roomNumber: assignment.maPhong?.soPhong || "N/A",
                floor: assignment.maPhong?.tang || 1,
                services: assignment.dichVuSuDung || [],
                serviceTotal: (assignment.dichVuSuDung || []).reduce((total, service) =>
                    total + (service.thanhTien || 0), 0
                ),
                guestInfo: assignment.thongTinKhachPhong
            }))
        }));

        // Tính thống kê tổng quan
        const totalStats = {
            totalBookings: bookings.length,
            totalSpent: bookings.reduce((sum, b) => sum + (b.thongTinGia?.tongDonDat || 0), 0),
            totalDiscount: bookings.reduce((sum, b) => sum + (b.thongTinGia?.giamGia || 0), 0),
            totalSurcharge: bookings.reduce((sum, b) => sum + (b.thongTinGia?.phuPhiCuoiTuan || 0), 0),
            completedBookings: bookings.filter(b => b.trangThai === "da_tra_phong").length,
            cancelledBookings: bookings.filter(b => b.trangThai === "da_huy").length,
            totalServiceSpent: assignments.reduce((sum, a) =>
                sum + (a.dichVuSuDung || []).reduce((serviceSum, s) =>
                    serviceSum + (s.thanhTien || 0), 0
                ), 0
            )
        };

        return res.status(200).json({
            success: true,
            message: "Lấy chi tiết khách hàng thành công",
            data: {
                customer: {
                    customerId: customerInfo._id,
                    customerName: customerInfo.tenNguoiDung,
                    email: customerInfo.email,
                    phoneNumber: customerInfo.soDienThoai,
                    memberSince: moment(customerInfo.ngayTao).format("DD-MM-YYYY"),
                    isWalkInGuest: customerInfo.isWalkInGuest,
                    ...totalStats
                },
                bookings: detailedBookings
            }
        });

    } catch (error) {
        console.error("Lỗi lấy chi tiết khách hàng:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server khi lấy chi tiết khách hàng.",
            error: error.message
        });
    }
});

// ✅ 3. Tìm kiếm khách hàng - Fixed
statisticHotelRouter.get("/hotelowner/customers/search/:query", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { query } = req.params;
        const { hotelId } = req.query;
        const user = await User.findById(req.user.id);

        if (!user || user.vaiTro !== "chuKhachSan") {
            return res.status(403).json({
                success: false,
                message: "Không có quyền truy cập!"
            });
        }

        const hotels = await Hotel.find({ maChuKhachSan: user._id });
        const hotelIds = hotels.map(h => h._id);

        let bookingQuery = { 
            maKhachSan: { $in: hotelIds },
            maNguoiDung: { $exists: true, $ne: null } // ✅ Ensure user exists
        };
        
        if (hotelId && hotelIds.map(id => id.toString()).includes(hotelId)) {
            bookingQuery.maKhachSan = new mongoose.Types.ObjectId(hotelId); // ✅ Convert to ObjectId
        }

        // Search pipeline
        const pipeline = [
            { $match: bookingQuery },
            {
                $lookup: {
                    from: User.collection.name, // ✅ Use actual collection name
                    localField: "maNguoiDung",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            {
                $addFields: {
                    customer: {
                        $cond: {
                            if: { $gt: [{ $size: "$customer" }, 0] },
                            then: { $arrayElemAt: ["$customer", 0] },
                            else: {
                                _id: "$maNguoiDung",
                                tenNguoiDung: "Khách lẻ",
                                email: "",
                                soDienThoai: "$soDienThoai" // Get phone from booking if available
                            }
                        }
                    }
                }
            },
            {
                $match: {
                    $or: [
                        { "customer.tenNguoiDung": { $regex: query, $options: "i" } },
                        { "customer.email": { $regex: query, $options: "i" } },
                        { "customer.soDienThoai": { $regex: query, $options: "i" } }
                    ]
                }
            },
            {
                $group: {
                    _id: "$customer._id",
                    customerName: { $first: "$customer.tenNguoiDung" },
                    email: { $first: "$customer.email" },
                    phoneNumber: { $first: "$customer.soDienThoai" },
                    totalBookings: { $sum: 1 },
                    totalAmount: { $sum: "$thongTinGia.tongDonDat" }
                }
            },
            { $limit: 10 }
        ];

        const results = await Booking.aggregate(pipeline);

        return res.status(200).json({
            success: true,
            message: "Tìm kiếm khách hàng thành công",
            data: {
                results
            }
        });

    } catch (error) {
        console.error("Lỗi tìm kiếm khách hàng:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server khi tìm kiếm khách hàng.",
            error: error.message
        });
    }
});

// ============================================
// REVIEWS STATISTICS ROUTES
// ============================================

// 4. Lấy danh sách đánh giá
statisticHotelRouter.get("/hotelowner/reviews", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { hotelId, page = 1, limit = 20, stars } = req.query;
        const user = await User.findById(req.user.id);

        if (!user || user.vaiTro !== "chuKhachSan") {
            return res.status(403).json({
                success: false,
                message: "Không có quyền truy cập!"
            });
        }

        // Helper function to safely convert to ObjectId
        const toObjectId = (id) => {
            try {
                return new mongoose.Types.ObjectId(id);
            } catch (e) {
                return null;
            }
        };

        // Lấy danh sách khách sạn của chủ
        const hotels = await Hotel.find({ maChuKhachSan: user._id });
        const hotelIds = hotels.map(h => h._id);

        // Tạo query để lấy các booking thuộc khách sạn của chủ
        let bookingMatch = { maKhachSan: { $in: hotelIds } };
        
        if (hotelId) {
            const hotelObjectId = toObjectId(hotelId);
            if (hotelObjectId && hotelIds.some(id => id.equals(hotelObjectId))) {
                bookingMatch.maKhachSan = hotelObjectId;
            }
        }

        // Lấy danh sách các booking ID phù hợp
        const bookingIds = await Booking.find(bookingMatch).distinct('_id');

        // Tạo query đánh giá
        let reviewQuery = { maDatPhong: { $in: bookingIds } };

        // Thêm điều kiện số sao nếu có
        if (stars) {
            const starNumber = parseInt(stars);
            if (!isNaN(starNumber) && starNumber >= 1 && starNumber <= 5) {
                reviewQuery.soSao = starNumber;
            }
        }

        // Lấy danh sách đánh giá với populate
        const reviews = await Review.find(reviewQuery)
            .populate({
                path: 'maDatPhong',
                populate: [
                    {
                        path: 'maNguoiDung',
                        select: 'tenNguoiDung email',
                        model: 'nguoiDung'
                    },
                    {
                        path: 'maKhachSan',
                        select: 'tenKhachSan',
                        model: 'khachSan'
                    }
                ]
            })
            .sort({ ngayDanhGia: -1 })
            .skip((page - 1) * parseInt(limit))
            .limit(parseInt(limit));

        // Đếm tổng số đánh giá phù hợp
        const totalReviews = await Review.countDocuments(reviewQuery);

        // Format dữ liệu trả về
        const formattedReviews = reviews.map(review => ({
            reviewId: review._id,
            stars: review.soSao,
            comment: review.binhLuan,
            reviewDate: review.ngayDanhGia,
            customer: {
                name: review.maDatPhong?.maNguoiDung?.tenNguoiDung || "Khách ẩn danh",
                email: review.maDatPhong?.maNguoiDung?.email || ""
            },
            booking: {
                bookingId: review.maDatPhong?._id,
                checkInDate: review.maDatPhong?.ngayNhanPhong,
                checkOutDate: review.maDatPhong?.ngayTraPhong,
                totalAmount: review.maDatPhong?.thongTinGia?.tongDonDat
            },
            hotel: {
                name: review.maDatPhong?.maKhachSan?.tenKhachSan
            }
        }));

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách đánh giá thành công",
            data: {
                reviews: formattedReviews,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalReviews / limit),
                    totalReviews: totalReviews,
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error("Lỗi lấy danh sách đánh giá:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server khi lấy danh sách đánh giá.",
            error: error.message
        });
    }
});

// 5. Thống kê đánh giá theo sao
statisticHotelRouter.get("/hotelowner/reviews/stats", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { hotelId } = req.query;
        const user = await User.findById(req.user.id);

        if (!user || !["chuKhachSan", "nhanVien"].includes(user.vaiTro)) {
            return res.status(403).json({
                success: false,
                message: "Không có quyền truy cập!"
            });
        }

        // Lấy danh sách khách sạn của chủ/nhân viên
        const hotels = await Hotel.find({ 
            maChuKhachSan: user.vaiTro === "chuKhachSan" ? user._id : user.maChuKhachSan 
        });
        
        const hotelIds = hotels.map(h => h._id);
        if (hotelIds.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    stats: [1,2,3,4,5].map(star => ({ stars: star, count: 0, percentage: 0 })),
                    summary: { totalReviews: 0, averageRating: 0 }
                }
            });
        }

        // Tạo query cho booking
        let bookingMatch = { maKhachSan: { $in: hotelIds } };
        if (hotelId && hotelIds.some(id => id.equals(hotelId))) {
            bookingMatch.maKhachSan = hotelId;
        }

        // Lấy danh sách booking ID phù hợp
        const bookingIds = await Booking.find(bookingMatch).distinct('_id');

        // Pipeline thống kê
        const pipeline = [
            { 
                $match: { 
                    maDatPhong: { $in: bookingIds } 
                } 
            },
            {
                $group: {
                    _id: "$soSao",
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ];

        const stats = await Review.aggregate(pipeline);
        const totalReviews = stats.reduce((sum, stat) => sum + stat.count, 0);

        // Tạo dữ liệu thống kê đầy đủ 1-5 sao
        const completeStats = [1, 2, 3, 4, 5].map(star => {
            const stat = stats.find(s => s._id === star);
            return {
                stars: star,
                count: stat ? stat.count : 0,
                percentage: totalReviews > 0 ? Math.round((stat ? stat.count : 0) / totalReviews * 100) : 0
            };
        });

        // Tính điểm trung bình
        const totalPoints = completeStats.reduce((sum, stat) => sum + (stat.stars * stat.count), 0);
        const averageRating = totalReviews > 0 ? (totalPoints / totalReviews).toFixed(1) : 0;

        return res.status(200).json({
            success: true,
            data: {
                stats: completeStats,
                summary: {
                    totalReviews,
                    averageRating: parseFloat(averageRating)
                }
            }
        });

    } catch (error) {
        console.error("Lỗi thống kê đánh giá:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server khi thống kê đánh giá.",
            error: error.message
        });
    }
});

// 6. Lọc đánh giá theo số sao
statisticHotelRouter.get("/hotelowner/reviews/filter/:stars", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { stars } = req.params;
        const { hotelId } = req.query;

        // Gọi lại hàm getReviews với filter stars
        req.query.stars = stars;
        // Redirect to reviews endpoint
        return res.redirect(307, `/api/statistic-hotel/hotelowner/reviews?stars=${stars}&hotelId=${hotelId || ''}`);

    } catch (error) {
        console.error("Lỗi lọc đánh giá theo sao:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server khi lọc đánh giá.",
            error: error.message
        });
    }
});

// ============================================
// REVENUE STATISTICS ROUTES
// ============================================

// 7. Tổng quan doanh thu
statisticHotelRouter.get("/hotelowner/revenue/overview", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { hotelId } = req.query;
        const user = await User.findById(req.user.id);

        if (!user || user.vaiTro !== "chuKhachSan") {
            return res.status(403).json({
                success: false,
                message: "Không có quyền truy cập!"
            });
        }

        const hotels = await Hotel.find({ maChuKhachSan: user._id });
        const hotelIds = hotels.map(h => h._id);

        let query = { maKhachSan: { $in: hotelIds } };
        if (hotelId && hotelIds.map(id => id.toString()).includes(hotelId)) {
            query.maKhachSan = new mongoose.Types.ObjectId(hotelId);
        }

        console.log('🔍 Revenue Query:', query);

        // ✅ Debug: Check all bookings
        const allBookings = await Booking.find(query);
        console.log('📊 Total bookings found:', allBookings.length);

        // ✅ Debug: Check status distribution
        const statusStats = await Booking.aggregate([
            { $match: query },
            { $group: { _id: "$trangThai", count: { $sum: 1 } } }
        ]);
        console.log('📈 Status distribution:', statusStats);

        // Pipeline tổng quan doanh thu
        const pipeline = [
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalBookings: { $sum: 1 },
                    completedBookings: {
                        $sum: { $cond: [{ $eq: ["$trangThai", "da_tra_phong"] }, 1, 0] }
                    },
                    cancelledBookings: {
                        $sum: { $cond: [{ $eq: ["$trangThai", "da_huy"] }, 1, 0] }
                    },
                    // ✅ Tính revenue từ TẤT CẢ booking (không chỉ completed)
                    totalRevenueAll: { $sum: "$thongTinGia.tongDonDat" },
                    totalRevenue: {
                        $sum: {
                            $cond: [
                                { $eq: ["$trangThai", "da_tra_phong"] },
                                "$thongTinGia.tongDonDat",
                                0
                            ]
                        }
                    },
                    // ✅ Potential revenue (từ booking chưa hoàn thành)
                    potentialRevenue: {
                        $sum: {
                            $cond: [
                                { $ne: ["$trangThai", "da_huy"] },
                                "$thongTinGia.tongDonDat",
                                0
                            ]
                        }
                    },
                    totalDiscount: { $sum: "$thongTinGia.giamGia" },
                    totalSurcharge: { $sum: "$thongTinGia.phuPhiCuoiTuan" },
                    roomRevenue: {
                        $sum: {
                            $cond: [
                                { $eq: ["$trangThai", "da_tra_phong"] },
                                "$thongTinGia.tongTienPhong",
                                0
                            ]
                        }
                    }
                }
            }
        ];

        const [overview] = await Booking.aggregate(pipeline);

        // Lấy doanh thu dịch vụ từ room assignments
        const serviceRevenue = await RoomAssignment.aggregate([
            {
                $lookup: {
                    from: "dondatphongs",
                    localField: "maDatPhong",
                    foreignField: "_id",
                    as: "booking"
                }
            },
            { $unwind: "$booking" },
            { $match: { ...query, "booking.trangThai": "da_tra_phong" } },
            { $unwind: { path: "$dichVuSuDung", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: null,
                    totalServiceRevenue: { $sum: "$dichVuSuDung.thanhTien" }
                }
            }
        ]);

        const result = {
            totalBookings: overview?.totalBookings || 0,
            completedBookings: overview?.completedBookings || 0,
            cancelledBookings: overview?.cancelledBookings || 0,
            pendingBookings: (overview?.totalBookings || 0) - (overview?.completedBookings || 0) - (overview?.cancelledBookings || 0),
            
            // ✅ Hiển thị cả actual và potential revenue
            totalRevenue: overview?.totalRevenue || 0,
            totalRevenueAll: overview?.totalRevenueAll || 0, // Tổng từ tất cả booking
            potentialRevenue: overview?.potentialRevenue || 0, // Revenue tiềm năng
            
            roomRevenue: overview?.roomRevenue || 0,
            serviceRevenue: serviceRevenue[0]?.totalServiceRevenue || 0,
            totalDiscount: overview?.totalDiscount || 0,
            totalSurcharge: overview?.totalSurcharge || 0,
            cancellationRate: overview?.totalBookings > 0 ?
                Math.round((overview.cancelledBookings / overview.totalBookings) * 100) : 0,
            completionRate: overview?.totalBookings > 0 ?
                Math.round((overview.completedBookings / overview.totalBookings) * 100) : 0
        };

        console.log('💰 Revenue result:', result);

        return res.status(200).json({
            success: true,
            message: "Lấy tổng quan doanh thu thành công",
            data: {
                overview: result
            }
        });

    } catch (error) {
        console.error("Lỗi tổng quan doanh thu:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server khi lấy tổng quan doanh thu.",
            error: error.message
        });
    }
});

// 8. Doanh thu theo ngày
statisticHotelRouter.get("/hotelowner/revenue/daily", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { hotelId, startDate, endDate } = req.query;
        const user = await User.findById(req.user.id);

        if (!user || user.vaiTro !== "chuKhachSan") {
            return res.status(403).json({
                success: false,
                message: "Không có quyền truy cập!"
            });
        }

        const hotels = await Hotel.find({ maChuKhachSan: user._id });
        const hotelIds = hotels.map(h => h._id);

        let query = {
            maKhachSan: { $in: hotelIds },
            trangThai: "da_tra_phong"
        };

        if (hotelId && hotelIds.map(id => id.toString()).includes(hotelId)) {
            query.maKhachSan = hotelId;
        }

        // Date range filter
        if (startDate || endDate) {
            query.thoiGianTaoDon = {};
            if (startDate) query.thoiGianTaoDon.$gte = new Date(startDate);
            if (endDate) query.thoiGianTaoDon.$lte = new Date(endDate);
        }

        const pipeline = [
            { $match: query },
            {
                $group: {
                    _id: {
                        year: { $year: "$thoiGianTaoDon" },
                        month: { $month: "$thoiGianTaoDon" },
                        day: { $dayOfMonth: "$thoiGianTaoDon" }
                    },
                    date: { $first: { $dateToString: { format: "%Y-%m-%d", date: "$thoiGianTaoDon" } } },
                    totalRevenue: { $sum: "$thongTinGia.tongDonDat" },
                    totalBookings: { $sum: 1 },
                    totalDiscount: { $sum: "$thongTinGia.giamGia" },
                    totalSurcharge: { $sum: "$thongTinGia.phuPhiCuoiTuan" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ];

        const dailyRevenue = await Booking.aggregate(pipeline);

        return res.status(200).json({
            success: true,
            message: "Lấy doanh thu theo ngày thành công",
            data: {
                dailyRevenue
            }
        });

    } catch (error) {
        console.error("Lỗi doanh thu theo ngày:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server khi lấy doanh thu theo ngày.",
            error: error.message
        });
    }
});

// 9. Doanh thu theo tháng
statisticHotelRouter.get("/hotelowner/revenue/monthly", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { hotelId, year = new Date().getFullYear() } = req.query;
        const user = await User.findById(req.user.id);

        if (!user || user.vaiTro !== "chuKhachSan") {
            return res.status(403).json({
                success: false,
                message: "Không có quyền truy cập!"
            });
        }

        const hotels = await Hotel.find({ maChuKhachSan: user._id });
        const hotelIds = hotels.map(h => h._id);

        let query = {
            maKhachSan: { $in: hotelIds },
            trangThai: "da_tra_phong",
            thoiGianTaoDon: {
                $gte: new Date(`${year}-01-01`),
                $lt: new Date(`${parseInt(year) + 1}-01-01`)
            }
        };

        if (hotelId && hotelIds.map(id => id.toString()).includes(hotelId)) {
            query.maKhachSan = hotelId;
        }

        const pipeline = [
            { $match: query },
            {
                $group: {
                    _id: { $month: "$thoiGianTaoDon" },
                    month: { $first: { $month: "$thoiGianTaoDon" } },
                    totalRevenue: { $sum: "$thongTinGia.tongDonDat" },
                    totalBookings: { $sum: 1 },
                    totalDiscount: { $sum: "$thongTinGia.giamGia" },
                    totalSurcharge: { $sum: "$thongTinGia.phuPhiCuoiTuan" },
                    avgBookingValue: { $avg: "$thongTinGia.tongDonDat" }
                }
            },
            { $sort: { "_id": 1 } }
        ];

        const monthlyData = await Booking.aggregate(pipeline);

        // Đảm bảo có đủ 12 tháng
        const monthNames = [
            "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
            "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
        ];

        const completeData = monthNames.map((name, index) => {
            const monthData = monthlyData.find(d => d._id === index + 1);
            return {
                month: index + 1,
                monthName: name,
                totalRevenue: monthData?.totalRevenue || 0,
                totalBookings: monthData?.totalBookings || 0,
                totalDiscount: monthData?.totalDiscount || 0,
                totalSurcharge: monthData?.totalSurcharge || 0,
                avgBookingValue: monthData?.avgBookingValue || 0
            };
        });

        return res.status(200).json({
            success: true,
            message: "Lấy doanh thu theo tháng thành công",
            data: {
                year: parseInt(year),
                monthlyRevenue: completeData
            }
        });

    } catch (error) {
        console.error("Lỗi doanh thu theo tháng:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server khi lấy doanh thu theo tháng.",
            error: error.message
        });
    }
});

// 10. Doanh thu theo năm
statisticHotelRouter.get("/hotelowner/revenue/yearly", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { hotelId } = req.query;
        const user = await User.findById(req.user.id);

        if (!user || user.vaiTro !== "chuKhachSan") {
            return res.status(403).json({
                success: false,
                message: "Không có quyền truy cập!"
            });
        }

        const hotels = await Hotel.find({ maChuKhachSan: user._id });
        const hotelIds = hotels.map(h => h._id);

        let query = {
            maKhachSan: { $in: hotelIds },
            trangThai: "da_tra_phong"
        };

        if (hotelId && hotelIds.map(id => id.toString()).includes(hotelId)) {
            query.maKhachSan = hotelId;
        }

        const pipeline = [
            { $match: query },
            {
                $group: {
                    _id: { $year: "$thoiGianTaoDon" },
                    year: { $first: { $year: "$thoiGianTaoDon" } },
                    totalRevenue: { $sum: "$thongTinGia.tongDonDat" },
                    totalBookings: { $sum: 1 },
                    totalDiscount: { $sum: "$thongTinGia.giamGia" },
                    totalSurcharge: { $sum: "$thongTinGia.phuPhiCuoiTuan" },
                    avgBookingValue: { $avg: "$thongTinGia.tongDonDat" }
                }
            },
            { $sort: { "_id": -1 } },
            { $limit: 5 } // Lấy 5 năm gần nhất
        ];

        const yearlyRevenue = await Booking.aggregate(pipeline);

        return res.status(200).json({
            success: true,
            message: "Lấy doanh thu theo năm thành công",
            data: {
                yearlyRevenue
            }
        });

    } catch (error) {
        console.error("Lỗi doanh thu theo năm:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server khi lấy doanh thu theo năm.",
            error: error.message
        });
    }
});

// 11. Thống kê đơn hàng
statisticHotelRouter.get("/hotelowner/revenue/orders", authorizeRoles("chuKhachSan", "nhanVien"), async (req, res) => {
    try {
        const { hotelId, period = "month" } = req.query; // period: day, week, month, year
        const user = await User.findById(req.user.id);

        if (!user || user.vaiTro !== "chuKhachSan") {
            return res.status(403).json({
                success: false,
                message: "Không có quyền truy cập!"
            });
        }

        const hotels = await Hotel.find({ maChuKhachSan: user._id });
        const hotelIds = hotels.map(h => h._id);

        let query = { maKhachSan: { $in: hotelIds } };
        if (hotelId && hotelIds.map(id => id.toString()).includes(hotelId)) {
            query.maKhachSan = hotelId;
        }

        // Thống kê tổng quan
        const overallStats = await Booking.aggregate([
            { $match: query },
            {
                $group: {
                    _id: "$trangThai",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$thongTinGia.tongDonDat" }
                }
            }
        ]);

        // Thống kê lý do hủy
        const cancelReasons = await Booking.aggregate([
            {
                $match: {
                    ...query,
                    trangThai: "da_huy",
                    ghiChu: { $exists: true, $ne: "" }
                }
            },
            {
                $group: {
                    _id: "$ghiChu",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Thống kê theo loại đặt phòng
        const bookingTypeStats = await Booking.aggregate([
            { $match: query },
            {
                $group: {
                    _id: "$loaiDatPhong",
                    totalBookings: { $sum: 1 },
                    completedBookings: {
                        $sum: { $cond: [{ $eq: ["$trangThai", "da_tra_phong"] }, 1, 0] }
                    },
                    cancelledBookings: {
                        $sum: { $cond: [{ $eq: ["$trangThai", "da_huy"] }, 1, 0] }
                    },
                    totalRevenue: {
                        $sum: {
                            $cond: [
                                { $eq: ["$trangThai", "da_tra_phong"] },
                                "$thongTinGia.tongDonDat",
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            message: "Lấy thống kê đơn hàng thành công",
            data: {
                overallStats,
                cancelReasons,
                bookingTypeStats
            }
        });

    } catch (error) {
        console.error("Lỗi thống kê đơn hàng:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server khi thống kê đơn hàng.",
            error: error.message
        });
    }
});

module.exports = statisticHotelRouter;