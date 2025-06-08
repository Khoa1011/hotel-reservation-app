const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  roomTypeId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "RoomType" },
  hotelsId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Hotel" },
  image: { type: String, required: true },
  roomState: { type: Boolean, default: false },
  description: { type: String, required: true },
  bedCount: { type: Number, required: true },
  capacity: { type: Number, required: true },
  amenities: [{ type: String }],
  totalRooms: { type: Number, default: 0 },
  availableRooms: { type: Number, default: 0 } // Thêm trường mới
});

module.exports = mongoose.model("Room", RoomSchema);
