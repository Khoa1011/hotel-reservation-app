const express = require("express");
const userRouter = express.Router();
const User = require("../Model/User/User");
const bcrypt = require("bcryptjs");
const JWT = require("jsonwebtoken");
const passport = require("passport");
const passportConfig = require("../config/passport");
const JWT_SECRET = process.env.JWT_SECRET || "ThuKhoa";
const authorizeRoles = require("../middleware/roleAuth");


// const signToken = (userID) =>{
//     return JWT.sign({
//         iss:"ThuKhoa",
//         sub:userID,

//     },
//     JWT_SECRET,
//     {expiresIn:"1d"}
// );
// };

const signToken = (user) => {
    return JWT.sign({
        iss: "ThuKhoa",
        sub: user._id,
        role: user.vaiTro,
        email: user.email
    }, JWT_SECRET, { expiresIn: "1d" });
};

// Route chỉ admin mới được truy cập
userRouter.get("/admin-only", authorizeRoles("admin"), (req, res) => {
    res.json({ message: "Xin chào Admin!" });
});

// Route cho cả admin và user
userRouter.get("/admin-or-user", authorizeRoles("admin", "nguoiDung"), (req, res) => {
    res.json({ message: "Bạn có quyền truy cập!" });
});


// ---------------------------------------------------------------------------------
//Đăng ký tài khoản user
userRouter.post("/register", async (req, res) => {
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
        const newUser = new User({ email, matKhau });
        await newUser.save(); // Lưu user vào database


        return res.status(200).json({
            message: { msgBody: "Tạo tài khoản thành công!", msgError: false },
            user: { id: newUser._id, email: newUser.email, role: newUser.vaiTro }, // Gửi dữ liệu user về client  
        });
    }

    catch (err) {
        console.error("Lỗi này:", err);
        return res.status(500).json({
            message: { msgBody: "Lỗi server!", msgError: true },
        });
    }
});


//Đăng nhập tài khoản
userRouter.post("/login", async (req, res) => {
    try {
        const { email, matKhau } = req.body;

        // Kiểm tra user có tồn tại không
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                msgBody: "Email chưa được đăng ký!",
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

        // Tạo JWT Token
        const token = signToken(user);

        // Gửi token vào Cookie
        res.cookie("access_token", token, { httpOnly: true, sameSite: "strict" });

        return res.status(200).json({
            msgBody: "Đăng nhập thành công!",
            msgError: false,
            isAuthenticated: true, user, token
        });
        // ,user: { _id: user._id, _email: user._email }
    } catch (err) {
        return res.status(500).json({ message: "Lỗi server!", error: err.message });
    }
});

// 📌 Xác thực token (Middleware bảo vệ route)
const authenticateUser = passport.authenticate("jwt", { session: false });

// 📌 Kiểm tra đã đăng nhập hay chưa
userRouter.get("/check-auth", authenticateUser, (req, res) => {
    return res.status(200).json({ isAuthenticated: true, user: req.user });
});

//Đăng xuất tài khoản

// userRouter.get(
//     "/logout",
//     passport.authenticate("jwt", { session: false }),
//     (req, res) => {
//         try {
//             res.clearCookie("access_token");
//         res.json({ user: { email: req.user.email }, success: true });

//         res.status(200).json({
//                 success: true,
//                 message: "Đăng xuất khỏi tất cả thiết bị thành công",
//                 data: {
//                     user: { 
//                         email: req.user.email 
//                     },
//                     logoutTime: new Date().toISOString(),
//                     logoutType: "all_devices"
//                 }
//             });
//         } catch (error) {
//             console.error('❌ Logout all error:', error);
//             res.status(500).json({
//                 success: false,
//                 message: "Lỗi khi đăng xuất khỏi tất cả thiết bị",
//                 error: process.env.NODE_ENV === 'development' ? error.message : "Lỗi server"
//             });
//         }
//     }
// );

userRouter.get(
    "/logout",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
        try {
            // Xóa cookie chứa access token
            res.clearCookie("access_token", {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
            
            res.status(200).json({ 
                success: true,
                message: "Đăng xuất thành công",
                data: {
                    user: { 
                        email: req.user.email 
                    },
                    logoutTime: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('❌ Logout error:', error);
            res.status(500).json({
                success: false,
                message: "Lỗi khi đăng xuất",
                error: process.env.NODE_ENV === 'development' ? error.message : "Lỗi server"
            });
        }
    }
);


userRouter.post("/updateUser", async (req, res) => {
    try {
        const { maNguoiDung, ngaySinh, tenNguoiDung, gioiTinh, soDienThoai, hinhDaiDien, viTri } = req.body;
        console.log("=== UPDATE USER (FILL PROFILE) ===");
        console.log("Received Body:", JSON.stringify(req.body, null, 2));

        if (!maNguoiDung) {
            return res.status(400).json({
                message: { msgBody: "User ID is required", msgError: true }
            });
        }

        // Kiểm tra user có tồn tại không
        const existingUser = await User.findById(maNguoiDung);
        if (!existingUser) {
            return res.status(404).json({
                message: { msgBody: "User not found!", msgError: true }
            });
        }

        console.log("✅ Found user:", existingUser.tenNguoiDung);

        // ✅ Chuẩn bị dữ liệu update
        const updateData = {};

        // Xử lý ngày sinh
        if (ngaySinh !== undefined) {
            updateData.ngaySinh = ngaySinh ? new Date(ngaySinh) : null;
        }
        if (tenNguoiDung !== undefined) updateData.tenNguoiDung = tenNguoiDung;
        if (gioiTinh !== undefined) updateData.gioiTinh = gioiTinh;
        if (soDienThoai !== undefined) updateData.soDienThoai = soDienThoai;
        if (hinhDaiDien !== undefined) updateData.hinhDaiDien = hinhDaiDien;

        // Xử lý vị trí
        if (viTri) {
            updateData.viTri = {
                quocGia: viTri.quocGia,
                thanhPho: viTri.thanhPho,
                quan: viTri.quan,
                phuong: viTri.phuong,
                soNha: viTri.soNha,
            };
        }

        // Cập nhật thông tin user
        const updatedUser = await User.findByIdAndUpdate(
            maNguoiDung,
            updateData,
            { new: true, runValidators: true } // ✅ Thêm runValidators
        );

        console.log("✅ User updated successfully");

        // ✅ Không trả về mật khẩu trong response
        const userResponse = updatedUser.toObject();
        delete userResponse.matKhau;

        return res.status(200).json({
            message: { msgBody: "Cập nhật thông tin thành công!", msgError: false },
            user: userResponse
        });

    } catch (err) {
        console.error("❌ Update user error:", err);
        return res.status(500).json({
            message: { msgBody: 'Lỗi khi cập nhật thông tin', msgError: true },
            error: err.message
        });
    }
});

// Route cho Edit Profile (có thể cập nhật mật khẩu)
userRouter.post("/updateProfile", async (req, res) => {
    try {
        const {
            maNguoiDung,
            ngaySinh,
            tenNguoiDung,
            gioiTinh,
            soDienThoai,
            hinhDaiDien,
            matKhau,
            viTri,
            cccd
        } = req.body;

        console.log("=== UPDATE PROFILE ===");
        console.log("Received Body:", JSON.stringify(req.body, null, 2));

        // Validation
        if (!maNguoiDung) {
            return res.status(400).json({
                message: { msgBody: "User ID is required", msgError: true }
            });
        }

        // Kiểm tra user có tồn tại không
        const existingUser = await User.findById(maNguoiDung);
        if (!existingUser) {
            return res.status(404).json({
                message: { msgBody: "User not found!", msgError: true }
            });
        }

        console.log("✅ Found user:", existingUser.tenNguoiDung);

        // ✅ Chuẩn bị dữ liệu update
        const updateData = {};

        // Xử lý ngày sinh
        if (ngaySinh !== undefined) {
            updateData.ngaySinh = ngaySinh ? new Date(ngaySinh) : null;
        }
        if (tenNguoiDung !== undefined) updateData.tenNguoiDung = tenNguoiDung;
        if (gioiTinh !== undefined) updateData.gioiTinh = gioiTinh;
        if (soDienThoai !== undefined) updateData.soDienThoai = soDienThoai;
        if (hinhDaiDien !== undefined) updateData.hinhDaiDien = hinhDaiDien;
        if (cccd !== undefined) updateData.cccd = cccd;

        // ✅ Xử lý mật khẩu mới nếu có
        if (matKhau && matKhau.trim() !== '') {
            console.log("🔐 Updating password...");

            // Validation mật khẩu
            if (matKhau.length < 6) {
                return res.status(400).json({
                    message: { msgBody: "Mật khẩu phải có ít nhất 6 ký tự", msgError: true }
                });
            }

            updateData.matKhau = await bcrypt.hash(matKhau, 10);
        }

        // Xử lý vị trí
        if (viTri) {
            console.log("📍 Updating location...");
            updateData.viTri = {
                quocGia: viTri.quocGia,
                thanhPho: viTri.thanhPho,
                quan: viTri.quan,
                phuong: viTri.phuong,
                soNha: viTri.soNha,
            };
        }

        console.log("📝 Update data keys:", Object.keys(updateData));

        // Cập nhật thông tin user
        const updatedUser = await User.findByIdAndUpdate(
            maNguoiDung,
            updateData,
            { new: true, runValidators: true } // ✅ Thêm runValidators
        );

        console.log("✅ Profile updated successfully");

        // ✅ Không trả về mật khẩu trong response
        const userResponse = updatedUser.toObject();
        delete userResponse.matKhau;

        return res.status(200).json({
            message: { msgBody: "Cập nhật thông tin thành công!", msgError: false },
            user: userResponse
        });

    } catch (err) {
        console.error("❌ Update profile error:", err);

        // ✅ Xử lý validation errors
        if (err.name === 'ValidationError') {
            const validationErrors = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({
                message: { msgBody: `Validation error: ${validationErrors.join(', ')}`, msgError: true }
            });
        }

        return res.status(500).json({
            message: { msgBody: 'Lỗi khi cập nhật thông tin', msgError: true },
            error: err.message
        });
    }
});

// Lấy thông tin người dùng
userRouter.get("/getUser", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const userId = req.user._id; // Lấy user ID từ payload JWT

        // Tìm kiếm người dùng trong cơ sở dữ liệu
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: { msgBody: "User not found!", msgError: true },
            });
        }
        const userResponse = user.toObject();
        // Trả về thông tin người dùng
        return res.status(200).json({
            message: { msgBody: "User fetched successfully", msgError: false },
            user: userResponse
        });
    } catch (err) {
        return res.status(500).json({ message: "Error fetching user", error: err.message });
    }
});


module.exports = userRouter;
