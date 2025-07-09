const express = require('express');
const mongoose = require('mongoose');
const moment = require('moment');
const reviewRouter = express.Router();

// Import models
const Review = require('../Model/Booking/Review');
const Booking = require('../Model/Booking/Booking');

// ✅ API DUY NHẤT: GỬI ĐÁNH GIÁ
reviewRouter.post('/submit', async (req, res) => {
    try {
        const { bookingId, rating, comment } = req.body;

        // ✅ VALIDATE INPUT
        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu mã đặt phòng'
            });
        }

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Số sao phải từ 1 đến 5'
            });
        }

        if (comment && comment.length > 500) {
            return res.status(400).json({
                success: false,
                message: 'Bình luận không được quá 500 ký tự'
            });
        }

        // ✅ TÌM BOOKING
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn đặt phòng'
            });
        }

     

        // ✅ KIỂM TRA TRẠNG THÁI BOOKING
        if (booking.trangThai !== 'da_tra_phong') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể đánh giá đơn đã hoàn thành'
            });
        }

        // ✅ KIỂM TRA ĐÃ ĐÁNH GIÁ CHƯA
        const existingReview = await Review.findOne({ maDatPhong: bookingId });
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã đánh giá đơn này rồi',
                reviewDate: existingReview.ngayDanhGia
            });
        }

        // ✅ KIỂM TRA DEADLINE 2 NGÀY
        const checkOutDate = moment(booking.ngayTraPhong);
        const now = moment();
        const daysSinceCheckout = now.diff(checkOutDate, 'days');

        if (daysSinceCheckout > 2) {
            const deadline = moment(booking.ngayTraPhong).add(2, 'days');
            return res.status(400).json({
                success: false,
                message: 'Đã quá thời hạn đánh giá (2 ngày sau check-out)',
                deadline: deadline.format('DD/MM/YYYY HH:mm'),
                checkOutDate: checkOutDate.format('DD/MM/YYYY HH:mm')
            });
        }

        // ✅ TẠO ĐÁNH GIÁ MỚI
        const newReview = new Review({
            maDatPhong: bookingId,
            soSao: rating,
            binhLuan: comment?.trim() || '',
            ngayDanhGia: new Date()
        });

        await newReview.save();

        // ✅ POPULATE THÔNG TIN ĐỂ TRẢ VỀ
        const savedReview = await Review.findById(newReview._id)
            .populate({
                path: 'maDatPhong',
                select: 'maKhachSan maPhong ngayNhanPhong ngayTraPhong',
                populate: {
                    path: 'maKhachSan',
                    select: 'tenKhachSan hinhAnh'
                }
            });

        // ✅ RESPONSE SUCCESS
        res.status(201).json({
            success: true,
            message: 'Cảm ơn bạn đã đánh giá!',
            review: {
                id: savedReview._id,
                rating: savedReview.soSao,
                comment: savedReview.binhLuan,
                reviewDate: savedReview.ngayDanhGia,
                hotel: {
                    id: savedReview.maDatPhong.maKhachSan._id,
                    name: savedReview.maDatPhong.maKhachSan.tenKhachSan,
                    image: savedReview.maDatPhong.maKhachSan.hinhAnh
                },
                booking: {
                    id: booking._id,
                    room: booking.maPhong,
                    checkIn: savedReview.maDatPhong.ngayNhanPhong,
                    checkOut: savedReview.maDatPhong.ngayTraPhong
                }
            }
        });

    } catch (error) {
        console.error('Submit review error:', error);
        
        // ✅ HANDLE VALIDATION ERRORS
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu đánh giá không hợp lệ',
                errors: Object.values(error.errors).map(e => e.message)
            });
        }

        // ✅ HANDLE DUPLICATE REVIEW (nếu race condition)
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã đánh giá đơn này rồi'
            });
        }

        // ✅ GENERAL ERROR
        res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ khi gửi đánh giá',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = reviewRouter;