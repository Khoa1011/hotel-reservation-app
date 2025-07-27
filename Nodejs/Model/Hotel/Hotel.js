const mongoose = require("mongoose");

const HotelSchema = new mongoose.Schema({
   maChuKhachSan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "nguoiDung",
   },
   tenKhachSan: {
      type: String,
      default: "",
      required: true,
      trim: true
   },
   diaChiDayDu: {
      type: String,
      default: function () {
         const diaChi = this.diaChi || {};
         return [
            diaChi.soNha,
            diaChi.tenDuong,
            diaChi.phuong,
            diaChi.quan,
            diaChi.thanhPho,
            diaChi.tinhThanh,
            diaChi.quocGia
         ].filter(Boolean).join(', ');
      }
   },
   diaChi: {
      soNha: String,
      tenDuong: String,
      phuong: String,
      quan: {
         type: String,
         required: [true, "Quận/huyện là bắt buộc"]
      },
      thanhPho: {
         type: String,
         index: true
      },
      tinhThanh: String,
      quocGia: {
         type: String,
         default: "Việt Nam"
      },
      // toaDo: {
      //    lat: { type: Number, min: -90, max: 90 },
      //    lng: { type: Number, min: -180, max: 180 }
      // }
   },
   hinhAnh: {
      type: String,
      default: "",
   },

   moTa: {
      type: String,
      default: "",
   },
   soSao: {
      type: Number,
      default: () => 0.0,
      min: 1,
      max: 5
   },
   soDienThoai: {
      type: String,
      default: "",
   },
   email: {
      type: String,
      lowercase: true,
      default: ""
   },
   giaCa: {
      type: Number,
      default: 0,
   },
   loaiKhachSan: {
      type: String,
      enum: ["khachSan", "khuNghiDuong", "nhaNghi", "kyTucXa", "canHo", "bietThu","homestay"],
      default: "khachSan"
   },
   trangThai:{
      type: String,
      enum: ["hoatDong", "biCam", "ngungKinhDoanh","tamNghi"],
      default: "hoatDong"
   }
});

module.exports = mongoose.model("khachSan", HotelSchema);