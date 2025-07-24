const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({

  maLoaiPhong: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "loaiPhong" },
  soPhong: { 
    type: String, 
    required: true,
    index: true
  },
  tang: { 
    type: Number, 
    default: 1,
    min: 1
  },
  loaiView: {
    type: String,
    enum: ["sea_view", "city_view", "garden_view", "mountain_view", "pool_view", "none"],
    default: "none"
  },
  trangThaiPhong: { 
    type: String,
    enum: [
      "trong",           // Phòng trống, sẵn sàng cho khách
      "dang_su_dung",    // Khách đang ở
      "dang_don_dep",    // Đang dọn dẹp sau khách trả phòng
      "bao_tri",         // Đang bảo trì, sửa chữa
      "khong_kha_dung"   // Không khả dụng (hỏng hóc, ngừng hoạt động)
    ],
    default: "trong"
  },
  dienTich: Number,
  moTa: { type: String, required: true },
  soLuongGiuong: { type: Number, required: true, min: 1 },
  soLuongNguoiToiDa: { type: Number, required: true },
  cauHinhGiuong: [{
      loaiGiuong: { type: String, enum: ["single", "double", "queen", "king"] },
      soLuong: Number
    }],
});

RoomSchema.index({ maLoaiPhong: 1, trangThaiPhong: 1 });
RoomSchema.virtual('hinhAnh', {
    ref: 'hinhAnhPhong',
    localField: '_id',
    foreignField: 'maPhong',
    options: { sort: { thuTuAnh: 1 } } 
});



// Vì maLoaiPhong thuộc về 1 hotel cụ thể
RoomSchema.index({ soPhong: 1, maLoaiPhong: 1 }, { unique: true });

// ✅ THÊM: Virtual để get hotel từ room type
RoomSchema.virtual('maKhachSan', {
  ref: 'loaiPhong',
  localField: 'maLoaiPhong', 
  foreignField: '_id',
  justOne: true
});

// ✅ THÊM: Pre-save middleware để validate unique per hotel
RoomSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('soPhong')) {
    try {
      // Get hotel ID from room type
      const roomType = await mongoose.model('loaiPhong').findById(this.maLoaiPhong);
      if (!roomType) {
        return next(new Error('Loại phòng không tồn tại'));
      }
      
      // Check if room number exists in the same hotel
      const existingRoom = await mongoose.model('phong').findOne({
        soPhong: this.soPhong,
        maLoaiPhong: { 
          $in: await mongoose.model('loaiPhong').distinct('_id', { 
            maKhachSan: roomType.maKhachSan 
          })
        },
        _id: { $ne: this._id } // Exclude current room if updating
      });
      
      if (existingRoom) {
        return next(new Error(`Số phòng ${this.soPhong} đã tồn tại trong khách sạn này`));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// ✅ THÊM: Static method để check unique per hotel
RoomSchema.statics.isRoomNumberAvailable = async function(roomNumber, hotelId, excludeRoomId = null) {
  try {
    // Get all room type IDs for this hotel
    const roomTypeIds = await mongoose.model('loaiPhong').distinct('_id', { 
      maKhachSan: hotelId 
    });
    
    const query = {
      soPhong: roomNumber,
      maLoaiPhong: { $in: roomTypeIds }
    };
    
    if (excludeRoomId) {
      query._id = { $ne: excludeRoomId };
    }
    
    const existingRoom = await this.findOne(query);
    return !existingRoom;
  } catch (error) {
    console.error('Error checking room availability:', error);
    return false;
  }
};

// ✅ THÊM: Instance method để get hotel info
RoomSchema.methods.getHotelInfo = async function() {
  await this.populate({
    path: 'maLoaiPhong',
    populate: {
      path: 'maKhachSan',
      select: 'tenKhachSan diaChi'
    }
  });
  
  return this.maLoaiPhong?.maKhachSan;
};


module.exports = mongoose.model("phong", RoomSchema);
