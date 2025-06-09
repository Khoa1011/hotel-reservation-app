// module.exports={
//     mongoURI :"mongodb+srv://thukhoa:thukhoa@training.0ww1v.mongodb.net/?retryWrites=true&w=majority&appName=Training",
// }

module.exports = {
  mongoURI: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET
};