require("dotenv").config();
const express = require("express"); 
const mongoose = require("mongoose");
const path = require("path"); 
const cookieParser = require("cookie-parser");
const upload = require("./config/upload");
const pathUrl = require("./Router/pathUrl");
const app = express();

app.use(express.json());
app.use(cookieParser());
const db = require("./config/key").mongoURI;
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const cors = require("cors");

app.use(cors());

mongoose
    .connect(db,{useNewUrlParser:true,useUnifiedTopology:true})
    .then(() => console.log("✅ MongoDB connected ...."))
    
    .catch((err) => console.log("❌ MongoDB connection error:",err));
    app.use((req, res, next) => {
        console.log("Cookies: ", req.cookies); // Xem cookie có chứa access_token không
        next();
    });

    
// const userRouter = require("./Controller/userController"); 
// app.use("/api/users", userRouter); 
// const hotelRouter = require("./Controller/hotelController");
// app.use("/api/hotels",hotelRouter);
// const bookingRouter = require("./Controller/bookingController");
// app.use("/api/bookings",bookingRouter);
// const roomTypeRouter = require("./Controller/roomTypeController");
// app.use("/api/roomtypes",roomTypeRouter);
// const roomRouter = require("./Controller/roomController");
// app.use("/api/rooms",roomRouter);

pathUrl(app);


const PORT = process.env.PORT || 3000;
app.listen(PORT,console.log(`Server Run With Port ${PORT}`));

