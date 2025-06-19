const mongoose =require ("mongoose");

const AmenitiesSchema = new mongoose.Schema({
    maNhomTienNghi :{
        type:mongoose.Schema.Types.ObjectId,
        require:true,
        ref:"nhomTienNghi"
    },
    tenTienNghi:{
        type:String,
        require: true,
    },
    icon:{
        type: String,
        default:""
    },
    thuTu:{
        type:Number,
        require: true
    },
    moTa:{
        type:String,
        default:""
    }


});

module.exports = mongoose.model("tienNghi",AmenitiesSchema);