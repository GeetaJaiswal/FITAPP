const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const validators = require('mongoose-validators');
const bcrypt = require('bcryptjs');

const userModel = new mongoose.Schema({
    timeStamp: {
        type: Date,
        default: Date.now(),
    },
    name: {
        type: String,
        required: true
    },
    email : {
        type: String,
        required: true,
        unique: true,
    },
    contact: {
        type: String,
        required: true,
        validate: [validators.isNumeric()],
        minlength: 10,
        maxlength: 10
    },
    gender: {
        type: String,
        // required: true,
    },
    password: {
        type: String,
        required: true,
        // validate: [validators.isAlphanumeric()],
        minlength: 8
    },
    isVerified: {
        type: String,
        default: false
    },
    otp: {
        type: String,
    },
    filename: {
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
    userType: {
        type: String,
        default: "student",
    }  
},{
    versionKey : false
})

userModel.pre("save", async function(next){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password,10)
    }
    next();
})


userModel.methods.generateAuthToken = async function(){   
    try{
        // console.log(this._id);
        const token = jwt.sign({_id:this._id.toString()}, "process.env.SECRET_KEY");
        this.tokens = this.tokens.concat({token:token})  
        userWithToken = await this.save();
        // console.log(userWithToken);
        // console.log("this is token "+token);
        return token;
    }catch(e){
        console.log(`the error part is ${e}`);
    }
}

const Users = new mongoose.model("userDetails", userModel); 

module.exports = Users;