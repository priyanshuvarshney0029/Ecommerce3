const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const { v4: uuid } = require('uuid');
const User = require('../models/User'); // Replace with the correct path to your User model
const Product = require('../models/Product'); // Replace with the correct path to your Product model
const Order=require('../models/Order')

const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Stripe secret key from environment variables

// Route for checkout with cart items
router.post('/checkout/:user', async (req, res) => {
    try {
        const { user } = req.params;
        const cartItems = req.body.cart; // Cart array sent from the frontend

        // Fetch user details
        const userDetails = await User.findById(user);
        if (!userDetails) {
            return res.status(404).send('User not found');
        }

        // Prepare line items for Stripe
        const lineItems = cartItems.map(item => ({
            price_data: {
                currency: 'inr', // Set currency to INR
                product_data: {
                    name: item.name,
                    images: [item.img], // Product image URL
                },
                unit_amount: item.price * 100, // Convert price to cents/paise
            },
            quantity: item.quantity, // Quantity from the cart
        }));

        // Create a Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            customer_email: userDetails.email, // Add user email
            success_url: 'http://localhost:5000/complete', // Success page
            cancel_url: 'http://localhost:5000/cancel', // Cancel page
        });

        // Redirect to Stripe's checkout page
        res.redirect(session.url);
    } catch (error) {
        console.error('Error during checkout:', error.message);
        res.status(500).send('Something went wrong during checkout');
    }
});

// Route for single product checkout
router.post('/checkout/:userId/:productId', async (req, res) => {
    try {
        const { userId, productId } = req.params;

        // Fetch user and product details
        const userDetails = await User.findById(userId);
        const product = await Product.findById(productId);

        if (!userDetails) {
            return res.status(404).send('User not found');
        }
        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Prepare Stripe line item for the product
        const lineItems = [{
            price_data: {
                currency: 'inr', // Set currency to INR
                product_data: {
                    name: product.name,
                    images: [product.img], // Product image URL
                },
                unit_amount: product.price * 100, // Convert price to cents/paise
            },
            quantity: 1, // Single product purchase
        }];

        // Create a Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            customer_email: userDetails.email, // Add user email
            success_url: 'http://localhost:5000/complete', // Success page
            cancel_url: 'http://localhost:5000/cancel', // Cancel page
        });

        // Redirect to Stripe's checkout page
        res.redirect(session.url);
    } catch (error) {
        console.error('Error during product checkout:', error.message);
        res.status(500).send('Something went wrong during product checkout');
    }
});

// Route for successful payment
router.get('/complete', async(req, res) => {
    const user = await User.findById(req.user._id).populate('cart');
    const cartItems = user.cart;
    if (!cartItems || cartItems.length === 0) {
        req.flash('error', 'Your cart is empty!');
        return res.redirect('/user/cart');
    }

    const totalAmount = cartItems.reduce((sum, item) => sum + item.price, 0);
    try {
        // Find an existing order for the user
        let order = await Order.findOne({ user: req.user._id });

        if (order) {
            // Add new products to the existing order
            cartItems.forEach((item) => {
                const existingProduct = order.products.find(
                    (product) => product.product.toString() === item._id.toString()
                );
                if (existingProduct) {
                    existingProduct.quantity += 1; // Increment quantity if the product already exists
                } else {
                    order.products.push({
                        product: item._id,
                        quantity: 1,
                        price: item.price,
                    });
                }
            });
            order.totalAmount += totalAmount;
        } else {
            // Create a new order if none exists
            order = new Order({
                user: req.user._id,
                products: cartItems.map((item) => ({
                    product: item._id,
                    quantity: 1,
                    price: item.price,
                })),
                totalAmount,
            });
        }

        await order.save();

        // Clear the user's cart after successful payment
        user.cart = [];
        await user.save();

        res.render('paymentsucess');
    } catch (error) {
        console.error('Error creating/updating order:', error);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect('/cart/cart');
    }
    // res.render('paymentsuccess'); // Render the payment success page
});

// Route for failed payment
router.get('/cancel', (req, res) => {
    res.render('paymentfailed'); // Render the payment failed page
});

module.exports = router;
