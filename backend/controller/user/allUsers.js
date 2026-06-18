const userModel = require("../../models/userModel");

async function allUsers(req, res) {
  try {
    console.log("", req.userId);
    const allUsers = await userModel.find();

    const mappedUsers = allUsers.map((user) => {
      let role = user.role;
      if (role === "ADMIN") role = "Quản Trị Viên";
      else if (role === "GENERAL") role = "Người Dùng";
      return { ...user.toObject(), role };
    });

    res.json({
      message: "Tất cả người dùng",
      data: mappedUsers,
      success: true,
      error: false,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}

module.exports = allUsers;
