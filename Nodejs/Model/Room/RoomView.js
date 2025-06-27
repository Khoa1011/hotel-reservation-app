const mongoose = require("mongoose");

const RoomViewSchema = new mongoose.Schema({
    tenView: { 
    type: String, 
    required: true,
    unique: true
  },
  icon: String,
   moTa: String,
  thuTu: Number,
});

module.exports = mongoose.model("tamNhinPhong", RoomViewSchema);