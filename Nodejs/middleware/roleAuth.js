// middleware/roleAuth.js

const JWT = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "ThuKhoa";

// Middleware kiểm tra token và vai trò
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        const token = req.cookies.access_token;

        if (!token) {
            return res.status(401).json({ message: "Chưa đăng nhập!" });
        }

        try {
            const decoded = JWT.verify(token, JWT_SECRET);
            req.user = {
                id: decoded.sub,
                role: decoded.role,
                email: decoded.email,
            }; // lưu thông tin user vào req để sử dụng sau

            if (!allowedRoles.includes(decoded.role)) {
                return res.status(403).json({ message: "Không có quyền truy cập!" });
            }

            next(); // cho phép truy cập
        } catch (err) {
            return res.status(401).json({ message: "Token không hợp lệ!" });
        }
    };
};

module.exports = authorizeRoles;
