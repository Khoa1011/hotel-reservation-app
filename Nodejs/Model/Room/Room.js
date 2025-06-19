const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  maLoaiPhong: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "loaiPhong" },
  maKhachsan: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "khachSan" },
  hinhAnh: { type: String, required: true },
  trangThaiPhong: { type: Boolean, default: false },
  moTa: { type: String, required: true },
  soLuongGiuong: { type: Number, required: true },
  soLuongNguoiToiDa: { type: Number, required: true },
  danhSachTienNghi: [{ type: String }],
  tongSoPhong: { type: Number, default: 0 },
  // availableRooms: { type: Number, default: 0 } // Thêm trường mới
});

module.exports = mongoose.model("phong", RoomSchema);
