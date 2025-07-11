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
const corsOptions = {
    origin: 'http://localhost:5173', // **RẤT QUAN TRỌNG:** Thay thế bằng origin chính xác của frontend của bạn
    credentials: true, // Cho phép gửi cookie và header Authorization cross-origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Đảm bảo bao gồm OPTIONS cho preflight requests
    allowedHeaders: ['Content-Type', 'Authorization'], // Đảm bảo cho phép các header cần thiết
};
app.use(cors(corsOptions)); // Sử dụng cấu hình CORS đã định nghĩa

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
});
// app.listen(PORT,console.log(`Server Run With Port ${PORT}`));
