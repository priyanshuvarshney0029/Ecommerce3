const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const {isLoggedIn} = require('../middleware');

router.get('/user/orders', isLoggedIn, async (req,res)=>{
    try {
        // Fetch all orders for the logged-in user and populate product details
        const orders = await Order.find({ user: req.user._id }).populate('products.product');

        if (!orders || orders.length === 0) {
            req.flash('error', 'You have no orders.');
            return res.render('purchaseHistory', { orders: [] }); // Render with an empty list
        }
        // Render the orders page with the fetched orders
        res.render('purchaseHistory', { orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect('/');
    }
})

module.exports = router;