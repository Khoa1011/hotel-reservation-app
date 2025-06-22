
const userRouter = require("../Controller/userController");
const hotelRouter = require("../Controller/hotelController");
const bookingRouter = require("../Controller/bookingController");
const roomTypeRouter = require("../Controller/roomTypeController");
const roomRouter = require("../Controller/roomController");
const amenitiesRouter = require("../Controller/amenitiesController");



module.exports = function (app) {
    app.use("/api/users", userRouter);
    app.use("/api/hotels", hotelRouter);
    app.use("/api/bookings", bookingRouter);
    app.use("/api/roomtypes", roomTypeRouter);
    app.use("/api/rooms", roomRouter);
    app.use("/api/amenities", amenitiesRouter);

    // //Admin
    // app.use("/api/admin", userRouter); 

}