const userModel = require("../models/userModel");

const uploadProductPermission = async (userId) => {
  try {
    if (!userId) return false;

    const user = await userModel.findById(userId).select("role");
    if (!user) return false;

    return user.role === "ADMIN" || user.role === "Quản Trị Viên";
  } catch (err) {
    return false;
  }
};

module.exports = uploadProductPermission;
