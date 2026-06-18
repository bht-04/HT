const mongoose = require("mongoose");

const orderProductSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    stripeSessionId: String,
    paymentIntentId: String,
    paymentStatus: {
      type: String,
      enum: ["paid", "pending", "failed"],
      default: "pending",
    },
    amountTotal: { type: Number, required: true },
    currency: String,
    products: [
      {
        productId: String,
        name: String,
        image: String,
        price: Number,
        quantity: Number,
      },
    ],
    customerEmail: String,
    shippingDetails: Object,
  },
  { timestamps: true }
);


orderProductSchema.index({ createdAt: 1 });
orderProductSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model("orderProduct", orderProductSchema);
