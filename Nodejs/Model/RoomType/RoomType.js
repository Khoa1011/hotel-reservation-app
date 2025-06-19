const mongoose = require("mongoose");

const RoomTypeSchema = new mongoose.Schema({
  tenLoaiPhong: { type: String, required: true }, // VD: "Phòng đơn", "Phòng đôi"
  giaCa: { type: Number } // Giá phòng theo loại
});

module.exports = mongoose.model("loaiPhong", RoomTypeSchema);
