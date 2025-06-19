const mongoose = require("mongoose");

const AmenityCategorySchema = new mongoose.Schema({
    
    tenNhomTienNghi:{
        type:String,
        require: true,
    },
    icon:{
        type: String,
        default:""
    },
    thuTuNhom:{
        type:Number,
        require: true
    },
    moTa:{
        type:String,
        default:""
    }
});

module.exports = mongoose.model("nhomTienNghi", AmenityCategorySchema);