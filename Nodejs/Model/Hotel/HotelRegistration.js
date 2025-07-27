const mongoose = require("mongoose");

const HotelRegistrationSchema = new mongoose.Schema({

  maNguoiDung: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "nguoiDung",
    required: true,
    index: true
  },

  maKhachSan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "khachSan",
    default: null
  },

  tenKhachSan: { type: String, required: true },
  loaiKhachSan: {
    type: String,
    enum: ["khachSan", "khuNghiDuong", "nhaNghi", "kyTucXa", "canHo", "bietThu"],
    required: true
  },

  diaChi: {
    soNha: String,
    tenDuong: String,
    phuong: String,
    quan: { type: String, required: true },
    tinhThanh: { type: String, required: true },
    quocGia: { type: String, default: "Việt Nam" }
  },

  hinhAnh: {
    cccdMatTruoc: String,
    cccdMatSau: String,
    giayPhepKinhDoanh: String,
    anhMatTienKhachSan: [String],

  },

  giayTo: {
    giayChungNhanPCCC: String,
    maSoGPKD: {type: String, required: true},
    maSoThue: { type: String, required: true }
  },
  
  trangThai: {
    type: String,
    enum: ["dang_cho_duyet", "da_duyet", "tu_choi", "can_bo_sung", "huy"],
    default: "dang_cho_duyet",
    index: true
  },

  lyDoTuChoi: String,
  ghiChuBoSung: String,

  // ✅ TIMELINE
  ngayDangKy: { type: Date, default: Date.now },
  ngayXuLy: Date,
  ngayDuyet: Date
});

module.exports = mongoose.model("dangKyKhachSan", HotelRegistrationSchema);