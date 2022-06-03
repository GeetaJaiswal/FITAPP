const mongoose = require('mongoose');

const productsModel = new mongoose.Schema({
    timeStamp: {
        type: Date,
        default: Date.now(),
    },   
    product_name: {
        type: String,
    },
    regular_price: {
        type: Number,
    },
    sale_price: {
        type: Number,
    },
    description: {
        type: String,
    },
    weight: {
        type: String,
    },
    material: {
        type: String,
    },
    size: {
        type: Array,
    },
    features: {
        type: String,
    },
    image: {
        type: String,
    },
    related_img : {
        type: Array,
    },
    stock: {
        type: Number,
    },
    category: {
        type: String,
    },
    shoe_size: {
        type: Array
    },
    shirt_size: {
        type: Array
    },
})


const Products = new mongoose.model("product", productsModel);

module.exports = Products;