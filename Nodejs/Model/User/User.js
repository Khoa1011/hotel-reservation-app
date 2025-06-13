const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");



const UserSchema = new mongoose.Schema({
    userName: {
        type: String,
        default: "",
    },
    DoB: {
        type: String,
        default: () => new Date().toISOString().split('T')[0]
    },
    gender: {
        type: Boolean,
        default: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,

    },
    password: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        default: "",
    },
    role: {
        type: String,
        default: "user"
    },
    createAt: {
        type: Date,
        default: Date.now,
    },
    avatar: {
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
    if (!this.isModified("password")) return next();
    bcrypt.hash(this.password, 10, (err, passwordHash) => {
        if (err) return next(err);
        this.password = passwordHash;
        next();
    });
});

UserSchema.method.comparePassword = function (password, cb) {
    bcrypt.compare(password, this.password, (err, isMatch) => {
        if (err) return cb(err);
        else {
            if (!isMatch) return cb(null, isMatch);
            return cb(null, this);
        }
    });
};


module.exports = mongoose.model("User", UserSchema);