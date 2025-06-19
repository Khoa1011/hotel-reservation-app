const mongoose = require("mongoose");

const RoomImageSchema = new mongoose.Schema({
    maPhong :{
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

module.exports = mongoose.model("hinhAnhPhong", RoomImageSchema);