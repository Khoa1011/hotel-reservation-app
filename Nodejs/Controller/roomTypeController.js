const express = require('express');
const RoomType = require('../Model/RoomType/RoomType');
const router = express.Router();

// API to add a new room type
router.post('/add', async (req, res) => {
    const { tenLoaiPhong, giaCa } = req.body;
  
    try {
      // Validate required fields
      if (!tenLoaiPhong || !giaCa) {
        return res.status(400).json({ message: 'Room Type and Price are required.' });
      }
  
      // Check if the room type already exists
      const existingRoomType = await RoomType.findOne({ tenLoaiPhong });
      if (existingRoomType) {
        return res.status(400).json({ message: 'Room type already exists.' });
      }
  
      // Create new RoomType
      const newRoomType = new RoomType({
        tenLoaiPhong,
        giaCa,
      });
  
      // Save to the database
      await newRoomType.save();
      res.status(201).json({ message: 'Room type added successfully', tenLoaiPhong: newRoomType });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

module.exports = router;
