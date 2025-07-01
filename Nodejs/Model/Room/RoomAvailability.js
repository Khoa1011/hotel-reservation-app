const mongoose = require("mongoose");

const RoomAvailabilitySchema = new mongoose.Schema({
  maKhachSan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "khachSan",
    required: [true, "Khách sạn là bắt buộc"],
    index: true
  },
  
  maLoaiPhong: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "loaiPhong", 
    required: [true, "Loại phòng là bắt buộc"],
    index: true
  },
  
  ngay: { 
    type: Date, 
    required: [true, "Ngày là bắt buộc"],
    index: true 
  },
  
  // ✅ INVENTORY TRACKING
  tongSoPhong: {
    type: Number,
    required: [true, "Tổng số phòng là bắt buộc"],
    min: [0, "Tổng số phòng không được âm"]
  },
  
  soPhongDaDat: {
    type: Number,
    default: 0,
    min: [0, "Số phòng đã đặt không được âm"]
  },
  
  soPhongBaoTri: {
    type: Number,
    default: 0,
    min: [0, "Số phòng bảo trì không được âm"]
  },
  
  soPhongBlock: {
    type: Number,
    default: 0,
    min: [0, "Số phòng block không được âm"]
  },
  
  soPhongConLai: {
    type: Number,
    default: function() {
      return this.tongSoPhong - this.soPhongDaDat - this.soPhongBaoTri - this.soPhongBlock;
    },
    min: [0, "Số phòng còn lại không được âm"]
  },
  
  // ✅ BOOKING TYPE SUPPORT
  loaiDatPhongHoTro: {
    type: [String],
    enum: ["theo_gio", "qua_dem", "dai_ngay"],
    default: ["qua_dem"]
  },
  
  // ✅ TIME SLOT SUPPORT (for hourly bookings)
  cacKhungGio: [{
    gio: {
      type: String,
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: "Giờ không hợp lệ (HH:MM)"
      }
    },
    soPhongTrong: {
      type: Number,
      min: [0, "Số phòng trống không được âm"]
    },
    cacBookingChiem: [{
      maBooking: { type: mongoose.Schema.Types.ObjectId, ref: "donDatPhong" },
      soPhongChiem: { type: Number, min: 1 }
    }]
  }],
  
  // ✅ BOOKING TRACKING
  cacBookingTrongNgay: [{
    maBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "donDatPhong",
      required: true
    },
    soPhongChiem: {
      type: Number,
      required: true,
      min: [1, "Số phòng chiếm phải >= 1"]
    },
    loaiDatPhong: {
      type: String,
      enum: ["theo_gio", "qua_dem", "dai_ngay"],
      required: true
    },
    thoiGianBatDau: Date,
    thoiGianKetThuc: Date,
    trangThai: {
      type: String,
      enum: ["active", "cancelled", "completed"],
      default: "active"
    }
  }],
  
  // ✅ PRICING: Dynamic pricing per date
  giaTheoNgay: {
    giaGoc: {
      type: Number,
      required: [true, "Giá gốc là bắt buộc"],
      min: [0, "Giá gốc không được âm"]
    },
    
    // Pricing factors
    heSoNgayThuong: {
      type: Number,
      default: 1.0,
      min: [0.1, "Hệ số ngày thường tối thiểu 0.1"]
    },
    
    heSoCuoiTuan: {
      type: Number,
      default: 1.2,
      min: [0.1, "Hệ số cuối tuần tối thiểu 0.1"]
    },
    
    heSoLe: {
      type: Number,
      default: 1.5,
      min: [0.1, "Hệ số ngày lễ tối thiểu 0.1"]
    },
    
    // Final calculated price
    giaHienTai: {
      type: Number,
      required: [true, "Giá hiện tại là bắt buộc"],
      min: [0, "Giá hiện tại không được âm"]
    },
    
    // Override price (manual pricing)
    giaGhiDe: {
      type: Number,
      default: null,
      min: [0, "Giá ghi đè không được âm"]
    },
    
    // ✅ NEW: Pricing for different booking types
    giaTheoGio: {
      type: Number,
      min: [0, "Giá theo giờ không được âm"]
    },
    
    giaTheoNgayDai: {
      type: Number,
      min: [0, "Giá theo ngày dài không được âm"]
    }
  },
  
  // ✅ AVAILABILITY STATUS
  trangThai: {
    type: String,
    enum: ["available", "sold_out", "maintenance", "blocked", "seasonal_closed"],
    default: "available",
    index: true
  },
  
  // ✅ SPECIAL CONDITIONS
  dieuKienDacBiet: {
    gioToiThieu: {
      type: Number,
      default: 2, // For hourly bookings
      min: [1, "Giờ tối thiểu phải >= 1"]
    },
    
    ngayToiThieu: {
      type: Number,
      default: 1, // For long-stay bookings
      min: [1, "Ngày tối thiểu phải >= 1"]
    },
    
    checkInSom: {
      duocPhep: { type: Boolean, default: true },
      phiThem: { type: Number, default: 0, min: 0 }
    },
    
    checkOutMuon: {
      duocPhep: { type: Boolean, default: true },
      phiThem: { type: Number, default: 0, min: 0 }
    },
    
    datTruoc: {
      soGioToiThieu: { type: Number, default: 1 }, // Đặt trước ít nhất 1 giờ
      soNgayToiDa: { type: Number, default: 365 }  // Đặt trước tối đa 365 ngày
    }
  },
  
  // ✅ MAINTENANCE & BLOCKING
  thongTinBaoTri: [{
    lyDo: String,
    thoiGianBatDau: Date,
    thoiGianKetThuc: Date,
    nguoiTao: { type: mongoose.Schema.Types.ObjectId, ref: "nguoiDung" },
    trangThai: {
      type: String,
      enum: ["scheduled", "in_progress", "completed"],
      default: "scheduled"
    }
  }],
  
  thongTinBlock: [{
    lyDo: String,
    loaiBlock: {
      type: String,
      enum: ["event", "renovation", "staff", "other"],
      default: "other"
    },
    thoiGianBatDau: Date,
    thoiGianKetThuc: Date,
    nguoiTao: { type: mongoose.Schema.Types.ObjectId, ref: "nguoiDung" }
  }],
  
  // ✅ METADATA
  ghiChu: {
    type: String,
    default: "",
    maxlength: [500, "Ghi chú không được quá 500 ký tự"]
  },
  
  nguoiTao: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "nguoiDung"
  },
  
  nguoiCapNhat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "nguoiDung"
  },
  
  lanCapNhatCuoi: {
    type: Date,
    default: Date.now
  },
  
  // ✅ STATISTICS
  thongKe: {
    luotXem: { type: Number, default: 0 },
    luotDat: { type: Number, default: 0 },
    doanhThuTrongNgay: { type: Number, default: 0 },
    tyLeLayDat: { // Occupancy rate
      type: Number,
      default: 0,
      min: [0, "Tỷ lệ lấy đặt không được âm"],
      max: [100, "Tỷ lệ lấy đặt không được quá 100%"]
    }
  }
}, {
  timestamps: true,
  versionKey: '__v'
});

// ✅ ESSENTIAL INDEXES
RoomAvailabilitySchema.index(
  { maKhachSan: 1, maLoaiPhong: 1, ngay: 1 }, 
  { unique: true }
);
RoomAvailabilitySchema.index({ ngay: 1, trangThai: 1 });
RoomAvailabilitySchema.index({ maKhachSan: 1, ngay: 1, soPhongConLai: 1 });
RoomAvailabilitySchema.index({ maLoaiPhong: 1, ngay: 1, trangThai: 1 });
RoomAvailabilitySchema.index({ "cacBookingTrongNgay.maBooking": 1 });

module.exports = mongoose.model("lichPhongTrong", RoomAvailabilitySchema);