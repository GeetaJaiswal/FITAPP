const jwt = require("jsonwebtoken");
const registeredAdmin = require('../models/adminModel');

const adminAuth = async (req,res,next) => {
    try{
        const token = req.cookies.admin_token; 
        // console.log(token);
        const verifiedUser= jwt.verify(token, "process.env.ADMIN_SECRET_KEY");
        // console.log(`verifiedUser ${verifiedUser}`);

        const user = await registeredAdmin.findOne({_id:verifiedUser._id})
        // console.log("user" + user);

        if(!user) {
            throw new error("error while authentication");
        }
        else {
            req.token=token;
            req.admin=user;
            // console.log(req.user);
            next();
        }
    }
    catch(error){
        // console.log("user is not authenticated");
        res.redirect('/admin/login');
    }
}

module.exports = adminAuth;