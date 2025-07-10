const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");


const UserSchema = new mongoose.Schema({
    tenNguoiDung: {
        type: String,
        default: "",
        maxlength: [100, "Tên không được nhập quá 100 ký tự"]
    },
    ngaySinh: {
        type: Date,
        default: null,
        validate: {
            validator: function (v) {
                if (!v) return true; // Allow null
                const today = new Date();
                const age = today.getFullYear() - v.getFullYear();
                return age >= 16 && age <= 100;
            },
            message: 'Tuổi phải từ 16-100'
        }
    },
    gioiTinh: {
        type: Boolean,
        default: true, // true = Nam, false = Nữ
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
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
        enum: ["nguoiDung", "chuKhachSan", "admin", "nhanVienKhachSan"],
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
        sparse: true,
        validate: {
            validator: function (v) {
                if (!v) return true; // Allow null/undefined
                return /^[0-9]{12}$/.test(v); // 12 digits for Vietnamese CCCD
            },
            message: 'CCCD phải có 12 chữ số'
        }
    },
    camTienMat: {
        type: Boolean,
        default: false
    },

    soLanKhongNhanPhong: {
        type: Number,
        default: 0,
        max: 10
    },
    lichSuKhongNhanPhong: [{
        maDonDatPhong: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "donDatPhong"
        },
        thoiGianQuaHan: {
            type: Date,
            default: Date.now
        },
        lyDo: {
            type: String,
            default: "Không nhận phòng đúng giờ"
        }
    }],
    ngayCamDatPhong: {
        type: Date,
        default: null
    },
    trangThaiTaiKhoan: {
        type: String,
        enum: ["hoatDong", "khongHoatDong", "cam"],
        default: "hoatDong"
    },
    viTri: {
        // type: {
        //     type: String,
        //     enum: ['Point'],
        //     required: true,
        //     default: 'Point'
        // },
        // coordinates: {
        //     type: [Number], // [longitude, latitude]
        //     required: true,
        //     validate: {
        //         validator: function(coordinates) {
        //             return coordinates.length === 2 &&
        //                    coordinates[0] >= -180 && coordinates[0] <= 180 && // longitude
        //                    coordinates[1] >= -90 && coordinates[1] <= 90;     // latitude
        //         },
        //         message: 'Tọa độ không hợp lệ!'
        //     }
        // },
        thanhPho: String,
        quan: String,
        phuong: String,
        // tenDuong:String,
        soNha: String,
        quocGia: {
            type: String,
            default: "Việt Nam"
        }
    },

    resetPasswordToken: {
        type: String,
        default: null
    },

    resetPasswordExpires: {
        type: Date,
        default: null
    },

    lanCuoiDangNhap: {
        type: Date,
        default: null
    }
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

UserSchema.methods.comparePassword = function (password, cb) {
    bcrypt.compare(password, this.matKhau, (err, isMatch) => {
        if (err) return cb(err);
        else {
            if (!isMatch) return cb(null, isMatch);
            return cb(null, this);
        }
    });
};


module.exports = mongoose.model("nguoiDung", UserSchema);