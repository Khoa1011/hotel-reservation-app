const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({

  maLoaiPhong: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "loaiPhong" },
  hinhAnh: { type: String, required: true },
  trangThaiPhong: { type: Boolean, default: false },
  dienTich: Number,
  moTa: { type: String, required: true },
  soLuongGiuong: { type: Number, required: true },
  soLuongNguoiToiDa: { type: Number, required: true },
  cauHinhGiuong: [{
      loaiGiuong: { type: String, enum: ["single", "double", "queen", "king"] },
      soLuong: Number
    }],
  
  cacViewPhong: [{ 
  type: mongoose.Schema.Types.ObjectId, 
  ref: "tamNhinPhong" 
}]
  
});

module.exports = mongoose.model("phong", RoomSchema);
