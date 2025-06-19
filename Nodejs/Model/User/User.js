const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");



const UserSchema = new mongoose.Schema({
    tenNguoiDung: {
        type: String,
        default: "",
    },
    ngaySinh: {
        type: String,
        default: () => new Date().toISOString().split('T')[0]
    },
    gioiTinh: {
        type: Boolean,
        default: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,

    },
    matKhau: {
        type: String,
        required: true,
    },
    soDienThoai: {
        type: String,
        default: "",
    },
    vaiTro: {
        type: String,
        default: "nguoiDung"
    },
    ngayTao: {
        type: Date,
        default: Date.now,
    },
    hinhDaiDien: {
        type: String,
        default: ""
    },
    cccd: {
        type: String,
        unique: true,
        sparse: true, // Cho phép nhiều giá trị null hoặc không tồn tại. Nhưng khi có thì phải duy nhất
    },
});

//Mã hóa password
UserSchema.pre("save", function (next) {
    if (!this.isModified("matKhau")) return next();
    bcrypt.hash(this.matKhau, 10, (err, passwordHash) => {
        if (err) return next(err);
        this.matKhau = passwordHash;
        next();
    });
});

UserSchema.method.comparePassword = function (password, cb) {
    bcrypt.compare(password, this.matKhau, (err, isMatch) => {
        if (err) return cb(err);
        else {
            if (!isMatch) return cb(null, isMatch);
            return cb(null, this);
        }
    });
};


module.exports = mongoose.model("nguoiDung", UserSchema);