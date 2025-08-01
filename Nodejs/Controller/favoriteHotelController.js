const express = require('express');
const mongoose = require("mongoose");
const favoriteHotelRouter = express.Router();
const FavoriteHotel = require('../Model/User/FavoriteHotel');
const Hotel = require('../Model/Hotel/Hotel');
const authorizeRoles = require('../middleware/roleAuth');
const RoomType = require('../Model/RoomType/RoomType');

// ✅ 1. THÊM KHÁCH SẠN VÀO YÊU THÍCH
favoriteHotelRouter.post('/add-favorite/:hotelId', authorizeRoles("nguoiDung"), async (req, res) => {
    try {
        const { hotelId } = req.params;
        const { ghiChu } = req.body;
        const userId = req.user.id;

        // Kiểm tra khách sạn có tồn tại không
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: "Khách sạn không tồn tại!"
            });
        }

        // Kiểm tra đã yêu thích chưa
        const existingFavorite = await FavoriteHotel.findOne({
            maNguoiDung: userId,
            maKhachSan: hotelId
        });

        if (existingFavorite) {
            return res.status(400).json({
                success: false,
                message: "Khách sạn đã có trong danh sách yêu thích!"
            });
        }

        // Thêm vào yêu thích
        const favorite = new FavoriteHotel({
            maNguoiDung: userId,
            maKhachSan: hotelId,
            ghiChu: ghiChu || ""
        });

        await favorite.save();

        return res.status(201).json({
            success: true,
            message: "Đã thêm khách sạn vào danh sách yêu thích!",
            data: {
                favoriteId: favorite._id,
                hotelName: hotel.tenKhachSan,
                addedAt: favorite.ngayThem
            }
        });

    } catch (error) {
        console.error("Lỗi thêm yêu thích:", error);

        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Khách sạn đã có trong danh sách yêu thích!"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Lỗi server khi thêm yêu thích.",
            error: error.message
        });
    }
});

// ✅ 2. XÓA KHÁCH SẠN KHỎI YÊU THÍCH
favoriteHotelRouter.delete('/delete-favorite/:hotelId', authorizeRoles("nguoiDung"), async (req, res) => {
    try {
        const { hotelId } = req.params;
        const userId = req.user.id;

        // Tìm và xóa
        const deletedFavorite = await FavoriteHotel.findOneAndDelete({
            maNguoiDung: userId,
            maKhachSan: hotelId
        });

        if (!deletedFavorite) {
            return res.status(404).json({
                success: false,
                message: "Khách sạn không có trong danh sách yêu thích!"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Đã xóa khách sạn khỏi danh sách yêu thích!",
            data: {
                removedAt: new Date()
            }
        });

    } catch (error) {
        console.error("Lỗi xóa yêu thích:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server khi xóa yêu thích.",
            error: error.message
        });
    }
});

favoriteHotelRouter.get('/hotels', authorizeRoles("nguoiDung"), async (req, res) => {
   try {
       const { search = "" } = req.query;
       const userId = req.user.id;

       const userObjectId = new mongoose.Types.ObjectId(userId);
       let matchQuery = { maNguoiDung: userObjectId };

       // ✅ THAY ĐỔI: Lấy favorites và enhance giá giống getHotelList
       const rawFavorites = await FavoriteHotel.find(matchQuery)
           .populate('maKhachSan')
           .sort({ ngayThem: -1 });

       const enhancedFavorites = await Promise.all(rawFavorites.map(async (favorite) => {
           try {
               const hotel = favorite.maKhachSan;
               
               if (!hotel || hotel.trangThai !== 'hoatDong') {
                   return null;
               }

               // ✅ LOGIC GIỐNG GETHOTELLIST: Lấy giá room type rẻ nhất
               const cheapestRoomType = await RoomType.findOne({
                   maKhachSan: hotel._id
               }).sort({ giaCa: 1 });

               let giaTheoNgay = hotel.giaCa || 0;
               if (cheapestRoomType) {
                   giaTheoNgay = cheapestRoomType.giaCa;
               }

               // ✅ XỬ LÝ HÌNH ẢNH GIỐNG GETHOTELLIST
               let hinhAnh = hotel.hinhAnh;
               if (hotel.hinhAnhDayDu && hotel.hinhAnhDayDu.length > 0) {
                   hinhAnh = hotel.hinhAnhDayDu[0];
               }

               // ✅ XỬ LÝ THÀNH PHỐ GIỐNG GETHOTELLIST
               let thanhPho = 'Chưa cập nhật';
               if (hotel.diaChi && typeof hotel.diaChi === 'object') {
                   thanhPho = hotel.diaChi.tinhThanh || 'Chưa cập nhật';
               }

               return {
                   _id: favorite._id,
                   favoriteId: favorite._id,
                   ngayThem: favorite.ngayThem,
                   ghiChu: favorite.ghiChu,
                   khachSan: {
                       _id: hotel._id,
                       id: hotel._id,
                       tenKhachSan: hotel.tenKhachSan,
                       diaChiDayDu: hotel.diaChiDayDu,
                       thanhPho: thanhPho,
                       moTa: hotel.moTa,
                       soSao: hotel.soSao,
                       soDienThoai: hotel.soDienThoai,
                       email: hotel.email,
                       hinhAnh: hinhAnh,
                       giaTheoNgay: giaTheoNgay, // ✅ GIÁ ĐÃ OPTIMIZE
                       loaiKhachSan: hotel.loaiKhachSan,
                       trangThai: hotel.trangThai
                   }
               };

           } catch (error) {
               console.error(`Lỗi xử lý favorite ${favorite._id}:`, error);
               return null;
           }
       }));

       // Lọc bỏ null values
       const validFavorites = enhancedFavorites.filter(fav => fav !== null);

       return res.status(200).json({
           success: true,
           message: "Lấy danh sách khách sạn yêu thích thành công!",
           data: {
               favorites: validFavorites,
               totalFavorites: validFavorites.length
           }
       });

   } catch (error) {
       console.error("Lỗi lấy danh sách yêu thích:", error);
       return res.status(500).json({
           success: false,
           message: "Lỗi server khi lấy danh sách yêu thích.",
           error: error.message
       });
   }
});

// ✅ 4.  Kiểm tra khách sạn có trong yêu thích không
favoriteHotelRouter.get('/hotels/:hotelId/check', authorizeRoles("nguoiDung"), async (req, res) => {
    try {
        const { hotelId } = req.params;
        const userId = req.user.id;

        const favorite = await FavoriteHotel.findOne({
            maNguoiDung: userId,
            maKhachSan: hotelId
        });

        return res.status(200).json({
            success: true,
            data: {
                isFavorite: !!favorite,
                favoriteId: favorite?._id || null,
                addedAt: favorite?.ngayThem || null
            }
        });

    } catch (error) {
        console.error("Lỗi kiểm tra yêu thích:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server khi kiểm tra yêu thích.",
            error: error.message
        });
    }
});


module.exports = favoriteHotelRouter;