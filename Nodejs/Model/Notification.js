const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  maDatPhong: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'donDatPhong',
    required: true,
    index: true
  },
  maNguoiDung: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'nguoiDung',
    required: true,
    index: true
  },
  loaiThongBao: {
    type: String,
    enum: [
      //Cho người dùng
      'dat_phong_thanh_cong',      // Đặt phòng thành công
      'truoc_nhan_phong_1h',    // Trước checkin 1 tiếng
      'den_gio_nhan_phong',         // Đến giờ checkin
      'tre_nhan_phong_1h',    // Trễ checkin 1 tiếng

      //Cho khách sạn
      'don_dat_moi',
      'thanh_toan_thanh_cong',
      'khach_huy_dat',
      //Cho admin

    ],
    required: true,
    index: true
  },
  tieuDe: {
    type: String,
    required: true
  },
  noiDung: {
    type: String,
    required: true
  },
  duLieu: {
    type: Object,
    default: {}
  },
  danhSachToken: [{
    token: String,
    trangThai: {
      type: String,
      enum: ['da_gui', 'that_bai', 'khong_hop_le_token'],
      default: 'da_gui'
    },
    loi: String
  }],
  henGio: Date,
  thoiGianGui: Date,
  trangThai: {
    type: String,
    enum: ['da_len_lich', 'da_gui', 'that_bai', 'da_huy'],
    default: 'da_len_lich',
    index: true
  },
  tongSoToken: {
    type: Number,
    default: 0
  },
  soThanhCong: {
    type: Number,
    default: 0
  },
  soThatBai: {
    type: Number,
    default: 0
  },
  soLanThu: {
    type: Number,
    default: 0,
    max: 3
  },
  thongTinThem: {
    ngayNhanPhong: Date,
    gioNhanPhong: String,
    tenKhachSan: String,
    loaiPhong: String,
    maBooking: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
NotificationSchema.index({ maDatPhong: 1, loaiThongBao: 1 }, { unique: true });
NotificationSchema.index({ henGio: 1, trangThai: 1 });
NotificationSchema.index({ trangThai: 1, createdAt: -1 });

module.exports = mongoose.model('thongBao', NotificationSchema);