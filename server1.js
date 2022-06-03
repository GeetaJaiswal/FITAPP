const express = require('express');
const app = express();
let bodyparser = require("body-parser");
const path = require('path');
const port = process.env.PORT || 5000;
const ejs = require('ejs');
require('./models/db');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');
require('dotenv').config();``
const alert = require('alert');
const session = require('express-session');
var multer = require('multer');
const upload = require('express-fileupload');
const fs = require('fs');


const https = require("https");
const qs = require("querystring");

const checksum_lib = require("./Paytm/checksum");
const config = require("./Paytm/config");

// set ejs views
app.set('view engine', 'ejs');

const parseUrl = express.urlencoded({ extended: false });
const parseJson = express.json({ extended: false });




// middleware
const auth = require('./middleware/auth');
const adminAuth = require('./middleware/admin_auth');


// require models
const User = require('./models/userDataModel');
const Payment = require('./models/paymentModel');
const Admin = require('./models/adminModel');
const Products =  require('./models/products');
const Cart = require('./models/cart');

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

app.get('/', (req, res) => {
    res.render('index', {'cookies': req.cookies.jwt, user: req.session.user});
});


app.get('/login', async (req, res) => {
    try {
        const token = req.cookies.jwt;
        if (token == undefined) {
            res.render('login');
        }
        else {
            const course = await Payment.findOne({ 'email': req.session.email });
            // const userDetails = await User.findOne({ 'email': loginUserEmail });
            if (course == null) {
                res.render('Admin/dashboard', { courses: "na"});
            }
            else {
                res.render('Admin/dashboard', { courses: course.courses });
            }
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
                user: 'geetaverma6653@gmail.com',
                pass: '1234@Abcd#geeta'
            }
        });

        var mailOptions = {
            from: 'geetaverma6653@gmail.com',
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
                    user: 'geetaverma6653@gmail.com',
                    pass: '1234@Abcd#geeta'
                }
            });

            var mailOptions = {
                from: 'geetaverma6653@gmail.com',
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


app.post('/logout', auth, async (req, res) => {
    try {
        const updat = await User.updateOne({ email: req.user.email }, { $set: { tokens: [] } })
        res.clearCookie("jwt");
        req.session.destroy();
        console.log("logout successfully");
        // await req.user.save();
        res.render('login');
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



// ################# shop ############################

app.get('/products', async(req,res)=>{
    try {
        product = await Products.find({}).sort({_id:-1});
        products = await Products.find({}).limit(6).sort({_id:-1});
        res.render('shop/products', {products: product, limitProducts:products});
    }
    catch(e){
        console.log('products '+e);
        res.status(400).send(e);
    }
    
})

app.get('/product/:id', async(req, res) => {
    try {
        product = await Products.find({_id:req.params.id});
        products = await Products.find({});
        res.render('shop/single-product', {product:product, products:products});
    }
    catch(e){
        console.log('products '+e);
        res.status(400).send(e);
    }
})

app.get('/cart', async(req,res)=>{
    try {
        console.log('session'+req.session.sessionEmail, loginUserEmail);
        if(loginUserEmail==undefined) {
            console.log('not login')
            res.render('shop/cart', {cart:'notLogin'});
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
                res.render('shop/cart', {cart:'ok', cartDetails:data, quantity:quantity, subtotal:total});
            }
            else {
                console.log('empty cart');
                res.render('shop/cart', {cart:'emptyCart'});
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
                res.render('shop/checkout', {cartDetails:data, quantity:quantity, subtotal:total});
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


// Admin Dashboard

app.get('/admin/dashboard', adminAuth, (req, res) => {
    adminEmail = req.admin.username;
    res.render('Admin/dashboard', {username:adminEmail});
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

// payment gateway
// app.post('/paynow', [parseUrl, parseJson, auth], (req, res) => {
    // Route for making payment
  
    // var paymentDetails = {
        //  firstname: req.body.firstname,
        //  lastname: req.body.lastname,
        //  email: req.body.email,
        //  phone: req.body.phone,
        //  country: req.body.country,
        //  pincode: req.body.pincode,
        //  address: req.body.address,
        //  amount: '3432.40',
//       amount: req.body.amount,
//       customerId: req.body.name,
//       customerEmail: req.body.email,
//       customerPhone: req.body.phone
//   }
  
//   console.log(paymentDetails);
//   if(!paymentDetails.firstname || !paymentDetails.lastname || !paymentDetails.email || !paymentDetails.phone || !paymentDetails.country || !paymentDetails.pincode || !paymentDetails.address || !paymentDetails.amount) {
//     if(!paymentDetails.amount || !paymentDetails.customerId || !paymentDetails.customerEmail || !paymentDetails.customerPhone) {
//         res.status(400).send('Payment failed')
//   } else {
//       var params = {};
//       params['MID'] = config.PaytmConfig.mid;
//       params['WEBSITE'] = config.PaytmConfig.website;
//       params['CHANNEL_ID'] = 'WEB';
//       params['INDUSTRY_TYPE_ID'] = 'Retail';
//       params['ORDER_ID'] = 'TEST_'  + new Date().getTime();
//     //   params['CUST_ID'] = paymentDetails.customerId;
//       params['CUST_ID'] = paymentDetails.email;
//       params['TXN_AMOUNT'] = paymentDetails.amount;
//       params['CALLBACK_URL'] = 'http://localhost:5000/callback';
//       params['EMAIL'] = paymentDetails.email;
//       params['MOBILE_NO'] = paymentDetails.phone;
  
  
//       checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {
//           var txn_url = "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
//           // var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production
  
//           var form_fields = "";
//           for (var x in params) {
//               form_fields += "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
//           }
//           form_fields += "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";
  
//           res.writeHead(200, { 'Content-Type': 'text/html' });
//           res.write('<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' + txn_url + '" name="f1">' + form_fields + '</form><script type="text/javascript">document.f1.submit();</script></body></html>');
//           res.end();
//       });
//   }
//   });
//   app.post("/callback", (req, res) => {
//     // Route for verifiying payment
  
//     var body = '';
  
//     req.on('data', function (data) {
//        body += data;
//     });
  
//      req.on('end', function () {
//        var html = "";
//        var post_data = qs.parse(body);
  
//        // received params in callback
//        console.log('Callback Response: ', post_data, "\n");
  
  
//        // verify the checksum
//        var checksumhash = post_data.CHECKSUMHASH;
//        // delete post_data.CHECKSUMHASH;
//        var result = checksum_lib.verifychecksum(post_data, config.PaytmConfig.key, checksumhash);
//        console.log("Checksum Result => ", result, "\n");
  
  
//        // Send Server-to-Server request to verify Order Status
//        var params = {"MID": config.PaytmConfig.mid, "ORDERID": post_data.ORDERID};
  
//        checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {
  
//          params.CHECKSUMHASH = checksum;
//          post_data = 'JsonData='+JSON.stringify(params);
  
//          var options = {
//            hostname: 'securegw-stage.paytm.in', // for staging
//            // hostname: 'securegw.paytm.in', // for production
//            port: 443,
//            path: '/merchant-status/getTxnStatus',
//            method: 'POST',
//            headers: {
//              'Content-Type': 'application/x-www-form-urlencoded',
//              'Content-Length': post_data.length
//            }
//          };
  
  
//          // Set up the request
//          var response = "";
//          var post_req = https.request(options, function(post_res) {
//            post_res.on('data', function (chunk) {
//              response += chunk;
//            });
  
//            post_res.on('end', function(){
//              console.log('S2S Response: ', response, "\n");
  
//              var _result = JSON.parse(response);
//              console.log(_result.STATUS);
//                if(_result.STATUS == 'TXN_SUCCESS') {
//                    res.send('payment sucess')
//                }else {
//                    res.send('payment failed')
//                }
//              });
//          });
  
//          // post the data
//          post_req.write(post_data);
//          post_req.end();
//         });
//        });
//   });


  


app.post("/paynow", [parseUrl, parseJson], (req, res) => {
  // Route for making payment

  var paymentDetails = {
    amount: req.body.amount,
    customerId: req.body.name,
    customerEmail: req.body.email,
    customerPhone: req.body.phone
}

console.log(paymentDetails);
if(!paymentDetails.amount || !paymentDetails.customerId || !paymentDetails.customerEmail || !paymentDetails.customerPhone) {
    res.status(400).send('Payment failed')
} else {
    var params = {};
    params['MID'] = config.PaytmConfig.mid;
    params['WEBSITE'] = config.PaytmConfig.website;
    params['CHANNEL_ID'] = 'WEB';
    params['INDUSTRY_TYPE_ID'] = 'Retail';
    params['ORDER_ID'] = 'TEST_'  + new Date().getTime();
    params['CUST_ID'] = paymentDetails.customerId;
    params['TXN_AMOUNT'] = paymentDetails.amount;
    params['CALLBACK_URL'] = 'http://localhost:5000/callback';
    params['EMAIL'] = paymentDetails.customerEmail;
    params['MOBILE_NO'] = paymentDetails.customerPhone;


    checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {
        var txn_url = "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
        // var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production

        var form_fields = "";
        for (var x in params) {
            form_fields += "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
        }
        form_fields += "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' + txn_url + '" name="f1">' + form_fields + '</form><script type="text/javascript">document.f1.submit();</script></body></html>');
        res.end();
    });
}
});
app.post("/callback", (req, res) => {
  // Route for verifiying payment

  var body = '';

  req.on('data', function (data) {
     body += data;
  });

   req.on('end', function () {
     var html = "";
     var post_data = qs.parse(body);

     // received params in callback
     console.log('Callback Response: ', post_data, "\n");


     // verify the checksum
     var checksumhash = post_data.CHECKSUMHASH;
     // delete post_data.CHECKSUMHASH;
     var result = checksum_lib.verifychecksum(post_data, config.PaytmConfig.key, checksumhash);
     console.log("Checksum Result => ", result, "\n");


     // Send Server-to-Server request to verify Order Status
     var params = {"MID": config.PaytmConfig.mid, "ORDERID": post_data.ORDERID};

     checksum_lib.genchecksum(params, config.PaytmConfig.key, function (err, checksum) {

       params.CHECKSUMHASH = checksum;
       post_data = 'JsonData='+JSON.stringify(params);

       var options = {
         hostname: 'securegw-stage.paytm.in', // for staging
         // hostname: 'securegw.paytm.in', // for production
         port: 443,
         path: '/merchant-status/getTxnStatus',
         method: 'POST',
         headers: {
           'Content-Type': 'application/x-www-form-urlencoded',
           'Content-Length': post_data.length
         }
       };


       // Set up the request
       var response = "";
       var post_req = https.request(options, function(post_res) {
         post_res.on('data', function (chunk) {
           response += chunk;
         });
         console.log(response);
         post_res.on('end', function(){
           console.log('S2S Response: ', response, "\n");

           var _result = JSON.parse(response);
             if(_result.STATUS == 'TXN_SUCCESS') {
                 res.send('payment sucess')
             }else {
                 res.send('payment failed')
             }
           });
       });

       // post the data
       post_req.write(post_data);
       post_req.end();
      });
     });
});

app.get('*', (req,res)=>{
    res.render('404');
})

app.listen(port, () => {
    console.log(`Server sucessfully started at http://localhost:${port}`)
})
