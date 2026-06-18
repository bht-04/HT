const stripe = require("../../config/stripe");
const userModel = require("../../models/userModel");

const paymentController = async (req, res) => {
  try {
    const { cartItems } = req.body;

    const user = await userModel.findOne({ _id: req.user });


    const cartMetadata = cartItems.map((item) => ({
      productId: item.productId._id,
      name: item.productId.productName,
      image: item.productId.productImage?.[0] || "",
      price: item.productId.sellingPrice,
      quantity: item.quantity,
    }));

    const params = {
      submit_type: "pay",
      mode: "payment",
      payment_method_types: ["card"],
      billing_address_collection: "auto",
      shipping_options: [{ shipping_rate: "shr_1RuGgX2XdwRm6UN91p2nzcJT" }],
      customer_email: user.email,
      line_items: cartItems.map((item) => ({
        price_data: {
          currency: "vnd",
          product_data: {
            name: item.productId.productName,
            images: item.productId.productImage,
            metadata: {
              productId: item.productId._id,
            },
          },
          unit_amount: item.productId.sellingPrice,
        },
        adjustable_quantity: { enabled: true, minimum: 1 },
        quantity: item.quantity,
      })),
      success_url: `${process.env.FRONTEND_URL}/thanh-toan-thanh-cong`,
      cancel_url: `${process.env.FRONTEND_URL}/thanh-toan-that-bai`,
      locale: "vi",
      metadata: {
        cart: JSON.stringify(cartMetadata),
      },
    };

    const session = await stripe.checkout.sessions.create(params);

    res.status(303).json({ id: session.id });
  } catch (error) {
    res.json({
      message: error?.message || error,
      error: true,
      success: false,
    });
  }
};

module.exports = paymentController;
