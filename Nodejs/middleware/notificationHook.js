/**
 * Middleware để tự động xử lý notifications khi booking được tạo
 * Thêm vào bookingController của bạn
 */
const { handleBookingCreated } = require('../Controller/bookingAutoController');

const notificationHook = (req, res, next) => {
  const originalJson = res.json;

  res.json = function(body) {
    if (req.method === 'POST' && 
        req.url.includes('/addbooking') && 
        body.success === true && 
        body.booking && 
        body.booking._id) {
      
      setImmediate(async () => {
        try {
          await handleBookingCreated(body.booking._id);
        } catch (error) {
          console.error('❌ Notification hook error:', error);
        }
      });
    }

    return originalJson.call(this, body);
  };

  next();
};


module.exports = notificationHook;