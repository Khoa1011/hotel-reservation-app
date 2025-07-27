require("dotenv").config();
const express = require("express"); 
const mongoose = require("mongoose");
const path = require("path"); 
const cookieParser = require("cookie-parser");
const upload = require("./config/upload");
const pathUrl = require("./Router/pathUrl");
const app = express();
const fs = require("fs");
const ngrok = require('ngrok');
const { initializeFirebase } = require('./config/firebase');

initializeFirebase();

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000', 
    'https://db64570085c1.ngrok-free.app',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
];

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
const db = require("./config/key").mongoURI;


// ✅ SỬA: Cải thiện static file serving
app.use('/uploads', (req, res, next) => {
  // Thêm headers cho ngrok
  res.header('ngrok-skip-browser-warning', 'true');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, ngrok-skip-browser-warning');
  
  // Decode URL để xử lý ký tự đặc biệt
  req.url = decodeURIComponent(req.url);
  
  console.log('📁 Static file request:', req.url);
  
  // Kiểm tra file có tồn tại không
  const filePath = path.join(__dirname, 'uploads', req.url);
  if (fs.existsSync(filePath)) {
    console.log('✅ File exists:', filePath);
  } else {
    console.log('❌ File not found:', filePath);
    console.log('📂 Directory contents:', fs.readdirSync(path.dirname(filePath)).slice(0, 5));
  }
  
  next();
});

// ✅ SỬA: Cấu hình static với options tốt hơn
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d', // Cache 1 ngày
  etag: false,
  lastModified: false,
  setHeaders: (res, path) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('ngrok-skip-browser-warning', 'true');
  }
}));

// ✅ THÊM: Route riêng để test images
app.get('/test-image/:path(*)', (req, res) => {
  const imagePath = req.params.path;
  const fullPath = path.join(__dirname, 'uploads', imagePath);
  
  console.log('🧪 Testing image:', {
    requested: imagePath,
    fullPath: fullPath,
    exists: fs.existsSync(fullPath)
  });
  
  if (fs.existsSync(fullPath)) {
    res.sendFile(fullPath);
  } else {
    res.status(404).json({ 
      error: 'Image not found',
      path: imagePath,
      exists: false 
    });
  }
});

const cors = require("cors");

// Cấu hình CORS chi tiết để xử lý yêu cầu cross-origin và credentials

// Cho phép các origin này
// const allowedOrigins = process.env.CORS_ORIGIN.split(',');

const corsOptions = {
    origin: function (origin, callback) {
    
        // Cho phép requests không có origin (mobile apps, postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('🚫 CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Cho phép gửi cookies và credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'ngrok-skip-browser-warning',
        'Cache-Control',
        'Pragma'
    ],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 200, // Hỗ trợ legacy browsers
    preflightContinue: false
};
app.use(cors(corsOptions)); // Sử dụng cấu hình CORS đã định nghĩa

app.options('*', cors(corsOptions));

mongoose
    .connect(db,{useNewUrlParser:true,useUnifiedTopology:true})
    .then(() => console.log("✅ MongoDB connected ...."))
    
    .catch((err) => console.log("❌ MongoDB connection error:",err));
    app.use((req, res, next) => {
        console.log("Cookies: ", req.cookies); // Xem cookie có chứa access_token không
        next();
    });

pathUrl(app);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server Run With Port ${PORT}`);
    console.log('🔥 Firebase initialized and ready');
    console.log('✅ CORS configured for credentials');
});
// app.listen(PORT,console.log(`Server Run With Port ${PORT}`));
