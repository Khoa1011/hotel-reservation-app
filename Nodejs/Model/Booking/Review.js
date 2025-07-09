const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({

    maDatPhong: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "donDatPhong",
        index: true
    },
    soSao: {
        type: Number,
        min: [1, "Số sao thấp nhất là 1"],
        max: [5, "Số sao cao nhất là 5"],
        default: 5,
    },
    binhLuan: {
        type: String,
        default: ""
    },
    ngayDanhGia: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("danhGia", ReviewSchema);