const express = require("express");
const mongoose = require("mongoose");
const Hotel = require("../../Model/Hotel/Hotel");
const User = require("../../Model/User/User");
const Booking = require("../../Model/Booking/Booking");
const authorizeRoles = require('../../middleware/roleAuth');
const hotelManagementRouter = express.Router();

const ObjectId = mongoose.Types.ObjectId;
// GET: Lấy danh sách tất cả khách sạn với thông tin chi tiết
hotelManagementRouter.get("/admin/hotels", authorizeRoles("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, sortBy = 'tenKhachSan', sortOrder = 'asc' } = req.query;

    console.log('🏨 [HOTEL LIST] Request params:', { page, limit, search, status, sortBy, sortOrder });

    let query = {};

    // Search and filter logic...
    if (search) {
      const users = await User.find({
        $or: [
          { tenNguoiDung: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      }).select("_id");

      const userIds = users.map(user => user._id);

      query.$or = [
        { tenKhachSan: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { maChuKhachSan: { $in: userIds } }
      ];
    }

    if (status) {
      const statusUsers = await User.find({
        vaiTro: "chuKhachSan",
        trangThaiTaiKhoan: status
      }).select("_id");

      const statusUserIds = statusUsers.map(user => user._id);
      query.maChuKhachSan = { $in: statusUserIds };
    }

    const skip = (page - 1) * limit;
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // SIMPLE HOTEL AGGREGATION
    const hotels = await Hotel.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "nguoidungs",
          localField: "maChuKhachSan",
          foreignField: "_id",
          as: "chuKhachSan"
        }
      },
      {
        $lookup: {
          from: "dondatphongs",
          localField: "_id",
          foreignField: "maKhachSan",
          as: "allBookings"
        }
      },
      {
        $addFields: {
          chuKhachSan: { $arrayElemAt: ["$chuKhachSan", 0] },
          soLuongDonDat: { $size: "$allBookings" },
          paidBookings: {
            $filter: {
              input: "$allBookings",
              cond: {
                $and: [
                  { $in: ["$$this.trangThai", ["da_tra_phong", "dang_su_dung"]] },
                  { $eq: ["$$this.trangThaiThanhToan", "da_thanh_toan"] }
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          soLuongDonThanhToan: { $size: "$paidBookings" },
          tongDoanhThu: { $sum: "$paidBookings.thongTinGia.tongDonDat" },
          doanhThuThang: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$paidBookings",
                    cond: {
                      $gte: [
                        "$$this.thoiGianTaoDon",
                        new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                      ]
                    }
                  }
                },
                as: "booking",
                in: "$$booking.thongTinGia.tongDonDat"
              }
            }
          },
          // Debug field
          debugBookings: {
            $slice: [
              {
                $map: {
                  input: "$allBookings",
                  as: "booking",
                  in: {
                    id: "$$booking._id",
                    trangThai: "$$booking.trangThai",
                    trangThaiThanhToan: "$$booking.trangThaiThanhToan",
                    tongDonDat: "$$booking.thongTinGia.tongDonDat"
                  }
                }
              },
              3
            ]
          }
        }
      },
      {
        $project: {
          tenKhachSan: 1,
          diaChi: 1,
          hinhAnh: 1,
          soSao: 1,
          soDienThoai: 1,
          email: 1,
          loaiKhachSan: 1,
          trangThai: 1,
          tongDoanhThu: 1,
          doanhThuThang: 1,
          soLuongDonDat: 1,
          soLuongDonThanhToan: 1,
          "chuKhachSan._id": 1,
          "chuKhachSan.tenNguoiDung": 1,
          "chuKhachSan.email": 1,
          "chuKhachSan.trangThaiTaiKhoan": 1,
          // Debug
          debugBookings: 1
        }
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    console.log('✅ [HOTEL LIST] Simple aggregation completed. Result count:', hotels.length);

    if (hotels.length > 0) {
      const firstHotel = hotels[0];
      console.log('🏨 [HOTEL LIST] First hotel (SIMPLE):', {
        tenKhachSan: firstHotel.tenKhachSan,
        tongDoanhThu: firstHotel.tongDoanhThu,
        soLuongDonDat: firstHotel.soLuongDonDat,
        debugBookings: firstHotel.debugBookings
      });
    }

    const hotelsWithBookings = hotels.filter(h => h.soLuongDonDat > 0);
    console.log('📊 [HOTEL LIST] Hotels with bookings:', hotelsWithBookings.length);

    const total = await Hotel.countDocuments(query);

    res.json({
      success: true,
      data: hotels,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: hotels.length,
        totalRecords: total
      },
      debug: {
        hotelsWithBookings: hotelsWithBookings.length,
        aggregationSuccess: true
      }
    });

  } catch (error) {
    console.error('❌ [HOTEL LIST] Error:', error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách khách sạn",
      error: error.message
    });
  }
});

// GET: Lấy chi tiết khách sạn theo ID
hotelManagementRouter.get("/admin/hotels/:id", authorizeRoles("admin"), async (req, res) => {
  try {
    const hotelId = req.params.id;
    console.log('🔍 [HOTEL DETAIL] Getting hotel detail for ID:', hotelId);

    const hotel = await Hotel.findById(hotelId)
      .populate({
        path: "maChuKhachSan",
        select: "tenNguoiDung email soDienThoai cccd trangThaiTaiKhoan ngayTao"
      });

    if (!hotel) {
      console.log('❌ [HOTEL DETAIL] Hotel not found:', hotelId);
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khách sạn"
      });
    }

    console.log('🏨 [HOTEL DETAIL] Found hotel:', {
      tenKhachSan: hotel.tenKhachSan,
      chuKhachSan: hotel.maChuKhachSan?.tenNguoiDung
    });

    // Kiểm tra tất cả bookings của hotel
    const allHotelBookings = await Booking.find({ maKhachSan: hotelId });
    console.log('📚 [HOTEL DETAIL] All hotel bookings count:', allHotelBookings.length);

    if (allHotelBookings.length > 0) {
      console.log('📋 [HOTEL DETAIL] Sample booking structure:', {
        trangThai: allHotelBookings[0].trangThai,
        trangThaiThanhToan: allHotelBookings[0].trangThaiThanhToan,
        thongTinGia: allHotelBookings[0].thongTinGia,
        tongDonDat: allHotelBookings[0].thongTinGia?.tongDonDat
      });

      // Thống kê manual
      const paidBookings = allHotelBookings.filter(b =>
        b.trangThaiThanhToan === "da_thanh_toan" &&
        ["da_tra_phong", "dang_su_dung"].includes(b.trangThai)
      );
      const allPaidBookings = allHotelBookings.filter(b => b.trangThaiThanhToan === "da_thanh_toan");

      const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.thongTinGia?.tongDonDat || 0), 0);
      const allPaidRevenue = allPaidBookings.reduce((sum, b) => sum + (b.thongTinGia?.tongDonDat || 0), 0);

      console.log('🧮 [HOTEL DETAIL] Manual stats:', {
        totalBookings: allHotelBookings.length,
        paidCompletedBookings: paidBookings.length,
        allPaidBookings: allPaidBookings.length,
        totalRevenue: totalRevenue,
        allPaidRevenue: allPaidRevenue
      });
    }

    // Tính toán doanh thu chi tiết
    const revenueStats = await Booking.aggregate([
      {
        $match: {
          maKhachSan: new mongoose.Types.ObjectId(hotelId),
          trangThaiThanhToan: "da_thanh_toan",
          trangThai: { $in: ["da_tra_phong", "dang_su_dung"] }
        }
      },
      {
        $group: {
          _id: null,
          tongDoanhThu: { $sum: "$thongTinGia.tongDonDat" },
          soLuongDonDat: { $sum: 1 },
          doanhThuTrungBinh: { $avg: "$thongTinGia.tongDonDat" }
        }
      }
    ]);

    console.log('💰 [HOTEL DETAIL] Revenue stats aggregation:', revenueStats);

    // Doanh thu theo tháng (6 tháng gần nhất)
    const monthlyRevenue = await Booking.aggregate([
      { 
        $match: {
          maKhachSan: new mongoose.Types.ObjectId(hotelId),
          trangThaiThanhToan: "da_thanh_toan",
          trangThai: { $in: ["da_tra_phong", "dang_su_dung"] },
          thoiGianTaoDon: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$thoiGianTaoDon" },
            month: { $month: "$thoiGianTaoDon" }
          },
          doanhThu: { $sum: "$thongTinGia.tongDonDat" },
          soDon: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    console.log('📊 [HOTEL DETAIL] Monthly revenue:', monthlyRevenue);

    const stats = revenueStats[0] || {
      tongDoanhThu: 0,
      soLuongDonDat: 0,
      doanhThuTrungBinh: 0
    };

    // Tính toán stats để trả về (manual calculation for verification)
    const calculatedStats = {
      tongDoanhThu: allHotelBookings
        .filter(b => b.trangThaiThanhToan === "da_thanh_toan" && ["da_tra_phong", "dang_su_dung"].includes(b.trangThai))
        .reduce((sum, b) => sum + (b.thongTinGia?.tongDonDat || 0), 0),
      soLuongDonDat: allHotelBookings.length,
      doanhThuThang: allHotelBookings
        .filter(b => {
          const bookingDate = new Date(b.thoiGianTaoDon);
          const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
          return bookingDate >= thisMonth &&
            b.trangThaiThanhToan === "da_thanh_toan" &&
            ["da_tra_phong", "dang_su_dung"].includes(b.trangThai);
        })
        .reduce((sum, b) => sum + (b.thongTinGia?.tongDonDat || 0), 0)
    };

    console.log('📤 [HOTEL DETAIL] Returning calculated stats:', calculatedStats);

    res.json({
      success: true,
      data: {
        ...hotel.toObject(),
        ...calculatedStats,
        thongKe: {
          ...stats,
          doanhThuTheoThang: monthlyRevenue
        }
      },
      debug: {
        allBookingsCount: allHotelBookings.length,
        revenueStats: revenueStats[0] || {},
        calculatedStats,
        monthlyRevenueCount: monthlyRevenue.length
      }
    });

  } catch (error) {
    console.error('❌ [HOTEL DETAIL] Error:', error);
    console.error('❌ [HOTEL DETAIL] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết khách sạn",
      error: error.message
    });
  }
});

// PUT: Cập nhật trạng thái khách sạn (thông qua chủ khách sạn)
hotelManagementRouter.put("/admin/hotels/:id/toggle-status", authorizeRoles("admin"), async (req, res) => {
  try {
    const hotelId = req.params.id;
    const { reason } = req.body;

    console.log('🔄 [TOGGLE HOTEL STATUS] Request for hotel:', hotelId, 'reason:', reason);

    const hotel = await Hotel.findById(hotelId).populate("maChuKhachSan");

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khách sạn"
      });
    }

    const currentStatus = hotel.maChuKhachSan.trangThaiTaiKhoan;
    const newStatus = currentStatus === "hoatDong" ? "cam" : "hoatDong";

    console.log('📝 [TOGGLE HOTEL STATUS] Status change:', { currentStatus, newStatus });

    // Cập nhật trạng thái chủ khách sạn
    await User.findByIdAndUpdate(hotel.maChuKhachSan._id, {
      trangThaiTaiKhoan: newStatus
    });

    const actionText = newStatus === "cam" ? "cấm" : "bỏ cấm";

    console.log('✅ [TOGGLE HOTEL STATUS] Success:', actionText, 'hotel');

    res.json({
      success: true,
      message: `Đã ${actionText} khách sạn thành công`,
      data: {
        hotelId: hotel._id,
        newStatus: newStatus,
        reason: reason || ""
      }
    });

  } catch (error) {
    console.error('❌ [TOGGLE HOTEL STATUS] Error:', error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trạng thái khách sạn",
      error: error.message
    });
  }
});

// DELETE: Xóa khách sạn (soft delete)
hotelManagementRouter.delete("/admin/hotels/:id", authorizeRoles("admin"), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const hotelId = req.params.id;

    console.log('🗑️ [DELETE HOTEL] Request for hotel:', hotelId);

    const hotel = await Hotel.findById(hotelId).populate("maChuKhachSan").session(session);

    if (!hotel) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khách sạn"
      });
    }

    // Kiểm tra có đơn đặt phòng đang hoạt động không
    const activeBookings = await Booking.countDocuments({
      maKhachSan: hotel._id,
      trangThai: { $in: ["dang_cho", "da_xac_nhan", "da_nhan_phong", "dang_su_dung"] }
    }).session(session);

    console.log('📊 [DELETE HOTEL] Active bookings:', activeBookings);

    if (activeBookings > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Không thể xóa khách sạn vì còn ${activeBookings} đơn đặt phòng đang hoạt động`
      });
    }

    // Xóa khách sạn
    await Hotel.findByIdAndDelete(hotelId).session(session);

    // Cập nhật lại role của chủ khách sạn về người dùng thường
    await User.findByIdAndUpdate(hotel.maChuKhachSan._id, {
      vaiTro: "nguoiDung"
    }).session(session);

    await session.commitTransaction();

    console.log('✅ [DELETE HOTEL] Hotel deleted successfully');

    res.json({
      success: true,
      message: "Đã xóa khách sạn thành công"
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ [DELETE HOTEL] Error:', error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa khách sạn",
      error: error.message
    });
  } finally {
    session.endSession();
  }
});

// GET: Thống kê tổng quan khách sạn
hotelManagementRouter.get("/admin/hotels-stats", authorizeRoles("admin"), async (req, res) => {
  try {
    console.log('📊 [HOTEL STATS] Generating hotel statistics...');

    const totalHotels = await Hotel.countDocuments();

    const hotelsByType = await Hotel.aggregate([
      {
        $group: {
          _id: "$loaiKhachSan",
          count: { $sum: 1 }
        }
      }
    ]);

    const activeHotels = await Hotel.aggregate([
      {
        $lookup: {
          from: "nguoidungs",
          localField: "maChuKhachSan",
          foreignField: "_id",
          as: "owner"
        }
      },
      {
        $match: {
          "owner.trangThaiTaiKhoan": "hoatDong"
        }
      },
      { $count: "total" }
    ]);

    const totalRevenue = await Booking.aggregate([
      {
        $match: {
          trangThaiThanhToan: "da_thanh_toan",
          trangThai: { $in: ["da_tra_phong", "dang_su_dung"] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$thongTinGia.tongDonDat" }
        }
      }
    ]);

    console.log('📈 [HOTEL STATS] Stats generated:', {
      totalHotels,
      activeHotels: activeHotels[0]?.total || 0,
      totalRevenue: totalRevenue[0]?.total || 0
    });

    res.json({
      success: true,
      data: {
        tongSoKhachSan: totalHotels,
        khachSanHoatDong: activeHotels[0]?.total || 0,
        khachSanTheoLoai: hotelsByType,
        tongDoanhThu: totalRevenue[0]?.total || 0
      }
    });

  } catch (error) {
    console.error('❌ [HOTEL STATS] Error:', error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê khách sạn",
      error: error.message
    });
  }
});

module.exports = hotelManagementRouter;