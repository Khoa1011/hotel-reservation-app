const express = require("express");
const userRouter = express.Router();
const User = require("../Model/User/User");
const bcrypt = require("bcryptjs");
const JWT =require("jsonwebtoken");
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
        role: user.role,  
        email: user.email
    }, JWT_SECRET, { expiresIn: "1d" });
};

// Route chỉ admin mới được truy cập
userRouter.get("/admin-only", authorizeRoles("admin"), (req, res) => {
    res.json({ message: "Xin chào Admin!" });
});

// Route cho cả admin và user
userRouter.get("/admin-or-user", authorizeRoles("admin", "user"), (req, res) => {
    res.json({ message: "Bạn có quyền truy cập!" });
});

//Đăng ký tài khoản admin
userRouter.post("/hotelowner/register", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Kiểm tra xem email đã tồn tại chưa
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: { msgBody: "Tên đăng nhập đã tồn tại!", msgError: true },
            });
        }

        // Tạo người dùng mới
        const newUser = new User({ email, password, role:"hotelowner" });
        await newUser.save(); // Lưu user vào database

        return res.status(200).json({
            message: { msgBody: "Tạo tài khoản cho chủ khách sạn thành công!", msgError: false },
            user: { id: newUser._id, email: newUser.email, role:newUser.role }, // Gửi dữ liệu user về client  
        });
    } catch (err) {
        console.error("Lỗi này:", err);
        return res.status(500).json({
            message: { msgBody: "Lỗi server!", msgError: true },
        });
    }
});


userRouter.post("/hotelowner/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Kiểm tra user tồn tại
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                msgBody: "Email chưa được đăng ký!",
                msgError: true
            });
        }

        // Kiểm tra role
        if (user.role !== "hotelowner") {
            return res.status(403).json({
                msgBody: "Tài khoản này không có quyền đăng nhập trang của khách sạn!",
                msgError: true
            });
        }

        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                msgBody: "Mật khẩu không chính xác!",
                msgError: true
            });
        }

        // Tạo token
        const token = signToken(user);

        // Gửi token cookie
        res.cookie("token", token, { httpOnly: true, sameSite: "strict" });

        return res.status(200).json({
            msgBody: "Đăng nhập cho chủ khách sạn thành công!",
            msgError: false,
            isAuthenticated: true,
            user: { id: user._id, email: user.email, role: user.role },
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


// ---------------------------------------------------------------------------------
//Đăng ký tài khoản user
userRouter.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Kiểm tra xem email đã tồn tại chưa
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: { msgBody: "Tên đăng nhập đã tồn tại!", msgError: true },
            });
        }

        // Tạo người dùng mới
        const newUser = new User({ email, password });
        await newUser.save(); // Lưu user vào database

    
        return res.status(200).json({
            message: { msgBody: "Tạo tài khoản thành công!", msgError: false },
            user: { id: newUser._id, email: newUser.email }, // Gửi dữ liệu user về client  
        });
    } catch (err) {
        console.error("Lỗi này:", err);
        return res.status(500).json({
            message: { msgBody: "Lỗi server!", msgError: true },
        });
    }
});


//Đăng nhập tài khoản
userRouter.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Kiểm tra user có tồn tại không
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ 
                msgBody: "Email chưa được đăng ký!",
                msgError: true
            });
        }

        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
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
            isAuthenticated: true, user , token });
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

userRouter.get(
    "/logout",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
      res.clearCookie("access_token"); 
      res.json({ user: { email: req.user.email  }, success: true });
    }
);


userRouter.post("/updateUser", async (req, res)=> {
    try {
        const { userId,Dob ,userName, gender, phoneNumber, avatar } = req.body;
        console.log("Received Body:", req.body);
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }
        // Kiểm tra user có tồn tại không
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(404).json({
                message: { msgBody: "User not found!", msgError: true }
            });
        }

        // Cập nhật thông tin user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { Dob,userName, gender, phoneNumber, avatar },
            { new: true }
        );

        return res.status(200).json({
            message: { msgBody: "Updated user successfully!", msgError: false },
            user: updatedUser
        });

    } catch (err) {
        return res.status(500).json({ message: 'Lỗi khi cập nhật user', error: err.message });
    }
});



userRouter.post("/updateProfile", async (req, res) => {
    try {
        const { userId, Dob, userName, gender, phoneNumber, avatar, password } = req.body;
        console.log("Received Body:", req.body);

        // Kiểm tra userId có được gửi không
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        // Kiểm tra user có tồn tại không
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(404).json({
                message: { msgBody: "User not found!", msgError: true }
            });
        }

        // Nếu mật khẩu mới được gửi, mã hóa mật khẩu mới
        let hashedPassword = existingUser.password; // Giữ nguyên mật khẩu cũ nếu không thay đổi
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10); // Mã hóa mật khẩu mới
        }

        // Cập nhật thông tin user (bao gồm cả mật khẩu nếu có)
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { Dob, userName, gender, phoneNumber, avatar, password: hashedPassword },
            { new: true }
        );

        return res.status(200).json({
            message: { msgBody: "Updated profile successfully!", msgError: false },
            user: updatedUser
        });

    } catch (err) {
        return res.status(500).json({ message: 'Lỗi khi cập nhật user', error: err.message });
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

        // Trả về thông tin người dùng
        return res.status(200).json({
            message: { msgBody: "User fetched successfully", msgError: false },
            user: {
                id: user._id,
                email: user.email,
                userName: user.userName,
                Dob: user.Dob,
                gender: user.gender,
                phoneNumber: user.phoneNumber,
                avatar: user.avatar,
            },
        });
    } catch (err) {
        return res.status(500).json({ message: "Error fetching user", error: err.message });
    }
});


module.exports = userRouter;
