const orderModel = require("../../models/orderProductModel");

async function getUserOrders(req, res) {
  try {
    const userId = req.user._id; 
    const orders = await orderModel
      .find({ userId })
      .sort({ createdAt: -1 });

    res.json({
      message: "Lấy danh sách đơn hàng thành công",
      data: orders,
      error: false,
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Lỗi server",
      data: [],
      error: true,
      success: false,
    });
  }
}

module.exports = {
  getUserOrders,
};
