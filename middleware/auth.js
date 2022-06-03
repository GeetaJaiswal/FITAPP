const jwt = require("jsonwebtoken");
const registeredUser = require('../models/userDataModel');

const auth = async (req,res,next) => {
    try{
        const token = req.cookies.jwt; 
        // console.log(token);
        const verifiedUser= jwt.verify(token, "process.env.SECRET_KEY");
        // console.log(`verifiedUser ${verifiedUser}`);

        const user = await registeredUser.findOne({_id:verifiedUser._id})
        // console.log("user" + user);

        if(!user) {
            throw new error("error while authentication");
        }
        else {
            req.token=token;
            req.user=user;
            // console.log(req.user);
            next();
        }
    }
    catch(error){
        // console.log("user is not authenticated");
        res.redirect('/login');
    }
}

module.exports = auth;