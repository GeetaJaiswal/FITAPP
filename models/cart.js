const mongoose = require('mongoose');

const cartModel = new mongoose.Schema({
    timeStamp: {
        type: Date,
        default: Date.now(),
    },
    product_id: {
        type: String
    },
    quantity: {
        type: Number
    },
    size: {
        type: String
    },
    user_id: {
        type: String
    }
})



const Cart = new mongoose.model("cart", cartModel);

module.exports = Cart;