const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const Model = new mongoose.Schema({
    username : {
        type: String,
    },
    password: {
        type: String,
    },
    isVerified: {
        type: Boolean,
    },
    otp: {
        type: String,
    },
    tokens: [
        {
            token: {
                type: String
            },
            _id: false
        }
    ],
},{
    versionKey : false
})

Model.methods.generateToken = async function(){   
    try{
        const token = jwt.sign({_id:this._id.toString()}, "process.env.ADMIN_SECRET_KEY");
        this.tokens = this.tokens.concat({token:token})  
        userWithToken = await this.save();
        return token;
    }catch(e){
        console.log(`the error part is ${e}`);
    }
}


const Admin = new mongoose.model("admins", Model); 

module.exports = Admin;