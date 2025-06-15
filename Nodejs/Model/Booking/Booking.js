const mongoose = require("mongoose");
const moment = require("moment");

const BookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User", required: true },
  hotelsId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Hotel", required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Room", required: true },

  cccd: {
    type: String,
    unique: true,
    sparse: true,
  },
  // Sử dụng String để lưu ngày theo định dạng dd-MM-yyyy
  checkInDate: {
    type: String,
    required: true,
    set: (value) => moment(value, "DD-MM-YYYY").format("DD-MM-YYYY"),
  },
  checkOutDate: {
    type: String,
    required: true,
    set: (value) => moment(value, "DD-MM-YYYY").format("DD-MM-YYYY"),
  },

  checkInTime: { type: String, default: "14:00" },
  checkOutTime: { type: String, default: "12:00" },
  totalAmount: { type: Number, required: true },
  // qrCodeUrl: { type: String },
  // qrCodeData: { type: String },
  // transactionId: { type: String },
  status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending" },
  paymentMethod: { type: String, enum: ["CreditCard", "VNPay", "Momo", "cash"], default: "cash" },
  createdAt: {
    type: Date,
    default: Date.now
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'paid' 
  },
  note: {
    type: String,
    default: ""
  }
});



module.exports = mongoose.model("Booking", BookingSchema);
