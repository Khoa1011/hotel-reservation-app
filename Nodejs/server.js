require("dotenv").config();
const express = require("express"); 
const mongoose = require("mongoose");
const path = require("path"); 
const cookieParser = require("cookie-parser");
const upload = require("./config/upload");
const pathUrl = require("./Router/pathUrl");
const app = express();
const ngrok = require('ngrok');
const { initializeFirebase } = require('./config/firebase');

initializeFirebase();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
const db = require("./config/key").mongoURI;
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const cors = require("cors");

// Cấu hình CORS chi tiết để xử lý yêu cầu cross-origin và credentials

// Cho phép các origin này
const allowedOrigins = process.env.CORS_ORIGIN.split(',');

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
    optionsSuccessStatus: 200 // Hỗ trợ legacy browsers
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
