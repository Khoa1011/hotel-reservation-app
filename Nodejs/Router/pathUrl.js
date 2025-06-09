
const userRouter = require("../Controller/userController"); 
const hotelRouter = require("../Controller/hotelController");
const bookingRouter = require("../Controller/bookingController");
const roomTypeRouter = require("../Controller/roomTypeController");
const roomRouter = require("../Controller/roomController");



module.exports = function(app){
    app.use("/api/users", userRouter); 
    app.use("/api/hotels",hotelRouter);
    app.use("/api/bookings",bookingRouter);
    app.use("/api/roomtypes",roomTypeRouter);
    app.use("/api/rooms",roomRouter);

    // //Admin
    // app.use("/api/admin", userRouter); 

}