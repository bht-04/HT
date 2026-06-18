const OrderModel = require("../../models/orderProductModel.js");
const mongoose = require("mongoose");

async function getOrdersByUser(req, res) {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        message: "Thiếu userId",
        success: false,
        error: true,
      });
    }


    const orders = await OrderModel.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          paymentStatus: { $regex: "paid", $options: "i" },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          totalAmount: { $sum: "$amountTotal" },
        },
      },
      {
        $project: {
          date: "$_id",
          totalAmount: 1,
          _id: 0,
        },
      },
      { $sort: { date: 1 } },
    ]);

    return res.json({
      success: true,
      error: false,
      data: orders,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Lỗi server",
      success: false,
      error: true,
    });
  }
}

module.exports = getOrdersByUser;
