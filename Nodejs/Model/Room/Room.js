const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({

  maLoaiPhong: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "loaiPhong" },
  soPhong: { 
    type: String, 
    required: true,
    unique: true,
    index: true
  },
  tang: { 
    type: Number, 
    default: 1,
    min: 1
  },
  loaiView: {
    type: String,
    enum: ["sea_view", "city_view", "garden_view", "mountain_view", "pool_view", "none"],
    default: "none"
  },
  trangThaiPhong: { type: Boolean, default: false },
  dienTich: Number,
  moTa: { type: String, required: true },
  soLuongGiuong: { type: Number, required: true, min: 1 },
  soLuongNguoiToiDa: { type: Number, required: true },
  cauHinhGiuong: [{
      loaiGiuong: { type: String, enum: ["single", "double", "queen", "king"] },
      soLuong: Number
    }],
});

RoomSchema.index({ maLoaiPhong: 1, trangThaiPhong: 1 });
RoomSchema.virtual('hinhAnh', {
    ref: 'hinhAnhPhong',
    localField: '_id',
    foreignField: 'maPhong',
    options: { sort: { thuTuAnh: 1 } } 
});


module.exports = mongoose.model("phong", RoomSchema);
