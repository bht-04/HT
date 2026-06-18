const OrderModel = require("../../models/orderProductModel.js");
const mongoose = require("mongoose");


const revenueChartController = async (req, res) => {
  try {
    const { range = "day" } = req.query;


    let groupId = {};
    switch (range) {
      case "week":
        groupId = {
          year: { $year: "$createdAt" },
          week: { $week: "$createdAt" },
        };
        break;
      case "month":
        groupId = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        };
        break;
      case "year":
        groupId = { year: { $year: "$createdAt" } };
        break;
      default:
        groupId = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        };
    }


    const revenueData = await OrderModel.aggregate([
      { $match: { paymentStatus: "paid" } },
      {
        $group: {
          _id: groupId,
          totalRevenue: { $sum: "$amountTotal" },
          totalOrders: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
          "_id.week": 1,
        },
      },
    ]);


    const revenueByUser = await OrderModel.aggregate([
      { $match: { paymentStatus: "paid" } },
      {
        $group: {
          _id: "$userId",
          totalRevenue: { $sum: "$amountTotal" },
          totalOrders: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          name: "$userInfo.name",
          email: "$userInfo.email",
          totalRevenue: 1,
          totalOrders: 1,
        },
      },
    ]);

    res.json({ success: true, data: revenueData, topUsers: revenueByUser });
  } catch (error) {
    console.error("Lỗi lấy biểu đồ doanh thu:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = revenueChartController;
