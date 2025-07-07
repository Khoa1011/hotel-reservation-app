const express = require("express");
const Booking = require("../Model/Booking/Booking");
const User = require("../Model/User/User");
const moment = require('moment-timezone');
const cron = require('node-cron');
const bookingAutoRouter = express.Router();

// ✅ 1. CRON JOB - Chạy mỗi 30 phút để kiểm tra booking quá hạn
cron.schedule('*/30 * * * *', async () => {
    console.log('🔄 Running auto booking status check...');
    await checkAndUpdateOverdueBookings();
});

// ✅ 2. HÀM CHÍNH - Kiểm tra và cập nhật booking quá hạn
async function checkAndUpdateOverdueBookings() {
    try {
        const now = moment().tz('Asia/Ho_Chi_Minh');
        console.log(`⏰ Checking overdue bookings at: ${now.format('YYYY-MM-DD HH:mm:ss')}`);

        // Tìm các booking đang chờ xác nhận hoặc đã xác nhận mà đã quá giờ check-in
        const overdueBookings = await Booking.find({
            trangThai: { $in: ["dang_cho"] },
            $expr: {
                $lt: [
                    {
                        $dateFromString: {
                            dateString: {
                                $concat: [
                                    { $dateToString: { format: "%Y-%m-%d", date: "$ngayNhanPhong" } },
                                    "T",
                                    "$gioNhanPhong",
                                    ":00+07:00"
                                ]
                            }
                        }
                    },
                    {
                        $dateSubtract: {
                            startDate: now.toDate(),
                            unit: "hour",
                            amount: 2 // Grace period 2 tiếng
                        }
                    }
                ]
            }
        }).populate('maNguoiDung', 'tenNguoiDung email soLanKhongNhanPhong camTienMat');

        console.log(`📋 Found ${overdueBookings.length} overdue bookings`);

        for (const booking of overdueBookings) {
            await processOverdueBooking(booking);
        }

        console.log('✅ Auto booking check completed');
    } catch (error) {
        console.error('❌ Error in auto booking check:', error);
    }
}

// ✅ 3. XỬ LÝ TỪNG BOOKING QUÁ HẠN
async function processOverdueBooking(booking) {
    try {
        const user = booking.maNguoiDung;
        const bookingTime = moment(`${moment(booking.ngayNhanPhong).format('YYYY-MM-DD')} ${booking.gioNhanPhong}`);
        const now = moment().tz('Asia/Ho_Chi_Minh');
        const hoursLate = now.diff(bookingTime, 'hours');

        console.log(`🔍 Processing overdue booking: ${booking._id}`);
        console.log(`   User: ${user.tenNguoiDung} (${user.email})`);
        console.log(`   Expected check-in: ${bookingTime.format('YYYY-MM-DD HH:mm')}`);
        console.log(`   Hours late: ${hoursLate}`);

        // Cập nhật booking thành không nhận phòng
        await Booking.findByIdAndUpdate(booking._id, {
            trangThai: 'khong_nhan_phong',
            trangThaiThanhToan: 'da_hoan_tien',
            ghiChu: `Không nhận phòng đúng hạn. Quá hạn ${hoursLate} giờ so với thời gian check-in dự kiến.`
        });

        // Cập nhật số lần không nhận phòng của user
        const currentNoShowCount = user.soLanKhongNhanPhong || 0;
        const newNoShowCount = currentNoShowCount + 1;

        const updateData = {
            soLanKhongNhanPhong: newNoShowCount,
            $push: {
                lichSuKhongNhanPhong: {
                    maDonDatPhong: booking._id,
                    thoiGianQuaHan: now.toDate(),
                    lyDo: `Không nhận phòng đúng hạn. Quá ${hoursLate} giờ.`
                }
            }
        };

        // Nếu đã 2 lần không nhận phòng → cấm đặt tiền mặt vĩnh viễn
        if (newNoShowCount >= 2) {
            updateData.camTienMat = true;
            updateData.ngayCamDatPhong = now.toDate();
            console.log(`🚫 User ${user.email} banned from cash payments (${newNoShowCount} no-shows)`);
        }

        await User.findByIdAndUpdate(user._id, updateData);

        console.log(`✅ Updated booking ${booking._id} and user ${user.email}`);
        console.log(`   New no-show count: ${newNoShowCount}`);
        console.log(`   Cash payment banned: ${newNoShowCount >= 2}`);

    } catch (error) {
        console.error(`❌ Error processing booking ${booking._id}:`, error);
    }
}

// ✅ 4. API ENDPOINT - Kiểm tra thủ công
bookingAutoRouter.post('/check-overdue-bookings', async (req, res) => {
    try {
        console.log('🔄 Manual overdue booking check requested');
        await checkAndUpdateOverdueBookings();
        
        res.status(200).json({
            success: true,
            message: 'Kiểm tra booking quá hạn hoàn tất',
            timestamp: moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss')
        });
    } catch (error) {
        console.error('❌ Manual check error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra booking quá hạn',
            error: error.message
        });
    }
});

// ✅ 5. API - Lấy thống kê booking quá hạn
bookingAutoRouter.get('/overdue-stats', async (req, res) => {
    try {
        const now = moment().tz('Asia/Ho_Chi_Minh');
        
        // Đếm booking quá hạn
        const overdueCount = await Booking.countDocuments({
            trangThai: { $in: ["dang_cho", "da_xac_nhan"] },
            $expr: {
                $lt: [
                    {
                        $dateFromString: {
                            dateString: {
                                $concat: [
                                    { $dateToString: { format: "%Y-%m-%d", date: "$ngayNhanPhong" } },
                                    "T",
                                    "$gioNhanPhong",
                                    ":00+07:00"
                                ]
                            }
                        }
                    },
                    {
                        $dateSubtract: {
                            startDate: now.toDate(),
                            unit: "hour",
                            amount: 2
                        }
                    }
                ]
            }
        });

        // Đếm user bị cấm
        const bannedUsers = await User.countDocuments({ camTienMat: true });

        // Đếm booking không nhận phòng hôm nay
        const todayNoShows = await Booking.countDocuments({
            trangThai: 'khong_nhan_phong',
            updatedAt: {
                $gte: now.startOf('day').toDate(),
                $lte: now.endOf('day').toDate()
            }
        });

        res.status(200).json({
            success: true,
            data: {
                currentOverdueBookings: overdueCount,
                totalBannedUsers: bannedUsers,
                todayNoShowBookings: todayNoShows,
                lastCheckTime: now.format('YYYY-MM-DD HH:mm:ss')
            }
        });
    } catch (error) {
        console.error('❌ Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê',
            error: error.message
        });
    }
});

// ✅ 6. API - Kiểm tra trạng thái user có bị cấm không
bookingAutoRouter.get('/check-user-ban/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId).select('camTienMat soLanKhongNhanPhong lichSuKhongNhanPhong ngayCamDatPhong');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy user'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                userId: userId,
                isBannedFromCash: user.camTienMat || false,
                noShowCount: user.soLanKhongNhanPhong || 0,
                banDate: user.ngayCamDatPhong || null,
                canPayCash: !(user.camTienMat || false),
                noShowHistory: user.lichSuKhongNhanPhong || []
            }
        });
    } catch (error) {
        console.error('❌ Check user ban error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra trạng thái user',
            error: error.message
        });
    }
});

// ✅ 7. API - Admin unban user (chỉ admin mới được dùng)
bookingAutoRouter.post('/admin/unban-user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                camTienMat: false,
                ngayCamDatPhong: null,
                $push: {
                    lichSuKhongNhanPhong: {
                        thoiGianQuaHan: new Date(),
                        lyDo: `Admin gỡ cấm: ${reason || 'Không có lý do'}`
                    }
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy user'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Đã gỡ cấm thành công',
            data: {
                userId: userId,
                isBannedFromCash: false,
                unbanDate: new Date(),
                reason: reason
            }
        });
    } catch (error) {
        console.error('❌ Unban user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi gỡ cấm user',
            error: error.message
        });
    }
});

module.exports = bookingAutoRouter;