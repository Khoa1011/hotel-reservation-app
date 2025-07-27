const express = require("express");
const mongoose = require("mongoose");
const User = require("../../Model/User/User");
const Booking = require("../../Model/Booking/Booking");
const Hotel = require("../../Model/Hotel/Hotel");
const authorizeRoles = require('../../middleware/roleAuth');
const userManagementRouter = express.Router();

const ObjectId = mongoose.Types.ObjectId;

// GET: Lấy danh sách tất cả người dùng với thông tin chi tiết
userManagementRouter.get("/admin/users", authorizeRoles("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status, sortBy = 'ngayTao', sortOrder = 'desc' } = req.query;

    console.log('🔍 [USER LIST] Request params:', { page, limit, search, role, status, sortBy, sortOrder });

    let query = {};

    // Filter logic...
    if (role && role !== 'all') {
      query.vaiTro = role;
    }
    if (status && status !== 'all') {
      query.trangThaiTaiKhoan = status;
    }
    if (search) {
      query.$or = [
        { tenNguoiDung: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { soDienThoai: { $regex: search, $options: "i" } },
        { cccd: { $regex: search, $options: "i" } }
      ];
    }

    console.log('📋 [USER LIST] MongoDB query:', JSON.stringify(query, null, 2));

    const skip = (page - 1) * limit;
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // DEEP DEBUGGING: Kiểm tra cấu trúc dữ liệu thực tế
    console.log('🔬 [DEEP DEBUG] Investigating data structure...');

    // 1. Lấy sample data từ mỗi collection
    const sampleUser = await User.findOne();
    const sampleBooking = await Booking.findOne();
    const sampleHotel = await Hotel.findOne();

    console.log('👤 [DEEP DEBUG] Sample User:', {
      _id: sampleUser?._id,
      email: sampleUser?.email,
      vaiTro: sampleUser?.vaiTro
    });

    console.log('📚 [DEEP DEBUG] Sample Booking:', {
      _id: sampleBooking?._id,
      maNguoiDung: sampleBooking?.maNguoiDung,
      maKhachSan: sampleBooking?.maKhachSan,
      trangThai: sampleBooking?.trangThai,
      trangThaiThanhToan: sampleBooking?.trangThaiThanhToan,
      tongDonDat: sampleBooking?.thongTinGia?.tongDonDat
    });

    console.log('🏨 [DEEP DEBUG] Sample Hotel:', {
      _id: sampleHotel?._id,
      tenKhachSan: sampleHotel?.tenKhachSan,
      maChuKhachSan: sampleHotel?.maChuKhachSan
    });

    // 2. Kiểm tra references có match không
    if (sampleUser && sampleBooking) {
      console.log('🔍 [DEEP DEBUG] Reference comparison:');
      console.log('User ID:', sampleUser._id.toString());
      console.log('Booking maNguoiDung:', sampleBooking.maNguoiDung ? sampleBooking.maNguoiDung.toString() : 'NULL');
      console.log('Types match:', typeof sampleUser._id === typeof sampleBooking.maNguoiDung);
      console.log('Values match:', sampleUser._id.toString() === (sampleBooking.maNguoiDung ? sampleBooking.maNguoiDung.toString() : ''));
    }

    // 3. Tìm bookings của user thực tế có bookings
    const bookingWithUser = await Booking.findOne({ maNguoiDung: { $exists: true, $ne: null } });
    if (bookingWithUser) {
      console.log('📋 [DEEP DEBUG] Found booking with user:', {
        bookingId: bookingWithUser._id,
        maNguoiDung: bookingWithUser.maNguoiDung,
        userIdType: typeof bookingWithUser.maNguoiDung
      });

      // Tìm user tương ứng
      const correspondingUser = await User.findById(bookingWithUser.maNguoiDung);
      console.log('👤 [DEEP DEBUG] Corresponding user:', {
        found: !!correspondingUser,
        email: correspondingUser?.email,
        vaiTro: correspondingUser?.vaiTro
      });

      // Test direct aggregation cho user này
      if (correspondingUser) {
        const testAggregation = await User.aggregate([
          { $match: { _id: correspondingUser._id } },
          {
            $lookup: {
              from: "dondatphongs",
              localField: "_id",
              foreignField: "maNguoiDung",
              as: "bookings"
            }
          },
          {
            $project: {
              email: 1,
              bookingCount: { $size: "$bookings" },
              bookingIds: "$bookings._id"
            }
          }
        ]);

        console.log('🧪 [DEEP DEBUG] Test aggregation result:', testAggregation[0]);
      }
    }

    // 4. Kiểm tra tất cả bookings và users có reference
    const allBookings = await Booking.find({}, 'maNguoiDung maKhachSan').limit(10);
    const allUsers = await User.find({}, '_id email').limit(5);
    
    console.log('📊 [DEEP DEBUG] All booking references (first 10):');
    allBookings.forEach((booking, index) => {
      console.log(`  ${index + 1}. Booking ${booking._id} -> User: ${booking.maNguoiDung}, Hotel: ${booking.maKhachSan}`);
    });

    console.log('👥 [DEEP DEBUG] All user IDs (first 5):');
    allUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. User ${user._id} -> ${user.email}`);
    });

    // 5. Thống kê nhanh
    const totalBookings = await Booking.countDocuments();
    const bookingsWithUser = await Booking.countDocuments({ maNguoiDung: { $exists: true, $ne: null } });
    const bookingsWithHotel = await Booking.countDocuments({ maKhachSan: { $exists: true, $ne: null } });
    
    console.log('📈 [DEEP DEBUG] Quick stats:', {
      totalBookings,
      bookingsWithUser,
      bookingsWithHotel,
      missingUserRefs: totalBookings - bookingsWithUser,
      missingHotelRefs: totalBookings - bookingsWithHotel
    });

    // SIMPLE AGGREGATION WITHOUT COMPLEX LOGIC
    const simpleAggregation = [
      { $match: query },
      {
        $lookup: {
          from: "dondatphongs",
          localField: "_id",
          foreignField: "maNguoiDung",
          as: "bookings"
        }
      },
      {
        $addFields: {
          tongSoDonDat: { $size: "$bookings" },
          donDatThanhCong: {
            $size: {
              $filter: {
                input: "$bookings",
                cond: { $in: ["$$this.trangThai", ["da_tra_phong", "dang_su_dung"]] }
              }
            }
          },
          donDatHuy: {
            $size: {
              $filter: {
                input: "$bookings",
                cond: { $eq: ["$$this.trangThai", "da_huy"] }
              }
            }
          },
          donKhongNhan: {
            $size: {
              $filter: {
                input: "$bookings",
                cond: { $eq: ["$$this.trangThai", "khong_nhan_phong"] }
              }
            }
          },
          soLanKhongNhanPhong: "$soLanKhongNhanPhong",
          tongTienDaThanhToan: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$bookings",
                    cond: { $eq: ["$$this.trangThaiThanhToan", "da_thanh_toan"] }
                  }
                },
                as: "booking",
                in: "$$booking.thongTinGia.tongDonDat"
              }
            }
          },
          // Debug: Raw booking data để xem
          debugBookings: {
            $slice: [
              {
                $map: {
                  input: "$bookings",
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
          tenNguoiDung: 1,
          email: 1,
          soDienThoai: 1,
          cccd: 1,
          vaiTro: 1,
          trangThaiTaiKhoan: 1,
          ngayTao: 1,
          tongSoDonDat: 1,
          donDatThanhCong: 1,
          donDatHuy: 1,
          donKhongNhan: 1,
          soLanKhongNhanPhong: 1,
          tongTienDaThanhToan: 1,
          ngayCamDatPhong: 1,
          lichSuKhongNhanPhong: 1,
          // Debug
          debugBookings: 1
        }
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ];

    console.log('🔧 [USER LIST] Starting SIMPLE aggregation...');

    const users = await User.aggregate(simpleAggregation);

    console.log('✅ [USER LIST] Simple aggregation completed. Result count:', users.length);

    // Log chi tiết user đầu tiên
    if (users.length > 0) {
      const firstUser = users[0];
      console.log('👤 [USER LIST] First user (SIMPLE):', {
        email: firstUser.email,
        vaiTro: firstUser.vaiTro,
        tongSoDonDat: firstUser.tongSoDonDat,
        donDatThanhCong: firstUser.donDatThanhCong,
        tongTienDaThanhToan: firstUser.tongTienDaThanhToan,
        debugBookings: firstUser.debugBookings
      });
    }

    // Tìm user có bookings
    const usersWithBookings = users.filter(u => u.tongSoDonDat > 0);
    console.log('📊 [USER LIST] Users with bookings:', usersWithBookings.length);
    
    if (usersWithBookings.length > 0) {
      console.log('🎯 [USER LIST] First user with bookings:', {
        email: usersWithBookings[0].email,
        tongSoDonDat: usersWithBookings[0].tongSoDonDat,
        debugBookings: usersWithBookings[0].debugBookings
      });
    }

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: users.length,
        totalRecords: total
      },
      debug: {
        totalBookings,
        bookingsWithUser,
        bookingsWithHotel,
        usersWithBookings: usersWithBookings.length,
        sampleUserEmail: sampleUser?.email,
        sampleBookingUser: sampleBooking?.maNguoiDung?.toString(),
        dataStructureInvestigated: true
      }
    });

  } catch (error) {
    console.error('❌ [USER LIST] Error:', error);
    console.error('❌ [USER LIST] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách người dùng",
      error: error.message
    });
  }
});


// GET: Lấy chi tiết người dùng theo ID
userManagementRouter.get("/admin/users/:id", authorizeRoles("admin"), async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('🔍 [USER DETAIL] Getting user detail for ID:', userId);

    const user = await User.findById(userId).select("-matKhau");

    if (!user) {
      console.log('❌ [USER DETAIL] User not found:', userId);
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    console.log('👤 [USER DETAIL] Found user:', { 
      email: user.email, 
      vaiTro: user.vaiTro,
      soLanKhongNhanPhong: user.soLanKhongNhanPhong 
    });

    // Kiểm tra tất cả bookings của user
    const allUserBookings = await Booking.find({ maNguoiDung: userId });
    console.log('📚 [USER DETAIL] All user bookings count:', allUserBookings.length);

    if (allUserBookings.length > 0) {
      console.log('📋 [USER DETAIL] Sample booking structure:', {
        trangThai: allUserBookings[0].trangThai,
        trangThaiThanhToan: allUserBookings[0].trangThaiThanhToan,
        thongTinGia: allUserBookings[0].thongTinGia,
        tongDonDat: allUserBookings[0].thongTinGia?.tongDonDat
      });

      // Thống kê manual
      const paidBookings = allUserBookings.filter(b => b.trangThaiThanhToan === "da_thanh_toan");
      const successfulBookings = allUserBookings.filter(b => ["da_tra_phong", "dang_su_dung"].includes(b.trangThai));
      const cancelledBookings = allUserBookings.filter(b => b.trangThai === "da_huy");
      const noShowBookings = allUserBookings.filter(b => b.trangThai === "khong_nhan_phong");
      
      const totalPaidAmount = paidBookings.reduce((sum, b) => sum + (b.thongTinGia?.tongDonDat || 0), 0);

      console.log('🧮 [USER DETAIL] Manual stats:', {
        totalBookings: allUserBookings.length,
        paidBookings: paidBookings.length,
        successfulBookings: successfulBookings.length,
        cancelledBookings: cancelledBookings.length,
        noShowBookings: noShowBookings.length,
        totalPaidAmount: totalPaidAmount
      });
    }

    // Lấy thống kê chi tiết về booking
    const bookingStats = await Booking.aggregate([
      { $match: { maNguoiDung: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$trangThai",
          count: { $sum: 1 },
          tongTien: { $sum: "$thongTinGia.tongDonDat" }
        }
      }
    ]);

    console.log('📊 [USER DETAIL] Booking stats by status:', bookingStats);

    // Tính tổng tiền đã thanh toán
    const paidBookingsStats = await Booking.aggregate([
      { 
        $match: { 
          maNguoiDung: mongoose.Types.ObjectId(userId),
          trangThaiThanhToan: "da_thanh_toan"
        } 
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$thongTinGia.tongDonDat" },
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('💰 [USER DETAIL] Paid bookings aggregation:', paidBookingsStats);

    // Lấy danh sách booking gần nhất
    const recentBookings = await Booking.find({ maNguoiDung: userId })
      .populate('maKhachSan', 'tenKhachSan hinhAnh')
      .sort({ thoiGianTaoDon: -1 })
      .limit(5)
      .select('maKhachSan trangThai ngayNhanPhong ngayTraPhong thongTinGia.tongDonDat thoiGianTaoDon');

    console.log('📋 [USER DETAIL] Recent bookings:', recentBookings.length);

    // Lấy khách sạn sở hữu (nếu là chủ khách sạn)
    let ownedHotels = [];
    if (user.vaiTro === "chuKhachSan") {
      ownedHotels = await Hotel.find({ maChuKhachSan: userId })
        .select('tenKhachSan hinhAnh diaChi soSao');
      console.log('🏨 [USER DETAIL] Owned hotels:', ownedHotels.length);
    }

    // Tính toán stats để trả về
    const calculatedStats = {
      tongSoDonDat: allUserBookings.length,
      donDatThanhCong: allUserBookings.filter(b => ["da_tra_phong", "dang_su_dung"].includes(b.trangThai)).length,
      donDatHuy: allUserBookings.filter(b => b.trangThai === "da_huy").length,
      donKhongNhan: allUserBookings.filter(b => b.trangThai === "khong_nhan_phong").length,
      tongTienDaThanhToan: allUserBookings
        .filter(b => b.trangThaiThanhToan === "da_thanh_toan")
        .reduce((sum, b) => sum + (b.thongTinGia?.tongDonDat || 0), 0)
    };

    console.log('📤 [USER DETAIL] Returning calculated stats:', calculatedStats);

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        ...calculatedStats,
        thongKeDatPhong: bookingStats,
        donDatGanNhat: recentBookings,
        khachSanSoHuu: ownedHotels
      },
      debug: {
        allBookingsCount: allUserBookings.length,
        paidBookingsStats: paidBookingsStats[0] || { totalAmount: 0, count: 0 },
        calculatedStats
      }
    });

  } catch (error) {
    console.error('❌ [USER DETAIL] Error:', error);
    console.error('❌ [USER DETAIL] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy chi tiết người dùng",
      error: error.message
    });
  }
});

// PUT: Cập nhật trạng thái người dùng (cấm/bỏ cấm)
userManagementRouter.put("/admin/users/:id/toggle-status", authorizeRoles("admin"), async (req, res) => {
  try {
    const userId = req.params.id;
    const { reason } = req.body;

    console.log('🔄 [TOGGLE STATUS] Request for user:', userId, 'reason:', reason);

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    const currentStatus = user.trangThaiTaiKhoan;
    const newStatus = currentStatus === "hoatDong" ? "cam" : "hoatDong";

    console.log('📝 [TOGGLE STATUS] Status change:', { currentStatus, newStatus });

    // Nếu cấm người dùng, cũng cần cấm đặt phòng
    const updateData = {
      trangThaiTaiKhoan: newStatus
    };

    if (newStatus === "cam") {
      updateData.ngayCamDatPhong = new Date();
    } else {
      updateData.ngayCamDatPhong = null;
    }

    await User.findByIdAndUpdate(userId, updateData);

    const actionText = newStatus === "cam" ? "cấm" : "bỏ cấm";

    console.log('✅ [TOGGLE STATUS] Success:', actionText, 'user');

    res.json({
      success: true,
      message: `Đã ${actionText} người dùng thành công`,
      data: {
        userId: user._id,
        newStatus: newStatus,
        reason: reason || ""
      }
    });

  } catch (error) {
    console.error('❌ [TOGGLE STATUS] Error:', error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trạng thái người dùng",
      error: error.message
    });
  }
});

// PUT: Cấm/bỏ cấm đặt phòng
userManagementRouter.put("/admin/users/:id/toggle-booking", authorizeRoles("admin"), async (req, res) => {
  try {
    const userId = req.params.id;
    const { reason, duration } = req.body; // duration in days

    console.log('🚫 [TOGGLE BOOKING] Request for user:', userId, 'duration:', duration, 'reason:', reason);

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    const updateData = {};

    if (user.ngayCamDatPhong) {
      // Bỏ cấm đặt phòng
      updateData.ngayCamDatPhong = null;
      console.log('✅ [TOGGLE BOOKING] Removing booking ban');
    } else {
      // Cấm đặt phòng
      const banUntil = new Date();
      if (duration) {
        banUntil.setDate(banUntil.getDate() + parseInt(duration));
      } else {
        banUntil.setFullYear(banUntil.getFullYear() + 1); // Cấm 1 năm mặc định
      }
      updateData.ngayCamDatPhong = banUntil;
      console.log('🚫 [TOGGLE BOOKING] Setting booking ban until:', banUntil);
    }

    await User.findByIdAndUpdate(userId, updateData);

    const actionText = updateData.ngayCamDatPhong ? "cấm đặt phòng" : "bỏ cấm đặt phòng";

    res.json({
      success: true,
      message: `Đã ${actionText} thành công`,
      data: {
        userId: user._id,
        ngayCamDatPhong: updateData.ngayCamDatPhong,
        reason: reason || ""
      }
    });

  } catch (error) {
    console.error('❌ [TOGGLE BOOKING] Error:', error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật quyền đặt phòng",
      error: error.message
    });
  }
});

// PUT: Reset số lần không nhận phòng
userManagementRouter.put("/admin/users/:id/reset-no-show", authorizeRoles("admin"), async (req, res) => {
  try {
    const userId = req.params.id;

    console.log('🔄 [RESET NO-SHOW] Request for user:', userId);

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    console.log('📊 [RESET NO-SHOW] Current no-show count:', user.soLanKhongNhanPhong);

    await User.findByIdAndUpdate(userId, {
      soLanKhongNhanPhong: 0,
      lichSuKhongNhanPhong: []
    });

    console.log('✅ [RESET NO-SHOW] Reset successful');

    res.json({
      success: true,
      message: "Đã reset số lần không nhận phòng thành công",
      data: {
        userId: user._id
      }
    });

  } catch (error) {
    console.error('❌ [RESET NO-SHOW] Error:', error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi reset số lần không nhận phòng",
      error: error.message
    });
  }
});

// DELETE: Xóa người dùng (soft delete)
userManagementRouter.delete("/admin/users/:id", authorizeRoles("admin"), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.params.id;

    console.log('🗑️ [DELETE USER] Request for user:', userId);

    const user = await User.findById(userId).session(session);

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    // Kiểm tra có đơn đặt phòng đang hoạt động không
    const activeBookings = await Booking.countDocuments({
      maNguoiDung: user._id,
      trangThai: { $in: ["dang_cho", "da_xac_nhan", "da_nhan_phong", "dang_su_dung"] }
    }).session(session);

    console.log('📊 [DELETE USER] Active bookings:', activeBookings);

    if (activeBookings > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Không thể xóa người dùng vì còn ${activeBookings} đơn đặt phòng đang hoạt động`
      });
    }

    // Kiểm tra có khách sạn đang sở hữu không
    if (user.vaiTro === "chuKhachSan") {
      const ownedHotels = await Hotel.countDocuments({
        maChuKhachSan: user._id
      }).session(session);

      console.log('🏨 [DELETE USER] Owned hotels:', ownedHotels);

      if (ownedHotels > 0) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Không thể xóa chủ khách sạn vì còn ${ownedHotels} khách sạn đang sở hữu`
        });
      }
    }

    // Thay vì xóa hoàn toàn, chỉ vô hiệu hóa tài khoản
    await User.findByIdAndUpdate(userId, {
      trangThaiTaiKhoan: "khongHoatDong",
      email: `deleted_${Date.now()}_${user.email}`, // Để tránh conflict unique email
      cccd: null
    }).session(session);

    await session.commitTransaction();

    console.log('✅ [DELETE USER] User deactivated successfully');

    res.json({
      success: true,
      message: "Đã vô hiệu hóa tài khoản người dùng thành công"
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ [DELETE USER] Error:', error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa người dùng",
      error: error.message
    });
  } finally {
    session.endSession();
  }
});

// GET: Thống kê tổng quan người dùng
userManagementRouter.get("/admin/users-stats", authorizeRoles("admin"), async (req, res) => {
  try {
    console.log('📊 [USER STATS] Generating user statistics...');

    const totalUsers = await User.countDocuments();
    
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: "$vaiTro",
          count: { $sum: 1 }
        }
      }
    ]);

    const usersByStatus = await User.aggregate([
      {
        $group: {
          _id: "$trangThaiTaiKhoan",
          count: { $sum: 1 }
        }
      }
    ]);

    // Người dùng đăng ký trong 30 ngày qua
    const newUsersThisMonth = await User.countDocuments({
      ngayTao: {
        $gte: new Date(new Date().setDate(new Date().getDate() - 30))
      }
    });

    // Người dùng có đơn đặt phòng trong 30 ngày qua
    const activeUsersThisMonth = await Booking.distinct("maNguoiDung", {
      thoiGianTaoDon: {
        $gte: new Date(new Date().setDate(new Date().getDate() - 30))
      }
    });

    // Người dùng bị cấm đặt phòng
    const bannedFromBooking = await User.countDocuments({
      ngayCamDatPhong: { $ne: null, $gte: new Date() }
    });

    // Top người dùng có nhiều đơn đặt nhất
    const topBookingUsers = await Booking.aggregate([
      {
        $group: {
          _id: "$maNguoiDung",
          soLuongDon: { $sum: 1 },
          tongTien: { $sum: "$thongTinGia.tongDonDat" }
        }
      },
      {
        $lookup: {
          from: "nguoidungs",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          "user.tenNguoiDung": 1,
          "user.email": 1,
          soLuongDon: 1,
          tongTien: 1
        }
      },
      { $sort: { soLuongDon: -1 } },
      { $limit: 5 }
    ]);

    console.log('📈 [USER STATS] Stats generated:', {
      totalUsers,
      newUsersThisMonth,
      activeUsersThisMonth: activeUsersThisMonth.length,
      bannedFromBooking,
      topBookingUsers: topBookingUsers.length
    });

    res.json({
      success: true,
      data: {
        tongSoNguoiDung: totalUsers,
        nguoiDungTheoVaiTro: usersByRole,
        nguoiDungTheoTrangThai: usersByStatus,
        nguoiDungMoiThang: newUsersThisMonth,
        nguoiDungHoatDongThang: activeUsersThisMonth.length,
        nguoiDungBiCamDatPhong: bannedFromBooking,
        topNguoiDungDatPhong: topBookingUsers
      }
    });

  } catch (error) {
    console.error('❌ [USER STATS] Error:', error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê người dùng",
      error: error.message
    });
  }
});

// GET: Lấy lịch sử đặt phòng của người dùng
userManagementRouter.get("/admin/users/:id/booking-history", authorizeRoles("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.params.id;

    console.log('📚 [BOOKING HISTORY] Request for user:', userId, 'page:', page, 'limit:', limit);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    const skip = (page - 1) * limit;

    const bookings = await Booking.find({ maNguoiDung: userId })
      .populate('maKhachSan', 'tenKhachSan hinhAnh diaChi')
      .populate('maLoaiPhong', 'tenLoaiPhong')
      .sort({ thoiGianTaoDon: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments({ maNguoiDung: userId });

    console.log('📋 [BOOKING HISTORY] Found bookings:', bookings.length, 'total:', total);

    // Log sample booking structure
    if (bookings.length > 0) {
      console.log('📝 [BOOKING HISTORY] Sample booking:', {
        trangThai: bookings[0].trangThai,
        trangThaiThanhToan: bookings[0].trangThaiThanhToan,
        thongTinGia: bookings[0].thongTinGia,
        hotel: bookings[0].maKhachSan?.tenKhachSan
      });
    }

    res.json({
      success: true,
      data: bookings,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: bookings.length,
        totalRecords: total
      }
    });

  } catch (error) {
    console.error('❌ [BOOKING HISTORY] Error:', error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy lịch sử đặt phòng",
      error: error.message
    });
  }
});

module.exports = userManagementRouter;