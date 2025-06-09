const express = require("express");
const multer = require("multer");
const Room = require("../Model/Room/Room");
const RoomType = require("../Model/RoomType/RoomType");
const Hotels = require("../Model/Hotel/Hotel");

const router = express.Router();

// Cấu hình multer để lưu ảnh vào thư mục uploads/rooms
const storage = multer.diskStorage({
    destination: "uploads/rooms/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage: storage });

// API thêm phòng mới
router.post("/add", upload.single("image"), async (req, res) => {
    try {
        const { roomTypeId, hotelsId, roomState, description, bedCount, capacity, amenities, totalRooms } = req.body;

        // Kiểm tra các trường bắt buộc
        if (!roomTypeId || !hotelsId || !description || !bedCount || !capacity || !amenities || !totalRooms) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Kiểm tra loại phòng có tồn tại không
        const roomType = await RoomType.findById(roomTypeId);
        if (!roomType) {
            return res.status(400).json({ message: "Room type not found" });
        }

        // Kiểm tra khách sạn có tồn tại không
        const hotel = await Hotels.findById(hotelsId);
        if (!hotel) {
            return res.status(400).json({ message: "Hotel not found" });
        }

        // Tạo phòng mới
        const newRoom = new Room({
            roomTypeId,
            hotelsId,
            image: req.file ? `/uploads/rooms/${req.file.filename}` : "",
            roomState,
            description,
            bedCount,
            capacity,
            amenities: JSON.parse(amenities), // Đảm bảo amenities là một mảng JSON
            totalRooms
        });

        // Lưu phòng vào database
        await newRoom.save();

        // Thêm phòng vào danh sách phòng của khách sạn
        hotel.rooms.push(newRoom._id);
        await hotel.save();

        res.status(201).json({ message: "Room added successfully", room: newRoom });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
