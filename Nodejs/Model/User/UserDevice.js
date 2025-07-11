const mongoose = require('mongoose');

const UserDeviceSchema = new mongoose.Schema({
 maNguoiDung: {
   type: mongoose.Schema.Types.ObjectId,
   ref: 'nguoiDung',
   required: true,
   index: true
 },
 fcmToken: {
   type: String,
   required: true,
   unique: true
 },
 loaiThietBi: {
   type: String,
   enum: ['android', 'ios', 'web'],
   default: 'android'
 },
 maThietBi: String,
 phienBanApp: String,
 trangThaiHoatDong: {
   type: Boolean,
   default: true
 },
 lanSuDungCuoi: {
   type: Date,
   default: Date.now
 },
 ngayDangKy: {
   type: Date,
   default: Date.now
 }
}, {
 timestamps: true
});

// Index for efficient queries
UserDeviceSchema.index({ maNguoiDung: 1, trangThaiHoatDong: 1 });
UserDeviceSchema.index({ fcmToken: 1 });

module.exports = mongoose.model('thietBiNguoiDung', UserDeviceSchema);