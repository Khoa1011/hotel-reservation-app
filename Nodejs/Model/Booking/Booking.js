const mongoose = require("mongoose");
const moment = require("moment");

const BookingSchema = new mongoose.Schema({
  maNguoiDung: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "nguoiDung", required: true },
  maKhachSan: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "khachSan", required: true },
  maPhong: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "phong", required: true },

  cccd: {
    type: String,
    unique: true,
    sparse: true,
  },
  // Sử dụng String để lưu ngày theo định dạng dd-MM-yyyy
  ngayNhanPhong: {
    type: String,
    required: true,
    set: (value) => moment(value, "DD-MM-YYYY").format("DD-MM-YYYY"),
  },
  ngayTraPhong: {
    type: String,
    required: true,
    set: (value) => moment(value, "DD-MM-YYYY").format("DD-MM-YYYY"),
  },

  gioNhanPhong: { type: String, default: "14:00" },
  gioTraPhong: { type: String, default: "12:00" },
  tongTien: { type: Number, required: true },
  // qrCodeUrl: { type: String },
  // qrCodeData: { type: String },
  // transactionId: { type: String },
  trangThai: { type: String, enum: ["Đang chờ", "Đã xác nhận", "Đã hủy"], default: "Đang chờ" },
  phuongThucThanhToan: { type: String, enum: ["Thẻ tín dụng", "VNPay", "Momo", "Tiền mặt"], default: "Tiền mặt" },
  thoiGianTaoDon: {
    type: Date,
    default: Date.now
  },
  trangThaiThanhToan: {
    type: String,
    enum: ['Chưa thanh toán', 'Đã thanh toán','Thanh toán 1 phần'],
    default: 'Đã thanh toán' 
  },
  ghiChu: {
    type: String,
    default: ""
  },
  soDienThoai:{
    type:String,
    default:""
  }
});



module.exports = mongoose.model("donDatPhong", BookingSchema);
