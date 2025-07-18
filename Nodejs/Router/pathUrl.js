
const userRouter = require("../Controller/userController");
const hotelRouter = require("../Controller/hotelController");
const bookingRouter = require("../Controller/bookingController");
const roomTypeRouter = require("../Controller/roomTypeController");
const roomRouter = require("../Controller/roomController");
const amenitiesRouter = require("../Controller/amenitiesController");
const paymentRouter = require("../Controller/paymentController");
const searchRouter = require("../Controller/searchController");
const { router: bookingAutoRouter } = require("../Controller/bookingAutoController");
const reviewRouter = require("../Controller/reviewController");
const notificationController = require("../Controller/notificationController");
const hotelowner = require("../Controller/Hotel/userHotelController");
const hotelBooking = require("../Controller/Hotel/hotelBookingController"); 



module.exports = function (app) {
    app.use("/api/users", userRouter);
    app.use("/api/hotels", hotelRouter);
    app.use("/api/bookings", bookingRouter);
    app.use("/api/roomtypes", roomTypeRouter);
    app.use("/api/rooms", roomRouter);
    app.use("/api/amenities", amenitiesRouter);
    app.use("/api/payment", paymentRouter);
    app.use("/api/filter", searchRouter);
    app.use("/api/booking-auto", bookingAutoRouter);
    app.use("/api/review", reviewRouter);
    app.use("/api/notification", notificationController);



    //Hotel 
    app.use("/api/user-hotel/", hotelowner);
    app.use("/api/booking-hotel/", hotelBooking);

    // //Admin
    // app.use("/api/admin", userRouter); 

}