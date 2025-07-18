// middleware/roleAuth.js

const JWT = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "ThuKhoa";

// Middleware kiểm tra token và vai trò
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        let token = req.cookies.token;

        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7); // Loại bỏ "Bearer "
            }
        }

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
            console.log("🔍 User role:", decoded.role); // Debug này
    console.log("🔍 Allowed roles:", allowedRoles); // Debug này
console.log("🔍 Allowed roles:", allowedRoles.includes(decoded.role));
            if (!allowedRoles.includes(decoded.role)) {
                
                return res.status(403).json({ message: "Không có quyền truy cập!" });
            }

            next(); // cho phép truy cập
        } catch (err) {
            return res.status(401).json({ message: "Token không hợp lệ!" });
        }
    };
};

// const authorizeRoles = (...allowedRoles) => {
//     return (req, res, next) => {
//         console.log("🔍 Middleware called, allowed roles:", allowedRoles);
//         console.log("🔍 Request cookies:", req.cookies);
        
//         const token = req.cookies.token;
//         console.log("🔍 Token found:", !!token);

//         if (!token) {
//             console.log("❌ No token in cookies");
//             return res.status(401).json({ message: "Chưa đăng nhập!" });
//         }

//         try {
//             const decoded = JWT.verify(token, JWT_SECRET);
//             console.log("🔍 JWT decoded:", decoded);
            
//             const userRole = decoded.role || decoded.vaiTro;
//             console.log("🔍 User role from token:", userRole);
//             console.log("🔍 Allowed roles:", allowedRoles);
//             console.log("🔍 Role check result:", allowedRoles.includes(userRole));

//             req.user = {
//                 id: decoded.sub,
//                 role: decoded.role,
//                 email: decoded.email,
//             };

//             if (!allowedRoles.includes(userRole)) {
//                 console.log("❌ Role not allowed");
//                 return res.status(403).json({ 
//                     message: "Không có quyền truy cập!",
//                     userRole: userRole,
//                     allowedRoles: allowedRoles
//                 });
//             }

//             console.log("✅ Role authorized");
//             next();
//         } catch (err) {
//             console.log("❌ JWT verify error:", err.message);
//             return res.status(401).json({ message: "Token không hợp lệ!" });
//         }
//     };
// };

module.exports = authorizeRoles;
