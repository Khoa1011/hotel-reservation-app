const mongoose = require("mongoose");

const FavoriteHotelSchema = new mongoose.Schema({
    maNguoiDung: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'nguoiDung',
        required: true
    },
    maKhachSan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'khachSan',
        required: true
    },
    ngayThem: {
        type: Date,
        default: Date.now
    },
    ghiChu: String 
});

FavoriteHotelSchema.index({ maNguoiDung: 1, maKhachSan: 1 }, { unique: true });

module.exports = mongoose.model("khachSanDaLuu", FavoriteHotelSchema);