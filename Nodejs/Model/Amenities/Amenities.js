const mongoose =require ("mongoose");

const AmenitiesSchema = new mongoose.Schema({
    maNhomTienNghi :{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"nhomTienNghi"
    },
    tenTienNghi:{
        type:String,
        required: true,
    },
    icon:{
        type: String,
        default:""
    },
    thuTu:{
        type:Number,
        required: true
    },
    moTa:{
        type:String,
        default:""
    }


});

module.exports = mongoose.model("tienNghi",AmenitiesSchema);