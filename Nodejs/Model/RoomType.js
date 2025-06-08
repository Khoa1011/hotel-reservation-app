const mongoose = require("mongoose");

const RoomTypeSchema = new mongoose.Schema({
  roomType: { type: String, required: true, unique:true }, // VD: "Phòng đơn", "Phòng đôi"
  price: { type: Number, required: true } // Giá phòng theo loại
});

module.exports = mongoose.model("RoomType", RoomTypeSchema);
