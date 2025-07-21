const mongoose = require("mongoose");

const RoomImageSchema = new mongoose.Schema({
    maPhong :{
        type:mongoose.Schema.Types.ObjectId,
        require:true,
        ref: "phong"
    },
    url_anh:{
        type:String,
        default :""
    },
    thuTuAnh:{
        type:Number,
        default: 1
    },
    moTa:{
        type:String,
        default :""
    }

    
},{
    timestamps: true
});
RoomImageSchema.index({ maPhong: 1, thuTuAnh: 1 });

module.exports = mongoose.model("hinhAnhPhong", RoomImageSchema);