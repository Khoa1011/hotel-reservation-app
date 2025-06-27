const mongoose = require("mongoose");
const moment = require("moment");

const BookingSchema = new mongoose.Schema({
  maNguoiDung: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "nguoiDung", required: true,index: true },
  maKhachSan: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "khachSan", required: true,index: true },
  maPhong: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "phong", default: null,index: true },
  maLoaiPhong: { type: mongoose.Schema.Types.ObjectId, required: true,  ref: "loaiPhong", index: true, index: true },
  cccd: {
        type: String,
        sparse: true,
        validate: {
            validator: function(v) {
                if (!v) return true; // Allow null/undefined
                return /^[0-9]{12}$/.test(v); // 12 digits for Vietnamese CCCD
            },
            message: 'CCCD phải có 12 chữ số'
        }
    },
    
  loaiDatPhong: {
    type: String,
    enum: ["theo_gio", "qua_dem", "dai_ngay"],
    required: [true, "Loại đặt phòng là bắt buộc"],
    index: true
  },

    soLuongPhong: {
    type: Number,
    required: [true, "Số lượng phòng là bắt buộc"],
    min: [1, "Phải đặt ít nhất 1 phòng"],
    max: [10, "Không được đặt quá 10 phòng cùng lúc"],
    default: 1
  },

  ngayNhanPhong: {
    type: Date,
    required: [true, "Ngày nhận phòng là bắt buộc"],
    validate: {
      validator: function(v) {
        return v >= new Date().setHours(0,0,0,0); // Not before today
      },
      message: "Ngày nhận phòng không được trong quá khứ"
    }
  },

  ngayTraPhong: {
    type: Date,
    required: [true, "Ngày trả phòng là bắt buộc"],
    validate: {
      validator: function(v) {
        return v > this.ngayNhanPhong; // Must be after check-in
      },
      message: "Ngày trả phòng phải sau ngày nhận phòng"
    }
  },

  gioNhanPhong: { type: String, default: "14:00" },
  gioTraPhong: { type: String, default: "12:00" },


  trangThai: { type: String, enum: ["Đang chờ", "Đã xác nhận", "Đã nhận phòng", "Đang sử dụng",
      "Quá giờ", "Đã trả phòng", "Đã hủy"], default: "Đang chờ" },
  phuongThucThanhToan: { type: String, enum: ["Thẻ tín dụng", "VNPay", "Momo", "Tiền mặt","ZaloPay",], default: "Tiền mặt" },
  thoiGianTaoDon: {
    type: Date,
    default: Date.now
  },
  trangThaiThanhToan: {
    type: String,
    enum: ['Chưa thanh toán', 'Đã thanh toán','Thanh toán 1 phần','Đã hoàn tiền'],
    default: 'Chưa thanh toán' 
  },
  ghiChu: {
    type: String,
    default: ""
  },
  soDienThoai:{
    type:String,
    default:""
  },

  phongDuocGiao: [{
    soPhong: {
      type: String,
      required: function() { 
        return ["Đã nhận phòng", "Đang sử dụng", "Đã trả phòng"].includes(this.parent().trangThai);
      }
    },
    tang: Number,
    loaiView: String, // "sea_view", "city_view", etc.
    trangThaiPhong: {
      type: String,
      enum: ["assigned", "checked_in", "checked_out", "cleaning", "extended"],
      default: "assigned"
    },
    thoiGianGiaoPhong: {
      type: Date,
      default: Date.now
    },
    thoiGianVaoThucTe: Date,    // Actual check-in time
    thoiGianRaThucTe: Date,     // Actual check-out time
    // nhanVienGiao: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "nguoiDung"
    // },
    // For hourly booking extensions
    // lichSuGiaHan: [{
    //   gioGiaHan: Date,
    //   soGioThem: Number,
    //   phiGiaHan: Number,
    //   nhanVienXuLy: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "nguoiDung"
    //   },
    //   thoiGianGiaHan: {
    //     type: Date,
    //     default: Date.now
    //   }
    // }],
    ghiChuPhong: String
  }],
  
    thongTinGia: {
    
    donGia: {
      type: Number,
      required: [true, "Đơn giá là bắt buộc"],
      min: [0, "Đơn giá không được âm"]
    },
    
    // Units differ by booking type
    soLuongDonVi: {
      type: Number,
      required: [true, "Số lượng đơn vị là bắt buộc"],
      min: [1, "Số lượng đơn vị phải >= 1"]
    },
    
    donVi: {
      type: String,
      enum: ["gio", "dem", "ngay"],
      required: [true, "Đơn vị tính là bắt buộc"]
    },
    
    // Calculated fields
    tongTienPhong: {
      type: Number,
      required: true,
      min: [0, "Tổng tiền phòng không được âm"]
    },
    
    // Additional fees
    phiDichVu: { type: Number, default: 0, min: [0, "Phí dịch vụ không được âm"] },
    thue: { type: Number, default: 0, min: [0, "Thuế không được âm"] },
    giamGia: { type: Number, default: 0, min: [0, "Giảm giá không được âm"] },
    phuPhiGio: { type: Number, default: 0, min: [0, "Phụ phí giờ cao điểm không được âm"] },
    phuPhiCuoiTuan: { type: Number, default: 0, min: [0, "Phụ phí cuối tuần không được âm"] },

    tongDonDat: { 
    type: Number, 
    required: [true, "Tổng tiền là bắt buộc"],
    min: [0, "Tổng tiền không được âm"]
  },
  },
  
});



module.exports = mongoose.model("donDatPhong", BookingSchema);


// chinhSach: {
//     // For hourly bookings
//     gioToiThieu: {
//       type: Number,
//       default: function() { 
//         return this.loaiDatPhong === "theo_gio" ? 2 : 1; 
//       }
//     },
//     giaHanTuDong: {
//       type: Boolean,
//       default: false
//     },
//     phiGiaHan: {
//       type: Number,
//       default: 0
//     },
    
//     // For overnight/long-stay
//     checkInSom: {
//       duocPhep: { type: Boolean, default: true },
//       phiCheckInSom: { type: Number, default: 0 }
//     },
//     checkOutMuon: {
//       duocPhep: { type: Boolean, default: true },
//       phiCheckOutMuon: { type: Number, default: 0 }
//     }
//   },
  
//   // Keep existing guest info fields...
//   cccd: {
//     type: String,
//     required: [true, "CCCD là bắt buộc"],
//     validate: {
//       validator: function(v) {
//         return /^[0-9]{12}$/.test(v);
//       },
//       message: "CCCD phải có 12 chữ số"
//     }
//   }, 