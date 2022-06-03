
const express = require('express');
const app = express();
const Router = require('./routes/routes');
app.use(Router);
let bodyparser = require("body-parser");
const path = require('path');
require('dotenv').config();
const port = process.env.PORT || 5000;
const ejs = require('ejs');
require('./models/db');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');
const alert = require('alert');
const session = require('express-session');
var multer = require('multer');
const upload = require('express-fileupload');
const fs = require('fs');


// const https = require("https");
// const qs = require("querystring");

// const checksum_lib = require("./Paytm/checksum");
// const config = require("./Paytm/config");

// set ejs views
app.set('view engine', 'ejs');

// const parseUrl = express.urlencoded({ extended: false });
// const parseJson = express.json({ extended: false });




// middleware
const auth = require('./middleware/auth');
const adminAuth = require('./middleware/admin_auth');


// require models
const User = require('./models/userDataModel');
const Payment = require('./models/paymentModel');
const Admin = require('./models/adminModel');
const Products =  require('./models/products');
const Cart = require('./models/cart');
const Users = require('./models/userDataModel');

//cookie
app.use(cookieParser());
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.use(upload());

// access public
app.use(express.static("public"));
app.use('/css', express.static(__dirname + "public/css"));
app.use('/js', express.static(__dirname + "public/js"));
app.use(express.urlencoded({ extended: true }));


app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: 'XCR3rsasa%RDHHH',
    cookie: {
        maxAge: 24 * 60 * 60 * 1000
    }
}));


app.get('/', async(req, res) => {
    var carttotal=0;
    userData = await User.findOne({email:loginUserEmail});
    if(userData){
        userCart = await Cart.find({user_id:userData._id});
        for(i=0;i<userCart.length;i++){
            carttotal += Number(userCart[i].quantity);
        }
    }
    res.render('index', {'cookies': req.cookies.jwt, user: req.session.user, cartProduct:carttotal});
});


app.get('/login', async (req, res) => {
    try {
        const token = req.cookies.jwt;
        if (token == undefined) {
            res.render('login');
        }
        else {
            product = await Products.find({}).sort({_id:-1});
            var total=0;
            userData = await User.findOne({email:loginUserEmail});
            if(userData){
            registeredUser = userData.name;
            userCart = await Cart.find({user_id:userData._id});
            for(i=0;i<userCart.length;i++){
                total += Number(userCart[i].quantity);
            }
            res.render('shop/products', {products: product, limitProducts:products, cartProduct:total, registeredUser:registeredUser, cookies: req.cookies.jwt});
        }
            products = await Products.find({}).limit(6).sort({_id:-1});
            res.render('shop/products', {limitProducts:products, cookies: req.cookies.jwt, registeredUser:'', cartProduct:0});
            // const course = await Payment.findOne({ 'email': req.session.email });
            // // const userDetails = await User.findOne({ 'email': loginUserEmail });
            // if (course == null) {
            //     res.render('Admin/dashboard', { courses: "na"});
            // }
            // else {
            //     res.render('Admin/dashboard', { courses: course.courses });
            // }
        }
    }
    catch (e) {
        console.log(`error ${e}`);
    }
})

// app.get('/dashboard', auth, async (req, res) => {
//     try {
//         console.log(req.user.email);
//         const email = req.user.email;
//         req.session.email = email;
//         const course = await Payment.findOne({ 'email': email });
//         const userDetails = await User.findOne({ 'email': email });
//         if (course == null) {
//             res.render('Admin/dashboard', { 'users': userDetails, courses: "na"});
//         }
//         else {
//             res.render('Admin/dashboard', { 'users': userDetails, email: email, courses: course.courses });
//         }
//     }
//     catch (e) {
//         console.log(`error ${e}`);
//     }
// })

var userSession;
app.post('/api/register', async (req, res) => {
    try {
        //session
        userSession = req.body.registerEmail;
        const otp = Math.floor(1000 + Math.random() * 9000);
        const userData = new User({
            name: req.body.registerName,
            email: req.body.registerEmail,
            contact: req.body.registerContactno,
            password: req.body.registerPassword,
            gender: req.body.registerGender,
            otp: otp,
        })
        const sUserData = await userData.save();

        // sending mail
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_ID,
                pass: process.env.EMAIL_SECRET_PASS
            }
        });

        var mailOptions = {
            from: process.env.EMAIL_ID,
            to: req.body.registerEmail,
            subject: 'Verification Code',
            html: '<h1>Hi, ' + req.body.registerName + '</h1><p>Your verification code is ' + otp + '</p>',
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
        return res.json({ data: 'ok' })
    }
    catch (e) {
        res.status(400).send(e);
        console.log(e); 
    }
})


app.post('/api/submit/otp', async (req, res) => {
    try {
        const userOtp = req.body.checkOtp;
        const getUser = await User.findOne({ 'email': userSession });
        console.log(getUser);
        if (getUser.otp == userOtp) {
            const otpVerified = await User.updateOne({ 'email': userSession },
                {
                    $set: {
                        isVerified: "true",
                    }
                }
            );
            userSession = "";
            return res.json({ data: 'ok' })
        }
        else {
            res.status(400).send(e);
        }
    }
    catch (e) {
        res.status(400).send(e);
    }
})

var loginUserEmail;
app.post('/api/login', async (req, res) => {
    try {
        const email = req.body.getEmail;
        const password = req.body.getPass;

        const getUser = await User.findOne({ email: email });
        req.session.user =  getUser.name;
       
        if (await bcrypt.compare(password, getUser.password) && getUser.isVerified == "true") {
            const token = await getUser.generateAuthToken();
            res.cookie('jwt', token, { expires: new Date(Date.now() + 60 * 60 * 1000) })
            req.session.user = getUser;
            loginUserEmail = getUser.email;
            // req.session.sessionEmail = getUser.email;
            // console.log(req.session.user, req.session.loginUserEmail);
            return res.json({ data: 'ok' })
        }
        else {
            res.status(400).send(e);
        }
    }
    catch (e) {
        res.status(400).send(e);
    }
})

// var forgetPassEmailSession;
app.post('/api/forget/pass', async (req, res) => {
    try {
        const email = req.body.otpEmail;
        const otp = Math.floor(1000 + Math.random() * 9000);
        //session
        req.session.forgetPassEmailSession = email;
        // forgetPassEmailSession = email;
        console.log(email);

        const getUser = await User.findOneAndUpdate({ email: email }, {
            $set: {
                otp: otp,
                isVerified: "false"
            }
        });
        // const getUser = await User.findOne({ email: email })
        if (getUser) {
            // sending mail
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_ID,
                    pass: process.env.EMAIL_SECRET_PASS
                }
            });

            var mailOptions = {
                from: process.env.EMAIL_ID,
                to: getUser.email,
                subject: 'Verification Code',
                html: '<h1>Hi, ' + getUser.name + '</h1><p>Your verification code is ' + otp + '</p>',
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });

            return res.json({ data: 'ok' })
        }
        else {
            res.status(400).send(e);
        }
    }
    catch (e) {
        res.status(400).send(e);
    }
})


app.post('/api/forget/pass/otp', async (req, res) => {
    try {
        const userOtp = req.body.forgotCheckOtp;
        const getUser = await User.findOne({ 'email': req.session.forgetPassEmailSession });
        if (userOtp == getUser.otp) {
            const up = await User.findOneAndUpdate({ email: req.session.forgetPassEmailSession }, {
                $set: {
                    isVerified: "true"
                }
            })
            // forgetPassEmailSession = " ";
            return res.json({ data: 'ok' })
        }
    }
    catch (e) {
        res.status(400).send(e);
    }
})


app.post('/api/forget/pass/otp/newpass', async (req, res) => {
    try {
        const pass1 = req.body.enterpass;
        const pass2 = req.body.enterpass1;

        if (pass1 == pass2) {
            const getUser = await User.updateOne({ 'email': req.session.forgetPassEmailSession },
                {
                    $set: {
                        password: await bcrypt.hash(pass1, 10),
                    }
                });
            return res.json({ data: 'ok' })
        }
        else {
            res.send(e);
        }
    }
    catch (e) {
        res.status(400).send(e);
    }
})


app.post('/logout', auth, async(req, res) => {
    try {
        const updat = await User.updateOne({ email: req.user.email }, { $set: { tokens: [] } })
        res.clearCookie("jwt");
        req.session.destroy();
        console.log("logout successfully");
        // await req.user.save();
        res.redirect('/products');
    }
    catch (e) {
        res.status(400).send(e);
    }
})


app.post('/payment', auth, async (req, res) => {
    try {
        const email = req.user.email;
        var filter = {
            $and: [
                { email: email },
                { courses: { $elemMatch: { course: req.session.courseName } } }
            ]
        }
        const user = await Payment.findOne(filter);
        if (user) {
            res.json({ data: 'already registered' });
        }
        else {
            var today = new Date();
            var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
            var time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
            var dateTime = date + ' ' + time;

            const courseDetails = await Courses.findOne({ course_name: req.session.courseName })

            const paid = {
                course: req.session.courseName,
                timeStamp: dateTime,
                course_price: courseDetails.course_price,
                batch: courseDetails.course_time,
                course_date: courseDetails.course_date,
            }
            const userDetails = await User.findOne({ email: email })

            const saved = await Payment.updateOne({ email: email }, {
                $set: {
                    student_profile: userDetails.filename,
                    student_name: userDetails.name,
                    student_contact: userDetails.contact
                },
                $push: {
                    courses: paid,
                }
            }, {
                upsert: true
            });

            // console.log(saved);
            res.json({ data: 'ok' });
        }
    }
    catch (e) {
        console.log(`while payment ${e}`);
        res.status(400).send(e);
    }
})


app.post('/editProfile', auth, async (req, res) => {
    try {
        var userEmail = req.user.email;
        var name = req.body.name;
        var contact = req.body.contact;

        if (req.files) {
            console.log(req.files); 
            var file = req.files.file;
            var filename = file.name;
            console.log(filename);

            var ff = filename+Date.now()+path.extname(filename);
            // file.mv('./public/uploads/' + filename+Date.now()+path.extname(file.originalname), async function (err) {
            var f = file.mv('./public/uploads/' + filename+Date.now()+path.extname(filename));
            if (!f) {
                    console.log("err");
                }
                else {
                    const edited = await User.updateOne({ 'email': userEmail }, {
                        $set: {
                            name: name,
                            contact: contact,
                            filename: ff
                        }
                    });
                    const user = await User.findOne({ 'email': userEmail });
                    console.log(user);
                    res.redirect('profile');
                }
            // })
            console.log(ff);
        }
        else {
            const edited = await User.updateOne({ 'email': userEmail }, {
                $set: {
                    name: name,
                    contact: contact,
                }
            });
            res.redirect('profile');
        }
    }
    catch (e) {
        console.log(`error while file upload ${e}`);
    }
})


app.post('/changePassword', auth, async (req, res) => {
    try {
        const oldPassword = req.body.oldPassword;
        const newPassword = req.body.newPassword;
        const confirmPassword = req.body.confirmPassword;
        const user = await User.findOne({ email: req.user.email });
        const compareOld = await bcrypt.compare(oldPassword, user.password);

        if (compareOld) {
            if (newPassword === confirmPassword) {
                const edited = await User.updateOne({ 'email': req.user.email }, {
                    $set: {
                        password: await bcrypt.hash(newPassword, 10)
                    }
                });
                return res.json({ data: 'ok' });

            }
            else {
                res.status(400).send(e);
            }
        }
        else {
            res.status(400).send(e);
        }
    }
    catch (e) {
        console.log(`while changing password ${e}`);
        res.status(400).send(e);
    }
})



// admin


app.get('/admin/student-details', adminAuth, async (req, res) => {
    try {
        const course = await Payment.find({});
        // const studentEmail = course.email;
        // const studentDetails = await User.findOne({email:studentEmail});
        res.render('admin/student_details', { courses: course });
    }
    catch (e) {
        console.log(`while getting student details ${e}`);
        res.status(400).send(e);
    }
})

app.get('/admin/courses', adminAuth, async (req, res) => {
    try {
        const courses = await Courses.find({});
        res.render('admin/courses', { courses: courses });
        // const v = await Courses.find((err,docs) => {
        //     if(!err) {
        //         res.render("admin/courses", {
        //             courses:docs,
        //         })
        //     }
        // })
    }
    catch (e) {
        console.log(`while fetching courses ${e}`);
        res.status(400).send(e);
    }
})

app.get('/admin/add-course', adminAuth, async (req, res) => {
    res.render('admin/add_course');
})

app.get('/admin/update-course/:id', adminAuth, async (req, res) => {
    try {
        const course = await Courses.findById({ _id: req.params.id });
        res.render('admin/update_course', { course: course });
    }
    catch (e) {
        console.log(`while fetching course detail ${e}`);
    }
})

app.post('/admin/add-new-course', adminAuth, async (req, res) => {
    try {
        const name = req.body.courseName;
        const date = req.body.courseDate;
        const time = req.body.courseTime;
        const classes = req.body.courseClasses;
        const price = req.body.coursePrice;
        const description = req.body.courseDescription;
        const overview = req.body.courseOverview;
        const learn = req.body.courseLearn;
        const requirement = req.body.courseRequirement;
        const addedCourse = await Courses.create({
            course_name: name, course_date: date, course_time: time,
            no_of_classes: classes, course_price: price, course_description: description,
            course_overview: overview, course_learn: learn, course_requirement: requirement
        });

        // console.log(date, t);
        if (addedCourse) {
            res.json({ data: 'ok' });
        }
    }
    catch (e) {
        console.log(`while adding course ${e}`);
        res.status(400).send(e);
    }
})


app.get('/admin/course/delete/:id', adminAuth, async (req, res) => {
    try {
        const deleted = await Courses.findByIdAndDelete({ _id: req.params.id });
        // console.log(deleted);
        if (deleted) {
            res.redirect('/admin/courses');
        }
    }
    catch (e) {
        // console.log(`while deleting course ${e}`);
        res.status(400).send(e);
    }
})


app.post('/admin/course/update/:id', adminAuth, async (req, res) => {
    try {
        const name = req.body.course_name;
        const date = req.body.course_date;
        const time = req.body.course_time;
        const course_no = req.body.no_of_classes;
        const price = req.body.course_price;
        const description = req.body.course_description;
        const overview = req.body.course_overview;
        const learn = req.body.course_learn;
        const requirement = req.body.course_requirement;

        const updatedCourse = await Courses.findOneAndUpdate({ _id: req.params.id },
            {
                $set: {
                    course_name: name,
                    course_date: date,
                    course_time: time,
                    no_of_classes: course_no,
                    course_price: price,
                    course_description: description,
                    course_overview: overview,
                    course_learn: learn,
                    course_requirement: requirement,
                },
            });
        if (updatedCourse) {
            res.redirect('/admin/courses');
        }
    }
    catch (e) {
        console.log(`while updating course details ${e}`);
        res.status(400).send(e);
    }
})

// admin login

app.get('/admin/login', (req, res) => {
    const token = req.cookies.admin_token;
        if (token == undefined) {
            res.render('Admin/index');
        }
        else {
            res.render('Admin/dashboard');
        }
});

app.post('/admin/login', async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;
        const getUser = await Admin.findOne({ username: username });
        if(getUser){
            if (await bcrypt.compare(password, getUser.password)) {
                console.log(bcrypt.compare(password, getUser.password));
                const token = await getUser.generateToken();
                // console.log(`the token part is ${token}`);
                res.cookie('admin_token', token, { expires: new Date(Date.now() + 60 * 60 * 1000) })
                return res.json({ data: 'ok' })
            }
            else {
                return res.json({ data: 'notLogin' });
            }
        }
        else {
            return res.json({ data: 'notLogin' });
        }
    }
    catch (e) {
        console.log(`while admin login ${e}`);
        return res.json({ data: 'err' })
    }
})


app.post('/admin/logout', adminAuth, async (req, res) => {
    try {
        const updat = await Admin.updateOne({ username: req.admin.username }, { $set: { tokens: [] } });
        res.clearCookie("admin_token");
        req.session.destroy();
        console.log("logout successfully");
        res.render('Admin/index');
    }
    catch (e) {
        res.status(400).send(e);
    }
})



app.get('/contact', async(req, res)=>{
    var carttotal=0;
    userData = await User.findOne({email:loginUserEmail});
    if(userData){
        userCart = await Cart.find({user_id:userData._id});
        for(i=0;i<userCart.length;i++){
            carttotal += Number(userCart[i].quantity);
        }
    }
    res.render('contact', {'cookies': req.cookies.jwt, user: req.session.user, cartProduct:carttotal});
})


// app.post('/contact', async(req, res)=>{
//     try {
//         d = req.body);
//         apiToken = "5043575686:AAFbYJA6sasdD6XUxZ47D0r3YdRiQ75glXc";
//                 data = [
//                     'chat_id' => '@Angel_prac',
//                     'text' => 'Name: '+ d.name +    
//                               'Email: '+ d.email+"\n"+
//                               'Contact: '+ d.contact+"\n"+
//                               'Message: '+ d.message+"\n"
//                     ];
//                 $response = file_get_contents("https://api.telegram.org/bot$apiToken/sendMessage?".http_build_query($data));	

//     }
//     catch(e) {
//         res.status(400).send(e);
//     }
// })


app.post('/contact', async(req, res) => {
    try {
        data = req.body;
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_ID,
                pass: process.env.EMAIL_SECRET_PASS
            }
        });
        var mailOptions = {
            from: process.env.EMAIL_ID,
            to: process.env.EMAIL_ID,
            subject: 'Query',
            html: '<p>Name:  ' + data.name+ '</p><p>Email:  ' + data.email+ '</p><p>Contact:  ' + data.contact+ '</p><p>Subject:  ' + data.subject+ '</p><p>Message:  ' + data.message+ '</p>'
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        res.json({data:'ok'});
    }
    catch(e) {
        res.status(400).send(e);
    }
})

// ################# shop ############################

app.get('/products', async(req,res)=>{
    try {
        product = await Products.find({}).sort({_id:-1});
        products = await Products.find({}).limit(6).sort({_id:-1});
        var total=0;
        userData = await User.findOne({email:loginUserEmail});
        if(userData){
            registeredUser = userData.name;
            userCart = await Cart.find({user_id:userData._id});
            for(i=0;i<userCart.length;i++){
                total += Number(userCart[i].quantity);
            }
            res.render('shop/products', {products: product, limitProducts:products, cartProduct:total, registeredUser:registeredUser, cookies: req.cookies.jwt});
        }
        else {
            res.render('shop/products', {products: product, limitProducts:products, cartProduct:0, registeredUser:'', cookies: req.cookies.jwt});
        }
    }
    catch(e){
        console.log('products '+e);
        res.status(400).send(e);
    }
    
})

app.get('/product/:id', async(req, res) => {
    try {
        var total=0;
        userData = await User.findOne({email:loginUserEmail});
        product = await Products.find({_id:req.params.id});
        products = await Products.find({});
        if(userData){
            registeredUser = userData.name;
            userCart = await Cart.find({user_id:userData._id});
            for(i=0;i<userCart.length;i++){
                total += Number(userCart[i].quantity);
            }
       
        res.render('shop/single-product', {product:product, products:products, cartProduct:total, registeredUser:registeredUser, cookies: req.cookies.jwt});
        }
        else {
            res.render('shop/single-product', {product:product, products:products, cartProduct:0, registeredUser:'', cookies: req.cookies.jwt});
        }
    }
    catch(e){
        console.log('products '+e);
        res.status(400).send(e);
    }
})

app.get('/cart', async(req,res)=>{
    try {
        var carttotal=0;
        userData = await User.findOne({email:loginUserEmail});
        if(userData){
            registeredUser = userData.name;
            userCart = await Cart.find({user_id:userData._id});
            for(i=0;i<userCart.length;i++){
                carttotal += Number(userCart[i].quantity);
            }
        }
        console.log('session'+req.session.sessionEmail, loginUserEmail);
        console.log(loginUserEmail);
        if((loginUserEmail==undefined)) {
            console.log('not login')
            res.render('shop/cart', {cart:'notLogin', cartProduct:carttotal, registeredUser:'', cookies: req.cookies.jwt});
        }
        else{
            userData = await User.findOne({email:loginUserEmail});
            // userData = await User.findOne({email:'geetaverma1696@gmail.com'});
            userCart = await Cart.find({user_id:userData._id});
            total=0;
            for(i=0;i<userCart.length;i++){
                product = await Products.findOne({_id:userCart[i].product_id});
                total += parseInt(Number(product.regular_price)*Number(userCart[i].quantity));
            }
            var data = []; 
            var quantity = [];
            for(i=0;i<userCart.length;i++){
                data.push(await Products.find({_id:userCart[i].product_id}));
            }
            for(i=0;i<userCart.length;i++){
                quantity.push(userCart[i].quantity);
            }
            if(userCart!=''){
                res.render('shop/cart', {cart:'ok', cartDetails:data, quantity:quantity, subtotal:total, cartProduct:carttotal, registeredUser:registeredUser, cookies: req.cookies.jwt});
            }
            else {
                console.log('empty cart');
                res.render('shop/cart', {cart:'emptyCart', cartProduct:carttotal, registeredUser:'', cookies: req.cookies.jwt});
            }
        }
    }
    catch(e){
        console.log('cart '+e);
        res.status(400).send(e);
    }
})


app.post('/deleteCartItem/', auth, async(req, res) => {
    try {
        var total=0;
        userData = await User.findOne({email:loginUserEmail});
        if(userData){
            userCart = await Cart.find({user_id:userData._id});
            for(i=0;i<userCart.length;i++){
                total += Number(userCart[i].quantity);
            }
        }
        product = await Cart.deleteOne({product_id:req.body.proId});
        res.json({data:'ok'});
    }
    catch(e){
        console.log('deleteCart '+e);
        res.status(400).send(e);
    }
})


app.post('/cartUpdate', async(req, res) => {
    try {
        const cartPro = await Cart.updateOne({ 'product_id':req.body.proId },
        {
            $set: {
                quantity: req.body.quantity,
            }
        });
        userData = await User.findOne({email:loginUserEmail});
        // userData = await User.findOne({email:'geetaverma1696@gmail.com'});
        userCart = await Cart.find({user_id:userData._id});
        total=0;
        for(i=0;i<userCart.length;i++){
            product = await Products.findOne({_id:userCart[i].product_id});
            total += parseInt(Number(product.regular_price)*Number(userCart[i].quantity));
        }
        res.json({data:'ok', subtotal:total});
    }
    catch(e){
        console.log('update cart '+e);
        res.json({data:'err'});
        res.status(400).send(e);
    }
})

app.get('/checkout', auth, async(req,res)=>{
    try {
            var carttotal=0;
            userData = await User.findOne({email:loginUserEmail});
            if(userData){
                registeredUser = userData.name;
                userCart = await Cart.find({user_id:userData._id});
                for(i=0;i<userCart.length;i++){
                    carttotal += Number(userCart[i].quantity);
                }
            }

            userData = await User.findOne({email:loginUserEmail});
            // userData = await User.findOne({email:'geetaverma1696@gmail.com'});
            userCart = await Cart.find({user_id:userData._id});
            total=0;
            for(i=0;i<userCart.length;i++){
                product = await Products.findOne({_id:userCart[i].product_id});
                total += parseInt(Number(product.regular_price)*Number(userCart[i].quantity));
            }
            var data = []; 
            var quantity = [];
            for(i=0;i<userCart.length;i++){
                data.push(await Products.find({_id:userCart[i].product_id}));
            }
            for(i=0;i<userCart.length;i++){
                quantity.push(userCart[i].quantity);
            }
            if(userCart!=''){
                res.render('shop/checkout', {cartDetails:data, quantity:quantity, subtotal:total, userData: userData, cartProduct:carttotal, registeredUser:registeredUser, cookies: req.cookies.jwt});
            }
    }
    catch(e){
        console.log('checkout '+e);
        res.status(400).send(e);
    }
})

app.post('/checkCart', auth, async(req,res)=>{
    try {
        productData = await Cart.findOne({product_id: req.body.productId});
        userData = await User.findOne({email:req.user.email});
        
        if(req.user.email==undefined || req.cookies.jwt==undefined) {
            // console.log('please login');
            res.json({data:'notLogin'});
        }
        else if(productData!=null){
            q = Number(productData.quantity) + Number(req.body.quantity);
            if(req.body.size!=null){
                const quantityUp = await Cart.updateOne({ 'product_id': req.body.productId },
                {
                    $set: {
                        quantity: q,
                        size: req.body.size
                    }
                }
            );
            res.json({data:'updated'});
            }
            else {
                const quantityUp = await Cart.updateOne({ 'product_id': req.body.productId },
                {
                    $set: {
                        quantity: q,
                    }
                }
            );
            res.json({data:'updated'});
            }
        }
        else{
            if(req.body.size!=null) {
                const Data = new Cart({
                    user_id: userData._id,
                    product_id: req.body.productId,
                    quantity: 1,
                    size: req.body.size
                })
                const savedData = await Data.save();
                res.json({data:'ok'});
            }
            else {
                const Data = new Cart({
                    user_id: userData._id,
                    product_id: req.body.productId,
                    quantity: 1,
                })
                const savedData = await Data.save();
                res.json({data:'ok'});
            }
        }
    }
    catch(e){
        console.log('check cart '+e);
        res.json({data:'err'});
        res.status(400).send(e);
    }
})




app.post('/categoryFilter', async(req,res)=>{
    try {
        catName = req.body.category;
        filteredPro = await Products.find({category: catName});
        return res.json({product:filteredPro});
    }
    catch(e){
        console.log('category filter '+e);
        res.json({data:'err'});
        res.status(400).send(e);
    }
})



app.get('/order-tracking', auth, async(req,res)=>{
    var total=0;
        userData = await User.findOne({email:loginUserEmail});
        if(userData){
            userCart = await Cart.find({user_id:userData._id});
            registeredUser = userData.name;
            for(i=0;i<userCart.length;i++){
                total += Number(userCart[i].quantity);
            }
        }
    email = req.user.email;
    userData = await User.findOne({email:req.user.email});
    data = await Payment.find({user_id:userData._id}).sort({_id:-1});
    products = await Products.find({}).limit(3).sort({_id:-1});
    res.render('shop/order_tracking', {data:data, products:products, cartProduct:total, registeredUser:registeredUser, cookies: req.cookies.jwt});
})



app.get('/payment-success', auth, (req,res)=>{
    res.render('shop/payment-success');
})

app.get('/payment-failed', auth, (req,res)=>{
    res.render('shop/payment-failed');
})




// Admin Dashboard

app.get('/admin/dashboard', adminAuth, async(req, res) => {
    totalPay=0; totalSho=0;
    adminEmail = req.admin.username;
    users = await Users.estimatedDocumentCount();
    order = await Payment.find({payment_status:'success'}).estimatedDocumentCount();
    orders = await Payment.find({payment_status:'success'});
    const month = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    current_month = month[new Date().getMonth()];
    current_year = new Date().getFullYear();

    allData = await Payment.find({});
    var Dumbbell=0, Shoes=0, Shirt=0, Watch=0, cat=[], dumbPrice=0, shoePrice=0, shirtPrice=0, watchPrice=0;
    for(var i=0; i<allData.length; i++)
    {
        year = new Date(allData[i].timeStamp);
        getYear = year.getFullYear();
        getMonth =  month[year.getMonth()];
        // console.log(getYear, getMonth);
        if((getYear == current_year) && (getMonth == current_month))
        {
            for(var j=0; j<allData[i].product_id.length; j++)
            {
                proData = await Products.find({_id:allData[i].product_id[j]});
                if(proData[0].category=='Dumbbell'){
                    Dumbbell++;
                    dumbPrice+=proData[0].regular_price;
                }
                else if(proData[0].category=='Shoes'){
                    Shoes++;
                    shoePrice+=proData[0].regular_price;
                }
                else if(proData[0].category=='T-Shirt'){
                    Shirt++;
                    shirtPrice+=proData[0].regular_price;
                }
                else if(proData[0].category=='Watch'){
                    Watch++;
                    watchPrice+=proData[0].regular_price;
                }
            }
        }
    }
    
    balSum = await Payment.aggregate([
        {$match: {}},
        {$group:{_id:"$timeStamp", total:{$sum:"$amount"}}}
    ]);

    for(var i=0;i<orders.length;i++)
    {
        totalPay += orders[i].amount;
    }
    res.render('Admin/dashboard', {username:adminEmail, userCount:users, orders:order, transaction:totalPay, catShirt:Shirt, catShoes:Shoes, catDumbbell:Dumbbell, catWatch: Watch, BalSummary: balSum, dumbPrice:dumbPrice, shoePrice:shoePrice, shirtPrice:shirtPrice, watchPrice:watchPrice });
})

app.get('/admin/orders', adminAuth, async(req, res) => {
    adminEmail = req.admin.username;
    paymentDetails = await Payment.find({}).sort({_id:-1});
    res.render('Admin/orders', {username:adminEmail, payment:paymentDetails});
})

app.get('/admin/users', adminAuth, async(req, res) => {
    adminEmail = req.admin.username;
    users = await Users.find({});
    res.render('Admin/users', {username:adminEmail, users:users});
})

app.post('/admin/changePassword', async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;
        const reTypePass = req.body.reTypePass;
        const user = await Admin.findOne({ username: username });
        if(user){
            if (password === reTypePass) {
                const edited = await Admin.updateOne({ 'username': username }, {
                    $set: {
                        password: await bcrypt.hash(password, 10)
                    }
                });
                if(edited) {
                    return res.json({ data: 'ok' });
                }
                else {
                    return res.json({ data: 'notChange' });
                }
            }
            else {
                return res.json({ data: 'passNotMatch' });
            }
        }
        else {
            return res.json({ data: 'cred' });
        }
    }
    catch (e) {
        console.log(`while changing password ${e}`);
        return res.json({ data: 'err' });
    }
})

app.get('/admin/products', adminAuth, async(req,res) => {
    try {
        adminEmail = req.admin.username;
        products = await Products.find({}).sort({_id:-1});
        res.render('Admin/products', {products:products, username:adminEmail});
    }
    catch(e){
        console.log('Add Product '+e);
        res.json({data:'err'});
        res.status(400).send(e);
    }
})


app.post('/editProduct', async (req, res) => {
    try {
        const productFetchedDetails = await Products.find({ _id: req.body.product_id });
        return res.json({ data: 'ok', d: productFetchedDetails })
    }
    catch (e) {
        return res.json({ error: e });
    }
})



app.post('/addProduct', async(req, res) => {
    product = req.body;
    var imgs = [];
    if (req.files) {
        var file1 = req.files.addRelatedImg;
        Object.keys(file1).map(key => {
            m = file1[key].name;
            var b = /^.+\.([^.]+)$/.exec(m);
		    mImg =  m.substring(0, m.lastIndexOf('.'))+Date.now()+"."+b[1];
            fs.writeFileSync(`./public/uploads/${mImg}`, file1[key].data, ()=>{
                console.log('done');
            });
            imgs.push(mImg);
        })

        var file = req.files.addImage;
        var filename = file.name;
		var b = /^.+\.([^.]+)$/.exec(filename);
		sImg =  filename.substring(0, filename.lastIndexOf('.'))+Date.now()+"."+b[1];
        var f = file.mv('./public/uploads/' + sImg);
        // if (!f) {
        //         console.log("err");
        //     }

        if(product.addShoeSize == ''){
            product.addShoeSize = ''
        }
        if(product.addShirtSize == ''){
            product.addShirtSize = ''
        }
        if(product.addWeight == ''){
            product.addWeight = ''
        }
        if(product.addMaterial == ''){
            product.addMaterial = ''
        }
        if(product.proFeatures == ''){
            product.proFeatures = ''
        }

        const Data = new Products({
            product_name: product.addProductName,
            category: product.category, 
            regular_price: product.addRegularPrice,
            sale_price: product.addSalePrice,
            image: sImg, 
            related_img: imgs,
            stock: product.addStock, 
            shoe_size: product.addShoeSize,
            shirt_size: product.addShirtSize,
            weight: product.addWeight,
            material: product.addMaterial,
            description: product.proDescription,
            features: product.proFeatures,
        })
    
        saved = await Data.save();
        if(saved){
            res.redirect('/admin/products');
        }
    }

    // f1 = "C:\Users/HP/Pictures/Sample Pictures/Chrysanthemum.jpg";
//     f2 = './public/uploads/';

//     var f = path.basename(f1);
//     var source = fs.createReadStream(f1);
//     var dest = fs.createWriteStream(path.resolve(f2, f));
//    source.pipe(dest);
//    source.on('end', function(){
//        console.log('success');
//    })
//    source.on('error', function(err){
//        console.log(err);
//    })

    // var f = file.mv('./public/uploads/' + product.pImage);
    // var f = file.mv('./public/uploads/' + product.relatedImg);
    // if (!f) {
    //     res.json({data:'err'});
    // }
    // else {
            

})


app.post('/deleteProduct', async (req, res) => {
    try {
        const del = await Products.deleteOne({ _id: req.body.product_id });
        return res.json({ data: 'ok' })
    }
    catch (e) {
        return res.json({ error: e });
    }
})

app.post('/admin/editProduct', async(req, res) => {
    try {
        product = req.body;
        imgss = [];
        imgs = [];

        if(req.files) {
                im = req.files.editRelatedImage;
                Object.keys(im).map(key => {
                    m = im[key].name;
                    var b = /^.+\.([^.]+)$/.exec(m);
                    mImg =  m.substring(0, m.lastIndexOf('.'))+Date.now()+"."+b[1];
                    fs.writeFileSync(`./public/uploads/${mImg}`, im[key].data, ()=>{
                        console.log('done');
                    });
                    imgs.push(mImg);
                })
        }
        else {
            imgs = req.editRelatedImage;
        }
        

        if(req.files) {
            var sImg='';
            var file = req.files.editImage;
            if(file){
            console.log(file );
            var filename = file.name;
            var b = /^.+\.([^.]+)$/.exec(filename);
            sImg =  filename.substring(0, filename.lastIndexOf('.'))+Date.now()+"."+b[1];
            var f = file.mv('./public/uploads/' + sImg);
            // if (!f) {
            //         console.log("err");
            //     }
            }
            else {
                sImg = product.editImage;
            }
        }
        
        
        const up = await Products.updateOne({ _id: product.id }, {
            $set: {
                product_name: product.editProductName,
                category: product.editCategory, 
                regular_price: product.editRegularPrice,
                sale_price: product.editSalePrice,
                image: sImg, 
                related_img: imgs,
                stock: product.editStock, 
                shoe_size: product.editShoeSize,
                shirt_size: product.editShirtSize,
                weight: product.editWeight,
                material: product.editMaterial,
                description: product.editDescription,
                features: product.editFeatures
            }
        })
        if(up){
            res.redirect('/admin/products');
        }
    }
    catch(e) {
        console.log(e);
        return res.json({ error: e });
    }
})


app.post('/fetchStatus', async(req, res) => {
    try {
        console.log(req.body);
        data = await Payment.find({_id:req.body.row_id});
        return res.json({data:data});
    }
    catch(e){
        return res.json({ error: e });
    }
})

app.post('/admin/changeDeliveryStatus', async(req, res)=>{
    try{
        console.log(req.body);
        rowId = req.body.row_id;
        delivery_status = req.body.delivery_status;
        const statusChanged = await Payment.updateOne({ '_id': rowId },
                {
                    $set: {
                        order_status: delivery_status,
                    }
                }
        );
        return res.json({ data: 'ok' });
    }
    catch(e){
        return res.json({ error: e });
    }
})





app.get('*', async(req,res)=>{
    var carttotal=0;
    userData = await User.findOne({email:loginUserEmail});
    if(userData){
        registeredUser = userData.name;
        userCart = await Cart.find({user_id:userData._id});
        for(i=0;i<userCart.length;i++){
            carttotal += Number(userCart[i].quantity);
        }
        res.render('404', {cartProduct:carttotal, registeredUser:registeredUser, cookies: req.cookies.jwt});
    }
    else {
        res.render('404', {cartProduct:0, registeredUser:'', cookies: req.cookies.jwt});
    }
})

app.listen(port, () => {
    console.log(`Server sucessfully started at http://localhost:${port}`)
})
