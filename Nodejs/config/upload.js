const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ Tạo thư mục nếu chưa tồn tại
const createUploadDirs = () => {
    const dirs = ['uploads', 'uploads/hotels', 'uploads/rooms', 'uploads/temp'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Created directory: ${dir}`);
        }
    });
};

createUploadDirs();

// ✅ Utility function để sanitize folder name
const sanitizeFolderName = (name) => {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .trim();
};

// ✅ Utility function để tạo unique filename
const generateUniqueFilename = (prefix, originalname) => {
    const timestamp = Date.now();
    const randomNum = Math.round(Math.random() * 1E9);
    const ext = path.extname(originalname).toLowerCase();
    const nameWithoutExt = path.basename(originalname, ext);
    
    // Sanitize filename - remove special characters
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    
    return `${prefix}_${timestamp}_${randomNum}_${sanitizedName}${ext}`;
};

// ✅ Enhanced file filter with better validation
const createFileFilter = (allowedTypes = ['jpeg', 'jpg', 'png', 'gif', 'webp']) => {
    return (req, file, cb) => {
        console.log(`🔍 Validating file: ${file.fieldname} - ${file.originalname} (${file.mimetype})`);
        
        // Check file extension
        const ext = path.extname(file.originalname).toLowerCase().slice(1);
        const isValidExt = allowedTypes.includes(ext);
        
        // Check MIME type
        const allowedMimeTypes = allowedTypes.map(type => {
            switch(type) {
                case 'jpg':
                case 'jpeg': return 'image/jpeg';
                case 'png': return 'image/png';
                case 'gif': return 'image/gif';
                case 'webp': return 'image/webp';
                default: return `image/${type}`;
            }
        });
        
        const isValidMime = allowedMimeTypes.includes(file.mimetype);
        
        // Additional security: check if file size is reasonable
        if (file.size && file.size > 10 * 1024 * 1024) { // 10MB max
            return cb(new Error("File quá lớn. Kích thước tối đa 10MB"));
        }
        
        if (isValidExt && isValidMime) {
            console.log(`✅ File accepted: ${file.originalname}`);
            cb(null, true);
        } else {
            const error = new Error(`❌ Chỉ cho phép upload file ảnh (${allowedTypes.join(', ').toUpperCase()}). File hiện tại: ${ext.toUpperCase()}`);
            console.log(`❌ File rejected: ${file.originalname} - ${error.message}`);
            cb(error);
        }
    };
};

// ✅ NEW: Function để tạo folder structure cho room
const createRoomFolderStructure = async (hotelId, roomTypeId) => {
    try {
        const Hotel = require('../Model/Hotel/Hotel');
        const RoomType = require('../Model/RoomType/RoomType');
        
        // Lấy thông tin khách sạn và loại phòng
        const [hotel, roomType] = await Promise.all([
            Hotel.findById(hotelId).select('tenKhachSan'),
            RoomType.findById(roomTypeId).select('tenLoaiPhong')
        ]);
        
        if (!hotel || !roomType) {
            throw new Error('Không tìm thấy khách sạn hoặc loại phòng');
        }
        
        // Sanitize tên folder
        const hotelFolderName = sanitizeFolderName(hotel.tenKhachSan);
        const roomTypeFolderName = sanitizeFolderName(roomType.tenLoaiPhong);
        
        // Tạo đường dẫn: uploads/hotels/TenKhachSan/LoaiPhong
        const hotelPath = path.join('uploads', 'hotels', hotelFolderName);
        const roomTypePath = path.join(hotelPath, roomTypeFolderName);
        
        // Tạo folders nếu chưa tồn tại
        if (!fs.existsSync(hotelPath)) {
            fs.mkdirSync(hotelPath, { recursive: true });
            console.log(`📁 Created hotel directory: ${hotelPath}`);
        }
        
        if (!fs.existsSync(roomTypePath)) {
            fs.mkdirSync(roomTypePath, { recursive: true });
            console.log(`📁 Created room type directory: ${roomTypePath}`);
        }
        
        return {
            hotelPath,
            roomTypePath,
            hotelName: hotel.tenKhachSan,
            roomTypeName: roomType.tenLoaiPhong,
            hotelFolderName,
            roomTypeFolderName
        };
        
    } catch (error) {
        console.error('❌ Error creating room folder structure:', error);
        throw error;
    }
};

// ✅ NEW: Function để tạo folder structure cho hotel
const createHotelFolderStructure = async (hotelName) => {
    try {
        // Sanitize tên folder
        const hotelFolderName = sanitizeFolderName(hotelName);
        
        // Tạo đường dẫn: uploads/hotels/TenKhachSan
        const hotelPath = path.join('uploads', 'hotels', hotelFolderName);
        
        // Tạo folder nếu chưa tồn tại
        if (!fs.existsSync(hotelPath)) {
            fs.mkdirSync(hotelPath, { recursive: true });
            console.log(`📁 Created hotel directory: ${hotelPath}`);
        }
        
        return {
            hotelPath,
            hotelName,
            hotelFolderName
        };
        
    } catch (error) {
        console.error('❌ Error creating hotel folder structure:', error);
        throw error;
    }
};

// ✅ ENHANCED: Storage cho rooms với auto folder creation
const roomStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            const { maLoaiPhong } = req.body;
            
            if (!maLoaiPhong) {
                return cb(new Error("Thiếu thông tin mã loại phòng"));
            }
            
            // Lấy thông tin khách sạn từ roomType
            const RoomType = require('../Model/RoomType/RoomType');
            const roomType = await RoomType.findById(maLoaiPhong).populate('maKhachSan', 'tenKhachSan');
            
            if (!roomType || !roomType.maKhachSan) {
                return cb(new Error("Không tìm thấy thông tin khách sạn"));
            }
            
            // Tạo folder structure
            const folderInfo = await createRoomFolderStructure(
                roomType.maKhachSan._id, 
                maLoaiPhong
            );
            
            console.log(`📁 Room file destination: ${folderInfo.roomTypePath}`);
            console.log(`🏨 Hotel: ${folderInfo.hotelName} | Room Type: ${folderInfo.roomTypeName}`);
            
            // Lưu thông tin folder vào req để dùng sau
            req.folderInfo = folderInfo;
            
            cb(null, folderInfo.roomTypePath);
            
        } catch (error) {
            console.error('❌ Error in room destination:', error);
            // Fallback to default room path
            const fallbackPath = "uploads/rooms";
            if (!fs.existsSync(fallbackPath)) {
                fs.mkdirSync(fallbackPath, { recursive: true });
            }
            cb(null, fallbackPath);
        }
    },
    filename: (req, file, cb) => {
        const uniqueName = generateUniqueFilename('room', file.originalname);
        console.log(`📝 Room filename: ${uniqueName}`);
        cb(null, uniqueName);
    }
});

// ✅ ENHANCED: Storage cho hotels với auto folder creation
const hotelStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            const { tenKhachSan } = req.body;
            
            if (!tenKhachSan) {
                return cb(new Error("Thiếu thông tin tên khách sạn"));
            }
            
            // Tạo folder structure cho hotel
            const folderInfo = await createHotelFolderStructure(tenKhachSan);
            
            console.log(`📁 Hotel file destination: ${folderInfo.hotelPath}`);
            console.log(`🏨 Hotel: ${folderInfo.hotelName}`);
            
            // Lưu thông tin folder vào req để dùng sau
            req.folderInfo = folderInfo;
            
            cb(null, folderInfo.hotelPath);
            
        } catch (error) {
            console.error('❌ Error in hotel destination:', error);
            // Fallback to default hotel path
            const fallbackPath = "uploads/hotels";
            if (!fs.existsSync(fallbackPath)) {
                fs.mkdirSync(fallbackPath, { recursive: true });
            }
            cb(null, fallbackPath);
        }
    },
    filename: (req, file, cb) => {
        const uniqueName = generateUniqueFilename('hotel', file.originalname);
        console.log(`📝 Hotel filename: ${uniqueName}`);
        cb(null, uniqueName);
    }
});

// ✅ Enhanced upload configurations
const uploadRoom = multer({
    storage: roomStorage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 10, // Maximum 10 files
        fieldSize: 2 * 1024 * 1024, // 2MB for text fields
    },
    fileFilter: createFileFilter(['jpeg', 'jpg', 'png', 'webp']), // No GIF for rooms to save space
    onError: (err, next) => {
        console.error("❌ Room upload error:", err);
        next(err);
    }
});

const uploadHotel = multer({
    storage: hotelStorage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file  
        files: 20, // Maximum 20 files for hotels (more images allowed)
        fieldSize: 2 * 1024 * 1024, // 2MB for text fields
    },
    fileFilter: createFileFilter(['jpeg', 'jpg', 'png', 'webp', 'gif']),
    onError: (err, next) => {
        console.error("❌ Hotel upload error:", err);
        next(err);
    }
});

// ✅ Middleware để log upload process với folder info
const logUploadProcess = (req, res, next) => {
    console.log(`🚀 Upload process started: ${req.method} ${req.path}`);
    console.log(`📋 Content-Type: ${req.get('Content-Type')}`);
    
    // Log files after multer processes them
    const originalSend = res.send;
    res.send = function(data) {
        if (req.files) {
            console.log(`📸 Files uploaded:`, req.files.map(f => ({
                fieldname: f.fieldname,
                filename: f.filename,
                size: f.size,
                path: f.path
            })));
            
            // Log folder structure info if available
            if (req.folderInfo) {
                console.log(`📁 Folder structure:`, {
                    hotelName: req.folderInfo.hotelName,
                    roomTypeName: req.folderInfo.roomTypeName || 'N/A',
                    path: req.folderInfo.roomTypePath || req.folderInfo.hotelPath
                });
            }
        }
        originalSend.call(this, data);
    };
    
    next();
};

// ✅ Error handling middleware cho multer
const handleMulterError = (err, req, res, next) => {
    console.error("❌ Multer error:", err);
    
    if (err instanceof multer.MulterError) {
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    success: false,
                    message: "File quá lớn. Kích thước tối đa 10MB",
                    error: err.message
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    message: "Quá nhiều file. Số lượng tối đa cho phép đã bị vượt quá",
                    error: err.message
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    message: "Trường file không được phép",
                    error: err.message
                });
            default:
                return res.status(400).json({
                    success: false,
                    message: "Lỗi upload file",
                    error: err.message
                });
        }
    }
    
    // Other errors (from fileFilter, etc.)
    if (err.message) {
        return res.status(400).json({
            success: false,
            message: err.message,
            error: err.message
        });
    }
    
    next(err);
};

// ✅ Utility function để xóa file
const deleteFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Deleted file: ${filePath}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`❌ Error deleting file ${filePath}:`, error);
        return false;
    }
};

// ✅ Utility function để xóa nhiều files
const deleteFiles = (filePaths) => {
    const results = filePaths.map(deleteFile);
    const deletedCount = results.filter(Boolean).length;
    console.log(`🗑️ Deleted ${deletedCount}/${filePaths.length} files`);
    return deletedCount;
};

// ✅ NEW: Utility function để lấy relative path cho database
const getRelativePath = (fullPath) => {
    // Convert absolute path to relative path for database storage
    const uploadsIndex = fullPath.indexOf('uploads');
    if (uploadsIndex !== -1) {
        return '/' + fullPath.substring(uploadsIndex).replace(/\\/g, '/');
    }
    return fullPath.replace(/\\/g, '/');
};

// ✅ Export everything
module.exports = {
    uploadRoom,
    uploadHotel,
    upload: uploadHotel, // Backward compatibility
    logUploadProcess,
    handleMulterError,
    deleteFile,
    deleteFiles,
    createFileFilter,
    generateUniqueFilename,
    sanitizeFolderName,
    createRoomFolderStructure,
    createHotelFolderStructure,
    getRelativePath
};