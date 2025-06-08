const mongoose = require("mongoose");

const HotelSchema = new mongoose.Schema({
    hotelName :{
        type: String,
        default:"",
        required:true,
        trim: true
    },
     address:{
        type: String,
        default:"",
     },
     image:{
        type: String,
        default: "",
     },
     city:{
        type: String,
        default:"",
     },
     description:{
        type: String,
        default:"",
     },
     star:{
        type:Number,
        default:5,
        min:1,
        max:5
     },
     phoneNumber:{
        type:String,
        default: "",
     },
     email:{
        type:String,
        lowercase: true,
        default: ""
     },
     price:{
      type: Number,
      default:0,
     },
     rooms: [{ 
      type: mongoose.Schema.Types.ObjectId, ref: "Room" 
   }]
});

module.exports = mongoose.model("Hotel",HotelSchema);