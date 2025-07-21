const mongoose = require("mongoose");

const RoomTypeSchema = new mongoose.Schema({
  maKhachSan: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "khachSan", 
    required: true
  },
  tenLoaiPhong: { type: String, required: true,
    maxlength: [100, "Tên loại phòng không được quá 100 ký tự"]
   }, // VD: "Phòng đơn", "Phòng đôi"
  giaCa: { type: Number,
    min: [0, "Giá phòng không được âm"]
   }, // Giá phòng theo loại
  moTa: { type: String, default: "" },
  tienNghiDacBiet: [String],
  // tongSoPhong: { type: Number, default: 0 },
});

module.exports = mongoose.model("loaiPhong", RoomTypeSchema);
