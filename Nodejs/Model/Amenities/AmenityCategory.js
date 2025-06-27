const mongoose = require("mongoose");

const AmenityCategorySchema = new mongoose.Schema({

     maKhachSan: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "khachSan", 
        required: true
      },
    tenNhomTienNghi:{
        type:String,
        required: true,
    },
    icon:{
        type: String,
        default:""
    },
    thuTuNhom:{
        type:Number,
        required: true
    },
    moTa:{
        type:String,
        default:""
    }
});

module.exports = mongoose.model("nhomTienNghi", AmenityCategorySchema);