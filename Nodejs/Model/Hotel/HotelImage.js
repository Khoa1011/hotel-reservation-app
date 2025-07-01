const mongoose = require("mongoose");

const HotelImageSchema = new mongoose.Schema({
    maKhachSan :{
        type:mongoose.Schema.Types.ObjectId,
        require:true
    },
    url_anh:{
        type:String,
        default :""
    },
    thuTuAnh:{
        type:Number,
    },
    moTa:{
        type:String,
        default :""
    }
});

module.exports = mongoose.model("hinhAnhKhachSan", HotelImageSchema);