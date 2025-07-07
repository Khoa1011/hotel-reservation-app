const mongoose = require("mongoose");
const moment = require("moment");

const BookingSchema = new mongoose.Schema({
  maNguoiDung: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "nguoiDung", required: true,index: true },
  maKhachSan: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "khachSan", required: true,index: true },
  maPhong: { type: mongoose.Schema.Types.ObjectId, ref: "phong", default: null,index: true },
  maLoaiPhong: { type: mongoose.Schema.Types.ObjectId, required: true,  ref: "loaiPhong", index: true, index: true },
  
  cccd: {
    type: String,
    validate: {
        validator: function(v) {
            // Chỉ validate khi có giá trị thật sự
            if (!v || v.trim() === '') return true; 
            return /^[0-9]{12}$/.test(v);
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
  },

  gioNhanPhong: { type: String, default: "14:00" },
  gioTraPhong: { type: String, default: "12:00" },


  trangThai: { type: String, enum: ["dang_cho", "da_xac_nhan", "da_nhan_phong", "dang_su_dung",
      "qua_gio", "da_tra_phong", "da_huy", "khong_nhan_phong"], default: "dang_cho" },

  phuongThucThanhToan: 
  { type: String, 
    enum: ["the_tin_dung", "VNPay", "Momo", "tien_mat","ZaloPay",], 
    default: "tien_mat" },

  thoiGianTaoDon: {
    type: Date,
    default: Date.now
  },
  trangThaiThanhToan: {
    type: String,
    enum: ['chua_thanh_toan', 'da_thanh_toan','thanh_toan_mot_phan','da_hoan_tien'],
    default: 'chua_thanh_toan' 
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
        return ["da_nhan_phong", "dang_su_dung", "da_tra_phong"].includes(this.parent().trangThai);
      }
    },
    tang: Number,
    loaiView: String, // "sea_view", "city_view", etc.
    trangThaiPhong: {
      type: String,
      enum: ["da_giao_phong", "da_check-in", "da_check-out", "dang_ve_sinh", "dang_bao_tri"],
      default: "da_giao_phong"
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
  // ✅ HOÀN THIỆN THÔNG TIN THANH TOÁN
  thongTinThanhToan: {
    maDonHang: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    
    // MoMo payment fields
    momoData: {
      orderId: String,
      requestId: String,
      transId: String,
      resultCode: Number,
      message: String,
      localMessage: String,
      amount: Number,
      signature: String,
      extraData: String,
      payType: String,
      responseTime: Date
    },
    
    // VNPay payment fields
    vnpayData: {
      vnp_TxnRef: String,
      vnp_TransactionNo: String,
      vnp_ResponseCode: String,
      vnp_Amount: Number,
      vnp_BankCode: String,
      vnp_BankTranNo: String,
      vnp_CardType: String,
      vnp_PayDate: String,
      vnp_SecureHash: String,
      vnp_TransactionStatus: String
    },
    
    // ZaloPay payment fields
    zaloPayData: {
      app_id: String,
      app_trans_id: String,
      zp_trans_id: String,
      server_time: Number,
      channel: String,
      merchant_user_id: String,
      amount: Number,
      user_fee_amount: Number,
      discount_amount: Number,
      status: Number,
      bank_code: String,
      sub_return_code: Number,
      return_message: String,
      return_code: Number,
      is_processing: Boolean,
      response_time: Date
    },
    
    // Credit card payment
    creditCardData: {
      gatewayProvider: String,
      transactionId: String,
      authorizationCode: String,
      cardLast4: String,
      cardBrand: String,
      responseCode: String,
      responseMessage: String
    },
    
    // ✅ THÔNG TIN THANH TOÁN CƠ BẢN
    thoiGianThanhToan: Date,
    
    // Payment verification
    daXacThuc: {
      type: Boolean,
      default: false
    },
    
    // Webhook data storage
    webhookData: [{
      nguon: String,
      duLieu: mongoose.Schema.Types.Mixed,
      thoiGianNhan: { type: Date, default: Date.now },
      daXuLy: { type: Boolean, default: false }
    }]
  }
}, {
  timestamps: true // Automatically add createdAt and updatedAt
  
});



module.exports = mongoose.model("donDatPhong", BookingSchema);

// ✅ INDEXES FOR PERFORMANCE
BookingSchema.index({ 'thongTinThanhToan.maDonHang': 1 });
BookingSchema.index({ 'thongTinThanhToan.momoData.orderId': 1 });
BookingSchema.index({ 'thongTinThanhToan.vnpayData.vnp_TxnRef': 1 });
BookingSchema.index({ 'thongTinThanhToan.zaloPayData.app_trans_id': 1 });
BookingSchema.index({ 'thongTinThanhToan.zaloPayData.zp_trans_id': 1 });
BookingSchema.index({ trangThaiThanhToan: 1, thoiGianTaoDon: -1 });
BookingSchema.index({ maNguoiDung: 1, trangThai: 1 });
BookingSchema.index({ maKhachSan: 1, ngayNhanPhong: 1 });

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