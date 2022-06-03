const mongoose = require('mongoose');

const paymentModel = new mongoose.Schema({
    timeStamp: {
        type: Date,
        default: Date.now(),
    },
    user_id: {
        type: String,
    },
    product_id: {
        type: Array
    },
    products: {
        type: Array
    },
    quantity: {
        type: Array
    },
    amount: {
        type: Number
    },
    payment_mode: {
        type: String
    },
    payment_status: {
        type: String,
    },
    order_id: {
        type: String
    },
    order_status: {
        type: String,
    },
    name: {
        type: String,
    },
    phone: {
        type: Number
    },
    country: {
        type: String
    },
    state: {
        type: String
    },
    pincode: {
        type: Number,
    },
    address: {
        type: String
    }
},{
    versionKey : false
})

const Payment = new mongoose.model("paymentDetails", paymentModel); 

module.exports = Payment;