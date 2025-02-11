const express = require('express');
const router = express.Router();
const {isLoggedIn} = require('../middleware');
const Product = require('../models/Product');
const User = require('../models/User');

// router.get('/user/cart' , isLoggedIn , async(req,res)=>{
//     const user = await User.findById(req.user._id).populate('cart');
//     const totalAmount = user.cart.reduce((sum , curr)=> sum+curr.price , 0)
//     const productInfo = user.cart.map((p)=>p.desc).join(',');
//     res.render('user/cart' , {user, totalAmount , productInfo });
// })

// router.post('/cart/remove/:id', async (req, res) => {
//     const userId = req.user._id; // Ensure the user is logged in
//     const productId = req.params.id;

//     try {
//         // Find the user and populate the cart to access product details
//         const user = await User.findById(userId).populate('cart');

//         // Filter out the product to be removed
//         user.cart = user.cart.filter(item => item._id.toString() !== productId);

//         // Save the updated cart
//         await user.save();

//         // Recalculate the total amount
//         const totalAmount = user.cart.reduce((sum, item) => sum + item.price, 0);

//         // Redirect back to the cart page with updated data
//         res.redirect('/user/cart'); // Ensure this route re-renders the cart view with updated data
//     } catch (error) {
//         console.error('Error removing item from cart:', error);
//         res.redirect('/user/cart'); // Redirect back even if an error occurs
//     }
// });

// router.post('/user/:productId/add' , isLoggedIn , async(req,res)=>{
//     let {productId} = req.params;
//     let userId = req.user._id;
//     let product = await Product.findById(productId);
//     let user = await User.findById(userId);
//     user.cart.push(product);
//     await user.save();
//     res.redirect('/user/cart'); 
// })
router.get('/user/cart', isLoggedIn, async (req, res) => {
    const user = await User.findById(req.user._id).populate('cart');
    const totalAmount = user.cart.reduce((sum, curr) => sum + curr.price, 0);
    const productInfo = user.cart.map((p) => p.desc).join(',');
    res.render('cart/cart', { user, totalAmount, productInfo });
});

router.post('/cart/remove/:id', async (req, res) => {
    const userId = req.user._id;
    const productId = req.params.id;

    try {
        const user = await User.findById(userId).populate('cart');
        user.cart = user.cart.filter(item => item._id.toString() !== productId);
        await user.save();
        res.redirect('/user/cart'); // Fixed redirect
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.redirect('/user/cart');
    }
});

router.post('/user/:productId/add', isLoggedIn, async (req, res) => {
    let { productId } = req.params;
    let userId = req.user._id;
    let product = await Product.findById(productId);
    let user = await User.findById(userId);
    user.cart.push(product);
    await user.save();
    res.redirect('/user/cart');
});

module.exports = router;