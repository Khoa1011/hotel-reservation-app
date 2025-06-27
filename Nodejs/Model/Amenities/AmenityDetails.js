const mongoose = require("mongoose");


const AmenityDetails = new mongoose.Schema({
    maPhong :{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref:"phong"
    },
    maTienNghi:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref:"tienNghi"
    },
    soLuong:{
        type:Number,
        default:0
    },
    trangThai:{
        type:Boolean,
        default: true,
    },
    moTa:{
        type:String,
        default:""
    }
});

module.exports= mongoose.model("chiTietTienNghi",AmenityDetails); 