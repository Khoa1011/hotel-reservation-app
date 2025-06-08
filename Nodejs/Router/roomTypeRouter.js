const express = require('express');
const RoomType = require('../Model/RoomType');
const router = express.Router();

// API to add a new room type
router.post('/add', async (req, res) => {
    const { roomType, price } = req.body;
  
    try {
      // Validate required fields
      if (!roomType || !price) {
        return res.status(400).json({ message: 'Room Type and Price are required.' });
      }
  
      // Check if the room type already exists
      const existingRoomType = await RoomType.findOne({ roomType });
      if (existingRoomType) {
        return res.status(400).json({ message: 'Room type already exists.' });
      }
  
      // Create new RoomType
      const newRoomType = new RoomType({
        roomType,
        price,
      });
  
      // Save to the database
      await newRoomType.save();
      res.status(201).json({ message: 'Room type added successfully', roomType: newRoomType });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

module.exports = router;
