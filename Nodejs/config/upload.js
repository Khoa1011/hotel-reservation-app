const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ Tạo thư mục nếu chưa tồn tại
const createUploadDirs = () => {
    const dirs = ['uploads/hotels', 'uploads/rooms'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Created directory: ${dir}`);
        }
    });
};

createUploadDirs();

// ✅ Storage cho rooms (sử dụng thư mục rooms)
const roomStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/rooms"); // ✅ Sửa: rooms thay vì hotels
    },
    filename: (req, file, cb) => {
        const uniqueName = `room_${Date.now()}_${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// ✅ Storage cho hotels
const hotelStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/hotels");
    },
    filename: (req, file, cb) => {
        const uniqueName = `hotel_${Date.now()}_${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// ✅ File filter - chỉ cho phép ảnh
const fileFilter = (req, file, cb) => {
    console.log("🔍 Checking file:", file.fieldname, file.originalname);
    
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        cb(null, true);
    } else {
        cb(new Error("Chỉ cho phép upload file ảnh (JPEG, PNG, GIF, WebP)"));
    }
};

// ✅ Tạo upload instances
const uploadRoom = multer({
    storage: roomStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: fileFilter
});

const uploadHotel = multer({
    storage: hotelStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: fileFilter
});

// ✅ Export các upload instances
module.exports = {
    uploadRoom,
    uploadHotel,
    upload: uploadHotel // Backward compatibility
};