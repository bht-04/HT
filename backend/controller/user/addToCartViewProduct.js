const addTocartModel = require("../../models/cartProduct");

const addToCartViewProduct = async (req, res) => {
    try {
        const currentUser = req.user;

        const allProduct = await addTocartModel.find({
            userId: currentUser
        }).populate("productId"); 

        res.json({
            data: allProduct,
            success: true,
            error: false
        });
    } catch (err) {
        res.json({
            message: err.message || err,
            error: true,
            success: false
        });
    }
}

module.exports = addToCartViewProduct;
