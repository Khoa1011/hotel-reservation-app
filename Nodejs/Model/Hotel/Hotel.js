const mongoose = require("mongoose");

const HotelSchema = new mongoose.Schema({
   maChuKhachSan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "nguoiDung",
  },
    tenKhachSan :{
        type: String,
        default:"",
        required:true,
        trim: true
    },
     diaChi:{
        type: String,
        default:"",
     },
     hinhAnh:{
        type: String,
        default: "",
     },
     thanhPho:{
        type: String,
        default:"",
     },
     moTa:{
        type: String,
        default:"",
     },
     soSao:{
        type:Number,
        default: () => 0.0,
        min:1,
        max:5
     },
     soDienThoai:{
        type:String,
        default: "",
     },
     email:{
        type:String,
        lowercase: true,
        default: ""
     },
     giaCa:{
      type: Number,
      default:0,
     },
     danhSachPhong: [{ 
      type: mongoose.Schema.Types.ObjectId, ref: "phong" 
   }]
});

module.exports = mongoose.model("khachSan",HotelSchema);