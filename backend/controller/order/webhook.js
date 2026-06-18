const stripe = require("../../config/stripe");
const orderModel = require("../../models/orderProductModel");
const userModel = require("../../models/userModel");
const cartModel = require("../../models/cartProduct.js");

const endpointSecret = process.env.STRIPE_ENDPOINT_WEBHOOK_SECRET_KEY;

const webhooks = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;

      try {
        const user = await userModel.findOne({ email: session.customer_email });

        await orderModel.create({
          userId: user?._id,
          stripeSessionId: session.id,
          paymentIntentId: session.payment_intent,
          paymentStatus: session.payment_status,
          amountTotal: session.amount_total,
          currency: session.currency,
          products: session.metadata?.cart
            ? JSON.parse(session.metadata.cart)
            : [],
          customerEmail: session.customer_email,
          shippingDetails: session.shipping_details || {},
        });

        if (user) {
          await cartModel.deleteMany({ userId: user._id });
          console.log(`Đã xóa giỏ hàng của user ${user._id} sau thanh toán.`);
        }

        console.log("Đã lưu đơn hàng:", session.id);
      } catch (error) {
        console.error("Lỗi xử lý webhook:", error.message);
      }
      break;
    }

    case "payment_intent.succeeded":
      console.log("PaymentIntent thành công:", event.data.object.id);
      break;

    default:
      console.log(`ℹEvent không xử lý: ${event.type}`);
  }

  res.status(200).send();
};

module.exports = webhooks;
