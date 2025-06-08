const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const JwtStrategy = require("passport-jwt").Strategy;
const User = require("../Model/User");

//authentication with username, password
passport.use(
    new LocalStrategy((username,password,done) =>{
        User.findOne({username},(err,user) => {
            if(err) return done(err);
            if(!user) return done(null, false);
            user.comparePassword(password,(err,isMatch) => {
                if(err) return done(err);
                if(!isMatch) return done(null,false);
                return done(null,user);
            });
        });
    })
);

// const cookiesExtractor = (req) => {
//     let token = null;
//     if(req && req.cookies){
//         token = req.cookies["access_token"];
//     }
//     console.log("Token trong cookie:", token);
//     return token;
// };
const cookiesExtractor = (req) => {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies["access_token"];
    }
    if (!token && req.headers.authorization) {
        console.log("Authorization Header:", req.headers.authorization); // Kiểm tra token
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }
    }
    return token;
};

passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: cookiesExtractor,
            secretOrKey: "ThuKhoa",
        },
        async (payload, done) => { // ✅ Thêm async
            try {
                const user = await User.findById(payload.sub); // ✅ Không dùng callback
                if (user) return done(null, user);
                return done(null, false);
            } catch (err) {
                return done(err, false);
            }
        }
    )
);

