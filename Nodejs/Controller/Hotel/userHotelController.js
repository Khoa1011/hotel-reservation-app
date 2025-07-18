const express = require("express");
const userHotelRouter = express.Router();
const User = require("../../Model/User/User");
const bcrypt = require("bcryptjs");
const JWT = require("jsonwebtoken");
const passport = require("passport");
const passportConfig = require("../../config/passport");
const JWT_SECRET = process.env.JWT_SECRET || "ThuKhoa";
const authorizeRoles = require("../../middleware/roleAuth");

const signToken = (user) => {
    return JWT.sign({
        iss: "ThuKhoa",
        sub: user._id,
        role: user.vaiTro,
        email: user.email
    }, JWT_SECRET, { expiresIn: "1d" });
};

// Route chỉ admin mới được truy cập
userHotelRouter.get("/admin-only", authorizeRoles("admin"), (req, res) => {
    res.json({ message: "Xin chào Admin!" });
});

// Route cho cả admin và user
userHotelRouter.get("/admin-or-user", authorizeRoles("admin", "nguoiDung"), (req, res) => {
    res.json({ message: "Bạn có quyền truy cập!" });
});

//Đăng ký tài khoản admin
userHotelRouter.post("/hotelowner/register", async (req, res) => {
    try {
        const { email, matKhau } = req.body;

        // Kiểm tra xem email đã tồn tại chưa
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: { msgBody: "Tên đăng nhập đã tồn tại!", msgError: true },
            });
        }

        // Tạo người dùng mới
        const newUser = new User({ email, matKhau, vaiTro: "chuKhachSan" });
        await newUser.save(); // Lưu user vào database

        return res.status(200).json({
            message: { msgBody: "Tạo tài khoản cho chủ khách sạn thành công!", msgError: false },
            user: { id: newUser._id, email: newUser.email, vaiTro: newUser.vaiTro }, // Gửi dữ liệu user về client  
        });
    } catch (err) {
        console.error("Lỗi này:", err);
        return res.status(500).json({
            message: { msgBody: "Lỗi server!", msgError: true },
        });
    }
});


userHotelRouter.post("/hotelowner/login", async (req, res) => {
    try {
        const { email, matKhau } = req.body;

        // Kiểm tra user tồn tại
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                msgBody: "Email chưa được đăng ký!",
                msgError: true
            });
        }

        // Kiểm tra role
        if (user.vaiTro !== "chuKhachSan") {
            return res.status(403).json({
                msgBody: "Tài khoản này không có quyền đăng nhập trang của khách sạn!",
                msgError: true
            });
        }

        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(matKhau, user.matKhau);
        if (!isMatch) {
            return res.status(401).json({
                msgBody: "Mật khẩu không chính xác!",
                msgError: true
            });
        }

        // Tạo token
        const token = signToken(user);

        // Gửi token cookie
        res.cookie("access_token", token, { httpOnly: true, sameSite: "strict" });

        return res.status(200).json({
            msgBody: "Đăng nhập cho chủ khách sạn thành công!",
            msgError: false,
            isAuthenticated: true,
            user: { id: user._id, email: user.email, role: user.vaiTro },
            token
        });
    } catch (err) {
        return res.status(500).json({
            msgBody: "Lỗi server!",
            msgError: true,
            error: err.message
        });
    }
});




module.exports = userHotelRouter;
