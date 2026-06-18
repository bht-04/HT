const addToCartModel = require("../../models/cartProduct")

const addToCartController = async (req, res) => {
  try {
    const { productId } = req.body
    const currentUser = req.user

 
    const isProductAvailable = await addToCartModel.findOne({ 
      productId,
      userId: currentUser._id 
    })

    if (isProductAvailable) {
      return res.json({
        message: "Sản phẩm đã có trong giỏ hàng!",
        success: false,
        error: true
      })
    }

    const payload = {
      productId: productId,
      quantity: 1,
      userId: currentUser._id,   
    }

    const newAddToCart = new addToCartModel(payload)
    const saveProduct = await newAddToCart.save()

    return res.json({
      data: saveProduct,
      message: "Đã thêm vào giỏ hàng!",
      success: true,
      error: false
    })
  } catch (err) {
    res.json({
      message: err?.message || err,
      error: true,
      success: false
    })
  }
}

module.exports = addToCartController
